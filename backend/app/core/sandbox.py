"""Sandbox environment for safe execution of probes"""

import subprocess
import tempfile
import os
from pathlib import Path
from typing import Dict, Optional

# Optional docker import
try:
    import docker
    DOCKER_AVAILABLE = True
except ImportError:
    docker = None
    DOCKER_AVAILABLE = False


class SandboxExecutor:
    """Sandbox executor for running probes in isolated environments"""
    
    def __init__(self, use_docker: bool = True):
        self.use_docker = use_docker and DOCKER_AVAILABLE
        self.client = None
        
        if self.use_docker:
            try:
                self.client = docker.from_env()
            except Exception as e:
                print(f"Warning: Docker not available: {e}")
                self.use_docker = False
    
    async def execute_probe(
        self,
        probe_code: str,
        model_config: Dict,
        timeout: int = 30
    ) -> Dict:
        """Execute a probe in a sandbox environment"""
        if self.use_docker and self.client:
            return await self._execute_in_docker(probe_code, model_config, timeout)
        else:
            return await self._execute_locally(probe_code, model_config, timeout)
    
    async def _execute_in_docker(
        self,
        probe_code: str,
        model_config: Dict,
        timeout: int
    ) -> Dict:
        """Execute probe in Docker container"""
        # Create temporary file with probe code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(probe_code)
            probe_file = f.name
        
        try:
            # Run in Docker container with resource limits
            container = self.client.containers.run(
                image="python:3.11-slim",
                command=f"python {os.path.basename(probe_file)}",
                volumes={probe_file: {"bind": f"/tmp/{os.path.basename(probe_file)}", "mode": "ro"}},
                mem_limit="512m",
                cpu_period=100000,
                cpu_quota=50000,  # 50% CPU
                network_disabled=False,  # Allow network for API calls
                remove=True,
                stdout=True,
                stderr=True
            )
            
            return {
                "status": "completed",
                "output": container.decode('utf-8') if isinstance(container, bytes) else str(container)
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e)
            }
        finally:
            # Cleanup
            if os.path.exists(probe_file):
                os.unlink(probe_file)
    
    async def _execute_locally(
        self,
        probe_code: str,
        model_config: Dict,
        timeout: int
    ) -> Dict:
        """Execute probe locally (less secure, for development)"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(probe_code)
            probe_file = f.name
        
        try:
            result = subprocess.run(
                ["python", probe_file],
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            return {
                "status": "completed" if result.returncode == 0 else "failed",
                "output": result.stdout,
                "error": result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error": f"Probe execution exceeded {timeout} seconds"
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e)
            }
        finally:
            if os.path.exists(probe_file):
                os.unlink(probe_file)

