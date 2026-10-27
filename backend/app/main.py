"""
Aegis Bank Intelligence — FastAPI Application Entrypoint
Provides high-performance REST APIs for banking simulation, transaction ledger,
and Python-powered DSA investigation intelligence.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, db
from app.api.routes_customers import router as customers_router
from app.api.routes_ledger import router as ledger_router
from app.api.routes_investigation import router as investigation_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_admin import router as admin_router
from app.api.routes_fraud_ai import router as fraud_ai_router
from fastapi.staticfiles import StaticFiles
from pathlib import Path

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR = Path(__file__).resolve().parent.parent / "data" / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    init_db(force_reset=False)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Interactive Banking Simulation & Transaction Fraud Investigation Platform for College DSA Project",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits frontend local dev servers (e.g. localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(customers_router)
app.include_router(ledger_router)
app.include_router(investigation_router)
app.include_router(alerts_router)
app.include_router(admin_router)
app.include_router(fraud_ai_router)

# Mount Static Files for Forensic Evidence Inspector
app.mount("/api/fraud-ai/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="fraud_uploads")
app.mount("/api/fraud-ai/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="fraud_samples")


@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Aegis Bank Intelligence API",
        "database_engine": db.db_type.upper(),
        "simulation_mode": True,
        "environment": settings.APP_ENV
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
