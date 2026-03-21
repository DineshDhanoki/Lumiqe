"""
Lumiqe — LLM-Powered Styling Tips Endpoint.

Uses Groq (Llama 3.3 70B) to generate personalized fashion advice
based on the user's color analysis results. Requires authentication.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.rate_limiter import check_rate_limit, get_rate_limit_key
from app.core.security import sanitize_llm_input

logger = logging.getLogger("lumiqe.styling_tips")
router = APIRouter(prefix="/api", tags=["Styling Tips"])

# ─── System Prompt ──────────────────────────────────────────
SYSTEM_PROMPT = """You are an elite, modern fashion stylist targeting Gen-Z and Millennials. \
Your client's color season is {season} with a {contrast_level} contrast level. \
Their primary skin/feature hex code is {hex_code}.

Write a punchy, 2-to-3 sentence styling tip.
- Rule 1: Tell them exactly 2 specific, vivid colors that will make them look incredible \
(use aesthetic names like 'midnight navy' or 'emerald green', not just 'blue' or 'green').
- Rule 2: Tell them 1 specific color or shade they must absolutely avoid.
- Rule 3: Keep the tone confident, premium, and direct. Do not use hashtags or emojis."""


@router.get("/generate-styling-tip")
async def generate_styling_tip(
    request: Request,
    season: str = Query(..., description="User's color season, e.g. 'Deep Winter'"),
    contrast_level: str = Query("Medium", description="Contrast level, e.g. 'High'"),
    hex_code: str = Query("#000000", description="Primary skin/feature hex code"),
    current_user: dict = Depends(get_current_user),
):
    """Generate a personalized styling tip using Groq / Llama 3.3. Requires authentication."""

    # Rate limiting: 30/hour
    rate_key = get_rate_limit_key(request, current_user, "styling")
    await check_rate_limit(rate_key, 30)

    # Sanitize inputs to prevent prompt injection
    try:
        season = sanitize_llm_input(season, max_length=50)
        contrast_level = sanitize_llm_input(contrast_level, max_length=30)
        hex_code = sanitize_llm_input(hex_code, max_length=10)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_INPUT", "detail": "Input contains disallowed characters or patterns.", "code": 422},
        )

    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={"error": "SERVICE_UNAVAILABLE", "detail": "Styling service is not configured.", "code": 503},
        )

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)

        prompt = SYSTEM_PROMPT.format(
            season=season,
            contrast_level=contrast_level,
            hex_code=hex_code,
        )

        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Generate my styling tip for {season} season."},
            ],
            temperature=0.8,
            max_completion_tokens=200,
        )

        tip = chat.choices[0].message.content.strip()

        logger.info(f"Generated styling tip for {season} / {contrast_level}")
        return {"tip": tip}

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise HTTPException(
            status_code=502,
            detail={"error": "STYLING_TIP_FAILED", "detail": "Failed to generate styling tip. Please try again.", "code": 502},
        )
