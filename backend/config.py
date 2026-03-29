from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    fred_api_key: str = "demo"
    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    sim_steps: int = 16
    sim_noise: float = 0.025
    cache_ttl_snapshot: int = 900   # 15 min
    cache_ttl_sim: int = 3600       # 1 hr

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
