# @AI-HINT: Compliance center API endpoints
"""
Compliance Center API - GDPR and regulatory compliance endpoints.

Features:
- Compliance status
- Consent management
- Data subject requests
- Data export/deletion
- Retention policies
- Compliance reports
"""

from fastapi import APIRouter, Depends
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.security import get_current_active_user, require_admin
from app.services.compliance import (
    get_compliance_service,
    ComplianceFramework,
    ConsentType,
    DataRequestType
)

router = APIRouter(prefix="/compliance", tags=["compliance"])


# Request/Response Models
class UpdateConsentRequest(BaseModel):
    consent_type: ConsentType
    granted: bool


class CreateDataRequestRequest(BaseModel):
    request_type: DataRequestType
    details: Optional[str] = None


class ProcessRequestRequest(BaseModel):
    action: str  # approve, reject
    notes: Optional[str] = None


class DataDeletionRequest(BaseModel):
    reason: Optional[str] = None


class ConfirmDeletionRequest(BaseModel):
    confirmation_code: str


class CookiePreferencesRequest(BaseModel):
    functional: bool = True
    analytics: bool = False
    advertising: bool = False


class PIARequest(BaseModel):
    project_name: str
    description: str
    data_types: List[str]
    processing_purposes: List[str]


# Compliance Status Endpoints
@router.get("/status")
async def get_compliance_status(
    organization_id: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get overall compliance status."""
    service = get_compliance_service()
    status = await service.get_compliance_status(organization_id)
    return {"compliance": status}


@router.get("/frameworks/{framework}")
async def get_framework_requirements(
    framework: ComplianceFramework,
    current_user = Depends(get_current_active_user)
):
    """Get requirements for a compliance framework."""
    service = get_compliance_service()
    requirements = await service.get_framework_requirements(framework)
    return requirements


# Consent Management Endpoints
@router.get("/consents")
async def get_user_consents(
    current_user = Depends(get_current_active_user)
):
    """Get user's consent status."""
    service = get_compliance_service()
    consents = await service.get_user_consents(current_user.id)
    return consents


@router.put("/consents")
async def update_consent(
    request: UpdateConsentRequest,
    current_user = Depends(get_current_active_user)
):
    """Update user consent."""
    service = get_compliance_service()
    result = await service.update_consent(
        current_user.id,
        request.consent_type,
        request.granted
    )
    return result


# Data Subject Request Endpoints
@router.post("/data-requests")
async def create_data_request(
    request: CreateDataRequestRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a data subject request (GDPR rights)."""
    service = get_compliance_service()
    data_request = await service.create_data_request(
        current_user.id,
        request.request_type,
        request.details
    )
    return {"request": data_request}


@router.get("/data-requests")
async def list_data_requests(
    status: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """List user's data requests."""
    service = get_compliance_service()
    requests = await service.list_data_requests(user_id=current_user.id)
    return {"requests": requests}


@router.get("/data-request/status")
async def get_data_request_status(
    current_user = Depends(get_current_active_user)
):
    """Get summary status of user's data requests."""
    service = get_compliance_service()
    requests = await service.list_data_requests(user_id=current_user.id)
    pending = sum(1 for r in requests if r.get("status") == "pending")
    completed = sum(1 for r in requests if r.get("status") == "completed")
    return {
        "total_requests": len(requests),
        "pending": pending,
        "completed": completed,
        "requests": requests
    }


@router.get("/data-requests/{request_id}")
async def get_data_request(
    request_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get data request by ID."""
    service = get_compliance_service()
    data_request = await service.get_data_request(current_user.id, request_id)
    return {"request": data_request}


# Data Export (GDPR Article 20)
@router.post("/export")
async def export_user_data(
    format: str = "json",
    current_user = Depends(get_current_active_user)
):
    """Export all user data for portability."""
    service = get_compliance_service()
    export = await service.export_user_data(current_user.id, format)
    return {"export": export}


# Data Deletion (GDPR Article 17)
@router.post("/delete-account")
async def request_data_deletion(
    request: DataDeletionRequest,
    current_user = Depends(get_current_active_user)
):
    """Request account and data deletion."""
    service = get_compliance_service()
    deletion = await service.request_data_deletion(current_user.id, request.reason)
    return {"deletion": deletion}


@router.post("/delete-account/{deletion_id}/confirm")
async def confirm_data_deletion(
    deletion_id: str,
    request: ConfirmDeletionRequest,
    current_user = Depends(get_current_active_user)
):
    """Confirm data deletion request."""
    service = get_compliance_service()
    result = await service.confirm_data_deletion(
        current_user.id,
        deletion_id,
        request.confirmation_code
    )
    return result


@router.delete("/delete-account/{deletion_id}")
async def cancel_data_deletion(
    deletion_id: str,
    current_user = Depends(get_current_active_user)
):
    """Cancel data deletion request."""
    service = get_compliance_service()
    result = await service.cancel_data_deletion(current_user.id, deletion_id)
    return result


# Retention Policies
@router.get("/retention-policies")
async def get_retention_policies(
    current_user = Depends(get_current_active_user)
):
    """Get data retention policies."""
    service = get_compliance_service()
    policies = await service.get_retention_policies()
    return {"policies": policies}


# Cookie Preferences
@router.get("/cookies")
async def get_cookie_preferences(
    current_user = Depends(get_current_active_user)
):
    """Get user's cookie preferences."""
    service = get_compliance_service()
    preferences = await service.get_cookie_preferences(current_user.id)
    return {"preferences": preferences}


@router.put("/cookies")
async def update_cookie_preferences(
    request: CookiePreferencesRequest,
    current_user = Depends(get_current_active_user)
):
    """Update cookie preferences."""
    service = get_compliance_service()
    result = await service.update_cookie_preferences(
        current_user.id,
        request.dict()
    )
    return result


# Privacy Impact Assessment
@router.post("/pia")
async def create_privacy_impact_assessment(
    request: PIARequest,
    current_user = Depends(get_current_active_user),
    _admin = Depends(require_admin)
):
    """Create a privacy impact assessment."""
    service = get_compliance_service()
    pia = await service.create_privacy_impact_assessment(
        request.project_name,
        request.description,
        request.data_types,
        request.processing_purposes
    )
    return {"pia": pia}


# Compliance Reports
@router.get("/reports/{framework}")
async def generate_compliance_report(
    framework: ComplianceFramework,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_active_user),
    _admin = Depends(require_admin)
):
    """Generate compliance report."""
    service = get_compliance_service()
    
    period_start = datetime.fromisoformat(start_date) if start_date else datetime.now(timezone.utc).replace(day=1)
    period_end = datetime.fromisoformat(end_date) if end_date else datetime.now(timezone.utc)
    
    report = await service.generate_compliance_report(framework, period_start, period_end)
    return {"report": report}
