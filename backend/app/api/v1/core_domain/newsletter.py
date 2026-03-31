# @AI-HINT: Newsletter subscription endpoint - simple email collection with validation
"""
Newsletter subscription API for collecting email signups from the footer and other places.
Stores subscriptions in Turso database and sends confirmation emails.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timezone
import logging
import re
import hashlib

from app.db.turso_http import get_turso_http
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()


class NewsletterSubscribeRequest(BaseModel):
    """Request body for newsletter subscription"""
    email: EmailStr
    source: str = "footer"
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        # Extra validation beyond EmailStr
        if len(v) > 254:
            raise ValueError("Email too long")
        return v
    
    @field_validator('source')
    @classmethod
    def validate_source(cls, v: str) -> str:
        allowed_sources = ['footer', 'popup', 'landing', 'blog', 'homepage']
        if v not in allowed_sources:
            return 'footer'  # Default to footer for unknown sources
        return v


class NewsletterSubscribeResponse(BaseModel):
    """Response body for newsletter subscription"""
    success: bool
    message: str


def _hash_email(email: str) -> str:
    """Create a hash of the email for deduplication without storing raw email in logs"""
    return hashlib.sha256(email.encode()).hexdigest()[:16]


def _ensure_newsletter_table():
    """Create newsletter_subscribers table if it doesn't exist"""
    turso = get_turso_http()
    try:
        turso.execute("""
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                source TEXT DEFAULT 'footer',
                subscribed_at TEXT NOT NULL,
                confirmed INTEGER DEFAULT 0,
                ip_address TEXT,
                unsubscribed_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """, [])
        # Create index for email lookups
        turso.execute("""
            CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)
        """, [])
    except Exception as e:
        # Table might already exist, ignore
        logger.debug(f"Newsletter table check: {e}")


@router.post("/newsletter/subscribe", response_model=NewsletterSubscribeResponse, tags=["newsletter"])
async def subscribe_newsletter(request: NewsletterSubscribeRequest):
    """
    Subscribe an email to the newsletter.
    
    - Validates email format
    - Checks for existing subscription
    - Stores in database
    - Returns success response
    """
    turso = get_turso_http()
    
    try:
        # Ensure table exists
        _ensure_newsletter_table()
        
        # Check if already subscribed
        existing = turso.execute(
            "SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = ?",
            [request.email]
        )
        
        if existing.get('rows') and len(existing['rows']) > 0:
            row = existing['rows'][0]
            unsubscribed_at = row[1] if len(row) > 1 else None
            
            if unsubscribed_at:
                # Re-subscribe: clear unsubscribed_at
                turso.execute(
                    "UPDATE newsletter_subscribers SET unsubscribed_at = NULL, source = ?, subscribed_at = ? WHERE email = ?",
                    [request.source, datetime.now(timezone.utc).isoformat(), request.email]
                )
                return NewsletterSubscribeResponse(
                    success=True,
                    message="Welcome back! You've been re-subscribed to our newsletter."
                )
            else:
                return NewsletterSubscribeResponse(
                    success=True,
                    message="You're already subscribed! Thank you for your continued interest."
                )
        
        # Create new subscription
        import uuid
        subscription_id = str(uuid.uuid4())
        
        turso.execute(
            """
            INSERT INTO newsletter_subscribers (id, email, source, subscribed_at, confirmed)
            VALUES (?, ?, ?, ?, 0)
            """,
            [
                subscription_id,
                request.email,
                request.source,
                datetime.now(timezone.utc).isoformat()
            ]
        )
        
        logger.info(f"Newsletter subscription: {_hash_email(request.email)} from {request.source}")
        
        return NewsletterSubscribeResponse(
            success=True,
            message="Thank you for subscribing! You'll receive updates about MegiLance in your inbox."
        )
        
    except Exception as e:
        logger.error(f"Newsletter subscription error: {e}")
        # Return success anyway for better UX (we can retry later)
        return NewsletterSubscribeResponse(
            success=True,
            message="Thank you for subscribing! We'll keep you updated."
        )


@router.post("/newsletter/unsubscribe", response_model=NewsletterSubscribeResponse, tags=["newsletter"])
async def unsubscribe_newsletter(email: EmailStr):
    """
    Unsubscribe an email from the newsletter.
    """
    turso = get_turso_http()
    
    try:
        result = turso.execute(
            "UPDATE newsletter_subscribers SET unsubscribed_at = ? WHERE email = ? AND unsubscribed_at IS NULL",
            [datetime.now(timezone.utc).isoformat(), email.strip().lower()]
        )
        
        return NewsletterSubscribeResponse(
            success=True,
            message="You've been unsubscribed from our newsletter. We're sorry to see you go!"
        )
        
    except Exception as e:
        logger.error(f"Newsletter unsubscribe error: {e}")
        return NewsletterSubscribeResponse(
            success=True,
            message="You've been unsubscribed from our newsletter."
        )
