'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ArrowRight,
  Database,
  Building2,
  Activity,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LandingGatewayPage() {
  const router = useRouter();
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [dbEngine, setDbEngine] = useState<string>('SQL');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.checkHealth();
        if (res.status === 'healthy') {
          setDbStatus('online');
          setDbEngine(res.database_engine || 'SQL');
        } else {
          setDbStatus('offline');
        }
      } catch {
        setDbStatus('offline');
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">Aegis Bank</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <Database className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-slate-600 font-medium">{dbEngine}</span>
            {dbStatus === 'online' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-rose-500" title="Offline" />
            )}
          </div>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-orange-600" /> Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Core Banking & Transaction Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          Aegis Banking & Intelligence
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Secure financial operations, real-time account management, and automated transaction monitoring in a clean unified interface.
        </p>

        {/* Portal Entry Options: Customer vs Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6 text-left">
          {/* Card 1: Customer Banking Portal */}
          <div
            onClick={() => router.push('/customer')}
            className="group p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 hover:border-orange-500/50 shadow-sm hover:shadow-md transition duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-105 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Customer Banking</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Manage accounts, send and receive money, deposit cash, view full statements, and configure daily transfer limits.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-slate-900">
              <span className="text-slate-500 font-normal">Customer Access</span>
              <span className="flex items-center gap-1.5 text-orange-600 font-bold group-hover:translate-x-0.5 transition">
                Open Portal <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: Admin Fraud Intelligence Console */}
          <div
            onClick={() => router.push('/admin')}
            className="group p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 hover:border-orange-500/50 shadow-sm hover:shadow-md transition duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4 group-hover:scale-105 transition">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Fraud Intelligence Console</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Investigate money flows, trace network transactions, analyze risk scores, manage active alerts, and freeze accounts.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-slate-900">
              <span className="text-slate-500 font-normal">Administrator Access</span>
              <span className="flex items-center gap-1.5 text-orange-600 font-bold group-hover:translate-x-0.5 transition">
                Open Console <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        © Aegis Bank Intelligence. All rights reserved.
      </footer>
    </div>
  );
}
