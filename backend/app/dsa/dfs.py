"""
Depth-First Search (DFS) Cycle Detection for Transaction Graph.
Implements 3-color state machine (WHITE=0, GRAY=1, BLACK=2) with path reconstruction,
deduplication, and execution trace logging for educational visualization.
Time Complexity: O(V + E)
Space Complexity: O(V)
"""

from typing import Any, Dict, List, Set, Tuple
from app.dsa.graph import TransactionGraph


def canonicalize_cycle(cycle: List[str]) -> Tuple[str, ...]:
    """
    Given a cycle like ['B', 'C', 'A', 'B'], extract the unique sequence ['B', 'C', 'A']
    and rotate it so the minimum element is first: ('A', 'B', 'C').
    This ensures identical cycles found from different start nodes are recognized as duplicates.
    """
    if len(cycle) <= 1:
        return tuple(cycle)
    
    # Exclude the closing duplicate node
    nodes = cycle[:-1]
    n = len(nodes)
    if n == 0:
        return ()

    min_val = min(nodes)
    min_indices = [i for i, x in enumerate(nodes) if x == min_val]
    
    best_rotation = None
    for idx in min_indices:
        rotated = tuple(nodes[idx:] + nodes[:idx])
        if best_rotation is None or rotated < best_rotation:
            best_rotation = rotated
            
    return best_rotation or tuple(nodes)


class DFSCycleDetector:
    def __init__(self, graph: TransactionGraph):
        self.graph = graph

    def detect_cycles(self) -> Dict[str, Any]:
        """
        Runs full DFS cycle detection across all components in the transaction graph.
        Returns:
            - cycles: List of reconstructed cycles (e.g. [['A', 'B', 'C', 'A']])
            - participating_accounts: Set of account references involved in any cycle
            - trace: Step-by-step exploration log for interactive visualization
            - summary: Metric summary
        """
        WHITE, GRAY, BLACK = 0, 1, 2
        colors: Dict[str, int] = {node: WHITE for node in self.graph.get_all_vertices()}
        
        detected_cycles: List[List[str]] = []
        seen_canonical_cycles: Set[Tuple[str, ...]] = set()
        participating_accounts: Set[str] = set()
        trace: List[Dict[str, Any]] = []
        step_counter = 0

        current_path: List[str] = []

        def dfs_visit(u: str):
            nonlocal step_counter
            step_counter += 1
            colors[u] = GRAY
            current_path.append(u)
            trace.append({
                "step": step_counter,
                "action": "ENTER_NODE",
                "node": u,
                "path": list(current_path),
                "description": f"Exploring account {u} (marked GRAY in recursion stack)"
            })

            for v in self.graph.get_neighbors(u):
                step_counter += 1
                color_v = colors.get(v, WHITE)

                if color_v == GRAY:
                    # Found a back-edge: u -> v! Cycle detected!
                    cycle_start_idx = current_path.index(v)
                    cycle_path = current_path[cycle_start_idx:] + [v]
                    
                    canon = canonicalize_cycle(cycle_path)
                    is_new = canon not in seen_canonical_cycles
                    if is_new:
                        seen_canonical_cycles.add(canon)
                        detected_cycles.append(cycle_path)
                        for node in cycle_path:
                            participating_accounts.add(node)

                    trace.append({
                        "step": step_counter,
                        "action": "CYCLE_DETECTED",
                        "from_node": u,
                        "to_node": v,
                        "cycle_path": cycle_path,
                        "is_new": is_new,
                        "description": f"Back-edge encountered from {u} to {v}! Cycle detected: {' -> '.join(cycle_path)}"
                    })

                elif color_v == WHITE:
                    trace.append({
                        "step": step_counter,
                        "action": "TRAVERSE_EDGE",
                        "from_node": u,
                        "to_node": v,
                        "description": f"Following transfer flow edge from {u} to unvisited neighbor {v}"
                    })
                    dfs_visit(v)
                else:
                    # BLACK: already finished and verified in another subtree
                    trace.append({
                        "step": step_counter,
                        "action": "SKIP_BLACK_NODE",
                        "from_node": u,
                        "to_node": v,
                        "description": f"Skipping neighbor {v} (marked BLACK, already fully processed)"
                    })

            step_counter += 1
            colors[u] = BLACK
            current_path.pop()
            trace.append({
                "step": step_counter,
                "action": "EXIT_NODE",
                "node": u,
                "path": list(current_path),
                "description": f"Backtracking from {u} (marked BLACK, processing finished)"
            })

        # Process all connected components
        for node in sorted(self.graph.get_all_vertices()):
            if colors[node] == WHITE:
                step_counter += 1
                trace.append({
                    "step": step_counter,
                    "action": "START_COMPONENT",
                    "node": node,
                    "description": f"Beginning new component DFS exploration from root node {node}"
                })
                dfs_visit(node)

        # Build cycle edge pairs for easy highlighting in graph UI
        cycle_edges = []
        for c in detected_cycles:
            for i in range(len(c) - 1):
                cycle_edges.append({"source": c[i], "target": c[i + 1]})

        return {
            "cycle_count": len(detected_cycles),
            "cycles": detected_cycles,
            "cycle_edges": cycle_edges,
            "participating_accounts": sorted(list(participating_accounts)),
            "total_steps": step_counter,
            "trace": trace,
            "summary": {
                "cycles_found": len(detected_cycles),
                "accounts_involved": len(participating_accounts),
                "vertices_scanned": len(colors),
                "edges_scanned": self.graph.edge_count
            }
        }
