"""
Lumiqe — AI Stylist Chat Endpoint.

Conversational AI color & style advisor powered by Groq (Llama 3.3 70B).
Users can ask anything about their season, occasions, outfit combinations,
shopping guidance, and professional styling advice.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, computed_field

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.core.security import sanitize_llm_input

logger = logging.getLogger("lumiqe.api.color_chat")
router = APIRouter(prefix="/api", tags=["AI Stylist Chat"])

# ─── Lazy Groq Singleton ────────────────────────────────────
_groq_client = None


def _get_groq_client():
    """Return a lazily-initialized Groq client (singleton)."""
    global _groq_client
    if _groq_client is None and settings.GROQ_API_KEY:
        from groq import Groq
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client

STYLIST_SYSTEM_PROMPT = """You are Lumiqe's elite personal color stylist — the equivalent of a high-end professional \
color consultant combined with a celebrity wardrobe stylist.

Your client's color profile:
- Season: {season}
- Undertone: {undertone}
- Contrast Level: {contrast_level}
- Style Archetype: {style_archetype}
- Signature Color: {signature_color}
- Metal: {metal}

Your role:
1. Answer any question about their personal color analysis, outfit choices, shopping decisions, and styling.
2. Always reference their specific season and palette when giving advice.
3. Give concrete, specific recommendations — never generic fashion advice.
4. Reference real color names (e.g. "dusty rose", "burnt sienna") not hex codes.
5. Be warm, confident, and authoritative — like a luxury stylist who truly knows color science.
6. When suggesting colors, always tie them back to the user's specific season.
7. Keep answers focused and practical — 3-5 sentences max unless a detailed breakdown is needed.
8. Never recommend colors outside their seasonal palette without explaining the exception."""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

    @property
    def safe_content(self) -> str:
        """Truncate content to 500 characters for safety."""
        return self.content[:500] if self.content else ""


class ChatRequest(BaseModel):
    message: str
    season: str
    undertone: str = "neutral"
    contrast_level: str = "Medium"
    style_archetype: str = ""
    signature_color: str = ""
    metal: str = "Gold"
    history: list[ChatMessage] = []

    @property
    def safe_history(self) -> list[ChatMessage]:
        """Return at most 20 messages with validated roles."""
        return [
            msg for msg in self.history[-20:]
            if msg.role in ("user", "assistant")
        ]


@router.post("/color-chat")
async def color_chat(
    request: Request,
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Conversational AI color stylist powered by Groq.
    Maintains chat history for multi-turn conversation.
    Requires authentication.
    """
    rate_key = get_rate_limit_key(request, current_user, "chat")
    await check_rate_limit(rate_key, 60)

    # Sanitize user message
    try:
        user_message = sanitize_llm_input(body.message, max_length=500)
        season = sanitize_llm_input(body.season, max_length=50)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_INPUT", "detail": "Message contains disallowed content.", "code": 422},
        )

    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={"error": "SERVICE_UNAVAILABLE", "detail": "AI stylist is not configured.", "code": 503},
        )

    try:
        client = _get_groq_client()
        if not client:
            raise HTTPException(
                status_code=503,
                detail={"error": "SERVICE_UNAVAILABLE", "detail": "AI stylist is not configured.", "code": 503},
            )

        system_prompt = STYLIST_SYSTEM_PROMPT.format(
            season=season,
            undertone=body.undertone,
            contrast_level=body.contrast_level,
            style_archetype=body.style_archetype or "Natural",
            signature_color=body.signature_color or "your best palette color",
            metal=body.metal,
        )

        # Build message history (keep last 20 validated messages for context)
        messages = [{"role": "system", "content": system_prompt}]
        for msg in body.safe_history:
            messages.append({"role": msg.role, "content": msg.safe_content})
        messages.append({"role": "user", "content": user_message})

        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.75,
            max_completion_tokens=400,
        )

        reply = chat.choices[0].message.content.strip()
        logger.info(f"Color chat reply for {season} / {current_user['email']}")

        return {"reply": reply, "season": season}

    except Exception as exc:
        logger.error(f"Color chat error: {exc}")
        raise HTTPException(
            status_code=502,
            detail={"error": "CHAT_FAILED", "detail": "AI stylist unavailable. Please try again.", "code": 502},
        )
