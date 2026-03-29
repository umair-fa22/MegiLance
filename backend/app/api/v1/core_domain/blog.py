# @AI-HINT: Blog CMS API endpoints - CRUD for blog posts with admin moderation
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse
from app.services.blog_service import BlogService
from app.core.security import require_admin

router = APIRouter()

@router.post("/", response_model=BlogPostResponse)
def create_post(post: BlogPostCreate, current_user=Depends(require_admin)):
    """Create a new blog post (admin only)"""
    existing_post = BlogService.get_post_by_slug(post.slug)
    if existing_post:
        raise HTTPException(status_code=400, detail="Slug already exists")
    result = BlogService.create_post(post)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create post")
    return result

@router.get("/", response_model=List[BlogPostResponse])
def read_posts(
    skip: int = 0, 
    limit: int = 10, 
    is_published: Optional[bool] = None,
    is_news_trend: Optional[bool] = None
):
    return BlogService.get_posts(skip=skip, limit=limit, is_published=is_published, is_news_trend=is_news_trend)

@router.get("/{slug}", response_model=BlogPostResponse)
def read_post(slug: str):
    post = BlogService.get_post_by_slug(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    BlogService.increment_views(slug)
    return post

@router.put("/{post_id}", response_model=BlogPostResponse)
def update_post(post_id: int, post_update: BlogPostUpdate, current_user=Depends(require_admin)):
    """Update a blog post (admin only)"""
    post = BlogService.update_post(post_id, post_update)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/{post_id}")
def delete_post(post_id: int, current_user=Depends(require_admin)):
    """Delete a blog post (admin only)"""
    success = BlogService.delete_post(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success"}
