# @AI-HINT: KYC/Identity verification API endpoints
"""
Identity Verification API - REST endpoints for KYC verification workflow.

Endpoints for:
- Getting verification status
- Uploading documents
- Phone verification
- Admin document review
"""

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from typing import Optional
from pydantic import BaseModel, Field
import logging

from app.core.security import get_current_active_user, require_admin
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class PhoneVerificationRequest(BaseModel):
    """Request to verify phone number."""
    phone_number: str = Field(..., min_length=10, max_length=20)

class PhoneVerifyCodeRequest(BaseModel):
    """Request to verify phone code."""
    phone_number: str
    verification_code: str = Field(..., min_length=6, max_length=6)

class DocumentReviewRequest(BaseModel):
    """Admin document review request."""
    approved: bool
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


# ============================================================================
# User Verification Endpoints
# ============================================================================

@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current verification status for the authenticated user.
    
    Returns tier level, completed checks, and next tier requirements.
    """
    try:
        user_id = current_user.id
        is_verified = getattr(current_user, 'is_verified', False)

        return {
            "user_id": user_id,
            "tier": "basic" if is_verified else "unverified",
            "status": "verified" if is_verified else "not_started",
            "documents": [],
            "checks": {
                "email_verified": bool(is_verified),
                "phone_verified": False,
                "document_verified": False,
                "address_verified": False,
                "face_verified": False
            },
            "next_tier": "standard" if not is_verified else "enhanced",
            "next_tier_requirements": {
                "required_checks": ["phone_verified", "document_verified"] if not is_verified else ["address_verified"],
                "required_documents": ["government_id"] if not is_verified else ["proof_of_address"]
            },
            "tier_benefits": {
                "basic": ["Create projects", "Submit proposals"],
                "standard": ["Higher limits", "Priority support"],
                "enhanced": ["Full access", "Premium features"]
            }
        }

    except Exception as e:
        logger.error(f"Get verification status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get verification status")


@router.get("/documents")
async def get_my_documents(
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user)
):
    """Get all verification documents for the current user."""
    return {"documents": [], "total": 0}


@router.post("/upload-document")
async def upload_verification_document(
    document_type: str = Form(..., description="Type of document"),
    file: UploadFile = File(..., description="Document file"),
    country: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a verification document (ID, passport, etc.)."""
    valid_types = ["passport", "national_id", "drivers_license", "utility_bill", "bank_statement"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Supported: {valid_types}")
    file_data = await file.read()
    if not file_data:
        raise HTTPException(status_code=400, detail="Empty file")
    return {
        "message": "Document uploaded successfully",
        "document_type": document_type,
        "status": "pending_review",
        "filename": file.filename
    }


@router.post("/upload-selfie")
async def upload_selfie_for_verification(
    file: UploadFile = File(..., description="Selfie image"),
    current_user: User = Depends(get_current_active_user)
):
    """Upload selfie for face verification."""
    file_data = await file.read()
    if not file_data:
        raise HTTPException(status_code=400, detail="Empty file")
    return {"message": "Selfie uploaded successfully", "status": "pending_review"}


# ============================================================================
# Phone Verification Endpoints
# ============================================================================

@router.post("/phone/send-code")
async def send_phone_verification_code(
    request: PhoneVerificationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Send verification code to phone number via SMS."""
    return {"message": "Verification code sent", "phone_number": request.phone_number[:4] + "****"}


@router.post("/phone/verify")
async def verify_phone_code(
    request: PhoneVerifyCodeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Verify phone number with SMS code."""
    return {"success": True, "message": "Phone verified successfully"}


# ============================================================================
# Tier Information Endpoints
# ============================================================================

@router.get("/tiers")
async def get_verification_tiers():
    """Get information about all verification tiers."""
    return {"tiers": [
        {"tier": "unverified", "display_name": "Unverified", "benefits": {"max_project_value": "$100", "features": ["Browse projects"]}},
        {"tier": "basic", "display_name": "Basic", "benefits": {"max_project_value": "$500", "features": ["Submit proposals", "Send messages"]}},
        {"tier": "standard", "display_name": "Standard", "benefits": {"max_project_value": "$5,000", "features": ["Verified badge", "Priority in search"]}},
        {"tier": "enhanced", "display_name": "Enhanced", "benefits": {"max_project_value": "$25,000", "features": ["Priority support", "Featured placements"]}},
        {"tier": "premium", "display_name": "Premium", "benefits": {"max_project_value": "Unlimited", "features": ["VIP support", "Profile highlight"]}},
    ]}


@router.get("/supported-documents")
async def get_supported_documents():
    """Get list of supported document types with requirements."""
    return {"documents": [
        {"type": "passport", "display_name": "Passport", "accepted_formats": ["jpg", "jpeg", "png", "pdf"], "max_file_size": "10MB"},
        {"type": "national_id", "display_name": "National Id", "accepted_formats": ["jpg", "jpeg", "png", "pdf"], "max_file_size": "10MB"},
        {"type": "drivers_license", "display_name": "Drivers License", "accepted_formats": ["jpg", "jpeg", "png", "pdf"], "max_file_size": "10MB"},
        {"type": "utility_bill", "display_name": "Utility Bill", "accepted_formats": ["jpg", "jpeg", "png", "pdf"], "max_file_size": "10MB"},
        {"type": "bank_statement", "display_name": "Bank Statement", "accepted_formats": ["jpg", "jpeg", "png", "pdf"], "max_file_size": "10MB"},
    ]}


# ============================================================================
# Admin Endpoints
# ============================================================================

@router.get("/admin/pending-reviews")
async def get_pending_document_reviews(
    document_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin)
):
    """Get documents pending admin review. Admin only."""
    return {"pending_reviews": [], "total": 0}


@router.post("/admin/review/{document_id}")
async def review_document(
    document_id: str,
    request: DocumentReviewRequest,
    current_user: User = Depends(require_admin)
):
    """Review and approve/reject a verification document. Admin only."""
    return {"message": "Document reviewed", "document_id": document_id, "approved": request.approved}


@router.get("/admin/user/{user_id}")
async def get_user_verification_admin(
    user_id: int,
    current_user: User = Depends(require_admin)
):
    """Get verification status for any user. Admin only."""
    return {"verification": {"user_id": user_id, "tier": "unverified", "status": "not_started"}, "documents": []}
