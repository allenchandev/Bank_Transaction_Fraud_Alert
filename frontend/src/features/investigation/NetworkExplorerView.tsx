'use client';

import React from 'react';
import { NetworkGraph } from '@/components/graph/NetworkGraph';
import { NetworkOverview } from '@/types';

interface NetworkExplorerViewProps {
  overview: NetworkOverview;
  onRefresh: () => void;
  onNavigateToInvestigation: (accountRef: string) => void;
}

export const NetworkExplorerView: React.FC<NetworkExplorerViewProps> = ({
  overview,
  onRefresh,
  onNavigateToInvestigation,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transaction Network Explorer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Interactive map of accounts and fund flows with automated cycle detection and flow tracing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Accounts: <strong className="text-slate-900">{overview.graph.nodes.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Transactions: <strong className="text-orange-600">{overview.graph.edges.length}</strong>
          </span>
        </div>
      </div>

      <NetworkGraph
        initialNodes={overview.graph.nodes}
        initialEdges={overview.graph.edges}
        dfsResults={overview.dfs_results}
        onRefresh={onRefresh}
        onNavigateToInvestigation={onNavigateToInvestigation}
      />
    </div>
  );
};
