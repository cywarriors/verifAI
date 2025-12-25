"""Main entry point for scanner module"""

import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("verifAI Scanner Module")
    logger.info("This module is typically used by the backend scan orchestrator")
    logger.info("For standalone usage, import ScannerEngine and use directly")
    
    # Example usage
    try:
        from scanner import ScannerEngine, ProbeLoader
        
        # List available probes
        loader = ProbeLoader()
        probes = loader.list_probes()
        
        logger.info(f"Available probes: {len(probes)}")
        for probe_name in probes:
            info = loader.get_probe_info(probe_name)
            logger.info(f"  - {probe_name}: {info.get('description', 'No description')}")
        
    except Exception as e:
        logger.error(f"Error loading scanner: {e}")
        sys.exit(1)

