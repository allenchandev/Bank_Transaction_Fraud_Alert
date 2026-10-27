from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.repositories.ledger_repository import ledger_repo
from app.api.schemas import FreezeAccountRequest, UnfreezeAccountRequest, UpdateCaseStatusRequest

router = APIRouter(prefix="/api/admin", tags=["Administration & Audit"])


@router.post("/accounts/{account_ref}/freeze")
def freeze_account(account_ref: str, req: FreezeAccountRequest):
    acc = ledger_repo.get_account_by_ref(account_ref)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    ledger_repo.update_account_status(account_ref, "frozen")
    ledger_repo.create_audit_log(
        actor=req.analyst_actor,
        action="ACCOUNT_FREEZE",
        target_account=account_ref,
        details={"reason": req.reason, "previous_status": acc["status"]}
    )

    return {
        "success": True,
        "account_ref": account_ref,
        "status": "frozen",
        "actor": req.analyst_actor,
        "reason": req.reason
    }


@router.post("/accounts/{account_ref}/unfreeze")
def unfreeze_account(account_ref: str, req: UnfreezeAccountRequest):
    acc = ledger_repo.get_account_by_ref(account_ref)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    ledger_repo.update_account_status(account_ref, "active")
    ledger_repo.create_audit_log(
        actor=req.analyst_actor,
        action="ACCOUNT_UNFREEZE",
        target_account=account_ref,
        details={"reason": req.reason, "previous_status": acc["status"]}
    )

    return {
        "success": True,
        "account_ref": account_ref,
        "status": "active",
        "actor": req.analyst_actor,
        "reason": req.reason
    }


@router.get("/audit-logs")
def get_audit_logs(limit: int = Query(100, ge=1, le=500)):
    logs = ledger_repo.get_audit_logs(limit=limit)
    return {"audit_logs": logs, "total": len(logs)}


@router.get("/cases")
def get_cases():
    cases = ledger_repo.get_investigation_cases()
    return {"cases": cases, "total": len(cases)}


@router.patch("/cases/{case_id}")
def update_case(case_id: str, req: UpdateCaseStatusRequest):
    allowed = ["open", "investigating", "resolved", "false_positive"]
    if req.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {allowed}")

    ledger_repo.update_case_status(case_id, req.status, req.notes)
    ledger_repo.create_audit_log(
        actor="lead_analyst",
        action="UPDATE_CASE_STATUS",
        target_account=None,
        details={"case_id": case_id, "new_status": req.status, "notes": req.notes}
    )
    return {"success": True, "case_id": case_id, "status": req.status}


@router.post("/reset-demo-data")
def reset_demo_data():
    """
    Resets the entire database back to canonical synthetic seed data.
    Essential for repeatable college viva presentations.
    """
    ledger_repo.reset_seed_data()
    ledger_repo.create_audit_log(
        actor="demo_presenter",
        action="DATABASE_RESET_TO_SEED",
        target_account=None,
        details={"message": "Synthetic dataset restored to initial state"}
    )
    return {"success": True, "message": "Synthetic banking dataset reset successfully."}
