"""
Lumiqe — Test Configuration and Fixtures.

Provides async test client, test database session, and helper functions.
"""

import os
import sys
import types
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock

# Set env vars before importing the app
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-must-be-32-chars-minimum"
os.environ["DEBUG"] = "false"
os.environ["CELERY_ALWAYS_EAGER"] = "true"

# Stub torch if it fails to load (e.g. DLL issues on Windows CI/dev)
# This must happen BEFORE any app import that transitively imports torch.
try:
    import torch  # noqa: F401
except (OSError, ImportError):
    _torch_stub = types.ModuleType("torch")
    _torch_stub.__version__ = "0.0.0-stub"
    _torch_stub.device = MagicMock()
    _torch_stub.load = MagicMock(return_value={})
    _torch_stub.no_grad = MagicMock(return_value=MagicMock(__enter__=MagicMock(), __exit__=MagicMock()))
    _torch_stub.nn = MagicMock()
    _torch_stub.Tensor = MagicMock()
    sys.modules["torch"] = _torch_stub
    sys.modules["torch.nn"] = MagicMock()
    sys.modules["torch.nn.functional"] = MagicMock()

# Permanently stub model download so tests don't need ML weights.
# This must happen before importing app.main, and must persist through
# the lifespan() call when the test client starts.
import download_models
download_models.ensure_models = lambda: None

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
