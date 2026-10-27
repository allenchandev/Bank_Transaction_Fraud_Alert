'use client';

import React from 'react';
import {
  LayoutDashboard,
  ArrowDownUp,
  Send,
  History,
  Sliders,
  Bell,
  Network,
  Radio,
  Search,
  AlertOctagon,
  Users,
  Briefcase,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarProps {
  mode: 'customer' | 'admin';
  activeTab: string;
  onTabChange: (tab: string) => void;
  openAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  activeTab,
  onTabChange,
  openAlertsCount = 0,
}) => {
  const customerNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transfer', label: 'Money Transfer', icon: Send },
    { id: 'deposit_withdraw', label: 'Deposit & Withdraw', icon: ArrowDownUp },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'limits', label: 'Limits & Budgets', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const adminNavItems = [
    { id: 'overview', label: 'Fraud Intelligence', icon: LayoutDashboard },
    { id: 'network', label: 'Network Explorer', icon: Network, highlight: true },
    { id: 'monitoring', label: 'Transaction Monitor', icon: Radio },
    { id: 'investigate', label: 'Account Investigation', icon: Search },
    {
      id: 'alerts',
      label: 'Alerts & Risk Queue',
      icon: AlertOctagon,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
    },
    { id: 'directory', label: 'Customer Directory', icon: Users },
    { id: 'cases', label: 'Investigation Cases', icon: Briefcase },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'rules', label: 'Detection Rules', icon: SlidersHorizontal },
  ];

  const items = mode === 'customer' ? customerNavItems : adminNavItems;

  return (
    <aside className="w-full md:w-64 bg-[#0a1022] border-r border-[#1e293b] flex flex-col p-3 shrink-0">
      <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-3 py-2">
        {mode === 'customer' ? 'Customer Navigation' : 'Investigation Console'}
      </div>

      <nav className="space-y-1 flex-1">
        {items.map((item: any) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? mode === 'customer'
                    ? 'bg-blue-600/15 text-cyan-400 border border-cyan-500/30'
                    : 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? mode === 'customer'
                        ? 'text-cyan-400'
                        : 'text-violet-400'
                      : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status Info */}
      <div className="mt-auto pt-3 border-t border-slate-800/80 px-3 text-[11px] text-slate-500">
        <div className="flex items-center justify-between mb-1">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-mono">ACTIVE</span>
        </div>
        <div className="text-[10px] text-slate-600">DSA Microproject v1.0</div>
      </div>
    </aside>
  );
};
