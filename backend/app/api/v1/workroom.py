# @AI-HINT: Collaboration Workroom API - Kanban, Files, Discussions for project spaces
"""
Collaboration Workroom API - uses service layer for all DB operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone
import json
import uuid
import logging
import os

from app.core.security import get_current_active_user
from app.core.config import get_settings
from app.models.user import User
from app.services import workroom_service
from app.services.db_utils import paginate_params
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()


# ==================== Pydantic Models ====================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    column: str = Field("todo", pattern="^(todo|in_progress|review|done)$")
    priority: str = Field("medium", pattern="^(low|medium|high|urgent)$")
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    labels: List[str] = Field(default=[])


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    column: Optional[str] = Field(None, pattern="^(todo|in_progress|review|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    labels: Optional[List[str]] = None
    order_index: Optional[int] = None


class TaskMoveRequest(BaseModel):
    column: str = Field(..., pattern="^(todo|in_progress|review|done)$")
    order_index: int = Field(..., ge=0)


class DiscussionCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=10000)
    is_pinned: bool = False


class DiscussionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=10000)
    is_pinned: Optional[bool] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[int] = None


class FileMetadataUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


# ==================== Contract Access Helper ====================

def _verify_contract_access(contract_id: int, user_id: int) -> tuple:
    """Verify user has access to contract workroom. Raises HTTPException if not."""
    parties = workroom_service.get_contract_parties(contract_id)
    if not parties:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = parties["client_id"]
    freelancer_id = parties["freelancer_id"]
    contract_status = parties["status"]

    if user_id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")

    return client_id, freelancer_id, contract_status


# ==================== Kanban Board Endpoints ====================

@router.get("/my-workrooms")
async def get_my_workrooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Get all workrooms (contracts) for the current user."""
    from app.db.turso_http import execute_query
    offset = (page - 1) * page_size
    result = execute_query(
        """SELECT c.id, c.project_id, c.client_id, c.freelancer_id, c.status,
                  c.amount, c.created_at, p.title as project_title
           FROM contracts c LEFT JOIN projects p ON c.project_id = p.id
           WHERE c.client_id = ? OR c.freelancer_id = ?
           ORDER BY c.updated_at DESC LIMIT ? OFFSET ?""",
        [current_user.id, current_user.id, page_size, offset]
    )
    cols = result.get("columns", result.get("cols", []))
    _cn = lambda c: c.get("name", c) if isinstance(c, dict) else c
    _cv = lambda c: c.get("value") if isinstance(c, dict) else c
    workrooms = [{_cn(col): _cv(v) for col, v in zip(cols, r)} for r in result.get("rows", [])]
    return {"workrooms": workrooms, "total": len(workrooms)}


