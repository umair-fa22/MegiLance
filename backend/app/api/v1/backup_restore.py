# @AI-HINT: Backup and restore API endpoints
"""
Backup & Restore API - Data backup and restoration endpoints.

Features:
- Create backups
- Download backups
- Restore from backups
- Scheduled backups
- Storage management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel

from app.core.security import get_current_active_user, require_admin
from app.services.backup_restore import (
    get_backup_restore_service,
    BackupType,
    BackupStatus,
    DataCategory
)

router = APIRouter(prefix="/backup", tags=["backup"])


# Request/Response Models
class CreateBackupRequest(BaseModel):
    backup_type: BackupType = BackupType.FULL
    categories: Optional[List[DataCategory]] = None
    encrypt: bool = True
    compression: bool = True


class RestoreRequest(BaseModel):
    backup_id: str
    categories: Optional[List[DataCategory]] = None
    overwrite: bool = False


class SetScheduleRequest(BaseModel):
    enabled: bool
    frequency: str  # daily, weekly, monthly
    time_utc: str
    day_of_week: Optional[str] = None
    day_of_month: Optional[int] = None
    backup_type: BackupType = BackupType.INCREMENTAL
    categories: Optional[List[DataCategory]] = None
    retention_days: int = 90


class CleanupRequest(BaseModel):
    older_than_days: int = 90


# Backup Endpoints
@router.post("/create")
async def create_backup(
    request: CreateBackupRequest,
    current_user = Depends(require_admin)
):
    """Create a new backup."""
    service = get_backup_restore_service()
    
    backup = await service.create_backup(
        user_id=current_user["id"],
        backup_type=request.backup_type,
        categories=request.categories,
        encrypt=request.encrypt,
        compression=request.compression
    )
    
    return {"backup": backup}


@router.get("/{backup_id}/status")
async def get_backup_status(
    backup_id: str,
    current_user = Depends(require_admin)
):
    """Get status of a backup."""
    service = get_backup_restore_service()
    status = await service.get_backup_status(current_user["id"], backup_id)
    return status


@router.get("/list")
async def list_backups(
    status: Optional[BackupStatus] = None,
    limit: int = 10,
    current_user = Depends(require_admin)
):
    """List user's backups."""
    service = get_backup_restore_service()
    backups = await service.list_backups(current_user["id"], status, limit)
    return {"backups": backups}


@router.get("/{backup_id}/download")
async def download_backup(
    backup_id: str,
    current_user = Depends(require_admin)
):
    """Get download link for backup."""
    service = get_backup_restore_service()
    result = await service.download_backup(current_user["id"], backup_id)
    return result


@router.delete("/{backup_id}")
async def delete_backup(
    backup_id: str,
    current_user = Depends(require_admin)
):
    """Delete a backup."""
    service = get_backup_restore_service()
    success = await service.delete_backup(current_user["id"], backup_id)
    return {"success": success}


# Restore Endpoints
@router.post("/restore")
async def restore_from_backup(
    request: RestoreRequest,
    current_user = Depends(require_admin)
):
    """Restore data from backup."""
    service = get_backup_restore_service()
    
    result = await service.restore_from_backup(
        user_id=current_user["id"],
        backup_id=request.backup_id,
        categories=request.categories,
        overwrite=request.overwrite
    )
    
    return result


@router.get("/restore/{restore_id}/status")
async def get_restore_status(
    restore_id: str,
    current_user = Depends(require_admin)
):
    """Get status of a restore operation."""
    service = get_backup_restore_service()
    status = await service.get_restore_status(current_user["id"], restore_id)
    return status


@router.get("/{backup_id}/preview")
async def preview_restore(
    backup_id: str,
    current_user = Depends(require_admin)
):
    """Preview what will be restored."""
    service = get_backup_restore_service()
    preview = await service.preview_restore(current_user["id"], backup_id)
    return preview


# Schedule Endpoints
@router.get("/schedule")
async def get_backup_schedule(
    current_user = Depends(require_admin)
):
    """Get user's backup schedule."""
    service = get_backup_restore_service()
    schedule = await service.get_backup_schedule(current_user["id"])
    return {"schedule": schedule}


@router.put("/schedule")
async def set_backup_schedule(
    request: SetScheduleRequest,
    current_user = Depends(require_admin)
):
    """Set user's backup schedule."""
    service = get_backup_restore_service()
    
    schedule = await service.set_backup_schedule(
        user_id=current_user["id"],
        enabled=request.enabled,
        frequency=request.frequency,
        time_utc=request.time_utc,
        day_of_week=request.day_of_week,
        day_of_month=request.day_of_month,
        backup_type=request.backup_type,
        categories=request.categories,
        retention_days=request.retention_days
    )
    
    return {"schedule": schedule}


# Storage Endpoints
@router.get("/storage")
async def get_storage_usage(
    current_user = Depends(require_admin)
):
    """Get backup storage usage."""
    service = get_backup_restore_service()
    usage = await service.get_storage_usage(current_user["id"])
    return {"storage": usage}


@router.post("/cleanup")
async def cleanup_old_backups(
    request: CleanupRequest,
    current_user = Depends(require_admin)
):
    """Clean up old backups."""
    service = get_backup_restore_service()
    result = await service.cleanup_old_backups(current_user["id"], request.older_than_days)
    return result


# Migration Export
@router.post("/export-migration")
async def export_for_migration(
    format: str = "json",
    current_user = Depends(require_admin)
):
    """Export all data for platform migration."""
    service = get_backup_restore_service()
    result = await service.export_for_migration(current_user["id"], format)
    return result
