"""Background job to check price drops for user alerts."""

import logging

from sqlalchemy import select

from app.core.dependencies import async_session_factory, db_available
from app.models import PriceAlert, Product

logger = logging.getLogger("lumiqe.services.price_checker")


async def check_price_alerts() -> int:
    """Check all active price alerts for drops.

    For each alert:
    1. Look up the matching Product in DB by product_id
    2. Compare current price_cents with original_price_cents
    3. If drop >= target_drop_percent, mark as triggered
    4. Log the triggered alert

    Returns count of triggered alerts.
    """
    if not db_available:
        logger.warning("Database unavailable, skipping price alert check")
        return 0

    triggered_count = 0

    async with async_session_factory() as session:
        try:
            # Fetch all non-triggered alerts
            alerts_result = await session.execute(
                select(PriceAlert).where(PriceAlert.is_triggered.is_(False))
            )
            alerts = alerts_result.scalars().all()

            if not alerts:
                logger.info("No active price alerts to check")
                return 0

            logger.info("Checking %d active price alerts", len(alerts))

            # Collect unique product IDs to batch-fetch products
            product_ids = list({a.product_id for a in alerts})
            products_result = await session.execute(
                select(Product).where(Product.id.in_(product_ids))
            )
            products_by_id: dict[str, Product] = {
                p.id: p for p in products_result.scalars().all()
            }

            for alert in alerts:
                product = products_by_id.get(alert.product_id)
                if product is None or product.price_cents is None:
                    continue

                current_price = product.price_cents
                original_price = alert.original_price_cents

                if original_price <= 0:
                    continue

                drop_percent = ((original_price - current_price) / original_price) * 100

                if drop_percent >= alert.target_drop_percent:
                    alert.is_triggered = True
                    triggered_count += 1
                    logger.info(
                        "Price alert triggered: alert_id=%d product=%s "
                        "original=%d current=%d drop=%.1f%% target=%d%%",
                        alert.id,
                        alert.product_name,
                        original_price,
                        current_price,
                        drop_percent,
                        alert.target_drop_percent,
                    )

                    # Notify the user about the price drop
                    from app.api.notifications import create_notification

                    await create_notification(
                        user_id=alert.user_id,
                        title="Price Drop Alert",
                        message=(
                            f"{alert.product_name} dropped {drop_percent:.0f}%! "
                            f"Now available at a lower price."
                        ),
                        notification_type="price_alert",
                    )

            await session.commit()
            logger.info(
                "Price alert check complete: %d/%d alerts triggered",
                triggered_count,
                len(alerts),
            )

        except Exception as exc:
            await session.rollback()
            logger.error("Price alert check failed: %s", exc, exc_info=True)

    return triggered_count
