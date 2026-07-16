from fastapi import Header, HTTPException
import os

# Internal API Key for service-to-service communication
INTERNAL_API_KEY = os.getenv("ML_INTERNAL_API_KEY", "dev_internal_key")

async def verify_internal_api_key(x_api_key: str = Header(...)):
    """Verifies that the request comes from an authorized internal service (e.g. Node API)"""
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key
