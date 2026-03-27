"""
Lumiqe — Performance & Reliability Tests (Phase 3 TDD).

Tests CV pipeline concurrency, async email handling, and metrics endpoint.
"""

import os
import inspect
import pytest


# ─── Task 3.5: CV pipeline worker pool must scale with CPU ───


class TestCVPipelineWorkers:
    """Thread pool must not be hardcoded to 4 workers."""

    def test_worker_count_not_hardcoded_to_4(self):
        """Worker count must scale with CPU, not be hardcoded."""
        from app.api.analyze import _cv_executor
        max_workers = _cv_executor._max_workers
        # Should be >= os.cpu_count() or at least > 4 on modern machines
        # The key assertion: it must NOT be exactly 4 (the old hardcoded value)
        # unless the machine genuinely has <= 4 CPUs
        cpu_count = os.cpu_count() or 1
        expected_min = min(cpu_count, 8)
        assert max_workers == expected_min, (
            f"CV executor has {max_workers} workers but expected "
            f"min(cpu_count={cpu_count}, 8)={expected_min}"
        )

    def test_executor_has_named_threads(self):
        """Thread pool must use named threads for debugging."""
        from app.api.analyze import _cv_executor
        assert _cv_executor._thread_name_prefix == "cv-pipeline"


# ─── Task 3.6: Email sends must not block the async event loop ─


class TestAsyncEmailSends:
    """Email functions in analysis flow must be non-blocking."""

    def test_analyze_email_uses_background_task_or_thread(self):
        """The analysis endpoint must not call email functions synchronously.

        Check that send_analysis_complete_email is called via
        asyncio.to_thread, BackgroundTasks, run_in_executor, or similar.
        """
        from app.api import analyze as analyze_module
        source = inspect.getsource(analyze_module)

        # Skip the import line — find the actual function CALL
        # The import looks like: "from app.services.email import send_analysis_complete_email"
        # The call looks like: "...run_in_executor(None, send_analysis_complete_email, ..."
        import_pos = source.find("import send_analysis_complete_email")
        call_pos = source.find("send_analysis_complete_email", (import_pos + 50) if import_pos != -1 else 0)
        assert call_pos != -1, "send_analysis_complete_email call not found in analyze module"

        # Check the line containing the call for async wrappers
        context_start = max(0, call_pos - 200)
        context = source[context_start:call_pos + 50]

        is_async = any(pattern in context for pattern in [
            "run_in_executor",
            "to_thread",
            "add_task",
            "BackgroundTasks",
            "background_tasks",
        ])
        assert is_async, (
            "send_analysis_complete_email appears to be called synchronously. "
            "Wrap it in asyncio.to_thread() or use FastAPI BackgroundTasks."
        )


# ─── Task 3.2: Sentry config file must exist ─────────────────


class TestSentryConfig:
    """Sentry must be configured for production error tracking."""

    def test_sentry_client_config_exists(self):
        """sentry.client.config.ts must exist in frontend root."""
        frontend_dir = os.path.join(
            os.path.dirname(__file__), "..", "..", "frontend"
        )
        config_path = os.path.join(frontend_dir, "sentry.client.config.ts")
        assert os.path.exists(config_path), (
            "frontend/sentry.client.config.ts not found. "
            "Sentry is not configured for client-side error tracking."
        )
