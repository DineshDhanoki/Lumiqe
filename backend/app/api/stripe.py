"""API — Stripe payment endpoints for subscription management."""

import asyncio
import hashlib
import logging
import time

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.repositories import user_repo
from app.services.email import send_subscription_confirmed_email

logger = logging.getLogger("lumiqe.api.stripe")
router = APIRouter(prefix="/api/stripe", tags=["Stripe"])

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# ─── Price Map (INR paise) ────────────────────────────────────
# Stripe uses smallest currency unit → 1 INR = 100 paise
# When STRIPE_*_PRICE_ID env vars are set, we use pre-created Prices (recommended).
# Otherwise falls back to inline price_data.
PRICE_MAP = {
    "monthly": {"amount": 14900, "interval": "month", "interval_count": 1, "label": "Wardrobe Tracker + Daily Outfits + AI Stylist + Unlimited Scans"},
    "annual":  {"amount": 99900, "interval": "year",  "interval_count": 1, "label": "Lumiqe Premium — Annual (44% off)"},
}

PLAN_TO_PRICE_ID = {
    "monthly": settings.STRIPE_MONTHLY_PRICE_ID,
    "annual": settings.STRIPE_ANNUAL_PRICE_ID,
}


class CheckoutRequest(BaseModel):
    plan: str  # "monthly" or "annual"


class CreditPurchaseRequest(BaseModel):
    pack: str = "single"  # "single" = 1 credit for ₹49


class PortalRequest(BaseModel):
    pass  # No body needed, user is identified via JWT


# ─── Credit Pack Prices (one-time payments) ──────────────────
CREDIT_PACKS = {
    "single": {"amount": 4900, "credits": 1, "label": "Single Analysis — 1 credit"},
    "scan": {"amount": 2900, "credits": 1, "label": "Quick Scan — 1 credit"},
    "analysis": {"amount": 9900, "credits": 3, "label": "Analysis Pack — 3 credits"},
    "analysis_report": {"amount": 19900, "credits": 5, "label": "Analysis Report — 5 credits"},
    "bundle_5": {"amount": 39900, "credits": 10, "label": "Bundle — 10 credits"},
}


# ─── Create Checkout Session ──────────────────────────────────

