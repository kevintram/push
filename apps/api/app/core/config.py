from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field, AnyUrl, BeforeValidator
from typing import Annotated, Any


def parse_origins(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str

    @computed_field
    @property
    def POSTGRES_URL(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
            path=self.DB_NAME,
        )

    WORKOS_API_KEY: str
    WORKOS_CLIENT_ID: str
    WORKOS_COOKIE_PASSWORD: str

    CORS_ALLOWED_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_origins)
    ] = []

    @computed_field
    @property
    def CORS_ALLOWED_ORIGINS_AS_STRINGS(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.CORS_ALLOWED_ORIGINS]


settings = Settings(_env_file=".env", _env_file_encoding="utf-8")
