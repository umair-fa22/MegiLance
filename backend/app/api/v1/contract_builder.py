# @AI-HINT: Contract builder API endpoints
"""
Contract Builder API - Visual contract creation with templates and clauses.

Features:
- Template library
- Clause library
- Contract building
- Version control
- Export functionality
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.db_utils import sanitize_text
from app.services.contract_builder import (
    get_contract_builder_service,
    ClauseCategory,
    ContractType
)

router = APIRouter(prefix="/contract-builder", tags=["contract-builder"])


# Request/Response Models
class CreateContractDraftRequest(BaseModel):
    name: str
    template_id: Optional[str] = None
    contract_type: ContractType = ContractType.CUSTOM


class AddSectionRequest(BaseModel):
    title: str
    content: str
    order: Optional[int] = None


class AddClauseRequest(BaseModel):
    clause_id: str
    section_id: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None


class UpdateSectionRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None


class ReorderSectionsRequest(BaseModel):
    section_order: List[str]


class SetVariablesRequest(BaseModel):
    variables: Dict[str, Any]


class CreateVersionRequest(BaseModel):
    notes: Optional[str] = None


class CompareVersionsRequest(BaseModel):
    version_a: int
    version_b: int


class CreateCustomClauseRequest(BaseModel):
    name: str
    category: ClauseCategory
    content: str
    variables: Optional[List[str]] = None


# Template Endpoints
@router.get("/templates")
async def get_contract_templates(
    contract_type: Optional[ContractType] = None,
    current_user = Depends(get_current_active_user)
):
    """Get contract templates."""
    service = get_contract_builder_service()
    templates = await service.get_contract_templates(contract_type)
    return {"templates": templates}


@router.get("/templates/{template_id}")
async def get_template_details(
    template_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get full template with content."""
    service = get_contract_builder_service()
    template = await service.get_template_details(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"template": template}


# Clause Library Endpoints
@router.get("/clauses")
async def get_clause_library(
    category: Optional[ClauseCategory] = None,
    search: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get clause library."""
    service = get_contract_builder_service()
    clauses = await service.get_clause_library(category, search)
    return {"clauses": clauses}


@router.get("/clauses/{clause_id}")
async def get_clause(
    clause_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get clause details."""
    service = get_contract_builder_service()
    clause = await service.get_clause(clause_id)
    
    if not clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clause not found"
        )
    
    return {"clause": clause}


