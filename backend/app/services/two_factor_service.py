# @AI-HINT: Two-Factor Authentication service for generating TOTP secrets, QR codes, and backup codes
# Handles all 2FA operations including setup, verification, and recovery - Turso HTTP compatible

import logging
import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from typing import List, Tuple, Optional, Dict, Any, Union
from datetime import datetime, timezone
import json
logger = logging.getLogger(__name__)


class TwoFactorService:
    """Service for handling Two-Factor Authentication operations"""
    
    def __init__(self):
        self.app_name = "MegiLance"
    
    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret for a user
        
        Returns:
            str: Base32-encoded secret key
        """
        return pyotp.random_base32()
    
    def generate_provisioning_uri(self, user_email: str, secret: str) -> str:
        """
        Generate provisioning URI for authenticator apps
        
        Args:
            user_email: User's email address
            secret: TOTP secret key
        
        Returns:
            str: Provisioning URI (otpauth://totp/...)
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=self.app_name
        )
    
    def generate_qr_code(self, provisioning_uri: str) -> str:
        """
        Generate QR code image from provisioning URI
        
        Args:
            provisioning_uri: OTP provisioning URI
        
        Returns:
            str: Base64-encoded QR code image (data:image/png;base64,...)
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"
    
    def verify_token(self, secret: str, token: str) -> bool:
        """
        Verify a TOTP token against a secret
        
        Args:
            secret: User's TOTP secret
            token: 6-digit code from authenticator app
        
        Returns:
            bool: True if token is valid
        """
        totp = pyotp.TOTP(secret)
        # Allow 30-second window for time sync issues
        return totp.verify(token, valid_window=1)
    
    def generate_backup_codes(self, count: int = 10) -> Tuple[List[str], List[str]]:
        """
        Generate backup recovery codes
        
        Args:
            count: Number of backup codes to generate (default 10)
        
        Returns:
            Tuple[List[str], List[str]]: (plain_codes, hashed_codes)
                - plain_codes: List of codes to show user (only shown once)
                - hashed_codes: List of hashed codes to store in database
        """
        plain_codes = []
        hashed_codes = []
        
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_hex(4).upper()  # 8 hex chars
            plain_codes.append(code)
            
            # Hash the code for storage
            hashed = hashlib.sha256(code.encode()).hexdigest()
            hashed_codes.append(hashed)
        
        return plain_codes, hashed_codes
    
    def verify_backup_code(self, stored_codes_json: str, input_code: str) -> Tuple[bool, Optional[str]]:
        """
        Verify a backup code and remove it from the list
        
        Args:
            stored_codes_json: JSON array of hashed backup codes from database
            input_code: Backup code entered by user
        
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, updated_codes_json)
                - is_valid: True if code matched and was valid
                - updated_codes_json: New JSON string with code removed (or None if invalid)
        """
        try:
            stored_codes = json.loads(stored_codes_json)
        except (json.JSONDecodeError, TypeError):
            return False, None
        
        # Hash the input code
        input_hash = hashlib.sha256(input_code.upper().encode()).hexdigest()
        
        # Check if code exists
        if input_hash in stored_codes:
            # Remove the used code
            stored_codes.remove(input_hash)
            updated_json = json.dumps(stored_codes)
            return True, updated_json
        
        return False, None
    
    def setup_2fa_for_user_turso(self, user: Union[Dict[str, Any], Any]) -> dict:
        """
        Initialize 2FA setup for a user (Turso HTTP compatible)
        
        Args:
            user: User dict or model instance
        
        Returns:
            dict: Contains secret, qr_code, and backup_codes for user to save
        """
        from app.db.turso_http import execute_query
        
        # Get user email and id
        if isinstance(user, dict):
            user_email = user.get('email', '')
            user_id = user.get('id')
        else:
            user_email = user.email
            user_id = user.id
        
        # Generate new secret
        secret = self.generate_secret()
        
        # Generate backup codes
        plain_codes, hashed_codes = self.generate_backup_codes()
        
        # Store secret and backup codes (2FA not enabled yet)
        execute_query(
            """UPDATE users SET 
               two_factor_secret = ?,
               two_factor_backup_codes = ?,
               two_factor_enabled = 0,
               updated_at = ?
               WHERE id = ?""",
            [secret, json.dumps(hashed_codes), datetime.now(timezone.utc).isoformat(), user_id]
        )
        
        # Generate QR code
        provisioning_uri = self.generate_provisioning_uri(user_email, secret)
        qr_code = self.generate_qr_code(provisioning_uri)
        
        return {
            "secret": secret,
            "qr_code": qr_code,
            "backup_codes": plain_codes,  # Only time these are shown
            "provisioning_uri": provisioning_uri
        }
    
    def enable_2fa_turso(self, user: Union[Dict[str, Any], Any], verification_token: str) -> bool:
        """
        Enable 2FA after user verifies setup with a valid token (Turso HTTP compatible)
        
        Args:
            user: User dict or model instance
            verification_token: Token from authenticator app to verify setup
        
        Returns:
            bool: True if token verified and 2FA enabled
        """
        from app.db.turso_http import execute_query, to_str
        
        # Get user id
        if isinstance(user, dict):
            user_id = user.get('id')
            two_factor_secret = user.get('two_factor_secret')
        else:
            user_id = user.id
            two_factor_secret = getattr(user, 'two_factor_secret', None)
        
        # If secret not in user object, fetch from DB
        if not two_factor_secret:
            result = execute_query(
                "SELECT two_factor_secret FROM users WHERE id = ?",
                [user_id]
            )
            if result and result.get("rows"):
                two_factor_secret = to_str(result["rows"][0][0])
        
        if not two_factor_secret:
            return False
        
        # Verify the token
        if self.verify_token(two_factor_secret, verification_token):
            execute_query(
                "UPDATE users SET two_factor_enabled = 1, updated_at = ? WHERE id = ?",
                [datetime.now(timezone.utc).isoformat(), user_id]
            )
            return True
        
        return False
    
    def disable_2fa_turso(self, user: Union[Dict[str, Any], Any]):
        """
        Disable 2FA for a user (Turso HTTP compatible)
        
        Args:
            user: User dict or model instance
        """
        from app.db.turso_http import execute_query
        
        # Get user id
        if isinstance(user, dict):
            user_id = user.get('id')
        else:
            user_id = user.id
        
        execute_query(
            """UPDATE users SET 
               two_factor_enabled = 0,
               two_factor_secret = NULL,
               two_factor_backup_codes = NULL,
               updated_at = ?
               WHERE id = ?""",
            [datetime.now(timezone.utc).isoformat(), user_id]
        )
    
    def verify_2fa_login_turso(
        self, 
        user: Union[Dict[str, Any], Any], 
        token: str, 
        is_backup_code: bool = False
    ) -> bool:
        """
        Verify 2FA token during login (Turso HTTP compatible)
        
        Args:
            user: User dict or model instance
            token: TOTP token or backup code
            is_backup_code: Whether token is a backup code (default False)
        
        Returns:
            bool: True if authentication successful
        """
        from app.db.turso_http import execute_query, to_str
        
        # Get user data
        if isinstance(user, dict):
            user_id = user.get('id')
            two_factor_enabled = user.get('two_factor_enabled', False)
            two_factor_secret = user.get('two_factor_secret')
            two_factor_backup_codes = user.get('two_factor_backup_codes')
        else:
            user_id = user.id
            two_factor_enabled = getattr(user, 'two_factor_enabled', False)
            two_factor_secret = getattr(user, 'two_factor_secret', None)
            two_factor_backup_codes = getattr(user, 'two_factor_backup_codes', None)
        
        if not two_factor_enabled:
            return False
        
        # Fetch fresh data from DB if needed
        if not two_factor_secret or not two_factor_backup_codes:
            result = execute_query(
                "SELECT two_factor_secret, two_factor_backup_codes FROM users WHERE id = ?",
                [user_id]
            )
            if result and result.get("rows"):
                row = result["rows"][0]
                two_factor_secret = to_str(row[0])
                two_factor_backup_codes = to_str(row[1])
        
        if is_backup_code:
            # Verify backup code
            if not two_factor_backup_codes:
                return False
            
            is_valid, updated_codes = self.verify_backup_code(
                two_factor_backup_codes, 
                token
            )
            
            if is_valid:
                # Update stored codes (one-time use)
                execute_query(
                    "UPDATE users SET two_factor_backup_codes = ?, updated_at = ? WHERE id = ?",
                    [updated_codes, datetime.now(timezone.utc).isoformat(), user_id]
                )
                return True
            
            return False
        else:
            # Verify TOTP token
            if not two_factor_secret:
                return False
            
            return self.verify_token(two_factor_secret, token)


    def get_2fa_status(self, user_id) -> dict:
        """
        Get current 2FA status for a user from the database.

        Args:
            user_id: The user's ID

        Returns:
            dict with 'enabled', 'status', and 'backup_codes_remaining' keys,
            or None if user not found.
        """
        from app.db.turso_http import execute_query, parse_rows

        result = execute_query(
            "SELECT two_factor_enabled, two_factor_backup_codes FROM users WHERE id = ?",
            [user_id]
        )
        rows = parse_rows(result)

        if not rows:
            return None

        row = rows[0]
        enabled = bool(row.get('two_factor_enabled', 0))
        backup_codes_json = row.get('two_factor_backup_codes')

        codes_remaining = 0
        if backup_codes_json:
            try:
                codes_remaining = len(json.loads(backup_codes_json))
            except (json.JSONDecodeError, TypeError):
                pass

        return {
            "enabled": enabled,
            "status": "enabled" if enabled else "disabled",
            "backup_codes_remaining": codes_remaining,
        }


# Singleton instance
two_factor_service = TwoFactorService()
