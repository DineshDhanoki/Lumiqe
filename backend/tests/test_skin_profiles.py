"""Tests for app.api.skin_profiles — module-level checks."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

from app.api.skin_profiles import router, SkinProfileTimeline, MonthEntry


# ── Module imports successfully ───────────────────────────────


def test_module_imports():
    """The skin_profiles module must import without errors."""
    assert router is not None
    assert SkinProfileTimeline is not None
    assert MonthEntry is not None


# ── Router prefix ─────────────────────────────────────────────


def test_router_prefix():
    """Router prefix must be /api/skin-profiles."""
    assert router.prefix == "/api/skin-profiles"


# ── GET endpoint exists ───────────────────────────────────────


def test_get_endpoint_exists():
    """There must be a GET route on the router."""
    get_routes = [
        route for route in router.routes if "GET" in getattr(route, "methods", set())
    ]
    assert len(get_routes) >= 1


# ── SkinProfileTimeline model ─────────────────────────────────


def test_skin_profile_timeline_fields():
    """SkinProfileTimeline must have timeline, shift_detected, shifts, total_analyses."""
    expected = {"timeline", "shift_detected", "shifts", "total_analyses"}
    assert expected == set(SkinProfileTimeline.model_fields.keys())
