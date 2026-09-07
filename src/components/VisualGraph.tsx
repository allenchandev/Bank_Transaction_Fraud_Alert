import React, { useMemo } from 'react';
import { Transaction, Account } from '../types';

interface VisualGraphProps {
  transactions: Transaction[];
  accounts: Account[];
  highlightedNodes?: Set<string>;
  highlightPath?: string[];
}

export default function VisualGraph({ transactions, accounts, highlightedNodes = new Set(), highlightPath = [] }: VisualGraphProps) {
  // Calculate a fixed circular layout for the nodes
  const layout = useMemo(() => {
    const radius = 220;
    const center = 250;
    const positions: Record<string, { x: number, y: number }> = {};
    
    accounts.forEach((acc, i) => {
      // Offset by -90 degrees so the first node is at the top
      const angle = (i / accounts.length) * 2 * Math.PI - (Math.PI / 2);
      positions[acc.id] = {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    });
    return positions;
  }, [accounts]);

  // Determine if a specific edge (transaction) is part of the highlighted path
  const isEdgeHighlighted = (senderId: string, receiverId: string) => {
    if (highlightPath.length === 0) return false;
    for (let i = 0; i < highlightPath.length - 1; i++) {
      if (highlightPath[i] === senderId && highlightPath[i+1] === receiverId) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="w-full overflow-hidden bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-center p-4">
      <svg viewBox="0 0 500 500" className="w-full max-w-2xl h-auto" style={{ maxHeight: '500px' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
          <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {/* Draw Edges */}
        {transactions.map((tx) => {
          const start = layout[tx.senderId];
          const end = layout[tx.receiverId];
          if (!start || !end) return null;

          const highlighted = isEdgeHighlighted(tx.senderId, tx.receiverId);
          
          return (
            <line
              key={tx.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={highlighted ? '#ef4444' : '#e5e7eb'}
              strokeWidth={highlighted ? 3 : 1.5}
              markerEnd={`url(#${highlighted ? 'arrowhead-highlight' : 'arrowhead'})`}
              className={highlighted ? 'opacity-100' : 'opacity-70'}
            />
          );
        })}

        {/* Draw Nodes */}
        {accounts.map((acc) => {
          const pos = layout[acc.id];
          if (!pos) return null;
          
          const isHighlighted = highlightedNodes.has(acc.id) || highlightPath.includes(acc.id);

          return (
            <g key={acc.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r="14"
                fill={isHighlighted ? '#fef2f2' : '#ffffff'}
                stroke={isHighlighted ? '#ef4444' : '#3b82f6'}
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-all duration-300"
              />
              <text
                y="-20"
                textAnchor="middle"
                className={`text-[10px] font-mono font-medium ${isHighlighted ? 'fill-red-600' : 'fill-neutral-500'}`}
              >
                {acc.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
