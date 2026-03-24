"""Tests for the seasonal rescan reminder service (module-level checks)."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import inspect

import app.services.seasonal_rescan as rescan_module
from app.services.seasonal_rescan import send_seasonal_rescan_reminders


def test_module_imports_successfully():
    """The seasonal_rescan module should import without errors."""
    assert rescan_module is not None


def test_send_seasonal_rescan_reminders_is_async():
    """send_seasonal_rescan_reminders must be an async function."""
    assert inspect.iscoroutinefunction(send_seasonal_rescan_reminders)


def test_return_type_annotation_is_int():
    """send_seasonal_rescan_reminders should be annotated to return int."""
    sig = inspect.signature(send_seasonal_rescan_reminders)
    assert sig.return_annotation is int


def test_uses_event_model():
    """The module should import the Event model."""
    import app.models as models
    assert hasattr(models, "Event")
    # Verify the module references Event
    source = inspect.getsource(rescan_module)
    assert "Event" in source
