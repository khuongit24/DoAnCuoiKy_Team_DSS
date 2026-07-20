from fastapi import Header, HTTPException
from config.settings import settings

# Internal API Key for service-to-service communication
INTERNAL_API_KEY = settings.ml_internal_api_key

async def verify_internal_api_key(x_internal_api_key: str = Header(...)):
    """Verifies that the request comes from an authorized internal service (e.g. Node API)"""
    if x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_internal_api_key
