# @AI-HINT: File versioning service - track file versions, diffs, and rollbacks
"""File Versioning Service - Document Version Control."""

import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional


class FileVersioningService:
    """Service for managing file versions and history."""
    
    # Max versions to keep per file
    MAX_VERSIONS = 100
    
    # File lock timeout (minutes)
    LOCK_TIMEOUT_MINUTES = 30
    
    def __init__(self):
        # In-memory storage
        self._files: Dict[str, Dict] = {}  # file_id -> file metadata
        self._versions: Dict[str, List[Dict]] = {}  # file_id -> [versions]
        self._locks: Dict[str, Dict] = {}  # file_id -> lock info
    
    def _calculate_hash(self, content: bytes) -> str:
        """Calculate content hash."""
        return hashlib.sha256(content).hexdigest()
    
    async def create_file(
        self,
        user_id: str,
        filename: str,
        content: bytes,
        mime_type: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new versioned file.
        
        Args:
            user_id: Owner of the file
            filename: Original filename
            content: File content bytes
            mime_type: MIME type
            resource_type: Optional linked resource type (project, contract)
            resource_id: Optional linked resource ID
            description: Optional description
        """
        file_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        content_hash = self._calculate_hash(content)
        
        file_metadata = {
            "id": file_id,
            "filename": filename,
            "mime_type": mime_type,
            "owner_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "description": description,
            "current_version": 1,
            "current_version_id": version_id,
            "total_versions": 1,
            "is_locked": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        version = {
            "id": version_id,
            "file_id": file_id,
            "version_number": 1,
            "content": content,
            "content_hash": content_hash,
            "size": len(content),
            "uploaded_by": user_id,
            "comment": "Initial version",
            "is_current": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._files[file_id] = file_metadata
        self._versions[file_id] = [version]
        
        return {
            "success": True,
            "file": {
                **file_metadata,
                "latest_version": {
                    "id": version_id,
                    "version_number": 1,
                    "size": len(content),
                    "content_hash": content_hash
                }
            }
        }
    
    async def upload_new_version(
        self,
        user_id: str,
        file_id: str,
        content: bytes,
        comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload a new version of an existing file.
        
        Args:
            user_id: User uploading
            file_id: File to update
            content: New content
            comment: Version comment
        """
        file_meta = self._files.get(file_id)
        if not file_meta:
            raise ValueError("File not found")
        
        # Check lock
        lock = self._locks.get(file_id)
        if lock and lock["user_id"] != user_id:
            lock_time = datetime.fromisoformat(lock["locked_at"])
            if datetime.now(timezone.utc) - lock_time < timedelta(minutes=self.LOCK_TIMEOUT_MINUTES):
                raise ValueError(f"File is locked by another user until {lock['expires_at']}")
        
        content_hash = self._calculate_hash(content)
        
        # Check if content is same as current
        versions = self._versions.get(file_id, [])
        if versions and versions[-1]["content_hash"] == content_hash:
            return {
                "success": False,
                "message": "Content is identical to current version"
            }
        
        # Mark previous as not current
        for v in versions:
            v["is_current"] = False
        
        new_version_number = file_meta["current_version"] + 1
        version_id = str(uuid.uuid4())
        
        version = {
            "id": version_id,
            "file_id": file_id,
            "version_number": new_version_number,
            "content": content,
            "content_hash": content_hash,
            "size": len(content),
            "uploaded_by": user_id,
            "comment": comment or f"Version {new_version_number}",
            "is_current": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        versions.append(version)
        
        # Trim old versions if over limit
        if len(versions) > self.MAX_VERSIONS:
            versions = versions[-self.MAX_VERSIONS:]
            self._versions[file_id] = versions
        
        # Update file metadata
        file_meta["current_version"] = new_version_number
        file_meta["current_version_id"] = version_id
        file_meta["total_versions"] = len(versions)
        file_meta["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        return {
            "success": True,
            "version": {
                "id": version_id,
                "version_number": new_version_number,
                "size": len(content),
                "content_hash": content_hash,
                "comment": version["comment"]
            },
            "file": file_meta
        }
    
    async def get_file(
        self,
        file_id: str
    ) -> Dict[str, Any]:
        """Get file metadata."""
        file_meta = self._files.get(file_id)
        if not file_meta:
            raise ValueError("File not found")
        
        versions = self._versions.get(file_id, [])
        
        return {
            **file_meta,
            "versions_summary": [
                {
                    "id": v["id"],
                    "version_number": v["version_number"],
                    "size": v["size"],
                    "uploaded_by": v["uploaded_by"],
                    "comment": v["comment"],
                    "is_current": v["is_current"],
                    "created_at": v["created_at"]
                }
                for v in versions
            ]
        }
    
    async def get_version(
        self,
        file_id: str,
        version_number: Optional[int] = None,
        version_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get specific version content."""
        if file_id not in self._files:
            raise ValueError("File not found")
        
        versions = self._versions.get(file_id, [])
        
        version = None
        if version_id:
            version = next((v for v in versions if v["id"] == version_id), None)
        elif version_number:
            version = next((v for v in versions if v["version_number"] == version_number), None)
        else:
            # Get current version
            version = next((v for v in versions if v["is_current"]), None)
        
        if not version:
            raise ValueError("Version not found")
        
        return {
            "id": version["id"],
            "file_id": file_id,
            "version_number": version["version_number"],
            "content": version["content"],
            "content_hash": version["content_hash"],
            "size": version["size"],
            "uploaded_by": version["uploaded_by"],
            "comment": version["comment"],
            "is_current": version["is_current"],
            "created_at": version["created_at"]
        }
    
    async def rollback_to_version(
        self,
        user_id: str,
        file_id: str,
        version_number: int
    ) -> Dict[str, Any]:
        """
        Rollback file to a previous version.
        
        Creates a new version with the old content.
        """
        if file_id not in self._files:
            raise ValueError("File not found")
        
        versions = self._versions.get(file_id, [])
        target_version = next((v for v in versions if v["version_number"] == version_number), None)
        
        if not target_version:
            raise ValueError(f"Version {version_number} not found")
        
        # Upload as new version
        result = await self.upload_new_version(
            db=db,
            user_id=user_id,
            file_id=file_id,
            content=target_version["content"],
            comment=f"Rolled back to version {version_number}"
        )
        
        return {
            "success": True,
            "message": f"Rolled back to version {version_number}",
            "new_version": result.get("version")
        }
    
    async def compare_versions(
        self,
        file_id: str,
        version_a: int,
        version_b: int
    ) -> Dict[str, Any]:
        """
        Compare two versions of a file.
        
        Returns size diff and hash comparison.
        """
        if file_id not in self._files:
            raise ValueError("File not found")
        
        versions = self._versions.get(file_id, [])
        
        v_a = next((v for v in versions if v["version_number"] == version_a), None)
        v_b = next((v for v in versions if v["version_number"] == version_b), None)
        
        if not v_a:
            raise ValueError(f"Version {version_a} not found")
        if not v_b:
            raise ValueError(f"Version {version_b} not found")
        
        return {
            "version_a": {
                "version_number": v_a["version_number"],
                "size": v_a["size"],
                "content_hash": v_a["content_hash"],
                "created_at": v_a["created_at"],
                "comment": v_a["comment"]
            },
            "version_b": {
                "version_number": v_b["version_number"],
                "size": v_b["size"],
                "content_hash": v_b["content_hash"],
                "created_at": v_b["created_at"],
                "comment": v_b["comment"]
            },
            "comparison": {
                "size_diff": v_b["size"] - v_a["size"],
                "size_diff_percent": round((v_b["size"] - v_a["size"]) / v_a["size"] * 100, 2) if v_a["size"] > 0 else 0,
                "content_changed": v_a["content_hash"] != v_b["content_hash"],
                "time_between": (datetime.fromisoformat(v_b["created_at"]) - datetime.fromisoformat(v_a["created_at"])).total_seconds()
            }
        }
    
    async def lock_file(
        self,
        user_id: str,
        file_id: str
    ) -> Dict[str, Any]:
        """Lock a file for exclusive editing."""
        if file_id not in self._files:
            raise ValueError("File not found")
        
        existing_lock = self._locks.get(file_id)
        if existing_lock:
            lock_time = datetime.fromisoformat(existing_lock["locked_at"])
            if datetime.now(timezone.utc) - lock_time < timedelta(minutes=self.LOCK_TIMEOUT_MINUTES):
                if existing_lock["user_id"] != user_id:
                    raise ValueError("File is already locked by another user")
                return {
                    "success": True,
                    "message": "Lock extended",
                    "lock": existing_lock
                }
        
        expires = datetime.now(timezone.utc) + timedelta(minutes=self.LOCK_TIMEOUT_MINUTES)
        
        lock = {
            "file_id": file_id,
            "user_id": user_id,
            "locked_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires.isoformat()
        }
        
        self._locks[file_id] = lock
        self._files[file_id]["is_locked"] = True
        
        return {
            "success": True,
            "lock": lock
        }
    
    async def unlock_file(
        self,
        user_id: str,
        file_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """Unlock a file."""
        if file_id not in self._files:
            raise ValueError("File not found")
        
        existing_lock = self._locks.get(file_id)
        if not existing_lock:
            return {
                "success": True,
                "message": "File was not locked"
            }
        
        if existing_lock["user_id"] != user_id and not force:
            raise ValueError("Can only unlock files you locked")
        
        del self._locks[file_id]
        self._files[file_id]["is_locked"] = False
        
        return {
            "success": True,
            "message": "File unlocked"
        }
    
    async def delete_version(
        self,
        user_id: str,
        file_id: str,
        version_number: int
    ) -> Dict[str, Any]:
        """
        Delete a specific version (not the current one).
        """
        if file_id not in self._files:
            raise ValueError("File not found")
        
        versions = self._versions.get(file_id, [])
        
        for i, v in enumerate(versions):
            if v["version_number"] == version_number:
                if v["is_current"]:
                    raise ValueError("Cannot delete current version")
                
                versions.pop(i)
                self._files[file_id]["total_versions"] = len(versions)
                
                return {
                    "success": True,
                    "message": f"Version {version_number} deleted"
                }
        
        raise ValueError(f"Version {version_number} not found")
    
    async def get_version_history(
        self,
        file_id: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get version history for a file."""
        if file_id not in self._files:
            raise ValueError("File not found")
        
        versions = self._versions.get(file_id, [])
        
        # Return without content
        history = [
            {
                "id": v["id"],
                "version_number": v["version_number"],
                "size": v["size"],
                "content_hash": v["content_hash"],
                "uploaded_by": v["uploaded_by"],
                "comment": v["comment"],
                "is_current": v["is_current"],
                "created_at": v["created_at"]
            }
            for v in versions[-limit:]
        ]
        
        history.reverse()  # Most recent first
        
        return {
            "file_id": file_id,
            "filename": self._files[file_id]["filename"],
            "versions": history,
            "total": len(versions)
        }
    
    async def search_files(
        self,
        user_id: str,
        query: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Search files by various criteria."""
        files = list(self._files.values())
        
        # Filter by owner
        files = [f for f in files if f["owner_id"] == user_id]
        
        # Filter by resource
        if resource_type:
            files = [f for f in files if f["resource_type"] == resource_type]
        if resource_id:
            files = [f for f in files if f["resource_id"] == resource_id]
        
        # Filter by name
        if query:
            query_lower = query.lower()
            files = [f for f in files if query_lower in f["filename"].lower()]
        
        # Sort by updated
        files.sort(key=lambda x: x["updated_at"], reverse=True)
        
        return {
            "files": files[:limit],
            "total": len(files)
        }


# Singleton instance
file_versioning_service = FileVersioningService()
