"""Tests for user_repo — pure logic: imports, function existence, async, signatures."""

import inspect

def test_module_imports():
    """user_repo module imports without error."""
    from app.repositories import user_repo  # noqa: F401


def test_expected_functions_exist():
    """All public repository functions are defined."""
    from app.repositories import user_repo

    expected = [
        "get_by_email",
        "get_by_id",
        "create",
        "update_palette",
        "decrement_scan",
        "delete_by_email",
        "upgrade_to_premium",
        "downgrade_from_premium",
        "add_credits",
        "deduct_credit",
        "update_quiz",
        "generate_referral_code",
        "apply_referral",
        "update_password",
        "verify_email",
    ]
    for name in expected:
        assert hasattr(user_repo, name), f"Missing function: {name}"


def test_all_functions_are_async():
    """Every expected function is a coroutine function."""
    from app.repositories import user_repo

    expected = [
        "get_by_email",
        "get_by_id",
        "create",
        "update_palette",
        "decrement_scan",
        "delete_by_email",
        "upgrade_to_premium",
        "downgrade_from_premium",
        "add_credits",
        "deduct_credit",
        "update_quiz",
        "generate_referral_code",
        "apply_referral",
        "update_password",
        "verify_email",
    ]
    for name in expected:
        fn = getattr(user_repo, name)
        assert inspect.iscoroutinefunction(fn), f"{name} is not async"


def test_get_by_email_signature():
    """get_by_email accepts (session, email)."""
    from app.repositories import user_repo

    sig = inspect.signature(user_repo.get_by_email)
    params = list(sig.parameters.keys())
    assert params == ["session", "email"]


def test_create_signature():
    """create accepts (session, name, email, password_hash)."""
    from app.repositories import user_repo

    sig = inspect.signature(user_repo.create)
    params = list(sig.parameters.keys())
    assert params == ["session", "name", "email", "password_hash"]


def test_upgrade_to_premium_signature():
    """upgrade_to_premium accepts (session, user_id, stripe_customer_id, stripe_subscription_id)."""
    from app.repositories import user_repo

    sig = inspect.signature(user_repo.upgrade_to_premium)
    params = list(sig.parameters.keys())
    assert params == ["session", "user_id", "stripe_customer_id", "stripe_subscription_id"]
