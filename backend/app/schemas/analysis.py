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
    analysis_id: str | None = None
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


class AnalysisHistoryItem(BaseModel):
    """Summary of a past analysis for history lists."""
    id: str
    season: str
    hex_color: str
    undertone: str
    confidence: float
    contrast_level: str = ""
    palette: list[str] = Field(default_factory=list)
    metal: str = ""
    created_at: str | None = None


class AnalysisDetailResponse(BaseModel):
    """Full persisted analysis result."""
    id: str
    share_token: str = ""
    user_id: int
    season: str
    hex_color: str
    undertone: str
    confidence: float
    contrast_level: str = ""
    palette: list[str] = Field(default_factory=list)
    avoid_colors: list[str] = Field(default_factory=list)
    metal: str = ""
    full_result: dict = Field(default_factory=dict)
    created_at: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    version: str
    database: str
