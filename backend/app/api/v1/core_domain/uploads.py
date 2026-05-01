"""
@AI-HINT: File upload API endpoints - Turso HTTP only
Handles uploading of user files (avatars, portfolio images, documents)
Enhanced with path traversal protection and content validation
"""
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Request
from io import BytesIO
from app.core.security import get_current_user
from app.core.rate_limit import api_rate_limit
from app.core.config import get_settings
from app.core.s3 import get_s3_client
from app.services.uploads_service import get_user_avatar_url, update_user_avatar, clear_user_avatar
import logging
import os
import re
import uuid
from pathlib import Path
import magic  # python-magic for MIME type detection
logger = logging.getLogger(__name__)

router = APIRouter()

# File upload configuration
UPLOAD_DIR = Path("uploads").resolve()  # Use absolute path
AVATAR_DIR = UPLOAD_DIR / "avatars"
PORTFOLIO_DIR = UPLOAD_DIR / "portfolio"
DOCUMENT_DIR = UPLOAD_DIR / "documents"

# Create directories if they don't exist
for directory in [AVATAR_DIR, PORTFOLIO_DIR, DOCUMENT_DIR]:
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except (FileExistsError, OSError):
        pass  # Directory already exists or permission issue

# Allowed file types (MIME types)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

# Safe file extensions mapping
SAFE_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
SAFE_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}

# File size limits (in bytes)
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB
MAX_PORTFOLIO_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB

# Dangerous filename patterns
DANGEROUS_PATTERNS = [
    r'\.\.', r'\.php', r'\.exe', r'\.sh', r'\.bat', r'\.cmd',
    r'\.js', r'\.html', r'\.htm', r'\.asp', r'\.aspx', r'\.jsp',
    r'<script', r'javascript:', r'\x00'
]


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and injection attacks"""
    if not filename:
        return f"{uuid.uuid4()}"
    
    # Remove null bytes and path components
    filename = filename.replace('\x00', '').replace('\r', '').replace('\n', '')
    
    # Get just the filename, not any path
    filename = os.path.basename(filename)
    
    # Check for dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, filename, re.IGNORECASE):
            # Return a safe UUID-based name with the original extension
            ext = Path(filename).suffix.lower()
            if ext in SAFE_IMAGE_EXTENSIONS | SAFE_DOCUMENT_EXTENSIONS:
                return f"{uuid.uuid4()}{ext}"
            return f"{uuid.uuid4()}"
    
    # Remove any non-alphanumeric characters except dots, dashes, underscores
    name, ext = os.path.splitext(filename)
    name = re.sub(r'[^a-zA-Z0-9_\-]', '_', name)[:50]  # Limit name length
    ext = ext.lower()
    
    # Ensure extension is safe
    if ext not in SAFE_IMAGE_EXTENSIONS | SAFE_DOCUMENT_EXTENSIONS:
        ext = ""
    
    return f"{name}_{uuid.uuid4().hex[:8]}{ext}"


def validate_path(file_path: str, base_dir: Path) -> Path:
    """Validate that file path is within the allowed directory (prevent path traversal)"""
    try:
        # Resolve the path to absolute
        full_path = (base_dir / file_path).resolve()
        
        # Ensure it's within the base directory
        if not str(full_path).startswith(str(base_dir)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path"
            )
        
        return full_path
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path"
        )


def validate_file_content(file_content: bytes, expected_types: set) -> str:
    """Validate actual file content matches expected MIME type"""
    try:
        # Use python-magic to detect actual file type from content
        mime = magic.Magic(mime=True)
        detected_type = mime.from_buffer(file_content)
        
        if detected_type not in expected_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File content does not match expected type. Detected: {detected_type}"
            )
        
        return detected_type
    except ImportError:
        # If python-magic is not installed, fall back to basic checks
        # Check magic bytes for common image formats
        if file_content[:8] == b'\x89PNG\r\n\x1a\n':
            return 'image/png' if 'image/png' in expected_types else None
        elif file_content[:2] == b'\xff\xd8':
            return 'image/jpeg' if 'image/jpeg' in expected_types else None
        elif file_content[:4] == b'GIF8':
            return 'image/gif' if 'image/gif' in expected_types else None
        elif file_content[:4] == b'RIFF' and file_content[8:12] == b'WEBP':
            return 'image/webp' if 'image/webp' in expected_types else None
        elif file_content[:4] == b'%PDF':
            return 'application/pdf' if 'application/pdf' in expected_types else None
        
        # Can't validate - proceed with caution
        return None


def validate_file(file: UploadFile, allowed_types: set, max_size: int) -> bytes:
    """Validate file type and size, returns file content"""
    # Check file type from header
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Read file content
    file_content = file.file.read()
    file.file.seek(0)  # Reset for later use
    
    # Check file size
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {max_size / 1024 / 1024}MB"
        )
    
    # Empty file check
    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file not allowed"
        )
    
    # Validate actual content matches expected type
    validate_file_content(file_content, allowed_types)
    
    return file_content


def delete_uploaded_file(file_url: str):
    """Delete a previously uploaded file from local storage or S3"""
    if not file_url:
        return
        
    settings = get_settings()
    
    # Check if it's an S3 URL (simple heuristic based on bucket name)
    if getattr(settings, 'aws_bucket_name', None) and settings.aws_bucket_name in file_url:
        try:
            s3 = get_s3_client()
            # Extract object name (e.g., 'avatars/filename.jpg')
            # assuming URL format is something like https://.../avatars/filename.jpg
            parts = file_url.split('/')
            if len(parts) >= 2:
                object_name = f"{parts[-2]}/{parts[-1]}"
                s3.delete_file(settings.aws_bucket_name, object_name)
        except Exception as e:
            logger.error(f"Failed to delete S3 file {file_url}: {e}")
    else:
        # Local file deletion fallback
        try:
            local_path = file_url
            if local_path.startswith('/uploads/'):
                local_path = local_path[len('/uploads/'):]
            elif local_path.startswith('uploads/'):
                local_path = local_path[len('uploads/'):]
                
            old_path = validate_path(local_path, UPLOAD_DIR)
            if old_path.exists() and old_path.is_file():
                old_path.unlink()
        except HTTPException:
            pass  # Ignore invalid paths
        except Exception as e:
            logger.error(f"Failed to delete local file {file_url}: {e}")


def save_uploaded_file(file_content: bytes, original_filename: str, directory_mapping: str, content_type: str = None) -> str:
    """Save uploaded file and return URL or file path"""
    safe_filename = sanitize_filename(original_filename)
    
    settings = get_settings()
    
    # Check if S3 environment variables are provided
    if getattr(settings, 'aws_access_key_id', None) and getattr(settings, 'aws_bucket_name', None):
        s3 = get_s3_client()
        object_name = f"{directory_mapping}/{safe_filename}"
        url = s3.upload_file(
            file_obj=BytesIO(file_content),
            bucket_name=settings.aws_bucket_name,
            object_name=object_name,
            content_type=content_type
        )
        if url:
            return url
            
    # Fallback local directory
    directory = UPLOAD_DIR / directory_mapping
    directory.mkdir(parents=True, exist_ok=True)
    file_path = directory / safe_filename
    
    # Ensure path is within allowed directory
    validate_path(safe_filename, directory)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Return relative path for storage in database or frontend
    return f"/uploads/{str(file_path.relative_to(UPLOAD_DIR))}"


@router.post("/avatar", status_code=status.HTTP_201_CREATED)
@api_rate_limit()
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload user avatar image.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **max_size**: 5MB
    
    Returns the URL of the uploaded avatar.
    """
    # Validate and get file content
    file_content = validate_file(file, ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE)
    
    # Get current avatar
    old_avatar = get_user_avatar_url(current_user['id'])
    
    # Delete old avatar if exists (with S3 support)
    if old_avatar:
        delete_uploaded_file(old_avatar)
    
    # Save new avatar
    file_url = save_uploaded_file(file_content, file.filename or "avatar.jpg", "avatars", file.content_type)
    
    # Update user profile
    update_user_avatar(current_user['id'], file_url)
    
    return {
        "url": file_url,
        "message": "Avatar uploaded successfully"
    }


