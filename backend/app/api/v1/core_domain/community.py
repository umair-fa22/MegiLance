# @AI-HINT: Community Hub API - Q&A, Playbooks, Office Hours for freelancer community
"""
Community Hub API
Enables community-driven learning and collaboration through:
- Q&A StackOverflow-style questions and answers
- Playbooks - curated guides by top freelancers
- Office Hours - scheduled AMA/consultation sessions
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timezone
import json
import logging

from app.core.security import get_current_active_user
from app.models.user import User
from app.services import community_service
from app.services.db_utils import sanitize_text, paginate_params
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Pydantic Models ====================

# Q&A Models
class QuestionCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    content: str = Field(..., min_length=30, max_length=10000)
    tags: List[str] = Field(default=[], max_length=5)
    category: Optional[str] = Field(None, max_length=50)


class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    content: Optional[str] = Field(None, min_length=30, max_length=10000)
    tags: Optional[List[str]] = Field(None, max_length=5)


class AnswerCreate(BaseModel):
    content: str = Field(..., min_length=30, max_length=10000)


class AnswerUpdate(BaseModel):
    content: str = Field(..., min_length=30, max_length=10000)


class VoteCreate(BaseModel):
    vote_type: str = Field(..., pattern="^(upvote|downvote)$")


# Playbook Models
class PlaybookCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    description: str = Field(..., min_length=50, max_length=1000)
    content: str = Field(..., min_length=100, max_length=50000)
    category: str = Field(..., max_length=50)
    tags: List[str] = Field(default=[], max_length=10)
    difficulty_level: str = Field("intermediate", pattern="^(beginner|intermediate|advanced|expert)$")


class PlaybookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=1000)
    content: Optional[str] = Field(None, min_length=100, max_length=50000)
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = Field(None, max_length=10)
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced|expert)$")


# Office Hours Models
class OfficeHoursCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    description: str = Field(..., min_length=50, max_length=2000)
    scheduled_at: datetime
    duration_minutes: int = Field(60, ge=15, le=180)
    max_attendees: int = Field(50, ge=1, le=500)
    category: Optional[str] = Field(None, max_length=50)
    is_public: bool = True


class OfficeHoursUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=2000)
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    max_attendees: Optional[int] = Field(None, ge=1, le=500)
    is_public: Optional[bool] = None


# Initialize tables lazily on first request
_community_tables_initialized = False

def _lazy_ensure_community_tables():
    """Ensure community tables exist (called lazily on first request)."""
    global _community_tables_initialized
    if not _community_tables_initialized:
        try:
            community_service.ensure_community_tables()
            _community_tables_initialized = True
        except Exception as e:
            logger.warning(f"Could not initialize community tables: {e}")


# ==================== Q&A Endpoints ====================

@router.post("/questions", status_code=status.HTTP_201_CREATED)
async def create_question(
    question: QuestionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new community question."""
    tags_json = json.dumps(question.tags) if question.tags else "[]"

    result = community_service.insert_question(
        current_user.id, sanitize_text(question.title), sanitize_text(question.content), tags_json, question.category
    )

    if not result:
        raise HTTPException(status_code=500, detail="Failed to create question")

    return result


