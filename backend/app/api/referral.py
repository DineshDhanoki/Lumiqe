"""API — Referral system endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import get_current_user, get_db
from app.repositories import user_repo

logger = logging.getLogger("lumiqe.api.referral")
router = APIRouter(prefix="/api/referral", tags=["Referral"])


class ReferralCodeResponse(BaseModel):
    referral_code: str
    referral_url: str
    referral_count: int


class ApplyReferralRequest(BaseModel):
    code: str


@router.get("/code", response_model=ReferralCodeResponse)
async def get_or_create_referral_code(
    current_user: dict = Depends(get_current_user),
    session=Depends(get_db),
):
    """Get the current user's referral code, generating one if needed."""
    code = current_user.get("referral_code")
    if not code:
        code = await user_repo.generate_referral_code(session, current_user["id"])
        await session.commit()

    return ReferralCodeResponse(
        referral_code=code,
        referral_url=f"https://lumiqe.in/?ref={code}",
        referral_count=current_user.get("referral_count", 0),
    )


@router.post("/apply")
async def apply_referral_code(
    body: ApplyReferralRequest,
    current_user: dict = Depends(get_current_user),
    session=Depends(get_db),
):
    """Apply a referral code — awards both users +1 free scan."""
    if current_user.get("referred_by"):
        raise HTTPException(
            status_code=400,
            detail={"error": "ALREADY_REFERRED", "detail": "You have already used a referral code.", "code": 400},
        )

    referrer = await user_repo.get_by_referral_code(session, body.code.upper())
    if not referrer:
        raise HTTPException(
            status_code=404,
            detail={"error": "INVALID_CODE", "detail": "Referral code not found.", "code": 404},
        )

    if referrer["id"] == current_user["id"]:
        raise HTTPException(
            status_code=400,
            detail={"error": "SELF_REFERRAL", "detail": "You cannot use your own referral code.", "code": 400},
        )

    await user_repo.apply_referral(session, current_user["id"], referrer["id"])
    await session.commit()

    return {"message": "Referral applied! You both earned +1 free scan.", "bonus_scans": 1}
