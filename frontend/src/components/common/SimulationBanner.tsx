'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { api } from '@/lib/api';

interface SimulationBannerProps {
  onReset?: () => void;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({ onReset }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [dbEngine, setDbEngine] = useState<string>('SQL');
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const checkConnection = async () => {
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
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (!confirm('Reset all demo banking accounts, balances, and transaction history to canonical seed state?')) {
      return;
    }
    setIsResetting(true);
    setResetMsg(null);
    try {
      const res = await api.resetDemoData();
      setResetMsg('Dataset successfully reset to initial seed state.');
      setTimeout(() => setResetMsg(null), 4000);
      if (onReset) onReset();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full bg-[#0a0f1d] border-b border-[#1e293b] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-bold tracking-wider text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          SIMULATION ENVIRONMENT — SYNTHETIC DATA
        </span>
        <span className="text-slate-400 hidden md:inline">
          Educational DSA fraud tracing simulation. No real funds or real banking networks are connected.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {resetMsg && (
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {resetMsg}
          </span>
        )}

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
          <Database className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-300 font-mono">{dbEngine} Engine</span>
          {dbStatus === 'online' ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Database Connected" />
          ) : dbStatus === 'offline' ? (
            <span className="w-2 h-2 rounded-full bg-rose-500" title="Backend API Disconnected" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Checking status" />
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition font-medium cursor-pointer disabled:opacity-50"
          title="Reset database to reproducible initial seed data for viva presentation"
        >
          <RefreshCw className={`w-3 h-3 text-cyan-400 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Resetting...' : 'Reset Seed Data'}
        </button>
      </div>
    </div>
  );
};
