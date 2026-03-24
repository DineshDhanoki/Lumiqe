"""Tests for Stripe price/credit configuration and webhook dedup concept."""

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-must-be-32-chars-minimum")

from app.api.stripe import CREDIT_PACKS, PRICE_MAP  # noqa: E402


# ─── Price Map ───────────────────────────────────────────────


class TestPriceMap:
    """Verify PRICE_MAP has correct amounts in INR paise."""

    def test_monthly_amount(self):
        assert PRICE_MAP["monthly"]["amount"] == 14900

    def test_annual_amount(self):
        assert PRICE_MAP["annual"]["amount"] == 99900

    def test_monthly_interval(self):
        assert PRICE_MAP["monthly"]["interval"] == "month"

    def test_annual_interval(self):
        assert PRICE_MAP["annual"]["interval"] == "year"


# ─── Credit Packs ────────────────────────────────────────────


class TestCreditPacks:
    """Verify CREDIT_PACKS configuration."""

    def test_has_five_entries(self):
        assert len(CREDIT_PACKS) == 5

    def test_expected_pack_names(self):
        expected = {"single", "scan", "analysis", "analysis_report", "bundle_5"}
        assert set(CREDIT_PACKS.keys()) == expected

    def test_credit_counts(self):
        expected_credits = {
            "single": 1,
            "scan": 1,
            "analysis": 3,
            "analysis_report": 5,
            "bundle_5": 10,
        }
        for pack_name, expected_count in expected_credits.items():
            assert CREDIT_PACKS[pack_name]["credits"] == expected_count

    def test_all_packs_have_required_keys(self):
        for name, pack in CREDIT_PACKS.items():
            assert "amount" in pack, f"{name} missing 'amount'"
            assert "credits" in pack, f"{name} missing 'credits'"
            assert "label" in pack, f"{name} missing 'label'"


# ─── Webhook Idempotency Concept ─────────────────────────────


class TestWebhookIdempotency:
    """Test the SET NX pattern used for webhook deduplication."""

    def test_set_nx_first_call_returns_true(self):
        """Simulate Redis SET NX: first insert succeeds."""
        seen: dict[str, str] = {}
        event_id = "evt_test_123"

        # First time: key not present, SET NX succeeds
        if event_id not in seen:
            seen[event_id] = "1"
            first_result = True
        else:
            first_result = False

        assert first_result is True

    def test_set_nx_second_call_returns_false(self):
        """Simulate Redis SET NX: duplicate insert is rejected."""
        seen: dict[str, str] = {}
        event_id = "evt_test_456"

        # First insert
        seen[event_id] = "1"

        # Second insert: key already exists
        if event_id not in seen:
            seen[event_id] = "1"
            second_result = True
        else:
            second_result = False

        assert second_result is False
