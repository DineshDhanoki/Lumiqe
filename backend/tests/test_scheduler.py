"""Tests for scheduler — pure logic: imports, function existence, constants, state."""

def test_module_imports():
    """scheduler module imports without error."""
    from app.core import scheduler  # noqa: F401


def test_start_stop_exist():
    """start_scheduler and stop_scheduler are defined."""
    from app.core import scheduler

    assert hasattr(scheduler, "start_scheduler")
    assert hasattr(scheduler, "stop_scheduler")
    assert callable(scheduler.start_scheduler)
    assert callable(scheduler.stop_scheduler)


def test_digest_weekday_constant():
    """_DIGEST_WEEKDAY is 0 (Monday)."""
    from app.core import scheduler

    assert scheduler._DIGEST_WEEKDAY == 0


def test_digest_hour_constant():
    """_DIGEST_HOUR is 10 (10:00 UTC)."""
    from app.core import scheduler

    assert scheduler._DIGEST_HOUR == 10


def test_trial_reminder_hour_constant():
    """_TRIAL_REMINDER_HOUR is 8 (08:00 UTC)."""
    from app.core import scheduler

    assert scheduler._TRIAL_REMINDER_HOUR == 8


def test_daily_outfit_hour_constant():
    """_DAILY_OUTFIT_HOUR is 7 (07:00 UTC)."""
    from app.core import scheduler

    assert scheduler._DAILY_OUTFIT_HOUR == 7
