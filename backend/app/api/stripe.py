"""API — Stripe payment endpoints for subscription management."""

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.repositories import user_repo

logger = logging.getLogger("lumiqe.api.stripe")
router = APIRouter(prefix="/api/stripe", tags=["Stripe"])

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# ─── Price Map (INR paise) ────────────────────────────────────
# Stripe uses smallest currency unit → 1 INR = 100 paise
PRICE_MAP = {
    "monthly": {"amount": 14900, "interval": "month", "interval_count": 1, "label": "Lumiqe Premium — Monthly"},
    "annual":  {"amount": 49900, "interval": "year",  "interval_count": 1, "label": "Lumiqe Premium — Annual"},
}


class CheckoutRequest(BaseModel):
    plan: str  # "monthly" or "annual"


class PortalRequest(BaseModel):
    pass  # No body needed, user is identified via JWT


# ─── Create Checkout Session ──────────────────────────────────

@router.post("/checkout")
async def create_checkout_session(
    body: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session and return the URL."""
    if current_user.get("is_premium"):
        raise HTTPException(status_code=400, detail="You are already a premium member!")

    price_config = PRICE_MAP.get(body.plan)
    if not price_config:
        raise HTTPException(status_code=400, detail="Invalid plan. Use 'monthly' or 'annual'.")

    try:
        # Get or create Stripe customer
        stripe_customer_id = current_user.get("stripe_customer_id")
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user["email"],
                name=current_user.get("name", ""),
                metadata={"lumiqe_user_id": str(current_user["id"])},
            )
            stripe_customer_id = customer.id
            await user_repo.set_stripe_customer_id(session, current_user["id"], stripe_customer_id)

        # Create the Stripe Price on-the-fly (or use pre-created ones)
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            mode="subscription",
            currency="inr",
            payment_method_types=["card"],
            line_items=[{
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
            }],
            success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            metadata={"lumiqe_user_id": str(current_user["id"])},
        )

        return {"checkout_url": checkout_session.url}

    except stripe.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Payment service unavailable. Please try again.")


# ─── Stripe Webhook ───────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhook events for subscription lifecycle."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if settings.STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        else:
            # Dev mode: parse without signature verification
            import json
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        # Payment successful — activate premium
        customer_id = data.get("customer")
        subscription_id = data.get("subscription")
        lumiqe_user_id = data.get("metadata", {}).get("lumiqe_user_id")

        if lumiqe_user_id and customer_id and subscription_id:
            await user_repo.upgrade_to_premium(
                session, int(lumiqe_user_id), customer_id, subscription_id
            )
            logger.info(f"User {lumiqe_user_id} activated premium via checkout")

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
        raise HTTPException(status_code=400, detail="No active subscription found.")

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/analyze",
        )
        return {"portal_url": portal_session.url}
    except stripe.StripeError as e:
        logger.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=500, detail="Unable to open subscription portal.")
