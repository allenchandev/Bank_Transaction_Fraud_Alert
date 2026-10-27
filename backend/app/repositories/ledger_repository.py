"""
Ledger and Entities Repository.
Implements ACID-compliant atomic transactions, balance verifications, limits enforcement,
and audit trail recording.
"""

import json
import logging
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple
from app.core.database import db, ACTIVE_DB_TYPE

logger = logging.getLogger("aegis.ledger")


class LedgerRepository:
    def __init__(self):
        self.db = db

    # ================= CUSTOMERS =================
    def get_customers(self) -> List[Dict[str, Any]]:
        query = "SELECT * FROM customers ORDER BY id ASC;"
        return self.db.execute_query(query, fetch="all") or []

    def get_customer_by_id(self, customer_id: int) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM customers WHERE id = %s;"
        return self.db.execute_query(query, (customer_id,), fetch="one")

    # ================= ACCOUNTS =================
    def get_accounts(self) -> List[Dict[str, Any]]:
        query = """
        SELECT a.*, c.full_name as customer_name, c.email as customer_email,
               c.occupation, c.age_band, c.declared_income_band
        FROM accounts a
        JOIN customers c ON a.customer_id = c.id
        ORDER BY a.id ASC;
        """
        return self.db.execute_query(query, fetch="all") or []

    def get_account_by_ref(self, account_ref: str) -> Optional[Dict[str, Any]]:
        query = """
        SELECT a.*, c.full_name as customer_name, c.email as customer_email,
               c.occupation, c.age_band, c.declared_income_band
        FROM accounts a
        JOIN customers c ON a.customer_id = c.id
        WHERE a.account_ref = %s;
        """
        return self.db.execute_query(query, (account_ref,), fetch="one")

    def update_account_status(self, account_ref: str, status: str) -> bool:
        query = "UPDATE accounts SET status = %s WHERE account_ref = %s;"
        self.db.execute_query(query, (status, account_ref), fetch="none")
        return True

    def update_account_limits(
        self,
        account_ref: str,
        daily_transfer_limit: Optional[float] = None,
        per_tx_limit: Optional[float] = None,
        monthly_budget: Optional[float] = None
    ) -> bool:
        fields = []
        params = []
        if daily_transfer_limit is not None:
            fields.append("daily_transfer_limit = %s")
            params.append(daily_transfer_limit)
        if per_tx_limit is not None:
            fields.append("per_tx_limit = %s")
            params.append(per_tx_limit)
        if monthly_budget is not None:
            fields.append("monthly_budget = %s")
            params.append(monthly_budget)

        if not fields:
            return False

        params.append(account_ref)
        query = f"UPDATE accounts SET {', '.join(fields)} WHERE account_ref = %s;"
        self.db.execute_query(query, tuple(params), fetch="none")
        return True

    # ================= TRANSACTIONS =================
    def get_transactions(
        self,
        account_ref: Optional[str] = None,
        limit: int = 100,
        tx_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        conditions = []
        params = []

        if account_ref:
            conditions.append("(source_account = %s OR destination_account = %s)")
            params.extend([account_ref, account_ref])
        if tx_type:
            conditions.append("tx_type = %s")
            params.append(tx_type)
        if status:
            conditions.append("status = %s")
            params.append(status)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)
        query = f"SELECT * FROM transactions {where_clause} ORDER BY id DESC LIMIT %s;"
        return self.db.execute_query(query, tuple(params), fetch="all") or []

    def get_daily_transfers_sum(self, account_ref: str, target_date: Optional[date] = None) -> float:
        d = target_date or date.today()
        d_str = d.strftime("%Y-%m-%d")
        query = """
        SELECT COALESCE(SUM(amount), 0.0) as total
        FROM transactions
        WHERE source_account = %s
          AND tx_type = 'transfer'
          AND status = 'completed'
          AND created_at LIKE %s;
        """
        res = self.db.execute_query(query, (account_ref, f"{d_str}%"), fetch="one")
        if res:
            return float(res["total"] if isinstance(res, dict) else res[0])
        return 0.0

    # ================= ATOMIC LEDGER OPERATIONS =================
    def atomic_transfer(
        self,
        source_ref: str,
        dest_ref: str,
        amount: float,
        description: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Atomically transfers funds from source to destination.
        Enforces server-side validations, row-level locks, daily transfer limits,
        and per-transaction limits.
        """
        amount = round(float(amount), 2)
        if amount <= 0:
            return {"success": False, "error": "Transaction amount must be strictly positive."}

        if source_ref == dest_ref:
            return {"success": False, "error": "Source and destination accounts cannot be identical."}

        # Check idempotency
        if idempotency_key:
            existing = self.db.execute_query(
                "SELECT * FROM transactions WHERE idempotency_key = %s;",
                (idempotency_key,),
                fetch="one"
            )
            if existing:
                return {
                    "success": existing["status"] == "completed",
                    "idempotent_replay": True,
                    "transaction": existing,
                    "error": existing.get("rejection_reason")
                }

        tx_ref = f"TXN-{int(datetime.now().timestamp() * 1000)}"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        today_str = datetime.now().strftime("%Y-%m-%d")

        is_sqlite = (self.db.db_type == "sqlite")

        with self.db.get_connection() as conn:
            cursor = conn.cursor() if is_sqlite else conn.cursor(dictionary=True)

            try:
                # 1. Fetch Source Account with Row Lock
                if is_sqlite:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = ?;", (source_ref,))
                else:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = %s FOR UPDATE;", (source_ref,))
                src_acc = cursor.fetchone()

                if not src_acc:
                    return {"success": False, "error": f"Source account '{source_ref}' not found."}

                # 2. Fetch Destination Account with Row Lock
                if is_sqlite:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = ?;", (dest_ref,))
                else:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = %s FOR UPDATE;", (dest_ref,))
                dst_acc = cursor.fetchone()

                if not dst_acc:
                    return {"success": False, "error": f"Destination account '{dest_ref}' not found."}

                # Check account statuses
                if src_acc["status"] != "active":
                    reason = f"Source account is {src_acc['status']} and cannot initiate transfers."
                    self._record_rejected_tx(cursor, tx_ref, source_ref, dest_ref, "transfer", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason, "tx_ref": tx_ref}

                if dst_acc["status"] != "active":
                    reason = f"Destination account is {dst_acc['status']} and cannot receive transfers."
                    self._record_rejected_tx(cursor, tx_ref, source_ref, dest_ref, "transfer", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason, "tx_ref": tx_ref}

                # Check per-transaction limit
                per_tx_limit = float(src_acc["per_tx_limit"])
                if amount > per_tx_limit:
                    reason = f"Amount ${amount:,.2f} exceeds per-transaction limit of ${per_tx_limit:,.2f}."
                    self._record_rejected_tx(cursor, tx_ref, source_ref, dest_ref, "transfer", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason, "tx_ref": tx_ref}

                # Check daily limit usage
                if is_sqlite:
                    cursor.execute(
                        "SELECT COALESCE(SUM(amount), 0.0) as total FROM transactions WHERE source_account = ? AND tx_type = 'transfer' AND status = 'completed' AND created_at LIKE ?;",
                        (source_ref, f"{today_str}%")
                    )
                else:
                    cursor.execute(
                        "SELECT COALESCE(SUM(amount), 0.0) as total FROM transactions WHERE source_account = %s AND tx_type = 'transfer' AND status = 'completed' AND created_at LIKE %s;",
                        (source_ref, f"{today_str}%")
                    )
                daily_res = cursor.fetchone()
                transferred_today = float(daily_res["total"] if isinstance(daily_res, dict) else daily_res[0])
                daily_limit = float(src_acc["daily_transfer_limit"])

                if transferred_today + amount > daily_limit:
                    remaining = max(0.0, daily_limit - transferred_today)
                    reason = f"Daily transfer limit exceeded. Attempted ${amount:,.2f}, remaining allowance is ${remaining:,.2f} (Limit: ${daily_limit:,.2f})."
                    self._record_rejected_tx(cursor, tx_ref, source_ref, dest_ref, "transfer", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason, "tx_ref": tx_ref}

                # Check sufficient funds
                src_balance = float(src_acc["balance"])
                if src_balance < amount:
                    reason = f"Insufficient funds. Available balance: ${src_balance:,.2f}, requested: ${amount:,.2f}."
                    self._record_rejected_tx(cursor, tx_ref, source_ref, dest_ref, "transfer", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason, "tx_ref": tx_ref}

                # Perform Atomic Debit & Credit
                new_src_balance = round(src_balance - amount, 2)
                new_dst_balance = round(float(dst_acc["balance"]) + amount, 2)

                if is_sqlite:
                    cursor.execute("UPDATE accounts SET balance = ? WHERE account_ref = ?;", (new_src_balance, source_ref))
                    cursor.execute("UPDATE accounts SET balance = ? WHERE account_ref = ?;", (new_dst_balance, dest_ref))
                    cursor.execute(
                        "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, created_at) VALUES (?, ?, ?, 'transfer', ?, 'completed', ?, ?, ?);",
                        (tx_ref, source_ref, dest_ref, amount, description, idempotency_key, now_str)
                    )
                else:
                    cursor.execute("UPDATE accounts SET balance = %s WHERE account_ref = %s;", (new_src_balance, source_ref))
                    cursor.execute("UPDATE accounts SET balance = %s WHERE account_ref = %s;", (new_dst_balance, dest_ref))
                    cursor.execute(
                        "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, created_at) VALUES (%s, %s, %s, 'transfer', %s, 'completed', %s, %s, %s);",
                        (tx_ref, source_ref, dest_ref, amount, description, idempotency_key, now_str)
                    )
                    conn.commit()

                return {
                    "success": True,
                    "tx_ref": tx_ref,
                    "amount": amount,
                    "source_ref": source_ref,
                    "dest_ref": dest_ref,
                    "source_new_balance": new_src_balance,
                    "dest_new_balance": new_dst_balance,
                    "status": "completed",
                    "timestamp": now_str,
                    "description": description
                }

            except Exception as e:
                if not is_sqlite:
                    conn.rollback()
                logger.error(f"Transfer transaction failed: {e}")
                return {"success": False, "error": f"Database transaction failed: {str(e)}"}

    def atomic_deposit(
        self,
        account_ref: str,
        amount: float,
        description: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        amount = round(float(amount), 2)
        if amount <= 0:
            return {"success": False, "error": "Deposit amount must be strictly positive."}

        tx_ref = f"TXN-{int(datetime.now().timestamp() * 1000)}"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        is_sqlite = (self.db.db_type == "sqlite")

        with self.db.get_connection() as conn:
            cursor = conn.cursor() if is_sqlite else conn.cursor(dictionary=True)
            try:
                if is_sqlite:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = ?;", (account_ref,))
                else:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = %s FOR UPDATE;", (account_ref,))
                acc = cursor.fetchone()

                if not acc:
                    return {"success": False, "error": f"Account '{account_ref}' not found."}

                if acc["status"] == "closed":
                    return {"success": False, "error": "Cannot deposit into a closed account."}

                new_balance = round(float(acc["balance"]) + amount, 2)

                if is_sqlite:
                    cursor.execute("UPDATE accounts SET balance = ? WHERE account_ref = ?;", (new_balance, account_ref))
                    cursor.execute(
                        "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, created_at) VALUES (?, NULL, ?, 'deposit', ?, 'completed', ?, ?, ?);",
                        (tx_ref, account_ref, amount, description, idempotency_key, now_str)
                    )
                else:
                    cursor.execute("UPDATE accounts SET balance = %s WHERE account_ref = %s;", (new_balance, account_ref))
                    cursor.execute(
                        "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, created_at) VALUES (%s, NULL, %s, 'deposit', %s, 'completed', %s, %s, %s);",
                        (tx_ref, account_ref, amount, description, idempotency_key, now_str)
                    )
                    conn.commit()

                return {
                    "success": True,
                    "tx_ref": tx_ref,
                    "account_ref": account_ref,
                    "amount": amount,
                    "new_balance": new_balance,
                    "status": "completed",
                    "timestamp": now_str
                }
            except Exception as e:
                if not is_sqlite:
                    conn.rollback()
                return {"success": False, "error": str(e)}

    def atomic_withdraw(
        self,
        account_ref: str,
        amount: float,
        description: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        amount = round(float(amount), 2)
        if amount <= 0:
            return {"success": False, "error": "Withdrawal amount must be strictly positive."}

        tx_ref = f"TXN-{int(datetime.now().timestamp() * 1000)}"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        is_sqlite = (self.db.db_type == "sqlite")

        with self.db.get_connection() as conn:
            cursor = conn.cursor() if is_sqlite else conn.cursor(dictionary=True)
            try:
                if is_sqlite:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = ?;", (account_ref,))
                else:
                    cursor.execute("SELECT * FROM accounts WHERE account_ref = %s FOR UPDATE;", (account_ref,))
                acc = cursor.fetchone()

                if not acc:
                    return {"success": False, "error": f"Account '{account_ref}' not found."}

                if acc["status"] != "active":
                    reason = f"Account is {acc['status']} and cannot make withdrawals."
                    self._record_rejected_tx(cursor, tx_ref, account_ref, None, "withdrawal", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason}

                balance = float(acc["balance"])
                if balance < amount:
                    reason = f"Insufficient funds. Available: ${balance:,.2f}, requested: ${amount:,.2f}."
                    self._record_rejected_tx(cursor, tx_ref, account_ref, None, "withdrawal", amount, description, idempotency_key, reason, now_str, is_sqlite)
                    if not is_sqlite:
                        conn.commit()
                    return {"success": False, "error": reason}

                new_balance = round(balance - amount, 2)

                if is_sqlite:
                    cursor.execute("UPDATE accounts SET balance = ? WHERE account_ref = ?;", (new_balance, account_ref))
                    cursor.execute(
                        "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, created_at) VALUES (?, ?, NULL, 'withdrawal', ?, 'completed', ?, ?, ?);",
                        (tx_ref, account_ref, amount, description, idempotency_key, now_str)
                    )
                else:
                    cursor.execute("UPDATE accounts SET balance = %s WHERE account_ref = %s;", (new_balance, account_ref))
                    cursor.execute(
                        "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, created_at) VALUES (%s, %s, NULL, 'withdrawal', %s, 'completed', %s, %s, %s);",
                        (tx_ref, account_ref, amount, description, idempotency_key, now_str)
                    )
                    conn.commit()

                return {
                    "success": True,
                    "tx_ref": tx_ref,
                    "account_ref": account_ref,
                    "amount": amount,
                    "new_balance": new_balance,
                    "status": "completed",
                    "timestamp": now_str
                }
            except Exception as e:
                if not is_sqlite:
                    conn.rollback()
                return {"success": False, "error": str(e)}

    def _record_rejected_tx(self, cursor, tx_ref, src, dst, tx_type, amount, desc, idemp, reason, now_str, is_sqlite):
        if is_sqlite:
            cursor.execute(
                "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, rejection_reason, created_at) VALUES (?, ?, ?, ?, ?, 'rejected', ?, ?, ?, ?);",
                (tx_ref, src, dst, tx_type, amount, desc, idemp, reason, now_str)
            )
        else:
            cursor.execute(
                "INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, rejection_reason, created_at) VALUES (%s, %s, %s, %s, %s, 'rejected', %s, %s, %s, %s);",
                (tx_ref, src, dst, tx_type, amount, desc, idemp, reason, now_str)
            )

    # ================= ALERTS =================
    def get_alerts(self, account_ref: Optional[str] = None, status: Optional[str] = None, severity: Optional[str] = None) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if account_ref:
            conditions.append("account_ref = %s")
            params.append(account_ref)
        if status:
            conditions.append("status = %s")
            params.append(status)
        if severity:
            conditions.append("severity = %s")
            params.append(severity)

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"SELECT * FROM alerts {where} ORDER BY id DESC;"
        alerts = self.db.execute_query(query, tuple(params), fetch="all") or []
        for a in alerts:
            if isinstance(a.get("evidence"), str):
                try:
                    a["evidence"] = json.loads(a["evidence"])
                except Exception:
                    pass
        return alerts

    def create_alert(
        self,
        account_ref: str,
        risk_score: int,
        severity: str,
        rule_code: str,
        explanation: str,
        evidence: Optional[Dict[str, Any]] = None,
        tx_ref: Optional[str] = None
    ) -> Dict[str, Any]:
        alert_ref = f"ALT-{int(datetime.now().timestamp() * 1000) % 100000:05d}"
        ev_str = json.dumps(evidence) if evidence else None
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        query = """
        INSERT INTO alerts (alert_ref, account_ref, tx_ref, risk_score, severity, rule_code, explanation, evidence, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'open', %s);
        """
        self.db.execute_query(query, (alert_ref, account_ref, tx_ref, risk_score, severity, rule_code, explanation, ev_str, now_str), fetch="none")
        return {
            "alert_ref": alert_ref,
            "account_ref": account_ref,
            "tx_ref": tx_ref,
            "risk_score": risk_score,
            "severity": severity,
            "rule_code": rule_code,
            "explanation": explanation,
            "evidence": evidence,
            "status": "open",
            "created_at": now_str
        }

    def update_alert_status(self, alert_id: Union[int, str], status: str) -> bool:
        # Check if parameter is alert_ref or numeric id
        if str(alert_id).startswith("ALT-"):
            query = "UPDATE alerts SET status = %s WHERE alert_ref = %s;"
        else:
            query = "UPDATE alerts SET status = %s WHERE id = %s;"
        self.db.execute_query(query, (status, alert_id), fetch="none")
        return True

    # ================= AUDIT LOGS =================
    def get_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM audit_logs ORDER BY id DESC LIMIT %s;"
        logs = self.db.execute_query(query, (limit,), fetch="all") or []
        for l in logs:
            if isinstance(l.get("details"), str):
                try:
                    l["details"] = json.loads(l["details"])
                except Exception:
                    pass
        return logs

    def create_audit_log(self, actor: str, action: str, target_account: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> bool:
        details_str = json.dumps(details) if details else None
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        query = "INSERT INTO audit_logs (actor, action, target_account, details, created_at) VALUES (%s, %s, %s, %s, %s);"
        self.db.execute_query(query, (actor, action, target_account, details_str, now_str), fetch="none")
        return True

    # ================= INVESTIGATION CASES =================
    def get_investigation_cases(self) -> List[Dict[str, Any]]:
        query = "SELECT * FROM investigation_cases ORDER BY id DESC;"
        return self.db.execute_query(query, fetch="all") or []

    def update_case_status(self, case_id: Union[int, str], status: str, notes: Optional[str] = None) -> bool:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if str(case_id).startswith("CASE-"):
            if notes:
                query = "UPDATE investigation_cases SET status = %s, notes = %s, updated_at = %s WHERE case_ref = %s;"
                self.db.execute_query(query, (status, notes, now_str, case_id), fetch="none")
            else:
                query = "UPDATE investigation_cases SET status = %s, updated_at = %s WHERE case_ref = %s;"
                self.db.execute_query(query, (status, now_str, case_id), fetch="none")
        else:
            if notes:
                query = "UPDATE investigation_cases SET status = %s, notes = %s, updated_at = %s WHERE id = %s;"
                self.db.execute_query(query, (status, notes, now_str, case_id), fetch="none")
            else:
                query = "UPDATE investigation_cases SET status = %s, updated_at = %s WHERE id = %s;"
                self.db.execute_query(query, (status, now_str, case_id), fetch="none")
        return True

    # ================= RESET SEED DATA =================
    def reset_seed_data(self) -> bool:
        from app.core.database import init_db
        init_db(force_reset=True)
        return True


ledger_repo = LedgerRepository()
