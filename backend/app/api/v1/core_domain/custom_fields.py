# @AI-HINT: Custom fields API - dynamic field definitions for entities
"""
Custom Fields API - Dynamic Metadata Endpoints

Provides:
- Field definition management
- Field value CRUD
- Field groups
- Export/import
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.services.custom_fields import custom_fields_service
from app.services.db_utils import sanitize_text


router = APIRouter()


# ============== Pydantic Models ==============

class CreateFieldDefinitionRequest(BaseModel):
    """Request to create a field definition."""
    entity_type: str = Field(..., description="project, user, freelancer, client, contract, proposal, invoice, milestone, team")
    name: str = Field(..., pattern=r'^[a-z][a-z0-9_]*$', description="Field identifier (snake_case)")
    field_type: str = Field(..., description="text, number, date, select, boolean, etc.")
    label: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    required: bool = False
    default_value: Optional[Any] = None
    validation: Optional[Dict] = None
    options: Optional[List[str]] = Field(None, description="For select/radio/multiselect")
    group_id: Optional[str] = None
    order: int = 0
    visible: bool = True
    editable: bool = True


class UpdateFieldDefinitionRequest(BaseModel):
    """Request to update a field definition."""
    label: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    required: Optional[bool] = None
    default_value: Optional[Any] = None
    validation: Optional[Dict] = None
    options: Optional[List[str]] = None
    group_id: Optional[str] = None
    order: Optional[int] = None
    visible: Optional[bool] = None
    editable: Optional[bool] = None


class SetFieldValueRequest(BaseModel):
    """Request to set a field value."""
    field_name: str
    value: Any


class SetMultipleValuesRequest(BaseModel):
    """Request to set multiple field values."""
    values: Dict[str, Any]


class CreateFieldGroupRequest(BaseModel):
    """Request to create a field group."""
    entity_type: str
    name: str = Field(..., pattern=r'^[a-z][a-z0-9_]*$')
    label: str = Field(..., max_length=100)
    description: Optional[str] = None
    order: int = 0
    collapsible: bool = True
    collapsed_by_default: bool = False


# ============== Field Definition Endpoints ==============

@router.post("/definitions")
async def create_field_definition(
    request: CreateFieldDefinitionRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Create a custom field definition.
    
    **Field Types:**
    - `text` - Single line text
    - `textarea` - Multi-line text
    - `number` - Numeric value
    - `integer` - Whole number
    - `decimal` - Decimal number
    - `boolean` - True/false
    - `date` - Date (YYYY-MM-DD)
    - `datetime` - Date and time
    - `email` - Email address
    - `url` - Web URL
    - `phone` - Phone number
    - `select` - Single selection (requires options)
    - `multiselect` - Multiple selection (requires options)
    - `checkbox` - Checkbox
    - `radio` - Radio buttons (requires options)
    - `currency` - Currency value
    - `percentage` - Percentage (0-100)
    - `json` - JSON data
    - `file` - File reference
    """
    # Admin only for creating definitions
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = await custom_fields_service.create_field_definition(
            user_id=str(current_user.get("id")),
            entity_type=request.entity_type,
            name=request.name,
            field_type=request.field_type,
            label=sanitize_text(request.label, 100),
            description=sanitize_text(request.description, 500) if request.description else None,
            required=request.required,
            default_value=request.default_value,
            validation=request.validation,
            options=request.options,
            group_id=request.group_id,
            order=request.order,
            visible=request.visible,
            editable=request.editable
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/definitions")
async def get_field_definitions(
    entity_type: str = Query(..., description="Entity type to get fields for"),
    include_hidden: bool = Query(False),
    current_user = Depends(get_current_active_user),
    
):
    """Get all field definitions for an entity type."""
    try:
        result = await custom_fields_service.get_field_definitions(
            entity_type=entity_type,
            include_hidden=include_hidden
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/definitions/{field_id}")
async def get_field_definition(
    field_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Get a specific field definition."""
    field = custom_fields_service._field_definitions.get(field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.put("/definitions/{field_id}")
async def update_field_definition(
    field_id: str,
    request: UpdateFieldDefinitionRequest,
    current_user = Depends(get_current_active_user),
    
):
    """Update a field definition (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        updates = request.dict(exclude_unset=True)
        result = await custom_fields_service.update_field_definition(
            user_id=str(current_user.get("id")),
            field_id=field_id,
            updates=updates
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/definitions/{field_id}")
async def delete_field_definition(
    field_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Delete a field definition (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = await custom_fields_service.delete_field_definition(
            user_id=str(current_user.get("id")),
            field_id=field_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== Field Value Endpoints ==============

@router.post("/values/{entity_type}/{entity_id}")
async def set_field_value(
    entity_type: str,
    entity_id: str,
    request: SetFieldValueRequest,
    current_user = Depends(get_current_active_user),
    
):
    """Set a custom field value for an entity."""
    try:
        result = await custom_fields_service.set_field_value(
            user_id=str(current_user.get("id")),
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=request.field_name,
            value=request.value
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/values/{entity_type}/{entity_id}")
async def set_multiple_field_values(
    entity_type: str,
    entity_id: str,
    request: SetMultipleValuesRequest,
    current_user = Depends(get_current_active_user),
    
):
    """Set multiple custom field values at once."""
    result = await custom_fields_service.set_multiple_field_values(
        user_id=str(current_user.get("id")),
        entity_type=entity_type,
        entity_id=entity_id,
        values=request.values
    )
    return result


@router.get("/values/{entity_type}/{entity_id}")
async def get_field_values(
    entity_type: str,
    entity_id: str,
    include_empty: bool = Query(True, description="Include fields with no value"),
    current_user = Depends(get_current_active_user),
    
):
    """Get all custom field values for an entity."""
    result = await custom_fields_service.get_field_values(
        entity_type=entity_type,
        entity_id=entity_id,
        include_empty=include_empty
    )
    return result


# ============== Field Group Endpoints ==============

@router.post("/groups")
async def create_field_group(
    request: CreateFieldGroupRequest,
    current_user = Depends(get_current_active_user),
    
):
    """Create a field group for organizing fields (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await custom_fields_service.create_field_group(
        user_id=str(current_user.get("id")),
        entity_type=request.entity_type,
        name=request.name,
        label=request.label,
        description=request.description,
        order=request.order,
        collapsible=request.collapsible,
        collapsed_by_default=request.collapsed_by_default
    )
    return result


@router.get("/groups")
async def get_field_groups(
    entity_type: str = Query(...),
    current_user = Depends(get_current_active_user),
    
):
    """Get all field groups for an entity type."""
    result = await custom_fields_service.get_field_groups(
        entity_type=entity_type
    )
    return result


# ============== Export/Import ==============

@router.get("/export")
async def export_field_definitions(
    entity_type: Optional[str] = Query(None),
    current_user = Depends(get_current_active_user),
    
):
    """Export field definitions (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await custom_fields_service.export_field_definitions(
        entity_type=entity_type
    )
    return result


# ============== Info ==============

@router.get("/info/types")
async def get_field_types(
    current_user = Depends(get_current_active_user),
    
):
    """Get available field types and entity types."""
    return {
        "field_types": list(custom_fields_service.FIELD_TYPES.keys()),
        "entity_types": custom_fields_service.ENTITY_TYPES,
        "field_type_details": {
            name: {k: v for k, v in config.items() if k != "python_type"}
            for name, config in custom_fields_service.FIELD_TYPES.items()
        }
    }
