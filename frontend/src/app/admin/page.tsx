'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Activity,
  LogOut,
  LayoutDashboard,
  Network,
  Radio,
  Search,
  AlertOctagon,
  Users,
  Briefcase,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Account, Transaction, Alert, AuditLog, InvestigationCase, NetworkOverview } from '@/types';

import { AdminOverviewView } from '@/features/investigation/AdminOverviewView';
import { NetworkExplorerView } from '@/features/investigation/NetworkExplorerView';
import { TransactionMonitoringView } from '@/features/investigation/TransactionMonitoringView';
import { AccountInvestigationView } from '@/features/investigation/AccountInvestigationView';
import { AlertsQueueView } from '@/features/investigation/AlertsQueueView';
import { CustomerDirectoryView } from '@/features/investigation/CustomerDirectoryView';
import { InvestigationCasesView } from '@/features/investigation/InvestigationCasesView';
import { AuditLogsView } from '@/features/investigation/AuditLogsView';
import { DetectionRulesView } from '@/features/investigation/DetectionRulesView';
import { AiFraudIntelligenceView } from '@/features/investigation/AiFraudIntelligenceView';

export default function AdminConsolePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [investigationTargetRef, setInvestigationTargetRef] = useState<string>('ACC-2001');

  // Platform Datasets
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [overview, setOverview] = useState<NetworkOverview | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [accRes, overviewRes, alertsRes, casesRes, auditsRes, txRes] = await Promise.all([
        api.getAccounts(),
        api.getOverview(),
        api.getAlerts(),
        api.getCases(),
        api.getAuditLogs(100),
        api.getAllTransactions(200),
      ]);

      setAccounts(accRes.accounts);
      setOverview(overviewRes);
      setAlerts(alertsRes.alerts);
      setCases(casesRes.cases);
      setAuditLogs(auditsRes.audit_logs);
      setAllTransactions(txRes.transactions);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setErrorMsg('Failed to load data. Make sure backend is running on http://localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleResetData = async () => {
    if (!confirm('Reset accounts and transactions to initial test state?')) {
      return;
    }
    setIsResetting(true);
    setResetMsg(null);
    try {
      await api.resetDemoData();
      setResetMsg('Data successfully reset to initial state.');
      setTimeout(() => setResetMsg(null), 3000);
      loadAdminData();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Fraud Intelligence', icon: LayoutDashboard },
    { id: 'ai_fraud', label: 'AI Forensics & AO* Search', icon: Sparkles },
    { id: 'network', label: 'Network Explorer', icon: Network },
    { id: 'monitoring', label: 'Transaction Monitor', icon: Radio },
    { id: 'investigate', label: 'Account Investigation', icon: Search },
    {
      id: 'alerts',
      label: 'Alerts & Risk Queue',
      icon: AlertOctagon,
      badge: alerts.filter((a) => a.status === 'open').length || undefined,
    },
    { id: 'directory', label: 'Customer Directory', icon: Users },
    { id: 'cases', label: 'Investigation Cases', icon: Briefcase },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'rules', label: 'Detection Rules', icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Admin Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">Aegis</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Fraud Intelligence
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Sign Out */}
          <div className="flex items-center gap-3">
            {resetMsg && (
              <span className="text-emerald-600 flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {resetMsg}
              </span>
            )}

            <button
              onClick={() => router.push('/ai-fraud')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs border border-slate-700"
              title="Launch full multimodal fraud inspection suite"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Fraud Detection</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Reset test data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Resetting...' : 'Reset Data'}
            </button>

            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl py-1 px-3">
              <Activity className="w-3.5 h-3.5 text-orange-600" />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">Fraud Analyst</div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-2">
            Investigation Modules
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={loadAdminData}
                className="px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-50 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
              Loading fraud intelligence data...
            </div>
          ) : !overview ? (
            <div className="p-8 text-center text-slate-500 text-sm">Failed to load system overview.</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverviewView
                  overview={overview}
                  onNavigate={(tab, accRef) => {
                    setActiveTab(tab);
                    if (accRef) setInvestigationTargetRef(accRef);
                  }}
                />
              )}

              {activeTab === 'ai_fraud' && (
                <AiFraudIntelligenceView />
              )}

              {activeTab === 'network' && (
                <NetworkExplorerView
                  overview={overview}
                  onRefresh={loadAdminData}
                  onNavigateToInvestigation={(accRef) => {
                    setInvestigationTargetRef(accRef);
                    setActiveTab('investigate');
                  }}
                />
              )}

              {activeTab === 'monitoring' && (
                <TransactionMonitoringView
                  transactions={allTransactions}
                  onNavigateToAccount={(accRef) => {
                    setInvestigationTargetRef(accRef);
                    setActiveTab('investigate');
                  }}
                />
              )}

              {activeTab === 'investigate' && (
                <AccountInvestigationView
                  initialAccountRef={investigationTargetRef}
                  allAccounts={accounts}
                  onRefreshParent={loadAdminData}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertsQueueView
                  alerts={alerts}
                  onRefresh={loadAdminData}
                  onNavigateToAccount={(accRef) => {
                    setInvestigationTargetRef(accRef);
                    setActiveTab('investigate');
                  }}
                />
              )}

              {activeTab === 'directory' && (
                <CustomerDirectoryView
                  accounts={accounts}
                  onRefresh={loadAdminData}
                  onNavigateToAccount={(accRef) => {
                    setInvestigationTargetRef(accRef);
                    setActiveTab('investigate');
                  }}
                />
              )}

              {activeTab === 'cases' && (
                <InvestigationCasesView
                  cases={cases}
                  onRefresh={loadAdminData}
                  onNavigateToAccount={(accRef) => {
                    setInvestigationTargetRef(accRef);
                    setActiveTab('investigate');
                  }}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLogsView auditLogs={auditLogs} />
              )}

              {activeTab === 'rules' && (
                <DetectionRulesView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
