import React, { useState, useMemo } from 'react';
import NetworkGraph from './NetworkGraph';
import { mockTransactions, mockAccounts } from '../lib/mockData';
import { buildGraph, detectCycles, findReachableAccounts, rankAccounts } from '../lib/graph';
import { ShieldAlert, RefreshCw, Target, BarChart3, Info, AlertTriangle, HelpCircle, X } from 'lucide-react';

export default function InteractiveDashboard() {
  // Application State
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showCycles, setShowCycles] = useState(false);
  const [bfsHops, setBfsHops] = useState(2);
  const [showFAQ, setShowFAQ] = useState(false);

  // Compute DSA Data
  const graph = useMemo(() => buildGraph(mockTransactions), []);
  const cycles = useMemo(() => detectCycles(graph), [graph]);
  const rankings = useMemo(() => rankAccounts(graph, mockTransactions, cycles), [graph, cycles]);
  
  // BFS Reachability updates dynamically when a node is selected and hops change
  const reachableAccounts = useMemo(() => {
    if (!selectedNode) return [];
    return findReachableAccounts(graph, selectedNode, bfsHops);
  }, [graph, selectedNode, bfsHops]);

  const selectedNodeData = selectedNode ? rankings.find(r => r.node === selectedNode) : null;
  const getAccountName = (id: string) => mockAccounts.find(a => a.id === id)?.name || id;

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans text-neutral-900">
      
      {/* LEFT SIDEBAR: Control Panel & Explanation */}
      <div className="w-[420px] bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto z-10 shadow-xl shrink-0">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-900 text-white relative">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium mb-4 border border-blue-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Graph Intelligence Engine
            </div>
            <button 
              onClick={() => setShowFAQ(!showFAQ)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors border border-neutral-700"
            >
              {showFAQ ? <X className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
              {showFAQ ? "Overview" : "Methodology"}
            </button>
          </div>
          
          <h1 className="text-xl font-bold tracking-tight mb-1">Transaction Fraud Monitor</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Real-time graph analysis for identifying circular fund flows, transaction layering, and multi-hop account exposure.
          </p>
        </div>

        {/* DSA Controls Area / FAQ Area */}
        <div className="p-6 space-y-6 flex-1 text-neutral-800">
          
          {showFAQ ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="font-semibold text-base border-b border-neutral-200 pb-2 text-neutral-900">Detection Methodology</h2>
              
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">1. Cycle Detection (DFS)</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Identifies closed loops in directed transaction chains ($A \rightarrow B \rightarrow \dots \rightarrow A$). In financial forensics, cyclic fund velocity is a primary heuristic for transaction layering and shell network routing.
                </p>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700">2. Reachability & Exposure (BFS)</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Traces downstream account exposure within $N$ degrees of separation from a compromised origin account, enabling precise asset containment and rapid blast-radius evaluation.
                </p>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">3. Degree & Anomaly Scoring</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Weights cyclic involvement (+50), high transaction frequency (+20), and skewed out-degree dispersal ratios (+15) into a composite risk metric from 0 to 100.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Cycle Detection */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 text-red-600 rounded-lg flex-shrink-0 border border-red-100">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-neutral-900 leading-tight">Cyclic Transfer Detection</h2>
                    <p className="text-xs text-neutral-500">Depth-First Search (DFS)</p>
                  </div>
                </div>
                
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                  <div>
                    <span className="block font-medium text-xs text-neutral-900">Highlight Active Cycles</span>
                    <span className="block text-[11px] text-neutral-500">{cycles.length} circular pattern{cycles.length === 1 ? '' : 's'} identified</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCycles(!showCycles);
                      if (!showCycles) setSelectedNode(null); 
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCycles ? 'bg-red-600' : 'bg-neutral-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCycles ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </section>

              <hr className="border-neutral-200/80" />

              {/* Section 2: BFS Trace */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0 border border-blue-100">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-neutral-900 leading-tight">Downstream Fund Trace</h2>
                    <p className="text-xs text-neutral-500">Breadth-First Search (BFS)</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-neutral-700">Traversal Depth (Max Hops)</span>
                    <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">{bfsHops} hop{bfsHops > 1 ? 's' : ''}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="5" 
                    value={bfsHops}
                    onChange={(e) => setBfsHops(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                  />
                  
                  {selectedNode ? (
                    <div className="pt-3 border-t border-neutral-200">
                      <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block mb-2">
                        Origin: {getAccountName(selectedNode)} ({selectedNode})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {reachableAccounts.length === 0 ? (
                          <span className="text-xs text-neutral-500 italic">No outgoing transactions found from this node.</span>
                        ) : (
                          reachableAccounts.map(r => (
                            <span key={r.node} className="text-[11px] px-2 py-1 bg-white border border-neutral-200 text-neutral-700 rounded shadow-xs font-mono">
                              {getAccountName(r.node)} <span className="text-blue-600 font-sans font-medium">({r.hops}h)</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center gap-2 text-xs text-neutral-500">
                      <Info className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                      <span>Select any node on the graph canvas to trace fund pathways.</span>
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-neutral-200/80" />

              {/* Section 3: Risk Ranking */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0 border border-amber-100">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-neutral-900 leading-tight">Account Risk Assessment</h2>
                    <p className="text-xs text-neutral-500">Network Topology & Volume Metrics</p>
                  </div>
                </div>

                {selectedNodeData ? (
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-3 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Inspected Entity</span>
                        <div className="text-sm font-semibold text-neutral-900">{getAccountName(selectedNodeData.node)}</div>
                        <div className="text-[11px] font-mono text-neutral-400">{selectedNodeData.node}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                        selectedNodeData.riskScore >= 50 ? 'bg-red-50 text-red-700 border-red-200' :
                        selectedNodeData.riskScore >= 20 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Score: {selectedNodeData.riskScore}/100
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                        <span className="block text-[10px] text-neutral-500 mb-0.5">Total Tx</span>
                        <span className="font-bold text-neutral-800">{selectedNodeData.count}</span>
                      </div>
                      <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                        <span className="block text-[10px] text-neutral-500 mb-0.5">In-Degree</span>
                        <span className="font-bold text-neutral-800">{selectedNodeData.inDegree}</span>
                      </div>
                      <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                        <span className="block text-[10px] text-neutral-500 mb-0.5">Out-Degree</span>
                        <span className="font-bold text-neutral-800">{selectedNodeData.outDegree}</span>
                      </div>
                    </div>
                    {selectedNodeData.riskScore >= 50 && (
                      <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>High Risk: Node participates in cyclic layering rings.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Highest Risk Accounts</span>
                    <div className="space-y-1.5">
                      {rankings.slice(0, 4).map((rank, i) => (
                        <div 
                          key={rank.node} 
                          onClick={() => { setSelectedNode(rank.node); setShowCycles(false); }}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded bg-neutral-100 text-neutral-600 flex items-center justify-center text-[11px] font-medium font-mono">
                              {i+1}
                            </span>
                            <div>
                              <span className="font-medium text-neutral-800 block">{getAccountName(rank.node)}</span>
                              <span className="text-[10px] font-mono text-neutral-400">{rank.node}</span>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            rank.riskScore >= 50 ? 'bg-red-50 text-red-700 border-red-200' :
                            rank.riskScore >= 20 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
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

      {/* RIGHT AREA: Interactive SVG Graph */}
      <div className="flex-1 relative">
        <NetworkGraph 
          accounts={mockAccounts}
          transactions={mockTransactions}
          cycles={cycles}
          rankings={rankings}
          selectedNode={selectedNode}
          onNodeClick={(id) => {
            setSelectedNode(id === selectedNode ? null : id); // Toggle selection
            setShowCycles(false); // Turn off cycles view when inspecting a specific node
          }}
          showCycles={showCycles}
          reachableAccounts={reachableAccounts}
        />
        
        {/* Floating Legend */}
        <div className="absolute top-6 right-6 bg-neutral-900/90 backdrop-blur border border-neutral-700/80 text-neutral-300 p-3 rounded-lg text-xs space-y-2 shadow-2xl z-20 max-w-xs">
          <div className="font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Graph Legend</div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neutral-800 border-[2px] border-neutral-400 shrink-0"></div>
            <span><strong className="text-white">Node:</strong> Account (Radius = Risk)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-neutral-500 shrink-0"></div>
            <span><strong className="text-white">Edge:</strong> Fund Transfer</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0"></div>
            <span className="text-red-400 font-medium">Red: Cyclic Flow (DFS)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] shrink-0"></div>
            <span className="text-blue-400 font-medium">Blue: Downstream Path (BFS)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
