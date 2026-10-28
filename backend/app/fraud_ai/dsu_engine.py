"""
Disjoint Set Union (DSU / Union-Find) Engine with Path Compression and Union by Rank
Used in Aegis Bank Transaction Fraud Alert System to:
1. Dynamically cluster transactions into connected account syndicates
2. Detect circular smurfing / money-mule routing in O(α(N)) near-constant time
3. Measure syndicate risk propagation (if one account in a set is compromised, the entire set's risk increases)
"""

from typing import Dict, List, Set, Any, Tuple, Optional


class DisjointSetUnion:
    """
    DSU implementation supporting:
    - find(x): with path compression
    - union(x, y): with union by rank
    - cycle detection: if find(u) == find(v), adding edge (u, v) creates a cycle
    - connected components clustering
    """

    def __init__(self):
        self.parent: Dict[str, str] = {}
        self.rank: Dict[str, int] = {}
        self.component_size: Dict[str, int] = {}
        self.edges: List[Dict[str, Any]] = []
        self.cycles: List[Dict[str, Any]] = []
        self.steps_log: List[Dict[str, Any]] = []

    def make_set(self, x: str):
        if x not in self.parent:
            self.parent[x] = x
            self.rank[x] = 0
            self.component_size[x] = 1

    def find(self, x: str) -> str:
        self.make_set(x)
        # Path compression
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, u: str, v: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Unites components containing u and v.
        Returns:
            False if u and v were ALREADY in the same set (a CYCLE was detected!)
            True if a new union was formed.
        """
        self.make_set(u)
        self.make_set(v)
        root_u = self.find(u)
        root_v = self.find(v)

        edge_info = {
            "source": u,
            "target": v,
            "amount": metadata.get("amount") if metadata else None,
            "utr": metadata.get("utr") if metadata else None,
        }
        self.edges.append(edge_info)

        if root_u == root_v:
            # Cycle detected via DSU!
            cycle_record = {
                "source": u,
                "target": v,
                "representative_root": root_u,
                "metadata": metadata or {},
                "explanation": f"Disjoint Set Union cycle found: {u} and {v} share common set representative '{root_u}'. Adding this transaction forms a closed loop."
            }
            self.cycles.append(cycle_record)
            self.steps_log.append({
                "action": "CYCLE_DETECTED",
                "u": u,
                "v": v,
                "root": root_u,
                "is_cycle": True,
                "details": f"Transaction from {u} to {v} closes a cycle inside syndicate root '{root_u}'."
            })
            return False

        # Union by rank
        if self.rank[root_u] < self.rank[root_v]:
            root_u, root_v = root_v, root_u

        self.parent[root_v] = root_u
        self.component_size[root_u] += self.component_size[root_v]
        if self.rank[root_u] == self.rank[root_v]:
            self.rank[root_u] += 1

        self.steps_log.append({
            "action": "UNION_SUCCESS",
            "u": u,
            "v": v,
            "new_root": root_u,
            "merged_size": self.component_size[root_u],
            "is_cycle": False,
            "details": f"United {u} and {v} into syndicate root '{root_u}' (Syndicate size: {self.component_size[root_u]})."
        })
        return True

    def get_syndicates(self) -> List[Dict[str, Any]]:
        """
        Groups all registered accounts by their representative root.
        """
        groups: Dict[str, List[str]] = {}
        for node in list(self.parent.keys()):
            root = self.find(node)
            if root not in groups:
                groups[root] = []
            groups[root].append(node)

        syndicates = []
        for root, members in groups.items():
            syndicates.append({
                "syndicate_id": f"SYN-{root}",
                "root_account": root,
                "cluster_size": len(members),
                "members": sorted(members),
                "is_suspicious_cluster": len(members) >= 3,
                "risk_badge": "High Risk Syndicate" if len(members) >= 3 else "Normal Peer Group"
            })
        return sorted(syndicates, key=lambda s: s["cluster_size"], reverse=True)


class DSUFraudEvaluator:
    """
    Evaluator that builds a DSU from historical and candidate transactions
    to produce forensic clustering insights.
    """

    def analyze_syndicate_clustering(
        self,
        current_sender: str,
        current_receiver: str,
        amount: float,
        utr: Optional[str] = None
    ) -> Dict[str, Any]:
        dsu = DisjointSetUnion()

        # Seed realistic network edges from known ledger topology
        baseline_edges = [
            ("ACC-2001", "ACC-2002", {"amount": 49000, "utr": "98214210001"}),
            ("ACC-2002", "ACC-2003", {"amount": 48500, "utr": "98214210002"}),
            ("ACC-2003", "ACC-2001", {"amount": 48000, "utr": "98214210003"}),  # Known cycle
            ("ACC-2004", "ACC-2005", {"amount": 12000, "utr": "98214210004"}),
            ("ACC-2005", "ACC-2006", {"amount": 11500, "utr": "98214210005"}),
            ("ACC-2007", "ACC-2008", {"amount": 25000, "utr": "98214210006"}),
        ]

        for u, v, meta in baseline_edges:
            dsu.union(u, v, meta)

        # Now evaluate candidate transaction in this DSU
        sender = current_sender or "ACC-CANDIDATE-SRC"
        receiver = current_receiver or "target_vendor@oksbi"

        is_new_union = dsu.union(sender, receiver, {"amount": amount, "utr": utr})
        candidate_cycle_detected = not is_new_union

        syndicates = dsu.get_syndicates()
        target_root = dsu.find(sender)
        target_syndicate = next((s for s in syndicates if s["root_account"] == target_root), None)

        return {
            "is_applicable": True,
            "algorithm": "Disjoint Set Union (DSU / Union-Find)",
            "time_complexity": "O(α(N)) — Inverse Ackermann (Near Constant Time)",
            "space_complexity": "O(V) vertices",
            "candidate_transaction": {
                "sender": sender,
                "receiver": receiver,
                "amount": amount,
                "utr": utr,
            },
            "cycle_detected": candidate_cycle_detected or len(dsu.cycles) > 0,
            "candidate_causes_cycle": candidate_cycle_detected,
            "total_syndicates_count": len(syndicates),
            "total_cycles_detected": len(dsu.cycles),
            "target_syndicate": target_syndicate,
            "syndicates": syndicates[:4],
            "dsu_steps": dsu.steps_log[-5:],
            "verdict_summary": (
                f"DSU Union-Find identified a closed-loop transaction cycle inside syndicate '{target_root}'."
                if candidate_cycle_detected
                else f"Transaction mapped to syndicate '{target_root}' with {target_syndicate['cluster_size'] if target_syndicate else 2} linked accounts."
            )
        }


dsu_fraud_evaluator = DSUFraudEvaluator()
