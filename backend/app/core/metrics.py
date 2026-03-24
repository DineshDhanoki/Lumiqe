"""
Lumiqe — In-Memory Metrics Storage.

Provides thread-safe counters and histograms for Prometheus-compatible
metrics export. No external dependencies required.
"""

import threading
import time

_lock = threading.Lock()
_counters: dict[str, int] = {}
_histograms: dict[str, list[float]] = {}

# Record app start time for uptime tracking
_start_time: float = time.monotonic()

# Histogram bucket boundaries (seconds) for CV pipeline duration
HISTOGRAM_BUCKETS: list[float] = [0.1, 0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 10.0]


def increment(name: str, amount: int = 1) -> None:
    """Increment a named counter by the given amount."""
    with _lock:
        _counters[name] = _counters.get(name, 0) + amount


def observe(name: str, value: float) -> None:
    """Record an observation for a named histogram."""
    with _lock:
        if name not in _histograms:
            _histograms[name] = []
        _histograms[name].append(value)


def get_all() -> dict:
    """Return a snapshot of all counters and histograms."""
    with _lock:
        return {
            "counters": dict(_counters),
            "histograms": {k: list(v) for k, v in _histograms.items()},
        }


def get_uptime_seconds() -> float:
    """Return seconds since the metrics module was loaded (app startup)."""
    return time.monotonic() - _start_time


def format_prometheus() -> str:
    """Format all metrics as Prometheus text exposition format."""
    lines: list[str] = []

    with _lock:
        counters_snapshot = dict(_counters)
        histograms_snapshot = {
            k: list(v) for k, v in _histograms.items()
        }

    # Emit counters
    for name, value in sorted(counters_snapshot.items()):
        lines.append(f"# HELP {name} Counter metric")
        lines.append(f"# TYPE {name} counter")
        lines.append(f"{name} {value}")

    # Emit histograms with bucket aggregation
    for name, observations in sorted(histograms_snapshot.items()):
        lines.append(f"# HELP {name} Histogram metric")
        lines.append(f"# TYPE {name} histogram")

        total = len(observations)
        total_sum = sum(observations)

        for bucket_bound in HISTOGRAM_BUCKETS:
            count_le = sum(1 for v in observations if v <= bucket_bound)
            lines.append(f'{name}_bucket{{le="{bucket_bound}"}} {count_le}')
        lines.append(f'{name}_bucket{{le="+Inf"}} {total}')
        lines.append(f"{name}_sum {total_sum:.6f}")
        lines.append(f"{name}_count {total}")

    # Emit uptime gauge
    uptime = get_uptime_seconds()
    lines.append("# HELP lumiqe_uptime_seconds Seconds since app start")
    lines.append("# TYPE lumiqe_uptime_seconds gauge")
    lines.append(f"lumiqe_uptime_seconds {uptime:.1f}")

    return "\n".join(lines) + "\n"
