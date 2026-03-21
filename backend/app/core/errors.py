"""Lumiqe — Structured API error helpers."""

from fastapi import HTTPException


def api_error(code: int, error: str, detail: str) -> HTTPException:
    """Raise a structured API error matching the Lumiqe JSON contract.

    Every error response follows: {"error": str, "detail": str, "code": int}
    """
    return HTTPException(
        status_code=code,
        detail={"error": error, "detail": detail, "code": code},
    )
