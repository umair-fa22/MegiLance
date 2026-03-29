# @AI-HINT: Skill graph and endorsements API endpoints
"""
Skill Graph API - Skill relationships, endorsements, and verification.

Features:
- Skill taxonomy
- User skills management
- Endorsements
- Skill verification
- Analytics
"""

from fastapi import APIRouter, Depends
from typing import Optional, Dict
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.db_utils import sanitize_text
from app.services.skill_graph import (
    get_skill_graph_service,
    SkillLevel
)

router = APIRouter(prefix="/skill-graph", tags=["skill-graph"])


# Request/Response Models
class AddSkillRequest(BaseModel):
    skill_id: str
    level: SkillLevel
    years_experience: Optional[int] = None


class UpdateSkillRequest(BaseModel):
    level: Optional[SkillLevel] = None
    years_experience: Optional[int] = None


class RequestEndorsementRequest(BaseModel):
    endorser_id: int
    skill_id: str
    project_id: Optional[str] = None
    message: Optional[str] = None


class GiveEndorsementRequest(BaseModel):
    user_id: int
    skill_id: str
    message: str
    relationship: str
    project_id: Optional[str] = None


class RespondEndorsementRequest(BaseModel):
    accept: bool
    message: Optional[str] = None


class StartTestRequest(BaseModel):
    skill_id: str
    test_id: str


class SubmitTestRequest(BaseModel):
    answers: Dict[str, str]


# Skill Taxonomy Endpoints
@router.get("/categories")
async def get_skill_categories(
    current_user = Depends(get_current_active_user)
):
    """Get skill categories."""
    service = get_skill_graph_service()
    categories = await service.get_skill_categories()
    return {"categories": categories}


@router.get("/skills")
async def get_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get skills from taxonomy."""
    service = get_skill_graph_service()
    skills = await service.get_skills(category, search)
    return {"skills": skills}


@router.get("/skills/{skill_id}/relationships")
async def get_skill_relationships(
    skill_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get skill relationships."""
    service = get_skill_graph_service()
    relationships = await service.get_skill_relationships(skill_id)
    return {"relationships": relationships}


# User Skills Endpoints
@router.get("/user/skills")
async def get_user_skills(
    current_user = Depends(get_current_active_user)
):
    """Get current user's skills."""
    service = get_skill_graph_service()
    skills = await service.get_user_skills(current_user["id"])
    return {"skills": skills}


@router.get("/users/{user_id}/skills")
async def get_other_user_skills(
    user_id: int,
    current_user = Depends(get_current_active_user)
):
    """Get another user's skills."""
    service = get_skill_graph_service()
    skills = await service.get_user_skills(user_id)
    return {"skills": skills}


@router.post("/user/skills")
async def add_user_skill(
    request: AddSkillRequest,
    current_user = Depends(get_current_active_user)
):
    """Add a skill to user's profile."""
    service = get_skill_graph_service()
    
    skill = await service.add_user_skill(
        user_id=current_user["id"],
        skill_id=request.skill_id,
        level=request.level,
        years_experience=request.years_experience
    )
    
    return {"skill": skill}


@router.put("/user/skills/{skill_id}")
async def update_user_skill(
    skill_id: str,
    request: UpdateSkillRequest,
    current_user = Depends(get_current_active_user)
):
    """Update user's skill."""
    service = get_skill_graph_service()
    
    skill = await service.update_user_skill(
        user_id=current_user["id"],
        skill_id=skill_id,
        level=request.level,
        years_experience=request.years_experience
    )
    
    return {"skill": skill}


@router.delete("/user/skills/{skill_id}")
async def remove_user_skill(
    skill_id: str,
    current_user = Depends(get_current_active_user)
):
    """Remove a skill from user's profile."""
    service = get_skill_graph_service()
    success = await service.remove_user_skill(current_user["id"], skill_id)
    return {"success": success}


