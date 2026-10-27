'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import { AccountNode } from './AccountNode';
import { TransactionEdge } from './TransactionEdge';
import {
  Play,
  RotateCcw,
  ShieldAlert,
  X,
  Lock,
  Unlock,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { DFSResult, BFSResult } from '@/types';
import { api } from '@/lib/api';

const nodeTypes = {
  accountNode: AccountNode,
};

const edgeTypes = {
  transactionEdge: TransactionEdge,
};

interface NetworkGraphProps {
  initialNodes: any[];
  initialEdges: any[];
  dfsResults?: DFSResult;
  onRefresh?: () => void;
  onNavigateToInvestigation?: (accountRef: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  initialNodes,
  initialEdges,
  dfsResults,
  onRefresh,
  onNavigateToInvestigation,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when initialNodes or initialEdges change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Selected account for inspector drawer
  const [selectedAccountRef, setSelectedAccountRef] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // DFS state
  const [activeDfsResult, setActiveDfsResult] = useState<DFSResult | null>(dfsResults || null);
  const [isDfsRunning, setIsDfsRunning] = useState(false);
  const [showDfsTraceModal, setShowDfsTraceModal] = useState(false);

  // BFS state
  const [bfsMaxHops, setBfsMaxHops] = useState<number>(2);
  const [activeBfsResult, setActiveBfsResult] = useState<BFSResult | null>(null);
  const [isBfsRunning, setIsBfsRunning] = useState(false);
  const [showBfsTraceModal, setShowBfsTraceModal] = useState(false);

  // Action status (freeze/unfreeze)
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Node selection handler
  const onNodeClick = useCallback(async (_: any, node: any) => {
    const ref = node.id;
    setSelectedAccountRef(ref);
    setIsLoadingDetails(true);
    try {
      const details = await api.getAccountInvestigation(ref);
      setAccountDetails(details);
    } catch (err) {
      console.error('Failed to fetch node details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Run DFS Cycle Detection
  const handleRunDFS = async () => {
    setIsDfsRunning(true);
    try {
      const res = await api.runDFS();
      setActiveDfsResult(res);
      setActiveBfsResult(null);

      const cycleNodes = new Set(res.participating_accounts);
      const cycleEdgePairs = new Set(res.cycles.flatMap((c) => {
        const pairs = [];
        for (let i = 0; i < c.length - 1; i++) {
          pairs.push(`${c[i]}->${c[i + 1]}`);
        }
        return pairs;
      }));

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            inCycle: cycleNodes.has(n.id),
            isBFSVisited: false,
            hopDistance: undefined,
          },
        }))
      );

      setEdges((eds) =>
        eds.map((e) => {
          const isCycle = cycleEdgePairs.has(`${e.source}->${e.target}`);
          return {
            ...e,
            animated: isCycle,
            data: {
              ...e.data,
              isCycleEdge: isCycle,
              isBFSPath: false,
            },
          };
        })
      );
    } catch (err: any) {
      alert(`Cycle detection failed: ${err.message}`);
    } finally {
      setIsDfsRunning(false);
    }
  };

  // Run BFS Fund Tracing
  const handleRunBFS = async () => {
    const sourceRef = selectedAccountRef || (nodes[0] ? nodes[0].id : null);
    if (!sourceRef) {
      alert('Please click on an account node to trace fund flow.');
      return;
    }

    setIsBfsRunning(true);
    try {
      const res = await api.runBFS(sourceRef, bfsMaxHops);
      setActiveBfsResult(res);
      setActiveDfsResult(null);

      const reachedMap = new Map<string, number>();
      reachedMap.set(sourceRef, 0);
      res.reachable_nodes.forEach((rn) => {
        reachedMap.set(rn.account_ref, rn.hop_distance);
      });

      const bfsEdges = new Set(
        res.highlighted_edges.map((e) => `${e.source}->${e.target}`)
      );

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            inCycle: false,
            isBFSVisited: reachedMap.has(n.id),
            hopDistance: reachedMap.get(n.id),
          },
        }))
      );

      setEdges((eds) =>
        eds.map((e) => {
          const isBFS = bfsEdges.has(`${e.source}->${e.target}`);
          return {
            ...e,
            animated: isBFS,
            data: {
              ...e.data,
              isCycleEdge: false,
              isBFSPath: isBFS,
            },
          };
        })
      );
    } catch (err: any) {
      alert(`Fund tracing failed: ${err.message}`);
    } finally {
      setIsBfsRunning(false);
    }
  };

  const handleResetHighlights = () => {
    setActiveDfsResult(null);
    setActiveBfsResult(null);
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  const handleToggleFreeze = async (accountRef: string, currentStatus: string) => {
    setActionMsg(null);
    try {
      if (currentStatus === 'frozen') {
        await api.unfreezeAccount(accountRef, 'Reactivated by analyst');
        setActionMsg(`Account ${accountRef} has been reactivated.`);
      } else {
        await api.freezeAccount(accountRef, 'Administrative hold based on risk review');
        setActionMsg(`Account ${accountRef} has been placed on hold.`);
      }

      if (accountDetails && accountDetails.account) {
        setAccountDetails({
          ...accountDetails,
          account: {
            ...accountDetails.account,
            status: currentStatus === 'frozen' ? 'active' : 'frozen',
          },
        });
      }

      setNodes((nds) =>
        nds.map((n) =>
          n.id === accountRef
            ? { ...n, data: { ...n.data, status: currentStatus === 'frozen' ? 'active' : 'frozen' } }
            : n
        )
      );

      if (onRefresh) onRefresh();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex shadow-xs">
      {/* Top Controls Toolbar */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-sm max-w-[90%]">
        {/* DFS Button */}
        <button
          onClick={handleRunDFS}
          disabled={isDfsRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          title="Detect circular transactions in the network"
        >
          <Play className={`w-3.5 h-3.5 ${isDfsRunning ? 'animate-spin' : ''}`} />
          {isDfsRunning ? 'Scanning...' : 'Detect Cycles'}
        </button>

        {/* BFS Blast Radius Group */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
          <span className="text-xs font-semibold text-slate-700">Hops:</span>
          <input
            type="range"
            min="1"
            max="4"
            value={bfsMaxHops}
            onChange={(e) => setBfsMaxHops(parseInt(e.target.value))}
            className="w-16 accent-orange-600 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-slate-900 w-3">{bfsMaxHops}</span>
          <button
            onClick={handleRunBFS}
            disabled={isBfsRunning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition cursor-pointer disabled:opacity-50 border border-slate-200 shadow-2xs"
            title="Trace outbound money flow outward"
          >
            <Radio className="w-3 h-3 text-orange-600" />
            {isBfsRunning ? 'Tracing...' : 'Trace Flow'}
          </button>
        </div>

        {/* Reset button */}
        <button
          onClick={handleResetHighlights}
          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
          title="Reset highlighting"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Right Active Analysis Banner */}
      {activeDfsResult && activeDfsResult.cycle_count > 0 && (
        <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-md border border-orange-300 p-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-orange-700">
              {activeDfsResult.cycle_count} Circular Loop(s) Found
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              {activeDfsResult.cycles.map((c) => c.join(' → ')).join(' | ')}
            </div>
          </div>
          <button
            onClick={() => setShowDfsTraceModal(true)}
            className="text-xs font-semibold px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition cursor-pointer"
          >
            View Steps
          </button>
        </div>
      )}

      {activeBfsResult && (
        <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-md border border-blue-300 p-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-3">
          <Radio className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
          <div className="text-xs">
            <div className="font-bold text-blue-700">
              Flow Reach: {activeBfsResult.blast_radius_count} Accounts Connected
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              Source: {activeBfsResult.source} ({activeBfsResult.max_hops} Hops)
            </div>
          </div>
          <button
            onClick={() => setShowBfsTraceModal(true)}
            className="text-xs font-semibold px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition cursor-pointer"
          >
            View Steps
          </button>
        </div>
      )}

      {/* React Flow Core Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          }}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls position="bottom-left" />
          <MiniMap
            nodeColor={(node: any) => {
              if (node.data?.inCycle) return '#ea580c';
              if (node.data?.riskScore >= 70) return '#e11d48';
              if (node.data?.riskScore >= 40) return '#d97706';
              return '#10b981';
            }}
            maskColor="rgba(241, 245, 249, 0.7)"
            className="!bg-white !border !border-slate-200 rounded-lg overflow-hidden shadow-xs"
          />
        </ReactFlow>
      </div>

      {/* Slide-Over Account Inspector Drawer */}
      {selectedAccountRef && (
        <div className="w-80 md:w-96 bg-white border-l border-slate-200 p-4 overflow-y-auto z-40 flex flex-col shadow-lg transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase text-orange-600">Account Details</span>
              <h3 className="text-base font-extrabold text-slate-900 font-mono">{selectedAccountRef}</h3>
            </div>
            <button
              onClick={() => setSelectedAccountRef(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionMsg && (
            <div className="my-2 p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs">
              {actionMsg}
            </div>
          )}

          {isLoadingDetails ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading details...</div>
          ) : accountDetails ? (
            <div className="py-3 space-y-4 flex-1 text-xs">
              {/* Profile Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{accountDetails.account.customer_name}</div>
                    <div className="text-[11px] text-slate-500">{accountDetails.account.customer_email}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      accountDetails.account.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {accountDetails.account.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Balance:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      ${Number(accountDetails.account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Type:</span>
                    <span className="capitalize text-slate-800 font-medium">{accountDetails.account.account_type}</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment Breakdown */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Risk Assessment</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                      accountDetails.risk_assessment.risk_score >= 70
                        ? 'bg-rose-100 text-rose-700'
                        : accountDetails.risk_assessment.risk_score >= 40
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {accountDetails.risk_assessment.risk_score}/100
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {accountDetails.risk_assessment.plain_explanation}
                </p>

                {accountDetails.risk_assessment.triggered_rules && accountDetails.risk_assessment.triggered_rules.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500">Triggered Rules:</span>
                    {accountDetails.risk_assessment.triggered_rules.map((rule: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{rule.name}</span>
                          <span className="text-orange-600 font-mono">+{rule.points} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{rule.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Network Graph Metrics */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Transaction Metrics
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Senders</span>
                    <span className="text-slate-900 font-bold font-mono">
                      {accountDetails.risk_assessment.metrics.in_degree}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Recipients</span>
                    <span className="text-slate-900 font-bold font-mono">
                      {accountDetails.risk_assessment.metrics.out_degree}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Total Inflow</span>
                    <span className="text-emerald-600 font-bold font-mono">
                      ${accountDetails.risk_assessment.metrics.incoming_volume.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Total Outflow</span>
                    <span className="text-orange-600 font-bold font-mono">
                      ${accountDetails.risk_assessment.metrics.outgoing_volume.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Controls */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() =>
                    handleToggleFreeze(selectedAccountRef, accountDetails.account.status)
                  }
                  className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    accountDetails.account.status === 'frozen'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  }`}
                >
                  {accountDetails.account.status === 'frozen' ? (
                    <>
                      <Unlock className="w-4 h-4" /> Unfreeze Account
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Freeze Account
                    </>
                  )}
                </button>

                {onNavigateToInvestigation && (
                  <button
                    onClick={() => onNavigateToInvestigation(selectedAccountRef)}
                    className="w-full py-2.5 px-3 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    Open Investigation Dossier <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* DFS Modal */}
      {showDfsTraceModal && activeDfsResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Cycle Detection Steps</h3>
              </div>
              <button
                onClick={() => setShowDfsTraceModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 text-xs text-slate-600">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl mb-3">
                <div className="font-bold text-orange-800">Detected Cycle:</div>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  {activeDfsResult.cycles.map((c) => c.join(' → ')).join(' | ')}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {activeDfsResult.trace.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border ${
                    step.action === 'CYCLE_DETECTED'
                      ? 'bg-orange-50 border-orange-300 text-orange-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-0.5">Step {step.step}: {step.action}</div>
                  <div className="text-slate-600">{step.description}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowDfsTraceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BFS Modal */}
      {showBfsTraceModal && activeBfsResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Fund Flow Traversal Steps</h3>
              </div>
              <button
                onClick={() => setShowBfsTraceModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3">
                <div className="font-bold text-blue-800">Connected Accounts:</div>
                <div className="font-mono text-slate-900 text-xs mt-1">
                  {activeBfsResult.reachable_nodes.map((rn) => `${rn.account_ref} (Hop ${rn.hop_distance})`).join(', ') || 'No connected accounts found within hop limit.'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {activeBfsResult.trace.map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-900">Step {step.step}: {step.action}</span>
                    {step.queue_state && (
                      <span className="text-[11px] text-slate-500 font-mono">Queue: [{step.queue_state.join(', ')}]</span>
                    )}
                  </div>
                  <div className="text-slate-600">{step.description}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowBfsTraceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
