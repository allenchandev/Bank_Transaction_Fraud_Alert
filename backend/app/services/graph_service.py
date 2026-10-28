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
from app.dsa.hierarchy import BankHierarchyTree, NodeType
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

    def build_bank_hierarchy(self) -> BankHierarchyTree:
        """
        Constructs the Bank Hierarchy Tree (Head Branch -> Divisions -> Branches -> Users -> Accounts)
        dynamically mapped from current customers and accounts in the database.
        """
        tree = BankHierarchyTree(
            head_branch_id="HEAD-MAIN",
            head_branch_name="Aegis Federal Central Head Branch",
            city="Metropolis Financial Center"
        )

        # 1. Primary Banking Divisions
        divisions = [
            ("DIV-RETAIL", "Retail & Consumer Banking Division", "Consumer deposits, savings & student financing"),
            ("DIV-COMMERCIAL", "Commercial & Corporate Banking Division", "Business lines, corporate liquidity & merchants"),
            ("DIV-WEALTH", "Private Wealth & High Net-Worth Division", "High-balance portfolio management & private trusts")
        ]
        for div_id, div_name, desc in divisions:
            tree.add_node(
                parent_id="HEAD-MAIN",
                node_id=div_id,
                name=div_name,
                node_type=NodeType.DIVISION,
                metadata={"description": desc}
            )

        # 2. Regional / Local Operating Branches under Divisions
        branches = [
            # Under Retail Division
            ("BR-RET-01", "DIV-RETAIL", "Downtown Metro Retail Branch", "District 1 - Core City"),
            ("BR-RET-02", "DIV-RETAIL", "North Campus University Branch", "University Student Hub"),
            # Under Commercial Division
            ("BR-COM-01", "DIV-COMMERCIAL", "Corporate Exchange Center", "Financial District Tower 4"),
            ("BR-COM-02", "DIV-COMMERCIAL", "Logistics & Trade Port Branch", "Industrial Wharf District"),
            # Under Wealth Division
            ("BR-WTH-01", "DIV-WEALTH", "Aegis Private Client Pavilion", "Uptown Financial Suites")
        ]
        for br_id, parent_div, br_name, location in branches:
            tree.add_node(
                parent_id=parent_div,
                node_id=br_id,
                name=br_name,
                node_type=NodeType.BRANCH,
                metadata={"location": location}
            )

        # 3. Fetch Customers (Users) and their Accounts from DB
        customers = self.repo.get_customers()
        accounts = self.repo.get_accounts()

        # Group accounts by customer_id
        accounts_by_cust: Dict[int, List[Dict[str, Any]]] = {}
        for acc in accounts:
            cid = acc["customer_id"]
            if cid not in accounts_by_cust:
                accounts_by_cust[cid] = []
            accounts_by_cust[cid].append(acc)

        for cust in customers:
            cid = cust["id"]
            cust_ref = cust["customer_ref"]
            full_name = cust["full_name"]
            cust_accounts = accounts_by_cust.get(cid, [])

            # Route user to branch based on account type and balance profile
            has_student = any(a.get("account_type") == "student" for a in cust_accounts)
            total_bal = sum(float(a.get("balance", 0)) for a in cust_accounts)

            if total_bal >= 50000.0:
                target_branch_id = "BR-WTH-01"  # Wealth Pavilion
            elif has_student:
                target_branch_id = "BR-RET-02"  # University Branch
            elif any(a.get("account_type") == "current" and float(a.get("balance", 0)) > 20000.0 for a in cust_accounts):
                target_branch_id = "BR-COM-01"  # Corporate Exchange
            elif cust.get("occupation") in ["Import/Export Trader", "Logistics Coordinator"]:
                target_branch_id = "BR-COM-02"  # Logistics & Trade Branch
            else:
                target_branch_id = "BR-RET-01"  # Downtown Metro

            # Add User / Customer Node
            user_node_id = f"USER-{cust_ref}"
            tree.add_node(
                parent_id=target_branch_id,
                node_id=user_node_id,
                name=full_name,
                node_type=NodeType.USER,
                metadata={
                    "customer_id": cid,
                    "customer_ref": cust_ref,
                    "email": cust["email"],
                    "occupation": cust.get("occupation"),
                    "age_band": cust.get("age_band")
                }
            )

            # Add Account Nodes under the User Node
            for acc in cust_accounts:
                acc_ref = acc["account_ref"]
                acc_node_id = f"ACC-{acc_ref}"
                tree.add_node(
                    parent_id=user_node_id,
                    node_id=acc_node_id,
                    name=f"Account {acc_ref} ({acc.get('account_type', 'savings')})",
                    node_type=NodeType.ACCOUNT,
                    metadata={
                        "account_ref": acc_ref,
                        "account_type": acc.get("account_type"),
                        "balance": float(acc.get("balance", 0.0)),
                        "status": acc.get("status", "active"),
                        "daily_limit": float(acc.get("daily_transfer_limit", 5000.0))
                    }
                )

        return tree


graph_service = GraphIntelligenceService()

