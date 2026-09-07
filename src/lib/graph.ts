import { AdjacencyList, Cycle, ReachableAccount, AccountRanking, Transaction } from '../types';

import { detectCycles } from '../../DSA/DFS';
import { findReachableAccounts } from '../../DSA/BFS';

export { detectCycles, findReachableAccounts };

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
