import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BugRadar"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database URL (SQLite default, or PostgreSQL on Render/Supabase)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bugradar.db")
    
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
        custom_origins = os.getenv("CORS_ORIGINS")
        if custom_origins:
            origins = [origin.strip() for origin in custom_origins.split(",") if origin.strip()]
            if "https://bug-radar-dusky.vercel.app" not in origins:
                origins.append("https://bug-radar-dusky.vercel.app")
            return origins
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "https://bug-radar-dusky.vercel.app",
            "*"
        ]

settings = Settings()
