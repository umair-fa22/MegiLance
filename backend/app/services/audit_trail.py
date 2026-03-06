# @AI-HINT: Comprehensive audit trail system for compliance and security (Turso DB-backed)
"""Audit Trail Service - Complete audit logging and compliance system."""

import logging
import hashlib
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from collections import defaultdict

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)

_audit_table_ensured = False

def _ensure_audit_table():
    global _audit_table_ensured
    if _audit_table_ensured:
        return
    execute_query("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            action TEXT NOT NULL,
            category TEXT NOT NULL,
            resource_type TEXT,
            resource_id TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            severity TEXT DEFAULT 'info',
            metadata TEXT,
            hash TEXT,
            previous_hash TEXT,
            created_at TEXT NOT NULL
        )
    """, [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)", [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(category)", [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)", [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)", [])
    _audit_table_ensured = True


class AuditCategory(str, Enum):
    """Audit log categories."""
    AUTH = "authentication"
    USER = "user_management"
    PROJECT = "project"
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    PAYMENT = "payment"
    MESSAGE = "message"
    FILE = "file"
    ADMIN = "admin"
    SYSTEM = "system"
    SECURITY = "security"
    DATA = "data_access"


class AuditAction(str, Enum):
    """Audit action types."""
    # Auth actions
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR_ENABLED = "2fa_enabled"
    TWO_FACTOR_DISABLED = "2fa_disabled"
    SESSION_REVOKED = "session_revoked"
    
    # User actions
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_VERIFY = "user_verify"
    USER_SUSPEND = "user_suspend"
    USER_RESTORE = "user_restore"
    PROFILE_VIEW = "profile_view"
    
    # Project actions
    PROJECT_CREATE = "project_create"
    PROJECT_UPDATE = "project_update"
    PROJECT_DELETE = "project_delete"
    PROJECT_PUBLISH = "project_publish"
    PROJECT_CLOSE = "project_close"
    
    # Proposal actions
    PROPOSAL_SUBMIT = "proposal_submit"
    PROPOSAL_UPDATE = "proposal_update"
    PROPOSAL_WITHDRAW = "proposal_withdraw"
    PROPOSAL_ACCEPT = "proposal_accept"
    PROPOSAL_REJECT = "proposal_reject"
    
    # Contract actions
    CONTRACT_CREATE = "contract_create"
    CONTRACT_UPDATE = "contract_update"
    CONTRACT_COMPLETE = "contract_complete"
    CONTRACT_CANCEL = "contract_cancel"
    MILESTONE_CREATE = "milestone_create"
    MILESTONE_COMPLETE = "milestone_complete"
    
    # Payment actions
    PAYMENT_INITIATE = "payment_initiate"
    PAYMENT_COMPLETE = "payment_complete"
    PAYMENT_FAILED = "payment_failed"
    REFUND_INITIATE = "refund_initiate"
    REFUND_COMPLETE = "refund_complete"
    ESCROW_FUND = "escrow_fund"
    ESCROW_RELEASE = "escrow_release"
    WITHDRAWAL_REQUEST = "withdrawal_request"
    WITHDRAWAL_COMPLETE = "withdrawal_complete"
    
    # File actions
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    FILE_DELETE = "file_delete"
    FILE_SHARE = "file_share"
    
    # Admin actions
    ADMIN_ACCESS = "admin_access"
    USER_ROLE_CHANGE = "user_role_change"
    SETTING_CHANGE = "setting_change"
    DATA_EXPORT = "data_export"
    DATA_DELETE = "data_delete"
    
    # Security actions
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_HIT = "rate_limit_hit"
    PERMISSION_DENIED = "permission_denied"
    IP_BLOCKED = "ip_blocked"
    
    # Data access
    DATA_READ = "data_read"
    DATA_WRITE = "data_write"
    SEARCH_QUERY = "search_query"
    REPORT_GENERATE = "report_generate"


class AuditSeverity(str, Enum):
    """Audit log severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditTrailService:
    """
    Comprehensive audit trail and logging system.
    
    Provides tamper-evident logging, compliance reporting,
    and security monitoring capabilities.
    """
    
    # Actions that require extra scrutiny
    HIGH_RISK_ACTIONS = [
        AuditAction.PASSWORD_CHANGE,
        AuditAction.TWO_FACTOR_DISABLED,
        AuditAction.USER_DELETE,
        AuditAction.PAYMENT_INITIATE,
        AuditAction.REFUND_INITIATE,
        AuditAction.WITHDRAWAL_REQUEST,
        AuditAction.ADMIN_ACCESS,
        AuditAction.DATA_EXPORT,
        AuditAction.DATA_DELETE,
        AuditAction.USER_ROLE_CHANGE
    ]
    
    # Default retention days by category
    RETENTION_DAYS = {
        AuditCategory.AUTH: 365,
        AuditCategory.PAYMENT: 2555,  # 7 years for financial
        AuditCategory.ADMIN: 2555,
        AuditCategory.SECURITY: 730,
        AuditCategory.DATA: 365,
        "default": 180
    }
    
    def __init__(self, db=None):
        _ensure_audit_table()
        self._last_hash = self._get_last_hash()
    
    def _get_last_hash(self) -> str:
        """Get the last hash in the chain from DB."""
        result = execute_query(
            "SELECT hash FROM audit_logs ORDER BY created_at DESC LIMIT 1", []
        )
        if result and result.get("rows"):
            rows = parse_rows(result)
            if rows and rows[0].get("hash"):
                return rows[0]["hash"]
        return "genesis"
    
    async def log(
        self,
        user_id: Optional[int],
        action: AuditAction,
        category: AuditCategory,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.INFO,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Log an audit event to the database."""
        log_id = f"audit_{secrets.token_hex(12)}"
        timestamp = datetime.now(timezone.utc).isoformat()
        
        entry = {
            "id": log_id,
            "user_id": user_id,
            "action": action.value,
            "category": category.value,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "severity": severity.value,
            "metadata": metadata or {},
            "timestamp": timestamp,
            "hash": None,
            "previous_hash": self._last_hash
        }
        
        entry["hash"] = self._calculate_hash(entry)
        self._last_hash = entry["hash"]
        
        execute_query(
            """INSERT INTO audit_logs (id, user_id, action, category, resource_type,
               resource_id, details, ip_address, user_agent, severity, metadata,
               hash, previous_hash, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [log_id, user_id, action.value, category.value, resource_type,
             resource_id, json.dumps(details) if details else None,
             ip_address, user_agent, severity.value,
             json.dumps(metadata) if metadata else None,
             entry["hash"], entry["previous_hash"], timestamp]
        )
        
        if action in self.HIGH_RISK_ACTIONS:
            await self._trigger_high_risk_alert(entry)
        
        logger.debug(f"Audit log: {action.value} by user {user_id}")
        return entry
    
    async def get_logs(
        self,
        user_id: Optional[int] = None,
        category: Optional[AuditCategory] = None,
        action: Optional[AuditAction] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        severity: Optional[AuditSeverity] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        ip_address: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Query audit logs with filters from DB."""
        where_clauses = ["1=1"]
        params: List[Any] = []
        
        if user_id is not None:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        if category:
            where_clauses.append("category = ?")
            params.append(category.value)
        if action:
            where_clauses.append("action = ?")
            params.append(action.value)
        if resource_type:
            where_clauses.append("resource_type = ?")
            params.append(resource_type)
        if resource_id:
            where_clauses.append("resource_id = ?")
            params.append(resource_id)
        if severity:
            where_clauses.append("severity = ?")
            params.append(severity.value)
        if ip_address:
            where_clauses.append("ip_address = ?")
            params.append(ip_address)
        if start_date:
            where_clauses.append("created_at >= ?")
            params.append(start_date.isoformat())
        if end_date:
            where_clauses.append("created_at <= ?")
            params.append(end_date.isoformat())
        
        where_sql = " AND ".join(where_clauses)
        
        # Get total count
        count_result = execute_query(
            f"SELECT COUNT(*) as total FROM audit_logs WHERE {where_sql}", list(params)
        )
        total = 0
        if count_result and count_result.get("rows"):
            rows = parse_rows(count_result)
            if rows:
                total = rows[0].get("total", 0)
        
        # Get logs
        all_params = list(params) + [limit, offset]
        result = execute_query(
            f"""SELECT id, user_id, action, category, resource_type, resource_id,
                details, ip_address, user_agent, severity, metadata, hash,
                previous_hash, created_at as timestamp
                FROM audit_logs WHERE {where_sql}
                ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            all_params
        )
        
        logs = []
        if result and result.get("rows"):
            logs = parse_rows(result)
            for log in logs:
                for field in ("details", "metadata"):
                    if log.get(field):
                        try:
                            log[field] = json.loads(log[field])
                        except (json.JSONDecodeError, ValueError):
                            log[field] = {}
                    else:
                        log[field] = {}
        
        return {
            "logs": logs,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    
    async def get_user_activity(
        self,
        user_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get user activity summary from DB."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await self.get_logs(user_id=user_id, start_date=start_date, limit=1000)
        logs = result["logs"]
        
        activity: Dict[str, Any] = {
            "total_actions": len(logs),
            "by_category": defaultdict(int),
            "by_action": defaultdict(int),
            "by_day": defaultdict(int),
            "unique_ips": set(),
            "last_login": None,
            "last_activity": None,
            "high_risk_actions": []
        }
        
        for log in logs:
            activity["by_category"][log["category"]] += 1
            activity["by_action"][log["action"]] += 1
            ts = log.get("timestamp", "")
            activity["by_day"][ts[:10]] += 1
            if log.get("ip_address"):
                activity["unique_ips"].add(log["ip_address"])
            if log["action"] == AuditAction.LOGIN.value and not activity["last_login"]:
                activity["last_login"] = ts
            if not activity["last_activity"]:
                activity["last_activity"] = ts
            try:
                action_enum = AuditAction(log["action"])
                if action_enum in self.HIGH_RISK_ACTIONS:
                    activity["high_risk_actions"].append({
                        "action": log["action"],
                        "timestamp": ts,
                        "details": log.get("details", {})
                    })
            except ValueError:
                pass
        
        activity["unique_ips"] = list(activity["unique_ips"])
        activity["by_category"] = dict(activity["by_category"])
        activity["by_action"] = dict(activity["by_action"])
        activity["by_day"] = dict(activity["by_day"])
        return activity
    
    async def verify_integrity(
        self,
        start_index: int = 0,
        end_index: Optional[int] = None
    ) -> Dict[str, Any]:
        """Verify audit log integrity (detect tampering) from DB."""
        result = execute_query(
            "SELECT id, user_id, action, category, resource_type, resource_id, "
            "details, ip_address, user_agent, severity, metadata, hash, "
            "previous_hash, created_at as timestamp "
            "FROM audit_logs ORDER BY created_at ASC LIMIT ? OFFSET ?",
            [(end_index or 10000) - start_index, start_index]
        )
        
        logs = []
        if result and result.get("rows"):
            logs = parse_rows(result)
            for log in logs:
                for field in ("details", "metadata"):
                    if log.get(field):
                        try:
                            log[field] = json.loads(log[field])
                        except (json.JSONDecodeError, ValueError):
                            log[field] = {}
                    else:
                        log[field] = {}
        
        issues = []
        previous_hash = logs[0]["previous_hash"] if logs else "genesis"
        
        for i, log in enumerate(logs):
            if log.get("previous_hash") != previous_hash:
                issues.append({
                    "index": start_index + i,
                    "log_id": log["id"],
                    "issue": "Hash chain broken",
                    "expected_previous": previous_hash,
                    "actual_previous": log.get("previous_hash")
                })
            expected_hash = self._calculate_hash(log)
            if log.get("hash") != expected_hash:
                issues.append({
                    "index": start_index + i,
                    "log_id": log["id"],
                    "issue": "Log hash mismatch (possible tampering)",
                    "expected_hash": expected_hash,
                    "actual_hash": log.get("hash")
                })
            previous_hash = log.get("hash", "")
        
        return {
            "verified_count": len(logs),
            "integrity_valid": len(issues) == 0,
            "issues": issues
        }
    
    async def export_logs(
        self,
        format: str = "json",
        filters: Optional[Dict[str, Any]] = None,
        include_hashes: bool = False
    ) -> Dict[str, Any]:
        """Export audit logs for compliance."""
        result = await self.get_logs(**(filters or {}), limit=10000)
        logs = result["logs"]
        
        if not include_hashes:
            logs = [{k: v for k, v in log.items()
                    if k not in ["hash", "previous_hash"]} for log in logs]
        
        export = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "total_records": len(logs),
            "format": format,
            "filters_applied": filters,
            "logs": logs
        }
        
        await self.log(
            user_id=None,
            action=AuditAction.DATA_EXPORT,
            category=AuditCategory.ADMIN,
            details={"format": format, "record_count": len(logs), "filters": filters},
            severity=AuditSeverity.WARNING
        )
        return export
    
    async def get_statistics(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get audit log statistics from DB."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await self.get_logs(start_date=start_date, limit=10000)
        logs = result["logs"]
        
        stats: Dict[str, Any] = {
            "period_days": days,
            "total_events": len(logs),
            "by_category": defaultdict(int),
            "by_action": defaultdict(int),
            "by_severity": defaultdict(int),
            "by_day": defaultdict(int),
            "unique_users": set(),
            "unique_ips": set(),
            "high_risk_count": 0,
            "failed_auth_count": 0
        }
        
        for log in logs:
            stats["by_category"][log["category"]] += 1
            stats["by_action"][log["action"]] += 1
            stats["by_severity"][log.get("severity", "info")] += 1
            stats["by_day"][log.get("timestamp", "")[:10]] += 1
            if log.get("user_id"):
                stats["unique_users"].add(log["user_id"])
            if log.get("ip_address"):
                stats["unique_ips"].add(log["ip_address"])
            if log["action"] == AuditAction.LOGIN_FAILED.value:
                stats["failed_auth_count"] += 1
            try:
                action_enum = AuditAction(log["action"])
                if action_enum in self.HIGH_RISK_ACTIONS:
                    stats["high_risk_count"] += 1
            except ValueError:
                pass
        
        stats["unique_users"] = len(stats["unique_users"])
        stats["unique_ips"] = len(stats["unique_ips"])
        stats["by_category"] = dict(stats["by_category"])
        stats["by_action"] = dict(stats["by_action"])
        stats["by_severity"] = dict(stats["by_severity"])
        stats["by_day"] = dict(stats["by_day"])
        return stats
    
    async def cleanup_old_logs(
        self,
        category: Optional[AuditCategory] = None
    ) -> Dict[str, Any]:
        """Clean up logs past retention period from DB."""
        now = datetime.now(timezone.utc)
        deleted_count = 0
        
        for cat, days in self.RETENTION_DAYS.items():
            if cat == "default":
                continue
            if category and cat != category:
                continue
            cutoff = (now - timedelta(days=days)).isoformat()
            result = execute_query(
                "SELECT COUNT(*) as cnt FROM audit_logs WHERE category = ? AND created_at < ?",
                [cat.value, cutoff]
            )
            cnt = 0
            if result and result.get("rows"):
                rows = parse_rows(result)
                if rows:
                    cnt = rows[0].get("cnt", 0)
            if cnt > 0:
                execute_query(
                    "DELETE FROM audit_logs WHERE category = ? AND created_at < ?",
                    [cat.value, cutoff]
                )
                deleted_count += cnt
        
        # Handle uncategorized with default retention
        if not category:
            default_cutoff = (now - timedelta(days=self.RETENTION_DAYS["default"])).isoformat()
            known_cats = [c.value for c in self.RETENTION_DAYS.keys() if c != "default"]
            placeholders = ",".join(["?"] * len(known_cats))
            result = execute_query(
                f"SELECT COUNT(*) as cnt FROM audit_logs WHERE category NOT IN ({placeholders}) AND created_at < ?",
                known_cats + [default_cutoff]
            )
            cnt = 0
            if result and result.get("rows"):
                rows = parse_rows(result)
                if rows:
                    cnt = rows[0].get("cnt", 0)
            if cnt > 0:
                execute_query(
                    f"DELETE FROM audit_logs WHERE category NOT IN ({placeholders}) AND created_at < ?",
                    known_cats + [default_cutoff]
                )
                deleted_count += cnt
        
        remaining_result = execute_query("SELECT COUNT(*) as cnt FROM audit_logs", [])
        remaining = 0
        if remaining_result and remaining_result.get("rows"):
            rows = parse_rows(remaining_result)
            if rows:
                remaining = rows[0].get("cnt", 0)
        
        return {
            "deleted_count": deleted_count,
            "remaining_count": remaining
        }
    
    async def get_security_alerts(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """Get recent security-related events from DB."""
        start_date = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        result = await self.get_logs(
            category=AuditCategory.SECURITY, start_date=start_date, limit=500
        )
        security_logs = result["logs"]
        
        auth_result = await self.get_logs(
            action=AuditAction.LOGIN_FAILED, start_date=start_date, limit=500
        )
        
        all_security = {l["id"]: l for l in security_logs + auth_result["logs"]}
        
        alerts: Dict[str, Any] = {
            "period_hours": hours,
            "total_alerts": len(all_security),
            "failed_logins": len(auth_result["logs"]),
            "by_ip": defaultdict(int),
            "by_action": defaultdict(int),
            "events": list(all_security.values())[:100]
        }
        
        for log in all_security.values():
            if log.get("ip_address"):
                alerts["by_ip"][log["ip_address"]] += 1
            alerts["by_action"][log["action"]] += 1
        
        alerts["suspicious_ips"] = [
            ip for ip, count in alerts["by_ip"].items() if count >= 5
        ]
        alerts["by_ip"] = dict(alerts["by_ip"])
        alerts["by_action"] = dict(alerts["by_action"])
        return alerts
    
    def _calculate_hash(self, entry: Dict) -> str:
        """Calculate hash for log entry (excluding hash field)."""
        data_to_hash = {
            k: v for k, v in entry.items() if k != "hash"
        }
        data_string = json.dumps(data_to_hash, sort_keys=True)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    async def _trigger_high_risk_alert(self, entry: Dict) -> None:
        """Trigger alert for high-risk actions."""
        # Would integrate with alerting system (email, Slack, etc.)
        logger.warning(
            f"High-risk action detected: {entry['action']} "
            f"by user {entry['user_id']} from {entry['ip_address']}"
        )


# Singleton instance
_audit_service: Optional[AuditTrailService] = None


def get_audit_service(db=None) -> AuditTrailService:
    """Get or create audit service instance."""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditTrailService()
    return _audit_service
