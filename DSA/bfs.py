from collections import deque
from typing import Dict, List, Set

def find_reachable_accounts(graph: Dict[str, List[str]], start_node: str, max_hops: int) -> List[Dict[str, any]]:
    """
    Breadth-First Search (BFS) for Reachability Analysis.
    
    Traverses the transaction network level-by-level using a FIFO queue
    to find all recipient accounts reachable within `max_hops` from start_node.
    """
    if start_node not in graph:
        return []

    visited: Set[str] = {start_node}
    # Queue stores tuples of: (account_node, current_hops)
    queue: deque = deque([(start_node, 0)])
    result: List[Dict[str, any]] = []

    while queue:
        node, hops = queue.popleft()

        # Record reachable accounts (excluding the starting account itself)
        if hops > 0:
            result.append({"node": node, "hops": hops})

        # Explore neighbors if within the hop limit
        if hops < max_hops:
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, hops + 1))

    return result


# --- Quick Test / Example Usage ---
if __name__ == "__main__":
    # Directed adjacency list of bank transactions (Sender -> [Receivers])
    transaction_graph = {
        "ACC-1001": ["ACC-1002", "ACC-1003"],
        "ACC-1002": ["ACC-1004"],
        "ACC-1003": ["ACC-1005"],
        "ACC-1004": ["ACC-1006"],
        "ACC-1005": [],
        "ACC-1006": []
    }

    start = "ACC-1001"
    hops_limit = 2
    reachable = find_reachable_accounts(transaction_graph, start, hops_limit)

    print(f"Accounts reachable from {start} within {hops_limit} hops:")
    for acc in reachable:
        print(f" - Account: {acc['node']}, Distance: {acc['hops']} hop(s)")
