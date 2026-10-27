"""
Graph Topology and Transaction Flow Metrics.
Calculates in/out degrees, flow volumes, counterparty diversity, and graph centrality indicators.
"""

from typing import Any, Dict, List, Set
from app.dsa.graph import TransactionGraph


class GraphMetricsCalculator:
    def __init__(self, graph: TransactionGraph):
        self.graph = graph

    def calculate_account_metrics(self, account_ref: str, cycle_nodes: Set[str] = None) -> Dict[str, Any]:
        """
        Computes detailed network and flow metrics for a specific account.
        """
        cycle_nodes = cycle_nodes or set()
        
        in_neighbors = self.graph.get_in_neighbors(account_ref)
        out_neighbors = self.graph.get_neighbors(account_ref)
        
        in_degree = len(in_neighbors)
        out_degree = len(out_neighbors)
        unique_counterparties = len(set(in_neighbors).union(set(out_neighbors)))

        incoming_volume = 0.0
        incoming_tx_count = 0
        for src in in_neighbors:
            for edge in self.graph.get_edges(src, account_ref):
                incoming_volume += edge.amount
                incoming_tx_count += 1

        outgoing_volume = 0.0
        outgoing_tx_count = 0
        for dst in out_neighbors:
            for edge in self.graph.get_edges(account_ref, dst):
                outgoing_volume += edge.amount
                outgoing_tx_count += 1

        net_flow = incoming_volume - outgoing_volume
        total_tx_count = incoming_tx_count + outgoing_tx_count
        participates_in_cycle = account_ref in cycle_nodes

        return {
            "account_ref": account_ref,
            "in_degree": in_degree,
            "out_degree": out_degree,
            "unique_counterparties": unique_counterparties,
            "in_neighbors": in_neighbors,
            "out_neighbors": out_neighbors,
            "incoming_volume": round(incoming_volume, 2),
            "outgoing_volume": round(outgoing_volume, 2),
            "net_flow": round(net_flow, 2),
            "incoming_tx_count": incoming_tx_count,
            "outgoing_tx_count": outgoing_tx_count,
            "total_tx_count": total_tx_count,
            "participates_in_cycle": participates_in_cycle
        }

    def calculate_all_metrics(self, cycle_nodes: Set[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Computes network metrics for all vertices in the graph.
        """
        cycle_nodes = cycle_nodes or set()
        results = {}
        for acc in self.graph.get_all_vertices():
            results[acc] = self.calculate_account_metrics(acc, cycle_nodes)
        return results
