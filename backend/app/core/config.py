import os
from typing import List

# Load .env if present
env_path = os.path.join(os.path.dirname(__file__), "../../.env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Aegis Bank Intelligence API")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    DATABASE_TYPE: str = os.getenv("DATABASE_TYPE", "sqlite")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "backend/aegis_bank.db")

    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "root")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "aegis_bank")

    DEMO_ADMIN_API_KEY: str = os.getenv("DEMO_ADMIN_API_KEY", "aegis-intel-admin-secret-key-2025")
    SIMULATION_MODE: bool = os.getenv("SIMULATION_MODE", "true").lower() in ("true", "1")

    MAX_DAILY_TRANSFER_DEFAULT: float = float(os.getenv("MAX_DAILY_TRANSFER_DEFAULT", "10000.00"))
    PER_TRANSACTION_LIMIT_DEFAULT: float = float(os.getenv("PER_TRANSACTION_LIMIT_DEFAULT", "5000.00"))
    BURST_WINDOW_MINUTES: int = int(os.getenv("BURST_WINDOW_MINUTES", "5"))
    BURST_THRESHOLD_COUNT: int = int(os.getenv("BURST_THRESHOLD_COUNT", "3"))


settings = Settings()
