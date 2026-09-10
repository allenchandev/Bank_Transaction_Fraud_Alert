from typing import Dict, List, Set

def detect_cycles(graph: Dict[str, List[str]]) -> List[List[str]]:
    """
    Depth-First Search (DFS) for Cyclic Pattern / Money Laundering Ring Detection.
    
    Uses recursion and active recursion stack tracking to identify closed loops
    (e.g., A -> B -> C -> A).
    """
    visited: Set[str] = set()       # All nodes completely visited across runs
    rec_stack: Set[str] = set()     # Nodes in the current active recursion path
    cycles: List[List[str]] = []
    seen_cycle_signatures: Set[str] = set()

    def dfs(node: str, current_path: List[str]):
        visited.add(node)
        rec_stack.add(node)
        current_path.append(node)

        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                # Neighbor not yet visited: continue deeper along the trail
                dfs(neighbor, list(current_path))
            elif neighbor in rec_stack:
                # Cycle detected: funds looped back to an account currently in the active trail
                cycle_start_index = current_path.index(neighbor)
                cycle_nodes = current_path[cycle_start_index:]
                cycle_full_path = cycle_nodes + [neighbor]

                # Prevent duplicate cycle reports
                signature = ",".join(sorted(cycle_nodes))
                if signature not in seen_cycle_signatures:
                    seen_cycle_signatures.add(signature)
                    cycles.append(cycle_full_path)

        # Backtrack: remove node from current recursion chain
        rec_stack.remove(node)

    # Run DFS from every node to catch cycles across disconnected components
    for node in graph:
        if node not in visited:
            dfs(node, [])

    return cycles


# --- Quick Test / Example Usage ---
if __name__ == "__main__":
    # Directed adjacency list with a 3-node circular laundering loop
    # ACC-2001 -> ACC-2002 -> ACC-2003 -> ACC-2001
    transaction_graph = {
        "ACC-2001": ["ACC-2002"],
        "ACC-2002": ["ACC-2003"],
        "ACC-2003": ["ACC-2001", "ACC-2004"],
        "ACC-2004": []
    }

    detected_cycles = detect_cycles(transaction_graph)
    print("Detected Fraud / Laundering Cycles:")
    for idx, cycle in enumerate(detected_cycles, 1):
        print(f" Cycle #{idx}: {' -> '.join(cycle)}")
