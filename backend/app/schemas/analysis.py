"""Pydantic schemas for the color analysis pipeline."""

from pydantic import BaseModel, Field


class CelebrityMatch(BaseModel):
    """A celebrity who shares the same color season."""
    name: str
    image: str


class MakeupPalette(BaseModel):
    """Recommended makeup colors."""
    lips: str = ""
    blush: str = ""
    eyeshadow: str = ""


class AnalyzeResponse(BaseModel):
    """Full analysis result from the CV pipeline."""
    season: str
    description: str
    ita_angle: float
    undertone: str
    hex_color: str
    palette: list[str]
    confidence: float
    contrast_level: str = ""
    avoid_colors: list[str] = Field(default_factory=list)
    metal: str = ""
    celebrities: list[CelebrityMatch] = Field(default_factory=list)
    makeup: MakeupPalette = Field(default_factory=MakeupPalette)
    tips: str = ""
    skin_pixels: int = 0
    processing_time_ms: float = 0.0


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    version: str
    database: str