@router.get("/questions")
async def list_questions(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(open|closed|answered)$"),
    sort_by: str = Query("recent", pattern="^(recent|popular|unanswered)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List community questions with filters."""
    offset, limit = paginate_params(page, page_size)
    questions = community_service.fetch_questions(category, tag, status_filter, sort_by, offset, limit)
    return {"questions": questions, "total": len(questions)}


@router.get("/questions/{question_id}")
async def get_question(question_id: int):
    """Get a specific question with its answers."""
    question = community_service.get_question_detail(question_id)

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return question


@router.post("/questions/{question_id}/answers", status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: int,
    answer: AnswerCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Submit an answer to a question."""
    if not community_service.question_exists(question_id):
        raise HTTPException(status_code=404, detail="Question not found")

    community_service.insert_answer(question_id, current_user.id, sanitize_text(answer.content))
    return {"message": "Answer submitted successfully"}


@router.post("/questions/{question_id}/vote")
async def vote_question(
    question_id: int,
    vote: VoteCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Vote on a question."""
    result = community_service.vote_on_question(current_user.id, question_id, vote.vote_type)
    return {"message": result["message"]}


@router.post("/answers/{answer_id}/accept")
async def accept_answer(
    answer_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Accept an answer (only question author can do this)."""
    ownership = community_service.get_answer_ownership(answer_id)

    if not ownership:
        raise HTTPException(status_code=404, detail="Answer not found")

    if current_user.id != ownership["question_author_id"]:
        raise HTTPException(status_code=403, detail="Only the question author can accept answers")

    community_service.mark_answer_accepted(answer_id, ownership["question_id"])
    return {"message": "Answer accepted"}


# ==================== Playbook Endpoints ====================

@router.post("/playbooks", status_code=status.HTTP_201_CREATED)
async def create_playbook(
    playbook: PlaybookCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new playbook (guide/tutorial)."""
    tags_json = json.dumps(playbook.tags) if playbook.tags else "[]"

    community_service.insert_playbook(
        current_user.id, sanitize_text(playbook.title), sanitize_text(playbook.description), sanitize_text(playbook.content),
        playbook.category, tags_json, playbook.difficulty_level,
    )
    return {"message": "Playbook created as draft. Submit for review to publish."}


@router.get("/playbooks")
async def list_playbooks(
    category: Optional[str] = None,
    difficulty: Optional[str] = Query(None, pattern="^(beginner|intermediate|advanced|expert)$"),
    author_id: Optional[int] = None,
    status_filter: Optional[str] = Query("published", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List published playbooks."""
    offset, limit = paginate_params(page, page_size)
    playbooks = community_service.fetch_playbooks(category, difficulty, author_id, status_filter, offset, limit)
    return {"playbooks": playbooks, "total": len(playbooks)}


@router.get("/playbooks/{playbook_id}")
async def get_playbook(playbook_id: int):
    """Get a specific playbook with full content."""
    playbook = community_service.get_playbook_detail(playbook_id)

    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")

    return playbook


@router.post("/playbooks/{playbook_id}/publish")
async def publish_playbook(
    playbook_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Publish a draft playbook."""
    info = community_service.get_playbook_author_status(playbook_id)

    if not info:
        raise HTTPException(status_code=404, detail="Playbook not found")

    if info["author_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author can publish this playbook")

    if info["status"] == "published":
        raise HTTPException(status_code=400, detail="Playbook is already published")

    community_service.publish_playbook_by_id(playbook_id)
    return {"message": "Playbook published successfully"}


@router.post("/playbooks/{playbook_id}/like")
async def like_playbook(
    playbook_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Like or unlike a playbook."""
    result = community_service.toggle_playbook_like(current_user.id, playbook_id)
    return result


# ==================== Office Hours Endpoints ====================

@router.post("/office-hours", status_code=status.HTTP_201_CREATED)
async def create_office_hours(
    oh: OfficeHoursCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Schedule an office hours session."""
    if oh.scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Office hours must be scheduled in the future")

    community_service.insert_office_hours(
        current_user.id, sanitize_text(oh.title), sanitize_text(oh.description), oh.scheduled_at.isoformat(),
        oh.duration_minutes, oh.max_attendees, oh.category, oh.is_public,
    )
    return {"message": "Office hours scheduled successfully"}


@router.get("/office-hours")
async def list_office_hours(
    status_filter: Optional[str] = Query("upcoming", alias="status", pattern="^(upcoming|past|all)$"),
    host_id: Optional[int] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List office hours sessions."""
    offset, limit = paginate_params(page, page_size)
    sessions = community_service.fetch_office_hours(status_filter, host_id, category, offset, limit)
    return {"office_hours": sessions, "total": len(sessions)}


@router.get("/office-hours/{oh_id}")
async def get_office_hours(oh_id: int):
    """Get details of a specific office hours session."""
    detail = community_service.get_office_hours_detail(oh_id)

    if not detail:
        raise HTTPException(status_code=404, detail="Office hours not found")

    return detail


@router.post("/office-hours/{oh_id}/register")
async def register_for_office_hours(
    oh_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Register for an office hours session."""
    capacity = community_service.get_office_hours_capacity(oh_id)

    if not capacity:
        raise HTTPException(status_code=404, detail="Office hours not found")

    if capacity["status"] != "scheduled":
        raise HTTPException(status_code=400, detail="Registration is closed for this session")

    if capacity["attendee_count"] >= capacity["max_attendees"]:
        raise HTTPException(status_code=400, detail="This session is full")

    if community_service.check_oh_registration(oh_id, current_user.id):
        raise HTTPException(status_code=400, detail="You are already registered")

    community_service.register_user_for_oh(oh_id, current_user.id)
    return {"message": "Successfully registered for office hours", "scheduled_at": capacity["scheduled_at"]}


@router.delete("/office-hours/{oh_id}/register")
async def unregister_from_office_hours(
    oh_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Unregister from an office hours session."""
    if not community_service.unregister_user_from_oh(oh_id, current_user.id):
        raise HTTPException(status_code=400, detail="You are not registered for this session")

    return {"message": "Successfully unregistered"}


# ==================== Community Stats ====================

@router.get("/stats")
async def get_community_stats():
    """Get community statistics."""
    return community_service.get_community_stats()


@router.get("/trending-tags")
async def get_trending_tags(limit: int = Query(10, ge=1, le=50)):
    """Get trending tags from questions."""
    tags = community_service.get_trending_tags_data(limit)
    return {"trending_tags": tags}
