from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.repositories.ledger_repository import ledger_repo
from app.api.schemas import UpdateLimitsRequest

router = APIRouter(prefix="/api", tags=["Customers & Accounts"])


@router.get("/health")
def api_health():
    from app.core.database import db
    return {"status": "healthy", "database_engine": db.db_type.upper()}


@router.get("/transactions")
def get_all_transactions(
    limit: int = Query(100, ge=1, le=500),
    tx_type: Optional[str] = None,
    status: Optional[str] = None,
    account_ref: Optional[str] = None
):
    txs = ledger_repo.get_transactions(account_ref=account_ref, limit=limit, tx_type=tx_type, status=status)
    return {"transactions": txs, "total": len(txs)}


@router.get("/customers")
def get_customers():
    return {"customers": ledger_repo.get_customers()}


@router.get("/accounts")
def get_accounts():
    return {"accounts": ledger_repo.get_accounts()}


@router.get("/accounts/{account_ref}")
def get_account_details(account_ref: str):
    account = ledger_repo.get_account_by_ref(account_ref)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account '{account_ref}' not found")
    
    daily_transferred = ledger_repo.get_daily_transfers_sum(account_ref)
    daily_limit = float(account["daily_transfer_limit"])
    
    return {
        "account": account,
        "limits": {
            "daily_limit": daily_limit,
            "transferred_today": daily_transferred,
            "remaining_today": max(0.0, daily_limit - daily_transferred),
            "per_tx_limit": float(account["per_tx_limit"]),
            "monthly_budget": float(account.get("monthly_budget") or 0.0)
        }
    }


@router.get("/accounts/{account_ref}/transactions")
def get_account_transactions(
    account_ref: str,
    limit: int = Query(50, ge=1, le=200),
    tx_type: Optional[str] = None
):
    txs = ledger_repo.get_transactions(account_ref=account_ref, limit=limit, tx_type=tx_type)
    return {"account_ref": account_ref, "transactions": txs}


@router.patch("/accounts/{account_ref}/limits")
def update_account_limits(account_ref: str, req: UpdateLimitsRequest):
    acc = ledger_repo.get_account_by_ref(account_ref)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    ledger_repo.update_account_limits(
        account_ref=account_ref,
        daily_transfer_limit=req.daily_transfer_limit,
        per_tx_limit=req.per_tx_limit,
        monthly_budget=req.monthly_budget
    )

    ledger_repo.create_audit_log(
        actor="customer_self_service",
        action="UPDATE_LIMITS",
        target_account=account_ref,
        details={
            "daily_limit": req.daily_transfer_limit,
            "per_tx_limit": req.per_tx_limit,
            "monthly_budget": req.monthly_budget
        }
    )

    return {"success": True, "message": "Account limits successfully updated."}
