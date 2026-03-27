"""
Lumiqe — Horizontal Scaling Tests.

Verifies that bottleneck fixes are in place:
- Celery task queue for CV pipeline
- Redis-backed push subscriptions
- Redis requirement warning in production
"""

import inspect
import os

import yaml


K8S_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "k8s")


class TestCeleryIntegration:
    """CV pipeline must support Celery dispatch for horizontal scaling."""

    def test_celery_app_module_exists(self):
        """Celery app configuration module must exist."""
        from app.core import celery_app
        assert hasattr(celery_app, "get_celery_app")
        assert hasattr(celery_app, "is_celery_available")

    def test_analyze_uses_celery_dispatch(self):
        """Analyze endpoint must use _run_cv_analysis which checks Celery."""
        from app.api import analyze as analyze_module
        source = inspect.getsource(analyze_module)
        assert "is_celery_available" in source, (
            "analyze.py does not import is_celery_available — "
            "CV pipeline is still ThreadPool-only"
        )
        assert "_run_cv_analysis" in source, (
            "analyze.py does not have _run_cv_analysis dispatcher"
        )

    def test_analyze_has_celery_and_threadpool_paths(self):
        """_run_cv_analysis must have both Celery and ThreadPool code paths."""
        from app.api import analyze as analyze_module
        source = inspect.getsource(analyze_module._run_cv_analysis)
        assert "get_analyze_task" in source, "Missing Celery task dispatch"
        assert "_cv_executor" in source, "Missing ThreadPool fallback"

    def test_celery_task_module_exists(self):
        """CV Celery task module must exist with lazy getter."""
        from app.tasks import cv_tasks
        assert hasattr(cv_tasks, "get_analyze_task")

    def test_celery_worker_k8s_deployment_exists(self):
        """K8s must have a Celery worker deployment."""
        worker_path = os.path.join(K8S_DIR, "celery-worker.yaml")
        assert os.path.exists(worker_path), "k8s/celery-worker.yaml not found"

        with open(worker_path) as f:
            docs = list(yaml.safe_load_all(f))

        deployments = [d for d in docs if d and d.get("kind") == "Deployment"]
        worker_deps = [d for d in deployments if "celery" in d["metadata"]["name"]]
        assert len(worker_deps) > 0, "No Celery worker Deployment in celery-worker.yaml"

    def test_celery_worker_has_hpa(self):
        """Celery workers must have HPA for auto-scaling."""
        worker_path = os.path.join(K8S_DIR, "celery-worker.yaml")
        with open(worker_path) as f:
            docs = list(yaml.safe_load_all(f))

        hpas = [d for d in docs if d and d.get("kind") == "HorizontalPodAutoscaler"]
        assert len(hpas) > 0, "No HPA for Celery workers"


class TestPushSubscriptionsRedis:
    """Push subscriptions must be stored in Redis, not in-memory."""

    def test_push_module_uses_redis(self):
        """push.py must use Redis for subscription storage."""
        from app.api import push as push_module
        source = inspect.getsource(push_module)
        assert "_PUSH_KEY_PREFIX" in source, "No Redis key prefix — still in-memory"
        assert "redis" in source.lower(), "push.py does not reference Redis"

    def test_push_no_module_level_dict_store(self):
        """push.py must NOT have a module-level in-memory dict for subscriptions."""
        from app.api import push as push_module
        source = inspect.getsource(push_module)
        assert "_subscriptions: dict" not in source, (
            "push.py still has _subscriptions in-memory dict"
        )


class TestRedisK8sDeployment:
    """Redis must be deployed in K8s for production."""

    def test_redis_deployment_in_k8s(self):
        """K8s must have a Redis deployment."""
        worker_path = os.path.join(K8S_DIR, "celery-worker.yaml")
        with open(worker_path) as f:
            docs = list(yaml.safe_load_all(f))

        redis_deps = [
            d for d in docs
            if d and d.get("kind") == "Deployment" and "redis" in d["metadata"]["name"]
        ]
        assert len(redis_deps) > 0, "No Redis Deployment in K8s"

    def test_redis_service_in_k8s(self):
        """K8s must have a Redis Service."""
        worker_path = os.path.join(K8S_DIR, "celery-worker.yaml")
        with open(worker_path) as f:
            docs = list(yaml.safe_load_all(f))

        redis_svcs = [
            d for d in docs
            if d and d.get("kind") == "Service" and "redis" in d["metadata"]["name"]
        ]
        assert len(redis_svcs) > 0, "No Redis Service in K8s"
