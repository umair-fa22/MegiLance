# @AI-HINT: Comprehensive data export/import system for user data portability
"""Export/Import Service - Data portability and backup system."""

import logging
import json
import csv
import io
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class ExportFormat(str, Enum):
    """Export file formats."""
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"


class ExportType(str, Enum):
    """Types of data export."""
    FULL = "full"
    PROFILE = "profile"
    PROJECTS = "projects"
    CONTRACTS = "contracts"
    MESSAGES = "messages"
    PAYMENTS = "payments"
    REVIEWS = "reviews"
    ACTIVITY = "activity"


class ExportStatus(str, Enum):
    """Export job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class ExportImportService:
    """
    Data export and import service for user data portability.
    
    Provides GDPR-compliant data export and import with
    multiple format support and progress tracking.
    """
    
    def __init__(self):
        pass
        
        # In-memory stores
        self._export_jobs: Dict[str, Dict] = {}
        self._import_jobs: Dict[str, Dict] = {}
        self._user_data_cache: Dict[int, Dict] = {}
    
    async def create_export(
        self,
        user_id: int,
        export_type: ExportType = ExportType.FULL,
        format: ExportFormat = ExportFormat.JSON,
        include_attachments: bool = False,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Create a data export job.
        
        Args:
            user_id: User requesting export
            export_type: Type of data to export
            format: Output format
            include_attachments: Include uploaded files
            date_from: Filter start date
            date_to: Filter end date
            
        Returns:
            Export job details
        """
        export_id = f"export_{secrets.token_hex(12)}"
        
        job = {
            "id": export_id,
            "user_id": user_id,
            "type": export_type.value,
            "format": format.value,
            "include_attachments": include_attachments,
            "date_from": date_from.isoformat() if date_from else None,
            "date_to": date_to.isoformat() if date_to else None,
            "status": ExportStatus.PENDING.value,
            "progress": 0,
            "file_url": None,
            "file_size": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "expires_at": None
        }
        
        self._export_jobs[export_id] = job
        
        # Start processing (would be async task in production)
        await self._process_export(export_id)
        
        return job
    
    async def get_export_status(self, export_id: str) -> Optional[Dict[str, Any]]:
        """Get export job status."""
        return self._export_jobs.get(export_id)
    
    async def get_user_exports(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user's export history."""
        exports = [
            e for e in self._export_jobs.values()
            if e["user_id"] == user_id
        ]
        
        # Sort by created_at descending
        exports.sort(key=lambda x: x["created_at"], reverse=True)
        
        return exports[:limit]
    
    async def download_export(
        self,
        export_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get export download data."""
        job = self._export_jobs.get(export_id)
        
        if not job:
            return None
        
        if job["user_id"] != user_id:
            return {"error": "Access denied"}
        
        if job["status"] != ExportStatus.COMPLETED.value:
            return {"error": "Export not ready"}
        
        return {
            "export_id": export_id,
            "file_url": job["file_url"],
            "file_size": job["file_size"],
            "format": job["format"],
            "expires_at": job["expires_at"]
        }
    
    async def create_import(
        self,
        user_id: int,
        data: Dict[str, Any],
        merge_strategy: str = "skip"  # skip, overwrite, merge
    ) -> Dict[str, Any]:
        """
        Import data into user account.
        
        Args:
            user_id: Target user
            data: Data to import
            merge_strategy: How to handle conflicts
            
        Returns:
            Import job result
        """
        import_id = f"import_{secrets.token_hex(12)}"
        
        job = {
            "id": import_id,
            "user_id": user_id,
            "merge_strategy": merge_strategy,
            "status": ExportStatus.PENDING.value,
            "progress": 0,
            "items_processed": 0,
            "items_imported": 0,
            "items_skipped": 0,
            "items_failed": 0,
            "errors": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }
        
        self._import_jobs[import_id] = job
        
        # Process import
        result = await self._process_import(import_id, data)
        
        return result
    
    async def get_import_status(self, import_id: str) -> Optional[Dict[str, Any]]:
        """Get import job status."""
        return self._import_jobs.get(import_id)
    
    async def validate_import_data(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate data before import."""
        errors = []
        warnings = []
        
        # Check required fields
        if "version" not in data:
            warnings.append("No version field - assuming latest format")
        
        if "user" not in data and "profile" not in data:
            errors.append("Missing user/profile data")
        
        # Validate structure
        valid_sections = [
            "user", "profile", "projects", "proposals", "contracts",
            "messages", "reviews", "payments", "skills"
        ]
        
        for key in data.keys():
            if key not in valid_sections and key not in ["version", "exported_at"]:
                warnings.append(f"Unknown section: {key}")
        
        # Check data types
        if "projects" in data and not isinstance(data["projects"], list):
            errors.append("Projects must be an array")
        
        if "messages" in data and not isinstance(data["messages"], list):
            errors.append("Messages must be an array")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "sections_found": list(data.keys()),
            "estimated_items": sum(
                len(v) if isinstance(v, list) else 1 
                for v in data.values()
            )
        }
    
    async def generate_backup_schedule(
        self,
        user_id: int,
        frequency: str,  # daily, weekly, monthly
        export_types: List[ExportType]
    ) -> Dict[str, Any]:
        """Set up automated backup schedule."""
        schedule_id = f"schedule_{secrets.token_hex(8)}"
        
        schedule = {
            "id": schedule_id,
            "user_id": user_id,
            "frequency": frequency,
            "export_types": [t.value for t in export_types],
            "enabled": True,
            "last_run": None,
            "next_run": self._calculate_next_run(frequency),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return schedule
    
    # ===================
    # Data Gathering Methods
    # ===================
    
    async def _gather_user_data(
        self,
        user_id: int,
        export_type: ExportType,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Gather user data for export."""
        data = {
            "version": "1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "export_type": export_type.value
        }
        
        # Would query actual database in production
        if export_type in [ExportType.FULL, ExportType.PROFILE]:
            data["profile"] = {
                "user_id": user_id,
                "email": f"user{user_id}@example.com",
                "name": f"User {user_id}",
                "created_at": "2024-01-01T00:00:00Z"
            }
        
        if export_type in [ExportType.FULL, ExportType.PROJECTS]:
            data["projects"] = []  # Would fetch from DB
        
        if export_type in [ExportType.FULL, ExportType.CONTRACTS]:
            data["contracts"] = []
        
        if export_type in [ExportType.FULL, ExportType.MESSAGES]:
            data["messages"] = []
        
        if export_type in [ExportType.FULL, ExportType.PAYMENTS]:
            data["payments"] = []
        
        if export_type in [ExportType.FULL, ExportType.REVIEWS]:
            data["reviews"] = []
        
        if export_type in [ExportType.FULL, ExportType.ACTIVITY]:
            data["activity"] = []
        
        return data
    
    async def _process_export(self, export_id: str) -> None:
        """Process an export job."""
        job = self._export_jobs.get(export_id)
        if not job:
            return
        
        try:
            job["status"] = ExportStatus.PROCESSING.value
            job["progress"] = 10
            
            # Gather data
            export_type = ExportType(job["type"])
            date_from = datetime.fromisoformat(job["date_from"]) if job["date_from"] else None
            date_to = datetime.fromisoformat(job["date_to"]) if job["date_to"] else None
            
            data = await self._gather_user_data(
                job["user_id"],
                export_type,
                date_from,
                date_to
            )
            
            job["progress"] = 50
            
            # Format data
            format_type = ExportFormat(job["format"])
            output = await self._format_export(data, format_type)
            
            job["progress"] = 90
            
            # Save file (would use S3/storage in production)
            file_url = f"/exports/{export_id}.{format_type.value}"
            
            job["status"] = ExportStatus.COMPLETED.value
            job["progress"] = 100
            job["file_url"] = file_url
            job["file_size"] = len(output)
            job["completed_at"] = datetime.now(timezone.utc).isoformat()
            job["expires_at"] = (datetime.now(timezone.utc).replace(hour=0) + 
                                 __import__('datetime').timedelta(days=7)).isoformat()
            
        except Exception as e:
            job["status"] = ExportStatus.FAILED.value
            job["error"] = str(e)
            logger.error(f"Export failed: {str(e)}")
    
    async def _format_export(
        self,
        data: Dict[str, Any],
        format: ExportFormat
    ) -> bytes:
        """Format data for export."""
        if format == ExportFormat.JSON:
            return json.dumps(data, indent=2).encode()
        
        elif format == ExportFormat.CSV:
            # Flatten data for CSV
            output = io.StringIO()
            
            for section, items in data.items():
                if isinstance(items, list) and items:
                    writer = csv.DictWriter(output, fieldnames=items[0].keys())
                    output.write(f"\n=== {section} ===\n")
                    writer.writeheader()
                    writer.writerows(items)
            
            return output.getvalue().encode()
        
        elif format == ExportFormat.PDF:
            return self._generate_simple_pdf(data)
        
        return json.dumps(data).encode()
    
    def _generate_simple_pdf(self, data: Dict[str, Any]) -> bytes:
        """Generate a minimal valid PDF from export data."""
        # Build text content
        lines = ["MegiLance Data Export", "=" * 40, ""]
        for section, items in data.items():
            lines.append(f"--- {section.upper()} ---")
            lines.append("")
            if isinstance(items, list):
                for i, item in enumerate(items, 1):
                    lines.append(f"  [{i}]")
                    if isinstance(item, dict):
                        for k, v in item.items():
                            val_str = str(v)[:200]
                            lines.append(f"    {k}: {val_str}")
                    else:
                        lines.append(f"    {item}")
                    lines.append("")
            elif isinstance(items, dict):
                for k, v in items.items():
                    val_str = str(v)[:200]
                    lines.append(f"  {k}: {val_str}")
                lines.append("")
            else:
                lines.append(f"  {items}")
                lines.append("")

        text = "\n".join(lines)
        text_bytes = text.encode("latin-1", errors="replace")

        # Build minimal PDF 1.4
        objects: list = []
        # Obj 1: Catalog
        objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
        # Obj 2: Pages
        objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
        # Obj 4: Font
        objects.append(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj")
        # Obj 5: Stream (content)
        content_lines = []
        content_lines.append(b"BT")
        content_lines.append(b"/F1 9 Tf")
        y = 780
        for line in lines:
            if y < 40:
                break
            safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            content_lines.append(f"1 0 0 1 40 {y} Tm".encode("latin-1"))
            content_lines.append(f"({safe}) Tj".encode("latin-1", errors="replace"))
            y -= 12
        content_lines.append(b"ET")
        stream_data = b"\n".join(content_lines)
        stream_obj = (
            f"5 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode()
            + stream_data
            + b"\nendstream\nendobj"
        )
        objects.append(stream_obj)
        # Obj 3: Page
        objects.append(
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R "
            b"/MediaBox [0 0 612 792] "
            b"/Contents 5 0 R "
            b"/Resources << /Font << /F1 4 0 R >> >> >>\nendobj"
        )

        # Assemble PDF
        pdf = io.BytesIO()
        pdf.write(b"%PDF-1.4\n")
        offsets = []
        for obj in objects:
            offsets.append(pdf.tell())
            pdf.write(obj + b"\n")
        xref_start = pdf.tell()
        pdf.write(b"xref\n")
        pdf.write(f"0 {len(objects) + 1}\n".encode())
        pdf.write(b"0000000000 65535 f \n")
        obj_order = [1, 2, 4, 5, 3]  # matches objects list order
        offset_map = dict(zip(obj_order, offsets))
        for i in range(1, len(objects) + 1):
            pdf.write(f"{offset_map[i]:010d} 00000 n \n".encode())
        pdf.write(b"trailer\n")
        pdf.write(f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode())
        pdf.write(b"startxref\n")
        pdf.write(f"{xref_start}\n".encode())
        pdf.write(b"%%EOF\n")
        return pdf.getvalue()
    
    async def _process_import(
        self,
        import_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process an import job."""
        job = self._import_jobs.get(import_id)
        if not job:
            return {"error": "Job not found"}
        
        try:
            job["status"] = ExportStatus.PROCESSING.value
            
            # Validate data
            validation = await self.validate_import_data(data)
            if not validation["valid"]:
                job["status"] = ExportStatus.FAILED.value
                job["errors"] = validation["errors"]
                return job
            
            # Process each section
            sections = ["profile", "projects", "contracts", "messages", "reviews"]
            
            for section in sections:
                if section in data:
                    items = data[section]
                    if isinstance(items, list):
                        for item in items:
                            job["items_processed"] += 1
                            # Would actually import to DB
                            job["items_imported"] += 1
                    else:
                        job["items_processed"] += 1
                        job["items_imported"] += 1
                    
                    job["progress"] = int(
                        (sections.index(section) + 1) / len(sections) * 100
                    )
            
            job["status"] = ExportStatus.COMPLETED.value
            job["progress"] = 100
            job["completed_at"] = datetime.now(timezone.utc).isoformat()
            
        except Exception as e:
            job["status"] = ExportStatus.FAILED.value
            job["errors"].append(str(e))
        
        return job
    
    def _calculate_next_run(self, frequency: str) -> str:
        """Calculate next backup run time."""
        from datetime import timedelta
        
        now = datetime.now(timezone.utc)
        
        if frequency == "daily":
            next_run = now + timedelta(days=1)
        elif frequency == "weekly":
            next_run = now + timedelta(weeks=1)
        else:  # monthly
            next_run = now + timedelta(days=30)
        
        return next_run.isoformat()


# Singleton instance
_export_import_service: Optional[ExportImportService] = None


def get_export_import_service() -> ExportImportService:
    """Get or create export/import service instance."""
    global _export_import_service
    if _export_import_service is None:
        _export_import_service = ExportImportService()
    return _export_import_service
