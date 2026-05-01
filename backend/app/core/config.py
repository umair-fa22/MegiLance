# @AI-HINT: Application settings and environment configuration using Pydantic BaseSettings
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MegiLance API"
    environment: str = "development"
    backend_cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://megilance.site",
        "https://www.megilance.site",
        "https://api.megilance.site",
    ]

    # Database - Turso (libSQL) Remote Database ONLY
    # REQUIRED: Must set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
    # No local SQLite - all environments use Turso cloud database
    turso_database_url: str  # Required: Turso database URL (e.g., libsql://your-db.turso.io)
    turso_auth_token: str  # Required: Turso authentication token
    
    # Debug mode for verbose logging
    debug: bool = False

    # MongoDB Configuration (Optional - for blog/advanced features)
    MONGODB_URL: Optional[str] = None  # Set via environment variable if needed
    MONGODB_DB_NAME: str = "megilance_blog"
    
    # Path to mounted JSON data directory (for mock/admin/demo endpoints)
    json_data_dir: str = "/data/db"
    
    # Security & JWT - IMPORTANT: Override in production via environment variables!
    # WARNING: Never use default secret_key in production
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_megilance_dev_only_secret"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    jwt_algorithm: str = "HS256"
    
    # Password Policy
    password_min_length: int = 8
    password_max_length: int = 128
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digit: bool = True
    password_require_special: bool = False  # Recommended for better UX
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = 60
    rate_limit_login_attempts: int = 5  # Failed login attempts before temporary lockout
    rate_limit_lockout_minutes: int = 15
    
    # Account Security
    account_lockout_threshold: int = 10  # Lock account after this many failed attempts

    # AWS S3 / Cloudflare R2 Configuration
    aws_region: Optional[str] = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_bucket_name: Optional[str] = None
    aws_endpoint_url: Optional[str] = None  # Crucial for Cloudflare R2, e.g., https://<account_id>.r2.cloudflarestorage.com
    aws_custom_domain: Optional[str] = None  # Public URL (e.g., https://pub-xxxxxxxx.r2.dev or a custom domain)
    account_lockout_duration_minutes: int = 30  # How long to lock the account
    session_absolute_timeout_hours: int = 24  # Force re-login after this many hours
    
    # CSRF Protection
    csrf_enabled: bool = True
    csrf_header_name: str = "X-CSRF-Token"
    
    # Audit Logging
    audit_log_enabled: bool = True
    audit_log_retention_days: int = 90
    
    # File Storage (Simple local storage or can be upgraded to cloud storage like S3/Cloudflare R2)
    upload_dir: str = "./uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_upload_extensions: list[str] = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx"]
    
    # AI Service
    ai_service_url: Optional[str] = "http://localhost:8001"
    openai_api_key: Optional[str] = None
    
    # Email & Notifications
    ses_region: Optional[str] = None
    ses_from_email: Optional[str] = None
    sns_topic_arn: Optional[str] = None
    
    # SMTP Configuration for Email Service
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@megilance.com"
    FROM_NAME: str = "MegiLance"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Blockchain & Payments
    circle_api_key: Optional[str] = None
    blockchain_provider_url: Optional[str] = None
    usdc_contract_address: Optional[str] = None
    
    # Stripe Payment Configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PLATFORM_FEE_PERCENT: float = 10.0  # Platform fee percentage (default 10%)
    
    # OAuth Configuration - Google (FREE forever)
    # Get from: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # OAuth Configuration - GitHub (FREE forever)
    # Get from: https://github.com/settings/developers
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    
    # OAuth Configuration - LinkedIn (FREE)
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    
    # Resend Email Service (FREE 3,000/month)
    # Get from: https://resend.com/api-keys
    RESEND_API_KEY: Optional[str] = None
    
    # Monitoring & Logging
    sentry_dsn: Optional[str] = None
    log_level: str = "INFO"
    
    # Connection Pool
    turso_pool_connections: int = 10
    turso_pool_maxsize: int = 20

    # Redis (Optional — caching/sessions)
    redis_host: Optional[str] = None
    redis_port: Optional[int] = None
    redis_db: Optional[int] = None
    
    # Token Aliases (prefer canonical fields above)
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


def validate_production_settings(settings: Settings) -> None:
    """Validate critical security settings for production environment."""
    import warnings
    
    # Always check Turso database configuration (required for all environments)
    if not settings.turso_database_url or not settings.turso_auth_token:
        raise ValueError(
            "CRITICAL: Turso database not configured. "
            "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for all environments. "
            "Get free Turso database at: https://turso.tech"
        )
    
    if settings.environment == "production":
        # Check for default/weak secret key
        if "CHANGE_ME" in settings.secret_key or len(settings.secret_key) < 32:
            raise ValueError(
                "CRITICAL: Production environment detected with insecure SECRET_KEY. "
                "Set a strong, random SECRET_KEY environment variable (at least 32 characters)."
            )
        
        # Check CORS wildcard in production
        if "*" in settings.backend_cors_origins:
            warnings.warn(
                "WARNING: CORS wildcard (*) detected in production. "
                "Consider restricting to specific origins.",
                RuntimeWarning
            )
    elif settings.environment != "development":
        # Staging, test, etc. — BLOCK insecure secret keys (not just warn)
        if "CHANGE_ME" in settings.secret_key or len(settings.secret_key) < 32:
            raise ValueError(
                f"CRITICAL: Insecure SECRET_KEY detected in '{settings.environment}' environment. "
                "Set a strong, random SECRET_KEY environment variable (at least 32 characters). "
                "Default keys are only allowed in 'development' mode."
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    validate_production_settings(settings)
    return settings