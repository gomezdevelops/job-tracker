from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    pre_auth_token_expire_minutes: int = 10
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    resend_api_key: str = ""
    email_from: str = "Job Tracker <security@mail.gomezdevelops.com>"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
