"""Tests for GarakConfig and GarakMetrics behavior (does not require garak)."""

from pathlib import Path

from garak.garak_config import GarakConfig
from garak.garak_metrics import GarakMetrics


def test_garak_config_defaults_and_env_override(tmp_path: Path, monkeypatch):
    """GarakConfig should load defaults and allow env overrides."""
    cfg_path = tmp_path / "cfg.yaml"
    cfg_path.write_text(
        """
garak:
  enabled: false
  timeout: 10
  cache_enabled: false
"""
    )

    # No env override
    cfg = GarakConfig(config_path=cfg_path)
    assert cfg.enabled is False
    assert cfg.timeout == 10
    assert cfg.cache_enabled is False

    # With env overrides
    monkeypatch.setenv("GARAK_ENABLED", "true")
    monkeypatch.setenv("GARAK_TIMEOUT", "20")
    monkeypatch.setenv("GARAK_CACHE_ENABLED", "true")

    cfg2 = GarakConfig(config_path=cfg_path)
    assert cfg2.enabled is True
    assert cfg2.timeout == 20
    assert cfg2.cache_enabled is True


def test_garak_metrics_records_and_reports_health():
    """GarakMetrics should record executions and derive health metrics."""
    metrics = GarakMetrics()

    # Initially unknown / zero
    health = metrics.get_health_metrics()
    assert health["status"] == "unknown"
    assert health["total_executions"] == 0

    # Record a few successes and a failure
    metrics.record_execution("probe_a", "completed", execution_time=0.5)
    metrics.record_execution("probe_a", "completed", execution_time=0.7)
    metrics.record_execution(
        "probe_a", "failed", execution_time=0.2, error="some_error"
    )

    health2 = metrics.get_health_metrics()
    assert health2["total_executions"] == 3
    assert health2["total_probes"] >= 1
    # Success rate should be between 0 and 1
    assert 0.0 <= health2["success_rate"] <= 1.0


