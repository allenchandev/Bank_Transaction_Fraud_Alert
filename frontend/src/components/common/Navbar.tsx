'use client';

import React from 'react';
import { Shield, User, Landmark, ShieldCheck, ChevronDown, Activity } from 'lucide-react';
import { Account } from '@/types';

interface NavbarProps {
  currentMode: 'customer' | 'admin';
  onModeChange: (mode: 'customer' | 'admin') => void;
  accounts: Account[];
  selectedAccountRef: string;
  onSelectAccount: (accountRef: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onModeChange,
  accounts,
  selectedAccountRef,
  onSelectAccount,
}) => {
  const currentAcc = accounts.find((a) => a.account_ref === selectedAccountRef);

  return (
    <header className="w-full bg-[#0b1329] border-b border-[#1e293b] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-300">
                AEGIS
              </span>
              <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase">
                Bank Intelligence
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Fintech Simulation & Transaction Fraud Investigation</p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="hidden sm:flex items-center p-1 bg-[#070c18] rounded-xl border border-slate-800">
          <button
            onClick={() => onModeChange('customer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentMode === 'customer'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Customer Portal
          </button>
          <button
            onClick={() => onModeChange('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentMode === 'admin'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Fraud Console
          </button>
        </div>

        {/* Right side controls: Account Persona picker or Admin Badge */}
        <div className="flex items-center gap-3">
          {currentMode === 'customer' ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 px-2.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Demo Persona</span>
                <select
                  value={selectedAccountRef}
                  onChange={(e) => onSelectAccount(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
                >
                  {accounts.map((acc) => (
                    <option key={acc.account_ref} value={acc.account_ref} className="bg-slate-900 text-slate-200">
                      {acc.account_ref} • {acc.customer_name || 'Customer'} (${Number(acc.balance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-violet-950/40 border border-violet-800/50 rounded-lg py-1 px-3">
              <Activity className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <div className="text-right">
                <div className="text-xs font-semibold text-violet-200">Lead Fraud Analyst</div>
                <div className="text-[9px] text-violet-400/80 font-mono">FINCRIME-INVESTIGATOR-01</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Switcher Row */}
      <div className="sm:hidden flex border-t border-slate-800 bg-[#070c18] p-1.5">
        <button
          onClick={() => onModeChange('customer')}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded ${
            currentMode === 'customer' ? 'bg-cyan-600 text-white' : 'text-slate-400'
          }`}
        >
          Customer Portal
        </button>
        <button
          onClick={() => onModeChange('admin')}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded ${
            currentMode === 'admin' ? 'bg-violet-600 text-white' : 'text-slate-400'
          }`}
        >
          Admin Console
        </button>
      </div>
    </header>
  );
};
