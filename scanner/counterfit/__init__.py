"""Counterfit integration subpackage.

This subpackage contains all Counterfit-specific integration code:

- Configuration (``counterfit_config``)
- Metrics (``counterfit_metrics``)
- Caching (``counterfit_cache``)
- Circuit breaker (``counterfit_circuit_breaker``)
- High-level integration (``counterfit_integration``)
"""

from .counterfit_config import CounterfitConfig  # noqa: F401
from .counterfit_integration import CounterfitIntegration, COUNTERFIT_AVAILABLE  # noqa: F401


