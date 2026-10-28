'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  Send,
  ArrowDownUp,
  History,
  Sliders,
  Bell,
  LayoutDashboard,
  AlertTriangle,
  Building2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Account, Transaction, Alert } from '@/types';

import { CustomerDashboardView } from '@/features/customer/CustomerDashboardView';
import { TransferView } from '@/features/customer/TransferView';
import { DepositWithdrawView } from '@/features/customer/DepositWithdrawView';
import { TransactionHistoryView } from '@/features/customer/TransactionHistoryView';
import { LimitsBudgetView } from '@/features/customer/LimitsBudgetView';
import { NotificationsView } from '@/features/customer/NotificationsView';
import { FraudDetectionPanel } from '@/components/AIFraudDetection/FraudDetectionPanel';

export default function CustomerPortalPage() {
  const router = useRouter();
  const { user, logout, switchCustomerAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountRef, setCurrentAccountRef] = useState<string>(
    user?.accountRef || 'ACC-2001'
  );
  const [accountDetails, setAccountDetails] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with auth user
  useEffect(() => {
    if (user?.accountRef) {
      setCurrentAccountRef(user.accountRef);
    }
  }, [user]);

  // Load customer data
  const loadCustomerData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [accRes, detailRes, txRes, alertsRes] = await Promise.all([
        api.getAccounts(),
        api.getAccount(currentAccountRef),
        api.getAccountTransactions(currentAccountRef, 50),
        api.getAlerts(currentAccountRef),
      ]);

      setAccounts(accRes.accounts);
      setAccountDetails(detailRes);
      setTransactions(txRes.transactions);
      setAlerts(alertsRes.alerts);
    } catch (err: any) {
      console.error('Failed to load customer portal data:', err);
      setErrorMsg('Failed to connect to backend server. Make sure backend is running on http://localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  }, [currentAccountRef]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleAccountChange = (newRef: string) => {
    setCurrentAccountRef(newRef);
    const target = accounts.find((a) => a.account_ref === newRef);
    if (target) {
      switchCustomerAccount(target.account_ref, target.customer_name || 'Customer');
    }
  };

  const currentAcc =
    accounts.find((a) => a.account_ref === currentAccountRef) || accounts[0];

  const currentLimits = accountDetails?.limits || {
    daily_limit: currentAcc ? Number(currentAcc.daily_transfer_limit) : 5000,
    transferred_today: 0,
    remaining_today: currentAcc ? Number(currentAcc.daily_transfer_limit) : 5000,
    per_tx_limit: currentAcc ? Number(currentAcc.per_tx_limit) : 2500,
    monthly_budget: currentAcc ? Number(currentAcc.monthly_budget) : 8000,
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transfer', label: 'Money Transfer', icon: Send },
    { id: 'ai_scanner', label: 'AI Receipt Verifier', icon: Sparkles },
    { id: 'deposit_withdraw', label: 'Deposit & Cash', icon: ArrowDownUp },
    { id: 'transactions', label: 'Statement & Ledger', icon: History },
    { id: 'limits', label: 'Limits & Budget', icon: Sliders },
    { id: 'notifications', label: 'Security Advisories', icon: Bell, badge: alerts.length > 0 ? alerts.length : undefined },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Customer Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">Aegis</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Customer Portal
                </span>
              </div>
            </div>
          </div>

          {/* Account Persona Selector & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl py-1 px-3">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-semibold text-slate-500">Account</span>
                <select
                  value={currentAccountRef}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
                >
                  {accounts.map((acc) => (
                    <option key={acc.account_ref} value={acc.account_ref} className="bg-white text-slate-900">
                      {acc.account_ref} • {acc.customer_name} (₹{Number(acc.balance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => router.push('/ai-fraud')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Verify receipts and payment screenshots"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">AI Fraud Detection</span>
            </button>

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
            Banking Services
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
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white text-orange-600'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-200 px-3 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-bold uppercase ${currentAcc?.status === 'frozen' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {currentAcc?.status || 'Active'}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span>ID:</span>
              <span className="text-slate-800 font-bold">{currentAccountRef}</span>
            </div>
          </div>
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
                onClick={loadCustomerData}
                className="px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-50 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
              Loading customer details...
            </div>
          ) : !currentAcc ? (
            <div className="p-8 text-center text-slate-500 text-sm">Account not found.</div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <CustomerDashboardView
                  account={currentAcc}
                  limits={currentLimits}
                  transactions={transactions}
                  alerts={alerts}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'transfer' && (
                <TransferView
                  currentAccount={currentAcc}
                  allAccounts={accounts}
                  limits={currentLimits}
                  onSuccess={loadCustomerData}
                />
              )}

              {activeTab === 'ai_scanner' && (
                <div className="space-y-4">
                  <FraudDetectionPanel roleMode="Subject" />
                </div>
              )}

              {activeTab === 'deposit_withdraw' && (
                <DepositWithdrawView
                  currentAccount={currentAcc}
                  onSuccess={loadCustomerData}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionHistoryView
                  transactions={transactions}
                  currentAccountRef={currentAccountRef}
                />
              )}

              {activeTab === 'limits' && (
                <LimitsBudgetView
                  currentAccount={currentAcc}
                  limits={currentLimits}
                  onSuccess={loadCustomerData}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView alerts={alerts} account={currentAcc} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
