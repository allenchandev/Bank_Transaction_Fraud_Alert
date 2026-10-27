"""
Transaction Monitoring and Alert Engine.
Deterministic rule engine evaluating transactions post-execution.
Generates explainable, persisted alerts without false-duplicate pollution.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from app.repositories.ledger_repository import ledger_repo

logger = logging.getLogger("aegis.monitoring")


class TransactionMonitoringEngine:
    def __init__(self):
        self.repo = ledger_repo

    def evaluate_transaction(self, tx_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluates a newly executed transaction against deterministic monitoring rules.
        """
        generated_alerts = []
        src = tx_dict.get("source_account") or tx_dict.get("source_ref")
        dst = tx_dict.get("destination_account") or tx_dict.get("dest_ref")
        amount = float(tx_dict.get("amount", 0.0))
        tx_ref = tx_dict.get("tx_ref")
        tx_type = tx_dict.get("tx_type", "transfer")

        if not src or tx_type != "transfer":
            return []

        # Rule 1: High Transaction Amount Threshold
        if amount >= 4000.0:
            existing = self.repo.get_alerts(account_ref=src)
            already_alerted = any(a.get("tx_ref") == tx_ref for a in existing)
            if not already_alerted:
                alert = self.repo.create_alert(
                    account_ref=src,
                    tx_ref=tx_ref,
                    risk_score=72,
                    severity="high",
                    rule_code="RULE_LARGE_AMOUNT",
                    explanation=f"Single outbound transfer of ${amount:,.2f} exceeds high-value threshold ($4,000.00).",
                    evidence={"amount": amount, "threshold": 4000.0, "destination": dst}
                )
                generated_alerts.append(alert)

        # Rule 2: Burst Detection (>= 3 transfers from same account in last 5 minutes)
        recent_txs = self.repo.get_transactions(account_ref=src, limit=10, tx_type="transfer", status="completed")
        if len(recent_txs) >= 3:
            # Check timestamps
            now = datetime.now()
            recent_burst = 0
            for rtx in recent_txs[:5]:
                try:
                    rtx_time = datetime.strptime(str(rtx["created_at"]), "%Y-%m-%d %H:%M:%S")
                    if (now - rtx_time).total_seconds() <= 300:
                        recent_burst += 1
                except Exception:
                    pass

            if recent_burst >= 3:
                existing = self.repo.get_alerts(account_ref=src)
                burst_alerted = any(a.get("rule_code") == "RULE_BURST_FREQUENCY" for a in existing[:3])
                if not burst_alerted:
                    alert = self.repo.create_alert(
                        account_ref=src,
                        tx_ref=tx_ref,
                        risk_score=68,
                        severity="medium",
                        rule_code="RULE_BURST_FREQUENCY",
                        explanation=f"High frequency transfer burst: {recent_burst} transfers dispatched in under 5 minutes.",
                        evidence={"burst_count": recent_burst, "window_seconds": 300}
                    )
                    generated_alerts.append(alert)

        return generated_alerts


monitoring_engine = TransactionMonitoringEngine()
