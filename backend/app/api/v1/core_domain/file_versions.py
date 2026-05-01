# @AI-HINT: File versioning API - document version control endpoints
"""
File Versioning API - Document Version Control Endpoints

Provides:
- Upload versioned files
- Version history and rollback
- File locking
- Version comparison
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.services.file_versioning import file_versioning_service
from app.services.db_utils import sanitize_text


router = APIRouter()


# ============== Pydantic Models ==============

class VersionCommentRequest(BaseModel):
    """Request with version comment."""
    comment: Optional[str] = Field(None, max_length=500)


class CompareVersionsRequest(BaseModel):
    """Request to compare versions."""
    version_a: int
    version_b: int


# ============== File Management ==============

@router.post("")
async def create_versioned_file(
    file: UploadFile = File(...),
    resource_type: Optional[str] = Form(None),
    resource_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user = Depends(get_current_active_user),
    
):
    """
    Create a new versioned file.
    
    Optionally link to a resource (project, contract, etc.).
    """
    content = await file.read()
    
    result = await file_versioning_service.create_file(
        user_id=str(current_user.get("id")),
        filename=file.filename,
        content=content,
        mime_type=file.content_type or "application/octet-stream",
        resource_type=resource_type,
        resource_id=resource_id,
        description=sanitize_text(description, 500) if description else None
    )
    return result


@router.get("")
async def search_files(
    query: Optional[str] = Query(None, description="Search by filename"),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_active_user),
    
):
    """Search and list versioned files."""
    result = await file_versioning_service.search_files(
        user_id=str(current_user.get("id")),
        query=query,
        resource_type=resource_type,
        resource_id=resource_id,
        limit=limit
    )
    return result


@router.get("/{file_id}")
async def get_file(
    file_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Get file metadata and version summary."""
    try:
        result = await file_versioning_service.get_file(file_id=file_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Internal server error")


# ============== Version Management ==============

@router.post("/{file_id}/versions")
async def upload_new_version(
    file_id: str,
    file: UploadFile = File(...),
    comment: Optional[str] = Form(None),
    current_user = Depends(get_current_active_user),
    
):
    """
    Upload a new version of an existing file.
    
    File must not be locked by another user.
    """
    try:
        content = await file.read()
        
        result = await file_versioning_service.upload_new_version(
            user_id=str(current_user.get("id")),
            file_id=file_id,
            content=content,
            comment=sanitize_text(comment, 500) if comment else None
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Internal server error")


@router.get("/{file_id}/versions")
async def get_version_history(
    file_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_active_user),
    
):
    """Get version history for a file."""
    try:
        result = await file_versioning_service.get_version_history(
            file_id=file_id,
            limit=limit
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Internal server error")


@router.get("/{file_id}/versions/{version_number}")
async def get_version(
    file_id: str,
    version_number: int,
    current_user = Depends(get_current_active_user),
    
):
    """
    Get a specific version.
    
    Returns version metadata. Use /download endpoint for content.
    """
    try:
        result = await file_versioning_service.get_version(
            file_id=file_id,
            version_number=version_number
        )
        # Don't return raw content in JSON
        result_copy = {k: v for k, v in result.items() if k != "content"}
        return result_copy
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Internal server error")


@router.delete("/{file_id}/versions/{version_number}")
async def delete_version(
    file_id: str,
    version_number: int,
    current_user = Depends(get_current_active_user),
    
):
    """
    Delete a specific version.
    
    Cannot delete the current version.
    """
    try:
        result = await file_versioning_service.delete_version(
            user_id=str(current_user.get("id")),
            file_id=file_id,
            version_number=version_number
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Internal server error")


# ============== Rollback ==============

@router.post("/{file_id}/rollback")
async def rollback_to_version(
    file_id: str,
    version_number: int = Query(..., description="Version number to rollback to"),
    current_user = Depends(get_current_active_user),
    
):
    """
    Rollback file to a previous version.
    
    Creates a new version with the old content.
    """
    try:
        result = await file_versioning_service.rollback_to_version(
            user_id=str(current_user.get("id")),
            file_id=file_id,
            version_number=version_number
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Internal server error")


# ============== Compare ==============

@router.post("/{file_id}/compare")
async def compare_versions(
    file_id: str,
    request: CompareVersionsRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Compare two versions of a file.
    
    Returns size diff and metadata comparison.
    """
    try:
        result = await file_versioning_service.compare_versions(
            file_id=file_id,
            version_a=request.version_a,
            version_b=request.version_b
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Internal server error")


# ============== File Locking ==============

@router.post("/{file_id}/lock")
async def lock_file(
    file_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """
    Lock a file for exclusive editing.
    
    Lock expires after 30 minutes.
    """
    try:
        result = await file_versioning_service.lock_file(
            user_id=str(current_user.get("id")),
            file_id=file_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Internal server error")


@router.delete("/{file_id}/lock")
async def unlock_file(
    file_id: str,
    force: bool = Query(False, description="Force unlock (admin only)"),
    current_user = Depends(get_current_active_user),
    
):
    """Unlock a file."""
    try:
        # Only admins can force unlock
        if force and current_user.get("role") != "admin":
            raise ValueError("Only admins can force unlock")
        
        result = await file_versioning_service.unlock_file(
            user_id=str(current_user.get("id")),
            file_id=file_id,
            force=force
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Internal server error")


# ============== Info ==============

@router.get("/info/config")
async def get_versioning_config(
    current_user = Depends(get_current_active_user),
    
):
    """Get file versioning configuration."""
    return {
        "max_versions": file_versioning_service.MAX_VERSIONS,
        "lock_timeout_minutes": file_versioning_service.LOCK_TIMEOUT_MINUTES,
        "supported_operations": [
            "create", "upload_version", "rollback", "compare", "lock", "unlock", "delete_version"
        ]
    }
