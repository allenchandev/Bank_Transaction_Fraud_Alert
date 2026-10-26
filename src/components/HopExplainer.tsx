import React from 'react';
import { ChevronRight, ArrowRight, Info, Layers, Users, Zap } from 'lucide-react';
import { ReachableAccount } from '../types';

interface HopExplainerProps {
  originNode: string | null;
  originName: string;
  bfsHops: number;
  setBfsHops: (hops: number) => void;
  reachableAccounts: ReachableAccount[];
  getAccountName: (id: string) => string;
  activeHopFilter: number | null;
  setActiveHopFilter: (hop: number | null) => void;
}

const HOP_LEVEL_INFO: Record<number, { title: string; subtitle: string; color: string; bg: string; border: string; text: string; badge: string }> = {
  1: {
    title: "Hop 1: Direct Recipients",
    subtitle: "Received funds straight from the source account (1 degree)",
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500"
  },
  2: {
    title: "Hop 2: Secondary Intermediaries (Mules)",
    subtitle: "Received funds from Hop 1 recipients (2 degrees away)",
    color: "#8b5cf6",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    badge: "bg-purple-500"
  },
  3: {
    title: "Hop 3: Layering Tier 3",
    subtitle: "Passed through 3 separate intermediary accounts",
    color: "#ec4899",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    badge: "bg-pink-500"
  },
  4: {
    title: "Hop 4: Distant Dispersal",
    subtitle: "Deep shell layer (4 degrees of separation)",
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500"
  },
  5: {
    title: "Hop 5+: Outer Perimeter",
    subtitle: "5 transfers removed from origin",
    color: "#10b981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500"
  }
};

export default function HopExplainer({
  originNode,
  originName,
  bfsHops,
  setBfsHops,
  reachableAccounts,
  getAccountName,
  activeHopFilter,
  setActiveHopFilter
}: HopExplainerProps) {
  // Group accounts by hop count
  const accountsByHop = React.useMemo(() => {
    const groups: Record<number, ReachableAccount[]> = {};
    for (let i = 1; i <= bfsHops; i++) {
      groups[i] = [];
    }
    reachableAccounts.forEach(acc => {
      if (acc.hops <= bfsHops) {
        if (!groups[acc.hops]) groups[acc.hops] = [];
        groups[acc.hops].push(acc);
      }
    });
    return groups;
  }, [reachableAccounts, bfsHops]);

  return (
    <div className="space-y-4">
      {/* What is a Hop? Intuitive Callout */}
      <div className="rounded-xl p-3.5 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-neutral-900 border border-blue-500/20 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
              <span>What is a "Hop"?</span>
              <span className="text-[10px] text-blue-400 font-normal px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">BFS Distance</span>
            </div>
            <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
              A <strong>Hop</strong> is simply <strong>one transfer step</strong>. 
              If <span className="text-blue-300 font-medium">Account A</span> sends money to <span className="text-purple-300 font-medium">B</span>, that’s <strong>1 hop</strong>. 
              If <span className="text-purple-300 font-medium">B</span> then sends to <span className="text-pink-300 font-medium">C</span>, <span className="text-pink-300 font-medium">C</span> is <strong>2 hops</strong> away from A.
            </p>
          </div>
        </div>
      </div>

      {/* Stepper / Slider Selector */}
      <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Traversal Depth (Search Radius)
          </span>
          <span className="font-bold text-blue-400 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[11px]">
            {bfsHops} {bfsHops === 1 ? 'Hop' : 'Hops'} Deep
          </span>
        </div>

        {/* Quick Stepper Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((hop) => {
            const isSelected = bfsHops === hop;
            return (
              <button
                key={hop}
                type="button"
                onClick={() => setBfsHops(hop)}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400' 
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700/80 hover:text-neutral-200 border border-neutral-700/50'
                }`}
              >
                <span className="text-[11px]">Lvl {hop}</span>
                <span className="text-[9px] opacity-75">{hop === 1 ? 'Direct' : `${hop} txs`}</span>
              </button>
            );
          })}
        </div>

        {/* Linear Visual Chain Illustration */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 px-1">
          <span className="flex items-center gap-1 text-blue-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Origin
          </span>
          <ArrowRight className="w-3 h-3 text-neutral-600" />
          <span className="text-blue-400 font-medium">Hop 1 (Direct)</span>
          <ArrowRight className="w-3 h-3 text-neutral-600" />
          <span className="text-purple-400 font-medium">Hop 2 (Mule)</span>
          <ArrowRight className="w-3 h-3 text-neutral-600" />
          <span className="text-pink-400 font-medium">Hop 3 (Dispersal)</span>
        </div>
      </div>

      {/* Filter / Drill-down Cards per Hop Level */}
      {originNode ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Discovered Path Breakdown ({reachableAccounts.length} Total)
            </span>
            {activeHopFilter !== null && (
              <button 
                onClick={() => setActiveHopFilter(null)}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Show All Hops
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {Array.from({ length: bfsHops }, (_, i) => i + 1).map((hop) => {
              const list = accountsByHop[hop] || [];
              const meta = HOP_LEVEL_INFO[hop] || HOP_LEVEL_INFO[5];
              const isFiltered = activeHopFilter === hop;

              return (
                <div
                  key={hop}
                  onClick={() => setActiveHopFilter(isFiltered ? null : hop)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isFiltered 
                      ? 'border-blue-500 bg-neutral-800/90 shadow-md ring-1 ring-blue-500' 
                      : `${meta.border} bg-neutral-900/50 hover:bg-neutral-800/60`
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white ${meta.badge}`}>
                        {hop}
                      </span>
                      <div>
                        <span className={`text-xs font-bold ${meta.text}`}>{meta.title}</span>
                        <span className="text-[10px] text-neutral-400 block">{meta.subtitle}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {list.length} {list.length === 1 ? 'account' : 'accounts'}
                    </span>
                  </div>

                  {/* Account chips */}
                  {list.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-neutral-800">
                      {list.map(acc => (
                        <span 
                          key={acc.node} 
                          className="text-[11px] px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-200 border border-neutral-700 font-mono flex items-center gap-1"
                        >
                          <span>{getAccountName(acc.node)}</span>
                          <span className="text-[9px] text-neutral-500">({acc.node})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 italic mt-1">
                      No accounts found at exactly {hop} hop{hop > 1 ? 's' : ''} distance.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-neutral-700 text-center space-y-1">
          <p className="text-xs text-neutral-300 font-medium">No Origin Account Selected</p>
          <p className="text-[11px] text-neutral-500">
            Click on any account in the graph or the risk list below to trace where its money flows hop-by-hop.
          </p>
        </div>
      )}
    </div>
  );
}
