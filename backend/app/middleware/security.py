"""
Lumiqe — Security Middleware.

Adds security headers, request ID tracking, log correlation,
and request metrics to all responses.
"""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.metrics import increment, observe

# ─── Log Correlation ──────────────────────────────────────────
_current_request_id: str = ""


class _RequestIDFilter(logging.Filter):
    """Logging filter that adds the current request_id to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _current_request_id or "-"
        return True


# Install the filter on the root logger so all loggers inherit it
_request_id_filter = _RequestIDFilter()
logging.getLogger().addFilter(_request_id_filter)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject OWASP-recommended security headers into every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        global _current_request_id

        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        _current_request_id = request_id

        # Set Sentry user context if authenticated (privacy-safe: id only)
        try:
            import sentry_sdk
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                from app.core.security import decode_token
                payload = decode_token(auth_header[7:])
                if payload and payload.get("sub"):
                    sentry_sdk.set_user({"id": str(payload["sub"])})
        except (ImportError, Exception):
            pass  # Sentry not installed or token decode failed — skip silently

        # Track request count and measure response time
        increment("lumiqe_requests_total")
        start = time.perf_counter()

        response = await call_next(request)

        duration = time.perf_counter() - start
        observe("lumiqe_response_seconds", duration)

        if response.status_code >= 500:
            increment("lumiqe_errors_total")

        # ─── Security Headers ─────────────────────────────────
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains"
        )
        response.headers["Cache-Control"] = "no-store"

        return response
