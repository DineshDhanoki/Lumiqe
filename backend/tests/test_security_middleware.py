"""
Lumiqe — Security Middleware Tests (Phase 1 TDD).

Tests for CSP headers, CSRF protection, and token refresh ordering.
Written BEFORE fixes per TDD methodology.
"""

import pytest


# ─── Task 1.1: CSP must NOT contain unsafe-inline or unsafe-eval ─────


class TestCSPHeaders:
    """Content-Security-Policy must not allow arbitrary script execution."""

    @pytest.mark.anyio
    async def test_csp_header_present(self, client):
        """CSP header must exist on all responses."""
        response = await client.get("/api/health")
        assert "content-security-policy" in response.headers

    @pytest.mark.anyio
    async def test_csp_no_unsafe_inline_scripts(self, client):
        """script-src must NOT contain 'unsafe-inline' — defeats XSS protection."""
        response = await client.get("/api/health")
        csp = response.headers.get("content-security-policy", "")
        # Extract the script-src directive
        for directive in csp.split(";"):
            if "script-src" in directive:
                assert "'unsafe-inline'" not in directive, (
                    f"CSP script-src contains 'unsafe-inline': {directive.strip()}"
                )
                break

    @pytest.mark.anyio
    async def test_csp_no_unsafe_eval_scripts(self, client):
        """script-src must NOT contain 'unsafe-eval' — allows eval() XSS."""
        response = await client.get("/api/health")
        csp = response.headers.get("content-security-policy", "")
        for directive in csp.split(";"):
            if "script-src" in directive:
                assert "'unsafe-eval'" not in directive, (
                    f"CSP script-src contains 'unsafe-eval': {directive.strip()}"
                )
                break

    @pytest.mark.anyio
    async def test_csp_style_allows_unsafe_inline(self, client):
        """style-src MAY keep 'unsafe-inline' — needed for React inline styles."""
        response = await client.get("/api/health")
        csp = response.headers.get("content-security-policy", "")
        # This test documents the current acceptable exception
        assert "style-src" in csp

    @pytest.mark.anyio
    async def test_csp_frame_ancestors_none(self, client):
        """frame-ancestors must be 'none' to prevent clickjacking."""
        response = await client.get("/api/health")
        csp = response.headers.get("content-security-policy", "")
        assert "frame-ancestors 'none'" in csp


# ─── Task 1.2: CSRF must block requests with no Origin header ────────


class TestCSRFProtection:
    """CSRF middleware must not allow origin-less state-changing requests."""

    @pytest.mark.anyio
    async def test_csrf_blocks_post_without_origin(self, client):
        """POST with no Origin/Referer header must be blocked by CSRF."""
        response = await client.post(
            "/api/stripe/checkout",
            json={"plan": "monthly"},
            # No Origin or Referer header — CSRF must reject this
        )
        # Must be 403 CSRF_REJECTED, not pass through to app logic
        assert response.status_code == 403, (
            f"Expected 403 CSRF block, got {response.status_code}: {response.text}"
        )
        body = response.json()
        assert body.get("error") == "CSRF_REJECTED"

    @pytest.mark.anyio
    async def test_csrf_allows_post_with_valid_origin(self, client):
        """POST with a valid allowed Origin header should pass CSRF check."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@test.com", "password": "Test1234!"},
            headers={"Origin": "http://localhost:3000"},
        )
        # Should NOT be 403 — may be 401 (bad creds) or 503 (no DB), but not CSRF
        assert response.status_code != 403

    @pytest.mark.anyio
    async def test_csrf_blocks_post_with_bad_origin(self, client):
        """POST with an unknown Origin must be blocked."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@test.com", "password": "Test1234!"},
            headers={"Origin": "https://evil-site.com"},
        )
        assert response.status_code == 403
        body = response.json()
        assert body.get("error") == "CSRF_REJECTED"

    @pytest.mark.anyio
    async def test_csrf_allows_get_without_origin(self, client):
        """GET requests are safe methods and should never be CSRF-blocked."""
        response = await client.get("/api/health")
        assert response.status_code != 403

    @pytest.mark.anyio
    async def test_csrf_exempts_stripe_webhook(self, client):
        """Stripe webhook path must be exempt from CSRF (external service)."""
        response = await client.post(
            "/api/stripe/webhook",
            content=b"{}",
            headers={"Content-Type": "application/json"},
            # No Origin header — this is from Stripe servers
        )
        # Should NOT be 403 CSRF — may be 400/401 (bad sig), but not CSRF
        assert response.status_code != 403


# ─── Task 1.5: Token refresh must store new token BEFORE revoking old ─


class TestTokenRefreshOrdering:
    """Token refresh must not create a window where user has no valid token."""

    @pytest.mark.anyio
    async def test_refresh_with_invalid_token_returns_401(self, client):
        """Refresh with garbage token must return 401."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
            headers={"Origin": "http://localhost:3000"},
        )
        # 401 if token validation runs, 503 if DB unavailable (acceptable in test env)
        assert response.status_code in (401, 503)

    @pytest.mark.anyio
    async def test_refresh_with_access_token_returns_401(self, client, valid_token):
        """Using an access token for refresh must be rejected."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": valid_token},
            headers={"Origin": "http://localhost:3000"},
        )
        # 401 if token type check runs, 503 if DB unavailable
        assert response.status_code in (401, 503)

    def test_refresh_stores_new_before_revoking_old(self):
        """Verify the token rotation section stores new token before revoking old.

        The function has two sections that call revoke_refresh_token:
        1. Token reuse detection (security kill-switch) — revokes on reuse
        2. Normal rotation — should store new THEN revoke old

        We only check section 2: after 'Issue new access + refresh tokens',
        store_refresh_token must appear before revoke_refresh_token.
        """
        import inspect
        from app.api.auth import refresh_token

        source = inspect.getsource(refresh_token)

        # Find the rotation section (after "Issue new" comment or create_access_token)
        rotation_start = source.find("create_access_token")
        assert rotation_start != -1, "create_access_token not found in refresh endpoint"

        rotation_section = source[rotation_start:]
        store_pos = rotation_section.find("store_refresh_token")
        revoke_pos = rotation_section.find("revoke_refresh_token")

        assert store_pos != -1, "store_refresh_token not found in rotation section"
        assert revoke_pos != -1, "revoke_refresh_token not found in rotation section"
        assert store_pos < revoke_pos, (
            "RACE CONDITION: In the token rotation section, revoke_refresh_token "
            "is called BEFORE store_refresh_token. User will have no valid token "
            "in the window between revoke and store."
        )
