'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Transaction } from '@/types';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  currentAccountRef: string;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  currentAccountRef,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.tx_ref.toLowerCase().includes(search.toLowerCase()) ||
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        (tx.source_account && tx.source_account.toLowerCase().includes(search.toLowerCase())) ||
        (tx.destination_account && tx.destination_account.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === 'all' || tx.tx_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const exportCSV = () => {
    const headers = ['Transaction Reference', 'Type', 'Source', 'Destination', 'Amount', 'Status', 'Description', 'Timestamp'];
    const rows = filtered.map((tx) => [
      tx.tx_ref,
      tx.tx_type,
      tx.source_account || '',
      tx.destination_account || '',
      tx.amount,
      tx.status,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement_${currentAccountRef}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Statement & Ledger History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Official chronological ledger records for account {currentAccountRef}.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-orange-600" /> Export CSV Statement
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ref, note, counterparty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-orange-500 transition placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Tx Ref</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Counterparty</th>
                <th className="px-4 py-3">Memo</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No transactions matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isOutflow = tx.source_account === currentAccountRef;
                  const isDeposit = tx.tx_type === 'deposit';
                  const counterparty = isOutflow ? tx.destination_account : tx.source_account;

                  return (
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
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {counterparty || 'Self'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                        {tx.description}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold text-sm ${
                          isDeposit || !isOutflow ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isDeposit || !isOutflow ? '+' : '-'}₹{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
