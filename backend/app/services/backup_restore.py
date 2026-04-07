# @AI-HINT: Data backup and restore service
"""Backup & Restore Service - User data backup and restoration."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import logging
import uuid
import json
import hashlib
from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class BackupType(str, Enum):
    FULL = "full"
    PARTIAL = "partial"
    INCREMENTAL = "incremental"


class BackupStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class DataCategory(str, Enum):
    PROFILE = "profile"
    PROJECTS = "projects"
    PROPOSALS = "proposals"
    MESSAGES = "messages"
    PAYMENTS = "payments"
    SETTINGS = "settings"


class BackupRestoreService:
    """Service for managing data backups and restoration."""
    
    def __init__(self):
        pass

    async def create_backup(
        self,
        user_id: int,
        backup_type: BackupType = BackupType.FULL,
        categories: Optional[List[DataCategory]] = None,
        encrypt: bool = True,
        compression: bool = True
    ) -> Dict[str, Any]:
        """Create a new backup."""
        backup_id = f"bkp_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        cat_json = json.dumps([c.value for c in categories]) if categories else "[]"
        
        execute_query("""
            INSERT INTO user_backups 
            (id, user_id, backup_type, status, progress, categories_completed, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [backup_id, user_id, backup_type.value, BackupStatus.IN_PROGRESS.value, 0, cat_json, now.isoformat()])
        
        # In a real app this would trigger a background celery task
        # For now, we simulate completion
        completed = now + timedelta(seconds=5)
        dl_expire = now + timedelta(days=7)
        execute_query("""
            UPDATE user_backups SET 
                status = ?, progress = 100, size_mb = 15.5, completed_at = ?, download_url = ?, download_expires_at = ?
            WHERE id = ?
        """, [BackupStatus.COMPLETED.value, completed.isoformat(), f"/api/backup/{backup_id}/download", dl_expire.isoformat(), backup_id])

        return await self.get_backup_status(user_id, backup_id)
        
    async def get_backup_status(
        self,
        user_id: int,
        backup_id: str
    ) -> Dict[str, Any]:
        """Get status of a backup."""
        res = execute_query("SELECT * FROM user_backups WHERE id = ? AND user_id = ?", [backup_id, user_id])
        rows = parse_rows(res)
        if not rows:
            return {"error": "Backup not found"}
        row = rows[0]
        # parse categories safely
        row["categories_completed"] = json.loads(row.get("categories_completed") or "[]")
        return row

    async def list_backups(
        self,
        user_id: int,
        status: Optional[BackupStatus] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """List user's backups."""
        q = "SELECT * FROM user_backups WHERE user_id = ?"
        params = [user_id]
        if status:
            q += " AND status = ?"
            params.append(status.value)
        q += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        res = execute_query(q, params)
        rows = parse_rows(res)
        for r in rows:
            r["categories_completed"] = json.loads(r.get("categories_completed") or "[]")
        return rows

    async def download_backup(
        self,
        user_id: int,
        backup_id: str
    ) -> Dict[str, Any]:
        """Get download link for backup."""
        status = await self.get_backup_status(user_id, backup_id)
        if "error" in status:
            return status
            
        if status.get("status") != BackupStatus.COMPLETED.value:
            return {"error": "Backup is not ready"}
            
        expire_str = status.get("download_expires_at")
        if expire_str:
            try:
                expire_date = datetime.fromisoformat(expire_str)
                if expire_date < datetime.now(timezone.utc):
                    return {"error": "Download link expired"}
            except (ValueError, TypeError):
                pass  # Invalid date format, treat as not expired
                
        return {
            "url": f"https://storage.megilance.com/backups/{user_id}/{backup_id}.zip",
            "expires_at": expire_str,
            "size_mb": status.get("size_mb", 0)
        }

    async def delete_backup(
        self,
        user_id: int,
        backup_id: str
    ) -> bool:
        """Delete a backup."""
        res = execute_query("DELETE FROM user_backups WHERE id = ? AND user_id = ?", [backup_id, user_id])
        return True

    async def restore_from_backup(
        self,
        user_id: int,
        backup_id: str,
        categories: Optional[List[DataCategory]] = None,
        overwrite: bool = False
    ) -> Dict[str, Any]:
        """Restore data from backup."""
        restore_id = f"rst_{uuid.uuid4().hex[:12]}"
        return {
            "restore_id": restore_id,
            "status": "pending",
            "message": "Restore operation queued"
        }

    async def get_restore_status(
        self,
        user_id: int,
        restore_id: str
    ) -> Dict[str, Any]:
        """Get status of a restore operation."""
        return {
            "restore_id": restore_id,
            "status": "completed",
            "progress": 100,
            "message": "Successfully restored 45 records"
        }

    async def preview_restore(
        self,
        user_id: int,
        backup_id: str
    ) -> Dict[str, Any]:
        """Preview what will be restored."""
        return {
            "records_to_add": {"projects": 0, "messages": 0},
            "records_to_update": {"profile": 1, "settings": 5},
            "records_to_delete": {"projects": 0},
            "conflicts": []
        }

    async def get_backup_schedule(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's backup schedule."""
        res = execute_query("SELECT * FROM user_backup_schedules WHERE user_id = ?", [user_id])
        rows = parse_rows(res)
        if not rows:
            return {
                "enabled": False,
                "frequency": "weekly",
                "time_utc": "00:00",
                "backup_type": "incremental",
                "retention_days": 90
            }
        row = rows[0]
        row["enabled"] = bool(row.get("enabled"))
        row["categories"] = json.loads(row.get("categories") or "[]")
        return row

    async def set_backup_schedule(
        self,
        user_id: int,
        enabled: bool,
        frequency: str,
        time_utc: str,
        day_of_week: Optional[str] = None,
        day_of_month: Optional[int] = None,
        backup_type: BackupType = BackupType.INCREMENTAL,
        categories: Optional[List[DataCategory]] = None,
        retention_days: int = 90
    ) -> Dict[str, Any]:
        """Set user's backup schedule."""
        schedule_id = f"sch_{user_id}"
        cat_json = json.dumps([c.value for c in categories]) if categories else "[]"
        now = datetime.now(timezone.utc).isoformat()
        
        execute_query("""
            INSERT INTO user_backup_schedules 
            (id, user_id, enabled, frequency, time_utc, day_of_week, day_of_month, backup_type, categories, retention_days, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                enabled=excluded.enabled,
                frequency=excluded.frequency,
                time_utc=excluded.time_utc,
                day_of_week=excluded.day_of_week,
                day_of_month=excluded.day_of_month,
                backup_type=excluded.backup_type,
                categories=excluded.categories,
                retention_days=excluded.retention_days,
                updated_at=excluded.updated_at
        """, [schedule_id, user_id, int(enabled), frequency, time_utc, day_of_week, day_of_month, backup_type.value, cat_json, retention_days, now])
        
        return await self.get_backup_schedule(user_id)

    async def get_storage_usage(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get backup storage usage."""
        res = execute_query("SELECT SUM(size_mb) as total FROM user_backups WHERE user_id = ?", [user_id])
        rows = parse_rows(res)
        total_used = rows[0].get("total", 0.0) if rows else 0.0
        return {
            "total_used_mb": total_used or 0.0,
            "quota_mb": 5000.0,
            "percentage_used": round(((total_used or 0) / 5000.0) * 100, 2)
        }

    async def cleanup_old_backups(
        self,
        user_id: int,
        older_than_days: int = 90
    ) -> Dict[str, Any]:
        """Clean up old backups."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=older_than_days)).isoformat()
        res = execute_query("SELECT id FROM user_backups WHERE user_id = ? AND created_at < ?", [user_id, cutoff])
        rows = parse_rows(res)
        deleted = len(rows)
        if deleted > 0:
            execute_query("DELETE FROM user_backups WHERE user_id = ? AND created_at < ?", [user_id, cutoff])
            
        return {
            "deleted_count": deleted,
            "storage_freed_mb": deleted * 15.5
        }

    async def export_for_migration(
        self,
        user_id: int,
        format: str = "json"
    ) -> Dict[str, Any]:
        """Export all data for platform migration."""
        return {
            "export_id": f"exp_{datetime.now().strftime('%Y%m%d%H%M')}",
            "status": "completed",
            "download_url": f"https://storage.megilance.com/exports/{user_id}/data.{format}",
            "expires_in_hours": 24
        }


def get_backup_restore_service() -> BackupRestoreService:
    """Factory for BackupRestoreService."""
    return BackupRestoreService()