@router.post("/checkout")
async def create_checkout_session(
    body: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session and return the URL."""
    if current_user.get("is_premium"):
        raise HTTPException(status_code=400, detail={"error": "ALREADY_PREMIUM", "detail": "You are already a premium member", "code": 400})

    price_config = PRICE_MAP.get(body.plan)
    if not price_config:
        raise HTTPException(status_code=400, detail={"error": "INVALID_PLAN", "detail": "Invalid plan. Use 'monthly' or 'annual'.", "code": 400})

    try:
        # Get or create Stripe customer — external API call first
        stripe_customer_id = current_user.get("stripe_customer_id")
        newly_created_customer_id: str | None = None
        if not stripe_customer_id:
            customer = await asyncio.to_thread(
                stripe.Customer.create,
                email=current_user["email"],
                name=current_user.get("name", ""),
                metadata={"lumiqe_user_id": str(current_user["id"])},
                idempotency_key=f"cust:{current_user['id']}",
            )
            stripe_customer_id = customer.id
            newly_created_customer_id = stripe_customer_id

        # Prefer pre-created Stripe Price IDs; fall back to inline price_data
        price_id = PLAN_TO_PRICE_ID.get(body.plan)
        if price_id:
            line_items = [{"price": price_id, "quantity": 1}]
        else:
            line_items = [{
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": price_config["label"],
                        "description": "Unlimited scans, AI Stylist, all product vibes & more",
                    },
                    "unit_amount": price_config["amount"],
                    "recurring": {
                        "interval": price_config["interval"],
                        "interval_count": price_config["interval_count"],
                    },
                },
                "quantity": 1,
            }]

        # Idempotency key: same user + plan within a 60s window = same session
        window = int(time.time()) // 60
        idem_key = hashlib.sha256(f"checkout:{current_user['id']}:{body.plan}:{window}".encode()).hexdigest()

        checkout_session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            customer=stripe_customer_id,
            mode="subscription",
            currency="inr",
            payment_method_types=["card"],
            line_items=line_items,
            success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            metadata={"lumiqe_user_id": str(current_user["id"])},
            idempotency_key=idem_key,
        )

        # Persist stripe_customer_id only after all Stripe calls succeed,
        # so a DB write failure doesn't leave us with a Stripe customer we
        # can't find next time (the idempotency key makes re-creation safe).
        if newly_created_customer_id:
            await user_repo.set_stripe_customer_id(session, current_user["id"], newly_created_customer_id)

        return {"checkout_url": checkout_session.url}

    except stripe.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail={"error": "PAYMENT_SERVICE_ERROR", "detail": "Payment service unavailable. Please try again.", "code": 500})


# ─── Buy Credits (One-Time Payment) ──────────────────────────

@router.post("/buy-credits")
async def buy_credits(
    body: CreditPurchaseRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a one-time Stripe Checkout Session for credit purchase."""
    pack = CREDIT_PACKS.get(body.pack)
    if not pack:
        raise HTTPException(status_code=400, detail={"error": "INVALID_PACK", "detail": "Invalid credit pack.", "code": 400})

    try:
        stripe_customer_id = current_user.get("stripe_customer_id")
        newly_created_customer_id: str | None = None
        if not stripe_customer_id:
            customer = await asyncio.to_thread(
                stripe.Customer.create,
                email=current_user["email"],
                name=current_user.get("name", ""),
                metadata={"lumiqe_user_id": str(current_user["id"])},
                idempotency_key=f"cust:{current_user['id']}",
            )
            stripe_customer_id = customer.id
            newly_created_customer_id = stripe_customer_id

        # Idempotency key: same user + pack within a 60s window = same session
        window = int(time.time()) // 60
        idem_key = hashlib.sha256(f"credits:{current_user['id']}:{body.pack}:{window}".encode()).hexdigest()

        checkout_session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            customer=stripe_customer_id,
            mode="payment",
            currency="inr",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": pack["label"]},
                    "unit_amount": pack["amount"],
                },
                "quantity": 1,
            }],
            success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            metadata={
                "lumiqe_user_id": str(current_user["id"]),
                "type": "credit_purchase",
                "credits": str(pack["credits"]),
            },
            idempotency_key=idem_key,
        )

        # Persist stripe_customer_id only after all Stripe calls succeed
        if newly_created_customer_id:
            await user_repo.set_stripe_customer_id(session, current_user["id"], newly_created_customer_id)

        return {"checkout_url": checkout_session.url}

    except stripe.StripeError as e:
        logger.error(f"Stripe credit purchase error: {e}")
        raise HTTPException(status_code=500, detail={"error": "PAYMENT_SERVICE_ERROR", "detail": "Payment service unavailable.", "code": 500})


