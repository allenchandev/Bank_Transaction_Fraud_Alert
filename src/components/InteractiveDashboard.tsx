import React, { useState, useMemo, useEffect } from 'react';
import NetworkGraph from './NetworkGraph';
import HopExplainer from './HopExplainer';
import { mockTransactions, mockAccounts } from '../lib/mockData';
import { buildGraph, fetchPythonDFS, fetchPythonBFS, rankAccounts } from '../lib/graph';
import { Cycle, ReachableAccount } from '../types';
import { 
  ShieldAlert, RefreshCw, Target, BarChart3, HelpCircle, 
  X, AlertTriangle, ArrowRight, Layers, Sparkles, Filter
} from 'lucide-react';

export default function InteractiveDashboard() {
  // Application State
  const [selectedNode, setSelectedNode] = useState<string | null>('ACC008'); // default to ACC008 (key hub) so user sees instant value!
  const [showCycles, setShowCycles] = useState(false);
  const [bfsHops, setBfsHops] = useState(3);
  const [activeHopFilter, setActiveHopFilter] = useState<number | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);

  // Backend Engine Status & Algorithm Data State
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [reachableAccounts, setReachableAccounts] = useState<ReachableAccount[]>([]);
  const [pythonStatus, setPythonStatus] = useState<'connected' | 'offline' | 'loading'>('loading');

  // Compute Base Graph
  const graph = useMemo(() => buildGraph(mockTransactions), []);

  // Fetch DFS Cycle Detection from Python Engine
  useEffect(() => {
    let isMounted = true;
    fetchPythonDFS(graph).then(res => {
      if (isMounted) {
        setCycles(res.cycles);
        setPythonStatus(res.source === 'python' ? 'connected' : 'offline');
      }
    });
    return () => { isMounted = false; };
  }, [graph]);

  // Fetch BFS Reachability from Python Engine dynamically
  useEffect(() => {
    let isMounted = true;
    if (!selectedNode) {
      setReachableAccounts([]);
      return;
    }

    fetchPythonBFS(graph, selectedNode, bfsHops).then(res => {
      if (isMounted) {
        setReachableAccounts(res.reachableAccounts);
        if (res.source === 'python') setPythonStatus('connected');
      }
    });
    return () => { isMounted = false; };
  }, [graph, selectedNode, bfsHops]);

  const rankings = useMemo(() => rankAccounts(graph, mockTransactions, cycles), [graph, cycles]);
  const selectedNodeData = selectedNode ? rankings.find(r => r.node === selectedNode) : null;
  const getAccountName = (id: string) => mockAccounts.find(a => a.id === id)?.name || id;

  return (
    <div className="flex h-screen bg-[#07090e] overflow-hidden font-sans text-neutral-100">
      
      {/* LEFT SIDEBAR: Control Panel & Intuitive Hop Explanations */}
      <div className="w-[440px] bg-[#0c1017] border-r border-neutral-800 flex flex-col h-full overflow-y-auto z-10 shadow-2xl shrink-0">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-gradient-to-b from-[#111622] to-[#0c1017] relative">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold border border-blue-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                Fraud Defense Lab
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                pythonStatus === 'connected' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pythonStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {pythonStatus === 'connected' ? 'Python BFS/DFS Engine' : 'TypeScript Engine'}
              </div>
            </div>
            
            <button 
              onClick={() => setShowFAQ(!showFAQ)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors border border-neutral-700"
            >
              {showFAQ ? <X className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5 text-blue-400" />}
              {showFAQ ? "Back" : "Guide"}
            </button>
          </div>
          
          <h1 className="text-xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            Bank Transaction Alert System
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Uncover money laundering rings & track where stolen funds travel step-by-step.
          </p>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-5 flex-1 text-neutral-200">
          
          {showFAQ ? (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <h2 className="font-bold text-sm text-white border-b border-neutral-800 pb-2">
                Plain English Guide to Fraud Graph Algorithms
              </h2>
              
              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-blue-500/30 space-y-1.5">
                <h3 className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  What is a "Hop" (BFS Traversal)?
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  Think of hops like ripples in water or degrees of separation:
                </p>
                <ul className="space-y-1 text-neutral-400 list-disc list-inside pt-1">
                  <li><strong className="text-neutral-200">0 Hops:</strong> The suspect source account.</li>
                  <li><strong className="text-blue-300">1 Hop:</strong> Anyone who directly got money from the source.</li>
                  <li><strong className="text-purple-300">2 Hops:</strong> Anyone who got money from the 1st group (money mules).</li>
                  <li><strong className="text-pink-300">3 Hops:</strong> The 3rd layer of accounts down the line.</li>
                </ul>
              </div>

              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-red-500/30 space-y-1.5">
                <h3 className="font-bold text-red-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  What is a "Cycle" (DFS Layering)?
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  When money travels from <span className="text-red-300 font-mono">A &rarr; B &rarr; C &rarr; A</span> back to where it started. 
                  Criminals do this in loops so banks can't tell who actually kept the dirty funds.
                </p>
              </div>

              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
                <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  How is Risk Scored?
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  Accounts participating in loops get +50 risk points. Accounts acting as dispersal hubs (sending money out to many people at once) get high penalty scores.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Cycle Detection (DFS) */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/15 text-red-400 rounded-lg flex-shrink-0 border border-red-500/30">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-xs text-white leading-tight">Circular Laundering Detection</h2>
                      <p className="text-[11px] text-neutral-400">Depth-First Search (DFS) Cycles</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowCycles(!showCycles);
                      if (!showCycles) {
                        setSelectedNode(null);
                        setActiveHopFilter(null);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCycles ? 'bg-red-600' : 'bg-neutral-800 border border-neutral-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCycles ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                  showCycles 
                    ? 'border-red-500/50 bg-red-950/20 text-red-200' 
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400'
                }`}>
                  <span>{cycles.length} circular layering chains detected</span>
                  <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {showCycles ? 'Highlighted on Canvas' : 'Click switch to reveal'}
                  </span>
                </div>
              </section>

              <hr className="border-neutral-800/80" />

              {/* Section 2: Intuitive Downstream Hop Trace */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/15 text-blue-400 rounded-lg flex-shrink-0 border border-blue-500/30">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-xs text-white leading-tight">Fund Blast-Radius & Hop Trace</h2>
                      <p className="text-[11px] text-neutral-400">Breadth-First Search (BFS) Traversal</p>
                    </div>
                  </div>
                </div>

                <HopExplainer 
                  originNode={selectedNode}
                  originName={selectedNode ? getAccountName(selectedNode) : ''}
                  bfsHops={bfsHops}
                  setBfsHops={setBfsHops}
                  reachableAccounts={reachableAccounts}
                  getAccountName={getAccountName}
                  activeHopFilter={activeHopFilter}
                  setActiveHopFilter={setActiveHopFilter}
                />
              </section>

              <hr className="border-neutral-800/80" />

              {/* Section 3: Risk Ranking */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg flex-shrink-0 border border-amber-500/30">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xs text-white leading-tight">High Risk Account Leaderboard</h2>
                    <p className="text-[11px] text-neutral-400">Calculated by Degree Centrality & Ring Volume</p>
                  </div>
                </div>

                {selectedNodeData ? (
                  <div className="p-3.5 rounded-xl border border-neutral-700 bg-neutral-900/90 space-y-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Active Target</span>
                        <div className="text-sm font-bold text-white">{getAccountName(selectedNodeData.node)}</div>
                        <div className="text-[11px] font-mono text-neutral-400">{selectedNodeData.node}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        selectedNodeData.riskScore >= 50 ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                        selectedNodeData.riskScore >= 20 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        Risk: {selectedNodeData.riskScore}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/60">
                        <span className="block text-[10px] text-neutral-400 mb-0.5">Total Txs</span>
                        <span className="font-bold text-white">{selectedNodeData.count}</span>
                      </div>
                      <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/60">
                        <span className="block text-[10px] text-neutral-400 mb-0.5">In-Degree</span>
                        <span className="font-bold text-emerald-400">{selectedNodeData.inDegree}</span>
                      </div>
                      <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/60">
                        <span className="block text-[10px] text-neutral-400 mb-0.5">Out-Degree</span>
                        <span className="font-bold text-blue-400">{selectedNodeData.outDegree}</span>
                      </div>
                    </div>

                    {selectedNodeData.riskScore >= 50 && (
                      <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/40 p-2.5 rounded-lg border border-red-500/40">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>High Risk: Node participates in cyclic laundering rings.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Top Suspect Accounts (Click to Trace)
                    </span>
                    <div className="space-y-1.5">
                      {rankings.slice(0, 4).map((rank, i) => (
                        <div 
                          key={rank.node} 
                          onClick={() => { 
                            setSelectedNode(rank.node); 
                            setShowCycles(false); 
                            setActiveHopFilter(null);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:border-blue-500 hover:bg-blue-950/20 cursor-pointer transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center text-[11px] font-medium font-mono border border-neutral-700">
                              {i+1}
                            </span>
                            <div>
                              <span className="font-semibold text-neutral-200 block">{getAccountName(rank.node)}</span>
                              <span className="text-[10px] font-mono text-neutral-500">{rank.node}</span>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            rank.riskScore >= 50 ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                            rank.riskScore >= 20 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {rank.riskScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* RIGHT CANVAS: Interactive SVG Network Canvas */}
      <div className="flex-1 relative bg-[#07090e]">
        <NetworkGraph 
          accounts={mockAccounts}
          transactions={mockTransactions}
          cycles={cycles}
          rankings={rankings}
          selectedNode={selectedNode}
          onNodeClick={(id) => {
            setSelectedNode(id === selectedNode ? null : id);
            setShowCycles(false);
            setActiveHopFilter(null);
          }}
          showCycles={showCycles}
          reachableAccounts={reachableAccounts}
          activeHopFilter={activeHopFilter}
        />
        
        {/* Floating Top Banner if Node Selected */}
        {selectedNode && (
          <div className="absolute top-6 left-6 bg-[#0c1017]/90 backdrop-blur-md border border-neutral-800 p-3 rounded-xl flex items-center gap-3 text-xs shadow-2xl z-20">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Active Trace Origin</span>
              <span className="font-bold text-white text-sm">{getAccountName(selectedNode)} ({selectedNode})</span>
            </div>
            <button
              onClick={() => { setSelectedNode(null); setActiveHopFilter(null); }}
              className="ml-2 text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating Interactive Legend */}
        <div className="absolute top-6 right-6 bg-[#0c1017]/90 backdrop-blur-md border border-neutral-800 text-neutral-300 p-3.5 rounded-xl text-xs space-y-2.5 shadow-2xl z-20 max-w-xs">
          <div className="font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Graph Color Codes</div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-300 shrink-0"></div>
            <span><strong className="text-blue-300">Hop 1:</strong> Direct Transfer</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600 border border-purple-300 shrink-0"></div>
            <span><strong className="text-purple-300">Hop 2:</strong> Mule Account (2nd step)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-600 border border-pink-300 shrink-0"></div>
            <span><strong className="text-pink-300">Hop 3+:</strong> Deep Dispersal Tier</span>
          </div>
          
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
            <div className="w-4 h-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] shrink-0"></div>
            <span className="text-red-400 font-medium">Red Line: Laundering Cycle (DFS)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
