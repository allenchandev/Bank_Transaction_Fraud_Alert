'use client';

import React, { useState } from 'react';
import { Briefcase, X } from 'lucide-react';
import { InvestigationCase } from '@/types';
import { api } from '@/lib/api';

interface InvestigationCasesViewProps {
  cases: InvestigationCase[];
  onRefresh: () => void;
  onNavigateToAccount: (accountRef: string) => void;
}

export const InvestigationCasesView: React.FC<InvestigationCasesViewProps> = ({
  cases,
  onRefresh,
  onNavigateToAccount,
}) => {
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [newStatus, setNewStatus] = useState<string>('investigating');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleUpdate = async () => {
    if (!selectedCase) return;
    setIsUpdating(true);
    try {
      await api.updateCaseStatus(selectedCase.case_ref, newStatus, newNotes);
      setSelectedCase(null);
      onRefresh();
    } catch (err: any) {
      alert(`Case update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-orange-600" /> Investigation Cases
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Case management board for financial compliance reviews and findings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cases.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-orange-600">{c.case_ref}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    c.status === 'open'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : c.status === 'investigating'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">{c.title}</h3>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject Account:</span>
                  <button
                    onClick={() => onNavigateToAccount(c.target_account)}
                    className="font-mono font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    {c.target_account}
                  </button>
                </div>
                {c.assigned_analyst && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Analyst:</span>
                    <span className="font-semibold text-slate-800">{c.assigned_analyst}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-mono text-slate-500 text-[11px]">{c.created_at}</span>
                </div>
                {c.notes && (
                  <div className="pt-1 text-slate-600 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Notes:</span>
                    <p className="text-slate-700">{c.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCase(c);
                  setNewStatus(c.status);
                  setNewNotes(c.notes || '');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Update Case Status
              </button>
              <button
                onClick={() => onNavigateToAccount(c.target_account)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                View Account →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Update Case Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Update Case {selectedCase.case_ref}</h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Case Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none"
              >
                <option value="open">Open</option>
                <option value="investigating">Under Investigation</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Investigator Notes
              </label>
              <textarea
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-orange-500"
                placeholder="Add notes..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
