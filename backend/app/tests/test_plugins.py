"""Tests for plugin management"""

import pytest
from app.services.plugin_manager import PluginManager


class TestPluginManagerInit:
    """Test plugin manager initialization"""

    def test_initialization(self):
        """Test plugin manager initializes"""
        manager = PluginManager()
        assert manager is not None

    def test_plugins_list_exists(self):
        """Test plugins list is created"""
        manager = PluginManager()
        assert hasattr(manager, 'plugins')
        assert isinstance(manager.plugins, list)


class TestPluginDiscovery:
    """Test plugin discovery functionality"""

    def test_get_available_probes(self):
        """Test getting available probes returns list"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        assert isinstance(probes, list)

    def test_probe_has_required_fields(self):
        """Test probes have required fields"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        for probe in probes:
            assert "name" in probe
            assert "category" in probe
            assert "description" in probe
            assert "source" in probe


class TestProbeRetrieval:
    """Test probe retrieval methods"""

    def test_get_probe_by_name_found(self):
        """Test getting probe by name when exists"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        if probes:
            first_probe = probes[0]
            found = manager.get_probe_by_name(first_probe["name"])
            assert found is not None
            assert found["name"] == first_probe["name"]

    def test_get_probe_by_name_not_found(self):
        """Test getting probe by name when not exists"""
        manager = PluginManager()
        found = manager.get_probe_by_name("nonexistent_probe_xyz_123")
        
        assert found is None

    def test_get_probes_by_category(self):
        """Test filtering probes by category"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        if probes:
            category = probes[0].get("category")
            if category:
                filtered = manager.get_probes_by_category(category)
                assert isinstance(filtered, list)
                for probe in filtered:
                    assert probe["category"] == category

    def test_get_probes_by_invalid_category(self):
        """Test filtering by non-existent category"""
        manager = PluginManager()
        filtered = manager.get_probes_by_category("totally_fake_category_xyz")
        
        assert filtered == []
