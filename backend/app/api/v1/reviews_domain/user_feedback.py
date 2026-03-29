# @AI-HINT: User feedback API for NPS surveys, feature requests, and satisfaction tracking
"""
User Feedback System API

Endpoints for feedback collection, surveys, feature requests,
voting, and satisfaction analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.user_feedback import (
    get_user_feedback_service,
    FeedbackType,
    FeedbackStatus,
    SurveyType
)

router = APIRouter(prefix="/feedback", tags=["feedback"])


# Request/Response Models
class SubmitFeedbackRequest(BaseModel):
    type: FeedbackType
    title: str
    description: str
    category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class FeatureRequestRequest(BaseModel):
    title: str
    description: str
    use_case: Optional[str] = None
    priority_to_user: Optional[str] = None


class VoteRequest(BaseModel):
    vote: int  # 1 or -1


class SurveyResponseRequest(BaseModel):
    responses: Dict[str, Any]


class CreateSurveyRequest(BaseModel):
    type: SurveyType
    name: str
    target_audience: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None
    active_days: int = 30


class QuickFeedbackRequest(BaseModel):
    page: str
    rating: int  # 1-5
    comment: Optional[str] = None


# Feedback Submission Endpoints
@router.post("")
async def submit_feedback(
    request: SubmitFeedbackRequest,
    current_user = Depends(get_current_active_user)
):
    """Submit feedback."""
    service = get_user_feedback_service()
    result = await service.submit_feedback(
        user_id=current_user["id"],
        feedback_type=request.type,
        title=request.title,
        description=request.description,
        category=request.category,
        metadata=request.metadata
    )
    return result


@router.get("/my-feedback")
async def get_my_feedback(
    status_filter: Optional[FeedbackStatus] = None,
    type_filter: Optional[FeedbackType] = None,
    limit: int = Query(50, le=100),
    current_user = Depends(get_current_active_user)
):
    """Get current user's submitted feedback."""
    service = get_user_feedback_service()
    feedback = await service.get_user_feedback(
        current_user["id"],
        status_filter,
        type_filter,
        limit
    )
    return feedback


