# @AI-HINT: Workflow automation API for triggers, actions, and automated processes
"""
Workflow Automation API

Endpoints for creating and managing automated workflows,
triggers, conditions, and actions.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user, require_admin
from app.services.workflow_automation import (
    get_workflow_automation_service,
    TriggerType,
    ActionType,
    WorkflowStatus
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


# Request/Response Models
class TriggerConfig(BaseModel):
    type: TriggerType
    config: Dict[str, Any] = {}


class ConditionConfig(BaseModel):
    field: str
    operator: str
    value: Any


class ActionConfig(BaseModel):
    type: ActionType
    config: Dict[str, Any] = {}


class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    trigger: TriggerConfig
    conditions: List[ConditionConfig] = []
    actions: List[ActionConfig]


class CreateFromTemplateRequest(BaseModel):
    template_id: str
    name: Optional[str] = None
    customizations: Optional[Dict[str, Any]] = None


class UpdateWorkflowRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[TriggerConfig] = None
    conditions: Optional[List[ConditionConfig]] = None
    actions: Optional[List[ActionConfig]] = None


class ExecuteWorkflowRequest(BaseModel):
    test_data: Optional[Dict[str, Any]] = None


# Template Endpoints
@router.get("/templates")
async def get_workflow_templates(
    category: Optional[str] = None,
    
):
    """Get available workflow templates."""
    service = get_workflow_automation_service()
    templates = await service.get_templates(category)
    return {"templates": templates, "count": len(templates)}


@router.get("/templates/categories")
async def get_template_categories(
    
):
    """Get workflow template categories."""
    service = get_workflow_automation_service()
    categories = service.get_template_categories()
    return {"categories": categories}


@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    
):
    """Get a specific workflow template."""
    service = get_workflow_automation_service()
    template = service.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"template": template}


# Workflow CRUD Endpoints
@router.post("")
async def create_workflow(
    request: CreateWorkflowRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new workflow."""
    service = get_workflow_automation_service()
    result = service.create_workflow(
        user_id=current_user["id"],
        name=request.name,
        description=request.description,
        trigger=request.trigger.dict(),
        conditions=[c.dict() for c in request.conditions],
        actions=[a.dict() for a in request.actions]
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/from-template")
async def create_from_template(
    request: CreateFromTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Create workflow from template."""
    service = get_workflow_automation_service()
    result = service.create_from_template(
        user_id=current_user["id"],
        template_id=request.template_id,
        name=request.name,
        customizations=request.customizations
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/my-workflows")
async def get_my_workflows(
    status_filter: Optional[WorkflowStatus] = None,
    limit: int = Query(50, le=100),
    current_user = Depends(get_current_active_user)
):
    """Get current user's workflows."""
    service = get_workflow_automation_service()
    workflows = await service.get_user_workflows(
        current_user["id"],
        status_filter,
        limit
    )
    return workflows


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get a specific workflow."""
    service = get_workflow_automation_service()
    workflow = await service.get_workflow(current_user["id"], workflow_id)
    
    if not workflow or "error" in workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {"workflow": workflow}


@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    request: UpdateWorkflowRequest,
    current_user = Depends(get_current_active_user)
):
    """Update a workflow."""
    service = get_workflow_automation_service()
    updates = {k: v for k, v in request.dict().items() if v is not None}
    
    result = await service.update_workflow(
        current_user["id"],
        workflow_id,
        updates
    )
    return result


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a workflow."""
    service = get_workflow_automation_service()
    result = await service.delete_workflow(current_user["id"], workflow_id)
    return result


# Workflow Status Control
@router.post("/{workflow_id}/activate")
async def activate_workflow(
    workflow_id: str,
    current_user = Depends(get_current_active_user)
):
    """Activate a workflow."""
    service = get_workflow_automation_service()
    result = await service.activate_workflow(current_user["id"], workflow_id)
    return result


@router.post("/{workflow_id}/pause")
async def pause_workflow(
    workflow_id: str,
    current_user = Depends(get_current_active_user)
):
    """Pause a workflow."""
    service = get_workflow_automation_service()
    result = await service.pause_workflow(current_user["id"], workflow_id)
    return result


# Manual Execution
@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    request: Optional[ExecuteWorkflowRequest] = None,
    current_user = Depends(get_current_active_user)
):
    """Manually execute a workflow."""
    service = get_workflow_automation_service()
    result = await service.execute_workflow(
        current_user["id"],
        workflow_id,
        request.test_data if request else None
    )
    return result


# Execution History
@router.get("/history/all")
async def get_execution_history(
    workflow_id: Optional[str] = None,
    limit: int = Query(50, le=100),
    current_user = Depends(get_current_active_user)
):
    """Get workflow execution history."""
    service = get_workflow_automation_service()
    history = await service.get_execution_history(
        current_user["id"],
        workflow_id,
        limit
    )
    return history


@router.get("/history/{execution_id}")
async def get_execution_details(
    execution_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get details of a workflow execution."""
    service = get_workflow_automation_service()
    execution = await service.get_execution_details(
        current_user["id"],
        execution_id
    )
    
    if not execution or "error" in execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return {"execution": execution}


# Available Triggers and Actions
@router.get("/meta/triggers")
async def get_available_triggers(
    
):
    """Get available trigger types."""
    service = get_workflow_automation_service()
    triggers = service.get_available_triggers()
    return {"triggers": triggers}


@router.get("/meta/actions")
async def get_available_actions(
    
):
    """Get available action types."""
    service = get_workflow_automation_service()
    actions = service.get_available_actions()
    return {"actions": actions}


@router.get("/meta/operators")
async def get_condition_operators(
    
):
    """Get available condition operators."""
    service = get_workflow_automation_service()
    operators = service.get_condition_operators()
    return {"operators": operators}


# Statistics
@router.get("/stats/summary")
async def get_workflow_stats(
    period_days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_active_user)
):
    """Get workflow statistics."""
    service = get_workflow_automation_service()
    stats = service.get_workflow_stats(current_user["id"], period_days)
    return {"statistics": stats}


# Admin Endpoints
@router.get("/admin/all")
async def admin_get_all_workflows(
    user_id: Optional[int] = None,
    status_filter: Optional[WorkflowStatus] = None,
    limit: int = Query(100, le=500),
    current_user = Depends(require_admin)
):
    """Admin: Get all workflows."""
    return {
        "workflows": [],
        "total": 0,
        "message": "Admin workflow listing not yet implemented"
    }


@router.get("/admin/stats")
async def admin_get_global_stats(
    period_days: int = Query(30, ge=1, le=365),
    current_user = Depends(require_admin)
):
    """Admin: Get global workflow statistics."""
    return {
        "period_days": period_days,
        "total_workflows": 0,
        "active_workflows": 0,
        "total_executions": 0,
        "executions_per_trigger": {},
        "most_used_actions": [],
        "average_execution_time_ms": 0
    }
