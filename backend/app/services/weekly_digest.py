"""
Lumiqe — Weekly Digest Email Service.

Finds new products matching each user's palette via Delta-E color distance,
then sends a branded HTML email with the top 6 product recommendations.
"""

import logging
from html import escape

from sqlalchemy import select

from app.core.config import settings
from app.core.dependencies import async_session_factory
from app.models import User, Product
from app.repositories import product_repo
from app.services.color_matcher import hex_to_lab, delta_e_cie2000

logger = logging.getLogger("lumiqe.weekly_digest")

MAX_DELTA_E = 40.0
TOP_PICKS = 6


async def _get_users_with_palettes() -> list[dict]:
    """Fetch all users who have a completed color analysis."""
    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(
                User.palette.isnot(None),
                User.season.isnot(None),
            )
        )
        users = result.scalars().all()
        return [u.to_dict() for u in users]


def _score_product(
    product: dict,
    palette_labs: list[tuple[float, float, float]],
) -> int:
    """Compute a 0-100 match score for a product against the user's palette."""
    product_hex = product.get("color_hex")
    if not product_hex or len(product_hex) < 4:
        return 50

    try:
        product_lab = hex_to_lab(product_hex)
    except Exception:
        return 50

    best_delta_e = min(
        delta_e_cie2000(product_lab, p_lab) for p_lab in palette_labs
    )
    match_score = max(0, int(100 - (best_delta_e / MAX_DELTA_E * 100)))
    return match_score


async def _get_top_products_for_user(user: dict) -> list[dict]:
    """Query products matching the user's season, score them, and return top 6."""
    season = user.get("season", "")
    palette = user.get("palette") or []

    if not season or not palette:
        return []

    palette_labs = []
    for hex_color in palette:
        try:
            palette_labs.append(hex_to_lab(hex_color))
        except Exception:
            continue

    if not palette_labs:
        return []

    async with async_session_factory() as session:
        candidates = await product_repo.get_by_season(
            session, season=season, limit=50
        )

    scored = []
    for product in candidates:
        score = _score_product(product, palette_labs)
        product["match_score"] = score
        scored.append(product)

    scored.sort(key=lambda p: p["match_score"], reverse=True)
    return scored[:TOP_PICKS]


def _build_product_card_html(product: dict) -> str:
    """Generate HTML for a single product card in the digest email."""
    name = escape(product.get("name", ""))
    brand = escape(product.get("brand", ""))
    price = escape(product.get("price", ""))
    image = product.get("image", "")
    url = product.get("url", "")
    score = product.get("match_score", 0)

    return f"""
    <div style="display:inline-block; width:240px; margin:8px; vertical-align:top;
                background:#18181b; border:1px solid #27272a; border-radius:12px;
                overflow:hidden; text-align:center;">
        <img src="{image}" alt="{name}"
             style="width:100%; height:200px; object-fit:cover;" />
        <div style="padding:12px;">
            <p style="margin:0 0 4px 0; color:#a1a1aa; font-size:12px;
                      text-transform:uppercase; letter-spacing:1px;">{brand}</p>
            <p style="margin:0 0 8px 0; color:#fff; font-size:14px;
                      font-weight:600;">{name}</p>
            <p style="margin:0 0 8px 0; color:#ef4444; font-size:16px;
                      font-weight:700;">{price}</p>
            <p style="margin:0 0 12px 0; color:#22c55e; font-size:13px;">
                {score}% match
            </p>
            <a href="{url}"
               style="display:inline-block; background:#ef4444; color:#fff !important;
                      text-decoration:none; padding:8px 20px; border-radius:9999px;
                      font-weight:600; font-size:13px;">
                Shop Now
            </a>
        </div>
    </div>"""


def _build_digest_html(user: dict, products: list[dict]) -> str:
    """Build the complete branded HTML email for the weekly digest."""
    name = escape(user.get("name", "there"))
    season = escape(user.get("season", ""))

    product_cards = "".join(
        _build_product_card_html(p) for p in products
    )

    return f"""<!DOCTYPE html>
<html>
<head>
<style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           margin: 0; padding: 0; background: #0a0a0a; color: #e5e5e5; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 40px 16px; }}
    .header {{ text-align: center; margin-bottom: 32px; }}
    .logo {{ font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #fff; }}
    .accent {{ color: #ef4444; }}
    .card {{ background: #18181b; border: 1px solid #27272a; border-radius: 16px;
             padding: 24px; margin-bottom: 24px; }}
    .footer {{ text-align: center; color: #71717a; font-size: 12px; margin-top: 32px; }}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">LUMI<span class="accent">QE</span></div>
    </div>
    <div class="card">
        <h2 style="color:#fff; margin:0 0 8px 0; text-align:center;">
            Your Weekly Color Picks
        </h2>
        <p style="color:#a1a1aa; text-align:center; margin:0 0 24px 0;">
            Hi {name}, here are this week's top products curated
            for your <strong style="color:#ef4444;">{season}</strong> palette.
        </p>
        <div style="text-align:center;">
            {product_cards}
        </div>
    </div>
    <div style="text-align:center; margin-top:24px;">
        <a href="{settings.FRONTEND_URL}/dashboard"
           style="display:inline-block; background:#ef4444; color:#fff !important;
                  text-decoration:none; padding:14px 32px; border-radius:9999px;
                  font-weight:700; font-size:15px;">
            View All Recommendations
        </a>
    </div>
    <div class="footer">
        <p>Lumiqe — Discover Your True Colors</p>
        <p><a href="https://lumiqe.in" style="color:#ef4444; text-decoration:none;">lumiqe.in</a></p>
    </div>
</div>
</body>
</html>"""


def _send_email(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success."""
    if not settings.RESEND_API_KEY:
        logger.debug(f"Digest email skipped (no API key): {to}")
        return False

    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"Digest email sent to {to}")
        return True
    except ImportError:
        logger.warning("resend package not installed — digest emails disabled")
        return False
    except Exception as exc:
        logger.warning(f"Digest email send failed for {to}: {exc}")
        return False


async def send_all_digests() -> dict:
    """
    Process all users with palettes and send weekly digest emails.

    Returns a summary dict with counts of sent, skipped, and failed emails.
    """
    users = await _get_users_with_palettes()
    logger.info(f"Weekly digest: processing {len(users)} users with palettes")

    sent = 0
    skipped = 0
    failed = 0

    for user in users:
        email = user.get("email")
        if not email:
            skipped += 1
            continue

        try:
            products = await _get_top_products_for_user(user)
            if not products:
                skipped += 1
                logger.debug(f"No matching products for user {user.get('id')}")
                continue

            html = _build_digest_html(user, products)
            season = user.get("season", "Your Season")
            subject = f"Your Weekly {season} Picks — Lumiqe"

            success = _send_email(email, subject, html)
            if success:
                sent += 1
            else:
                failed += 1

        except Exception as exc:
            logger.error(f"Digest failed for user {user.get('id')}: {exc}")
            failed += 1

    summary = {"sent": sent, "skipped": skipped, "failed": failed, "total": len(users)}
    logger.info(f"Weekly digest complete: {summary}")
    return summary
