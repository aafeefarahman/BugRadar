import os
import logging
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

logger = logging.getLogger(__name__)

def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./bugradar.db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

class Settings(BaseSettings):
    PROJECT_NAME: str = "BugRadar"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database URL (SQLite default, or PostgreSQL on Render/Supabase)
    DATABASE_URL: str = _get_database_url()
    
    # Secret Key
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Gemini AI API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # GitHub Personal Access Token (Automatic default/fallback)
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    
    # Cache settings
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))  # 1 hour analysis cache
    
    # CORS Origins
    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url:
            for item in frontend_url.split(","):
                clean = item.strip().rstrip("/")
                if clean and clean not in origins:
                    origins.append(clean)
        cors_origins = os.getenv("CORS_ORIGINS")
        if cors_origins:
            for item in cors_origins.split(","):
                clean = item.strip().rstrip("/")
                if clean and clean not in origins:
                    origins.append(clean)
        return origins

settings = Settings()

if not settings.SECRET_KEY:
    logger.warning("SECRET_KEY environment variable is not set or empty.")
if not settings.GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY environment variable is not set or empty.")
if not settings.GITHUB_TOKEN:
    logger.warning("GITHUB_TOKEN environment variable is not set or empty.")
