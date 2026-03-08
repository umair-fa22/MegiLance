# @AI-HINT: Scheduled tasks API endpoints
"""
Scheduler API - Background task management endpoints.

Features:
- Create and manage tasks
- Schedule recurring tasks
- View task history and statistics
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.scheduler import (
    get_scheduler_service,
    TaskStatus,
    TaskPriority,
    ScheduleType
)

router = APIRouter()


# Request/Response schemas
class CreateTaskRequest(BaseModel):
    """Create task request."""
    task_type: str
    payload: dict = {}
    priority: str = "normal"
    delay_seconds: int = 0
    max_retries: int = 3


class CreateScheduleRequest(BaseModel):
    """Create schedule request."""
    task_type: str
    payload: dict = {}
    schedule_type: str  # once, interval, daily, weekly, monthly
    interval_minutes: Optional[int] = None
    time_of_day: Optional[str] = None  # HH:MM
    day_of_week: Optional[int] = None  # 0-6
    day_of_month: Optional[int] = None  # 1-31


# API Endpoints
@router.post("/tasks")
async def create_task(
    request: CreateTaskRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new task."""
    service = get_scheduler_service()
    
    try:
        priority = TaskPriority(request.priority)
    except ValueError:
        priority = TaskPriority.NORMAL
    
    task = await service.create_task(
        task_type=request.task_type,
        payload=request.payload,
        priority=priority,
        delay_seconds=request.delay_seconds,
        max_retries=request.max_retries,
        user_id=current_user.id
    )
    
    return task


@router.get("/tasks")
async def list_tasks(
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """List user's tasks."""
    service = get_scheduler_service()
    
    task_status = None
    if status:
        try:
            task_status = TaskStatus(status)
        except ValueError:
            pass
    
    tasks = await service.list_tasks(
        status=task_status,
        task_type=task_type,
        user_id=current_user.id,
        limit=limit
    )
    
    return {"tasks": tasks, "count": len(tasks)}


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get task details."""
    service = get_scheduler_service()
    
    task = await service.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify ownership
    if task.get("user_id") and task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return task


@router.post("/tasks/{task_id}/run")
async def run_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Run a task immediately."""
    service = get_scheduler_service()
    
    task = await service.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.get("user_id") and task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await service.run_task(task_id)
    
    return result


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a pending task."""
    service = get_scheduler_service()
    
    task = await service.get_task(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.get("user_id") and task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    success = await service.cancel_task(task_id)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Task cannot be cancelled (already running or completed)"
        )
    
    return {"status": "cancelled", "task_id": task_id}


@router.post("/schedules")
async def create_schedule(
    request: CreateScheduleRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a recurring schedule."""
    service = get_scheduler_service()
    
    try:
        schedule_type = ScheduleType(request.schedule_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid schedule type. Use: {[s.value for s in ScheduleType]}"
        )
    
    schedule = await service.schedule_recurring(
        task_type=request.task_type,
        payload=request.payload,
        schedule_type=schedule_type,
        interval_minutes=request.interval_minutes,
        time_of_day=request.time_of_day,
        day_of_week=request.day_of_week,
        day_of_month=request.day_of_month,
        user_id=current_user.id
    )
    
    return schedule


@router.get("/schedules")
async def list_schedules(
    enabled_only: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """List user's schedules."""
    service = get_scheduler_service()
    
    schedules = await service.list_schedules(
        user_id=current_user.id,
        enabled_only=enabled_only
    )
    
    return {"schedules": schedules, "count": len(schedules)}


@router.get("/schedules/{schedule_id}")
async def get_schedule(
    schedule_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get schedule details."""
    service = get_scheduler_service()
    
    schedule = await service.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.get("user_id") and schedule["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return schedule


@router.patch("/schedules/{schedule_id}/toggle")
async def toggle_schedule(
    schedule_id: str,
    enabled: bool,
    current_user: User = Depends(get_current_active_user)
):
    """Enable or disable a schedule."""
    service = get_scheduler_service()
    
    schedule = await service.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.get("user_id") and schedule["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await service.toggle_schedule(schedule_id, enabled)
    
    return result


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a schedule."""
    service = get_scheduler_service()
    
    schedule = await service.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.get("user_id") and schedule["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    success = await service.delete_schedule(schedule_id)
    
    return {"status": "deleted", "schedule_id": schedule_id}


@router.get("/history")
async def get_task_history(
    task_type: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """Get task execution history."""
    service = get_scheduler_service()
    
    history = await service.get_task_history(task_type, limit)
    
    # Filter by user (if not admin)
    # In production, would filter by user_id
    
    return {"history": history, "count": len(history)}


@router.get("/statistics")
async def get_statistics(
    current_user: User = Depends(get_current_active_user)
):
    """Get task statistics."""
    service = get_scheduler_service()
    
    stats = await service.get_statistics()
    
    return stats
