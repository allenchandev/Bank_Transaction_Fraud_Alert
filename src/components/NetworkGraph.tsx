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
}

export default function NetworkGraph({
  accounts,
  transactions,
  cycles,
  rankings,
  selectedNode,
  onNodeClick,
  showCycles,
  reachableAccounts
}: NetworkGraphProps) {
  
  // 1. Calculate a circular layout for the nodes
  const layout = useMemo(() => {
    const radius = 280;
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

  // 3. Identify edges used in the fund trace (BFS Output)
  const bfsEdges = useMemo(() => {
    const edges = new Set<string>();
    if (selectedNode) {
      const hopsMap = new Map<string, number>();
      hopsMap.set(selectedNode, 0);
      reachableAccounts.forEach(r => hopsMap.set(r.node, r.hops));

      transactions.forEach(tx => {
        const senderHops = hopsMap.get(tx.senderId);
        const receiverHops = hopsMap.get(tx.receiverId);
        if (senderHops !== undefined && receiverHops !== undefined && receiverHops > senderHops) {
          edges.add(tx.id);
        }
      });
    }
    return edges;
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
    <div className="w-full h-full bg-neutral-900 overflow-hidden flex items-center justify-center relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      <svg viewBox="0 0 800 800" className="w-full h-full max-w-[800px] max-h-[800px] drop-shadow-2xl">
        <defs>
          <marker id="arrow-default" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
          </marker>
          <marker id="arrow-cycle" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
          </marker>
          <marker id="arrow-bfs" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
          
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Render Edges (Transactions) */}
        {transactions.map((tx) => {
          const start = layout[tx.senderId];
          const end = layout[tx.receiverId];
          if (!start || !end) return null;

          const isCycleEdge = showCycles && cycleEdges.has(`${tx.senderId}->${tx.receiverId}`);
          const isBfsEdge = bfsEdges.has(tx.id);
          
          let stroke = "#4b5563"; // default gray
          let strokeWidth = 1.5;
          let marker = "url(#arrow-default)";
          let opacity = 0.4;
          let filter = "none";

          if (isCycleEdge) {
            stroke = "#ef4444"; // red
            strokeWidth = 3;
            marker = "url(#arrow-cycle)";
            opacity = 1;
            filter = "url(#glow-red)";
          } else if (isBfsEdge) {
            stroke = "#3b82f6"; // blue
            strokeWidth = 2.5;
            marker = "url(#arrow-bfs)";
            opacity = 1;
          } else if (selectedNode || showCycles) {
            // fade out irrelevant edges if we are highlighting something
            opacity = 0.1;
          }

          // Use a curved path to handle bidirectional edges between the same two nodes gracefully
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;

          return (
            <path
              key={tx.id}
              d={`M ${start.x} ${start.y} A ${dr} ${dr} 0 0 1 ${end.x} ${end.y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={opacity}
              markerEnd={marker}
              filter={filter}
              className="transition-all duration-500"
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

          // Base node size on Risk Score (Sorting Algorithm Output)
          const baseRadius = 14;
          const radius = baseRadius + (data.risk / 10); // Scales up to 24
          
          let fill = "#1f2937"; // dark gray
          let stroke = "#4b5563"; // gray outline
          let strokeWidth = 2;
          let textColor = "#9ca3af";

          if (isSelected) {
            fill = "#eff6ff"; // light blue
            stroke = "#3b82f6"; // bright blue
            strokeWidth = 4;
            textColor = "#1d4ed8";
          } else if (isReachable) {
            fill = "#1e3a8a"; // deep blue
            stroke = "#3b82f6";
            strokeWidth = 2;
            textColor = "#bfdbfe";
          } else if (inHighlightedCycle) {
            fill = "#7f1d1d"; // deep red
            stroke = "#ef4444";
            strokeWidth = 3;
            textColor = "#fca5a5";
          }

          return (
            <g 
              key={acc.id} 
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onNodeClick(acc.id)}
              className="cursor-pointer group"
            >
              {/* Outer Hover Ring */}
              <circle r={radius + 8} fill="transparent" className="group-hover:fill-white/10 transition-colors" />
              
              <circle
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                className="transition-all duration-300 shadow-xl"
              />
              
              {/* Node ID label */}
              <text
                y={radius + 18}
                textAnchor="middle"
                className="text-[12px] font-medium tracking-wide transition-colors duration-300"
                fill={textColor}
              >
                {acc.name}
              </text>

              {/* Hop Badge (if reachable) */}
              {isReachable && (
                <g transform={`translate(${radius - 4}, ${-radius + 4})`}>
                  <circle r="8" fill="#3b82f6" />
                  <text y="3" textAnchor="middle" fill="white" className="text-[10px] font-bold">
                    {data.hops}
                  </text>
                </g>
              )}
              
              {/* Source Badge */}
              {isSelected && (
                <g transform={`translate(0, ${-radius - 12})`}>
                  <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#3b82f6" />
                  <text y="3" textAnchor="middle" fill="white" className="text-[9px] font-bold uppercase">
                    Source
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
