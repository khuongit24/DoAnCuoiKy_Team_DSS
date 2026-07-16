import logging
import sys
from config.settings import settings

def setup_logger():
    logger = logging.getLogger("ml_service")
    logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger

logger = setup_logger()
