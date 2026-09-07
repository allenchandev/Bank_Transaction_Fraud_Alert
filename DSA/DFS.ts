import { AdjacencyList, Cycle } from '../src/types';

/**
 * Depth-First Search (DFS) for Cycle Detection
 * 
 * HOW TO EXPLAIN THIS TO STAFF:
 * "Imagine following a specific stolen dollar bill. DFS picks one account and traces 
 * that bill as far as it goes. If the dollar bill ends up back in the account it started from, 
 * we've found a 'Loop' (Cycle). Criminals do this to 'clean' money (Money Laundering). 
 * DFS is the algorithm that hunts down these loops automatically."
 */
export function detectCycles(graph: AdjacencyList): Cycle[] {
  // We use this to remember accounts we've already completely checked
  const visited = new Set<string>();
  
  // We use this to remember the current 'chain' of accounts we are tracing
  const recStack = new Set<string>();
  
  const cycles: Cycle[] = [];
  const uniqueCycles = new Set<string>(); // Used to prevent showing duplicates

  // This is the recursive DFS function. It calls itself to go deeper.
  function dfs(node: string, path: string[]) {
    visited.add(node);
    recStack.add(node); // Mark account as part of the current active chain
    path.push(node);

    const neighbors = graph[node] || [];
    
    // Look at everyone this account sent money to
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // If we haven't visited them, keep following the money trail (go deeper)
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        // BAM! We found an account that is already in our current chain.
        // This means the money looped back. We caught a money laundering cycle.
        const cycleStartIndex = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStartIndex);
        
        // Save it (and make sure we don't save duplicates)
        const sortedSignature = [...cyclePath].sort().join(',');
        if (!uniqueCycles.has(sortedSignature)) {
          uniqueCycles.add(sortedSignature);
          cycles.push({ path: [...cyclePath, neighbor] }); 
        }
      }
    }
    
    // Step back out of this account
    recStack.delete(node);
  }

  // Start the DFS process for every account in our network
  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}
