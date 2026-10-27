"""
Database connectivity and lifecycle management.
Supports MySQL 8.0+ via mysql.connector as well as SQLite fallback for zero-dependency portability.
Maintains parameterized queries, atomic transactions, row locking, and seed data initialization.
"""

import json
import logging
import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional, Tuple, Union

try:
    import mysql.connector
    from mysql.connector import pooling
    HAS_MYSQL = True
except ImportError:
    HAS_MYSQL = False

from app.core.config import settings

logger = logging.getLogger("aegis.database")
logger.setLevel(logging.INFO)

# Global pool for MySQL
mysql_pool = None


def get_db_mode() -> str:
    """Returns 'mysql' or 'sqlite' based on configuration and availability."""
    if settings.DATABASE_TYPE.lower() == "mysql" and HAS_MYSQL:
        try:
            conn = mysql.connector.connect(
                host=settings.MYSQL_HOST,
                port=settings.MYSQL_PORT,
                user=settings.MYSQL_USER,
                password=settings.MYSQL_PASSWORD,
                database=settings.MYSQL_DATABASE,
                connection_timeout=2
            )
            conn.close()
            return "mysql"
        except Exception as e:
            logger.warning(f"MySQL connection check failed ({e}). Falling back to SQLite.")
            return "sqlite"
    return "sqlite"


ACTIVE_DB_TYPE = get_db_mode()


def dict_factory(cursor, row):
    fields = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(fields, row)}


class DatabaseManager:
    def __init__(self, db_type: Optional[str] = None):
        self.db_type = db_type or ACTIVE_DB_TYPE
        self.sqlite_path = settings.DATABASE_PATH
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)

    @contextmanager
    def get_connection(self):
        """Context manager yielding a database connection with auto-commit or manual transaction control."""
        if self.db_type == "mysql" and HAS_MYSQL:
            conn = mysql.connector.connect(
                host=settings.MYSQL_HOST,
                port=settings.MYSQL_PORT,
                user=settings.MYSQL_USER,
                password=settings.MYSQL_PASSWORD,
                database=settings.MYSQL_DATABASE,
                autocommit=False
            )
            try:
                yield conn
            finally:
                conn.close()
        else:
            conn = sqlite3.connect(self.sqlite_path, timeout=30.0, isolation_level=None)
            conn.row_factory = dict_factory
            conn.execute("PRAGMA foreign_keys = ON;")
            conn.execute("PRAGMA journal_mode = WAL;")
            try:
                yield conn
            finally:
                conn.close()

    def execute_query(self, query: str, params: Union[Tuple, List, Dict] = (), fetch: str = "all") -> Any:
        """
        Executes parameterized query. Automatically formats %s to ? if executing on SQLite.
        """
        is_sqlite = (self.db_type == "sqlite")
        sql = query
        if is_sqlite:
            # Replace MySQL %s with SQLite ? for parameter binding
            sql = sql.replace("%s", "?")

        with self.get_connection() as conn:
            cursor = conn.cursor() if is_sqlite else conn.cursor(dictionary=True)
            cursor.execute(sql, params)
            if fetch == "all":
                res = cursor.fetchall()
            elif fetch == "one":
                res = cursor.fetchone()
            elif fetch == "none":
                res = cursor.rowcount
            else:
                res = None
            if not is_sqlite:
                conn.commit()
            return res


db = DatabaseManager()


def init_db(force_reset: bool = False):
    """
    Initializes tables and seeds initial data if tables are empty or force_reset=True.
    """
    logger.info(f"Initializing database using {db.db_type.upper()}...")
    
    if db.db_type == "sqlite":
        _init_sqlite(force_reset)
    else:
        _init_mysql(force_reset)


