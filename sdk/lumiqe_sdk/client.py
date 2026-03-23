"""Zero-dependency Python client for the Lumiqe Color Analysis API."""

from __future__ import annotations

import json
import mimetypes
import os
import uuid
from json import JSONDecodeError
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .models import AnalysisResult, UsageInfo


class LumiqeAPIError(Exception):
    """Raised when the Lumiqe API returns a non-2xx response."""

    def __init__(self, status_code: int, error: str, detail: str) -> None:
        self.status_code = status_code
        self.error = error
        self.detail = detail
        super().__init__(f"[{status_code}] {error}: {detail}")


class LumiqeClient:
    """Synchronous client for the Lumiqe Color Analysis API.

    Uses only Python stdlib (urllib) — no third-party dependencies required.

    Args:
        api_key: Your Lumiqe B2B API key (required, non-empty string).
        base_url: API base URL. Defaults to ``https://api.lumiqe.in``.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.lumiqe.in",
    ) -> None:
        if not isinstance(api_key, str) or not api_key.strip():
            raise ValueError("api_key must be a non-empty string")
        self._api_key = api_key.strip()
        self._base_url = base_url.rstrip("/")

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def analyze(self, image_path: str) -> AnalysisResult:
        """Analyze a local image file and return color-analysis results.

        Args:
            image_path: Path to an image file on disk (JPEG, PNG, WebP).

        Returns:
            An ``AnalysisResult`` dataclass populated from the API response.

        Raises:
            OSError: If the file cannot be read.
            LumiqeAPIError: If the API returns a non-2xx status.
        """
        abs_path = os.path.abspath(image_path)
        with open(abs_path, "rb") as fh:
            image_bytes = fh.read()
        filename = os.path.basename(abs_path)
        return self._post_multipart(
            "/api/b2b/analyze",
            image_bytes=image_bytes,
            filename=filename,
        )

    def analyze_bytes(self, image_bytes: bytes) -> AnalysisResult:
        """Analyze raw image bytes and return color-analysis results.

        Args:
            image_bytes: Raw bytes of an image (JPEG, PNG, WebP).

        Returns:
            An ``AnalysisResult`` dataclass populated from the API response.

        Raises:
            LumiqeAPIError: If the API returns a non-2xx status.
        """
        if not isinstance(image_bytes, bytes) or len(image_bytes) == 0:
            raise ValueError("image_bytes must be a non-empty bytes object")
        return self._post_multipart(
            "/api/b2b/analyze",
            image_bytes=image_bytes,
            filename="image.jpg",
        )

    def get_usage(self) -> UsageInfo:
        """Retrieve current API usage information.

        Returns:
            A ``UsageInfo`` dataclass with call counts and rate-limit info.

        Raises:
            LumiqeAPIError: If the API returns a non-2xx status.
        """
        data = self._request("GET", "/api/b2b/usage")
        return UsageInfo.from_dict(data)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}"}

    def _request(self, method: str, path: str) -> dict:
        """Send a simple JSON request and return the parsed response body."""
        url = f"{self._base_url}{path}"
        headers = {
            **self._auth_headers(),
            "Accept": "application/json",
        }
        req = Request(url, method=method, headers=headers)
        return self._send(req)

    def _post_multipart(
        self,
        path: str,
        image_bytes: bytes,
        filename: str,
    ) -> AnalysisResult:
        """Build a multipart/form-data request and return an AnalysisResult."""
        url = f"{self._base_url}{path}"
        boundary = uuid.uuid4().hex

        content_type = (
            mimetypes.guess_type(filename)[0] or "application/octet-stream"
        )

        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n"
            f"\r\n"
        ).encode("utf-8")
        body += image_bytes
        body += f"\r\n--{boundary}--\r\n".encode("utf-8")

        headers = {
            **self._auth_headers(),
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        }
        req = Request(url, data=body, headers=headers, method="POST")
        data = self._send(req)
        return AnalysisResult.from_dict(data)

    def _send(self, req: Request) -> dict:
        """Execute a urllib Request and return the JSON-decoded body."""
        try:
            with urlopen(req, timeout=30) as resp:
                raw = resp.read()
        except HTTPError as exc:
            self._handle_http_error(exc)
        except URLError as exc:
            raise ConnectionError(
                f"Unable to reach the Lumiqe API: {exc.reason}"
            ) from exc

        try:
            return json.loads(raw)
        except JSONDecodeError as exc:
            raise ValueError(
                "Lumiqe API returned non-JSON response"
            ) from exc

    @staticmethod
    def _handle_http_error(exc: HTTPError) -> None:
        """Parse an HTTPError into a structured LumiqeAPIError."""
        try:
            body = json.loads(exc.read())
            error = body.get("error", "Unknown error")
            detail = body.get("detail", "")
        except (JSONDecodeError, OSError):
            error = "Unknown error"
            detail = str(exc)
        raise LumiqeAPIError(exc.code, error, detail) from exc
