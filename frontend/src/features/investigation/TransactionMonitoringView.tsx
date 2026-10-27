'use client';

import React, { useState } from 'react';
import { Radio, Search } from 'lucide-react';
import { Transaction } from '@/types';

interface TransactionMonitoringViewProps {
  transactions: Transaction[];
  onNavigateToAccount: (accountRef: string) => void;
}

export const TransactionMonitoringView: React.FC<TransactionMonitoringViewProps> = ({
  transactions,
  onNavigateToAccount,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.tx_ref.toLowerCase().includes(search.toLowerCase()) ||
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      (tx.source_account && tx.source_account.toLowerCase().includes(search.toLowerCase())) ||
      (tx.destination_account && tx.destination_account.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.tx_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-600" /> Transaction Monitoring Feed
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live log of processed banking transactions across all customer accounts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tx ref, account, memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-orange-500 transition placeholder:text-slate-400"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="transfer">Transfers</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="flagged">Flagged</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Tx Ref</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Memo</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No transactions match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {tx.tx_ref}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] font-mono">
                      {tx.created_at}
                    </td>
                    <td className="px-4 py-3.5 capitalize font-medium text-slate-700">
                      {tx.tx_type}
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {tx.source_account ? (
                        <button
                          onClick={() => onNavigateToAccount(tx.source_account!)}
                          className="text-orange-600 hover:underline font-bold"
                        >
                          {tx.source_account}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {tx.destination_account ? (
                        <button
                          onClick={() => onNavigateToAccount(tx.destination_account!)}
                          className="text-orange-600 hover:underline font-bold"
                        >
                          {tx.destination_account}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          tx.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
