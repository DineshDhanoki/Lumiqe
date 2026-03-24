"""
Lumiqe — Router Registry.

Centralizes all API router imports and registration into a single
function, grouped by domain for clarity and maintainability.
"""

import logging

from fastapi import FastAPI

logger = logging.getLogger("lumiqe.routers")


def register_all_routers(app: FastAPI) -> None:
    """
    Import and register all API routers grouped by domain.

    Domains:
        Core (9): health, auth, analyze, analysis, products, scan,
                  palette_card, profile, complete_profile
        Features (14): color_chat, shopping_agent, outfit, styling_tips,
                       share, makeup, wardrobe, wishlist, saved_outfits,
                       community, virtual_tryon, skin_profiles, before_after,
                       stories
        Monetization (4): stripe, referral, gift, price_alerts
        Growth (5): creators, seasonal, affiliate_tracking, password_reset, events
        B2B (1): b2b_api
        Admin (3): admin, admin_dashboard, analytics_dashboard
    """

    # ─── Core (9) ────────────────────────────────────────────
    from app.api.health import router as health_router
    from app.api.auth import router as auth_router
    from app.api.analyze import router as analyze_router
    from app.api.analysis import router as analysis_router
    from app.api.products import router as products_router
    from app.api.scan import router as scan_router
    from app.api.palette_card import router as palette_card_router
    from app.api.profile import router as profile_router
    from app.api.complete_profile import router as complete_profile_router

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(analyze_router)
    app.include_router(analysis_router)
    app.include_router(products_router)
    app.include_router(scan_router)
    app.include_router(palette_card_router)
    app.include_router(profile_router)
    app.include_router(complete_profile_router)

    logger.info("Registered 9 core routers")

    # ─── Features (14) ───────────────────────────────────────
    from app.api.color_chat import router as color_chat_router
    from app.api.shopping_agent import router as shopping_agent_router
    from app.api.outfit import router as outfit_router
    from app.api.styling_tips import router as styling_tips_router
    from app.api.share import router as share_router
    from app.api.makeup import router as makeup_router

    app.include_router(color_chat_router)
    app.include_router(shopping_agent_router)
    app.include_router(outfit_router)
    app.include_router(styling_tips_router)
    app.include_router(share_router)
    app.include_router(makeup_router)

    _register_optional(app, "app.api.daily_outfit", "daily_outfit")
    _register_optional(app, "app.api.wardrobe", "wardrobe")
    _register_optional(app, "app.api.wishlist", "wishlist")
    _register_optional(app, "app.api.saved_outfits", "saved_outfits")
    _register_optional(app, "app.api.community", "community")
    _register_optional(app, "app.api.community_moderation", "community_moderation")
    _register_optional(app, "app.api.virtual_tryon", "virtual_tryon")
    _register_optional(app, "app.api.skin_profiles", "skin_profiles")
    _register_optional(app, "app.api.before_after", "before_after")
    _register_optional(app, "app.api.stories", "stories")
    _register_optional(app, "app.api.notifications", "notifications")

    logger.info("Registered feature routers")

    # ─── Monetization (4) ────────────────────────────────────
    from app.api.stripe import router as stripe_router
    from app.api.referral import router as referral_router

    app.include_router(stripe_router)
    app.include_router(referral_router)

    _register_optional(app, "app.api.gift", "gift")
    _register_optional(app, "app.api.price_alerts", "price_alerts")

    logger.info("Registered monetization routers")

    # ─── Celebrity Match (1) ─────────────────────────────────
    from app.api.celebrity import router as celebrity_router
    app.include_router(celebrity_router)

    logger.info("Registered celebrity match router")

    # ─── Growth (5) ──────────────────────────────────────────
    _register_optional(app, "app.api.creators", "creators")
    _register_optional(app, "app.api.seasonal", "seasonal")
    _register_optional(app, "app.api.affiliate_tracking", "affiliate_tracking")
    _register_optional(app, "app.api.password_reset", "password_reset")

    from app.api.events import router as events_router
    app.include_router(events_router)

    logger.info("Registered growth routers")

    # ─── B2B (1) ─────────────────────────────────────────────
    _register_optional(app, "app.api.b2b_api", "b2b_api")

    logger.info("Registered B2B routers")

    # ─── Admin (4) ───────────────────────────────────────────
    from app.api.admin import router as admin_router
    from app.api.metrics import router as metrics_router

    app.include_router(admin_router)
    app.include_router(metrics_router)

    _register_optional(app, "app.api.admin_dashboard", "admin_dashboard")
    _register_optional(app, "app.api.analytics_dashboard", "analytics_dashboard")

    logger.info("Registered admin routers (including metrics)")
    logger.info("All routers registered successfully")


def _register_optional(app: FastAPI, module_path: str, name: str) -> None:
    """
    Attempt to import and register an optional router module.

    Modules that haven't been created yet are silently skipped,
    allowing incremental development without breaking the app.
    """
    try:
        import importlib
        module = importlib.import_module(module_path)
        router = getattr(module, "router", None)
        if router is not None:
            app.include_router(router)
            logger.debug(f"Registered optional router: {name}")
        else:
            logger.debug(f"Module {name} has no 'router' attribute — skipped")
    except ImportError:
        logger.debug(f"Optional router module not found: {name} — skipped")
    except Exception as exc:
        logger.warning(f"Failed to register optional router {name}: {exc}")
