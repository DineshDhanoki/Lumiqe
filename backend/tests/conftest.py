"""
Lumiqe — Test Configuration and Fixtures.

Provides async test client, test database session, and helper functions.
"""

import os
from unittest.mock import patch
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Set JWT_SECRET_KEY before importing the app
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-must-be-32-chars-minimum"
os.environ["DEBUG"] = "false"

# Mock model download so tests don't need ML weights
with patch("download_models.ensure_models", return_value=None):
    from app.main import app

from app.core.security import create_access_token, create_refresh_token


@pytest_asyncio.fixture
async def client():
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def valid_token() -> str:
    """Generate a valid access token for testing."""
    return create_access_token({"sub": "test@example.com", "user_id": 1})


@pytest.fixture
def valid_refresh_token() -> str:
    """Generate a valid refresh token for testing."""
    return create_refresh_token({"sub": "test@example.com", "user_id": 1})


@pytest.fixture
def auth_headers(valid_token) -> dict:
    """Authorization headers with a valid Bearer token."""
    return {"Authorization": f"Bearer {valid_token}"}
