"""Validation utilities for Counterfit integration."""

import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class CounterfitValidator:
    """Validates Counterfit configuration and setup."""

    @staticmethod
    def validate_model_config(model_config: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate that model_config contains required Counterfit parameters.
        
        Returns:
            (is_valid, error_message)
        """
        if not isinstance(model_config, dict):
            return False, "model_config must be a dictionary"
        
        target_name = model_config.get("counterfit_target")
        attack_name = model_config.get("counterfit_attack")
        
        if not target_name:
            return False, (
                "counterfit_target is required in model_config. "
                "Set 'counterfit_target' to the name of your Counterfit target."
            )
        
        if not attack_name:
            return False, (
                "counterfit_attack is required in model_config. "
                "Set 'counterfit_attack' to the name of the Counterfit attack to run."
            )
        
        if not isinstance(target_name, str) or not target_name.strip():
            return False, "counterfit_target must be a non-empty string"
        
        if not isinstance(attack_name, str) or not attack_name.strip():
            return False, "counterfit_attack must be a non-empty string"
        
        return True, None

    @staticmethod
    def validate_counterfit_installation() -> tuple[bool, Optional[str]]:
        """
        Validate that Counterfit is properly installed.
        
        Returns:
            (is_installed, error_message)
        """
        try:
            import counterfit
            from counterfit import targets
            return True, None
        except ImportError as e:
            return False, (
                f"Counterfit is not installed. "
                f"Install with: pip install 'counterfit[dev]' "
                f"Original error: {str(e)}"
            )

    @staticmethod
    def get_available_targets() -> List[str]:
        """Get list of available Counterfit targets."""
        try:
            from counterfit import targets
            if hasattr(targets, 'list_targets'):
                return targets.list_targets()
            elif hasattr(targets, 'get_all'):
                return list(targets.get_all().keys())
            else:
                logger.warning("Could not enumerate Counterfit targets - API may have changed")
                return []
        except Exception as e:
            logger.warning("Error getting Counterfit targets: %s", e)
            return []

    @staticmethod
    def get_available_attacks(target_name: Optional[str] = None) -> List[str]:
        """Get list of available Counterfit attacks for a target."""
        try:
            from counterfit import targets
            if target_name:
                target = targets.load(target_name) if hasattr(targets, 'load') else None
                if target and hasattr(target, 'attacks'):
                    return list(target.attacks.keys())
            
            # Try to get all attacks
            if hasattr(targets, 'list_attacks'):
                return targets.list_attacks()
            else:
                logger.warning("Could not enumerate Counterfit attacks - API may have changed")
                return []
        except Exception as e:
            logger.warning("Error getting Counterfit attacks: %s", e)
            return []

