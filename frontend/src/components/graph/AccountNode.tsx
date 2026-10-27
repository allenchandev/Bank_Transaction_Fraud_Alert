'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Lock } from 'lucide-react';

interface AccountNodeData {
  accountRef: string;
  customerName: string;
  accountType: string;
  balance: number;
  status: 'active' | 'frozen' | 'closed';
  riskScore: number;
  inCycle: boolean;
  isBFSVisited?: boolean;
  hopDistance?: number;
}

export const AccountNode = memo(({ data }: { data: AccountNodeData }) => {
  const isCritical = data.riskScore >= 70;
  const isMedium = data.riskScore >= 40 && data.riskScore < 70;
  const isFrozen = data.status === 'frozen';

  let borderColor = 'border-slate-200';
  let glowEffect = 'shadow-xs';

  if (data.inCycle) {
    borderColor = 'border-orange-500 ring-2 ring-orange-400/40';
    glowEffect = 'shadow-md shadow-orange-500/20';
  } else if (data.isBFSVisited) {
    borderColor = 'border-blue-500 ring-2 ring-blue-400/30';
    glowEffect = 'shadow-md shadow-blue-500/15';
  } else if (isFrozen) {
    borderColor = 'border-amber-400';
  } else if (isCritical) {
    borderColor = 'border-rose-400';
  } else if (isMedium) {
    borderColor = 'border-amber-300';
  }

  return (
    <div
      className={`relative min-w-[190px] rounded-xl bg-white border ${borderColor} ${glowEffect} p-3 text-xs transition duration-150 cursor-pointer hover:border-orange-500 hover:shadow-md`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-orange-600 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-orange-600 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-mono font-bold text-slate-900 tracking-tight text-[11px]">
          {data.accountRef}
        </span>
        <div className="flex items-center gap-1">
          {data.hopDistance !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Hop {data.hopDistance}
            </span>
          )}
          {isFrozen ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Lock className="w-2.5 h-2.5" /> Frozen
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 capitalize">
              {data.accountType}
            </span>
          )}
        </div>
      </div>

      {/* Customer Name */}
      <div className="font-semibold text-slate-800 text-[11px] truncate mb-2">
        {data.customerName}
      </div>

      {/* Balance & Risk */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
        <div>
          <div className="text-[9px] uppercase font-mono text-slate-400">Balance</div>
          <div className="font-bold text-slate-900 text-[11px] font-mono">
            ${Number(data.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[9px] uppercase font-mono text-slate-400">Risk</div>
          <div
            className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
              data.riskScore >= 70
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : data.riskScore >= 40
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {data.riskScore}/100
          </div>
        </div>
      </div>
    </div>
  );
});

AccountNode.displayName = 'AccountNode';
