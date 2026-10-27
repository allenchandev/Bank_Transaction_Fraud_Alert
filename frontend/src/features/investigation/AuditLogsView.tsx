'use client';

import React, { useState } from 'react';
import { FileText, Search, ShieldCheck, Download } from 'lucide-react';
import { AuditLog } from '@/types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [search, setSearch] = useState('');

  const filtered = auditLogs.filter((log) => {
    return (
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.target_account && log.target_account.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const exportAuditCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Action', 'Target Account', 'Details'];
    const rows = filtered.map((l) => [
      l.id,
      l.created_at,
      l.actor,
      l.action,
      l.target_account || '',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-600" /> Administrative Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            System audit log recording account freezes, setting modifications, and compliance actions.
          </p>
        </div>
        <button
          onClick={exportAuditCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-orange-600" /> Export Audit CSV
        </button>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-orange-500 transition placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Log ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Account</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      #{log.id}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] font-mono">
                      {log.created_at}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {log.actor}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-semibold text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                      {log.target_account || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
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