@router.post("/portfolio", status_code=status.HTTP_201_CREATED)
@api_rate_limit()
async def upload_portfolio_image(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload portfolio image.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **max_size**: 10MB
    
    Returns the URL of the uploaded image.
    """
    # Validate and get file content
    file_content = validate_file(file, ALLOWED_IMAGE_TYPES, MAX_PORTFOLIO_SIZE)
    
    # Save portfolio image
    file_url = save_uploaded_file(file_content, file.filename or "portfolio.jpg", "portfolio", file.content_type)
    
    return {
        "url": file_url,
        "message": "Portfolio image uploaded successfully"
    }


@router.post("/document", status_code=status.HTTP_201_CREATED)
@api_rate_limit()
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload document (PDF, DOCX, TXT).
    
    - **file**: Document file
    - **max_size**: 10MB
    
    Returns the URL of the uploaded document.
    """
    # Validate and get file content
    file_content = validate_file(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE)
    
    # Sanitize the original filename for display
    safe_display_name = sanitize_filename(file.filename or "document")
    
    # Save document
    file_url = save_uploaded_file(file_content, file.filename or "document.pdf", "documents", file.content_type)
    
    return {
        "url": file_url,
        "filename": safe_display_name,
        "message": "Document uploaded successfully"
    }


@router.delete("/file")
@api_rate_limit()
async def delete_uploaded_file(
    request: Request,
    file_path: str,
    current_user = Depends(get_current_user)
):
    """
    Delete uploaded file.
    
    - **file_path**: Relative path to the file (e.g., "avatars/filename.jpg")
    
    Security: Only the file owner can delete it.
    """
    # Validate path to prevent path traversal
    full_path = validate_path(file_path, UPLOAD_DIR)
    
    # Check if file exists
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get user's current profile image
    user_image = get_user_avatar_url(current_user['id'])
    
    # Security check: ensure file belongs to current user
    if user_image == file_path:
        # Clear the profile image reference
        clear_user_avatar(current_user['id'])
        # Delete file
        full_path.unlink()
        return {"message": "File deleted successfully"}
    
    # Check if file is in user's portfolio (would need portfolio table check)
    # For now, only allow avatar deletion by owner
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have permission to delete this file"
    )
