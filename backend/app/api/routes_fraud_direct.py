"""
Direct alias routes for /api/fraud/* to match exact paths in FraudDetectionPanel.tsx
"""
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from app.api.routes_fraud_ai import (
    analyze_transaction_data,
    analyze_fraud_screenshot,
    get_fraud_sample_cases,
    TransactionAnalysisRequest
)

router = APIRouter(prefix="/api/fraud", tags=["Direct Fraud Alias"])

@router.get("/samples")
def get_samples():
    return get_fraud_sample_cases()

@router.post("/analyze-transaction")
def analyze_txn(req: TransactionAnalysisRequest):
    return analyze_transaction_data(req)

@router.post("/analyze-screenshot")
async def analyze_img(
    file: UploadFile = File(...),
    flag_visual_tamper: Optional[bool] = Form(None),
    flag_invalid_utr: Optional[bool] = Form(None),
    flag_amount_anomaly: Optional[bool] = Form(None),
    flag_beneficiary_mismatch: Optional[bool] = Form(None),
    flag_missing_watermark: Optional[bool] = Form(None)
):
    return await analyze_fraud_screenshot(
        file=file,
        flag_visual_tamper=flag_visual_tamper,
        flag_invalid_utr=flag_invalid_utr,
        flag_amount_anomaly=flag_amount_anomaly,
        flag_beneficiary_mismatch=flag_beneficiary_mismatch,
        flag_missing_watermark=flag_missing_watermark
    )
