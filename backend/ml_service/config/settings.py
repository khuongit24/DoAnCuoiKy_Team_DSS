from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    app_name: str = "DSS ML Service"
    debug: bool = False
    port: int = 8000
    host: str = "0.0.0.0"
    
    # DB Settings
    database_url: str = "postgresql://postgres:postgres@localhost:5432/dss_db"
    
    # ML API Key
    ml_internal_api_key: str = "secret-key-123"

    class Config:
        env_file = ".env"

settings = Settings()
