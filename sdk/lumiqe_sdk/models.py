"""Data models for Lumiqe API responses."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AnalysisResult:
    """Structured result of a Lumiqe color analysis.

    Attributes:
        season: The detected seasonal color type (e.g. "Deep Autumn").
        hex_color: Dominant skin-tone hex code (e.g. "#C8956C").
        undertone: Skin undertone classification ("warm", "cool", "neutral").
        confidence: Model confidence score between 0.0 and 1.0.
        palette: List of recommended hex colors.
        avoid_colors: List of hex colors the user should avoid.
        metal: Recommended jewelry metal ("gold", "silver", "rose gold").
        contrast_level: Overall contrast level ("low", "medium", "high").
    """

    season: str
    hex_color: str
    undertone: str
    confidence: float
    palette: list[str] = field(default_factory=list)
    avoid_colors: list[str] = field(default_factory=list)
    metal: str = ""
    contrast_level: str = ""

    @classmethod
    def from_dict(cls, data: dict) -> "AnalysisResult":
        """Create an AnalysisResult from a raw API response dictionary.

        Handles both flat and nested response shapes gracefully.
        """
        return cls(
            season=data.get("season", ""),
            hex_color=data.get("hex_color", ""),
            undertone=data.get("undertone", ""),
            confidence=float(data.get("confidence", 0.0)),
            palette=list(data.get("palette", [])),
            avoid_colors=list(data.get("avoid_colors", [])),
            metal=data.get("metal", ""),
            contrast_level=data.get("contrast_level", ""),
        )

    @property
    def is_warm(self) -> bool:
        """True if the analysis indicates a warm undertone or warm season."""
        warm_keywords = {"warm", "spring", "autumn"}
        combined = f"{self.undertone} {self.season}".lower()
        return any(kw in combined for kw in warm_keywords)

    @property
    def is_cool(self) -> bool:
        """True if the analysis indicates a cool undertone or cool season."""
        cool_keywords = {"cool", "summer", "winter"}
        combined = f"{self.undertone} {self.season}".lower()
        return any(kw in combined for kw in cool_keywords)

    @property
    def is_high_confidence(self) -> bool:
        """True if the model confidence is >= 0.7."""
        return self.confidence >= 0.7


@dataclass
class UsageInfo:
    """API usage information for the authenticated B2B account.

    Attributes:
        total_calls: Lifetime total API calls made.
        calls_this_month: API calls made in the current billing month.
        rate_limit: Maximum calls allowed per month on the current plan.
    """

    total_calls: int
    calls_this_month: int
    rate_limit: int

    @classmethod
    def from_dict(cls, data: dict) -> "UsageInfo":
        """Create a UsageInfo from a raw API response dictionary."""
        return cls(
            total_calls=int(data.get("total_calls", 0)),
            calls_this_month=int(data.get("calls_this_month", 0)),
            rate_limit=int(data.get("rate_limit", 0)),
        )