# Contract Building Endpoints
@router.post("/contracts")
async def create_contract_draft(
    request: CreateContractDraftRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new contract draft."""
    service = get_contract_builder_service()
    
    contract = await service.create_contract_draft(
        user_id=current_user["id"],
        name=sanitize_text(request.name, 200),
        template_id=request.template_id,
        contract_type=request.contract_type
    )
    
    return {"contract": contract}


@router.post("/contracts/{contract_id}/sections")
async def add_section(
    contract_id: str,
    request: AddSectionRequest,
    current_user = Depends(get_current_active_user)
):
    """Add a section to contract."""
    service = get_contract_builder_service()
    
    section = await service.add_section(
        contract_id=contract_id,
        user_id=current_user["id"],
        title=sanitize_text(request.title, 300),
        content=sanitize_text(request.content, 50000),
        order=request.order
    )
    
    return {"section": section}


@router.post("/contracts/{contract_id}/clauses")
async def add_clause_to_contract(
    contract_id: str,
    request: AddClauseRequest,
    current_user = Depends(get_current_active_user)
):
    """Add a clause from library to contract."""
    service = get_contract_builder_service()
    
    result = await service.add_clause(
        contract_id=contract_id,
        user_id=current_user["id"],
        clause_id=request.clause_id,
        section_id=request.section_id,
        variables=request.variables
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to add clause")
        )
    
    return result


@router.put("/contracts/{contract_id}/sections/{section_id}")
async def update_section(
    contract_id: str,
    section_id: str,
    request: UpdateSectionRequest,
    current_user = Depends(get_current_active_user)
):
    """Update a contract section."""
    service = get_contract_builder_service()
    
    section = await service.update_section(
        contract_id=contract_id,
        user_id=current_user["id"],
        section_id=section_id,
        updates=request.dict(exclude_unset=True)
    )
    
    return {"section": section}


@router.delete("/contracts/{contract_id}/sections/{section_id}")
async def remove_section(
    contract_id: str,
    section_id: str,
    current_user = Depends(get_current_active_user)
):
    """Remove a section from contract."""
    service = get_contract_builder_service()
    
    success = await service.remove_section(
        contract_id=contract_id,
        user_id=current_user["id"],
        section_id=section_id
    )
    
    return {"success": success}


@router.put("/contracts/{contract_id}/sections/reorder")
async def reorder_sections(
    contract_id: str,
    request: ReorderSectionsRequest,
    current_user = Depends(get_current_active_user)
):
    """Reorder contract sections."""
    service = get_contract_builder_service()
    
    result = await service.reorder_sections(
        contract_id=contract_id,
        user_id=current_user["id"],
        section_order=request.section_order
    )
    
    return result


@router.put("/contracts/{contract_id}/variables")
async def set_variables(
    contract_id: str,
    request: SetVariablesRequest,
    current_user = Depends(get_current_active_user)
):
    """Set contract variables."""
    service = get_contract_builder_service()
    
    result = await service.set_variables(
        contract_id=contract_id,
        user_id=current_user["id"],
        variables=request.variables
    )
    
    return result


@router.get("/contracts/{contract_id}/preview")
async def preview_contract(
    contract_id: str,
    current_user = Depends(get_current_active_user)
):
    """Preview contract with variables applied."""
    service = get_contract_builder_service()
    result = await service.preview_contract(contract_id, current_user["id"])
    return result


@router.get("/contracts/{contract_id}/export/{format}")
async def export_contract(
    contract_id: str,
    format: str = "pdf",
    current_user = Depends(get_current_active_user)
):
    """Export contract to file."""
    if format not in ["pdf", "docx", "html"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Supported: pdf, docx, html"
        )
    
    service = get_contract_builder_service()
    result = await service.export_contract(contract_id, current_user["id"], format)
    return result


# Version Control Endpoints
@router.post("/contracts/{contract_id}/versions")
async def create_version(
    contract_id: str,
    request: CreateVersionRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new version of the contract."""
    service = get_contract_builder_service()
    
    version = await service.create_version(
        contract_id=contract_id,
        user_id=current_user["id"],
        notes=request.notes
    )
    
    return {"version": version}


@router.get("/contracts/{contract_id}/versions")
async def get_versions(
    contract_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get contract version history."""
    service = get_contract_builder_service()
    versions = await service.get_versions(contract_id, current_user["id"])
    return {"versions": versions}


@router.post("/contracts/{contract_id}/versions/compare")
async def compare_versions(
    contract_id: str,
    request: CompareVersionsRequest,
    current_user = Depends(get_current_active_user)
):
    """Compare two contract versions."""
    service = get_contract_builder_service()
    
    result = await service.compare_versions(
        contract_id=contract_id,
        user_id=current_user["id"],
        version_a=request.version_a,
        version_b=request.version_b
    )
    
    return result


# Custom Clauses
@router.post("/clauses/custom")
async def create_custom_clause(
    request: CreateCustomClauseRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a custom clause."""
    service = get_contract_builder_service()
    
    clause = await service.create_custom_clause(
        user_id=current_user["id"],
        name=sanitize_text(request.name, 200),
        category=request.category,
        content=sanitize_text(request.content, 50000),
        variables=request.variables
    )
    
    return {"clause": clause}


@router.get("/clauses/custom")
async def get_user_custom_clauses(
    current_user = Depends(get_current_active_user)
):
    """Get user's custom clauses."""
    service = get_contract_builder_service()
    clauses = await service.get_user_custom_clauses(current_user["id"])
    return {"clauses": clauses}
