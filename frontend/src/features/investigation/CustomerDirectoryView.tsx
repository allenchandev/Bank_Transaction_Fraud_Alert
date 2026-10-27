'use client';

import React, { useState } from 'react';
import { Users, Search, Lock, Unlock, Eye, X, Download } from 'lucide-react';
import { Account } from '@/types';
import { api } from '@/lib/api';

interface CustomerDirectoryViewProps {
  accounts: Account[];
  onRefresh: () => void;
  onNavigateToAccount: (accountRef: string) => void;
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({
  accounts,
  onRefresh,
  onNavigateToAccount,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Freeze/Unfreeze modal state
  const [modalAccount, setModalAccount] = useState<Account | null>(null);
  const [freezeReason, setFreezeReason] = useState('Administrative compliance hold');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = accounts.filter((acc) => {
    const matchesSearch =
      acc.account_ref.toLowerCase().includes(search.toLowerCase()) ||
      (acc.customer_name && acc.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (acc.occupation && acc.occupation.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || acc.account_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleConfirmFreezeToggle = async () => {
    if (!modalAccount) return;
    setIsSubmitting(true);
    try {
      if (modalAccount.status === 'frozen') {
        await api.unfreezeAccount(modalAccount.account_ref, freezeReason);
      } else {
        await api.freezeAccount(modalAccount.account_ref, freezeReason);
      }
      setModalAccount(null);
      onRefresh();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportDirectoryCSV = () => {
    const headers = ['Account Ref', 'Customer Name', 'Email', 'Account Type', 'Balance', 'Risk Score', 'Status'];
    const rows = filtered.map((a) => [
      a.account_ref,
      `"${a.customer_name || ''}"`,
      a.customer_email || '',
      a.account_type,
      a.balance,
      a.risk_score || 0,
      a.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" /> Customer Account Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centralized directory of all customer account profiles and statuses.
          </p>
        </div>
        <button
          onClick={exportDirectoryCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-orange-600" /> Export Directory CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ref, occupation..."
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
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="business">Business</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
        </select>
      </div>

      {/* Accounts Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Account Ref</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Risk Score</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No customer accounts match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => (
                  <tr key={acc.account_ref} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {acc.account_ref}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {acc.customer_name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] font-mono">
                      {acc.customer_email}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-slate-600 font-medium">
                      {acc.account_type}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      ${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                          (acc.risk_score || 0) >= 70
                            ? 'bg-rose-100 text-rose-700'
                            : (acc.risk_score || 0) >= 40
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {acc.risk_score || 0}/100
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          acc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigateToAccount(acc.account_ref)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                          title="Inspect Account"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setModalAccount(acc)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                            acc.status === 'frozen'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          }`}
                        >
                          {acc.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      {modalAccount && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {modalAccount.status === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
              </h3>
              <button
                onClick={() => setModalAccount(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to {modalAccount.status === 'frozen' ? 'reactivate' : 'freeze'} account{' '}
              <strong className="text-slate-900 font-mono">{modalAccount.account_ref}</strong> ({modalAccount.customer_name})?
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Memo
              </label>
              <input
                type="text"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalAccount(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFreezeToggle}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  modalAccount.status === 'frozen'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