# ─── Stripe Webhook ───────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhook events for subscription lifecycle."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if settings.STRIPE_WEBHOOK_SECRET is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "WEBHOOK_NOT_CONFIGURED", "detail": "Webhook secret not configured", "code": 500},
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "INVALID_PAYLOAD", "detail": "Invalid webhook payload", "code": 400})
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail={"error": "INVALID_SIGNATURE", "detail": "Invalid webhook signature", "code": 400})

    # ── Webhook idempotency: deduplicate by event ID ─────────────
    event_id = event.get("id", "")
    if event_id:
        try:
            from app.core.rate_limiter import _redis_client, _redis_available
            if _redis_available and _redis_client:
                already_processed = await _redis_client.set(
                    f"lumiqe:webhook:seen:{event_id}", "1", nx=True, ex=86400
                )
                if not already_processed:
                    logger.info(f"Duplicate webhook event skipped: {event_id}")
                    return {"status": "ok", "duplicate": True}
        except Exception as exc:
            logger.warning(f"Webhook dedup Redis check failed, trying DB fallback: {exc}")
            # DB fallback for idempotency
            from app.models import Event
            existing = await session.execute(
                select(Event).where(
                    Event.event_name == "stripe_webhook",
                    Event.properties["event_id"].astext == event_id,
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"Duplicate webhook (DB check): {event_id}")
                return {"status": "ok", "duplicate": True}

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        metadata = data.get("metadata", {})
        lumiqe_user_id = metadata.get("lumiqe_user_id")
        checkout_type = metadata.get("type", "subscription")

        if checkout_type == "credit_purchase" and lumiqe_user_id:
            # One-time credit purchase — validate metadata before casting
            try:
                credits_to_add = int(metadata.get("credits", "1"))
                user_id_int = int(lumiqe_user_id)
            except (ValueError, TypeError):
                logger.error(f"Invalid credit metadata: credits={metadata.get('credits')}, user_id={lumiqe_user_id}")
                return {"status": "ok", "detail": "Invalid metadata"}
            # Guard against misconfigured Stripe products sending bad credit amounts
            if credits_to_add <= 0 or credits_to_add > 100:
                logger.error(f"Credit amount out of bounds: {credits_to_add} for user {lumiqe_user_id}")
                return {"status": "ok", "detail": "Credit amount out of bounds"}
            # Verify user exists before granting credits
            user = await user_repo.get_by_id(session, user_id_int)
            if not user:
                logger.error(f"User {user_id_int} not found — skipping credit grant")
                return {"status": "ok", "detail": "User not found"}
            await user_repo.add_credits(session, user_id_int, credits_to_add)
            logger.info(f"User {lumiqe_user_id} purchased {credits_to_add} credits")
        elif lumiqe_user_id:
            # Subscription purchase — activate premium
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")
            if customer_id and subscription_id:
                await user_repo.upgrade_to_premium(
                    session, int(lumiqe_user_id), customer_id, subscription_id
                )
                logger.info(f"User {lumiqe_user_id} activated premium via checkout")
                user = await user_repo.get_by_id(session, int(lumiqe_user_id))
                if user:
                    plan_name = metadata.get("plan", "Premium")
                    send_subscription_confirmed_email(user["email"], user["name"], plan_name)

    elif event_type in (
        "customer.subscription.deleted",
        "customer.subscription.updated",
    ):
        customer_id = data.get("customer")
        status = data.get("status")

        if status in ("canceled", "unpaid", "past_due"):
            await user_repo.downgrade_from_premium(session, customer_id)
            logger.info(f"Customer {customer_id} subscription {status}")
        elif status == "active":
            # Reactivation
            lumiqe_user_id = data.get("metadata", {}).get("lumiqe_user_id")
            subscription_id = data.get("id")
            if lumiqe_user_id:
                await user_repo.upgrade_to_premium(
                    session, int(lumiqe_user_id), customer_id, subscription_id
                )

    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        logger.warning(f"Payment failed for customer {customer_id}")

        # Notify the user via email so they can update their payment method
        if customer_id:
            user = await user_repo.get_by_stripe_customer_id(session, customer_id)
            if user:
                from app.services.email import send_payment_failed_email
                send_payment_failed_email(user["email"], user.get("name", ""))

    # Record processed webhook for DB-level idempotency
    if event_id:
        from app.models import Event
        webhook_event = Event(
            event_name="stripe_webhook",
            properties={"event_id": event_id, "type": event_type},
        )
        session.add(webhook_event)

    # Commit explicitly before responding to Stripe.
    # The get_db() auto-commit runs after the response is sent, so without
    # this line Stripe receives 200 OK before the transaction is durable.
    # A failed commit here returns a 500 → Stripe will retry the event.
    await session.commit()

    return {"status": "ok"}


# ─── Customer Portal ──────────────────────────────────────────

@router.post("/portal")
async def create_portal_session(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session for subscription management."""
    stripe_customer_id = current_user.get("stripe_customer_id")
    if not stripe_customer_id:
        raise HTTPException(status_code=400, detail={"error": "NO_SUBSCRIPTION", "detail": "No active subscription found.", "code": 400})

    try:
        portal_session = await asyncio.to_thread(
            stripe.billing_portal.Session.create,
            customer=stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/analyze",
        )
        return {"portal_url": portal_session.url}
    except stripe.StripeError as e:
        logger.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=500, detail={"error": "PORTAL_ERROR", "detail": "Unable to open subscription portal.", "code": 500})
