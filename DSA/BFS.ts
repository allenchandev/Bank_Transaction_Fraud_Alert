import { AdjacencyList, ReachableAccount } from '../src/types';

/**
 * Breadth-First Search (BFS) for Reachability Analysis
 * 
 * Traverses the transaction network level-by-level using a FIFO queue
 * to determine all recipient accounts reachable within `maxHops` from a target origin node.
 * 
 * @param graph Directed adjacency list mapping sender accounts to recipient arrays
 * @param startNode Origin account ID to trace
 * @param maxHops Maximum traversal depth (radius)
 * @returns Array of reachable accounts along with their distance (hop count)
 */
export function findReachableAccounts(graph: AdjacencyList, startNode: string, maxHops: number): ReachableAccount[] {
  if (!graph[startNode]) return [];

  // We use this to remember who we have already looked at so we don't go in circles
  const visited = new Set<string>([startNode]);
  
  // QUEUE DATA STRUCTURE: This is the secret to BFS. 
  // It ensures we check all accounts in Ripple 1 before we ever look at Ripple 2. (First-In, First-Out)
  const queue: { node: string; hops: number }[] = [{ node: startNode, hops: 0 }];
  
  const result: ReachableAccount[] = [];

  // Keep checking until the queue is empty
  while (queue.length > 0) {
    // Take the next account from the front of the queue
    const { node, hops } = queue.shift()!;
    
    // Save it to our results (if it's not the start node)
    if (hops > 0) {
      result.push({ node, hops });
    }

    // If we haven't reached our depth limit (max ripples), add the neighbors to the back of the queue
    if (hops < maxHops) {
      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, hops: hops + 1 });
        }
      }
    }
  }

  return result;
}
