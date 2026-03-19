"""Pydantic schemas for products and common responses."""

from pydantic import BaseModel


class ProductItem(BaseModel):
    """A curated product recommendation."""
    id: str
    name: str
    brand: str
    price: str
    image: str
    url: str
    match_score: int
    category: str


class PaletteCardRequest(BaseModel):
    """Request body for palette card generation."""
    season: str
    palette: list[str]
    hex_color: str
    undertone: str
    metal: str = ""
    confidence: float = 0.0


class ErrorResponse(BaseModel):
    """Structured error response per claude.md rule #6."""
    error: str
    detail: str
    code: int
