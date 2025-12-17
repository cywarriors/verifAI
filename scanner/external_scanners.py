"""Abstractions for pluggable external LLM security scanners (e.g. Garak)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class ExternalScanner(ABC):
    """Abstract base class for external LLM security scanners.

    Concrete implementations (e.g. Garak) should implement this interface so
    that the core scanner engine can orchestrate them in a uniform way.
    """

    #: Human-readable name / identifier for the scanner implementation
    name: str = "external"

    @abstractmethod
    def list_probes(self, category: Optional[str] = None) -> List[str]:
        """List available probe names, optionally filtered by category/tag."""

    @abstractmethod
    def get_probe_info(self, probe_name: str) -> Optional[Dict[str, Any]]:
        """Return metadata for a specific probe, or None if not found."""

    @abstractmethod
    async def run_probe(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict[str, Any],
        timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Execute a single probe against a model."""

    @abstractmethod
    async def run_multiple_probes(
        self,
        probe_names: List[str],
        model_name: str,
        model_type: str,
        model_config: Dict[str, Any],
        max_concurrent: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Execute multiple probes, ideally with internal concurrency control."""

    @abstractmethod
    def get_health(self) -> Dict[str, Any]:
        """Return a health summary suitable for monitoring."""

    @abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        """Return implementation-specific metrics."""


