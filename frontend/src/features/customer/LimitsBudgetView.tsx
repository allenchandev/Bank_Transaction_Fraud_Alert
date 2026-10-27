'use client';

import React, { useState } from 'react';
import { Sliders, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Account } from '@/types';
import { api } from '@/lib/api';

interface LimitsBudgetViewProps {
  currentAccount: Account;
  limits: {
    daily_limit: number;
    transferred_today: number;
    remaining_today: number;
    per_tx_limit: number;
    monthly_budget: number;
  };
  onSuccess: () => void;
}

export const LimitsBudgetView: React.FC<LimitsBudgetViewProps> = ({
  currentAccount,
  limits,
  onSuccess,
}) => {
  const [dailyLimit, setDailyLimit] = useState<number>(limits.daily_limit);
  const [perTxLimit, setPerTxLimit] = useState<number>(limits.per_tx_limit);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(limits.monthly_budget);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);
    try {
      await api.updateLimits(currentAccount.account_ref, {
        daily_transfer_limit: dailyLimit,
        per_tx_limit: perTxLimit,
        monthly_budget: monthlyBudget,
      });
      setMsg({ type: 'success', text: 'Transfer limits and spending budget updated successfully.' });
      onSuccess();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update limits.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Limits & Spending Budget</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure security ceilings and daily allowances for account {currentAccount.account_ref}.
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Daily Transfer Limit ($)
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Maximum outbound transfer amount allowed per 24-hour cycle.
          </p>
          <input
            type="number"
            min="100"
            max="100000"
            step="100"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Single Transaction Ceiling ($)
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Cap for any individual wire or inter-account transfer.
          </p>
          <input
            type="number"
            min="50"
            max="50000"
            step="50"
            value={perTxLimit}
            onChange={(e) => setPerTxLimit(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Monthly Spending Budget ($)
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Target spending ceiling across all debit activities.
          </p>
          <input
            type="number"
            min="500"
            max="500000"
            step="500"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Limits & Budget'
          )}
        </button>
      </form>
    </div>
  );
};
