"""
Lumiqe — Code Quality Tests (Phase 4 TDD).

Tests for dependency injection patterns, serialization safety, and code hygiene.
"""

import inspect


# ─── Task 4.12: get_optional_user must use DI session ─────────


class TestDependencyInjection:
    """Functions must use FastAPI Depends for session management."""

    def test_get_optional_user_accepts_session_param(self):
        """get_optional_user must accept session via Depends, not create its own."""
        from app.core.dependencies import get_optional_user
        sig = inspect.signature(get_optional_user)
        param_names = list(sig.parameters.keys())

        assert "session" in param_names, (
            f"get_optional_user params are {param_names} — missing 'session'. "
            "It creates an unmanaged session via async_session_factory() instead of "
            "using FastAPI Depends(get_db) for proper lifecycle management."
        )

    def test_get_optional_user_no_raw_session_factory(self):
        """get_optional_user must not directly call async_session_factory()."""
        from app.core.dependencies import get_optional_user
        source = inspect.getsource(get_optional_user)
        assert "async_session_factory()" not in source, (
            "get_optional_user still creates an unmanaged session via "
            "async_session_factory(). Use Depends(get_db) instead."
        )


# ─── Task 4.5: Verify Stripe IDs never leak in public API ────


class TestSerializationSafety:
    """User serialization must never expose Stripe secrets."""

    def test_user_to_dict_excludes_stripe_customer_id(self):
        """to_dict() source must NOT reference stripe_customer_id or stripe_subscription_id."""
        from app.models import User
        source = inspect.getsource(User.to_dict)

        # Remove docstring/comments to check only code
        lines = [
            line for line in source.split("\n")
            if not line.strip().startswith("#") and not line.strip().startswith('"""')
        ]
        code_only = "\n".join(lines)

        # The return dict keys must not include stripe IDs
        assert "stripe_customer_id" not in code_only, (
            "to_dict() exposes stripe_customer_id to public API"
        )
        assert "stripe_subscription_id" not in code_only, (
            "to_dict() exposes stripe_subscription_id to public API"
        )

    def test_user_to_dict_excludes_password_hash(self):
        """to_dict() return dict must NOT include password_hash key."""
        from app.models import User
        source = inspect.getsource(User.to_dict)
        # Check the return dict, not comments/docstrings
        # Find the return statement and check it doesn't have password_hash as a key
        return_block = source[source.find("return {"):]
        assert '"password_hash"' not in return_block
        assert "'password_hash'" not in return_block
