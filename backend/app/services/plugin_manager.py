"""Plugin Manager - Loads and manages Garak-compatible plugins and custom probes"""

import importlib.util
import os
from pathlib import Path
from typing import List, Dict, Optional


class PluginManager:
    """Manages security probes and plugins"""
    
    def __init__(self, plugin_directory: str = "scanner/probes"):
        self.plugin_directory = Path(plugin_directory)
        self.plugins: List[Dict] = []
        self._load_plugins()
    
    def _load_plugins(self):
        """Load all available plugins"""
        # Load Garak probes
        try:
            import garak.probes
            # Discover Garak probes
            self._load_garak_probes()
        except ImportError:
            print("Garak not installed, skipping Garak probes")
        
        # Load custom probes
        if self.plugin_directory.exists():
            self._load_custom_probes()
    
    def _load_garak_probes(self):
        """Load probes from Garak library"""
        # This will integrate with Garak's probe discovery
        # Placeholder for now
        garak_probes = [
            {
                "name": "prompt_injection",
                "category": "injection",
                "description": "Tests for prompt injection vulnerabilities",
                "source": "garak"
            },
            {
                "name": "data_leakage",
                "category": "privacy",
                "description": "Tests for data leakage risks",
                "source": "garak"
            },
            {
                "name": "toxicity",
                "category": "safety",
                "description": "Tests for toxic outputs",
                "source": "garak"
            }
        ]
        self.plugins.extend(garak_probes)
    
    def _load_custom_probes(self):
        """Load custom probes from plugin directory"""
        for probe_file in self.plugin_directory.glob("*.py"):
            try:
                # Load custom probe
                spec = importlib.util.spec_from_file_location(probe_file.stem, probe_file)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    if hasattr(module, "probe_info"):
                        probe_info = module.probe_info
                        probe_info["source"] = "custom"
                        self.plugins.append(probe_info)
            except Exception as e:
                print(f"Error loading probe {probe_file}: {e}")
    
    def get_available_probes(self) -> List[Dict]:
        """Get all available probes"""
        return self.plugins
    
    def get_probe_by_name(self, name: str) -> Optional[Dict]:
        """Get a specific probe by name"""
        for probe in self.plugins:
            if probe["name"] == name:
                return probe
        return None
    
    def get_probes_by_category(self, category: str) -> List[Dict]:
        """Get probes by category"""
        return [p for p in self.plugins if p.get("category") == category]

