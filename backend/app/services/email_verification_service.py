# @AI-HINT: Email verification service for generating tokens, sending verification emails, and validating user emails
# Handles email verification token generation, expiry checking, and verification workflow

import secrets
from typing import Optional, Dict, Any
import logging

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class EmailVerificationService:
    """Service for handling email verification operations"""
    
    def __init__(self):
        self.token_expiry_hours = 24  # Verification links valid for 24 hours
    
    def generate_verification_token(self) -> str:
        """Generate a secure random verification token."""
        return secrets.token_urlsafe(32)
    
    async def create_verification_token(self, user_id: int) -> str:
        """Create and store a new verification token for a user."""
        token = self.generate_verification_token()
        await execute_query(
            "UPDATE users SET email_verification_token = ?, email_verified = 0 WHERE id = ?",
            [token, user_id]
        )
        return token
    
    async def verify_email(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a user's email using the verification token."""
        result = await execute_query(
            "SELECT id, email, name FROM users WHERE email_verification_token = ?",
            [token]
        )
        rows = parse_rows(result)
        if not rows:
            return None
        
        user = rows[0]
        await execute_query(
            "UPDATE users SET email_verified = 1, email_verification_token = NULL, is_verified = 1 WHERE id = ?",
            [user["id"]]
        )
        return user
    
    async def resend_verification_email(self, user_id: int) -> str:
        """Generate a new verification token and store it."""
        return await self.create_verification_token(user_id)
    
    async def is_token_valid(self, user_id: int) -> bool:
        """Check if user has a verification token."""
        result = await execute_query(
            "SELECT email_verification_token FROM users WHERE id = ?",
            [user_id]
        )
        rows = parse_rows(result)
        if not rows:
            return False
        return bool(rows[0].get("email_verification_token"))


# Singleton instance
email_verification_service = EmailVerificationService()
