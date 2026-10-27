"""
Transparent, Explainable Heuristic Risk Scoring Engine.
Calculates deterministic risk scores (0 to 100) based strictly on observable transaction behaviors:
- Graph topology (cycles, high fan-out dispersion)
- Flow velocity (rapid turnaround / immediate forwarding)
- Velocity bursts (frequency threshold breaches)
- Volume breaches relative to account limit configurations
Strictly avoids demographic bias (age, occupation, income, or account type).
"""

from typing import Any, Dict, List, Optional, Set
from app.dsa.graph import TransactionGraph
from app.dsa.metrics import GraphMetricsCalculator


class RiskScoringEngine:
    """
    Explainable Risk Engine producing transparent weights, rule IDs, and human-readable evidence.
    """

    def __init__(self, graph: TransactionGraph, cycle_nodes: Optional[Set[str]] = None):
        self.graph = graph
        self.cycle_nodes = cycle_nodes or set()
        self.metrics_calc = GraphMetricsCalculator(graph)

    def evaluate_account_risk(
        self,
        account_ref: str,
        recent_transactions: Optional[List[Dict[str, Any]]] = None,
        daily_limit: float = 5000.0,
        per_tx_limit: float = 2500.0
    ) -> Dict[str, Any]:
        """
        Calculates the risk score and returns a comprehensive explainability payload.
        """
        metrics = self.metrics_calc.calculate_account_metrics(account_ref, self.cycle_nodes)
        
        triggered_rules: List[Dict[str, Any]] = []
        score = 0

        # RULE 1: Circular Fund Routing (+35)
        if metrics["participates_in_cycle"]:
            score += 35
            triggered_rules.append({
                "rule_id": "RULE_CYCLE_PARTICIPATION",
                "name": "Circular Transaction Loop",
                "points": 35,
                "severity": "high",
                "evidence": {
                    "account_ref": account_ref,
                    "cycle_participation": True,
                    "in_neighbors": metrics["in_neighbors"],
                    "out_neighbors": metrics["out_neighbors"]
                },
                "explanation": "Account is a node in a closed circular money flow (A -> ... -> A). Cycles can be indicative of synthetic velocity or round-tripping."
            })

        # RULE 2: Rapid Fan-Out / Fund Dispersion (+20)
        # Out-degree >= 3 with high outgoing volume
        if metrics["out_degree"] >= 3:
            pts = 25 if metrics["out_degree"] >= 4 else 20
            score += pts
            triggered_rules.append({
                "rule_id": "RULE_HIGH_DISPERSION",
                "name": "Rapid Multi-Party Fund Dispersion",
                "points": pts,
                "severity": "medium",
                "evidence": {
                    "out_degree": metrics["out_degree"],
                    "unique_recipients": metrics["out_neighbors"],
                    "outgoing_volume": metrics["outgoing_volume"]
                },
                "explanation": f"Account dispersed funds to {metrics['out_degree']} distinct counterparties, typical of fan-out or money mule layering behavior."
            })

        # RULE 3: Rapid Turnaround / Passthrough Velocity (+15)
        # High incoming volume coupled with comparable outgoing volume (>70% matched)
        if metrics["incoming_volume"] > 1000.0 and metrics["outgoing_volume"] > 1000.0:
            ratio = min(metrics["incoming_volume"], metrics["outgoing_volume"]) / max(metrics["incoming_volume"], metrics["outgoing_volume"])
            if ratio >= 0.70:
                score += 15
                triggered_rules.append({
                    "rule_id": "RULE_PASSTHROUGH_FLOW",
                    "name": "High Passthrough Velocity (Transit Account)",
                    "points": 15,
                    "severity": "medium",
                    "evidence": {
                        "incoming_volume": metrics["incoming_volume"],
                        "outgoing_volume": metrics["outgoing_volume"],
                        "flow_ratio": round(ratio, 2)
                    },
                    "explanation": f"Inflow (${metrics['incoming_volume']:,.2f}) closely mirrors outflow (${metrics['outgoing_volume']:,.2f}) with a {round(ratio * 100)}% match, resembling a transit passthrough account."
                })

        # RULE 4: Outgoing Volume Exceeding Daily Limit (+15)
        if metrics["outgoing_volume"] >= daily_limit * 0.8:
            score += 15
            triggered_rules.append({
                "rule_id": "RULE_LIMIT_PROXIMITY",
                "name": "Near-Threshold Daily Limit Consumption",
                "points": 15,
                "severity": "medium",
                "evidence": {
                    "outgoing_volume": metrics["outgoing_volume"],
                    "daily_limit": daily_limit,
                    "utilization_pct": round((metrics["outgoing_volume"] / daily_limit) * 100, 1)
                },
                "explanation": f"Total outgoing volume reached ${metrics['outgoing_volume']:,.2f}, consuming over 80% of daily limit allowance (${daily_limit:,.2f})."
            })

        # RULE 5: High Frequency Transaction Burst (+15)
        if metrics["outgoing_tx_count"] >= 3:
            score += 15
            triggered_rules.append({
                "rule_id": "RULE_BURST_ACTIVITY",
                "name": "High-Frequency Outbound Activity",
                "points": 15,
                "severity": "medium",
                "evidence": {
                    "outgoing_tx_count": metrics["outgoing_tx_count"],
                    "threshold": 3
                },
                "explanation": f"Account recorded {metrics['outgoing_tx_count']} outbound transactions, reflecting elevated transaction frequency."
            })

        # Cap score between 0 and 100
        bounded_score = max(0, min(100, score))

        # Severity mapping
        if bounded_score >= 85:
            severity = "critical"
            recommendation = "Immediate account freeze recommended; escalate to senior financial crimes investigator."
        elif bounded_score >= 70:
            severity = "high"
            recommendation = "Priority review required; investigate downstream counterparty blast radius and verify beneficiary provenance."
        elif bounded_score >= 40:
            severity = "medium"
            recommendation = "Standard investigation queue; monitor for recurring patterns or limit breach alerts."
        else:
            severity = "low"
            recommendation = "Normal activity baseline. No immediate intervention required."

        # Plain-English overall explanation
        if triggered_rules:
            rule_names = [r["name"] for r in triggered_rules]
            plain_explanation = f"Account exhibited {len(triggered_rules)} suspicious signal(s): {', '.join(rule_names)}. Risk score calculated as {bounded_score}/100 ({severity.upper()})."
        else:
            plain_explanation = f"No suspicious patterns identified. Account metrics remain within normal baseline thresholds ({bounded_score}/100, LOW risk)."

        return {
            "account_ref": account_ref,
            "risk_score": bounded_score,
            "severity": severity,
            "recommendation": recommendation,
            "plain_explanation": plain_explanation,
            "rules_triggered_count": len(triggered_rules),
            "triggered_rules": triggered_rules,
            "metrics": metrics
        }
