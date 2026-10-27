"""
Comprehensive Unit Tests for DSA Engine:
- Directed Graph construction & edge metadata
- DFS Cycle Detection (cycle reconstruction, deduplication, empty graph, acyclic graph, disconnected cycles)
- BFS Fund Tracing (blast radius, hop boundaries, shortest hop paths, unknown nodes)
- Graph Metrics (in-degree, out-degree, volume calculation, net flow)
- Explainable Risk Engine (bounded 0-100, trigger explanations, evidence generation)
"""

import pytest
from app.dsa.graph import TransactionGraph, AccountVertex, TransactionEdge
from app.dsa.dfs import DFSCycleDetector, canonicalize_cycle
from app.dsa.bfs import BFSFundTracer
from app.dsa.metrics import GraphMetricsCalculator
from app.dsa.risk_engine import RiskScoringEngine


@pytest.fixture
def empty_graph():
    return TransactionGraph()


@pytest.fixture
def cyclic_graph():
    """
    Creates graph:
    Cycle: A -> B -> C -> A
    Branch: C -> D -> E
    Isolated: F
    """
    g = TransactionGraph()
    for acc in ["A", "B", "C", "D", "E", "F"]:
        g.add_vertex(AccountVertex(
            account_ref=acc,
            customer_name=f"Customer {acc}",
            account_type="current",
            balance=10000.0,
            status="active"
        ))
    
    # Cycle A -> B -> C -> A
    g.add_edge(TransactionEdge("TX1", "A", "B", 1850.0, "2025-03-23 10:00:00", "Cycle 1"))
    g.add_edge(TransactionEdge("TX2", "B", "C", 1850.0, "2025-03-23 11:00:00", "Cycle 2"))
    g.add_edge(TransactionEdge("TX3", "C", "A", 1850.0, "2025-03-23 12:00:00", "Cycle 3"))

    # Branch C -> D -> E
    g.add_edge(TransactionEdge("TX4", "C", "D", 500.0, "2025-03-23 13:00:00", "Branch 1"))
    g.add_edge(TransactionEdge("TX5", "D", "E", 400.0, "2025-03-23 14:00:00", "Branch 2"))
    return g


@pytest.fixture
def acyclic_graph():
    """
    DAG:
    A -> B -> D
    A -> C -> D
    """
    g = TransactionGraph()
    for acc in ["A", "B", "C", "D"]:
        g.add_vertex(AccountVertex(
            account_ref=acc,
            customer_name=f"Customer {acc}",
            account_type="savings",
            balance=5000.0,
            status="active"
        ))
    g.add_edge(TransactionEdge("TX1", "A", "B", 100.0, "2025-03-24 10:00:00", "Edge 1"))
    g.add_edge(TransactionEdge("TX2", "A", "C", 200.0, "2025-03-24 10:10:00", "Edge 2"))
    g.add_edge(TransactionEdge("TX3", "B", "D", 100.0, "2025-03-24 10:20:00", "Edge 3"))
    g.add_edge(TransactionEdge("TX4", "C", "D", 200.0, "2025-03-24 10:30:00", "Edge 4"))
    return g


def test_empty_graph(empty_graph):
    detector = DFSCycleDetector(empty_graph)
    result = detector.detect_cycles()
    assert result["cycle_count"] == 0
    assert result["cycles"] == []
    assert len(result["participating_accounts"]) == 0

    tracer = BFSFundTracer(empty_graph)
    bfs_result = tracer.trace_fund_flow("A", max_hops=3)
    assert "error" in bfs_result


def test_dfs_cycle_detection(cyclic_graph):
    detector = DFSCycleDetector(cyclic_graph)
    result = detector.detect_cycles()
    
    assert result["cycle_count"] == 1
    cycle = result["cycles"][0]
    assert cycle[0] == cycle[-1]  # Closed loop
    # Nodes in cycle are A, B, C
    cycle_nodes_set = set(cycle)
    assert cycle_nodes_set == {"A", "B", "C"}
    assert set(result["participating_accounts"]) == {"A", "B", "C"}
    assert len(result["trace"]) > 0


def test_dfs_acyclic_graph(acyclic_graph):
    detector = DFSCycleDetector(acyclic_graph)
    result = detector.detect_cycles()
    assert result["cycle_count"] == 0
    assert result["cycles"] == []
    assert len(result["participating_accounts"]) == 0


def test_bfs_fund_tracing(cyclic_graph):
    tracer = BFSFundTracer(cyclic_graph)
    
    # 1-hop tracing from A
    result_1hop = tracer.trace_fund_flow("A", max_hops=1)
    reached_1 = [n["account_ref"] for n in result_1hop["reachable_nodes"]]
    assert reached_1 == ["B"]

    # 3-hop tracing from A
    # A -> B (1), B -> C (2), C -> D (3). Since A is already visited, back-edge to A is not enqueued as a new hop
    result_3hop = tracer.trace_fund_flow("A", max_hops=3)
    reached_3 = [n["account_ref"] for n in result_3hop["reachable_nodes"]]
    assert "B" in reached_3
    assert "C" in reached_3
    assert "D" in reached_3
    
    # Hop distances
    dist_map = {n["account_ref"]: n["hop_distance"] for n in result_3hop["reachable_nodes"]}
    assert dist_map["B"] == 1
    assert dist_map["C"] == 2
    assert dist_map["D"] == 3


def test_bfs_unknown_account(cyclic_graph):
    tracer = BFSFundTracer(cyclic_graph)
    result = tracer.trace_fund_flow("NON_EXISTENT_ACC", max_hops=3)
    assert "error" in result
    assert result["reachable_nodes"] == []


def test_graph_metrics(cyclic_graph):
    calc = GraphMetricsCalculator(cyclic_graph)
    metrics_c = calc.calculate_account_metrics("C", cycle_nodes={"A", "B", "C"})
    
    # C receives from B, sends to A and D
    assert metrics_c["in_degree"] == 1
    assert metrics_c["out_degree"] == 2
    assert metrics_c["incoming_volume"] == 1850.0
    assert metrics_c["outgoing_volume"] == 1850.0 + 500.0  # 2350.0
    assert metrics_c["participates_in_cycle"] is True


def test_risk_scoring_bounds_and_explanations(cyclic_graph):
    engine = RiskScoringEngine(cyclic_graph, cycle_nodes={"A", "B", "C"})
    res_a = engine.evaluate_account_risk("A", daily_limit=5000.0, per_tx_limit=2500.0)
    
    assert 0 <= res_a["risk_score"] <= 100
    assert res_a["rules_triggered_count"] >= 1
    assert any(r["rule_id"] == "RULE_CYCLE_PARTICIPATION" for r in res_a["triggered_rules"])
    assert res_a["severity"] in ["low", "medium", "high", "critical"]
    assert "A" in res_a["plain_explanation"] or "cycle" in res_a["plain_explanation"].lower()


def test_canonicalize_cycle():
    c1 = ["A", "B", "C", "A"]
    c2 = ["B", "C", "A", "B"]
    c3 = ["C", "A", "B", "C"]
    assert canonicalize_cycle(c1) == canonicalize_cycle(c2) == canonicalize_cycle(c3)
