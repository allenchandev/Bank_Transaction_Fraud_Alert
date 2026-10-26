import React, { useMemo } from 'react';
import { Transaction, Account, Cycle, ReachableAccount, AccountRanking } from '../types';

interface NetworkGraphProps {
  accounts: Account[];
  transactions: Transaction[];
  cycles: Cycle[];
  rankings: AccountRanking[];
  selectedNode: string | null;
  onNodeClick: (nodeId: string) => void;
  showCycles: boolean;
  reachableAccounts: ReachableAccount[];
  activeHopFilter?: number | null; // filter by exact hop tier if selected
}

// Visual color palette for distinct hop levels
const HOP_PALETTES = [
  { fill: '#3b82f6', border: '#60a5fa', text: '#bfdbfe', badge: '#2563eb' }, // Hop 1: Electric Blue (Direct recipient)
  { fill: '#8b5cf6', border: '#a78bfa', text: '#ddd6fe', badge: '#7c3aed' }, // Hop 2: Violet/Purple (2nd degree)
  { fill: '#ec4899', border: '#f472b6', text: '#fbcfe8', badge: '#db2777' }, // Hop 3: Pink (3rd degree)
  { fill: '#f59e0b', border: '#fbbf24', text: '#fde68a', badge: '#d97706' }, // Hop 4: Amber (4th degree)
  { fill: '#10b981', border: '#34d399', text: '#a7f3d0', badge: '#059669' }, // Hop 5: Emerald (5th degree)
];

