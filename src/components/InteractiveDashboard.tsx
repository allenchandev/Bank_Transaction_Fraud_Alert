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
        <div className="p-6 border-b border-neutral-100 bg-neutral-900 text-white relative">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium mb-4 border border-blue-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              Beginner's Guide
            </div>
            <button 
              onClick={() => setShowFAQ(!showFAQ)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors border border-neutral-700"
            >
              {showFAQ ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              {showFAQ ? "Close FAQ" : "Staff FAQ"}
            </button>
          </div>
          
          <h1 className="text-2xl font-semibold tracking-tight mb-2">How Banks Catch Fraud</h1>
          <div className="text-sm text-neutral-400 leading-relaxed bg-white/10 p-3 rounded-lg border border-white/20 mt-2">
            <strong className="text-white block mb-1">Why do banks need this?</strong>
            Millions of transactions happen every day. Looking at spreadsheets is too slow. 
            So, banks use a visual <strong>Map of Money</strong> (like the one on the right) combined with smart tools to spot criminals instantly.
          </div>
        </div>

        {/* DSA Controls Area / FAQ Area */}
        <div className="p-6 space-y-8 flex-1">
          
          {showFAQ ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="font-bold text-xl border-b pb-2">Staff Questions & Answers</h2>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">Q: How does the bank know an account is doing Money Laundering?</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  They don't know for sure at first! Most accounts are normal. The bank uses this system to scan millions of accounts and look for <strong>unnatural patterns</strong> (like money moving in strange circles). The system gives these weird accounts a "Danger Score" (Step 3). A human investigator then looks at the high-score accounts to confirm if it is fraud.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-900 mb-2">Q: Why do criminals send money in Loops (Step 1)?</h3>
                <p className="text-sm text-red-800 leading-relaxed">
                  It's a trick called "Layering." If a criminal steals money, they don't want to just keep it in their main account. They send it through 5 or 6 different fake accounts to make it look like a normal business transaction, hoping the bank gets too confused to follow the trail.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-900 mb-2">Q: Why do we need to track where the stolen money went (Step 2)?</h3>
                <p className="text-sm text-orange-800 leading-relaxed">
                  If a victim calls the bank and says, <em>"I was just scammed by Shady LLC!"</em>, the bank needs to act fast. The scammer usually moves that money immediately to other accounts. By tracking the money, the bank can find those other accounts and <strong>freeze them</strong> before the scammer can withdraw the cash.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Cycle Detection */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-red-100 text-red-600 rounded flex-shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-lg leading-tight">Step 1: Find the Money Loops</h2>
            </div>
            
            <p className="text-sm text-neutral-600 mb-4">
              Criminals send money in circles to try and hide it (this is called money laundering). 
              Click this button to instantly find and light up these bad loops in red.
            </p>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between shadow-sm">
              <div>
                <span className="block font-medium text-sm text-neutral-900">Show bad loops</span>
                <span className="block text-xs text-neutral-500">{cycles.length} loops found hidden in the map</span>
              </div>
              <button 
                onClick={() => {
                  setShowCycles(!showCycles);
                  if (!showCycles) setSelectedNode(null); 
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${showCycles ? 'bg-red-500' : 'bg-neutral-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showCycles ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </section>

          <hr className="border-neutral-100" />

          {/* Section 2: BFS Trace */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded flex-shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-lg leading-tight">Step 2: Track the Stolen Money</h2>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              Want to see where a bad guy's money went? <strong>Click any circle on the map.</strong> It will turn blue and show you exactly who they paid, and who those people paid.
            </p>
            
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-blue-900">How far to track (Steps)</span>
                <span className="text-sm font-bold text-blue-700">{bfsHops}</span>
              </div>
              <input 
                type="range" 
                min="1" max="5" 
                value={bfsHops}
                onChange={(e) => setBfsHops(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              
              {selectedNode ? (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block mb-2">Tracing money from {getAccountName(selectedNode)}</span>
                  <div className="flex flex-wrap gap-2">
                    {reachableAccounts.length === 0 ? (
                      <span className="text-sm text-neutral-500">This account didn't send money to anyone.</span>
                    ) : (
                      reachableAccounts.map(r => (
                        <span key={r.node} className="text-xs px-2 py-1 bg-white border border-blue-200 text-blue-800 rounded-md shadow-sm">
                          {getAccountName(r.node)} <span className="text-blue-400">({r.hops} step{r.hops > 1 ? 's' : ''} away)</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-blue-200 flex items-start gap-2 text-sm text-blue-700 bg-white p-3 rounded-lg border">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
                  <span><strong>Try it out:</strong> Go click a circle on the big map on the right to start tracking.</span>
                </div>
              )}
            </div>
          </section>

          <hr className="border-neutral-100" />

          {/* Section 3: Risk Ranking */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-100 text-orange-600 rounded flex-shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-lg leading-tight">Step 3: Who is the most dangerous?</h2>
            </div>
            
            <p className="text-sm text-neutral-600 mb-4">
              We do the math to find the most suspicious accounts based on how much money they move. <strong>The bigger the circle on the map, the higher the danger score.</strong>
            </p>

            {selectedNodeData ? (
              <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Account You Clicked</span>
                    <div className="text-lg font-bold mt-1 text-neutral-900">{getAccountName(selectedNodeData.node)}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                    selectedNodeData.riskScore >= 50 ? 'bg-red-50 text-red-700 border-red-200' :
                    selectedNodeData.riskScore >= 20 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    Danger Score: {selectedNodeData.riskScore}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                    <span className="block text-xs text-neutral-500 mb-1">Total Transfers</span>
                    <span className="font-bold text-neutral-800">{selectedNodeData.count}</span>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
                    <span className="block text-xs text-purple-600 mb-1">Money In</span>
                    <span className="font-bold text-purple-700">{selectedNodeData.inDegree}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <span className="block text-xs text-blue-600 mb-1">Money Out</span>
                    <span className="font-bold text-blue-700">{selectedNodeData.outDegree}</span>
                  </div>
                </div>
                {selectedNodeData.riskScore >= 50 && (
                  <div className="mt-4 flex gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                    <strong>Warning:</strong> This account is very dangerous because it is part of a money laundering loop.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 block">Top 3 Most Dangerous Accounts</span>
                <div className="space-y-2">
                  {rankings.slice(0, 3).map((rank, i) => (
                    <div 
                      key={rank.node} 
                      onClick={() => { setSelectedNode(rank.node); setShowCycles(false); }}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">
                          {i+1}
                        </span>
                        <span className="font-medium text-neutral-800">{getAccountName(rank.node)}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                        rank.riskScore >= 50 ? 'bg-red-50 text-red-700 border-red-200' :
                        rank.riskScore >= 20 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        Danger: {rank.riskScore}
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
        <div className="absolute bottom-6 left-6 bg-neutral-900/90 backdrop-blur border border-neutral-700 text-neutral-300 p-4 rounded-xl text-sm space-y-4 shadow-2xl">
          <div className="font-bold text-white uppercase tracking-wider mb-2 text-xs">How to read this map</div>
          
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-neutral-800 border-[3px] border-neutral-500"></div>
            <span><strong>Circle</strong> = A Bank Account (Bigger circle = More dangerous)</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-5 h-0.5 bg-neutral-500"></div>
            <span><strong>Arrow</strong> = Money moving to another account</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <span className="text-red-400 font-medium">Red Arrow = A bad loop (Money Laundering)</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-blue-400 font-medium">Blue Arrow = Tracking where money went</span>
          </div>
        </div>
      </div>

    </div>
  );
}
