"""Metrics and monitoring for Counterfit integration."""

from collections import defaultdict, deque
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class CounterfitMetrics:
    """Metrics collection for Counterfit probe execution."""

    def __init__(self):
        self.probe_executions = deque(maxlen=1000)
        self.probe_stats = defaultdict(
            lambda: {
                "total": 0,
                "success": 0,
                "failed": 0,
                "timeout": 0,
                "total_time": 0.0,
                "min_time": float("inf"),
                "max_time": 0.0,
            }
        )
        self.error_counts = defaultdict(int)
        self.last_reset = datetime.utcnow()

    def record_execution(
        self,
        probe_name: str,
        status: str,
        execution_time: float,
        error: Optional[str] = None,
    ) -> None:
        timestamp = datetime.utcnow()
        self.probe_executions.append(
            {
                "probe_name": probe_name,
                "status": status,
                "execution_time": execution_time,
                "timestamp": timestamp,
                "error": error,
            }
        )

        stats = self.probe_stats[probe_name]
        stats["total"] += 1
        stats["total_time"] += execution_time
        stats["min_time"] = min(stats["min_time"], execution_time)
        stats["max_time"] = max(stats["max_time"], execution_time)

        if status == "completed":
            stats["success"] += 1
        elif status == "timeout":
            stats["timeout"] += 1
        else:
            stats["failed"] += 1

        if error:
            self.error_counts[error] += 1

    def get_probe_stats(self, probe_name: Optional[str] = None) -> Dict[str, Any]:
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
                }
            return stats

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
                }
        return all_stats

    def get_recent_executions(self, limit: int = 100) -> List[Dict[str, Any]]:
        return list(self.probe_executions)[-limit:]

    def get_error_summary(self) -> Dict[str, int]:
        return dict(self.error_counts)

    def get_health_metrics(self) -> Dict[str, Any]:
        recent_executions = list(self.probe_executions)
        if not recent_executions:
            return {
                "status": "unknown",
                "total_executions": 0,
                "success_rate": 0.0,
            }

        recent = recent_executions[-100:]
        success_count = sum(1 for e in recent if e["status"] == "completed")
        success_rate = success_count / len(recent) if recent else 0.0

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
            "timestamp": datetime.utcnow().isoformat(),
        }

    def reset(self) -> None:
        self.probe_executions.clear()
        self.probe_stats.clear()
        self.error_counts.clear()
        self.last_reset = datetime.utcnow()
        logger.info("Counterfit metrics reset")


