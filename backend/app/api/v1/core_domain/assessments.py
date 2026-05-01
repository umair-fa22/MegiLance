# @AI-HINT: Skill Assessment API endpoints - professional skill verification and certification
"""
Skill Assessment API
====================
Endpoints for:
- Taking skill assessments
- Viewing results and badges
- Managing skill certifications
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.models.user import User, UserType
from app.services.skill_assessment import (
    get_assessment_engine,
    DifficultyLevel
)

router = APIRouter()


def _verify_session_owner(engine, session_id: str, user_id: int):
    """Verify the assessment session belongs to the current user."""
    session = engine._active_sessions.get(session_id)
    if session and session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")


# ============================================================================
# SCHEMAS
# ============================================================================

class StartAssessmentRequest(BaseModel):
    """Request to start a new assessment"""
    skill: str = Field(..., description="Skill to assess (e.g., 'python', 'javascript')")
    difficulty: str = Field(
        default="intermediate",
        description="Difficulty level: basic, intermediate, expert"
    )
    question_count: int = Field(
        default=10,
        ge=5,
        le=30,
        description="Number of questions"
    )


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer"""
    question_id: str
    answer: Any  # Can be int (MCQ), str (code), list (multi-select)


class FocusEventRequest(BaseModel):
    """Request to record focus event"""
    event_type: str = Field(..., description="blur, focus, visibility_hidden, visibility_visible")


class AssessmentResultResponse(BaseModel):
    """Assessment result response"""
    session_id: str
    skill: str
    difficulty: str
    status: str
    score: float
    passed: bool
    badges: List[dict]


# ============================================================================
# AVAILABLE SKILLS
# ============================================================================

@router.get("/skills/available")
async def get_available_skills(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of skills available for assessment
    
    Returns skills with question counts and difficulty levels.
    """
    engine = get_assessment_engine()
    skills = engine.get_available_skills()
    
    return {
        "success": True,
        "skills": skills
    }


# ============================================================================
# START ASSESSMENT
# ============================================================================

@router.post("/start")
async def start_assessment(
    request: StartAssessmentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Start a new skill assessment
    
    Creates a timed assessment session with randomly selected questions.
    """
    if current_user.user_type != UserType.FREELANCER:
        raise HTTPException(
            status_code=403,
            detail="Only freelancers can take skill assessments"
        )
    
    try:
        difficulty = DifficultyLevel(request.difficulty)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty. Must be: basic, intermediate, expert"
        )
    
    try:
        engine = get_assessment_engine()
        result = engine.create_assessment(
            user_id=current_user.id,
            skill=request.skill,
            difficulty=difficulty,
            question_count=request.question_count
        )
        
        return {
            "success": True,
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Internal server error")


# ============================================================================
# QUESTIONS
# ============================================================================

@router.get("/session/{session_id}/question/{index}")
async def get_question(
    session_id: str,
    index: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific question from the assessment
    
    Returns question without correct answer.
    """
    engine = get_assessment_engine()
    _verify_session_owner(engine, session_id, current_user.id)
    question = engine.get_question(session_id, index)
    
    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found or session expired"
        )
    
    return {
        "success": True,
        **question
    }


@router.post("/session/{session_id}/answer")
async def submit_answer(
    session_id: str,
    request: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit an answer for a question
    
    Supports MCQ (int), multi-select (list), code (str).
    """
    engine = get_assessment_engine()
    _verify_session_owner(engine, session_id, current_user.id)
    result = engine.submit_answer(
        session_id=session_id,
        question_id=request.question_id,
        answer=request.answer
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/session/{session_id}/focus-event")
async def record_focus_event(
    session_id: str,
    request: FocusEventRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Record a focus/blur event for proctoring
    
    Used to detect tab switching during assessment.
    """
    engine = get_assessment_engine()
    _verify_session_owner(engine, session_id, current_user.id)
    engine.record_focus_event(session_id, request.event_type)
    
    return {"success": True}


# ============================================================================
# COMPLETE & RESULTS
# ============================================================================

@router.post("/session/{session_id}/complete")
async def complete_assessment(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Complete the assessment and get results
    
    Triggers auto-grading and badge assignment.
    """
    engine = get_assessment_engine()
    _verify_session_owner(engine, session_id, current_user.id)
    result = engine.complete_assessment(session_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "success": True,
        **result
    }


@router.get("/session/{session_id}/results")
async def get_assessment_results(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get results for a completed assessment
    """
    engine = get_assessment_engine()
    _verify_session_owner(engine, session_id, current_user.id)
    result = engine.complete_assessment(session_id)
    
    if result.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="Assessment not yet completed"
        )
    
    return {
        "success": True,
        **result
    }


# ============================================================================
# USER PROFILE
# ============================================================================

@router.get("/profile")
async def get_skill_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's skill assessment profile
    
    Returns all verified skills, badges, and assessment history.
    """
    engine = get_assessment_engine()
    profile = engine.get_user_skill_profile(current_user.id)
    
    return {
        "success": True,
        **profile
    }


@router.get("/profile/{user_id}")
async def get_user_skill_profile(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get another user's skill profile (public view)
    
    Shows verified skills and badges only.
    """
    engine = get_assessment_engine()
    profile = engine.get_user_skill_profile(user_id)
    
    # Filter to only show passed assessments
    profile["skills"] = [s for s in profile["skills"] if s["passed"]]
    
    return {
        "success": True,
        **profile
    }


# ============================================================================
# LEADERBOARD
# ============================================================================

@router.get("/leaderboard/{skill}")
async def get_skill_leaderboard(
    skill: str,
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    Get leaderboard for a specific skill
    
    Shows top performers with scores and badges.
    """
    # In production, this would query the database
    # For now, return placeholder
    return {
        "success": True,
        "skill": skill,
        "leaderboard": [],
        "message": "Leaderboard data will be available after more assessments"
    }
