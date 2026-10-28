'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/AIFraudDetection/Header';
import { FraudDetectionPanel } from '@/components/AIFraudDetection/FraudDetectionPanel';
import { DocumentIntelligenceView } from '@/components/DocumentIntelligence/DocumentIntelligenceView';
import type { RoleMode } from '@/types';
import { Home, Building2, ShieldAlert } from 'lucide-react';

export default function StandaloneAiFraudPage() {
  const router = useRouter();
  const [roleMode, setRoleMode] = useState<RoleMode>('Auditor');
  const [activeTab, setActiveTab] = useState<'fraud' | 'documents'>('fraud');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [activeConflicts, setActiveConflicts] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar with quick back navigation to Core Banking */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 hover:text-white font-semibold transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-orange-500" />
            <span>Aegis Home</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1.5 hover:text-white font-semibold transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
            <span>Admin Console</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => router.push('/customer')}
            className="flex items-center gap-1.5 hover:text-white font-semibold transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-orange-500" />
            <span>Customer Portal</span>
          </button>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Module: AI Forensic Verification · Bayes · AO* Graph · DSU Union-Find
        </div>
      </div>

      {/* Identical Thematic Header from the AI Fraud Detection project */}
      <Header
        roleMode={roleMode}
        onRoleModeChange={(r) => setRoleMode(r)}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        onOpenConflicts={() => setIsConflictModalOpen(true)}
        conflictCount={activeConflicts.length}
      />

      {/* Main Inspection View */}
      {activeTab === 'fraud' ? (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <FraudDetectionPanel roleMode={roleMode} />
        </main>
      ) : (
        <DocumentIntelligenceView
          roleMode={roleMode}
          isConflictModalOpen={isConflictModalOpen}
          setIsConflictModalOpen={setIsConflictModalOpen}
          activeConflicts={activeConflicts}
          setActiveConflicts={setActiveConflicts}
        />
      )}
    </div>
  );
}
