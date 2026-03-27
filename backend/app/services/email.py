"""
Lumiqe — Email Service (Resend).

Sends transactional emails. All functions are fire-and-forget:
if RESEND_API_KEY is not configured, emails are silently skipped.
"""

import logging
from html import escape

from app.core.config import settings

logger = logging.getLogger("lumiqe.email")

_resend = None


def _get_resend():
    """Lazy-load the Resend SDK."""
    global _resend
    if _resend is None and settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            _resend = resend
        except ImportError:
            logger.warning("resend package not installed — emails disabled")
    return _resend


def _send(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success."""
    sdk = _get_resend()
    if not sdk:
        logger.debug(f"Email skipped (no API key): {subject} → {to}")
        return False
    try:
        sdk.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"Email sent: {subject} → {to}")
        return True
    except Exception as exc:
        logger.warning(f"Email send failed: {exc}")
        return False


# ─── Email Templates ─────────────────────────────────────────

_BASE_STYLE = """
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0a0a0a; color: #e5e5e5; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #fff; }
    .accent { color: #ef4444; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; margin-bottom: 24px; }
    .btn { display: inline-block; background: #ef4444; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 15px; }
    .btn:hover { background: #dc2626; }
    .footer { text-align: center; color: #71717a; font-size: 12px; margin-top: 32px; }
    .swatch { display: inline-block; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #27272a; margin-right: 4px; vertical-align: middle; }
    h2 { color: #fff; margin: 0 0 12px 0; }
    p { line-height: 1.6; margin: 0 0 16px 0; }
</style>
"""

_FOOTER = """
<div class="footer">
    <p>Lumiqe — Discover Your True Colors</p>
    <p><a href="https://lumiqe.in" style="color: #ef4444; text-decoration: none;">lumiqe.in</a></p>
</div>
"""


def send_welcome_email(to: str, name: str) -> bool:
    """Send a welcome email after registration."""
    safe_name = escape(name)
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Welcome, {safe_name}! 🎨</h2>
            <p>You've just unlocked the most accurate AI-powered color analysis on the web.</p>
            <p>Here's what you can do right now:</p>
            <ul style="padding-left: 20px; margin-bottom: 24px;">
                <li style="margin-bottom: 8px;">Upload a selfie to discover your color season</li>
                <li style="margin-bottom: 8px;">Get your personalized palette of best colors</li>
                <li style="margin-bottom: 8px;">Shop products curated for your exact skin tone</li>
            </ul>
            <div style="text-align: center;">
                <a href="{settings.FRONTEND_URL}/analyze" class="btn">Start Your Analysis →</a>
            </div>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Welcome to Lumiqe — Let's Find Your Colors", html)


def send_analysis_complete_email(
    to: str,
    name: str,
    season: str,
    hex_color: str,
    palette: list[str],
    analysis_id: str | None = None,
) -> bool:
    """Send an email after a color analysis is complete."""
    palette_swatches = "".join(
        f'<span class="swatch" style="background:{c};"></span>' for c in palette[:6]
    )
    results_url = (
        f"{settings.FRONTEND_URL}/results/{analysis_id}"
        if analysis_id
        else f"{settings.FRONTEND_URL}/dashboard"
    )
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card" style="text-align: center;">
            <p style="color: #ef4444; font-weight: 700; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Your Analysis is Ready</p>
            <h2 style="font-size: 32px; margin-bottom: 16px;">{season}</h2>
            <div style="width: 64px; height: 64px; border-radius: 16px; background: {hex_color}; margin: 0 auto 16px; border: 2px solid #27272a;"></div>
            <p style="margin-bottom: 20px;">{palette_swatches}</p>
            <p>Your personalized palette is ready — see your full color profile, styling tips, and curated product recommendations.</p>
            <a href="{results_url}" class="btn">View Full Results →</a>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, f"Your Color Season: {season} — Lumiqe Results Ready", html)


def send_password_reset_email(to: str, name: str, reset_url: str) -> bool:
    """Send a password reset email with a one-time link."""
    safe_name = escape(name)
    safe_url = escape(reset_url)
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Reset Your Password</h2>
            <p>Hi {safe_name}, we received a request to reset your password. Click the button below to choose a new one.</p>
            <p style="color: #71717a; font-size: 13px;">This link expires in 30 minutes and can only be used once.</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="{safe_url}" class="btn">Reset Password</a>
            </div>
            <p style="color: #71717a; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Reset Your Lumiqe Password", html)


def send_email_verification(to: str, name: str, verify_url: str) -> bool:
    """Send an email verification link after registration."""
    safe_name = escape(name)
    safe_url = escape(verify_url)
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Verify Your Email</h2>
            <p>Hi {safe_name}, please confirm your email address to unlock all Lumiqe features.</p>
            <p style="color: #71717a; font-size: 13px;">This link expires in 30 minutes.</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="{safe_url}" class="btn">Verify Email</a>
            </div>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Verify Your Email — Lumiqe", html)


def send_seasonal_rescan_email(
    to: str,
    name: str,
    old_season: str,
    current_climate: str,
    rescan_url: str,
    palette: list[str],
    scan_month: str = "",
) -> bool:
    """Send a seasonal re-scan reminder email."""
    safe_name = escape(name)
    safe_season = escape(old_season)
    safe_climate = escape(current_climate)
    safe_url = escape(rescan_url)
    safe_month = escape(scan_month) if scan_month else "a previous month"

    palette_swatches = "".join(
        f'<span class="swatch" style="background:{c};"></span>'
        for c in palette[:6]
    )

    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Your skin tone may have changed this season</h2>
            <p>Hi {safe_name}, you were scanned as
            <strong style="color:#ef4444;">{safe_season}</strong> back in
            <strong>{safe_month}</strong>. As we move into
            <strong style="color:#ef4444;">{safe_climate}</strong>, your
            undertone may have shifted. Rescan to update your palette!</p>
            <p style="color:#71717a; font-size:13px; margin-bottom:20px;">
                Your current palette:
            </p>
            <p style="margin-bottom:24px;">{palette_swatches}</p>
            <div style="text-align: center;">
                <a href="{safe_url}" class="btn">Rescan Now &rarr;</a>
            </div>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Your skin tone may have changed this season", html)


def send_trial_reminder_email(
    to: str,
    name: str,
    season: str,
    upgrade_url: str,
) -> bool:
    """Send a reminder email when a user's trial ends within 24 hours."""
    safe_name = escape(name)
    safe_season = escape(season)
    safe_url = escape(upgrade_url)
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Your Trial Ends Tomorrow</h2>
            <p>Hi {safe_name}, your 3-day Lumiqe premium trial is ending soon.</p>
            <p>As a <strong>{safe_season}</strong>, here's what you'll lose access to:</p>
            <ul style="padding-left: 20px; margin-bottom: 24px;">
                <li style="margin-bottom: 8px;">Unlimited color analyses &amp; re-scans</li>
                <li style="margin-bottom: 8px;">AI-powered personal stylist chat</li>
                <li style="margin-bottom: 8px;">Full wardrobe tracker &amp; capsule planner</li>
                <li style="margin-bottom: 8px;">Premium curated shopping feed</li>
            </ul>
            <div style="text-align: center; margin-bottom: 16px;">
                <a href="{safe_url}" class="btn">Upgrade Now &#8212; just &#8377;149/month</a>
            </div>
            <p style="text-align: center; color: #71717a; font-size: 13px;">
                Or keep using the free plan with 3 scans included.
            </p>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Your Lumiqe trial ends tomorrow", html)


def send_payment_failed_email(to: str, name: str) -> bool:
    """Send an email when a subscription payment fails."""
    safe_name = escape(name)
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>Payment Failed</h2>
            <p>Hi {safe_name}, we were unable to process your latest subscription payment.</p>
            <p>Please update your payment method to keep your premium features active. Stripe will automatically retry in a few days.</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="{settings.FRONTEND_URL}/account" class="btn">Update Payment Method</a>
            </div>
            <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
                If you believe this is an error, please contact us at support@lumiqe.in.
            </p>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Action Required: Payment Failed — Lumiqe", html)


def send_subscription_confirmed_email(to: str, name: str, plan: str) -> bool:
    """Send an email when a premium subscription is confirmed."""
    safe_name = escape(name)
    safe_plan = escape(plan)
    html = f"""<!DOCTYPE html><html><head>{_BASE_STYLE}</head><body>
    <div class="container">
        <div class="header">
            <div class="logo">LUMI<span class="accent">QE</span></div>
        </div>
        <div class="card">
            <h2>You're Premium Now! ✨</h2>
            <p>Hi {safe_name}, your <strong>{safe_plan}</strong> subscription is active. Here's what's unlocked:</p>
            <ul style="padding-left: 20px; margin-bottom: 24px;">
                <li style="margin-bottom: 8px;">Unlimited color analyses</li>
                <li style="margin-bottom: 8px;">AI-powered personal stylist chat</li>
                <li style="margin-bottom: 8px;">Full capsule wardrobe recommendations</li>
                <li style="margin-bottom: 8px;">Premium shopping agent with curated outfits</li>
            </ul>
            <div style="text-align: center;">
                <a href="{settings.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>
            </div>
        </div>
        {_FOOTER}
    </div>
    </body></html>"""
    return _send(to, "Welcome to Lumiqe Premium", html)
