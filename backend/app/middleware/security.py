"""
Lumiqe — Security Middleware.

Adds security headers, request ID tracking, and log correlation
to all responses.
"""

import logging
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

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

        response = await call_next(request)

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