def _init_sqlite(force_reset: bool = False):
    schema_sql = """
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_ref TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age_band TEXT NOT NULL,
        occupation TEXT,
        declared_income_band TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_ref TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'savings',
        balance REAL NOT NULL DEFAULT 0.00,
        daily_transfer_limit REAL NOT NULL DEFAULT 5000.00,
        per_tx_limit REAL NOT NULL DEFAULT 2500.00,
        monthly_budget REAL DEFAULT 8000.00,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_ref TEXT NOT NULL UNIQUE,
        source_account TEXT NULL,
        destination_account TEXT NULL,
        tx_type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        description TEXT NOT NULL,
        idempotency_key TEXT UNIQUE NULL,
        rejection_reason TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_ref TEXT NOT NULL UNIQUE,
        account_ref TEXT NOT NULL,
        tx_ref TEXT NULL,
        risk_score INTEGER NOT NULL,
        severity TEXT NOT NULL,
        rule_code TEXT NOT NULL,
        explanation TEXT NOT NULL,
        evidence TEXT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        target_account TEXT NULL,
        details TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS investigation_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_ref TEXT NOT NULL UNIQUE,
        target_account TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        notes TEXT NULL,
        assigned_analyst TEXT DEFAULT 'Lead Fraud Analyst',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """
    with db.get_connection() as conn:
        cursor = conn.cursor()
        if force_reset:
            cursor.execute("DROP TABLE IF EXISTS audit_logs;")
            cursor.execute("DROP TABLE IF EXISTS alerts;")
            cursor.execute("DROP TABLE IF EXISTS investigation_cases;")
            cursor.execute("DROP TABLE IF EXISTS transactions;")
            cursor.execute("DROP TABLE IF EXISTS accounts;")
            cursor.execute("DROP TABLE IF EXISTS customers;")

        cursor.executescript(schema_sql)
        
        # Check if customers table is populated
        cursor.execute("SELECT COUNT(*) as count FROM customers;")
        res = cursor.fetchone()
        count = res["count"] if isinstance(res, dict) else res[0]
        
        if count == 0:
            logger.info("Database is empty. Seeding initial synthetic banking dataset...")
            _seed_data(conn, is_sqlite=True)


