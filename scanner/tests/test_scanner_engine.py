"""Tests for the core scanner engine and modular external scanner wiring."""

from pathlib import Path

from scanner_engine import ScannerEngine


def test_scanner_engine_initializes_with_default_config():
    """ScannerEngine should load default config and probes without errors."""
    engine = ScannerEngine()

    # Basic sanity checks
    assert engine.probe_loader is not None
    assert isinstance(engine.config, dict)
    assert "probes" in engine.config

    # Should discover our built-in probes
    custom_probes = engine.probe_loader.list_probes()
    assert isinstance(custom_probes, list)
    assert len(custom_probes) > 0


def test_scanner_engine_respects_custom_config(tmp_path: Path):
    """ScannerEngine should load scanner config from a custom YAML path."""
    cfg = tmp_path / "scanner.yaml"
    cfg.write_text(
        """
scanner:
  probes:
    timeout: 99
    max_concurrent: 7
    retry_attempts: 1
  model:
    default_timeout: 42
    max_retries: 5
    rate_limit_per_minute: 10
"""
    )

    engine = ScannerEngine(config_path=cfg)
    assert engine.config["probes"]["timeout"] == 99
    assert engine.config["probes"]["max_concurrent"] == 7
    assert engine.config["model"]["default_timeout"] == 42


def test_scanner_engine_does_not_require_garak_installed(monkeypatch):
    """Engine should still initialize when Garak is missing or disabled."""
    # Force import-time flag for GARAK_AVAILABLE to False
    import scanner.garak as garak_pkg

    monkeypatch.setattr(garak_pkg, "GARAK_AVAILABLE", False, raising=False)

    engine = ScannerEngine()
    assert getattr(engine, "garak", None) is None
    assert isinstance(engine.external_scanners, dict)
    assert "garak" not in engine.external_scanners


