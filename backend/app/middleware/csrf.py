"""
Lumiqe — CSRF Protection Middleware.

Validates the Origin header on state-changing requests (POST, PUT, DELETE, PATCH)
to prevent cross-site request forgery. Requests must come from an allowed origin.

This complements the existing CORS middleware. CORS prevents reading responses;
CSRF protection prevents the request from executing at all.
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings

logger = logging.getLogger("lumiqe.middleware.csrf")

# Methods that change state and require CSRF protection
_UNSAFE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

# Paths exempt from CSRF (webhooks and server-to-server auth calls)
_EXEMPT_PREFIXES = (
    "/api/stripe/webhook",
    "/api/auth/",
)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Reject state-changing requests from unauthorized origins."""

    async def dispatch(self, request: Request, call_next):
        if request.method in _UNSAFE_METHODS:
            # Skip CSRF check for exempt paths (e.g., Stripe webhooks)
            path = request.url.path
            if any(path.startswith(prefix) for prefix in _EXEMPT_PREFIXES):
                return await call_next(request)

            origin = request.headers.get("origin")
            referer = request.headers.get("referer")

            # Extract origin from referer if origin header is missing
            effective_origin = origin
            if not effective_origin and referer:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(referer)
                    effective_origin = f"{parsed.scheme}://{parsed.netloc}"
                except Exception:
                    pass

            # Require an origin for all state-changing requests.
            # Requests with no Origin AND no Referer are likely non-browser
            # tools (curl, Postman) in dev, but in production browsers always
            # send at least one. Block missing-origin requests to prevent
            # CSRF bypass via stripped headers.
            if effective_origin is None:
                logger.warning(
                    f"[CSRF] Blocked request with no origin/referer "
                    f"method={request.method} path={path}"
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "CSRF_REJECTED",
                        "detail": "Origin header is required for state-changing requests.",
                        "code": 403,
                    },
                )

            allowed = {o.rstrip("/") for o in settings.CORS_ORIGINS}
            if effective_origin.rstrip("/") not in allowed:
                logger.warning(
                    f"[CSRF] Blocked request from origin={effective_origin} "
                    f"method={request.method} path={path}"
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "CSRF_REJECTED",
                        "detail": "Request origin is not allowed.",
                        "code": 403,
                    },
                )

        return await call_next(request)
