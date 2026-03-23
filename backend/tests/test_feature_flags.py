"""Tests for app.core.feature_flags — flag rollout and bucketing."""

import pytest

from app.core.feature_flags import is_enabled, get_all_flags, set_rollout, _FLAGS


@pytest.fixture(autouse=True)
def _restore_flags():
    """Snapshot original rollout values and restore after each test."""
    originals = {name: flag.rollout_percent for name, flag in _FLAGS.items()}
    yield
    for name, pct in originals.items():
        _FLAGS[name].rollout_percent = pct


# ── Basic Rollout ────────────────────────────────────────────


def test_rollout_100_always_enabled():
    set_rollout("multi_photo_analysis", 100)
    for uid in range(200):
        assert is_enabled("multi_photo_analysis", user_id=uid) is True


def test_rollout_0_never_enabled():
    set_rollout("new_pricing_tiers", 0)
    for uid in range(200):
        assert is_enabled("new_pricing_tiers", user_id=uid) is False


def test_deterministic_bucketing():
    """Same user_id must always produce the same result."""
    set_rollout("gift_analysis", 50)
    first_run = [is_enabled("gift_analysis", user_id=i) for i in range(100)]
    second_run = [is_enabled("gift_analysis", user_id=i) for i in range(100)]
    assert first_run == second_run


def test_unknown_flag_returns_false():
    assert is_enabled("nonexistent_feature_xyz") is False


def test_rollout_50_coverage():
    """With 50% rollout, roughly 50% of 1000 user_ids should be enabled."""
    set_rollout("gift_analysis", 50)
    count = sum(is_enabled("gift_analysis", user_id=i) for i in range(1000))
    # Deterministic bucketing: user_id % 100 < 50 means exactly 500/1000
    assert 450 <= count <= 550


def test_no_user_id_random():
    """Without user_id, the check uses random — should not crash."""
    set_rollout("gift_analysis", 50)
    results = [is_enabled("gift_analysis") for _ in range(100)]
    # At least some True and some False expected with 50% rollout
    assert any(results)
    assert not all(results)


# ── set_rollout ──────────────────────────────────────────────


def test_set_rollout_clamps_max():
    set_rollout("new_pricing_tiers", 999)
    assert _FLAGS["new_pricing_tiers"].rollout_percent == 100


def test_set_rollout_clamps_min():
    set_rollout("new_pricing_tiers", -50)
    assert _FLAGS["new_pricing_tiers"].rollout_percent == 0


# ── get_all_flags ────────────────────────────────────────────


def test_get_all_flags_returns_all():
    flags = get_all_flags()
    assert isinstance(flags, dict)
    assert len(flags) == len(_FLAGS)
    for name in _FLAGS:
        assert name in flags
        assert "rollout_percent" in flags[name]
        assert "description" in flags[name]
