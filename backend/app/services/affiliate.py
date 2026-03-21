"""
Lumiqe — Affiliate Link Service.

Appends affiliate tracking parameters to product URLs based on the domain.
If no affiliate tag is configured for a domain, returns the original URL
with a ?ref=lumiqe UTM parameter.
"""

import logging
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from app.core.config import settings

logger = logging.getLogger("lumiqe.affiliate")

# Domain → affiliate parameter builder (returns dict of query params to add)
_AFFILIATE_RULES: dict[str, callable] = {}


def _amazon_params() -> dict:
    tag = settings.AFFILIATE_AMAZON_TAG
    if not tag:
        return {}
    return {"tag": tag, "linkCode": "ll1"}


def _cuelinks_params() -> dict:
    pid = settings.AFFILIATE_CUELINKS_PID
    if not pid:
        return {}
    return {"subid": pid, "u": "lumiqe"}


def _admitad_params() -> dict:
    uid = settings.AFFILIATE_ADMITAD_UID
    if not uid:
        return {}
    return {"admitad_uid": uid}


# Map domain patterns to param builders
_DOMAIN_MAP = {
    "amazon.in": _amazon_params,
    "amazon.com": _amazon_params,
    "amzn.to": _amazon_params,
    "myntra.com": _cuelinks_params,
    "ajio.com": _cuelinks_params,
    "bewakoof.com": _admitad_params,
    "snitch.co.in": _admitad_params,
}


def affiliatize_url(url: str) -> str:
    """
    Append affiliate tracking parameters to a product URL.

    Returns the original URL with affiliate params if a match is found,
    or with ?ref=lumiqe&utm_source=lumiqe as a fallback.
    """
    if not url:
        return url

    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().removeprefix("www.")

        # Find matching affiliate rule
        extra_params = {}
        for pattern, builder in _DOMAIN_MAP.items():
            if domain.endswith(pattern):
                extra_params = builder()
                break

        # Always add UTM source
        extra_params["utm_source"] = "lumiqe"
        extra_params["ref"] = "lumiqe"

        # Merge with existing query params
        existing = parse_qs(parsed.query, keep_blank_values=True)
        for key, value in extra_params.items():
            existing[key] = [value]

        new_query = urlencode(existing, doseq=True)
        return urlunparse(parsed._replace(query=new_query))

    except Exception:
        logger.debug(f"Could not affiliatize URL: {url}")
        return url


def affiliatize_products(products: list[dict]) -> list[dict]:
    """Apply affiliate link transformation to a list of product dicts."""
    for product in products:
        if product.get("url"):
            product["url"] = affiliatize_url(product["url"])
        if product.get("purchase_link"):
            product["purchase_link"] = affiliatize_url(product["purchase_link"])
        if product.get("product_url"):
            product["product_url"] = affiliatize_url(product["product_url"])
    return products
