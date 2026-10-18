import os
import json
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "AI-Based Mental Health Risk Prediction System"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./mental_health.db"
    
    # Security
    JWT_SECRET_KEY: str = "super_secure_default_secret_key_change_in_production_32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Initial Admin Bootstrap
    INITIAL_ADMIN_EMAIL: str = "admin@mentalhealth.ai"
    INITIAL_ADMIN_PASSWORD: str = "AdminSecurePass@2026"
    INITIAL_ADMIN_FULL_NAME: str = "System Administrator"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # ML & Artifacts
    MODEL_DIR: str = str(BACKEND_DIR / "artifacts")
    DATA_DIR: str = str(BACKEND_DIR / "data")
    DATASET_FILENAME: str = "student_depression_dataset.csv"
    MODEL_VERSION: str = "1.0.0"

    @field_validator("MODEL_DIR", "DATA_DIR", mode="after")
    @classmethod
    def resolve_paths(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            return str(BACKEND_DIR / p)
        return str(p)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
