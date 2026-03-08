# @AI-HINT: Password reset service for generating reset tokens, validating expiry, and updating passwords
# Handles forgot password workflow with secure token generation and expiry management

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Service for handling password reset operations"""
    
    def __init__(self):
        self.token_expiry_hours = 1  # Reset tokens valid for 1 hour
    
    def generate_reset_token(self) -> str:
        """Generate a secure random password reset token"""
        return secrets.token_urlsafe(32)
    
    async def create_reset_token(self, user_id: int) -> tuple[str, datetime]:
        """
        Create and store a new password reset token for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            tuple[str, datetime]: (reset_token, expiry_datetime)
        """
        token = self.generate_reset_token()
        expiry = datetime.now(timezone.utc) + timedelta(hours=self.token_expiry_hours)
        
        execute_query(
            "UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?",
            [token, expiry.isoformat(), user_id]
        )
        
        return token, expiry
    
    async def validate_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a password reset token and check expiry.
        
        Args:
            token: Reset token from email link
        
        Returns:
            Dict with user data if token is valid and not expired, None otherwise
        """
        result = execute_query(
            "SELECT * FROM users WHERE password_reset_token = ? LIMIT 1",
            [token]
        )
        rows = parse_rows(result)
        
        if not rows:
            return None
        
        user = rows[0]
        
        # Check if token has expired
        if user.get("password_reset_expires"):
            expires = user["password_reset_expires"]
            if isinstance(expires, str):
                expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
            if expires < datetime.now(timezone.utc):
                return None
        
        return user
    
    async def reset_password(self, user_id: int, new_password_hash: str) -> bool:
        """
        Reset user's password and clear reset token.
        
        Args:
            user_id: User ID
            new_password_hash: Hashed new password
        
        Returns:
            bool: True if password reset successful
        """
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            """UPDATE users SET hashed_password = ?, password_reset_token = NULL, 
               password_reset_expires = NULL, last_password_changed = ? WHERE id = ?""",
            [new_password_hash, now, user_id]
        )
        return True
    
    def is_token_expired(self, user: Dict[str, Any]) -> bool:
        """Check if user's reset token has expired."""
        token = user.get("password_reset_token")
        expires = user.get("password_reset_expires")
        if not token or not expires:
            return True
        
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        
        return expires < datetime.now(timezone.utc)
    
    async def invalidate_reset_token(self, user_id: int):
        """Manually invalidate a user's reset token."""
        execute_query(
            "UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
            [user_id]
        )


# Singleton instance
password_reset_service = PasswordResetService()