def _init_mysql(force_reset: bool = False):
    # If using MySQL, read schema.sql and execute
    schema_path = os.path.join(os.path.dirname(__file__), "../../../database/schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_statements = f.read().split(";")
        with db.get_connection() as conn:
            cursor = conn.cursor()
            for stmt in sql_statements:
                stmt_clean = stmt.strip()
                if stmt_clean and not stmt_clean.lower().startswith("create database") and not stmt_clean.lower().startswith("use "):
                    cursor.execute(stmt_clean)
            conn.commit()

            cursor.execute("SELECT COUNT(*) FROM customers")
            count = cursor.fetchone()[0]
            if count == 0:
                seed_path = os.path.join(os.path.dirname(__file__), "../../../database/seed.sql")
                if os.path.exists(seed_path):
                    with open(seed_path, "r", encoding="utf-8") as sf:
                        seed_statements = sf.read().split(";")
                    for sstmt in seed_statements:
                        sstmt_clean = sstmt.strip()
                        if sstmt_clean and not sstmt_clean.lower().startswith("use "):
                            cursor.execute(sstmt_clean)
                    conn.commit()


def _seed_data(conn, is_sqlite: bool = True):
    seed_customers = [
        (1, 'CUST-1001', 'Alice Vance', 'alice.vance@example.com', '25-34', 'Fintech Consultant', '$75k-$100k', '2025-01-15 10:00:00'),
        (2, 'CUST-1002', 'Bob Martinez', 'bob.martinez@example.com', '35-49', 'Logistics Coordinator', '$50k-$75k', '2025-01-20 11:30:00'),
        (3, 'CUST-1003', 'Charlie Sterling', 'charlie.sterling@example.com', '25-34', 'Freelance Digital Artist', '$35k-$50k', '2025-02-01 09:15:00'),
        (4, 'CUST-1004', 'David Ross', 'david.ross@example.com', '50-64', 'Real Estate Broker', '$100k-$150k', '2025-02-10 14:00:00'),
        (5, 'CUST-1005', 'Elena Rostova', 'elena.rostova@example.com', '18-24', 'Graduate Student', 'Under $25k', '2025-02-14 16:45:00'),
        (6, 'CUST-1006', 'Farhan Qureshi', 'farhan.qureshi@example.com', '35-49', 'Software Architect', '$120k-$180k', '2025-02-18 10:20:00'),
        (7, 'CUST-1007', 'Grace Hopper', 'grace.hopper@example.com', '35-49', 'Cybersecurity Analyst', '$90k-$130k', '2025-02-22 13:10:00'),
        (8, 'CUST-1008', 'Henry Sterling', 'henry.sterling@example.com', '50-64', 'Import/Export Trader', '$150k+', '2025-03-01 08:30:00'),
        (9, 'CUST-1009', 'Isla Cameron', 'isla.cameron@example.com', '25-34', 'Marketing Specialist', '$60k-$85k', '2025-03-05 12:00:00'),
        (10, 'CUST-1010', 'Jack Sullivan', 'jack.sullivan@example.com', '18-24', 'Undergraduate Student', 'Under $25k', '2025-03-08 15:30:00'),
        (11, 'CUST-1011', 'Kiran Patel', 'kiran.patel@example.com', '25-34', 'Data Scientist', '$95k-$125k', '2025-03-12 11:00:00'),
        (12, 'CUST-1012', 'Liam Bennett', 'liam.bennett@example.com', '35-49', 'Operations Manager', '$70k-$90k', '2025-03-15 14:20:00'),
        (13, 'CUST-1013', 'Maya Lin', 'maya.lin@example.com', '25-34', 'Civil Engineer', '$80k-$110k', '2025-03-20 09:45:00'),
        (14, 'CUST-1014', 'Noah Wright', 'noah.wright@example.com', '50-64', 'High School Teacher', '$55k-$75k', '2025-03-22 17:05:00')
    ]

    seed_accounts = [
        (1, 'ACC-2001', 1, 'current', 14250.00, 10000.00, 5000.00, 12000.00, 'active', '2025-01-15 10:10:00'),
        (2, 'ACC-2002', 2, 'savings', 8400.00, 5000.00, 2500.00, 6000.00, 'active', '2025-01-20 11:35:00'),
        (3, 'ACC-2003', 3, 'current', 5920.00, 4000.00, 2000.00, 4500.00, 'active', '2025-02-01 09:20:00'),
        (4, 'ACC-2004', 4, 'current', 28500.00, 15000.00, 7500.00, 18000.00, 'active', '2025-02-10 14:05:00'),
        (5, 'ACC-2005', 5, 'student', 2340.00, 2000.00, 1000.00, 2500.00, 'active', '2025-02-14 16:50:00'),
        (6, 'ACC-2006', 6, 'savings', 32000.00, 10000.00, 5000.00, 15000.00, 'active', '2025-02-18 10:25:00'),
        (7, 'ACC-2007', 7, 'current', 17800.00, 8000.00, 4000.00, 10000.00, 'active', '2025-02-22 13:15:00'),
        (8, 'ACC-2008', 8, 'current', 54000.00, 25000.00, 10000.00, 30000.00, 'active', '2025-03-01 08:35:00'),
        (9, 'ACC-2009', 9, 'savings', 6150.00, 4000.00, 2000.00, 5000.00, 'active', '2025-03-05 12:05:00'),
        (10, 'ACC-2010', 10, 'student', 1850.00, 1500.00, 800.00, 2000.00, 'active', '2025-03-08 15:35:00'),
        (11, 'ACC-2011', 11, 'savings', 19400.00, 6000.00, 3000.00, 8000.00, 'active', '2025-03-12 11:05:00'),
        (12, 'ACC-2012', 12, 'current', 11200.00, 5000.00, 2500.00, 7000.00, 'active', '2025-03-15 14:25:00'),
        (13, 'ACC-2013', 13, 'savings', 22100.00, 7000.00, 3500.00, 9000.00, 'active', '2025-03-20 09:45:00'),
        (14, 'ACC-2014', 14, 'current', 9800.00, 4000.00, 2000.00, 5000.00, 'active', '2025-03-22 17:05:00')
    ]

    seed_txs = [
        # Initial Deposits
        ('TXN-10001', None, 'ACC-2001', 'deposit', 15000.00, 'completed', 'Initial account deposit', 'IDEMP-INIT-001', None, '2025-03-01 09:00:00'),
        ('TXN-10002', None, 'ACC-2004', 'deposit', 30000.00, 'completed', 'Commercial payroll funding', 'IDEMP-INIT-002', None, '2025-03-01 09:10:00'),
        ('TXN-10003', None, 'ACC-2008', 'deposit', 60000.00, 'completed', 'Business working capital', 'IDEMP-INIT-003', None, '2025-03-01 09:20:00'),

        # Pattern 1: Cycle (ACC-2001 -> ACC-2002 -> ACC-2003 -> ACC-2001)
        ('TXN-20001', 'ACC-2001', 'ACC-2002', 'transfer', 1850.00, 'completed', 'Consulting Retainer Transfer', 'IDEMP-CYC-001', None, '2025-03-23 10:15:00'),
        ('TXN-20002', 'ACC-2002', 'ACC-2003', 'transfer', 1850.00, 'completed', 'Subcontracting Payment', 'IDEMP-CYC-002', None, '2025-03-23 11:30:00'),
        ('TXN-20003', 'ACC-2003', 'ACC-2001', 'transfer', 1850.00, 'completed', 'Project Settlement Refund', 'IDEMP-CYC-003', None, '2025-03-23 13:45:00'),

        # Pattern 2: Multi-Hop Chain (ACC-2004 -> ACC-2005 -> ACC-2006 -> ACC-2007)
        ('TXN-30001', 'ACC-2004', 'ACC-2005', 'transfer', 2200.00, 'completed', 'Educational Research Grant', 'IDEMP-CHN-001', None, '2025-03-24 08:30:00'),
        ('TXN-30002', 'ACC-2005', 'ACC-2006', 'transfer', 2150.00, 'completed', 'Lab Hardware Equipment', 'IDEMP-CHN-002', None, '2025-03-24 09:45:00'),
        ('TXN-30003', 'ACC-2006', 'ACC-2007', 'transfer', 2100.00, 'completed', 'Security Audit Services', 'IDEMP-CHN-003', None, '2025-03-24 11:15:00'),

        # Pattern 3: High Outgoing Degree / Fan-Out Dispersion (ACC-2008 -> 2009, 2010, 2011, 2012)
        ('TXN-40001', 'ACC-2008', 'ACC-2009', 'transfer', 3200.00, 'completed', 'Quarterly Distributor Payout', 'IDEMP-FAN-001', None, '2025-03-25 14:00:00'),
        ('TXN-40002', 'ACC-2008', 'ACC-2010', 'transfer', 1400.00, 'completed', 'Student Internship Stipend', 'IDEMP-FAN-002', None, '2025-03-25 14:05:00'),
        ('TXN-40003', 'ACC-2008', 'ACC-2011', 'transfer', 4500.00, 'completed', 'Analytics Infrastructure SLA', 'IDEMP-FAN-003', None, '2025-03-25 14:10:00'),
        ('TXN-40004', 'ACC-2008', 'ACC-2012', 'transfer', 2800.00, 'completed', 'Logistics Fleet Maintenance', 'IDEMP-FAN-004', None, '2025-03-25 14:15:00'),

        # Pattern 4: Burst Transfers (ACC-2009 -> ACC-2011)
        ('TXN-50001', 'ACC-2009', 'ACC-2011', 'transfer', 1200.00, 'completed', 'Marketing Research Batch 1', 'IDEMP-BUR-001', None, '2025-03-25 16:01:00'),
        ('TXN-50002', 'ACC-2009', 'ACC-2011', 'transfer', 1150.00, 'completed', 'Marketing Research Batch 2', 'IDEMP-BUR-002', None, '2025-03-25 16:03:00'),
        ('TXN-50003', 'ACC-2009', 'ACC-2011', 'transfer', 950.00, 'completed', 'Marketing Research Batch 3', 'IDEMP-BUR-003', None, '2025-03-25 16:05:00'),

        # Pattern 5: Normal Everyday Operations (ACC-2013, ACC-2014)
        ('TXN-60001', 'ACC-2013', 'ACC-2014', 'transfer', 450.00, 'completed', 'Shared Office Co-working Fee', 'IDEMP-NORM-001', None, '2025-03-26 10:00:00'),
        ('TXN-60002', 'ACC-2014', None, 'withdrawal', 200.00, 'completed', 'Simulated ATM Cash Withdrawal', 'IDEMP-NORM-002', None, '2025-03-26 12:30:00'),
        ('TXN-60003', None, 'ACC-2013', 'deposit', 1500.00, 'completed', 'Freelance Civil Drafting Fee', 'IDEMP-NORM-003', None, '2025-03-26 15:00:00')
    ]

    seed_alerts = [
        ('ALT-8001', 'ACC-2001', 'TXN-20003', 88, 'high', 'RULE_CYCLE_DETECTED', 'Account participates in a closed circular money flow (ACC-2001 -> ACC-2002 -> ACC-2003 -> ACC-2001)', '{"cycle": ["ACC-2001", "ACC-2002", "ACC-2003", "ACC-2001"], "amount": 1850.00}', 'investigating', '2025-03-23 13:46:00'),
        ('ALT-8002', 'ACC-2008', 'TXN-40004', 74, 'medium', 'RULE_RAPID_DISPERSION', 'High fan-out dispersion: Account distributed funds to 4 distinct counterparties within 15 minutes', '{"counterparties": ["ACC-2009", "ACC-2010", "ACC-2011", "ACC-2012"], "total_dispersed": 11900.00}', 'open', '2025-03-25 14:16:00'),
        ('ALT-8003', 'ACC-2009', 'TXN-50003', 68, 'medium', 'RULE_BURST_FREQUENCY', 'High frequency transfer burst: 3 outbound transfers to the same recipient in under 5 minutes', '{"recipient": "ACC-2011", "tx_count": 3, "time_window_minutes": 5}', 'open', '2025-03-25 16:06:00')
    ]

    seed_audits = [
        ('system_initializer', 'SYSTEM_BOOT', None, '{"event": "Synthetic bank seed initialized", "accounts_seeded": 14}', '2025-03-01 08:00:00'),
        ('analyst.alex', 'CASE_OPENED', 'ACC-2001', '{"case_ref": "CASE-101", "reason": "Automated DFS detected circular fund loop"}', '2025-03-23 14:00:00')
    ]

    seed_cases = [
        ('CASE-101', 'ACC-2001', 'Circular fund routing involving 3 parties', 'investigating', 'Alice Vance, Bob Martinez, Charlie Sterling form an exact 3-node cycle with $1,850 moving across each edge.', 'Analyst Alex Miller', '2025-03-23 14:00:00', '2025-03-23 14:00:00'),
        ('CASE-102', 'ACC-2008', 'Unusual rapid multi-account dispersion', 'open', 'Henry Sterling initiated 4 transfers totaling $11,900 in rapid succession.', 'Analyst Alex Miller', '2025-03-25 14:30:00', '2025-03-25 14:30:00')
    ]

    cursor = conn.cursor()
    cursor.executemany("INSERT INTO customers (id, customer_ref, full_name, email, age_band, occupation, declared_income_band, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", seed_customers)
    cursor.executemany("INSERT INTO accounts (id, account_ref, customer_id, account_type, balance, daily_transfer_limit, per_tx_limit, monthly_budget, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", seed_accounts)
    cursor.executemany("INSERT INTO transactions (tx_ref, source_account, destination_account, tx_type, amount, status, description, idempotency_key, rejection_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", seed_txs)
    cursor.executemany("INSERT INTO alerts (alert_ref, account_ref, tx_ref, risk_score, severity, rule_code, explanation, evidence, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", seed_alerts)
    cursor.executemany("INSERT INTO audit_logs (actor, action, target_account, details, created_at) VALUES (?, ?, ?, ?, ?)", seed_audits)
    cursor.executemany("INSERT INTO investigation_cases (case_ref, target_account, title, status, notes, assigned_analyst, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", seed_cases)
    conn.commit()
    logger.info("Successfully seeded synthetic dataset.")
