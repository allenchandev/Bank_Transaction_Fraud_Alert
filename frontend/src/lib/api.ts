import {
  Account,
  Customer,
  Transaction,
  Alert,
  AuditLog,
  InvestigationCase,
  NetworkOverview,
  DFSResult,
  BFSResult,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (typeof errorJson.detail === 'string') {
        errorMsg = errorJson.detail;
      } else if (typeof errorJson.detail === 'object' && errorJson.detail.error) {
        errorMsg = errorJson.detail.error;
      } else if (errorJson.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // Keep default errorMsg
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // System Health
  async checkHealth(): Promise<{ status: string; database_engine: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(res);
  },

  // Overview & Graph
  async getOverview(): Promise<NetworkOverview> {
    const res = await fetch(`${API_BASE_URL}/api/investigation/overview`, { cache: 'no-store' });
    return handleResponse<NetworkOverview>(res);
  },

  // Customers & Accounts
  async getCustomers(): Promise<{ customers: Customer[] }> {
    const res = await fetch(`${API_BASE_URL}/api/customers`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async getAccounts(): Promise<{ accounts: Account[] }> {
    const res = await fetch(`${API_BASE_URL}/api/accounts`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async getAccount(accountRef: string): Promise<{
    account: Account;
    limits: {
      daily_limit: number;
      transferred_today: number;
      remaining_today: number;
      per_tx_limit: number;
      monthly_budget: number;
    };
  }> {
    const res = await fetch(`${API_BASE_URL}/api/accounts/${accountRef}`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async getAccountInvestigation(accountRef: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/investigation/accounts/${accountRef}`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async getAllTransactions(
    limit: number = 100,
    txType?: string,
    status?: string
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (txType) query.append('tx_type', txType);
    if (status) query.append('status', status);
    const res = await fetch(`${API_BASE_URL}/api/transactions?${query.toString()}`, {
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async getAccountTransactions(
    accountRef: string,
    limit: number = 50,
    txType?: string
  ): Promise<{ account_ref: string; transactions: Transaction[] }> {
    if (!accountRef) {
      const all = await api.getAllTransactions(limit, txType);
      return { account_ref: '', transactions: all.transactions };
    }
    const query = new URLSearchParams({ limit: limit.toString() });
    if (txType) query.append('tx_type', txType);
    const res = await fetch(`${API_BASE_URL}/api/accounts/${accountRef}/transactions?${query.toString()}`, {
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async updateLimits(
    accountRef: string,
    limits: { daily_transfer_limit?: number; per_tx_limit?: number; monthly_budget?: number }
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/accounts/${accountRef}/limits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(limits),
    });
    return handleResponse(res);
  },

  // Ledger Transactions
  async deposit(
    accountRef: string,
    amount: number,
    description: string = 'Simulated Deposit'
  ): Promise<{ success: boolean; tx_ref: string; new_balance: number }> {
    const res = await fetch(`${API_BASE_URL}/api/accounts/${accountRef}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });
    return handleResponse(res);
  },

  async withdraw(
    accountRef: string,
    amount: number,
    description: string = 'Simulated Withdrawal'
  ): Promise<{ success: boolean; tx_ref: string; new_balance: number }> {
    const res = await fetch(`${API_BASE_URL}/api/accounts/${accountRef}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });
    return handleResponse(res);
  },

  async transfer(
    sourceRef: string,
    destinationAccount: string,
    amount: number,
    description: string,
    idempotencyKey?: string
  ): Promise<{
    success: boolean;
    tx_ref: string;
    amount: number;
    source_new_balance: number;
    dest_new_balance: number;
    alerts_triggered: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/accounts/${sourceRef}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_account: destinationAccount,
        amount,
        description,
        idempotency_key: idempotencyKey,
      }),
    });
    return handleResponse(res);
  },

  // DSA Operations
  async runDFS(): Promise<DFSResult> {
    const res = await fetch(`${API_BASE_URL}/api/investigation/dfs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<DFSResult>(res);
  },

  async runBFS(sourceAccount: string, maxHops: number = 3): Promise<BFSResult> {
    const res = await fetch(`${API_BASE_URL}/api/investigation/bfs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_account: sourceAccount, max_hops: maxHops }),
    });
    return handleResponse<BFSResult>(res);
  },

  // Alerts & Rules
  async getAlerts(
    accountRef?: string,
    status?: string,
    severity?: string
  ): Promise<{ alerts: Alert[]; total: number }> {
    const params = new URLSearchParams();
    if (accountRef) params.append('account_ref', accountRef);
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);

    const res = await fetch(`${API_BASE_URL}/api/alerts?${params.toString()}`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async updateAlertStatus(alertId: string | number, status: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Administration
  async freezeAccount(accountRef: string, reason: string): Promise<{ success: boolean; status: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${accountRef}/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, analyst_actor: 'Lead Fraud Analyst' }),
    });
    return handleResponse(res);
  },

  async unfreezeAccount(accountRef: string, reason: string): Promise<{ success: boolean; status: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${accountRef}/unfreeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, analyst_actor: 'Lead Fraud Analyst' }),
    });
    return handleResponse(res);
  },

  async getAuditLogs(limit: number = 100): Promise<{ audit_logs: AuditLog[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs?limit=${limit}`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async getCases(): Promise<{ cases: InvestigationCase[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/cases`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async updateCaseStatus(caseId: string | number, status: string, notes?: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/cases/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(res);
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/reset-demo-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // ----------------------------------------------------
  // AI Multimodal & Mathematical Fraud Intelligence
  // ----------------------------------------------------
  async getFraudAiSamples(): Promise<{ samples: any[] }> {
    const res = await fetch(`${API_BASE_URL}/api/fraud-ai/samples`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async analyzeTransactionAi(payload: {
    transaction_id?: string;
    amount: number;
    beneficiary_account?: string;
    utr?: string;
    flags?: Record<string, boolean>;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/fraud-ai/analyze-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async analyzeReceiptScreenshot(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/fraud-ai/analyze-screenshot`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },
};
