"""
Lumiqe — Centralized Configuration.

All settings in one Pydantic BaseSettings class, loaded from .env.
"""

from pathlib import Path

from pydantic_settings import BaseSettings

# ─── Paths ────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    """Application settings — read from environment with sensible defaults."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lumiqe_dev"

    # CORS — all frontend origins that are allowed to call this API
    CORS_ORIGINS: list[str] = [
        # Local development
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Custom domain (production)
        "https://lumiqe.in",
        "https://www.lumiqe.in",
        # Vercel deployments (production + preview)
        "https://lumiqe.vercel.app",
        "https://lumiqe-mc3e05hs3-kanishk083s-projects.vercel.app",
        # Catch-all for any *.vercel.app preview deployments
        "https://lumiqe-kanishk083s-projects.vercel.app",
    ]

    # Rate limiting
    MAX_ANALYSES_PER_HOUR: int = 10
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # API
    API_VERSION: str = "3.0.0"
    API_TITLE: str = "Lumiqe API"
    API_DESCRIPTION: str = "AI-powered color analysis and personalized shopping"

    # Firecrawl (Dynamic Catalog)
    FIRECRAWL_API_KEY: str | None = None

    # Groq (LLM Styling Tips)
    GROQ_API_KEY: str | None = None

    # Model files — auto-downloaded on startup if missing (see download_models.py)
    BISENET_WEIGHTS_URL: str | None = None

    # JWT Authentication
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis (Rate Limiting)
    REDIS_URL: str | None = None

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    # Debug
    DEBUG: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
