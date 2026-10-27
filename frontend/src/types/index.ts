export interface Customer {
  id: number;
  customer_ref: string;
  full_name: string;
  email: string;
  age_band: string;
  occupation: string;
  declared_income_band: string;
  created_at: string;
}

export interface Account {
  id: number;
  account_ref: string;
  customer_id: number;
  account_type: 'savings' | 'current' | 'student';
  balance: number;
  daily_transfer_limit: number;
  per_tx_limit: number;
  monthly_budget: number;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  occupation?: string;
  age_band?: string;
  declared_income_band?: string;
  risk_score?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
  plain_explanation?: string;
  rules_triggered_count?: number;
  triggered_rules?: Array<{
    rule_id: string;
    name: string;
    points: number;
    severity: string;
    evidence: Record<string, any>;
    explanation: string;
  }>;
}

export interface Transaction {
  id: number;
  tx_ref: string;
  source_account: string | null;
  destination_account: string | null;
  tx_type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'completed' | 'rejected' | 'flagged';
  description: string;
  idempotency_key?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  alert_ref: string;
  account_ref: string;
  tx_ref?: string | null;
  risk_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rule_code: string;
  explanation: string;
  evidence?: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  target_account?: string | null;
  details?: Record<string, any>;
  created_at: string;
}

export interface InvestigationCase {
  id: number;
  case_ref: string;
  target_account: string;
  title: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  notes?: string | null;
  assigned_analyst?: string;
  created_at: string;
  updated_at: string;
}

export interface DFSTraceStep {
  step: number;
  action: string;
  node?: string;
  from_node?: string;
  to_node?: string;
  cycle_path?: string[];
  description: string;
  path?: string[];
}

export interface DFSResult {
  cycle_count: number;
  cycles: string[][];
  cycle_edges: Array<{ source: string; target: string }>;
  participating_accounts: string[];
  total_steps: number;
  trace: DFSTraceStep[];
  summary: {
    cycles_found: number;
    accounts_involved: number;
    vertices_scanned: number;
    edges_scanned: number;
  };
}

export interface BFSTraceStep {
  step: number;
  action: string;
  node?: string;
  parent?: string;
  depth?: number;
  queue_state?: string[];
  description: string;
}

export interface ReachableNode {
  account_ref: string;
  customer_name: string;
  hop_distance: number;
  shortest_path: string[];
  predecessor: string | null;
  account_type: string;
  balance: number;
  status: string;
}

export interface BFSResult {
  source: string;
  max_hops: number;
  blast_radius_count: number;
  reachable_nodes: ReachableNode[];
  levels: Record<string, string[]>;
  highlighted_edges: Array<{
    source: string;
    target: string;
    hop: number;
    transactions: Array<{
      tx_ref: string;
      amount: number;
      timestamp: string;
      description: string;
    }>;
  }>;
  total_steps: number;
  trace: BFSTraceStep[];
  summary: {
    source_account: string;
    max_hops_configured: number;
    total_accounts_reached: number;
    levels_explored: number;
  };
  error?: string;
}

export interface NetworkOverview {
  summary: {
    total_accounts: number;
    total_transactions: number;
    total_volume: number;
    cycles_detected_count: number;
    open_alerts_count: number;
    critical_alerts_count: number;
    high_risk_accounts_count: number;
  };
  dfs_results: DFSResult;
  risk_ranking: Account[];
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: {
        accountRef: string;
        customerName: string;
        accountType: string;
        balance: number;
        status: string;
        riskScore: number;
        inCycle: boolean;
      };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      animated: boolean;
      data: {
        amount: number;
        txCount: number;
        isCycleEdge: boolean;
        transactions: Array<{
          tx_ref: string;
          amount: number;
          timestamp: string;
          description: string;
        }>;
      };
    }>;
  };
}
