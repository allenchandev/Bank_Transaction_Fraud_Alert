'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Search,
} from 'lucide-react';
import { Alert } from '@/types';
import { api } from '@/lib/api';

interface AlertsQueueViewProps {
  alerts: Alert[];
  onRefresh: () => void;
  onNavigateToAccount?: (accountRef: string) => void;
}

export const AlertsQueueView: React.FC<AlertsQueueViewProps> = ({
  alerts,
  onRefresh,
  onNavigateToAccount,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedAlertForEvidence, setSelectedAlertForEvidence] = useState<Alert | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const filtered = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesSearch =
      a.alert_ref.toLowerCase().includes(search.toLowerCase()) ||
      a.account_ref.toLowerCase().includes(search.toLowerCase()) ||
      a.rule_code.toLowerCase().includes(search.toLowerCase()) ||
      a.explanation.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const handleUpdateStatus = async (alertId: string | number, newStatus: string) => {
    setUpdatingId(alertId);
    try {
      await api.updateAlertStatus(alertId, newStatus);
      onRefresh();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-600" /> Security Alerts & Risk Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized review queue of suspicious activities and limit breaches.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by alert ref, account, or rule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-orange-500 transition placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Alert Ref</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No alerts match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {alert.alert_ref}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] font-mono">
                      {alert.created_at}
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {onNavigateToAccount ? (
                        <button
                          onClick={() => onNavigateToAccount(alert.account_ref)}
                          className="text-orange-600 hover:underline font-bold cursor-pointer"
                        >
                          {alert.account_ref}
                        </button>
                      ) : (
                        <span className="font-bold text-slate-800">{alert.account_ref}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">
                      {alert.rule_code}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          alert.severity === 'critical' || alert.severity === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : alert.severity === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[240px] truncate">
                      {alert.explanation}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          alert.status === 'open'
                            ? 'bg-orange-100 text-orange-700'
                            : alert.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAlertForEvidence(alert)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                          title="View Evidence"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {alert.status === 'open' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                              disabled={updatingId === alert.id}
                              className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'dismissed')}
                              disabled={updatingId === alert.id}
                              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedAlertForEvidence && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Alert Details</h3>
              <button
                onClick={() => setSelectedAlertForEvidence(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedAlertForEvidence.alert_ref}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Rule:</span>
                <span className="font-mono font-bold text-orange-600">{selectedAlertForEvidence.rule_code}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Summary:</span>
                <p className="text-slate-700 mt-1 leading-relaxed">{selectedAlertForEvidence.explanation}</p>
              </div>
              {selectedAlertForEvidence.evidence && (
                <div>
                  <span className="text-slate-500 block mb-1">Evidence Data:</span>
                  <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 overflow-x-auto">
                    {JSON.stringify(selectedAlertForEvidence.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedAlertForEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
