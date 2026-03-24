# @AI-HINT: Portfolio items API - delegates to portfolio_service
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request, UploadFile
from typing import List, Optional
import logging
import json
import uuid
import os
import re
from pathlib import Path
logger = logging.getLogger(__name__)

from app.core.security import get_current_user_from_token
from app.services import portfolio_service
from app.services.db_utils import paginate_params
from app.schemas.portfolio import PortfolioItemCreate, PortfolioItemUpdate
from app.api.v1.uploads import (
    PORTFOLIO_DIR, ALLOWED_IMAGE_TYPES, MAX_PORTFOLIO_SIZE,
    sanitize_filename, validate_file_content, validate_path
)

router = APIRouter()


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data

def _process_tags(items):
    """Parse tags JSON string to list"""
    for item in items:
        if item.get("tags"):
            try:
                if isinstance(item["tags"], list):
                    continue
                item["tags"] = json.loads(item["tags"])
            except (json.JSONDecodeError, ValueError):
                item["tags"] = []
        else:
            item["tags"] = []
    return items

@router.get("/", response_model=List[dict])
def list_portfolio_items(
    user_id: Optional[int] = Query(None, description="Filter by freelancer ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """List portfolio items for a user"""
    offset, limit = paginate_params(page, page_size)
    target_user_id = user_id if user_id else current_user.get("user_id")

    if target_user_id != current_user.get("user_id"):
        check = portfolio_service.verify_user_is_freelancer(target_user_id)
        if check is None or check is False:
            raise HTTPException(status_code=404, detail="Portfolio not found")

    items = portfolio_service.list_portfolio_items(target_user_id, offset, limit)
    return _process_tags(items)


@router.get("/{portfolio_item_id}", response_model=dict)
def get_portfolio_item(
    portfolio_item_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific portfolio item"""
    item = portfolio_service.get_portfolio_item_by_id(portfolio_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    return _process_tags([item])[0]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    portfolio_item: PortfolioItemCreate,
    current_user = Depends(get_current_user)
):
    """Create a new portfolio item (JSON)"""
    user_role = current_user.get("role", "")
    if user_role.lower() != "freelancer":
        raise HTTPException(
            status_code=403,
            detail="Only freelancers can create portfolio items"
        )

    user_id = current_user.get("user_id")
    tags_json = json.dumps(portfolio_item.tags or [])

    try:
        new_id, now = portfolio_service.create_portfolio_item_record(
            user_id,
            portfolio_item.title,
            portfolio_item.description,
            portfolio_item.image_url,
            portfolio_item.project_url,
            tags_json
        )
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Failed to create portfolio item")

    return {
        "id": new_id,
        "freelancer_id": user_id,
        "title": portfolio_item.title,
        "description": portfolio_item.description,
        "image_url": portfolio_item.image_url,
        "project_url": portfolio_item.project_url,
        "tags": portfolio_item.tags or [],
        "created_at": now,
        "updated_at": now
    }


@router.post("/items", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item_wizard(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Create a new portfolio item from wizard (multipart/form-data)"""
    user_role = current_user.get("role", "")
    if user_role.lower() != "freelancer":
        raise HTTPException(
            status_code=403,
            detail="Only freelancers can create portfolio items"
        )

    form = await request.form()

    title = form.get("title")
    description = form.get("short_description")
    project_url = form.get("project_url")
    technologies_json = form.get("technologies")

    tags = []
    if technologies_json:
        try:
            tags = json.loads(technologies_json)
        except (json.JSONDecodeError, ValueError):
            pass

    PORTFOLIO_DIR.mkdir(parents=True, exist_ok=True)

    image_url = ""

    for key, value in form.items():
        if key.startswith("image_") and not key.endswith("_caption") and not key.endswith("_is_cover"):
            if isinstance(value, UploadFile):
                content = await value.read()
                if not content:
                    continue
                # Validate file size
                if len(content) > MAX_PORTFOLIO_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File too large. Maximum size: {MAX_PORTFOLIO_SIZE / 1024 / 1024}MB"
                    )
                # Validate MIME type from content bytes
                validate_file_content(content, ALLOWED_IMAGE_TYPES)
                # Sanitize filename and save securely
                safe_filename = sanitize_filename(value.filename or "portfolio.jpg")
                file_path = PORTFOLIO_DIR / safe_filename
                validate_path(safe_filename, PORTFOLIO_DIR)
                with open(file_path, "wb") as f:
                    f.write(content)

                index = key.split("_")[1]
                is_cover = form.get(f"image_{index}_is_cover") == "true"

                saved_url = f"/uploads/portfolio/{safe_filename}"
                if is_cover or not image_url:
                    image_url = saved_url

    user_id = current_user.get("user_id")
    tags_json = json.dumps(tags)

    try:
        new_id, now = portfolio_service.create_portfolio_item_record(
            user_id, title, description, image_url, project_url, tags_json
        )
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Failed to create portfolio item")

    return {
        "id": new_id,
        "freelancer_id": user_id,
        "title": title,
        "description": description,
        "image_url": image_url,
        "project_url": project_url,
        "tags": tags,
        "created_at": now,
        "updated_at": now
    }


@router.put("/{portfolio_item_id}", response_model=dict)
def update_portfolio_item(
    portfolio_item_id: int,
    portfolio_item: PortfolioItemUpdate,
    current_user = Depends(get_current_user)
):
    """Update a portfolio item"""
    user_id = current_user.get("user_id")

    owner = portfolio_service.get_portfolio_item_owner(portfolio_item_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    if owner.get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this portfolio item")

    update_data = portfolio_item.model_dump(exclude_unset=True)
    updated = portfolio_service.update_portfolio_item_record(portfolio_item_id, update_data)
    if not updated:
        return {}

    return _process_tags([updated])[0]


@router.delete("/{portfolio_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    portfolio_item_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a portfolio item"""
    user_id = current_user.get("user_id")

    owner = portfolio_service.get_portfolio_item_owner(portfolio_item_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    if owner.get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this portfolio item")

    portfolio_service.delete_portfolio_item_record(portfolio_item_id)
    return
