# @AI-HINT: Learning center API endpoints
"""
Learning Center API - Educational content and tutorial endpoints.

Features:
- Content discovery
- Learning paths
- Progress tracking
- Quizzes
- Webinars
- Certifications
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.learning_center import (
    get_learning_service,
    LearningContentType,
    LearningCategory,
    DifficultyLevel
)

router = APIRouter(prefix="/learning", tags=["learning"])


# Request/Response Models
class UpdateProgressRequest(BaseModel):
    lesson_id: str
    completed: bool = True
    time_spent_seconds: int = 0


class CompleteContentRequest(BaseModel):
    quiz_score: Optional[int] = None


class SubmitQuizRequest(BaseModel):
    answers: Dict[str, Any]


# Content Discovery Endpoints
@router.get("/courses")
async def get_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_active_user)
):
    """Get all available courses/learning content."""
    service = get_learning_service()
    content = await service.get_featured_content()
    return {"courses": content, "total": len(content), "page": page, "page_size": page_size}


@router.get("/featured")
async def get_featured_content(
    current_user = Depends(get_current_active_user)
):
    """Get featured learning content."""
    service = get_learning_service()
    content = await service.get_featured_content()
    return {"content": content}


@router.get("/search")
async def search_content(
    query: Optional[str] = None,
    content_type: Optional[LearningContentType] = None,
    category: Optional[LearningCategory] = None,
    difficulty: Optional[DifficultyLevel] = None,
    limit: int = 20,
    offset: int = 0,
    current_user = Depends(get_current_active_user)
):
    """Search learning content."""
    service = get_learning_service()
    results = await service.search_content(query, content_type, category, difficulty, limit, offset)
    return results


@router.get("/categories/{category}")
async def get_content_by_category(
    category: LearningCategory,
    current_user = Depends(get_current_active_user)
):
    """Get content by category."""
    service = get_learning_service()
    content = await service.get_content_by_category(category)
    return {"content": content}


@router.get("/content/{content_id}")
async def get_content(
    content_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get content details."""
    service = get_learning_service()
    content = await service.get_content(content_id)
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return {"content": content}


# Learning Path Endpoints
@router.get("/paths")
async def get_learning_paths(
    current_user = Depends(get_current_active_user)
):
    """Get available learning paths."""
    service = get_learning_service()
    paths = await service.get_learning_paths()
    return {"paths": paths}


@router.get("/paths/{path_id}")
async def get_learning_path(
    path_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get learning path details."""
    service = get_learning_service()
    path = await service.get_learning_path(path_id)
    
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    return {"path": path}


@router.post("/paths/{path_id}/enroll")
async def enroll_in_path(
    path_id: str,
    current_user = Depends(get_current_active_user)
):
    """Enroll in a learning path."""
    service = get_learning_service()
    enrollment = await service.enroll_in_path(current_user["id"], path_id)
    return enrollment


# Progress Tracking Endpoints
@router.get("/progress")
async def get_user_progress(
    current_user = Depends(get_current_active_user)
):
    """Get user's learning progress."""
    service = get_learning_service()
    progress = await service.get_user_progress(current_user["id"])
    return {"progress": progress}


@router.put("/content/{content_id}/progress")
async def update_progress(
    content_id: str,
    request: UpdateProgressRequest,
    current_user = Depends(get_current_active_user)
):
    """Update learning progress."""
    service = get_learning_service()
    result = await service.update_progress(
        current_user["id"],
        content_id,
        request.lesson_id,
        request.completed,
        request.time_spent_seconds
    )
    return result


@router.post("/content/{content_id}/complete")
async def mark_content_complete(
    content_id: str,
    request: CompleteContentRequest,
    current_user = Depends(get_current_active_user)
):
    """Mark content as complete."""
    service = get_learning_service()
    result = await service.mark_content_complete(current_user["id"], content_id, request.quiz_score)
    return result


# Quiz Endpoints
@router.get("/content/{content_id}/quiz")
async def get_quiz(
    content_id: str,
    lesson_id: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get quiz for content."""
    service = get_learning_service()
    quiz = await service.get_quiz(content_id, lesson_id)
    return {"quiz": quiz}


@router.post("/quizzes/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    request: SubmitQuizRequest,
    current_user = Depends(get_current_active_user)
):
    """Submit quiz answers."""
    service = get_learning_service()
    result = await service.submit_quiz(current_user["id"], quiz_id, request.answers)
    return result


# Webinar Endpoints
@router.get("/webinars")
async def get_upcoming_webinars(
    current_user = Depends(get_current_active_user)
):
    """Get upcoming webinars."""
    service = get_learning_service()
    webinars = await service.get_upcoming_webinars()
    return {"webinars": webinars}


@router.post("/webinars/{webinar_id}/register")
async def register_for_webinar(
    webinar_id: str,
    current_user = Depends(get_current_active_user)
):
    """Register for a webinar."""
    service = get_learning_service()
    registration = await service.register_for_webinar(current_user["id"], webinar_id)
    return registration


# Certification Endpoints
@router.get("/certifications")
async def get_available_certifications(
    current_user = Depends(get_current_active_user)
):
    """Get available certifications."""
    service = get_learning_service()
    certifications = await service.get_available_certifications()
    return {"certifications": certifications}


@router.get("/certifications/me")
async def get_my_certifications(
    current_user = Depends(get_current_active_user)
):
    """Get user's earned certifications."""
    service = get_learning_service()
    certifications = await service.get_user_certifications(current_user["id"])
    return {"certifications": certifications}


# Bookmark Endpoints
@router.get("/bookmarks")
async def get_bookmarks(
    current_user = Depends(get_current_active_user)
):
    """Get user's bookmarked content."""
    service = get_learning_service()
    bookmarks = await service.get_bookmarks(current_user["id"])
    return {"bookmarks": bookmarks}


@router.post("/content/{content_id}/bookmark")
async def bookmark_content(
    content_id: str,
    current_user = Depends(get_current_active_user)
):
    """Bookmark content for later."""
    service = get_learning_service()
    result = await service.bookmark_content(current_user["id"], content_id)
    return result


@router.delete("/content/{content_id}/bookmark")
async def remove_bookmark(
    content_id: str,
    current_user = Depends(get_current_active_user)
):
    """Remove bookmark."""
    service = get_learning_service()
    success = await service.remove_bookmark(current_user["id"], content_id)
    return {"success": success}
