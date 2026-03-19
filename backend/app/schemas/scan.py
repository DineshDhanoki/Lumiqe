"""Pydantic schemas for the Buy or Pass scanner."""

from pydantic import BaseModel


class ScanSuggestion(BaseModel):
    """A suggested palette color alternative."""
    hex: str
    name: str
    delta_e: float


class ScanItemResponse(BaseModel):
    """Response from the Buy or Pass clothing scanner."""
    item_hex: str
    item_name: str
    match_score: int
    verdict: str  # "BUY", "MAYBE", or "PASS"
    best_palette_match: str
    suggestions: list[ScanSuggestion]
