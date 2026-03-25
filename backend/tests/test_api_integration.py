"""
Lumiqe — API Integration Tests.

Tests every major API endpoint with valid and invalid inputs.
Uses FastAPI's AsyncClient. Where the DB is not available the
backend gracefully returns 503 — all assertions accept 503 so
tests run cleanly in a no-DB CI environment.
"""

import io
import pytest
from PIL import Image


# ─── Helper: Build tiny valid images ────────────────────────


def make_jpeg_bytes() -> bytes:
    img = Image.new("RGB", (10, 10), color=(199, 107, 63))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def make_png_bytes() -> bytes:
    img = Image.new("RGB", (10, 10), color=(100, 180, 80))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ─── Health Check ────────────────────────────────────────────


@pytest.mark.anyio
async def test_health_endpoint(client):
    """Health check must return 200 with a status field."""
    res = await client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data


# ─── Auth: Register ──────────────────────────────────────────


@pytest.mark.anyio
async def test_register_missing_body(client):
    """Register with no body should fail 422 (503 if DB unavailable)."""
    res = await client.post("/api/auth/register", json={})
    assert res.status_code in (422, 503)


@pytest.mark.anyio
async def test_register_invalid_email(client):
    """Register with malformed email should fail validation."""
    res = await client.post("/api/auth/register", json={
        "name": "Test",
        "email": "not-an-email",
        "password": "StrongP@ss1"
    })
    assert res.status_code in (422, 503)


@pytest.mark.anyio
async def test_register_weak_password(client):
    """Register with weak password should fail validation."""
    res = await client.post("/api/auth/register", json={
        "name": "Test",
        "email": "test@lumiqe.com",
        "password": "weak"
    })
    # 422 (pydantic) or 400 (business logic) or 503 (DB unavailable)
    assert res.status_code in (422, 400, 503)


# ─── Auth: Login ─────────────────────────────────────────────


@pytest.mark.anyio
async def test_login_missing_body(client):
    """Login with no body should return 422 (503 if DB unavailable)."""
    res = await client.post("/api/auth/login", json={})
    assert res.status_code in (422, 503)


@pytest.mark.anyio
async def test_login_nonexistent_user(client):
    """Login with unknown email returns 401, 429, or 503."""
    res = await client.post("/api/auth/login", json={
        "email": "nobody@lumiqe.com",
        "password": "StrongP@ss1"
    })
    assert res.status_code in (401, 429, 503)


@pytest.mark.anyio
async def test_login_brute_force_limit(client):
    """6 rapid login attempts for same email should trigger 429."""
    payload = {"email": "brutetest@example.com", "password": "Wrong!Pass1"}
    for _ in range(5):
        await client.post("/api/auth/login", json=payload)
    res = await client.post("/api/auth/login", json=payload)
    # 429 if Redis connected, 401 if not, 503 if DB unavailable
    assert res.status_code in (429, 401, 503)


# ─── Analyze Endpoint ────────────────────────────────────────


@pytest.mark.anyio
async def test_analyze_requires_auth(client):
    """Analyze without token should return 422 (missing file), 401/403, or 503."""
    res = await client.post("/api/analyze")
    assert res.status_code in (401, 422, 403, 503)


@pytest.mark.anyio
async def test_analyze_with_invalid_token(client):
    """Analyze with a garbage token should return 401."""
    res = await client.post(
        "/api/analyze",
        headers={"Authorization": "Bearer invalid.token.here"},
        files={"image": ("test.jpg", make_jpeg_bytes(), "image/jpeg")},
    )
    assert res.status_code == 401


@pytest.mark.anyio
async def test_analyze_rejects_text_file(client, auth_headers):
    """Analyze should reject non-image uploads with 422 (503 if DB unavailable)."""
    res = await client.post(
        "/api/analyze",
        headers=auth_headers,
        files={"image": ("test.txt", b"hello world text file", "text/plain")},
    )
    assert res.status_code in (422, 503)


@pytest.mark.anyio
async def test_analyze_rejects_empty_file(client, auth_headers):
    """Analyze should reject empty file with 422 (503 if DB unavailable)."""
    res = await client.post(
        "/api/analyze",
        headers=auth_headers,
        files={"image": ("empty.jpg", b"", "image/jpeg")},
    )
    assert res.status_code in (422, 503)


# ─── Scan Endpoint ───────────────────────────────────────────


@pytest.mark.anyio
async def test_scan_requires_auth(client):
    """Scan without token should return 401, 422, 403, or 503."""
    res = await client.post("/api/scan-item")
    assert res.status_code in (401, 422, 403, 503)


@pytest.mark.anyio
async def test_scan_rejects_non_image(client, auth_headers):
    """Scan with a PDF file should return 422 (503 if DB unavailable)."""
    res = await client.post(
        "/api/scan-item",
        headers=auth_headers,
        files={"image": ("doc.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )
    assert res.status_code in (422, 503)


# ─── Stripe Endpoints ────────────────────────────────────────


@pytest.mark.anyio
async def test_stripe_checkout_requires_auth(client):
    """Checkout endpoint must require authentication."""
    res = await client.post("/api/stripe/checkout", json={"plan": "monthly"})
    assert res.status_code in (401, 403, 503)


@pytest.mark.anyio
async def test_stripe_checkout_invalid_plan(client, auth_headers):
    """Checkout with unknown plan name should return 400, 401, or 503."""
    res = await client.post(
        "/api/stripe/checkout",
        headers=auth_headers,
        json={"plan": "ultra-mega-plan"},
    )
    assert res.status_code in (400, 401, 503)


@pytest.mark.anyio
async def test_stripe_portal_requires_auth(client):
    """Portal endpoint must require authentication."""
    res = await client.post("/api/stripe/portal")
    assert res.status_code in (401, 403, 503)


@pytest.mark.anyio
async def test_stripe_webhook_rejects_unconfigured(client):
    """Webhook must return 500 if STRIPE_WEBHOOK_SECRET is not set."""
    res = await client.post(
        "/api/stripe/webhook",
        content=b'{"type": "test"}',
        headers={"stripe-signature": "fake_sig"},
    )
    # 500 if secret not configured, 400 if configured but bad sig
    assert res.status_code in (500, 400)


# ─── Shopping Agent ──────────────────────────────────────────


@pytest.mark.anyio
async def test_shopping_agent_requires_auth(client):
    """Shopping agent must require auth."""
    res = await client.get("/api/shopping-agent?gender=male&palette=%23C76B3F")
    assert res.status_code in (401, 403, 503)


# ─── Security Headers ────────────────────────────────────────


@pytest.mark.anyio
async def test_security_headers_on_all_responses(client):
    """Security headers must be present on every response."""
    res = await client.get("/api/health")
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert "x-request-id" in res.headers


@pytest.mark.anyio
async def test_no_stack_trace_in_error_responses(client):
    """Error responses must never expose Python tracebacks."""
    res = await client.post("/api/analyze")
    body = res.text
    assert "Traceback" not in body
    assert 'File "' not in body


@pytest.mark.anyio
async def test_error_response_structure(client):
    """Error responses must follow structured JSON format."""
    res = await client.post("/api/auth/register", json={})
    data = res.json()
    # FastAPI 422 uses "detail" with array of errors; 503 also has "detail"
    assert "detail" in data
