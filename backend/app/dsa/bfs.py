"""
Breadth-First Search (BFS) Fund Tracing & Blast Radius Calculation.
Utilizes collections.deque for true FIFO level-order queue operations.
Calculates shortest hop distances, full reachability trees, and traversal traces.
Time Complexity: O(V + E) bounded by hop limit
Space Complexity: O(V)
"""

from collections import deque
from typing import Any, Dict, List, Optional, Set
from app.dsa.graph import TransactionGraph


class BFSFundTracer:
    def __init__(self, graph: TransactionGraph):
        self.graph = graph

    def trace_fund_flow(self, source_account: str, max_hops: int = 3) -> Dict[str, Any]:
        """
        Executes a BFS outward from source_account up to max_hops.
        Returns:
            - source: str
            - max_hops: int
            - reachable_nodes: list of reachable node details with hop distance, predecessor, path
            - levels: dict mapping hop depth -> list of account refs
            - highlighted_edges: list of (src, dst) pairs traversed in BFS tree
            - trace: step-by-step queue operations for educational animation
            - error: optional error string if source does not exist
        """
        if source_account not in self.graph.adj:
            return {
                "source": source_account,
                "max_hops": max_hops,
                "error": f"Account '{source_account}' was not found in transaction graph.",
                "reachable_nodes": [],
                "levels": {},
                "highlighted_edges": [],
                "trace": []
            }

        if max_hops < 1:
            max_hops = 1
        elif max_hops > 10:
            max_hops = 10

        visited: Set[str] = {source_account}
        queue: deque = deque([(source_account, 0)])
        
        predecessor: Dict[str, Optional[str]] = {source_account: None}
        distances: Dict[str, int] = {source_account: 0}
        levels: Dict[int, List[str]] = {0: [source_account]}
        highlighted_edges: List[Dict[str, Any]] = []
        
        trace: List[Dict[str, Any]] = []
        step_counter = 0

        step_counter += 1
        trace.append({
            "step": step_counter,
            "action": "ENQUEUE_SOURCE",
            "node": source_account,
            "depth": 0,
            "queue_state": [source_account],
            "description": f"Enqueuing root account {source_account} at hop distance 0"
        })

        while queue:
            curr_node, curr_depth = queue.popleft()
            
            step_counter += 1
            trace.append({
                "step": step_counter,
                "action": "DEQUEUE_NODE",
                "node": curr_node,
                "depth": curr_depth,
                "queue_state": [item[0] for item in queue],
                "description": f"Dequeuing account {curr_node} at hop depth {curr_depth} for counterparty expansion"
            })

            if curr_depth >= max_hops:
                step_counter += 1
                trace.append({
                    "step": step_counter,
                    "action": "MAX_HOPS_REACHED",
                    "node": curr_node,
                    "depth": curr_depth,
                    "description": f"Reached configured hop boundary ({max_hops}) for node {curr_node}. Halting further branch expansion."
                })
                continue

            for neighbor in self.graph.get_neighbors(curr_node):
                if neighbor not in visited:
                    visited.add(neighbor)
                    new_depth = curr_depth + 1
                    distances[neighbor] = new_depth
                    predecessor[neighbor] = curr_node
                    
                    if new_depth not in levels:
                        levels[new_depth] = []
                    levels[new_depth].append(neighbor)
                    
                    edges = self.graph.get_edges(curr_node, neighbor)
                    tx_info = []
                    for e in edges:
                        tx_info.append({
                            "tx_ref": e.tx_ref,
                            "amount": e.amount,
                            "timestamp": e.timestamp,
                            "description": e.description
                        })

                    highlighted_edges.append({
                        "source": curr_node,
                        "target": neighbor,
                        "hop": new_depth,
                        "transactions": tx_info
                    })

                    queue.append((neighbor, new_depth))
                    
                    step_counter += 1
                    trace.append({
                        "step": step_counter,
                        "action": "DISCOVER_NEIGHBOR",
                        "parent": curr_node,
                        "node": neighbor,
                        "depth": new_depth,
                        "queue_state": [item[0] for item in queue],
                        "description": f"Discovered reachable downstream account {neighbor} at hop {new_depth} from {curr_node}"
                    })
                else:
                    step_counter += 1
                    trace.append({
                        "step": step_counter,
                        "action": "ALREADY_VISITED",
                        "parent": curr_node,
                        "node": neighbor,
                        "description": f"Account {neighbor} was already reached via another shortest path. Skipping duplicate traversal."
                    })

        # Reconstruct path from source to every reachable account
        reachable_nodes: List[Dict[str, Any]] = []
        for node, dist in distances.items():
            if node == source_account:
                continue
            
            # Trace backwards using predecessor map
            path = []
            curr = node
            while curr is not None:
                path.append(curr)
                curr = predecessor.get(curr)
            path.reverse()

            vertex_info = self.graph.vertices.get(node)
            reachable_nodes.append({
                "account_ref": node,
                "customer_name": vertex_info.customer_name if vertex_info else "Unknown",
                "hop_distance": dist,
                "shortest_path": path,
                "predecessor": predecessor.get(node),
                "account_type": vertex_info.account_type if vertex_info else "Unknown",
                "balance": vertex_info.balance if vertex_info else 0.0,
                "status": vertex_info.status if vertex_info else "active"
            })

        # Sort reachable accounts by hop distance, then by account ref
        reachable_nodes.sort(key=lambda x: (x["hop_distance"], x["account_ref"]))

        return {
            "source": source_account,
            "max_hops": max_hops,
            "blast_radius_count": len(reachable_nodes),
            "reachable_nodes": reachable_nodes,
            "levels": levels,
            "highlighted_edges": highlighted_edges,
            "total_steps": step_counter,
            "trace": trace,
            "summary": {
                "source_account": source_account,
                "max_hops_configured": max_hops,
                "total_accounts_reached": len(reachable_nodes),
                "levels_explored": len(levels) - 1
            }
        }
