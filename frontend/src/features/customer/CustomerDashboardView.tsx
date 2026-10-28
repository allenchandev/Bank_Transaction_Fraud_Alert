'use client';

import React from 'react';
import {
  Wallet,
  Send,
  ArrowDownCircle,
  Clock,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Account, Transaction, Alert } from '@/types';

interface CustomerDashboardViewProps {
  account: Account;
  limits: {
    daily_limit: number;
    transferred_today: number;
    remaining_today: number;
    per_tx_limit: number;
    monthly_budget: number;
  };
  transactions: Transaction[];
  alerts: Alert[];
  onNavigate: (tab: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  account,
  limits,
  transactions,
  alerts,
  onNavigate,
}) => {
  const dailyUsagePct = Math.min(100, Math.round((limits.transferred_today / (limits.daily_limit || 1)) * 100));
  const isNearLimit = dailyUsagePct >= 80;
  const isFrozen = account.status === 'frozen';

  return (
    <div className="space-y-6">
      {/* Account Status / Warning Banner */}
      {isFrozen && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Account Restricted</span>
            Your account is currently placed on hold. Outbound transfers and withdrawals are paused.
          </div>
        </div>
      )}

      {/* Main Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Balance Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
              <span>Available Balance</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize text-xs font-semibold">
                {account.account_type} Account
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono my-2">
              ₹{Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Account: <span className="text-slate-800 font-bold">{account.account_ref}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-5 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('transfer')}
              disabled={isFrozen}
              className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> Transfer Funds
            </button>
            <button
              onClick={() => onNavigate('deposit_withdraw')}
              className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              Deposit / Cash
            </button>
          </div>
        </div>

        {/* Daily Allowance Progress Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
              <span>Daily Transfer Allowance</span>
              <span className={`text-xs font-semibold ${isNearLimit ? 'text-orange-600' : 'text-slate-700'}`}>
                {dailyUsagePct}% Used
              </span>
            </div>

            <div className="text-2xl font-bold text-slate-900 font-mono my-2">
              ₹{Number(limits.remaining_today).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-slate-500 ml-1.5">left today</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isNearLimit ? 'bg-orange-600' : 'bg-slate-800'
                }`}
                style={{ width: `${dailyUsagePct}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Used: ₹{Number(limits.transferred_today).toLocaleString()}</span>
              <span>Limit: ₹{Number(limits.daily_limit).toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Per-Tx Ceiling:</span>
            <span className="font-mono font-bold text-slate-800">₹{Number(limits.per_tx_limit).toLocaleString()}</span>
          </div>
        </div>

        {/* Spending Budget & Activity Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
              <span>Monthly Budget</span>
              <span className="text-xs font-semibold text-emerald-600 font-mono">Enforced</span>
            </div>

            <div className="text-2xl font-bold text-slate-900 font-mono my-2">
              ₹{Number(limits.monthly_budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Authoritative transaction verification prevents over-limit debiting and validates recipient accounts before execution.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Active Advisories:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                alerts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {alerts.length} Flagged
            </span>
          </div>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            Full Statement <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions found for this account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {transactions.slice(0, 5).map((tx) => {
              const isOutflow = tx.source_account === account.account_ref;
              const isDeposit = tx.tx_type === 'deposit';
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isDeposit || !isOutflow
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isDeposit || !isOutflow ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{tx.description}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {tx.created_at} • Ref: {tx.tx_ref}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm ${
                        isDeposit || !isOutflow ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isDeposit || !isOutflow ? '+' : '-'}₹{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        tx.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