export default function NetworkGraph({
  accounts,
  transactions,
  cycles,
  rankings,
  selectedNode,
  onNodeClick,
  showCycles,
  reachableAccounts,
  activeHopFilter = null
}: NetworkGraphProps) {
  
  // 1. Calculate a circular layout for the nodes
  const layout = useMemo(() => {
    const radius = 285;
    const center = 400;
    const positions: Record<string, { x: number, y: number }> = {};
    
    accounts.forEach((acc, i) => {
      const angle = (i / accounts.length) * 2 * Math.PI - (Math.PI / 2);
      positions[acc.id] = {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    });
    return positions;
  }, [accounts]);

  // 2. Identify edges and nodes that form money laundering cycles (DFS Output)
  const { cycleEdges, cycleNodes } = useMemo(() => {
    const edges = new Set<string>();
    const nodes = new Set<string>();
    cycles.forEach(c => {
      c.path.forEach(node => nodes.add(node));
      for (let i = 0; i < c.path.length - 1; i++) {
        edges.add(`${c.path[i]}->${c.path[i+1]}`);
      }
    });
    return { cycleEdges: edges, cycleNodes: nodes };
  }, [cycles]);

  // 3. Map BFS reachability with exact hop counts & identify BFS active edges
  const { bfsEdges, hopsMap } = useMemo(() => {
    const edges = new Set<string>();
    const hMap = new Map<string, number>();
    
    if (selectedNode) {
      hMap.set(selectedNode, 0);
      reachableAccounts.forEach(r => hMap.set(r.node, r.hops));

      transactions.forEach(tx => {
        const senderHops = hMap.get(tx.senderId);
        const receiverHops = hMap.get(tx.receiverId);
        if (senderHops !== undefined && receiverHops !== undefined && receiverHops > senderHops) {
          edges.add(tx.id);
        }
      });
    }
    return { bfsEdges: edges, hopsMap: hMap };
  }, [selectedNode, reachableAccounts, transactions]);

  // 4. Map Risk Scores and Reachability for quick node styling
  const nodeData = useMemo(() => {
    const map = new Map<string, { risk: number, hops?: number }>();
    rankings.forEach(r => map.set(r.node, { risk: r.riskScore }));
    reachableAccounts.forEach(r => {
      const data = map.get(r.node);
      if (data) data.hops = r.hops;
    });
    if (selectedNode) {
      const data = map.get(selectedNode);
      if (data) data.hops = 0; // Source is hop 0
    }
    return map;
  }, [rankings, reachableAccounts, selectedNode]);

  return (
    <div className="w-full h-full bg-[#0a0d14] overflow-hidden flex items-center justify-center relative select-none">
      {/* Background Radar / Concentric Rings & Dot Grid */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', 
          backgroundSize: '36px 36px' 
        }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#0a0d14]/60 to-[#0a0d14] pointer-events-none" />
      
      <svg viewBox="0 0 800 800" className="w-full h-full max-w-[850px] max-h-[850px] drop-shadow-2xl">
        <defs>
          {/* Subtle concentric orbit rings */}
          <radialGradient id="node-sheen" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
          </radialGradient>

          <marker id="arrow-default" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#374151" />
          </marker>
          <marker id="arrow-cycle" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
          </marker>
          <marker id="arrow-bfs-1" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="arrow-bfs-2" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#8b5cf6" />
          </marker>
          <marker id="arrow-bfs-3" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ec4899" />
          </marker>
          <marker id="arrow-bfs-other" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
          </marker>
          
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Ring Canvas Guides */}
        <circle cx="400" cy="400" r="285" fill="none" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        <circle cx="400" cy="400" r="180" fill="none" stroke="#1f2937" strokeWidth="1" strokeDasharray="2 6" opacity="0.2" />

        {/* Render Edges (Transactions) */}
        {transactions.map((tx) => {
          const start = layout[tx.senderId];
          const end = layout[tx.receiverId];
          if (!start || !end) return null;

          const isCycleEdge = showCycles && cycleEdges.has(`${tx.senderId}->${tx.receiverId}`);
          const isBfsEdge = bfsEdges.has(tx.id);
          const receiverHop = hopsMap.get(tx.receiverId);
          
          const isDimmedByFilter = activeHopFilter !== null && isBfsEdge && receiverHop !== activeHopFilter;

          let stroke = "#374151"; 
          let strokeWidth = 1.2;
          let marker = "url(#arrow-default)";
          let opacity = 0.35;
          let filter = "none";
          let strokeDasharray = "none";

          if (isCycleEdge) {
            stroke = "#ef4444"; 
            strokeWidth = 3;
            marker = "url(#arrow-cycle)";
            opacity = 1;
            filter = "url(#glow-red)";
          } else if (isBfsEdge) {
            opacity = isDimmedByFilter ? 0.15 : 1;
            strokeWidth = isDimmedByFilter ? 1.5 : 3;

            if (receiverHop === 1) {
              stroke = "#3b82f6";
              marker = "url(#arrow-bfs-1)";
            } else if (receiverHop === 2) {
              stroke = "#8b5cf6";
              marker = "url(#arrow-bfs-2)";
            } else if (receiverHop === 3) {
              stroke = "#ec4899";
              marker = "url(#arrow-bfs-3)";
            } else {
              stroke = "#f59e0b";
              marker = "url(#arrow-bfs-other)";
            }
            if (!isDimmedByFilter) filter = "url(#glow-blue)";
          } else if (selectedNode || showCycles) {
            opacity = 0.08;
          }

          // Curved path
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;

          return (
            <path
              key={tx.id}
              d={`M ${start.x} ${start.y} A ${dr} ${dr} 0 0 1 ${end.x} ${end.y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              opacity={opacity}
              markerEnd={marker}
              filter={filter}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Render Nodes (Accounts) */}
        {accounts.map((acc) => {
          const pos = layout[acc.id];
          if (!pos) return null;
          
          const data = nodeData.get(acc.id) || { risk: 0 };
          const isSelected = selectedNode === acc.id;
          const isReachable = data.hops !== undefined && data.hops > 0;
          const inHighlightedCycle = showCycles && cycleNodes.has(acc.id);

          // Focus filter check
          const isFilteredOut = activeHopFilter !== null && isReachable && data.hops !== activeHopFilter;

          // Base node size on Risk Score
          const baseRadius = 15;
          const radius = baseRadius + (data.risk / 11);
          
          let fill = "#111827"; 
          let stroke = "#374151"; 
          let strokeWidth = 2;
          let textColor = "#9ca3af";
          let badgeColor = "#3b82f6";

          if (isSelected) {
            fill = "#1d4ed8"; 
            stroke = "#60a5fa"; 
            strokeWidth = 3.5;
            textColor = "#93c5fd";
          } else if (isReachable) {
            const hopIdx = Math.min((data.hops || 1) - 1, HOP_PALETTES.length - 1);
            const palette = HOP_PALETTES[hopIdx];
            fill = isFilteredOut ? "#1f2937" : "#0f172a";
            stroke = isFilteredOut ? "#374151" : palette.border;
            strokeWidth = isFilteredOut ? 1.5 : 2.5;
            textColor = isFilteredOut ? "#6b7280" : palette.text;
            badgeColor = palette.badge;
          } else if (inHighlightedCycle) {
            fill = "#7f1d1d";
            stroke = "#ef4444";
            strokeWidth = 3;
            textColor = "#fca5a5";
          } else if (selectedNode || showCycles) {
            textColor = "#4b5563";
            stroke = "#1f2937";
          }

          return (
            <g 
              key={acc.id} 
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onNodeClick(acc.id)}
              className="cursor-pointer group"
              opacity={isFilteredOut ? 0.35 : 1}
            >
              {/* Outer Pulse Wave for Source Node */}
              {isSelected && (
                <circle
                  r={radius + 12}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Interactive Hover Ring */}
              <circle 
                r={radius + 8} 
                fill="transparent" 
                className="group-hover:fill-blue-500/10 group-hover:stroke-blue-400/30 group-hover:stroke-1 transition-all" 
              />
              
              {/* Core Node Circle */}
              <circle
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                className="transition-all duration-300 shadow-xl"
              />
              
              {/* Sheen Overlay for 3D tactile feel */}
              <circle
                r={radius}
                fill="url(#node-sheen)"
                pointerEvents="none"
              />
              
              {/* Node ID label */}
              <text
                y={radius + 17}
                textAnchor="middle"
                className="text-[12px] font-semibold tracking-wide transition-colors duration-200"
                fill={textColor}
              >
                {acc.name}
              </text>

              {/* Hop Badge (Color-coded by level) */}
              {isReachable && (
                <g transform={`translate(${radius - 3}, ${-radius + 3})`}>
                  <circle r="9" fill={badgeColor} stroke="#0a0d14" strokeWidth="1.5" />
                  <text y="3" textAnchor="middle" fill="#ffffff" className="text-[10px] font-black">
                    {data.hops}
                  </text>
                </g>
              )}
              
              {/* Source Tag Badge */}
              {isSelected && (
                <g transform={`translate(0, ${-radius - 13})`}>
                  <rect x="-26" y="-9" width="52" height="18" rx="9" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
                  <text y="3.5" textAnchor="middle" fill="#ffffff" className="text-[9px] font-extrabold uppercase tracking-wider">
                    SOURCE
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
