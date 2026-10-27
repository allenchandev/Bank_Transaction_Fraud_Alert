'use client';

import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Account } from '@/types';
import { api } from '@/lib/api';

interface DepositWithdrawViewProps {
  currentAccount: Account;
  onSuccess: () => void;
}

export const DepositWithdrawView: React.FC<DepositWithdrawViewProps> = ({
  currentAccount,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('Cash deposit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const amount = parseFloat(amountStr) || 0;
  const isFrozen = currentAccount.status === 'frozen';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a positive monetary amount.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      if (activeTab === 'deposit') {
        const res = await api.deposit(currentAccount.account_ref, amount, description);
        setStatusMsg({
          type: 'success',
          text: `Deposit successful! $${amount.toLocaleString()} credited. New balance: $${Number(res.new_balance).toLocaleString()}`,
        });
      } else {
        const res = await api.withdraw(currentAccount.account_ref, amount, description);
        setStatusMsg({
          type: 'success',
          text: `Withdrawal successful! $${amount.toLocaleString()} debited. New balance: $${Number(res.new_balance).toLocaleString()}`,
        });
      }
      setAmountStr('');
      onSuccess();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Deposit & Cash Operations</h2>
        <p className="text-xs text-slate-500 mt-1">
          Add test funds or make cash withdrawals on your account.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Account balance preview */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Account</span>
            <span className="font-bold text-slate-900">{currentAccount.account_ref} ({currentAccount.customer_name})</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Current Balance</span>
            <span className="font-bold font-mono text-emerald-600 text-sm">
              ${Number(currentAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Tab switcher: Deposit vs Withdraw */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('deposit');
              setDescription('Cash deposit');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
            Deposit Funds
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('withdraw');
              setDescription('ATM withdrawal');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-orange-600" />
            Withdraw Cash
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {activeTab === 'deposit' ? 'Deposit Amount ($)' : 'Withdrawal Amount ($)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                disabled={isFrozen && activeTab === 'withdraw'}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:border-orange-500 transition disabled:opacity-50"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 mt-2">
              {[50, 100, 250, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountStr(preset.toString())}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition cursor-pointer"
                >
                  ${preset}
                </button>
              ))}
            </div>

            {activeTab === 'withdraw' && amount > currentAccount.balance && (
              <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Amount exceeds balance
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Memo
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              amount <= 0 ||
              (activeTab === 'withdraw' && (amount > currentAccount.balance || isFrozen))
            }
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : activeTab === 'deposit' ? (
              'Confirm Deposit'
            ) : (
              'Confirm Withdrawal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
