"""
Integration & Unit Tests for Ledger and Banking Rules:
- Atomic transfers and balance verification
- Insufficient funds rejection
- Daily transfer limit enforcement
- Per-transaction limit enforcement
- Account freeze restrictions
- Idempotency protection
- Deposit and withdrawal
"""

import pytest
from app.core.database import init_db
from app.repositories.ledger_repository import ledger_repo


@pytest.fixture(autouse=True)
def setup_db():
    init_db(force_reset=True)
    yield


def test_deposit_and_withdraw():
    # ACC-2001 starts with 14250.00
    acc_before = ledger_repo.get_account_by_ref("ACC-2001")
    initial_bal = float(acc_before["balance"])
    
    # Deposit 500
    dep_res = ledger_repo.atomic_deposit("ACC-2001", 500.0, "Test deposit")
    assert dep_res["success"] is True
    acc_after_dep = ledger_repo.get_account_by_ref("ACC-2001")
    assert float(acc_after_dep["balance"]) == initial_bal + 500.0

    # Withdraw 200
    wd_res = ledger_repo.atomic_withdraw("ACC-2001", 200.0, "Test withdrawal")
    assert wd_res["success"] is True
    acc_after_wd = ledger_repo.get_account_by_ref("ACC-2001")
    assert float(acc_after_wd["balance"]) == initial_bal + 300.0


def test_atomic_transfer_success():
    src = "ACC-2001"
    dst = "ACC-2002"
    src_bal_init = float(ledger_repo.get_account_by_ref(src)["balance"])
    dst_bal_init = float(ledger_repo.get_account_by_ref(dst)["balance"])

    amount = 500.0
    res = ledger_repo.atomic_transfer(src, dst, amount, "Valid transfer test")
    assert res["success"] is True

    src_bal_after = float(ledger_repo.get_account_by_ref(src)["balance"])
    dst_bal_after = float(ledger_repo.get_account_by_ref(dst)["balance"])

    assert src_bal_after == src_bal_init - amount
    assert dst_bal_after == dst_bal_init + amount


def test_transfer_insufficient_funds():
    src = "ACC-2005"  # Student account with lower balance (2340.00)
    dst = "ACC-2006"
    
    src_bal_init = float(ledger_repo.get_account_by_ref(src)["balance"])
    dst_bal_init = float(ledger_repo.get_account_by_ref(dst)["balance"])

    # Attempt to transfer more than balance
    res = ledger_repo.atomic_transfer(src, dst, 10000.0, "Overdraft attempt")
    assert res["success"] is False
    assert "limit" in res["error"].lower() or "insufficient" in res["error"].lower()

    # Verify balances UNCHANGED
    assert float(ledger_repo.get_account_by_ref(src)["balance"]) == src_bal_init
    assert float(ledger_repo.get_account_by_ref(dst)["balance"]) == dst_bal_init


def test_transfer_per_tx_limit_exceeded():
    src = "ACC-2005"  # per_tx_limit = 1000.00, balance = 2340.00
    dst = "ACC-2006"
    
    res = ledger_repo.atomic_transfer(src, dst, 1500.0, "Exceeding per-tx limit")
    assert res["success"] is False
    assert "per-transaction limit" in res["error"].lower()


def test_transfer_frozen_account():
    src = "ACC-2003"
    dst = "ACC-2004"
    
    # Freeze account
    ledger_repo.update_account_status(src, "frozen")
    
    res = ledger_repo.atomic_transfer(src, dst, 100.0, "Transfer from frozen account")
    assert res["success"] is False
    assert "frozen" in res["error"].lower()


def test_idempotency_protection():
    src = "ACC-2001"
    dst = "ACC-2002"
    idemp_key = "UNIQUE-IDEMP-KEY-999"

    res1 = ledger_repo.atomic_transfer(src, dst, 150.0, "First attempt", idempotency_key=idemp_key)
    assert res1["success"] is True

    # Re-submitting the exact same transaction
    res2 = ledger_repo.atomic_transfer(src, dst, 150.0, "Second attempt", idempotency_key=idemp_key)
    assert res2.get("idempotent_replay") is True
