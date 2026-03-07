# @AI-HINT: Legal document center API for NDAs, contracts, and e-signatures
"""
Legal Document Center API

Endpoints for legal templates, document generation,
e-signature management, and contract compliance.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.security import get_current_active_user
from app.services.legal_documents import (
    get_legal_document_service,
    DocumentType,
    DocumentStatus,
    SignatureStatus
)

router = APIRouter(prefix="/legal-documents", tags=["legal-documents"])


# Request/Response Models
class GenerateDocumentRequest(BaseModel):
    doc_type: DocumentType
    field_values: Dict[str, str]
    title: Optional[str] = None


class PreviewDocumentRequest(BaseModel):
    doc_type: DocumentType
    field_values: Dict[str, str]


class RequestSignatureRequest(BaseModel):
    signer_email: str
    signer_name: str
    message: Optional[str] = None
    expires_in_days: int = 14


class SignDocumentRequest(BaseModel):
    signature_type: str = "typed"  # typed, drawn, uploaded
    signature_data: Optional[str] = None


class VoidDocumentRequest(BaseModel):
    reason: str


class AttachToContractRequest(BaseModel):
    contract_id: int


# Template Endpoints
@router.get("/templates")
async def get_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    ,
    current_user = Depends(get_current_active_user)
):
    """Get available legal document templates."""
    service = get_legal_document_service()
    templates = await service.get_templates(category)
    return {"templates": templates, "count": len(templates)}


@router.get("/templates/categories")
async def get_template_categories(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get list of template categories."""
    service = get_legal_document_service()
    categories = await service.get_template_categories()
    return {"categories": categories}


@router.get("/templates/{doc_type}")
async def get_template(
    doc_type: DocumentType,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get a specific template."""
    service = get_legal_document_service()
    template = await service.get_template(doc_type)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"template": template}


# Document Generation Endpoints
@router.post("/generate")
async def generate_document(
    request: GenerateDocumentRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Generate a legal document from template."""
    service = get_legal_document_service()
    result = await service.generate_document(
        current_user["id"],
        request.doc_type,
        request.field_values,
        request.title
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/preview")
async def preview_document(
    request: PreviewDocumentRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Preview a document without saving."""
    service = get_legal_document_service()
    result = await service.preview_document(
        request.doc_type,
        request.field_values
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# Document Management Endpoints
@router.get("/my-documents")
async def get_my_documents(
    status_filter: Optional[DocumentStatus] = None,
    doc_type_filter: Optional[DocumentType] = None,
    limit: int = Query(50, le=100),
    ,
    current_user = Depends(get_current_active_user)
):
    """Get current user's legal documents."""
    service = get_legal_document_service()
    documents = await service.get_user_documents(
        current_user["id"],
        status_filter,
        doc_type_filter,
        limit
    )
    return documents


@router.get("/documents/{document_id}")
async def get_document(
    document_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get a specific document."""
    service = get_legal_document_service()
    document = await service.get_document(current_user["id"], document_id)
    
    if not document or "error" in document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"document": document}


@router.put("/documents/{document_id}")
async def update_document(
    document_id: str,
    updates: Dict[str, Any],
    ,
    current_user = Depends(get_current_active_user)
):
    """Update a draft document."""
    service = get_legal_document_service()
    result = await service.update_document(
        current_user["id"],
        document_id,
        updates
    )
    return result


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Delete a draft document."""
    service = get_legal_document_service()
    result = await service.delete_document(current_user["id"], document_id)
    return result


# Signature Endpoints
@router.post("/documents/{document_id}/request-signature")
async def request_signature(
    document_id: str,
    request: RequestSignatureRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Request e-signature on a document."""
    service = get_legal_document_service()
    result = await service.request_signature(
        current_user["id"],
        document_id,
        request.signer_email,
        request.signer_name,
        request.message,
        request.expires_in_days
    )
    return result


@router.post("/documents/{document_id}/sign")
async def sign_document(
    document_id: str,
    request: SignDocumentRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Sign a document."""
    service = get_legal_document_service()
    result = await service.sign_document(
        current_user["id"],
        document_id,
        {
            "type": request.signature_type,
            "data": request.signature_data
        }
    )
    return result


@router.post("/documents/{document_id}/void")
async def void_document(
    document_id: str,
    request: VoidDocumentRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Void a document."""
    service = get_legal_document_service()
    result = await service.void_document(
        current_user["id"],
        document_id,
        request.reason
    )
    return result


@router.get("/documents/{document_id}/signatures")
async def get_document_signatures(
    document_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get signatures for a document."""
    return {
        "document_id": document_id,
        "signatures": [],
        "pending_signatures": []
    }


# Signature Requests (for signers)
@router.get("/signature-requests")
async def get_pending_signature_requests(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get pending signature requests for current user."""
    return {
        "pending_requests": [],
        "message": "Signature request tracking not yet implemented"
    }


# Contract Attachment Endpoints
@router.post("/documents/{document_id}/attach")
async def attach_to_contract(
    document_id: str,
    request: AttachToContractRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Attach document to a contract."""
    service = get_legal_document_service()
    result = await service.attach_to_contract(
        current_user["id"],
        document_id,
        request.contract_id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/contracts/{contract_id}/documents")
async def get_contract_documents(
    contract_id: int,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get documents attached to a contract."""
    service = get_legal_document_service()
    documents = await service.get_contract_documents(contract_id)
    return documents


# Export Endpoints
@router.get("/documents/{document_id}/export")
async def export_document(
    document_id: str,
    format: str = Query("pdf", enum=["pdf", "docx", "html"]),
    ,
    current_user = Depends(get_current_active_user)
):
    """Export document to specified format."""
    service = get_legal_document_service()
    result = await service.export_document(
        current_user["id"],
        document_id,
        format
    )
    return result


# Audit Trail
@router.get("/documents/{document_id}/audit-trail")
async def get_audit_trail(
    document_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get audit trail for a document."""
    service = get_legal_document_service()
    audit_trail = await service.get_document_audit_trail(document_id)
    return audit_trail


# Quick NDA Generation
@router.post("/quick-nda")
async def create_quick_nda(
    other_party_name: str,
    other_party_email: str,
    purpose: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Quickly create and send an NDA."""
    service = get_legal_document_service()
    
    # Generate NDA
    doc_result = await service.generate_document(
        current_user["id"],
        DocumentType.NDA,
        {
            "disclosing_party_name": current_user.get("full_name", current_user.get("email")),
            "receiving_party_name": other_party_name,
            "purpose": purpose,
            "effective_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        },
        f"NDA with {other_party_name}"
    )
    
    if "error" in doc_result:
        raise HTTPException(status_code=400, detail=doc_result["error"])
    
    # Request signature
    document_id = doc_result["document"]["id"]
    sig_result = await service.request_signature(
        current_user["id"],
        document_id,
        other_party_email,
        other_party_name,
        f"Please sign this NDA for our potential collaboration regarding: {purpose}"
    )
    
    return {
        "document": doc_result["document"],
        "signature_request": sig_result["signature_request"]
    }