@router.get("/{feedback_id}")
async def get_feedback(
    feedback_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get specific feedback details."""
    service = get_user_feedback_service()
    feedback = await service.get_feedback(feedback_id)
    
    if not feedback or "error" in feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"feedback": feedback}


# Voting Endpoints
@router.post("/{feedback_id}/vote")
async def vote_on_feedback(
    feedback_id: str,
    request: VoteRequest,
    current_user = Depends(get_current_active_user)
):
    """Vote on feedback (upvote/downvote)."""
    if request.vote not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote must be 1 or -1")
    
    service = get_user_feedback_service()
    result = await service.vote_feedback(
        current_user["id"],
        feedback_id,
        request.vote
    )
    return result


@router.delete("/{feedback_id}/vote")
async def remove_vote(
    feedback_id: str,
    current_user = Depends(get_current_active_user)
):
    """Remove vote from feedback."""
    service = get_user_feedback_service()
    result = await service.unvote_feedback(current_user["id"], feedback_id)
    return result


# Public Feedback Board
@router.get("/board/public")
async def get_public_feedback_board(
    status_filter: Optional[FeedbackStatus] = None,
    type_filter: Optional[FeedbackType] = None,
    sort_by: str = Query("votes", enum=["votes", "recent", "trending"]),
    limit: int = Query(50, le=100),
    
):
    """Get public feedback board."""
    service = get_user_feedback_service()
    feedback = await service.get_public_feedback(
        status_filter,
        type_filter,
        sort_by,
        limit
    )
    return feedback


# Feature Requests
@router.post("/feature-request")
async def submit_feature_request(
    request: FeatureRequestRequest,
    current_user = Depends(get_current_active_user)
):
    """Submit a feature request."""
    service = get_user_feedback_service()
    result = await service.submit_feature_request(
        user_id=current_user["id"],
        title=request.title,
        description=request.description,
        use_case=request.use_case,
        priority_to_user=request.priority_to_user
    )
    return result


@router.get("/roadmap/public")
async def get_feature_roadmap(
    
):
    """Get public feature roadmap."""
    service = get_user_feedback_service()
    roadmap = await service.get_feature_roadmap()
    return roadmap


# Survey Endpoints
@router.get("/surveys/templates")
async def get_survey_templates(
    
):
    """Get available survey templates."""
    service = get_user_feedback_service()
    templates = await service.get_survey_templates()
    return {"templates": templates}


@router.get("/surveys/active")
async def get_active_surveys(
    current_user = Depends(get_current_active_user)
):
    """Get active surveys for current user."""
    service = get_user_feedback_service()
    surveys = await service.get_active_surveys(current_user["id"])
    return surveys


@router.post("/surveys/{survey_id}/respond")
async def submit_survey_response(
    survey_id: str,
    request: SurveyResponseRequest,
    current_user = Depends(get_current_active_user)
):
    """Submit survey response."""
    service = get_user_feedback_service()
    result = await service.submit_survey_response(
        current_user["id"],
        survey_id,
        request.responses
    )
    return result


# NPS Endpoints
@router.get("/nps/score")
async def get_nps_score(
    period_days: int = Query(30, ge=7, le=365),
    current_user = Depends(get_current_active_user)
):
    """Get Net Promoter Score (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    nps = await service.calculate_nps(period_days)
    return nps


@router.get("/nps/trend")
async def get_nps_trend(
    periods: int = Query(6, ge=1, le=12),
    period_type: str = Query("month", enum=["week", "month"]),
    current_user = Depends(get_current_active_user)
):
    """Get NPS trend over time (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    trend = await service.get_nps_trend(periods, period_type)
    return trend


# CSAT Endpoints
@router.get("/csat/score")
async def get_csat_score(
    period_days: int = Query(30, ge=7, le=365),
    current_user = Depends(get_current_active_user)
):
    """Get Customer Satisfaction Score (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    csat = await service.calculate_csat(period_days)
    return csat


# Quick Feedback (In-App)
@router.post("/quick")
async def submit_quick_feedback(
    request: QuickFeedbackRequest,
    current_user = Depends(get_current_active_user)
):
    """Submit quick in-app feedback."""
    if not 1 <= request.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    service = get_user_feedback_service()
    result = await service.submit_quick_feedback(
        current_user["id"],
        request.page,
        request.rating,
        request.comment
    )
    return result


# Admin Endpoints
@router.get("/admin/analytics")
async def get_feedback_analytics(
    period_days: int = Query(30, ge=7, le=365),
    current_user = Depends(get_current_active_user)
):
    """Get feedback analytics (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    analytics = await service.get_feedback_analytics(period_days)
    return {"analytics": analytics}


@router.get("/admin/sentiment")
async def get_sentiment_analysis(
    period_days: int = Query(30, ge=7, le=365),
    current_user = Depends(get_current_active_user)
):
    """Get feedback sentiment analysis (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    sentiment = await service.get_sentiment_analysis(period_days)
    return sentiment


@router.put("/admin/{feedback_id}")
async def admin_update_feedback(
    feedback_id: str,
    updates: Dict[str, Any],
    current_user = Depends(get_current_active_user)
):
    """Update feedback status (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    result = await service.update_feedback(feedback_id, updates)
    return result


@router.post("/admin/surveys")
async def admin_create_survey(
    request: CreateSurveyRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new survey (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    result = await service.create_survey(
        admin_id=current_user["id"],
        survey_type=request.type,
        name=request.name,
        target_audience=request.target_audience,
        questions=request.questions,
        active_days=request.active_days
    )
    return result


@router.get("/admin/satisfaction-by-feature")
async def get_satisfaction_by_feature(
    period_days: int = Query(30, ge=7, le=365),
    current_user = Depends(get_current_active_user)
):
    """Get satisfaction breakdown by feature (admin)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_user_feedback_service()
    satisfaction = await service.get_satisfaction_by_feature(period_days)
    return satisfaction
