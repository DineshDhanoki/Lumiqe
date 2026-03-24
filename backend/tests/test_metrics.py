"""Tests for the in-memory metrics module."""

import app.core.metrics as metrics


def _reset_metrics():
    """Clear all counters and histograms for test isolation."""
    with metrics._lock:
        metrics._counters.clear()
        metrics._histograms.clear()


def test_increment_increases_counter():
    _reset_metrics()
    metrics.increment("test_counter")
    snapshot = metrics.get_all()
    assert snapshot["counters"]["test_counter"] == 1


def test_increment_with_amount_greater_than_one():
    _reset_metrics()
    metrics.increment("test_counter", amount=5)
    snapshot = metrics.get_all()
    assert snapshot["counters"]["test_counter"] == 5


def test_observe_adds_to_histogram():
    _reset_metrics()
    metrics.observe("request_duration", 0.42)
    metrics.observe("request_duration", 1.5)
    snapshot = metrics.get_all()
    assert snapshot["histograms"]["request_duration"] == [0.42, 1.5]


def test_get_all_returns_dict_with_counters_and_histograms():
    _reset_metrics()
    metrics.increment("c1")
    metrics.observe("h1", 0.1)
    snapshot = metrics.get_all()
    assert "counters" in snapshot
    assert "histograms" in snapshot
    assert isinstance(snapshot["counters"], dict)
    assert isinstance(snapshot["histograms"], dict)


def test_format_prometheus_returns_string_with_metric_names():
    _reset_metrics()
    metrics.increment("http_requests_total", 3)
    metrics.observe("pipeline_duration_seconds", 0.75)
    output = metrics.format_prometheus()
    assert isinstance(output, str)
    assert "http_requests_total" in output
    assert "pipeline_duration_seconds" in output
    assert "lumiqe_uptime_seconds" in output


def test_get_uptime_seconds_returns_positive_float():
    uptime = metrics.get_uptime_seconds()
    assert isinstance(uptime, float)
    assert uptime > 0
