"""
Lumiqe — FastAPI App Factory.

Creates the FastAPI application, registers all routers,
adds middleware, and handles startup/shutdown lifecycle.

Run with: uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.dependencies import init_db, close_db
from app.core.rate_limiter import init_redis, close_redis
from app.middleware.security import SecurityHeadersMiddleware
from download_models import ensure_models

# ─── Route Modules ───────────────────────────────────────────
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.analyze import router as analyze_router
from app.api.products import router as products_router
from app.api.scan import router as scan_router
from app.api.palette_card import router as palette_card_router
from app.api.admin import router as admin_router
from app.api.shopping_agent import router as shopping_agent_router
from app.api.styling_tips import router as styling_tips_router
from app.api.stripe import router as stripe_router
from app.api.complete_profile import router as complete_profile_router
from app.api.color_chat import router as color_chat_router

logger = logging.getLogger("lumiqe.main")

# ─── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


# ─── Lifespan (startup/shutdown) ─────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database and Redis on startup, clean up on shutdown."""
    logger.info("Starting Lumiqe API — initializing services...")

    # Download ML model files if missing (needed on Render where *.pth is gitignored)
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, ensure_models)

    await init_db()
    await init_redis()
    logger.info("All services initialized")
    yield
    logger.info("Shutting down — closing connections...")
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

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(products_router)
app.include_router(scan_router)
app.include_router(palette_card_router)
app.include_router(admin_router)
app.include_router(shopping_agent_router)
app.include_router(styling_tips_router)
app.include_router(stripe_router)
app.include_router(complete_profile_router)
app.include_router(color_chat_router)


# ─── CLI Entry Point ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
