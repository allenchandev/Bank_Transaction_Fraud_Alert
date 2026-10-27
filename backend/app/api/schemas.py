from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# Ledger Requests
class TransferRequest(BaseModel):
    destination_account: str = Field(..., description="Destination account reference, e.g. ACC-2002")
    amount: float = Field(..., gt=0, description="Strictly positive monetary amount")
    description: str = Field(..., min_length=2, max_length=255, description="Transfer memo/description")
    idempotency_key: Optional[str] = Field(None, description="Optional idempotency key to prevent double submissions")


class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Deposit amount")
    description: str = Field("Simulated Cash Deposit", description="Description")
    idempotency_key: Optional[str] = None


class WithdrawRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Withdrawal amount")
    description: str = Field("Simulated Cash Withdrawal", description="Description")
    idempotency_key: Optional[str] = None


class UpdateLimitsRequest(BaseModel):
    daily_transfer_limit: Optional[float] = Field(None, gt=0)
    per_tx_limit: Optional[float] = Field(None, gt=0)
    monthly_budget: Optional[float] = Field(None, gt=0)


# DSA Requests
class BFSRequest(BaseModel):
    source_account: str = Field(..., description="Root account reference to trace from")
    max_hops: int = Field(3, ge=1, le=10, description="Maximum traversal depth")


# Admin Requests
class FreezeAccountRequest(BaseModel):
    reason: str = Field("Administrative risk freeze", description="Justification for freeze")
    analyst_actor: str = Field("Senior Fraud Analyst", description="Analyst username or name")


class UnfreezeAccountRequest(BaseModel):
    reason: str = Field("Investigation completed, account verified", description="Justification")
    analyst_actor: str = Field("Senior Fraud Analyst", description="Analyst username or name")


class UpdateAlertStatusRequest(BaseModel):
    status: str = Field(..., description="open, investigating, resolved, or false_positive")


class UpdateCaseStatusRequest(BaseModel):
    status: str = Field(..., description="open, investigating, resolved, or false_positive")
    notes: Optional[str] = None
