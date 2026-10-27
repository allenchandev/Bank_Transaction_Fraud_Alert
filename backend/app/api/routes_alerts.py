from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.repositories.ledger_repository import ledger_repo
from app.api.schemas import UpdateAlertStatusRequest

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Rules"])


@router.get("")
def get_alerts(
    account_ref: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None
):
    alerts = ledger_repo.get_alerts(account_ref=account_ref, status=status, severity=severity)
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/{alert_id}")
def get_alert_detail(alert_id: str):
    alerts = ledger_repo.get_alerts()
    match = next((a for a in alerts if str(a["id"]) == alert_id or a["alert_ref"] == alert_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"alert": match}


@router.patch("/{alert_id}/status")
def update_alert_status(alert_id: str, req: UpdateAlertStatusRequest):
    allowed = ["open", "investigating", "resolved", "false_positive"]
    if req.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {allowed}")
    
    ledger_repo.update_alert_status(alert_id, req.status)
    ledger_repo.create_audit_log(
        actor="lead_analyst",
        action="UPDATE_ALERT_STATUS",
        target_account=None,
        details={"alert_id": alert_id, "new_status": req.status}
    )
    return {"success": True, "alert_id": alert_id, "new_status": req.status}
