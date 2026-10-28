'use client';

import React from 'react';
import {
  ShieldAlert,
  Users,
  Repeat,
  Radio,
  ArrowUpRight,
  Network,
  Activity,
  IndianRupee,
  Search,
} from 'lucide-react';
import { NetworkOverview } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface AdminOverviewViewProps {
  overview: NetworkOverview;
  onNavigate: (tab: string, accountRef?: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ overview, onNavigate }) => {
  const summary = overview.summary;
  const topRiskAccounts = overview.risk_ranking.slice(0, 5);

  const riskDistribution = [
    { name: 'Low (0-39)', count: overview.risk_ranking.filter((a) => (a.risk_score || 0) < 40).length, color: '#10b981' },
    { name: 'Medium (40-69)', count: overview.risk_ranking.filter((a) => (a.risk_score || 0) >= 40 && (a.risk_score || 0) < 70).length, color: '#f59e0b' },
    { name: 'High (70-84)', count: overview.risk_ranking.filter((a) => (a.risk_score || 0) >= 70 && (a.risk_score || 0) < 85).length, color: '#f43f5e' },
    { name: 'Critical (85+)', count: overview.risk_ranking.filter((a) => (a.risk_score || 0) >= 85).length, color: '#e11d48' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fraud Intelligence Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Network transaction monitoring, flow tracing, and automated risk scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('network')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Network className="w-4 h-4" /> Open Graph Explorer
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-orange-600" /> Alert Queue ({summary.open_alerts_count})
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>TOTAL ACCOUNTS</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{summary.total_accounts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active customer profiles</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>TOTAL VOLUME</span>
            <IndianRupee className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            ₹{Number(summary.total_volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Processed transactions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>ACTIVE ALERTS</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 font-mono">{summary.open_alerts_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requiring review</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>DETECTED CYCLES</span>
            <Repeat className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-extrabold text-orange-600 font-mono">{summary.cycles_detected_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">Closed flow loops</div>
        </div>
      </div>

      {/* Charts & Top Risk Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Score Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of account risk bands across the portfolio</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Risk Accounts List */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Priority Accounts for Review</h3>
              <p className="text-xs text-slate-500">Accounts with highest risk indicators</p>
            </div>
            <button
              onClick={() => onNavigate('directory')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              All Accounts <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topRiskAccounts.map((acc) => (
              <div
                key={acc.account_ref}
                onClick={() => onNavigate('investigate', acc.account_ref)}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">{acc.account_ref}</span>
                    <span className="text-xs text-slate-700 font-medium">{acc.customer_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Balance: <strong className="text-slate-700 font-mono">₹{Number(acc.balance).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div
                    className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
                      (acc.risk_score || 0) >= 70
                        ? 'bg-rose-100 text-rose-700'
                        : (acc.risk_score || 0) >= 40
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    Risk: {acc.risk_score}/100
                  </div>
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
