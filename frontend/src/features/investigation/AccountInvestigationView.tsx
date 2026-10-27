'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Lock,
  Unlock,
  Radio,
  Repeat,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Account } from '@/types';
import { api } from '@/lib/api';

interface AccountInvestigationViewProps {
  initialAccountRef?: string;
  allAccounts: Account[];
  onRefreshParent?: () => void;
}

export const AccountInvestigationView: React.FC<AccountInvestigationViewProps> = ({
  initialAccountRef,
  allAccounts,
  onRefreshParent,
}) => {
  const [selectedRef, setSelectedRef] = useState<string>(
    initialAccountRef || (allAccounts[0] ? allAccounts[0].account_ref : 'ACC-2001')
  );
  const [investigationData, setInvestigationData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = async (ref: string) => {
    setIsLoading(true);
    try {
      const data = await api.getAccountInvestigation(ref);
      setInvestigationData(data);
    } catch (err: any) {
      console.error('Failed to load investigation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRef) {
      loadData(selectedRef);
    }
  }, [selectedRef]);

  const handleToggleFreeze = async () => {
    if (!investigationData) return;
    const isFrozen = investigationData.account.status === 'frozen';
    setActionMsg(null);
    try {
      if (isFrozen) {
        await api.unfreezeAccount(selectedRef, 'Reactivated by analyst');
        setActionMsg(`Account ${selectedRef} has been reactivated.`);
      } else {
        await api.freezeAccount(selectedRef, 'Administrative hold based on risk review');
        setActionMsg(`Account ${selectedRef} has been placed on hold.`);
      }
      loadData(selectedRef);
      if (onRefreshParent) onRefreshParent();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const acc = investigationData?.account;
  const risk = investigationData?.risk_assessment;
  const metrics = risk?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Account Dossier & Risk Review
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Detailed transactional profile, risk scoring heuristics, and administrative controls.
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Account:</label>
          <select
            value={selectedRef}
            onChange={(e) => setSelectedRef(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-bold outline-none cursor-pointer"
          >
            {allAccounts.map((a) => (
              <option key={a.account_ref} value={a.account_ref}>
                {a.account_ref} • {a.customer_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading account profile...</div>
      ) : !investigationData ? (
        <div className="p-8 text-center text-slate-500 text-sm">Failed to load account details.</div>
      ) : (
        <div className="space-y-6">
          {/* Top Profile Summary Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-base">{acc.account_ref}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    acc.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {acc.status}
                </span>
                <span className="text-xs text-slate-500 capitalize">• {acc.account_type} Account</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{acc.customer_name}</h3>
              <div className="text-xs text-slate-500 font-mono">{acc.customer_email}</div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Balance</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  ${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Risk Score</span>
                <span
                  className={`text-2xl font-extrabold font-mono ${
                    risk.risk_score >= 70
                      ? 'text-rose-600'
                      : risk.risk_score >= 40
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {risk.risk_score}/100
                </span>
              </div>

              <button
                onClick={handleToggleFreeze}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  acc.status === 'frozen'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                }`}
              >
                {acc.status === 'frozen' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Unfreeze Account
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Freeze Account
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metrics & Risk Evaluation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Heuristics Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Risk Assessment Analysis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {risk.plain_explanation}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Triggered Rules:</span>
                {risk.triggered_rules && risk.triggered_rules.length > 0 ? (
                  risk.triggered_rules.map((r: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex justify-between font-bold text-slate-900 mb-0.5">
                        <span>{r.name}</span>
                        <span className="text-orange-600 font-mono">+{r.points} pts</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{r.explanation}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    No risk heuristics triggered for this account.
                  </div>
                )}
              </div>
            </div>

            {/* Network Position & Topology */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Network Flow Position</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Senders (In-Degree)</span>
                  <span className="text-slate-900 font-bold font-mono text-base">{metrics?.in_degree || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Recipients (Out-Degree)</span>
                  <span className="text-slate-900 font-bold font-mono text-base">{metrics?.out_degree || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Total Inflow</span>
                  <span className="text-emerald-600 font-bold font-mono text-base">
                    ${Number(metrics?.incoming_volume || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Total Outflow</span>
                  <span className="text-orange-600 font-bold font-mono text-base">
                    ${Number(metrics?.outgoing_volume || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Customer Occupation: <strong className="text-slate-700">{acc.occupation || 'N/A'}</strong> • Income Bracket: <strong className="text-slate-700">{acc.declared_income_band || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
