'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Alert, Account } from '@/types';

interface NotificationsViewProps {
  alerts: Alert[];
  account: Account;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ alerts, account }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Security Notices & Advisories</h2>
        <p className="text-xs text-slate-500 mt-1">
          Recent activity alerts and security notices for account {account.account_ref}.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-base font-bold text-slate-900 pt-2">No Active Security Alerts</div>
          <div className="text-xs text-slate-500">
            Account {account.account_ref} is operating normally with no outstanding security restrictions.
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border shadow-xs flex items-start gap-3.5 ${
                alert.severity === 'critical' || alert.severity === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <ShieldAlert
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.severity === 'critical' || alert.severity === 'high'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 font-mono text-sm">{alert.rule_code}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {alert.severity}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed mb-2">{alert.explanation}</p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Reported: {alert.created_at} • Ref: {alert.alert_ref}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
