from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "PulseBoard V10"
    APP_VERSION: str = "10.0.0"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/pulseboard_v10"
    SECRET_KEY: str = "v10_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: str = "http://localhost:3001,http://127.0.0.1:3001,http://172.19.112.52:3001,*"
    DEBUG: bool = False
    UPLOAD_DIR: str = "./uploads"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

    class Config:
        env_file = ".env"


settings = Settings()
