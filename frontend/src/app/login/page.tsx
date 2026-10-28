'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  User,
  ArrowRight,
  Lock,
  Building2,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Account } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsCustomer, loginAsAdmin } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountRef, setSelectedAccountRef] = useState<string>('ACC-2001');
  const [pinCode, setPinCode] = useState<string>('1234');
  const [showPin, setShowPin] = useState<boolean>(false);

  const [adminAccessCode, setAdminAccessCode] = useState<string>('aegis-admin');
  const [analystName, setAnalystName] = useState<string>('Lead Financial Crimes Analyst');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await api.getAccounts();
        setAccounts(res.accounts);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const acc = accounts.find((a) => a.account_ref === selectedAccountRef);
    if (!acc) {
      setErrorMsg('Please select a valid customer account.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      loginAsCustomer(acc.account_ref, acc.customer_name || 'Customer', acc.customer_email);
      router.push('/customer');
    }, 200);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAccessCode.trim().length === 0) {
      setErrorMsg('Please enter an access key.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      loginAsAdmin(analystName);
      router.push('/admin');
    }, 200);
  };

  const selectedAccObj = accounts.find((a) => a.account_ref === selectedAccountRef);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">Aegis Bank</span>
            <span className="text-[11px] font-medium ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Sign In
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          Back to Home
        </button>
      </header>

      {/* Main Sign In Box */}
      <div className="max-w-md w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Aegis</h1>
            <p className="text-sm text-slate-500 mt-1">Select your access role to proceed</p>
          </div>

          {/* Role Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              onClick={() => {
                setActiveTab('customer');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-orange-600" />
              Customer
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-orange-600" />
              Administrator
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {activeTab === 'customer' ? (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Account
                </label>
                <div className="relative">
                  <select
                    value={selectedAccountRef}
                    onChange={(e) => setSelectedAccountRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition cursor-pointer"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.account_ref} value={acc.account_ref}>
                        {acc.account_ref} • {acc.customer_name} (₹{Number(acc.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedAccObj && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Account Holder:</span>
                    <span className="font-semibold text-slate-900">{selectedAccObj.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Balance:</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{Number(selectedAccObj.balance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Account Type:</span>
                    <span className="capitalize font-semibold text-slate-900">{selectedAccObj.account_type}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Security PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition"
                    placeholder="Enter PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In as Customer'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Analyst Name
                </label>
                <input
                  type="text"
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Access Key
                </label>
                <input
                  type="password"
                  value={adminAccessCode}
                  onChange={(e) => setAdminAccessCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-orange-500 transition"
                  placeholder="Enter access key"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Enter Admin Console'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        © Aegis Bank Intelligence. Secure Session.
      </footer>
    </div>
  );
}
