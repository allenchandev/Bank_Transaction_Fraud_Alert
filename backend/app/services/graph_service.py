"""
Graph Intelligence Service.
Builds the live TransactionGraph from persisted database records, executes DFS cycle detection,
BFS blast-radius tracing, risk ranking, and converts graph topology into React Flow ready structures.
"""

from typing import Any, Dict, List, Optional, Set
from app.dsa.graph import TransactionGraph, AccountVertex, TransactionEdge
from app.dsa.dfs import DFSCycleDetector
from app.dsa.bfs import BFSFundTracer
from app.dsa.metrics import GraphMetricsCalculator
from app.dsa.risk_engine import RiskScoringEngine
from app.repositories.ledger_repository import ledger_repo


class GraphIntelligenceService:
    def __init__(self):
        self.repo = ledger_repo

    def build_graph_from_db(self) -> TransactionGraph:
        """
        Constructs an in-memory TransactionGraph directly from current persisted accounts and transactions.
        """
        g = TransactionGraph()
        
        # 1. Fetch all accounts
        accounts = self.repo.get_accounts()
        for acc in accounts:
            g.add_vertex(AccountVertex(
                account_ref=acc["account_ref"],
                customer_name=acc.get("customer_name", "Anonymous"),
                account_type=acc["account_type"],
                balance=float(acc["balance"]),
                status=acc["status"]
            ))

        # 2. Fetch all completed transfers
        txs = self.repo.get_transactions(limit=1000, tx_type="transfer", status="completed")
        for tx in txs:
            src = tx.get("source_account")
            dst = tx.get("destination_account")
            if src and dst:
                g.add_edge(TransactionEdge(
                    tx_ref=tx["tx_ref"],
                    source=src,
                    destination=dst,
                    amount=float(tx["amount"]),
                    timestamp=str(tx["created_at"]),
                    description=tx.get("description", "")
                ))

        return g

    def get_full_network_overview(self) -> Dict[str, Any]:
        """
        Calculates entire system intelligence overview:
        - DFS cycle detection
        - All account risk scores
        - React Flow nodes and edges
        """
        g = self.build_graph_from_db()
        
        # Run DFS Cycle Detection
        dfs_detector = DFSCycleDetector(g)
        dfs_results = dfs_detector.detect_cycles()
        cycle_nodes_set = set(dfs_results["participating_accounts"])

        # Run Risk Engine
        risk_engine = RiskScoringEngine(g, cycle_nodes=cycle_nodes_set)
        accounts = self.repo.get_accounts()
        
        ranked_accounts = []
        for acc in accounts:
            ref = acc["account_ref"]
            risk_info = risk_engine.evaluate_account_risk(
                account_ref=ref,
                daily_limit=float(acc["daily_transfer_limit"]),
                per_tx_limit=float(acc["per_tx_limit"])
            )
            ranked_accounts.append({
                **acc,
                **risk_info
            })

        # Sort by risk score descending
        ranked_accounts.sort(key=lambda x: x["risk_score"], reverse=True)

        # Convert to React Flow Nodes & Edges
        react_flow_data = self._to_react_flow(g, dfs_results, ranked_accounts)

        # Overview statistics
        total_volume = sum(float(tx["amount"]) for tx in self.repo.get_transactions(limit=1000, status="completed"))
        total_txs = len(self.repo.get_transactions(limit=2000, status="completed"))
        alerts = self.repo.get_alerts()
        open_alerts = [a for a in alerts if a["status"] in ("open", "investigating")]
        critical_alerts = [a for a in alerts if a["severity"] in ("critical", "high")]

        return {
            "summary": {
                "total_accounts": len(accounts),
                "total_transactions": total_txs,
                "total_volume": round(total_volume, 2),
                "cycles_detected_count": dfs_results["cycle_count"],
                "open_alerts_count": len(open_alerts),
                "critical_alerts_count": len(critical_alerts),
                "high_risk_accounts_count": sum(1 for a in ranked_accounts if a["risk_score"] >= 70)
            },
            "dfs_results": dfs_results,
            "risk_ranking": ranked_accounts,
            "graph": react_flow_data
        }

    def execute_dfs(self) -> Dict[str, Any]:
        g = self.build_graph_from_db()
        dfs_detector = DFSCycleDetector(g)
        return dfs_detector.detect_cycles()

    def execute_bfs(self, source_account: str, max_hops: int = 3) -> Dict[str, Any]:
        g = self.build_graph_from_db()
        bfs_tracer = BFSFundTracer(g)
        return bfs_tracer.trace_fund_flow(source_account, max_hops=max_hops)

    def get_account_investigation(self, account_ref: str) -> Dict[str, Any]:
        g = self.build_graph_from_db()
        account = self.repo.get_account_by_ref(account_ref)
        if not account:
            return {"error": f"Account '{account_ref}' not found."}

        dfs_detector = DFSCycleDetector(g)
        dfs_res = dfs_detector.detect_cycles()
        cycle_nodes_set = set(dfs_res["participating_accounts"])

        risk_engine = RiskScoringEngine(g, cycle_nodes=cycle_nodes_set)
        risk_info = risk_engine.evaluate_account_risk(
            account_ref=account_ref,
            daily_limit=float(account["daily_transfer_limit"]),
            per_tx_limit=float(account["per_tx_limit"])
        )

        bfs_tracer = BFSFundTracer(g)
        blast_radius = bfs_tracer.trace_fund_flow(account_ref, max_hops=2)

        transactions = self.repo.get_transactions(account_ref=account_ref, limit=50)
        alerts = self.repo.get_alerts(account_ref=account_ref)

        daily_transfers_today = self.repo.get_daily_transfers_sum(account_ref)

        return {
            "account": account,
            "risk_assessment": risk_info,
            "blast_radius": blast_radius,
            "recent_transactions": transactions,
            "associated_alerts": alerts,
            "limits": {
                "daily_limit": float(account["daily_transfer_limit"]),
                "used_today": daily_transfers_today,
                "remaining_today": max(0.0, float(account["daily_transfer_limit"]) - daily_transfers_today),
                "per_tx_limit": float(account["per_tx_limit"]),
                "monthly_budget": float(account.get("monthly_budget") or 0.0)
            }
        }

    def _to_react_flow(
        self,
        g: TransactionGraph,
        dfs_results: Dict[str, Any],
        ranked_accounts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Converts TransactionGraph into nodes and edges ready for @xyflow/react.
        """
        risk_map = {acc["account_ref"]: acc["risk_score"] for acc in ranked_accounts}
        cycle_nodes = set(dfs_results.get("participating_accounts", []))
        cycle_edges_set = set()
        for c in dfs_results.get("cycles", []):
            for i in range(len(c) - 1):
                cycle_edges_set.add((c[i], c[i + 1]))

        nodes = []
        import math
        all_vertices = g.get_all_vertices()
        total_vertices = len(all_vertices)

        # Arrange in aesthetic circle or grid layout
        radius = 320 + (total_vertices * 15)
        for i, ref in enumerate(all_vertices):
            v_info = g.vertices.get(ref)
            angle = (2 * math.pi * i) / max(1, total_vertices)
            pos_x = 450 + radius * math.cos(angle)
            pos_y = 350 + radius * math.sin(angle)

            risk = risk_map.get(ref, 0)
            in_cycle = ref in cycle_nodes

            nodes.append({
                "id": ref,
                "type": "accountNode",
                "position": {"x": round(pos_x, 1), "y": round(pos_y, 1)},
                "data": {
                    "accountRef": ref,
                    "customerName": v_info.customer_name if v_info else "Unknown",
                    "accountType": v_info.account_type if v_info else "savings",
                    "balance": v_info.balance if v_info else 0.0,
                    "status": v_info.status if v_info else "active",
                    "riskScore": risk,
                    "inCycle": in_cycle
                }
            })

        edges = []
        edge_id_counter = 1
        for (src, dst), edge_list in g.edges_meta.items():
            total_flow = sum(e.amount for e in edge_list)
            is_cycle_edge = (src, dst) in cycle_edges_set

            tx_details = [{
                "tx_ref": e.tx_ref,
                "amount": e.amount,
                "timestamp": e.timestamp,
                "description": e.description
            } for e in edge_list]

            edges.append({
                "id": f"e-{src}-{dst}-{edge_id_counter}",
                "source": src,
                "target": dst,
                "type": "transactionEdge",
                "animated": is_cycle_edge,
                "data": {
                    "amount": round(total_flow, 2),
                    "txCount": len(edge_list),
                    "isCycleEdge": is_cycle_edge,
                    "transactions": tx_details
                }
            })
            edge_id_counter += 1

        return {
            "nodes": nodes,
            "edges": edges
        }


graph_service = GraphIntelligenceService()
