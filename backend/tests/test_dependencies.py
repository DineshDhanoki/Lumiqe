"""Tests for dependencies — pure logic: imports, types, async checks."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import inspect

from fastapi.security import HTTPBearer


def test_bearer_scheme_is_http_bearer():
    """bearer_scheme is an HTTPBearer instance."""
    from app.core.dependencies import bearer_scheme

    assert isinstance(bearer_scheme, HTTPBearer)


def test_async_session_factory_exists():
    """async_session_factory is defined and callable."""
    from app.core.dependencies import async_session_factory

    assert async_session_factory is not None
    assert callable(async_session_factory)


def test_get_db_is_async_generator():
    """get_db is an async generator function."""
    from app.core.dependencies import get_db

    assert inspect.isasyncgenfunction(get_db)


def test_require_admin_and_require_premium_are_async():
    """require_admin and require_premium are async functions."""
    from app.core.dependencies import require_admin, require_premium

    assert inspect.iscoroutinefunction(require_admin)
    assert inspect.iscoroutinefunction(require_premium)
