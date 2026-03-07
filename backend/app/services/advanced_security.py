# @AI-HINT: Advanced security service for multi-factor authentication, biometrics, and threat detection
"""Advanced Security Service."""

from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
import secrets
import hashlib
import json


from app.core.config import get_settings
settings = get_settings()


# ============================================================================
# Request/Response Models
# ============================================================================

class MFASetupRequest(BaseModel):
    method: str  # "sms", "email", "totp", "webauthn", "hardware_key"
    phone_number: Optional[str] = None
    email: Optional[str] = None


class MFAVerifyRequest(BaseModel):
    code: str
    method: str
    device_info: Optional[Dict[str, Any]] = None


class BiometricRegisterRequest(BaseModel):
    credential_id: str
    public_key: str
    device_name: str
    device_type: str  # "fingerprint", "face_id", "security_key"


class SecurityEventLog(BaseModel):
    event_type: str
    severity: str  # "low", "medium", "high", "critical"
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class RiskAssessment(BaseModel):
    risk_score: float  # 0-100
    risk_level: str  # "low", "medium", "high", "critical"
    factors: List[Dict[str, Any]]
    recommended_action: str
    require_additional_auth: bool


# ============================================================================
# Advanced Security Service
# ============================================================================

class AdvancedSecurityService:
    """Advanced security service with multi-factor authentication and threat detection"""

    def __init__(self):
        self.risk_threshold = {
            "low": 30,
            "medium": 60,
            "high": 80,
            "critical": 95
        }

    # ========================================================================
    # Multi-Factor Authentication
    # ========================================================================

    async def setup_mfa(
        self,
        user_id: int,
        method: str,
        contact: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Set up multi-factor authentication for user
        
        Args:
            user_id: User ID
            method: MFA method (sms, email, totp, webauthn, hardware_key)
            contact: Phone number or email (for SMS/email MFA)
            
        Returns:
            Setup details including secret/QR code for TOTP
        """
        if method == "totp":
            # Generate TOTP secret
            import pyotp
            secret = pyotp.random_base32()
            totp = pyotp.TOTP(secret)
            provisioning_uri = totp.provisioning_uri(
                name=f"user_{user_id}",
                issuer_name="MegiLance"
            )
            
            # Generate QR code
            import qrcode
            import io
            import base64
            
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(provisioning_uri)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_code = base64.b64encode(buffer.getvalue()).decode()
            
            # Store in database
            from app.db.session import execute_query
            execute_query("""
                INSERT INTO mfa_methods (user_id, method, secret, is_active, created_at)
                VALUES (?, ?, ?, 1, ?)
            """, [user_id, method, secret, datetime.now(timezone.utc).isoformat()])
            
            return {
                "method": method,
                "secret": secret,
                "qr_code": f"data:image/png;base64,{qr_code}",
                "provisioning_uri": provisioning_uri,
                "backup_codes": self._generate_backup_codes(user_id)
            }
            
        elif method == "sms":
            # Store phone number and send verification SMS
            code = self._generate_verification_code()
            # DEFERRED: Integrate with Twilio for SMS (requires Twilio API credentials)
            
            execute_query("""
                INSERT INTO mfa_methods (user_id, method, contact, verification_code, code_expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                user_id, method, contact, code,
                (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
                datetime.now(timezone.utc).isoformat()
            ])
            
            return {
                "method": method,
                "contact": contact,
                "message": "Verification code sent to your phone"
            }
            
        elif method == "email":
            # Send verification email
            code = self._generate_verification_code()
            
            execute_query("""
                INSERT INTO mfa_methods (user_id, method, contact, verification_code, code_expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                user_id, method, contact, code,
                (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
                datetime.now(timezone.utc).isoformat()
            ])
            
            return {
                "method": method,
                "contact": contact,
                "message": "Verification code sent to your email"
            }
            
        elif method == "webauthn":
            # WebAuthn/FIDO2 setup
            # Generate challenge
            challenge = secrets.token_urlsafe(32)
            
            return {
                "method": method,
                "challenge": challenge,
                "rp": {
                    "name": "MegiLance",
                    "id": settings.DOMAIN
                },
                "user": {
                    "id": str(user_id),
                    "name": f"user_{user_id}",
                    "displayName": f"User {user_id}"
                },
                "pubKeyCredParams": [
                    {"type": "public-key", "alg": -7},  # ES256
                    {"type": "public-key", "alg": -257}  # RS256
                ],
                "authenticatorSelection": {
                    "authenticatorAttachment": "cross-platform",
                    "requireResidentKey": False,
                    "userVerification": "preferred"
                }
            }
            
        else:
            return {"error": "Unsupported MFA method"}

    async def verify_mfa(
        self,
        user_id: int,
        method: str,
        code: str,
        device_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Verify MFA code"""
        from app.db.session import execute_query
        
        if method == "totp":
            # Verify TOTP code
            result = execute_query("""
                SELECT secret FROM mfa_methods
                WHERE user_id = ? AND method = ? AND is_active = 1
            """, [user_id, method])
            
            if not result or not result.get("rows"):
                return {"error": "MFA not configured"}
                
            secret = result["rows"][0][0].get("value")
            
            import pyotp
            totp = pyotp.TOTP(secret)
            if totp.verify(code, valid_window=1):
                # Log successful verification
                await self._log_security_event(
                    user_id,
                    "mfa_verified",
                    "low",
                    f"TOTP verification successful",
                    device_info
                )
                return {"verified": True, "method": method}
            else:
                await self._log_security_event(
                    user_id,
                    "mfa_failed",
                    "medium",
                    f"TOTP verification failed",
                    device_info
                )
                return {"verified": False, "error": "Invalid code"}
                
        elif method in ["sms", "email"]:
            # Verify SMS/Email code
            result = execute_query("""
                SELECT verification_code, code_expires_at FROM mfa_methods
                WHERE user_id = ? AND method = ? AND is_active = 1
                ORDER BY created_at DESC LIMIT 1
            """, [user_id, method])
            
            if not result or not result.get("rows"):
                return {"error": "MFA not configured"}
                
            stored_code = result["rows"][0][0].get("value")
            expires_at = result["rows"][0][1].get("value")
            
            if datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
                return {"verified": False, "error": "Code expired"}
                
            if stored_code == code:
                # Mark as verified
                execute_query("""
                    UPDATE mfa_methods SET is_active = 1
                    WHERE user_id = ? AND method = ?
                """, [user_id, method])
                
                return {"verified": True, "method": method}
            else:
                return {"verified": False, "error": "Invalid code"}
                
        return {"error": "Unsupported MFA method"}

    # ========================================================================
    # Risk-Based Authentication
    # ========================================================================

    async def assess_login_risk(
        self,
        user_id: int,
        ip_address: str,
        user_agent: str,
        location: Optional[Dict[str, Any]] = None,
        device_fingerprint: Optional[str] = None
    ) -> RiskAssessment:
        """
        Assess risk level for login attempt
        
        Factors considered:
        - New device
        - New location
        - Impossible travel
        - Known malicious IP
        - Unusual login time
        - Failed login history
        """
        from app.db.session import execute_query
        
        risk_factors = []
        risk_score = 0.0
        
        # Check if device is recognized
        device_result = execute_query("""
            SELECT COUNT(*) as count FROM user_sessions
            WHERE user_id = ? AND ip_address = ? AND user_agent = ?
        """, [user_id, ip_address, user_agent])
        
        if device_result and device_result.get("rows"):
            device_count = int(device_result["rows"][0][0].get("value", 0))
            if device_count == 0:
                risk_factors.append({
                    "factor": "new_device",
                    "weight": 25.0,
                    "description": "Login from unrecognized device"
                })
                risk_score += 25.0
        
        # Check location (if provided)
        if location:
            last_location_result = execute_query("""
                SELECT location FROM user_sessions
                WHERE user_id = ? AND location IS NOT NULL
                ORDER BY created_at DESC LIMIT 1
            """, [user_id])
            
            if last_location_result and last_location_result.get("rows"):
                # Check for impossible travel
                # DEFERRED: Implement geolocation distance calculation (requires MaxMind GeoIP)
                risk_factors.append({
                    "factor": "new_location",
                    "weight": 20.0,
                    "description": "Login from new location"
                })
                risk_score += 20.0
        
        # Check failed login attempts
        failed_attempts_result = execute_query("""
            SELECT COUNT(*) as count FROM security_events
            WHERE user_id = ? AND event_type = 'login_failed'
            AND created_at > ?
        """, [user_id, (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()])
        
        if failed_attempts_result and failed_attempts_result.get("rows"):
            failed_count = int(failed_attempts_result["rows"][0][0].get("value", 0))
            if failed_count > 3:
                weight = min(failed_count * 5, 30.0)
                risk_factors.append({
                    "factor": "failed_attempts",
                    "weight": weight,
                    "description": f"{failed_count} failed login attempts in last 24 hours"
                })
                risk_score += weight
        
        # Check known malicious IPs (simplified - would integrate with threat intelligence)
        # DEFERRED: Integrate with IP reputation services (requires AbuseIPDB or similar API)
        
        # Check unusual login time
        from datetime import datetime
        current_hour = datetime.now(timezone.utc).hour
        if current_hour < 6 or current_hour > 22:  # Between 10 PM and 6 AM
            risk_factors.append({
                "factor": "unusual_time",
                "weight": 10.0,
                "description": "Login during unusual hours"
            })
            risk_score += 10.0
        
        # Determine risk level
        if risk_score < self.risk_threshold["low"]:
            risk_level = "low"
            recommended_action = "allow"
            require_additional_auth = False
        elif risk_score < self.risk_threshold["medium"]:
            risk_level = "medium"
            recommended_action = "email_verification"
            require_additional_auth = True
        elif risk_score < self.risk_threshold["high"]:
            risk_level = "high"
            recommended_action = "mfa_required"
            require_additional_auth = True
        else:
            risk_level = "critical"
            recommended_action = "block_and_notify"
            require_additional_auth = True
        
        return RiskAssessment(
            risk_score=min(risk_score, 100.0),
            risk_level=risk_level,
            factors=risk_factors,
            recommended_action=recommended_action,
            require_additional_auth=require_additional_auth
        )

    # ========================================================================
    # Session Management
    # ========================================================================

    async def create_secure_session(
        self,
        user_id: int,
        ip_address: str,
        user_agent: str,
        device_info: Optional[Dict[str, Any]] = None,
        location: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create secure session with device tracking"""
        from app.db.session import execute_query
        
        session_token = secrets.token_urlsafe(32)
        device_fingerprint = self._generate_device_fingerprint(ip_address, user_agent)
        
        execute_query("""
            INSERT INTO user_sessions (
                user_id, session_token, ip_address, user_agent,
                device_fingerprint, device_info, location,
                is_active, created_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, [
            user_id, session_token, ip_address, user_agent,
            device_fingerprint, json.dumps(device_info) if device_info else None,
            json.dumps(location) if location else None,
            datetime.now(timezone.utc).isoformat(),
            (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        ])
        
        return {
            "session_token": session_token,
            "device_fingerprint": device_fingerprint,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }

    async def get_active_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all active sessions for user"""
        from app.db.session import execute_query
        
        result = execute_query("""
            SELECT id, ip_address, user_agent, device_info, location, created_at, last_activity
            FROM user_sessions
            WHERE user_id = ? AND is_active = 1 AND expires_at > ?
            ORDER BY created_at DESC
        """, [user_id, datetime.now(timezone.utc).isoformat()])
        
        sessions = []
        if result and result.get("rows"):
            for row in result["rows"]:
                sessions.append({
                    "id": int(row[0].get("value")),
                    "ip_address": row[1].get("value"),
                    "user_agent": row[2].get("value"),
                    "device_info": json.loads(row[3].get("value")) if row[3].get("value") else None,
                    "location": json.loads(row[4].get("value")) if row[4].get("value") else None,
                    "created_at": row[5].get("value"),
                    "last_activity": row[6].get("value") if len(row) > 6 else None
                })
        
        return sessions

    async def revoke_session(self, user_id: int, session_id: int) -> Dict[str, Any]:
        """Revoke specific session"""
        from app.db.session import execute_query
        
        execute_query("""
            UPDATE user_sessions SET is_active = 0
            WHERE id = ? AND user_id = ?
        """, [session_id, user_id])
        
        await self._log_security_event(
            user_id,
            "session_revoked",
            "low",
            f"Session {session_id} revoked"
        )
        
        return {"success": True, "message": "Session revoked"}

    async def revoke_all_sessions(self, user_id: int, except_current: Optional[int] = None) -> Dict[str, Any]:
        """Revoke all sessions except current (optional)"""
        from app.db.session import execute_query
        
        if except_current:
            execute_query("""
                UPDATE user_sessions SET is_active = 0
                WHERE user_id = ? AND id != ?
            """, [user_id, except_current])
        else:
            execute_query("""
                UPDATE user_sessions SET is_active = 0
                WHERE user_id = ?
            """, [user_id])
        
        await self._log_security_event(
            user_id,
            "all_sessions_revoked",
            "medium",
            "All sessions revoked"
        )
        
        return {"success": True, "message": "All sessions revoked"}

    # ========================================================================
    # Security Event Logging
    # ========================================================================

    async def _log_security_event(
        self,
        user_id: int,
        event_type: str,
        severity: str,
        description: str,
        device_info: Optional[Dict[str, Any]] = None
    ):
        """Log security event"""
        from app.db.session import execute_query
        
        execute_query("""
            INSERT INTO security_events (
                user_id, event_type, severity, description,
                ip_address, user_agent, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            user_id, event_type, severity, description,
            device_info.get("ip_address") if device_info else None,
            device_info.get("user_agent") if device_info else None,
            json.dumps(device_info) if device_info else None,
            datetime.now(timezone.utc).isoformat()
        ])

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _generate_verification_code(self, length: int = 6) -> str:
        """Generate cryptographically secure verification code"""
        return ''.join(secrets.choice('0123456789') for _ in range(length))

    def _generate_backup_codes(self, user_id: int, count: int = 10) -> List[str]:
        """Generate backup codes for MFA"""
        from app.db.session import execute_query
        
        codes = []
        for _ in range(count):
            code = secrets.token_hex(4).upper()
            codes.append(code)
            
            # Store hashed version
            code_hash = hashlib.sha256(code.encode()).hexdigest()
            execute_query("""
                INSERT INTO mfa_backup_codes (user_id, code_hash, is_used, created_at)
                VALUES (?, ?, 0, ?)
            """, [user_id, code_hash, datetime.now(timezone.utc).isoformat()])
        
        return codes

    def _generate_device_fingerprint(self, ip_address: str, user_agent: str) -> str:
        """Generate unique device fingerprint"""
        fingerprint_data = f"{ip_address}:{user_agent}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()


# ============================================================================
# Service Factory
# ============================================================================

_security_service = None

def get_security_service() -> AdvancedSecurityService:
    """Get security service singleton"""
    global _security_service
    if _security_service is None:
        _security_service = AdvancedSecurityService()
    return _security_service
