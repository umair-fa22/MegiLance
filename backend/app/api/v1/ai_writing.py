# @AI-HINT: AI writing assistant API endpoints
"""
AI Writing Assistant API - AI-powered content generation and enhancement.

Features:
- Content generation
- Content improvement
- Grammar checking
- Tone adjustment
- Templates
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.services.ai_writing import (
    get_ai_writing_service,
    WritingContentType,
    ToneStyle
)

router = APIRouter(tags=["ai-writing"])


# Request/Response Models
class GenerateProposalRequest(BaseModel):
    project_title: str
    project_description: str
    user_skills: List[str]
    user_experience: Optional[str] = None
    tone: ToneStyle = ToneStyle.PROFESSIONAL
    highlight_points: Optional[List[str]] = None


class GenerateProjectDescriptionRequest(BaseModel):
    project_type: str
    key_features: List[str]
    target_audience: Optional[str] = None
    budget_range: Optional[str] = None
    tone: ToneStyle = ToneStyle.PROFESSIONAL


class GenerateProfileBioRequest(BaseModel):
    skills: List[str]
    experience_years: int
    specialization: str
    achievements: Optional[List[str]] = None
    tone: ToneStyle = ToneStyle.PROFESSIONAL


class GenerateMessageRequest(BaseModel):
    context: str
    intent: str  # inquiry, follow_up, introduction, negotiation
    recipient_name: Optional[str] = None
    tone: ToneStyle = ToneStyle.FRIENDLY


class GenerateUpsellRequest(BaseModel):
    project_description: str
    proposal_content: str


class ImproveContentRequest(BaseModel):
    content: str
    content_type: WritingContentType
    improvements: Optional[List[str]] = None


class AdjustToneRequest(BaseModel):
    content: str
    target_tone: ToneStyle


class ExpandContentRequest(BaseModel):
    content: str
    target_length: int
    focus_areas: Optional[List[str]] = None


class SummarizeContentRequest(BaseModel):
    content: str
    target_length: int = 100


class AnalyzeContentRequest(BaseModel):
    content: str


class AnalyzeFeasibilityRequest(BaseModel):
    project_description: str
    budget_min: float
    budget_max: float
    timeline_days: int


class CheckGrammarRequest(BaseModel):
    content: str


class ApplyTemplateRequest(BaseModel):
    template_id: str
    variables: Dict[str, Any]


# Generation Endpoints
@router.post("/generate/proposal")
async def generate_proposal(
    request: GenerateProposalRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate a proposal for a project."""
    service = get_ai_writing_service(db)
    
    result = await service.generate_proposal(
        user_id=current_user["id"],
        project_title=request.project_title,
        project_description=request.project_description,
        user_skills=request.user_skills,
        user_experience=request.user_experience,
        tone=request.tone,
        highlight_points=request.highlight_points
    )
    
    return result


@router.post("/generate/project-description")
async def generate_project_description(
    request: GenerateProjectDescriptionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate a project description."""
    service = get_ai_writing_service(db)
    
    result = await service.generate_project_description(
        user_id=current_user["id"],
        project_type=request.project_type,
        key_features=request.key_features,
        target_audience=request.target_audience,
        budget_range=request.budget_range,
        tone=request.tone
    )
    
    return result


@router.post("/generate/profile-bio")
async def generate_profile_bio(
    request: GenerateProfileBioRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate a profile bio."""
    service = get_ai_writing_service(db)
    
    result = await service.generate_profile_bio(
        user_id=current_user["id"],
        skills=request.skills,
        experience_years=request.experience_years,
        specialization=request.specialization,
        achievements=request.achievements,
        tone=request.tone
    )
    
    return result


@router.post("/generate/message")
async def generate_message(
    request: GenerateMessageRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate a professional message."""
    service = get_ai_writing_service(db)
    
    result = await service.generate_message(
        user_id=current_user["id"],
        context=request.context,
        intent=request.intent,
        recipient_name=request.recipient_name,
        tone=request.tone
    )
    
    return result


@router.post("/generate/upsell")
async def generate_upsell(
    request: GenerateUpsellRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate upsell suggestions."""
    service = get_ai_writing_service(db)
    
    result = await service.generate_upsell_suggestions(
        user_id=current_user["id"],
        project_description=request.project_description,
        proposal_content=request.proposal_content
    )
    
    return result


# Enhancement Endpoints
@router.post("/improve")
async def improve_content(
    request: ImproveContentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Improve existing content."""
    service = get_ai_writing_service(db)
    
    result = await service.improve_content(
        user_id=current_user["id"],
        content=request.content,
        content_type=request.content_type,
        improvements=request.improvements
    )
    
    return result


@router.post("/adjust-tone")
async def adjust_tone(
    request: AdjustToneRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Adjust the tone of content."""
    service = get_ai_writing_service(db)
    
    result = await service.adjust_tone(
        user_id=current_user["id"],
        content=request.content,
        target_tone=request.target_tone
    )
    
    return result


@router.post("/expand")
async def expand_content(
    request: ExpandContentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Expand content to target length."""
    service = get_ai_writing_service(db)
    
    result = await service.expand_content(
        user_id=current_user["id"],
        content=request.content,
        target_length=request.target_length,
        focus_areas=request.focus_areas
    )
    
    return result


@router.post("/summarize")
async def summarize_content(
    request: SummarizeContentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Summarize content to target length."""
    service = get_ai_writing_service(db)
    
    result = await service.summarize_content(
        user_id=current_user["id"],
        content=request.content,
        target_length=request.target_length
    )
    
    return result


# Analysis Endpoints
@router.post("/analyze")
async def analyze_content(
    request: AnalyzeContentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Analyze content for quality and suggestions."""
    service = get_ai_writing_service(db)
    
    result = await service.analyze_content(
        user_id=current_user["id"],
        content=request.content
    )
    
    return result


@router.post("/analyze/feasibility")
async def analyze_feasibility(
    request: AnalyzeFeasibilityRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Analyze project feasibility."""
    service = get_ai_writing_service(db)
    
    result = await service.analyze_feasibility(
        user_id=current_user["id"],
        project_description=request.project_description,
        budget_min=request.budget_min,
        budget_max=request.budget_max,
        timeline_days=request.timeline_days
    )
    
    return result


@router.post("/grammar-check")
async def check_grammar(
    request: CheckGrammarRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Check grammar and spelling."""
    service = get_ai_writing_service(db)
    
    result = await service.check_grammar(
        user_id=current_user["id"],
        content=request.content
    )
    
    return result


# Template Endpoints
@router.get("/templates")
async def get_writing_templates(
    content_type: Optional[WritingContentType] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get writing templates."""
    service = get_ai_writing_service(db)
    templates = await service.get_writing_templates(content_type)
    return {"templates": templates}


@router.post("/templates/apply")
async def apply_template(
    request: ApplyTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Apply a template with variables."""
    service = get_ai_writing_service(db)
    
    result = await service.apply_template(
        user_id=current_user["id"],
        template_id=request.template_id,
        variables=request.variables
    )
    
    return result


# Usage Endpoints
@router.get("/usage")
async def get_usage_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get AI writing assistant usage statistics."""
    service = get_ai_writing_service(db)
    stats = await service.get_usage_stats(current_user["id"])
    return {"stats": stats}
