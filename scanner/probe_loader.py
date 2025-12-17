"""Probe loader for dynamic discovery and loading of security probes"""

import importlib
import importlib.util
import inspect
from pathlib import Path
from typing import Dict, List, Optional, Type, Any
import logging

logger = logging.getLogger(__name__)


class ProbeLoader:
    """Loads and manages security probes from the probes directory"""
    
    def __init__(self, probes_dir: Optional[Path] = None):
        """
        Initialize probe loader
        
        Args:
            probes_dir: Path to probes directory. Defaults to scanner/probes
        """
        if probes_dir is None:
            # Get probes directory relative to this file
            self.probes_dir = Path(__file__).parent / "probes"
        else:
            self.probes_dir = Path(probes_dir)
        
        self._probes: Dict[str, Dict[str, Any]] = {}
        self._load_probes()
    
    def _load_probes(self) -> None:
        """Discover and load all probes from the probes directory"""
        if not self.probes_dir.exists():
            logger.warning(f"Probes directory not found: {self.probes_dir}")
            return
        
        # Walk through probe directories
        for probe_file in self.probes_dir.rglob("*.py"):
            # Skip __init__ and README
            if probe_file.name.startswith("_") or probe_file.name == "README.md":
                continue
            
            try:
                probe_info, probe_class = self._load_probe_file(probe_file)
                if probe_info and probe_class:
                    probe_name = probe_info.get("name")
                    if probe_name:
                        self._probes[probe_name] = {
                            "info": probe_info,
                            "class": probe_class,
                            "path": probe_file,
                            "category": probe_info.get("category", "unknown")
                        }
                        logger.info(f"Loaded probe: {probe_name} from {probe_file}")
            except Exception as e:
                logger.error(f"Failed to load probe from {probe_file}: {e}")
    
    def _load_probe_file(self, probe_file: Path) -> tuple[Optional[Dict], Optional[Type]]:
        """
        Load a probe from a Python file
        
        Returns:
            Tuple of (probe_info dict, probe_class) or (None, None) if invalid
        """
        try:
            # Create module name from file path
            relative_path = probe_file.relative_to(self.probes_dir.parent.parent)
            module_path = str(relative_path).replace("/", ".").replace("\\", ".").replace(".py", "")
            
            # Import the module
            spec = importlib.util.spec_from_file_location(module_path, probe_file)
            if spec is None or spec.loader is None:
                return None, None
            
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Get probe_info
            probe_info = getattr(module, "probe_info", None)
            if not probe_info or not isinstance(probe_info, dict):
                logger.warning(f"No probe_info found in {probe_file}")
                return None, None
            
            # Find probe class (class that has 'test' method and matches probe name)
            probe_class = None
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if name.endswith("Probe") and hasattr(obj, "test"):
                    probe_class = obj
                    break
            
            if probe_class is None:
                logger.warning(f"No probe class found in {probe_file}")
                return None, None
            
            return probe_info, probe_class
            
        except Exception as e:
            logger.error(f"Error loading probe file {probe_file}: {e}")
            return None, None
    
    def get_probe(self, probe_name: str) -> Optional[Type]:
        """Get a probe class by name"""
        probe_data = self._probes.get(probe_name)
        return probe_data["class"] if probe_data else None
    
    def get_probe_info(self, probe_name: str) -> Optional[Dict]:
        """Get probe info by name"""
        probe_data = self._probes.get(probe_name)
        return probe_data["info"] if probe_data else None
    
    def list_probes(self, category: Optional[str] = None) -> List[str]:
        """
        List all available probe names
        
        Args:
            category: Optional category filter
            
        Returns:
            List of probe names
        """
        if category:
            return [
                name for name, data in self._probes.items()
                if data.get("category") == category
            ]
        return list(self._probes.keys())
    
    def get_probes_by_category(self) -> Dict[str, List[str]]:
        """Get probes grouped by category"""
        categories: Dict[str, List[str]] = {}
        for name, data in self._probes.items():
            cat = data.get("category", "unknown")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(name)
        return categories
    
    def create_probe_instance(self, probe_name: str) -> Optional[Any]:
        """Create an instance of a probe"""
        probe_class = self.get_probe(probe_name)
        if probe_class:
            try:
                return probe_class()
            except Exception as e:
                logger.error(f"Failed to instantiate probe {probe_name}: {e}")
                return None
        return None


# Import importlib.util for dynamic loading
import importlib.util

