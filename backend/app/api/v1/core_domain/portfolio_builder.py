# @AI-HINT: Portfolio builder API endpoints
"""
Portfolio Builder API - Professional portfolio creation endpoints.

Features:
- Portfolio CRUD
- Section management
- Project showcase
- Case studies
- Testimonials
- Custom domains
- Analytics
"""

from fastapi import APIRouter, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.portfolio_builder import (
    get_portfolio_builder_service,
    PortfolioTemplate,
    SectionType
)

router = APIRouter(prefix="/portfolio-builder", tags=["portfolio-builder"])


# Request/Response Models
class CreatePortfolioRequest(BaseModel):
    name: str
    template: PortfolioTemplate = PortfolioTemplate.PROFESSIONAL
    is_public: bool = True


class UpdatePortfolioRequest(BaseModel):
    name: Optional[str] = None
    template: Optional[PortfolioTemplate] = None
    is_public: Optional[bool] = None


class AddSectionRequest(BaseModel):
    section_type: SectionType
    content: Dict[str, Any]
    order: int = 0


class UpdateSectionRequest(BaseModel):
    content: Optional[Dict[str, Any]] = None
    order: Optional[int] = None


class ShowcaseProjectRequest(BaseModel):
    title: str
    description: str
    images: List[str] = []
    technologies: List[str] = []
    url: Optional[str] = None
    github_url: Optional[str] = None
    case_study: Optional[Dict[str, Any]] = None
    featured: bool = False


class CaseStudyRequest(BaseModel):
    challenge: str
    solution: str
    process: List[Dict[str, Any]] = []
    results: str
    metrics: Dict[str, Any] = {}
    testimonial: Optional[str] = None


class TestimonialRequest(BaseModel):
    client_name: str
    client_title: Optional[str] = None
    client_company: Optional[str] = None
    client_avatar: Optional[str] = None
    content: str
    rating: int = 5
    project_id: Optional[str] = None


class TestimonialRequestRequest(BaseModel):
    client_email: str
    project_id: Optional[str] = None
    message: Optional[str] = None


