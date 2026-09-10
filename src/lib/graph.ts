import { AdjacencyList, Cycle, ReachableAccount, AccountRanking, Transaction } from '../types';

import { detectCycles as localDetectCycles } from '../../DSA/DFS';
import { findReachableAccounts as localFindReachableAccounts } from '../../DSA/BFS';

const PYTHON_API_URL = 'http://127.0.0.1:8000/api';

/**
 * Fetch cycle detection results from the Python backend (DFS).
 * Falls back to local implementation if the Python backend is offline.
 */
export async function fetchPythonDFS(graph: AdjacencyList): Promise<{ cycles: Cycle[]; source: 'python' | 'fallback' }> {
  try {
    const res = await fetch(`${PYTHON_API_URL}/dfs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph })
    });
    if (!res.ok) throw new Error('Python API responded with error');
    const data = await res.json();
    return { cycles: data.cycles, source: 'python' };
  } catch {
    return { cycles: localDetectCycles(graph), source: 'fallback' };
  }
}

/**
 * Fetch reachability results from the Python backend (BFS).
 * Falls back to local implementation if the Python backend is offline.
 */
export async function fetchPythonBFS(graph: AdjacencyList, startNode: string, maxHops: number): Promise<{ reachableAccounts: ReachableAccount[]; source: 'python' | 'fallback' }> {
  try {
    const res = await fetch(`${PYTHON_API_URL}/bfs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph, start_node: startNode, max_hops: maxHops })
    });
    if (!res.ok) throw new Error('Python API responded with error');
    const data = await res.json();
    return { reachableAccounts: data.reachableAccounts, source: 'python' };
  } catch {
    return { reachableAccounts: localFindReachableAccounts(graph, startNode, maxHops), source: 'fallback' };
  }
}

export { localDetectCycles as detectCycles, localFindReachableAccounts as findReachableAccounts };

// Convert a flat list of transactions to an Adjacency List (Graph)
export function buildGraph(transactions: Transaction[]): AdjacencyList {
  const graph: AdjacencyList = {};
  
  for (const t of transactions) {
    if (!graph[t.senderId]) graph[t.senderId] = [];
    if (!graph[t.receiverId]) graph[t.receiverId] = []; // Ensure receiver exists in graph even if they don't send
    
    // Add directed edge
    graph[t.senderId].push(t.receiverId);
  }
  
  return graph;
}



// 3. Rank Accounts by Transaction Count & Calculate Risk Score
export function rankAccounts(graph: AdjacencyList, transactions: Transaction[], cycles: Cycle[]): AccountRanking[] {
  const rankings: Record<string, AccountRanking> = {};

  // Initialize nodes
  for (const node of Object.keys(graph)) {
    rankings[node] = { node, count: 0, inDegree: 0, outDegree: 0, riskScore: 0 };
  }

  // Calculate degrees from transactions
  for (const t of transactions) {
    if (rankings[t.senderId]) {
      rankings[t.senderId].outDegree++;
      rankings[t.senderId].count++;
    }
    if (rankings[t.receiverId]) {
      rankings[t.receiverId].inDegree++;
      rankings[t.receiverId].count++;
    }
  }

  // Calculate Risk Score based on indicators
  const accountsInCycles = new Set<string>();
  cycles.forEach(c => c.path.forEach(node => accountsInCycles.add(node)));

  for (const node of Object.keys(rankings)) {
    let risk = 0;
    const data = rankings[node];
    
    // Indicator 1: Involved in a cycle (High Risk)
    if (accountsInCycles.has(node)) risk += 50;
    
    // Indicator 2: High transaction volume (Medium Risk)
    if (data.count >= 4) risk += 20;

    // Indicator 3: High Out-Degree / Hub behavior (Medium Risk)
    if (data.outDegree > data.inDegree * 2 && data.outDegree >= 2) risk += 15;

    data.riskScore = Math.min(risk, 100); // Cap at 100
  }

  // Convert to array and sort by Risk Score descending, then by transaction count
  return Object.values(rankings).sort((a, b) => {
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    return b.count - a.count;
  });
}
