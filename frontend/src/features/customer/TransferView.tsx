'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Account } from '@/types';
import { api } from '@/lib/api';

interface TransferViewProps {
  currentAccount: Account;
  allAccounts: Account[];
  limits: {
    daily_limit: number;
    transferred_today: number;
    remaining_today: number;
    per_tx_limit: number;
  };
  onSuccess: () => void;
}

export const TransferView: React.FC<TransferViewProps> = ({
  currentAccount,
  allAccounts,
  limits,
  onSuccess,
}) => {
  const [recipientRef, setRecipientRef] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('Standard Account Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);

  const amount = parseFloat(amountStr) || 0;
  const isFrozen = currentAccount.status === 'frozen';
  const otherAccounts = allAccounts.filter((a) => a.account_ref !== currentAccount.account_ref);

  const exceedsBalance = amount > currentAccount.balance;
  const exceedsPerTxLimit = amount > limits.per_tx_limit;
  const exceedsDailyLimit = amount > limits.remaining_today;
  const hasValidationError = exceedsBalance || exceedsPerTxLimit || exceedsDailyLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientRef) {
      setErrorMsg('Please select or specify a destination recipient account.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Please enter a positive transfer amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setReceipt(null);

    try {
      const res = await api.transfer(
        currentAccount.account_ref,
        recipientRef,
        amount,
        description
      );
      setReceipt(res);
      setAmountStr('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed. Check account status and limits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recipientAccount = allAccounts.find((a) => a.account_ref === recipientRef);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transfer Funds</h2>
        <p className="text-xs text-slate-500 mt-1">
          Send money instantly with real-time balance and limit validation.
        </p>
      </div>

      {receipt && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Transfer Completed Successfully
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-emerald-200">
            <div>
              <span className="text-slate-500 block">Reference:</span>
              <span className="font-bold text-slate-900">{receipt.tx_ref}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Amount:</span>
              <span className="font-bold text-slate-900">${Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Recipient:</span>
              <span className="font-bold text-slate-900">{receipt.destination_account}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Remaining Today:</span>
              <span className="font-bold text-slate-900">${Number(receipt.daily_allowance_remaining).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        {/* Source Account Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Source Account</span>
            <span className="font-bold text-slate-900">{currentAccount.account_ref} ({currentAccount.customer_name})</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Available</span>
            <span className="font-bold font-mono text-emerald-600">
              ${Number(currentAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Recipient Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Destination Recipient
          </label>
          <select
            value={recipientRef}
            onChange={(e) => setRecipientRef(e.target.value)}
            disabled={isFrozen}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition cursor-pointer disabled:opacity-50"
          >
            <option value="">Select Recipient Account...</option>
            {otherAccounts.map((acc) => (
              <option key={acc.account_ref} value={acc.account_ref}>
                {acc.account_ref} • {acc.customer_name} ({acc.account_type})
              </option>
            ))}
          </select>
          {recipientAccount && (
            <p className="text-[11px] text-slate-500 mt-1.5">
              Verified Counterparty: <strong className="text-slate-800">{recipientAccount.customer_name}</strong>
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <label>Transfer Amount ($)</label>
            <span className="text-slate-500 font-normal">
              Remaining Today: <strong className="font-mono text-slate-800">${Number(limits.remaining_today).toLocaleString()}</strong>
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              disabled={isFrozen}
              placeholder="0.00"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:border-orange-500 transition disabled:opacity-50"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 mt-2">
            {[100, 250, 500, 1000].map((preset) => (
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

          {exceedsBalance && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Amount exceeds current balance (${currentAccount.balance.toLocaleString()})
            </p>
          )}
          {exceedsPerTxLimit && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Amount exceeds single transaction limit (${limits.per_tx_limit.toLocaleString()})
            </p>
          )}
          {exceedsDailyLimit && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Amount exceeds remaining daily allowance (${limits.remaining_today.toLocaleString()})
            </p>
          )}
        </div>

        {/* Memo / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Transfer Note
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isFrozen}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition disabled:opacity-50"
            placeholder="Payment note"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || hasValidationError || isFrozen || !recipientRef || amount <= 0}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Processing Transfer...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Execute Transfer
            </>
          )}
        </button>
      </form>
    </div>
  );
};
