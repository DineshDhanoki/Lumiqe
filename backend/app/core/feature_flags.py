"""
Lumiqe — Feature Flag System.

Simple feature flag system with deterministic user-bucketed rollout.
Flags can be toggled at runtime via set_rollout().
"""

import logging
import random
from dataclasses import dataclass

logger = logging.getLogger("lumiqe.feature_flags")


# ─── Flag Definition ────────────────────────────────────────

@dataclass
class _Flag:
    """Internal representation of a feature flag."""

    name: str
    rollout_percent: int
    description: str


# ─── Flag Registry ──────────────────────────────────────────

_FLAGS: dict[str, _Flag] = {
    "new_pricing_tiers": _Flag(
        name="new_pricing_tiers",
        rollout_percent=0,
        description="Revised subscription pricing tiers",
    ),
    "multi_photo_analysis": _Flag(
        name="multi_photo_analysis",
        rollout_percent=100,
        description="Allow users to upload multiple photos for analysis",
    ),
    "wardrobe_tracker": _Flag(
        name="wardrobe_tracker",
        rollout_percent=100,
        description="Track wardrobe items and suggest outfits",
    ),
    "weekly_digest": _Flag(
        name="weekly_digest",
        rollout_percent=100,
        description="Send weekly style digest emails",
    ),
    "gift_analysis": _Flag(
        name="gift_analysis",
        rollout_percent=50,
        description="Analyse colors for gift recipients",
    ),
    "stories_card": _Flag(
        name="stories_card",
        rollout_percent=100,
        description="Shareable stories-format palette card",
    ),
    "seasonal_guide": _Flag(
        name="seasonal_guide",
        rollout_percent=100,
        description="Seasonal color guide recommendations",
    ),
}


# ─── Public API ─────────────────────────────────────────────


def is_enabled(flag_name: str, user_id: int | None = None) -> bool:
    """
    Check whether a feature flag is enabled.

    Args:
        flag_name: Name of the flag to check.
        user_id: If provided, uses deterministic bucketing so the same
                 user always gets the same result. If None, uses a
                 random check.

    Returns:
        True if the flag is enabled for this user/request.
    """
    flag = _FLAGS.get(flag_name)
    if flag is None:
        logger.warning(f"Unknown feature flag: {flag_name}")
        return False

    if flag.rollout_percent >= 100:
        return True
    if flag.rollout_percent <= 0:
        return False

    if user_id is not None:
        enabled = (user_id % 100) < flag.rollout_percent
    else:
        enabled = random.randint(0, 99) < flag.rollout_percent

    logger.debug(
        f"Flag '{flag_name}' (rollout {flag.rollout_percent}%) "
        f"-> {'enabled' if enabled else 'disabled'} "
        f"(user_id={user_id})"
    )
    return enabled


def get_all_flags() -> dict[str, dict]:
    """
    Return all flags with their rollout percentages.

    Returns:
        Dictionary mapping flag names to their configuration.
    """
    return {
        name: {
            "name": flag.name,
            "rollout_percent": flag.rollout_percent,
            "description": flag.description,
        }
        for name, flag in _FLAGS.items()
    }


def set_rollout(flag_name: str, percent: int) -> None:
    """
    Update the rollout percentage for a flag.

    Args:
        flag_name: Name of the flag to update.
        percent: New rollout percentage (clamped to 0-100).

    Raises:
        KeyError: If the flag does not exist.
    """
    flag = _FLAGS.get(flag_name)
    if flag is None:
        raise KeyError(f"Unknown feature flag: {flag_name}")

    clamped = max(0, min(100, percent))
    old_percent = flag.rollout_percent
    flag.rollout_percent = clamped

    logger.info(
        f"Flag '{flag_name}' rollout updated: {old_percent}% -> {clamped}%"
    )
