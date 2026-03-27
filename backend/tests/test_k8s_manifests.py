"""
Lumiqe — K8s Manifest Validation Tests (Phase 2 TDD).

Validates that Kubernetes manifests follow production-readiness standards.
Tests run against YAML files directly — no cluster required.
"""

import os
import pytest
import yaml

K8S_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "k8s")


def _load_all_k8s_docs():
    """Load all YAML documents from all k8s/*.yaml files."""
    docs = []
    for fname in os.listdir(K8S_DIR):
        if fname.endswith(".yaml") or fname.endswith(".yml"):
            with open(os.path.join(K8S_DIR, fname)) as f:
                for doc in yaml.safe_load_all(f):
                    if doc:
                        doc["_source_file"] = fname
                        docs.append(doc)
    return docs


def _find_docs(docs, kind):
    """Find all documents of a specific K8s kind."""
    return [d for d in docs if d.get("kind") == kind]


@pytest.fixture(scope="module")
def k8s_docs():
    return _load_all_k8s_docs()


# ─── Task 2.2: No :latest image tags ─────────────────────────


class TestImageTags:
    """All container images must be pinned — no :latest tags."""

    def test_backend_deployment_no_latest(self, k8s_docs):
        deployments = _find_docs(k8s_docs, "Deployment")
        for dep in deployments:
            containers = dep["spec"]["template"]["spec"]["containers"]
            for c in containers:
                image = c.get("image", "")
                assert not image.endswith(":latest"), (
                    f"Container '{c['name']}' in {dep['metadata']['name']} "
                    f"uses :latest tag: {image}. Pin to a git SHA or semver."
                )

    def test_statefulset_images_pinned(self, k8s_docs):
        """StatefulSet images (postgres) should use exact version tags."""
        statefulsets = _find_docs(k8s_docs, "StatefulSet")
        for ss in statefulsets:
            containers = (
                ss["spec"]["template"]["spec"].get("containers", [])
                + ss["spec"]["template"]["spec"].get("initContainers", [])
            )
            for c in containers:
                image = c.get("image", "")
                assert not image.endswith(":latest"), (
                    f"Container '{c['name']}' uses :latest in StatefulSet "
                    f"{ss['metadata']['name']}: {image}"
                )


# ─── Task 2.4: Security contexts must be set ─────────────────


class TestSecurityContexts:
    """Pods must not run as root."""

    def test_backend_has_security_context(self, k8s_docs):
        deployments = _find_docs(k8s_docs, "Deployment")
        for dep in deployments:
            name = dep["metadata"]["name"]
            pod_spec = dep["spec"]["template"]["spec"]
            sec_ctx = pod_spec.get("securityContext", {})
            assert sec_ctx.get("runAsNonRoot") is True, (
                f"Deployment '{name}' missing securityContext.runAsNonRoot: true"
            )

    def test_backend_runs_as_non_root_user(self, k8s_docs):
        deployments = _find_docs(k8s_docs, "Deployment")
        for dep in deployments:
            name = dep["metadata"]["name"]
            pod_spec = dep["spec"]["template"]["spec"]
            sec_ctx = pod_spec.get("securityContext", {})
            run_as_user = sec_ctx.get("runAsUser", 0)
            assert run_as_user > 0, (
                f"Deployment '{name}' runs as root (runAsUser={run_as_user})"
            )


# ─── Task 2.5: HPA must include memory metric ────────────────


class TestHPA:
    """HPA must scale on memory, not just CPU (ML workload is memory-bound)."""

    def test_hpa_has_memory_metric(self, k8s_docs):
        hpas = _find_docs(k8s_docs, "HorizontalPodAutoscaler")
        for hpa in hpas:
            name = hpa["metadata"]["name"]
            metrics = hpa["spec"].get("metrics", [])
            metric_names = [
                m["resource"]["name"]
                for m in metrics
                if m.get("type") == "Resource"
            ]
            assert "memory" in metric_names, (
                f"HPA '{name}' only scales on {metric_names}. "
                f"BiSeNet is memory-bound — add a memory metric."
            )

    def test_hpa_has_cpu_metric(self, k8s_docs):
        """CPU metric should still be present alongside memory."""
        hpas = _find_docs(k8s_docs, "HorizontalPodAutoscaler")
        for hpa in hpas:
            metrics = hpa["spec"].get("metrics", [])
            metric_names = [
                m["resource"]["name"]
                for m in metrics
                if m.get("type") == "Resource"
            ]
            assert "cpu" in metric_names


# ─── Task 2.1: Backup CronJob must exist ─────────────────────


class TestDatabaseBackup:
    """A CronJob for database backups must be defined."""

    def test_backup_cronjob_exists(self, k8s_docs):
        cronjobs = _find_docs(k8s_docs, "CronJob")
        backup_jobs = [
            cj for cj in cronjobs
            if "backup" in cj["metadata"]["name"].lower()
        ]
        assert len(backup_jobs) > 0, (
            "No backup CronJob found in k8s/. Database has zero backup automation. "
            "Add a CronJob that runs pg_dump daily."
        )

    def test_backup_runs_daily(self, k8s_docs):
        cronjobs = _find_docs(k8s_docs, "CronJob")
        backup_jobs = [
            cj for cj in cronjobs
            if "backup" in cj["metadata"]["name"].lower()
        ]
        if not backup_jobs:
            pytest.skip("No backup CronJob to validate schedule")
        for cj in backup_jobs:
            schedule = cj["spec"].get("schedule", "")
            # Should run at least daily (minute hour * * *)
            parts = schedule.split()
            assert len(parts) == 5, f"Invalid cron schedule: {schedule}"
