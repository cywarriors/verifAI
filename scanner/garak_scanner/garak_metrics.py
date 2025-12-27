"""Garak Scanner Metrics Collection"""

from typing import Dict, List, Any
from datetime import datetime
import statistics


class GarakMetrics:
    """Metrics collection for Garak probe execution"""
    
    def __init__(self):
        """Initialize metrics"""
        self.probe_executions: List[Dict[str, Any]] = []
        self.probe_times: Dict[str, List[float]] = {}
        self.probe_success_count: Dict[str, int] = {}
        self.probe_failure_count: Dict[str, int] = {}
        self.errors: List[Dict[str, Any]] = []
    
    def record_probe_execution(
        self,
        probe_name: str,
        execution_time: float,
        success: bool,
        error: str = None
    ) -> None:
        """Record probe execution"""
        execution = {
            "probe": probe_name,
            "time": execution_time,
            "success": success,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.probe_executions.append(execution)
        
        # Track times
        if probe_name not in self.probe_times:
            self.probe_times[probe_name] = []
        self.probe_times[probe_name].append(execution_time)
        
        # Track success/failure
        if success:
            self.probe_success_count[probe_name] = self.probe_success_count.get(probe_name, 0) + 1
        else:
            self.probe_failure_count[probe_name] = self.probe_failure_count.get(probe_name, 0) + 1
            if error:
                self.errors.append({
                    "probe": probe_name,
                    "error": error,
                    "timestamp": datetime.now().isoformat()
                })
    
    def get_probe_stats(self, probe_name: str) -> Dict[str, Any]:
        """Get statistics for a specific probe"""
        if probe_name not in self.probe_times:
            return {
                "probe": probe_name,
                "executions": 0,
                "success_count": 0,
                "failure_count": 0,
            }
        
        times = self.probe_times[probe_name]
        success = self.probe_success_count.get(probe_name, 0)
        failure = self.probe_failure_count.get(probe_name, 0)
        
        return {
            "probe": probe_name,
            "executions": len(times),
            "success_count": success,
            "failure_count": failure,
            "success_rate": (success / (success + failure)) if (success + failure) > 0 else 0,
            "min_time": min(times),
            "max_time": max(times),
            "avg_time": statistics.mean(times),
            "median_time": statistics.median(times),
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics"""
        probes_stats = {
            probe: self.get_probe_stats(probe)
            for probe in set(self.probe_success_count.keys()) | set(self.probe_failure_count.keys())
        }
        
        total_success = sum(self.probe_success_count.values())
        total_failure = sum(self.probe_failure_count.values())
        
        return {
            "total_executions": len(self.probe_executions),
            "total_success": total_success,
            "total_failure": total_failure,
            "success_rate": (total_success / (total_success + total_failure)) if (total_success + total_failure) > 0 else 0,
            "probes": probes_stats,
            "recent_errors": self.errors[-10:],  # Last 10 errors
            "recent_executions": self.probe_executions[-100:],  # Last 100 executions
        }
    
    def clear(self) -> None:
        """Clear all metrics"""
        self.probe_executions.clear()
        self.probe_times.clear()
        self.probe_success_count.clear()
        self.probe_failure_count.clear()
        self.errors.clear()
