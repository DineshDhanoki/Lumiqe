"""Tests for product_repo — pure logic: imports, function existence, async, constants."""

import inspect


def test_module_imports():
    """product_repo module imports without error."""
    from app.repositories import product_repo  # noqa: F401


def test_expected_functions_exist():
    """All public repository functions are defined."""
    from app.repositories import product_repo

    expected = [
        "get_by_season",
        "search_by_color",
        "score_and_rank",
        "get_with_fallback",
        "count_products",
        "get_catalog_stats",
    ]
    for name in expected:
        assert hasattr(product_repo, name), f"Missing function: {name}"


def test_min_products_constant():
    """MIN_PRODUCTS exists and is a positive integer."""
    from app.repositories import product_repo

    assert hasattr(product_repo, "MIN_PRODUCTS")
    assert isinstance(product_repo.MIN_PRODUCTS, int)
    assert product_repo.MIN_PRODUCTS > 0


def test_all_functions_are_async():
    """Every expected function is a coroutine function."""
    from app.repositories import product_repo

    expected = [
        "get_by_season",
        "search_by_color",
        "score_and_rank",
        "get_with_fallback",
        "count_products",
        "get_catalog_stats",
    ]
    for name in expected:
        fn = getattr(product_repo, name)
        assert inspect.iscoroutinefunction(fn), f"{name} is not async"


def test_sibling_seasons_mapping():
    """SIBLING_SEASONS maps all 12 color seasons to lists of siblings."""
    from app.repositories import product_repo

    assert hasattr(product_repo, "SIBLING_SEASONS")
    mapping = product_repo.SIBLING_SEASONS
    assert isinstance(mapping, dict)
    assert len(mapping) >= 12
    for season, siblings in mapping.items():
        assert isinstance(siblings, list)
        assert len(siblings) >= 1, f"{season} has no siblings"
