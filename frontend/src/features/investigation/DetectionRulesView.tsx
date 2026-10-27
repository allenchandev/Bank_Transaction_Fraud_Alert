'use client';

import React from 'react';
import { SlidersHorizontal, Repeat, Radio, Zap, AlertTriangle, Scale } from 'lucide-react';

export const DetectionRulesView: React.FC = () => {
  const rules = [
    {
      code: 'RULE_CYCLE_PARTICIPATION',
      name: 'Circular Transaction Loop',
      weight: '+35 pts',
      severity: 'HIGH / CRITICAL',
      icon: Repeat,
      description:
        'Detects closed circular money flows such as A → B → C → A, identifying potential artificial velocity inflation or circular structuring.',
    },
    {
      code: 'RULE_HIGH_DISPERSION',
      name: 'Multi-Party Fund Dispersion (Fan-Out)',
      weight: '+20 to +25 pts',
      severity: 'MEDIUM',
      icon: Radio,
      description:
        'Flags accounts that rapidly distribute received funds across 3 or more distinct counterparty destinations within short intervals.',
    },
    {
      code: 'RULE_PASSTHROUGH_FLOW',
      name: 'High Passthrough Transit Flow',
      weight: '+15 pts',
      severity: 'MEDIUM',
      icon: Zap,
      description:
        'Triggers when incoming volume closely matches outgoing volume (≥70% match) on substantial amounts, identifying transit passthrough accounts.',
    },
    {
      code: 'RULE_LIMIT_PROXIMITY',
      name: 'Near-Threshold Daily Limit Usage',
      weight: '+15 pts',
      severity: 'MEDIUM',
      icon: Scale,
      description:
        'Identifies accounts transferring ≥80% of their daily transfer limit, detecting structuring behavior attempting to skirt transaction caps.',
    },
    {
      code: 'RULE_BURST_ACTIVITY',
      name: 'High-Frequency Activity Burst',
      weight: '+15 pts',
      severity: 'MEDIUM',
      icon: AlertTriangle,
      description:
        'Flags sudden bursts of 3 or more outgoing transfers occurring in less than 5 minutes.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-orange-600" /> Fraud Detection Rules
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic risk heuristics used to calculate account risk scores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <div
              key={rule.code}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    {rule.weight}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {rule.severity}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{rule.name}</h3>
                <span className="text-[11px] font-mono text-slate-500 block mb-2">{rule.code}</span>
                <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
