"""
Lumiqe — FastAPI App Factory.

Creates the FastAPI application, registers all routers,
adds middleware, and handles startup/shutdown lifecycle.

Run with: uvicorn app.main:app --reload --port 8000
"""

import json as _json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

# ─── Sentry (error tracking) ─────────────────────────────────
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            environment="production" if not settings.DEBUG else "development",
            release=settings.API_VERSION,
            send_default_pii=False,
        )
    except ImportError:
        pass  # sentry-sdk not installed — skip silently
from app.core.dependencies import init_db, close_db
from app.core.rate_limiter import init_redis, close_redis
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.csrf import CSRFMiddleware
from download_models import ensure_models

# ─── Route Modules ───────────────────────────────────────────
from app.api.routers import register_all_routers

logger = logging.getLogger("lumiqe.main")

# ─── JSON Structured Logging ─────────────────────────────────


class _JSONFormatter(logging.Formatter):
    """Emit log records as single-line JSON for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return _json.dumps(log_entry)


_handler = logging.StreamHandler()
_handler.setFormatter(_JSONFormatter())
logging.basicConfig(
    level=logging.INFO,
    handlers=[_handler],
)


# ─── Lifespan (startup/shutdown) ─────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database and Redis on startup, clean up on shutdown."""
    logger.info("Starting Lumiqe API — initializing services...")

    # Download ML model files if missing (needed on Render where *.pth is gitignored)
    import asyncio
    await asyncio.to_thread(ensure_models)

    await init_db()
    await init_redis()

    # In production, Redis is REQUIRED for rate limiting, push subs, and chat history.
    # Fail fast so we don't serve traffic with broken rate limiting.
    if not settings.DEBUG:
        from app.core.rate_limiter import _redis_available
        if not _redis_available:
            raise RuntimeError(
                "Redis is NOT connected but DEBUG=False. "
                "Refusing to start — in-memory fallbacks are not safe for production. "
                "Set REDIS_URL or set DEBUG=True for local development."
            )

    # Start background scheduler (skip in test/CI environments)
    scheduler = None
    if not os.environ.get("CELERY_ALWAYS_EAGER"):
        try:
            from apscheduler.schedulers.asyncio import AsyncIOScheduler
            scheduler = AsyncIOScheduler()
            scheduler.start()
            logger.info("Background scheduler started")
        except ImportError:
            logger.info("apscheduler not installed — background scheduler disabled")
        except Exception as exc:
            logger.warning(f"Scheduler failed to start: {exc}")
    else:
        logger.info("Scheduler skipped (test/CI mode)")

    logger.info("All services initialized")
    yield
    logger.info("Shutting down — closing connections...")

    # Stop scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")
    await close_redis()
    await close_db()


# ─── App Creation ────────────────────────────────────────────

app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# Security Headers (runs on every response)
app.add_middleware(SecurityHeadersMiddleware)

# CSRF Protection (blocks state-changing requests from unauthorized origins)
app.add_middleware(CSRFMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


# ─── Global Exception Handler ────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler returning structured JSON errors."""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "detail": "An unexpected error occurred. Please try again.",
            "code": 500,
        },
    )


# ─── Register Routers ────────────────────────────────────────

register_all_routers(app)


# ─── CLI Entry Point ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
