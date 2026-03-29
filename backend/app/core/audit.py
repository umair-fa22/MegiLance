"""
@AI-HINT: Audit logging middleware for compliance and security monitoring
Tracks all API requests, user actions, and security events
"""

import logging
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from functools import wraps
logger = logging.getLogger(__name__)

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings


class AuditLogger:
    """
    Structured audit logging for compliance and security.
    Logs are formatted for easy parsing by log aggregation systems.
    """

    def __init__(self):
        self.settings = get_settings()

    def log(
        self,
        event_type: str,
        action: str,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        severity: str = "info",
    ) -> None:
        """
        Log an audit event.
        
        Args:
            event_type: Category of event (auth, data, admin, security)
            action: Specific action performed
            user_id: ID of user performing action
            resource_type: Type of resource affected
            resource_id: ID of resource affected
            request_id: Unique request identifier
            ip_address: Client IP address
            user_agent: Client user agent
            details: Additional event details
            status: success, failure, error
            severity: debug, info, warning, error, critical
        """
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "event_type": event_type,
            "action": action,
            "status": status,
            "severity": severity,
            "environment": self.settings.environment,
        }

        if user_id:
            log_entry["user_id"] = user_id
        if resource_type:
            log_entry["resource_type"] = resource_type
        if resource_id:
            log_entry["resource_id"] = resource_id
        if request_id:
            log_entry["request_id"] = request_id
        if ip_address:
            log_entry["ip_address"] = ip_address
        if user_agent:
            log_entry["user_agent"] = user_agent[:200] if user_agent else None
        if details:
            log_entry["details"] = details

        # Output as JSON for log aggregation
        logger.info(json.dumps(log_entry))

    def auth_event(
        self,
        action: str,
        user_id: Optional[int] = None,
        email: Optional[str] = None,
        success: bool = True,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """Log authentication-related events"""
        details = {}
        if email:
            # Mask email for privacy
            parts = email.split("@")
            if len(parts) == 2:
                masked = parts[0][:2] + "***@" + parts[1]
                details["email_masked"] = masked
        if reason:
            details["reason"] = reason

        self.log(
            event_type="auth",
            action=action,
            user_id=user_id,
            status="success" if success else "failure",
            severity="info" if success else "warning",
            ip_address=ip_address,
            details=details if details else None,
        )

    def data_event(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: int,
        changes: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log data modification events"""
        self.log(
            event_type="data",
            action=action,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details={"changes": changes} if changes else None,
        )

    def security_event(
        self,
        action: str,
        severity: str = "warning",
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log security-related events"""
        self.log(
            event_type="security",
            action=action,
            user_id=user_id,
            ip_address=ip_address,
            severity=severity,
            details=details,
        )

    def admin_event(
        self,
        action: str,
        admin_id: int,
        target_user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log administrative actions"""
        event_details = details or {}
        if target_user_id:
            event_details["target_user_id"] = target_user_id

        self.log(
            event_type="admin",
            action=action,
            user_id=admin_id,
            resource_type=resource_type,
            resource_id=resource_id,
            severity="info",
            details=event_details if event_details else None,
        )


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically log all HTTP requests.
    """

    def __init__(self, app, audit_logger: AuditLogger):
        super().__init__(app)
        self.audit_logger = audit_logger

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
        start_time = time.time()

        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)

        # Log request (skip health checks and static files)
        path = request.url.path
        if not self._should_skip(path):
            self.audit_logger.log(
                event_type="request",
                action=f"{request.method} {path}",
                request_id=request_id,
                ip_address=ip_address,
                user_agent=user_agent,
                status="success" if response.status_code < 400 else "failure",
                severity="info" if response.status_code < 400 else "warning",
                details={
                    "method": request.method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        return response

    def _should_skip(self, path: str) -> bool:
        """Skip logging for certain paths"""
        skip_paths = [
            "/api/health",
            "/api/docs",
            "/api/redoc",
            "/api/openapi.json",
            "/_next",
            "/favicon",
            "/static",
        ]
        return any(path.startswith(p) for p in skip_paths)


# Singleton instance
audit_logger = AuditLogger()


def audit_action(
    event_type: str,
    action: str,
    resource_type: Optional[str] = None,
):
    """
    Decorator to automatically audit function calls.
    
    Usage:
        @audit_action("data", "create", "project")
        def create_project(project_data, current_user):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                # Extract user_id from kwargs if available
                user_id = None
                if "current_user" in kwargs:
                    user_id = getattr(kwargs["current_user"], "id", None)
                
                audit_logger.log(
                    event_type=event_type,
                    action=action,
                    resource_type=resource_type,
                    user_id=user_id,
                    status="success",
                )
                return result
            except Exception as e:
                audit_logger.log(
                    event_type=event_type,
                    action=action,
                    resource_type=resource_type,
                    status="error",
                    severity="error",
                    details={"error": str(e)},
                )
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                user_id = None
                if "current_user" in kwargs:
                    user_id = getattr(kwargs["current_user"], "id", None)
                
                audit_logger.log(
                    event_type=event_type,
                    action=action,
                    resource_type=resource_type,
                    user_id=user_id,
                    status="success",
                )
                return result
            except Exception as e:
                audit_logger.log(
                    event_type=event_type,
                    action=action,
                    resource_type=resource_type,
                    status="error",
                    severity="error",
                    details={"error": str(e)},
                )
                raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