# Endorsement Endpoints
@router.get("/endorsements")
async def get_endorsements(
    skill_id: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get endorsements for current user."""
    service = get_skill_graph_service()
    endorsements = await service.get_endorsements(current_user["id"], skill_id)
    return {"endorsements": endorsements}


@router.get("/users/{user_id}/endorsements")
async def get_user_endorsements(
    user_id: int,
    skill_id: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get endorsements for another user."""
    service = get_skill_graph_service()
    endorsements = await service.get_endorsements(user_id, skill_id)
    return {"endorsements": endorsements}


@router.post("/endorsements/request")
async def request_endorsement(
    request: RequestEndorsementRequest,
    current_user = Depends(get_current_active_user)
):
    """Request an endorsement."""
    service = get_skill_graph_service()
    
    endorsement_request = await service.request_endorsement(
        user_id=current_user["id"],
        endorser_id=request.endorser_id,
        skill_id=request.skill_id,
        project_id=request.project_id,
        message=sanitize_text(request.message, 1000) if request.message else None
    )
    
    return {"request": endorsement_request}


@router.post("/endorsements")
async def give_endorsement(
    request: GiveEndorsementRequest,
    current_user = Depends(get_current_active_user)
):
    """Give an endorsement to another user."""
    service = get_skill_graph_service()
    
    endorsement = await service.give_endorsement(
        endorser_id=current_user["id"],
        user_id=request.user_id,
        skill_id=request.skill_id,
        message=sanitize_text(request.message, 1000),
        relationship=sanitize_text(request.relationship, 100),
        project_id=request.project_id
    )
    
    return {"endorsement": endorsement}


@router.post("/endorsements/requests/{request_id}/respond")
async def respond_to_endorsement_request(
    request_id: str,
    request: RespondEndorsementRequest,
    current_user = Depends(get_current_active_user)
):
    """Respond to an endorsement request."""
    service = get_skill_graph_service()
    
    response = await service.respond_to_endorsement_request(
        endorser_id=current_user["id"],
        request_id=request_id,
        accept=request.accept,
        message=sanitize_text(request.message, 1000) if request.message else None
    )
    
    return response


@router.get("/endorsements/requests/pending")
async def get_pending_endorsement_requests(
    current_user = Depends(get_current_active_user)
):
    """Get pending endorsement requests for user to respond to."""
    service = get_skill_graph_service()
    requests = await service.get_pending_endorsement_requests(current_user["id"])
    return {"requests": requests}


# Skill Verification Endpoints
@router.get("/verification/tests/{skill_id}")
async def get_verification_tests(
    skill_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get available verification tests for a skill."""
    service = get_skill_graph_service()
    tests = await service.get_verification_tests(skill_id)
    return tests


@router.post("/verification/tests/start")
async def start_verification_test(
    request: StartTestRequest,
    current_user = Depends(get_current_active_user)
):
    """Start a skill verification test."""
    service = get_skill_graph_service()
    
    test = await service.start_verification_test(
        user_id=current_user["id"],
        skill_id=request.skill_id,
        test_id=request.test_id
    )
    
    return test


@router.post("/verification/tests/{attempt_id}/submit")
async def submit_verification_test(
    attempt_id: str,
    request: SubmitTestRequest,
    current_user = Depends(get_current_active_user)
):
    """Submit verification test answers."""
    service = get_skill_graph_service()
    
    result = await service.submit_verification_test(
        user_id=current_user["id"],
        attempt_id=attempt_id,
        answers=request.answers
    )
    
    return result


@router.get("/verification/history")
async def get_verification_history(
    skill_id: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get user's verification test history."""
    service = get_skill_graph_service()
    history = await service.get_verification_history(current_user["id"], skill_id)
    return {"history": history}


# Recommendations Endpoints
@router.get("/recommendations")
async def get_skill_recommendations(
    current_user = Depends(get_current_active_user)
):
    """Get skill recommendations."""
    service = get_skill_graph_service()
    recommendations = await service.get_skill_recommendations(current_user["id"])
    return {"recommendations": recommendations}


# Analytics Endpoints
@router.get("/analytics")
async def get_skill_analytics(
    current_user = Depends(get_current_active_user)
):
    """Get analytics about user's skills."""
    service = get_skill_graph_service()
    analytics = await service.get_skill_analytics(current_user["id"])
    return {"analytics": analytics}


# Learning Paths
@router.get("/learning-paths/{skill_id}")
async def get_learning_paths(
    skill_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get learning paths for a skill."""
    service = get_skill_graph_service()
    paths = await service.get_learning_paths(skill_id)
    return {"learning_paths": paths}
