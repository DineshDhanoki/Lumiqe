"""
Lumiqe — Daily Outfit Suggestion Service.

Picks wardrobe items for top/bottom/shoes/accessory slots using a
date-seeded RNG for consistent daily results.
"""

import hashlib
import logging
import random
from datetime import date

logger = logging.getLogger("lumiqe.daily_outfit")

OUTFIT_SLOTS = ["top", "bottom", "shoes", "accessory"]
MIN_MATCH_SCORE = 50


def _get_daily_seed(user_id: int, today: date) -> int:
    """Generate a deterministic seed from user ID and date."""
    seed_string = f"{user_id}:{today.isoformat()}"
    return int(hashlib.sha256(seed_string.encode()).hexdigest()[:8], 16)


def _filter_eligible_items(
    wardrobe_items: list[dict],
    slot: str,
) -> list[dict]:
    """Filter wardrobe items that are eligible for a given slot."""
    eligible = []
    for item in wardrobe_items:
        item_score = item.get("match_score", 0)
        if item_score < MIN_MATCH_SCORE:
            continue

        item_category = (item.get("category") or "").lower()
        item_name = (item.get("name") or "").lower()
        item_tags = (item.get("tags") or "").lower()
        searchable = f"{item_category} {item_name} {item_tags}"

        if _matches_slot(searchable, slot):
            eligible.append(item)

    return eligible


def _matches_slot(searchable: str, slot: str) -> bool:
    """Check if an item's searchable text matches a slot category."""
    slot_keywords = {
        "top": [
            "top", "shirt", "tshirt", "t-shirt", "blouse", "sweater",
            "hoodie", "jacket", "kurta", "upper", "polo", "tank",
            "tunic", "cardigan", "vest",
        ],
        "bottom": [
            "bottom", "pants", "jeans", "trousers", "skirt", "shorts",
            "lower", "legging", "palazzo", "chino", "jogger", "salwar",
        ],
        "shoes": [
            "shoes", "sneakers", "boots", "sandals", "heels", "loafer",
            "footwear", "slipper", "mule", "oxford", "derby", "kolhapuri",
        ],
        "accessory": [
            "accessory", "watch", "bag", "belt", "scarf", "hat",
            "sunglasses", "jewelry", "bracelet", "necklace", "earring",
            "ring", "clutch", "dupatta",
        ],
    }

    keywords = slot_keywords.get(slot, [])
    return any(keyword in searchable for keyword in keywords)


def get_daily_outfit(
    user_id: int,
    wardrobe_items: list[dict],
) -> dict:
    """
    Pick wardrobe items for today's outfit across 4 slots.

    Uses a date-seeded RNG so the same user gets the same outfit
    all day, but a fresh suggestion each new day.

    Args:
        user_id: The authenticated user's ID.
        wardrobe_items: List of wardrobe item dicts, each with at least
            'category', 'name', 'match_score', and item metadata.

    Returns:
        Dict with 'date', 'slots' (mapping slot name to selected item
        or None), and 'filled_count'.
    """
    today = date.today()
    seed = _get_daily_seed(user_id, today)
    rng = random.Random(seed)

    slots: dict[str, dict | None] = {}
    used_item_ids: set[str] = set()

    for slot in OUTFIT_SLOTS:
        eligible = _filter_eligible_items(wardrobe_items, slot)

        # Remove items already picked for another slot
        eligible = [
            item for item in eligible
            if item.get("id", "") not in used_item_ids
        ]

        if eligible:
            # Sort by match score descending, then pick randomly
            # from the top candidates for variety
            eligible.sort(key=lambda i: i.get("match_score", 0), reverse=True)
            top_candidates = eligible[:max(3, len(eligible) // 2)]
            pick = rng.choice(top_candidates)
            slots[slot] = pick
            item_id = pick.get("id", "")
            if item_id:
                used_item_ids.add(item_id)
        else:
            slots[slot] = None

    filled_count = sum(1 for item in slots.values() if item is not None)

    logger.info(
        f"Daily outfit for user {user_id} on {today}: "
        f"{filled_count}/{len(OUTFIT_SLOTS)} slots filled"
    )

    return {
        "date": today.isoformat(),
        "slots": slots,
        "filled_count": filled_count,
        "total_slots": len(OUTFIT_SLOTS),
    }
