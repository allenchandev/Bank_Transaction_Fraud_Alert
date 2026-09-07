import React from 'react';
import VisualGraph from './VisualGraph';
import { mockTransactions, mockAccounts } from '../lib/mockData';
import { ShieldAlert, Network, Waypoints, Activity, AlertTriangle } from 'lucide-react';

export default function Overview() {
  // We'll highlight one of the known cycles from the mock data to illustrate the problem visually
  const exampleCyclePath = ['ACC005', 'ACC006', 'ACC007', 'ACC005'];
  
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
          <ShieldAlert className="w-4 h-4" />
          Educational FinTech Prototype
        </div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900 mb-4">
          Unmasking Financial Fraud with Graph Theory
        </h2>
        <p className="text-lg text-neutral-500 leading-relaxed">
          Traditional spreadsheets can't catch modern financial criminals. This system transforms raw transaction logs into a mathematical network, exposing hidden laundering rings and tracing stolen funds instantly.
        </p>
      </section>

      {/* The Problem & Solution Grid */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-3">The Actual Problem</h3>
          <p className="text-neutral-600 leading-relaxed mb-4">
            Every day, millions of transactions occur globally. Fraudsters hide in this massive volume using two primary techniques:
          </p>
          <ul className="space-y-3 text-neutral-600">
            <li className="flex gap-3">
              <strong className="text-neutral-900 font-medium whitespace-nowrap">1. Layering:</strong> 
              <span>Passing illegal money through dozens of shell accounts in a circle to confuse investigators.</span>
            </li>
            <li className="flex gap-3">
              <strong className="text-neutral-900 font-medium whitespace-nowrap">2. Dispersal:</strong> 
              <span>Taking stolen funds and instantly scattering them across a massive tree of "mule" accounts.</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-6">
            <Network className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-3">Our Algorithmic Solution</h3>
          <p className="text-neutral-600 leading-relaxed mb-4">
            Instead of looking at rows in a database, we map the data as a <strong>Mathematical Graph</strong>:
          </p>
          <ul className="space-y-3 text-neutral-600">
            <li className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span><strong>Nodes:</strong> Every bank account becomes a point on the map.</span>
            </li>
            <li className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span><strong>Edges:</strong> Every transaction becomes a directed arrow connecting two points.</span>
            </li>
            <li className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span><strong>Analysis:</strong> We run Data Structures & Algorithms (DSA) on this network to force the invisible fraud patterns to light up in red.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">Live Network Graph</h3>
            <p className="text-sm text-neutral-500 mt-1">Visualizing 16 accounts and 16 transactions. A money laundering cycle is highlighted in red.</p>
          </div>
        </div>
        <div className="p-6 bg-neutral-50/50">
          <VisualGraph 
            transactions={mockTransactions} 
            accounts={mockAccounts} 
            highlightPath={exampleCyclePath} 
          />
        </div>
      </section>

      {/* How It Works Steps */}
      <section>
        <h3 className="text-2xl font-semibold text-neutral-900 mb-8 text-center">How the Algorithms Break Down the Data</h3>
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-4 text-neutral-700">
              <Waypoints className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">1. Depth-First Search (DFS)</h4>
            <p className="text-sm text-neutral-600 leading-relaxed">
              DFS explores as far as possible down a single transaction chain before backtracking. If it hits an account it has already visited in the same chain, it has found a <strong>Cycle</strong> (e.g., A &rarr; B &rarr; C &rarr; A), which is the primary indicator of money laundering.
            </p>
          </div>

          <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-4 text-neutral-700">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">2. Breadth-First Search (BFS)</h4>
            <p className="text-sm text-neutral-600 leading-relaxed">
              BFS explores outward layer by layer like ripples in a pond. By using a Queue data structure, it maps out the exact "blast radius" of stolen funds, showing investigators exactly which accounts received money within 1, 2, or 3 "hops" of the crime.
            </p>
          </div>

          <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-4 text-neutral-700">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">3. Degree Sorting & Risk</h4>
            <p className="text-sm text-neutral-600 leading-relaxed">
              By counting the In-Degree (received) and Out-Degree (sent) for every node, the system ranks accounts. Accounts acting as central hubs (Money Mules) are assigned high Risk Scores and pushed to the top of the investigation queue.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
