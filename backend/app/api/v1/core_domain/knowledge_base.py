# @AI-HINT: Knowledge base and FAQ API endpoints for help center
"""
Knowledge Base & FAQ API

Endpoints for help articles, FAQs, search,
and contextual help.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user, require_admin
from app.models.user import User
from app.services.knowledge_base import (
    get_knowledge_base_service,
    ArticleCategory,
    KnowledgeContentType
)

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])


# Request/Response Models
class FeedbackRequest(BaseModel):
    content_type: str  # faq, article
    content_id: str
    helpful: bool


class SuggestionRequest(BaseModel):
    context: str
    user_role: Optional[str] = None


class CreateArticleRequest(BaseModel):
    title: str
    slug: str
    category: ArticleCategory
    content_type: KnowledgeContentType
    content: str
    excerpt: Optional[str] = None
    tags: List[str] = []


# FAQ Endpoints
@router.get("/faqs")
async def get_faqs(
    category: Optional[ArticleCategory] = None,
    search: Optional[str] = Query(None, alias="q"),
    limit: int = Query(50, le=100),
    
):
    """Get FAQ entries."""
    service = get_knowledge_base_service()
    faqs = await service.get_faqs(category, search, limit)
    return {"faqs": faqs, "count": len(faqs)}


@router.get("/faqs/{faq_id}")
async def get_faq(
    faq_id: str,
    
):
    """Get a specific FAQ entry."""
    service = get_knowledge_base_service()
    faq = await service.get_faq(faq_id)
    
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    return {"faq": faq}


# Article Endpoints
@router.get("/articles")
async def get_articles(
    category: Optional[ArticleCategory] = None,
    content_type: Optional[KnowledgeContentType] = None,
    search: Optional[str] = Query(None, alias="q"),
    limit: int = Query(20, le=50),
    
):
    """Get help articles."""
    service = get_knowledge_base_service()
    articles = await service.get_articles(category, content_type, search, limit)
    return {"articles": articles, "count": len(articles)}


@router.get("/articles/{article_id}")
async def get_article(
    article_id: str,
    
):
    """Get a specific article."""
    service = get_knowledge_base_service()
    article = await service.get_article(article_id)
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {"article": article}


@router.get("/articles/slug/{slug}")
async def get_article_by_slug(
    slug: str,
    
):
    """Get article by URL slug."""
    service = get_knowledge_base_service()
    article = await service.get_article_by_slug(slug)
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {"article": article}


# Categories
@router.get("/categories")
async def get_categories(
    
):
    """Get all categories with content counts."""
    service = get_knowledge_base_service()
    categories = await service.get_categories()
    return {"categories": categories}


# Search
@router.get("/search")
async def search_knowledge_base(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, le=50),
    
):
    """Search across all knowledge base content."""
    service = get_knowledge_base_service()
    results = await service.search(q, limit)
    return results


# Popular Content
@router.get("/popular")
async def get_popular_content(
    limit: int = Query(10, le=20),
    
):
    """Get most popular articles and FAQs."""
    service = get_knowledge_base_service()
    popular = await service.get_popular_content(limit)
    return popular


# Related Content
@router.get("/related/{content_type}/{content_id}")
async def get_related_content(
    content_type: str,
    content_id: str,
    
):
    """Get related content based on tags and category."""
    if content_type not in ["faq", "article"]:
        raise HTTPException(status_code=400, detail="Invalid content type")
    
    service = get_knowledge_base_service()
    related = await service.get_related_content(content_id, content_type)
    return {"related": related}


# Contextual Help
@router.post("/suggestions")
async def get_contextual_suggestions(
    request: SuggestionRequest,
    
):
    """Get contextual help suggestions based on user's current context."""
    service = get_knowledge_base_service()
    suggestions = await service.get_suggestions(request.context, request.user_role)
    return {"suggestions": suggestions}


@router.get("/contextual/{page}")
async def get_page_help(
    page: str,
    
):
    """Get help content relevant to a specific page."""
    service = get_knowledge_base_service()
    
    # Map pages to relevant topics
    page_topics = {
        "dashboard": ["getting started", "dashboard"],
        "projects": ["projects", "posting"],
        "proposals": ["proposals", "bidding"],
        "contracts": ["contracts", "milestones"],
        "messages": ["messaging", "communication"],
        "payments": ["payments", "withdrawal"],
        "settings": ["account", "security", "verification"]
    }
    
    topics = page_topics.get(page, [])
    if not topics:
        return {"faqs": [], "articles": []}
    
    results = await service.search(" ".join(topics))
    return {
        "page": page,
        "faqs": results["faqs"][:3],
        "articles": results["articles"][:3]
    }


# Feedback
@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Mark content as helpful or not helpful."""
    service = get_knowledge_base_service()
    result = await service.mark_helpful(
        request.content_type,
        request.content_id,
        current_user.id,
        request.helpful
    )
    return result


# Quick Help
@router.get("/quick-help")
async def get_quick_help(
    current_user: User = Depends(get_current_active_user)
):
    """Get quick help resources for current user."""
    service = get_knowledge_base_service()
    
    user_role = getattr(current_user, 'user_type', None) or getattr(current_user, 'role', 'freelancer')
    
    return {
        "getting_started": await service.get_articles(
            category=ArticleCategory.GETTING_STARTED,
            limit=3
        ),
        "faqs": await service.get_faqs(limit=5),
        "role_specific_tips": f"Tips for {user_role}s coming soon"
    }


# Admin Endpoints
@router.post("/admin/articles")
async def admin_create_article(
    request: CreateArticleRequest,
    current_user: User = Depends(require_admin)
):
    """Admin: Create a new article."""
    service = get_knowledge_base_service()
    result = await service.create_article(current_user.id, request.dict())
    return result


@router.put("/admin/articles/{article_id}")
async def admin_update_article(
    article_id: str,
    updates: Dict[str, Any],
    current_user: User = Depends(require_admin)
):
    """Admin: Update an article."""
    service = get_knowledge_base_service()
    result = await service.update_article(current_user.id, article_id, updates)
    return result


@router.delete("/admin/articles/{article_id}")
async def admin_delete_article(
    article_id: str,
    current_user: User = Depends(require_admin)
):
    """Admin: Delete an article."""
    service = get_knowledge_base_service()
    result = await service.delete_article(current_user.id, article_id)
    return result


@router.get("/admin/stats")
async def admin_get_kb_stats(
    current_user: User = Depends(require_admin)
):
    """Admin: Get knowledge base statistics."""
    
    return {
        "total_articles": len([]),  # Would query actual count
        "total_faqs": len([]),
        "total_views": 0,
        "helpful_ratio": 0.0,
        "most_searched": [],
        "needs_update": []
    }
