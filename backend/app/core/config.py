from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # БД
    database_url: str = "postgresql+asyncpg://yomi:yomipass@db:5432/yomifinance"

    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Шифрование (AES-256 для паспортных данных)
    encryption_key: str = "dev-encryption-key-32-bytes-long!"

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
