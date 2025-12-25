"""Metrics and monitoring for LLMTopTen integration"""

from collections import defaultdict, deque
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class LLMTopTenMetrics:
    """Metrics collection for LLMTopTen probe execution"""

    def __init__(self):
        """Initialize metrics collector"""
        self.probe_executions = deque(maxlen=1000)  # Keep last 1000 executions
        self.probe_stats = defaultdict(
            lambda: {
                "total": 0,
                "success": 0,
                "failed": 0,
                "timeout": 0,
                "vulnerabilities_found": 0,
                "total_time": 0.0,
                "min_time": float("inf"),
                "max_time": 0.0,
            }
        )
        self.error_counts = defaultdict(int)
        self.vulnerability_counts = defaultdict(int)  # Track vulnerabilities by type
        self.last_reset = datetime.utcnow()

    def record_execution(
        self,
        probe_name: str,
        status: str,
        execution_time: float,
        error: Optional[str] = None,
        vulnerabilities_found: int = 0,
        vulnerability_types: Optional[List[str]] = None,
    ) -> None:
        """
        Record a probe execution

        Args:
            probe_name: Name of the probe
            status: Execution status (completed, failed, timeout)
            execution_time: Execution time in seconds
            error: Optional error message
            vulnerabilities_found: Number of vulnerabilities found
            vulnerability_types: List of vulnerability types found
        """
        timestamp = datetime.utcnow()

        # Record execution
        self.probe_executions.append(
            {
                "probe_name": probe_name,
                "status": status,
                "execution_time": execution_time,
                "timestamp": timestamp,
                "error": error,
                "vulnerabilities_found": vulnerabilities_found,
            }
        )

        # Update stats
        stats = self.probe_stats[probe_name]
        stats["total"] += 1
        stats["total_time"] += execution_time
        stats["min_time"] = min(stats["min_time"], execution_time)
        stats["max_time"] = max(stats["max_time"], execution_time)
        stats["vulnerabilities_found"] += vulnerabilities_found

        if status == "completed":
            stats["success"] += 1
        elif status == "timeout":
            stats["timeout"] += 1
        else:
            stats["failed"] += 1

        if error:
            self.error_counts[error] += 1

        # Track vulnerability types
        if vulnerability_types:
            for vuln_type in vulnerability_types:
                self.vulnerability_counts[vuln_type] += 1

    def get_probe_stats(self, probe_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get statistics for a probe or all probes

        Args:
            probe_name: Optional probe name filter

        Returns:
            Statistics dictionary
        """
        if probe_name:
            stats = self.probe_stats.get(probe_name, {})
            if stats and stats.get("total", 0) > 0:
                return {
                    **stats,
                    "avg_time": stats["total_time"] / stats["total"],
                    "success_rate": stats["success"] / stats["total"],
                    "min_time": stats["min_time"]
                    if stats["min_time"] != float("inf")
                    else 0,
                    "avg_vulnerabilities": stats["vulnerabilities_found"] / stats["total"],
                }
            return stats

        # Return all stats
        all_stats: Dict[str, Any] = {}
        for name, stats in self.probe_stats.items():
            if stats["total"] > 0:
                all_stats[name] = {
                    **stats,
                    "avg_time": stats["total_time"] / stats["total"],
                    "success_rate": stats["success"] / stats["total"],
                    "min_time": stats["min_time"]
                    if stats["min_time"] != float("inf")
                    else 0,
                    "avg_vulnerabilities": stats["vulnerabilities_found"] / stats["total"],
                }
        return all_stats

    def get_recent_executions(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent probe executions"""
        return list(self.probe_executions)[-limit:]

    def get_error_summary(self) -> Dict[str, int]:
        """Get error summary"""
        return dict(self.error_counts)

    def get_vulnerability_summary(self) -> Dict[str, int]:
        """Get vulnerability summary by type"""
        return dict(self.vulnerability_counts)

    def get_health_metrics(self) -> Dict[str, Any]:
        """Get health metrics for monitoring"""
        recent_executions = list(self.probe_executions)
        if not recent_executions:
            return {
                "status": "unknown",
                "total_executions": 0,
                "success_rate": 0.0,
                "total_vulnerabilities": 0,
            }

        # Calculate success rate from recent executions
        recent = recent_executions[-100:]  # Last 100
        success_count = sum(1 for e in recent if e["status"] == "completed")
        success_rate = success_count / len(recent) if recent else 0.0

        # Calculate total vulnerabilities found
        total_vulns = sum(e.get("vulnerabilities_found", 0) for e in recent)

        # Determine health status
        if success_rate >= 0.95:
            status = "healthy"
        elif success_rate >= 0.80:
            status = "degraded"
        else:
            status = "unhealthy"

        return {
            "status": status,
            "total_executions": len(self.probe_executions),
            "success_rate": success_rate,
            "recent_success_rate": success_rate,
            "total_probes": len(self.probe_stats),
            "total_vulnerabilities": sum(
                e.get("vulnerabilities_found", 0) for e in self.probe_executions
            ),
            "recent_vulnerabilities": total_vulns,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def reset(self) -> None:
        """Reset all metrics"""
        self.probe_executions.clear()
        self.probe_stats.clear()
        self.error_counts.clear()
        self.vulnerability_counts.clear()
        self.last_reset = datetime.utcnow()
        logger.info("LLMTopTen metrics reset")


