from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./mobilege.db"
    api_prefix: str = "/api/v1"
    cors_origins: str = "*"


settings = Settings()
