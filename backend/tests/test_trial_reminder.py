"""Tests for the trial reminder service (module-level checks)."""

import os
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters")

import inspect

import app.services.trial_reminder as trial_reminder_module
from app.services.trial_reminder import send_trial_reminders


def test_module_imports_successfully():
    """The trial_reminder module should import without errors."""
    assert trial_reminder_module is not None


def test_send_trial_reminders_exists_and_is_async():
    """send_trial_reminders must be an async function."""
    assert hasattr(trial_reminder_module, "send_trial_reminders")
    assert inspect.iscoroutinefunction(send_trial_reminders)


def test_return_type_annotation_is_int():
    """send_trial_reminders should be annotated to return int."""
    sig = inspect.signature(send_trial_reminders)
    assert sig.return_annotation is int


def test_function_takes_no_parameters():
    """send_trial_reminders should accept no arguments."""
    sig = inspect.signature(send_trial_reminders)
    assert len(sig.parameters) == 0
