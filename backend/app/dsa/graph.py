"""
Directed Graph data structure for transaction tracking and intelligence.
Maintains an adjacency list representation with rich edge and vertex metadata.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Set


@dataclass
class TransactionEdge:
    tx_ref: str
    source: str
    destination: str
    amount: float
    timestamp: str
    description: str
    status: str = "completed"


@dataclass
class AccountVertex:
    account_ref: str
    customer_name: str
    account_type: str
    balance: float
    status: str
    risk_score: int = 0


class TransactionGraph:
    """
    Adjacency List Directed Graph:
    adj: dict[str, list[str]] -> maps source account_ref to list of destination account_refs.
    edges_meta: dict[tuple[str, str], list[TransactionEdge]] -> transaction details on directed edges.
    vertices: dict[str, AccountVertex] -> account node details.
    """

    def __init__(self):
        self.adj: Dict[str, List[str]] = {}
        self.reverse_adj: Dict[str, List[str]] = {}
        self.edges_meta: Dict[tuple[str, str], List[TransactionEdge]] = {}
        self.vertices: Dict[str, AccountVertex] = {}

    def add_vertex(self, vertex: AccountVertex) -> None:
        ref = vertex.account_ref
        self.vertices[ref] = vertex
        if ref not in self.adj:
            self.adj[ref] = []
        if ref not in self.reverse_adj:
            self.reverse_adj[ref] = []

    def add_edge(self, edge: TransactionEdge) -> None:
        src = edge.source
        dst = edge.destination
        if not src or not dst:
            return

        if src not in self.adj:
            self.adj[src] = []
        if src not in self.reverse_adj:
            self.reverse_adj[src] = []

        if dst not in self.adj:
            self.adj[dst] = []
        if dst not in self.reverse_adj:
            self.reverse_adj[dst] = []

        # Only add to adjacency if not already present (multigraph edges stored in edges_meta)
        if dst not in self.adj[src]:
            self.adj[src].append(dst)
        if src not in self.reverse_adj[dst]:
            self.reverse_adj[dst].append(src)

        edge_key = (src, dst)
        if edge_key not in self.edges_meta:
            self.edges_meta[edge_key] = []
        self.edges_meta[edge_key].append(edge)

    def get_neighbors(self, account_ref: str) -> List[str]:
        return self.adj.get(account_ref, [])

    def get_in_neighbors(self, account_ref: str) -> List[str]:
        return self.reverse_adj.get(account_ref, [])

    def get_edges(self, src: str, dst: str) -> List[TransactionEdge]:
        return self.edges_meta.get((src, dst), [])

    def get_all_vertices(self) -> List[str]:
        return list(self.adj.keys())

    @property
    def vertex_count(self) -> int:
        return len(self.adj)

    @property
    def edge_count(self) -> int:
        return sum(len(destinations) for destinations in self.adj.values())

    @property
    def total_transactions_count(self) -> int:
        return sum(len(edges) for edges in self.edges_meta.values())