class ThemeRequest(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    background: Optional[str] = None
    text_color: Optional[str] = None
    font_heading: Optional[str] = None
    font_body: Optional[str] = None
    dark_mode: Optional[bool] = None


class CustomDomainRequest(BaseModel):
    domain: str


class SEORequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: List[str] = []
    og_image: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: str = "index, follow"


# Portfolio Endpoints
@router.post("/")
async def create_portfolio(
    request: CreatePortfolioRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new portfolio."""
    service = get_portfolio_builder_service()
    
    portfolio = await service.create_portfolio(
        user_id=current_user["id"],
        name=request.name,
        template=request.template,
        is_public=request.is_public
    )
    
    return {"portfolio": portfolio}


@router.get("/list")
async def list_portfolios(
    current_user = Depends(get_current_active_user)
):
    """List user's portfolios."""
    service = get_portfolio_builder_service()
    portfolios = await service.list_portfolios(current_user["id"])
    return {"portfolios": portfolios}


@router.get("/{portfolio_id}")
async def get_portfolio(
    portfolio_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get portfolio by ID."""
    service = get_portfolio_builder_service()
    portfolio = await service.get_portfolio(current_user["id"], portfolio_id)
    return {"portfolio": portfolio}


@router.put("/{portfolio_id}")
async def update_portfolio(
    portfolio_id: str,
    request: UpdatePortfolioRequest,
    current_user = Depends(get_current_active_user)
):
    """Update portfolio settings."""
    service = get_portfolio_builder_service()
    result = await service.update_portfolio(
        current_user["id"],
        portfolio_id,
        request.dict(exclude_none=True)
    )
    return result


@router.delete("/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a portfolio."""
    service = get_portfolio_builder_service()
    success = await service.delete_portfolio(current_user["id"], portfolio_id)
    return {"success": success}


# Section Endpoints
@router.post("/{portfolio_id}/sections")
async def add_section(
    portfolio_id: str,
    request: AddSectionRequest,
    current_user = Depends(get_current_active_user)
):
    """Add a section to portfolio."""
    service = get_portfolio_builder_service()
    
    section = await service.add_section(
        user_id=current_user["id"],
        portfolio_id=portfolio_id,
        section_type=request.section_type,
        content=request.content,
        order=request.order
    )
    
    return {"section": section}


@router.put("/{portfolio_id}/sections/{section_id}")
async def update_section(
    portfolio_id: str,
    section_id: str,
    request: UpdateSectionRequest,
    current_user = Depends(get_current_active_user)
):
    """Update a portfolio section."""
    service = get_portfolio_builder_service()
    result = await service.update_section(
        current_user["id"],
        portfolio_id,
        section_id,
        request.dict(exclude_none=True)
    )
    return result


@router.delete("/{portfolio_id}/sections/{section_id}")
async def delete_section(
    portfolio_id: str,
    section_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a portfolio section."""
    service = get_portfolio_builder_service()
    success = await service.delete_section(current_user["id"], portfolio_id, section_id)
    return {"success": success}


@router.put("/{portfolio_id}/sections/reorder")
async def reorder_sections(
    portfolio_id: str,
    section_orders: List[Dict[str, Any]],
    current_user = Depends(get_current_active_user)
):
    """Reorder portfolio sections."""
    service = get_portfolio_builder_service()
    result = await service.reorder_sections(current_user["id"], portfolio_id, section_orders)
    return result


# Project Showcase Endpoints
@router.post("/{portfolio_id}/projects")
async def add_showcase_project(
    portfolio_id: str,
    request: ShowcaseProjectRequest,
    current_user = Depends(get_current_active_user)
):
    """Add a project to showcase."""
    service = get_portfolio_builder_service()
    project = await service.add_showcase_project(current_user["id"], portfolio_id, request.dict())
    return {"project": project}


@router.post("/{portfolio_id}/projects/{project_id}/case-study")
async def create_case_study(
    portfolio_id: str,
    project_id: str,
    request: CaseStudyRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a case study for a project."""
    service = get_portfolio_builder_service()
    case_study = await service.create_case_study(
        current_user["id"],
        portfolio_id,
        project_id,
        request.dict()
    )
    return {"case_study": case_study}


# Testimonial Endpoints
@router.post("/{portfolio_id}/testimonials")
async def add_testimonial(
    portfolio_id: str,
    request: TestimonialRequest,
    current_user = Depends(get_current_active_user)
):
    """Add a testimonial to portfolio."""
    service = get_portfolio_builder_service()
    testimonial = await service.add_testimonial(current_user["id"], portfolio_id, request.dict())
    return {"testimonial": testimonial}


@router.post("/{portfolio_id}/testimonials/request")
async def request_testimonial(
    portfolio_id: str,
    request: TestimonialRequestRequest,
    current_user = Depends(get_current_active_user)
):
    """Request testimonial from a client."""
    service = get_portfolio_builder_service()
    result = await service.request_testimonial(
        current_user["id"],
        portfolio_id,
        request.client_email,
        request.project_id,
        request.message
    )
    return result


# Theme Endpoints
@router.put("/{portfolio_id}/theme")
async def update_theme(
    portfolio_id: str,
    request: ThemeRequest,
    current_user = Depends(get_current_active_user)
):
    """Update portfolio theme."""
    service = get_portfolio_builder_service()
    result = await service.update_theme(current_user["id"], portfolio_id, request.dict(exclude_none=True))
    return result


@router.get("/templates/preview/{template}")
async def preview_template(
    template: PortfolioTemplate,
    current_user = Depends(get_current_active_user)
):
    """Preview a template."""
    service = get_portfolio_builder_service()
    preview = await service.preview_template(current_user["id"], template)
    return preview


# Custom Domain Endpoints
@router.post("/{portfolio_id}/domain")
async def set_custom_domain(
    portfolio_id: str,
    request: CustomDomainRequest,
    current_user = Depends(get_current_active_user)
):
    """Set custom domain for portfolio."""
    service = get_portfolio_builder_service()
    result = await service.set_custom_domain(current_user["id"], portfolio_id, request.domain)
    return result


@router.post("/{portfolio_id}/domain/verify")
async def verify_custom_domain(
    portfolio_id: str,
    current_user = Depends(get_current_active_user)
):
    """Verify custom domain DNS setup."""
    service = get_portfolio_builder_service()
    result = await service.verify_custom_domain(current_user["id"], portfolio_id)
    return result


# Publishing Endpoints
@router.post("/{portfolio_id}/publish")
async def publish_portfolio(
    portfolio_id: str,
    current_user = Depends(get_current_active_user)
):
    """Publish portfolio."""
    service = get_portfolio_builder_service()
    result = await service.publish_portfolio(current_user["id"], portfolio_id)
    return result


@router.post("/{portfolio_id}/unpublish")
async def unpublish_portfolio(
    portfolio_id: str,
    current_user = Depends(get_current_active_user)
):
    """Unpublish portfolio."""
    service = get_portfolio_builder_service()
    result = await service.unpublish_portfolio(current_user["id"], portfolio_id)
    return result


# Analytics Endpoints
@router.get("/{portfolio_id}/analytics")
async def get_portfolio_analytics(
    portfolio_id: str,
    days: int = 30,
    current_user = Depends(get_current_active_user)
):
    """Get portfolio analytics."""
    service = get_portfolio_builder_service()
    analytics = await service.get_portfolio_analytics(current_user["id"], portfolio_id, days)
    return {"analytics": analytics}


# SEO Endpoints
@router.put("/{portfolio_id}/seo")
async def update_seo_settings(
    portfolio_id: str,
    request: SEORequest,
    current_user = Depends(get_current_active_user)
):
    """Update SEO settings."""
    service = get_portfolio_builder_service()
    result = await service.update_seo_settings(current_user["id"], portfolio_id, request.dict())
    return result


# Export Endpoints
@router.post("/{portfolio_id}/export")
async def export_portfolio(
    portfolio_id: str,
    format: str = "html",
    current_user = Depends(get_current_active_user)
):
    """Export portfolio as static site."""
    service = get_portfolio_builder_service()
    result = await service.export_portfolio(current_user["id"], portfolio_id, format)
    return result
