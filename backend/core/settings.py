from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = ""
    PROXMOX_HOST: str
    PROXMOX_PORT: int = 8006
    PROXMOX_USER: str
    PROXMOX_PASSWORD: str
    TUNNEL_DOMAIN: str
    ENABLE_HTTPS: bool = False

    @field_validator("ALLOWED_ORIGINS")
    def parse_allowed_origins(cls, v: str) -> List[str]:
        return v.split(",") if v else []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