@router.get("/contracts/{contract_id}/board")
async def get_kanban_board(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get the complete Kanban board for a contract workroom."""
    _verify_contract_access(contract_id, current_user.id)
    return workroom_service.get_board_tasks(contract_id)


@router.post("/contracts/{contract_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    contract_id: int,
    task: TaskCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new task on the Kanban board."""
    _verify_contract_access(contract_id, current_user.id)

    now = datetime.now(timezone.utc).isoformat()
    labels_json = json.dumps(task.labels) if task.labels else "[]"
    due_date = task.due_date.isoformat() if task.due_date else None

    next_order = workroom_service.get_next_order_index(contract_id, task.column)

    task_id = workroom_service.create_task(
        contract_id, task.title, task.description, task.column, task.priority,
        task.assignee_id, current_user.id, due_date, labels_json, next_order, now
    )

    workroom_service.log_activity(
        contract_id, current_user.id, "task_created", "task", task_id, f"Created task: {task.title}"
    )

    return {
        "id": task_id,
        "title": task.title,
        "column": task.column,
        "priority": task.priority,
        "created_at": now,
        "message": "Task created successfully"
    }


@router.patch("/tasks/{task_id}")
async def update_task(
    task_id: int,
    update: TaskUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a task."""
    task_info = workroom_service.get_task_info(task_id)
    if not task_info:
        raise HTTPException(status_code=404, detail="Task not found")

    contract_id = task_info["contract_id"]
    old_column = task_info["column_name"]
    _verify_contract_access(contract_id, current_user.id)

    update_fields = []
    params = []
    data = update.model_dump(exclude_unset=True)

    for field, value in data.items():
        if value is not None:
            if field == "column":
                field = "column_name"
            if field == "labels":
                value = json.dumps(value)
            elif field == "due_date":
                value = value.isoformat()
            update_fields.append(f"{field} = ?")
            params.append(value)

    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(task_id)

        workroom_service.update_task_fields(task_id, ', '.join(update_fields), params)

        now = datetime.now(timezone.utc).isoformat()
        if update.column == "done" and old_column != "done":
            workroom_service.mark_task_completed(task_id, now)
            workroom_service.log_activity(contract_id, current_user.id, "task_completed", "task", task_id)
        elif update.column and update.column != "done" and old_column == "done":
            workroom_service.unmark_task_completed(task_id)

    return {"message": "Task updated successfully"}


@router.post("/tasks/{task_id}/move")
async def move_task(
    task_id: int,
    move: TaskMoveRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Move a task to a different column or position."""
    task_info = workroom_service.get_task_info(task_id)
    if not task_info:
        raise HTTPException(status_code=404, detail="Task not found")

    contract_id = task_info["contract_id"]
    old_column = task_info["column_name"]
    _verify_contract_access(contract_id, current_user.id)

    now = datetime.now(timezone.utc).isoformat()
    is_completed = 1 if move.column == "done" else 0
    completed_at = now if move.column == "done" and old_column != "done" else None

    workroom_service.move_task(task_id, move.column, move.order_index, is_completed, completed_at, now)

    workroom_service.log_activity(
        contract_id, current_user.id, "task_moved", "task", task_id,
        f"Moved task from {old_column} to {move.column}"
    )

    return {"message": "Task moved successfully"}


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a task."""
    task_info = workroom_service.get_task_for_delete(task_id)
    if not task_info:
        raise HTTPException(status_code=404, detail="Task not found")

    contract_id = task_info["contract_id"]
    title = task_info["title"]
    _verify_contract_access(contract_id, current_user.id)

    workroom_service.delete_task_and_comments(task_id)

    workroom_service.log_activity(
        contract_id, current_user.id, "task_deleted", "task", task_id, f"Deleted task: {title}"
    )


# ==================== File Sharing Endpoints ====================

@router.get("/contracts/{contract_id}/files")
async def list_files(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """List all files in a contract workroom."""
    _verify_contract_access(contract_id, current_user.id)
    files = workroom_service.list_contract_files(contract_id)
    return {"files": files, "total": len(files)}


@router.post("/contracts/{contract_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_file(
    contract_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file to the workroom."""
    _verify_contract_access(contract_id, current_user.id)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    workroom_dir = os.path.join(settings.upload_dir, "workroom", str(contract_id))
    os.makedirs(workroom_dir, exist_ok=True)

    file_path = os.path.join(workroom_dir, unique_filename)

    content = await file.read()
    file_size = len(content)

    if file_size > settings.max_upload_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {settings.max_upload_size} bytes")

    with open(file_path, "wb") as f:
        f.write(content)

    now = datetime.now(timezone.utc).isoformat()

    workroom_service.insert_file_record(
        contract_id, current_user.id, unique_filename, file.filename,
        file_path, file_size, file.content_type, description, now
    )

    workroom_service.log_activity(
        contract_id, current_user.id, "file_uploaded", "file", None, f"Uploaded file: {file.filename}"
    )

    return {"message": "File uploaded successfully", "filename": file.filename, "size": file_size}


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get file download URL/path."""
    file_info = workroom_service.get_file_info(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")

    contract_id = file_info["contract_id"]
    _verify_contract_access(contract_id, current_user.id)

    workroom_service.increment_download_count(file_id)

    return {
        "file_id": file_id,
        "original_name": file_info["original_name"],
        "download_url": f"/uploads/workroom/{contract_id}/{os.path.basename(file_info['file_path'])}"
    }


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a file from workroom."""
    file_info = workroom_service.get_file_for_delete(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")

    contract_id = file_info["contract_id"]
    _verify_contract_access(contract_id, current_user.id)

    file_path = file_info["file_path"]
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.warning(f"Could not delete file: {e}")

    workroom_service.delete_file_record(file_id)

    workroom_service.log_activity(
        contract_id, current_user.id, "file_deleted", "file", file_id, f"Deleted file: {file_info['original_name']}"
    )


# ==================== Discussion Endpoints ====================

@router.get("/contracts/{contract_id}/discussions")
async def list_discussions(
    contract_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """List discussions in a contract workroom."""
    offset, limit = paginate_params(page, page_size)
    _verify_contract_access(contract_id, current_user.id)
    discussions = workroom_service.list_contract_discussions(contract_id, limit, offset)
    return {"discussions": discussions, "total": len(discussions)}


@router.post("/contracts/{contract_id}/discussions", status_code=status.HTTP_201_CREATED)
async def create_discussion(
    contract_id: int,
    discussion: DiscussionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new discussion thread."""
    _verify_contract_access(contract_id, current_user.id)

    now = datetime.now(timezone.utc).isoformat()
    workroom_service.create_discussion_record(
        contract_id, current_user.id, discussion.title, discussion.content, discussion.is_pinned, now
    )

    workroom_service.log_activity(
        contract_id, current_user.id, "discussion_created", "discussion", None,
        f"Started discussion: {discussion.title}"
    )

    return {"message": "Discussion created successfully"}


@router.get("/discussions/{discussion_id}")
async def get_discussion(
    discussion_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a discussion with all replies."""
    discussion = workroom_service.get_discussion_detail(discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    contract_id = discussion["contract_id"]
    _verify_contract_access(contract_id, current_user.id)

    replies = workroom_service.get_discussion_replies(discussion_id)
    discussion["replies"] = replies
    return discussion


@router.post("/discussions/{discussion_id}/replies", status_code=status.HTTP_201_CREATED)
async def add_reply(
    discussion_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Add a reply to a discussion."""
    contract_id = workroom_service.get_discussion_contract_id(discussion_id)
    if contract_id is None:
        raise HTTPException(status_code=404, detail="Discussion not found")

    _verify_contract_access(contract_id, current_user.id)

    now = datetime.now(timezone.utc).isoformat()
    workroom_service.create_reply_record(discussion_id, current_user.id, comment.parent_id, comment.content, now)

    return {"message": "Reply added successfully"}


# ==================== Activity Feed ====================

@router.get("/contracts/{contract_id}/activity")
async def get_workroom_activity(
    contract_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Get activity feed for a workroom."""
    offset, limit = paginate_params(page, page_size)
    _verify_contract_access(contract_id, current_user.id)
    activities = workroom_service.get_activity_feed(contract_id, limit, offset)
    return {"activities": activities, "total": len(activities)}


# ==================== Workroom Summary ====================

@router.get("/contracts/{contract_id}/summary")
async def get_workroom_summary(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get summary statistics for a workroom."""
    _verify_contract_access(contract_id, current_user.id)
    return workroom_service.get_workroom_summary_data(contract_id)
