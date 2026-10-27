from fastapi import APIRouter, HTTPException
from app.repositories.ledger_repository import ledger_repo
from app.services.monitoring_service import monitoring_engine
from app.api.schemas import DepositRequest, WithdrawRequest, TransferRequest

router = APIRouter(prefix="/api/accounts", tags=["Ledger Operations"])


@router.post("/{account_ref}/deposit")
def deposit_funds(account_ref: str, req: DepositRequest):
    res = ledger_repo.atomic_deposit(
        account_ref=account_ref,
        amount=req.amount,
        description=req.description,
        idempotency_key=req.idempotency_key
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Deposit failed"))
    
    return res


@router.post("/{account_ref}/withdraw")
def withdraw_funds(account_ref: str, req: WithdrawRequest):
    res = ledger_repo.atomic_withdraw(
        account_ref=account_ref,
        amount=req.amount,
        description=req.description,
        idempotency_key=req.idempotency_key
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Withdrawal failed"))
    
    return res


@router.post("/{account_ref}/transfer")
def transfer_funds(account_ref: str, req: TransferRequest):
    res = ledger_repo.atomic_transfer(
        source_ref=account_ref,
        dest_ref=req.destination_account,
        amount=req.amount,
        description=req.description,
        idempotency_key=req.idempotency_key
    )

    if not res.get("success"):
        raise HTTPException(
            status_code=400,
            detail={
                "error": res.get("error", "Transfer rejected"),
                "tx_ref": res.get("tx_ref"),
                "status": "rejected"
            }
        )

    # Trigger post-transaction fraud monitoring
    alerts_created = monitoring_engine.evaluate_transaction({
        "tx_ref": res["tx_ref"],
        "source_ref": account_ref,
        "dest_ref": req.destination_account,
        "amount": req.amount,
        "tx_type": "transfer"
    })

    res["alerts_triggered"] = len(alerts_created)
    return res
