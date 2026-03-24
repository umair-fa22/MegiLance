# @AI-HINT: Categories API endpoints - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone
import logging
import re
logger = logging.getLogger(__name__)

from app.services import categories_service
from app.core.security import get_current_user_from_token
from app.schemas.category import CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from category name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    current_user = Depends(get_current_user)
):
    """
    Create a new category
    - Admin only
    - Auto-generates slug from name
    - Supports parent-child hierarchy
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if category name exists
    if categories_service.check_category_name_exists(category.name):
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Verify parent category exists
    if category.parent_id:
        if not categories_service.check_category_exists_by_id(category.parent_id):
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    # Generate slug
    slug = generate_slug(category.name)
    if categories_service.check_slug_exists(slug):
        slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp())}"
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create category
    new_id = categories_service.insert_category(
        name=category.name,
        slug=slug,
        description=category.description,
        icon=category.icon,
        parent_id=category.parent_id,
        sort_order=category.sort_order,
        now=now
    )
    
    if not new_id:
        raise HTTPException(status_code=500, detail="Failed to create category")
    
    return {
        "id": new_id,
        "name": category.name,
        "slug": slug,
        "description": category.description,
        "icon": category.icon,
        "parent_id": category.parent_id,
        "sort_order": category.sort_order,
        "is_active": True,
        "project_count": 0,
        "created_at": now,
        "updated_at": now
    }


@router.get("/", response_model=List[dict])
async def list_categories(
    active_only: bool = Query(True, description="Show only active categories"),
    parent_id: Optional[int] = Query(None, description="Filter by parent category")
):
    """
    List all categories
    - Public endpoint
    - Supports filtering by parent
    - Returns flat list
    """
    where_clauses = []
    params = []
    
    if active_only:
        where_clauses.append("is_active = 1")
    
    if parent_id is not None:
        where_clauses.append("parent_id = ?")
        params.append(parent_id)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    rows = categories_service.query_categories(where_sql, params)
    for row in rows:
        row["is_active"] = bool(row.get("is_active"))
    return rows


@router.get("/tree", response_model=List[dict])
async def get_category_tree(
    active_only: bool = Query(True, description="Show only active categories")
):
    """
    Get hierarchical category tree
    - Returns nested structure with children
    - Public endpoint
    """
    where_sql = "is_active = 1" if active_only else "1=1"
    
    all_categories = categories_service.query_categories(where_sql, [])
    for cat in all_categories:
        cat["is_active"] = bool(cat.get("is_active"))
        cat["children"] = []
    
    # Build tree structure
    category_map = {cat["id"]: cat for cat in all_categories}
    root_categories = []
    
    for cat in all_categories:
        parent_id = cat.get("parent_id")
        if parent_id and parent_id in category_map:
            category_map[parent_id]["children"].append(cat)
        else:
            root_categories.append(cat)
    
    return root_categories


@router.get("/{slug}", response_model=dict)
async def get_category(slug: str):
    """Get a category by slug"""
    cat = categories_service.fetch_category_by_slug(slug)
    
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    cat["is_active"] = bool(cat.get("is_active"))
    return cat


@router.patch("/{category_id}", response_model=dict)
async def update_category(
    category_id: int,
    update_data: CategoryUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update a category
    - Admin only
    - Can update name, description, icon, parent, sort order, active status
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = categories_service.fetch_category_name_and_slug(category_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    data = update_data.model_dump(exclude_unset=True)
    updates = []
    params = []
    
    # Check name uniqueness if changing name
    if "name" in data and data["name"] != existing.get("name"):
        if categories_service.check_category_name_exists(data["name"], exclude_id=category_id):
            raise HTTPException(status_code=400, detail="Category name already exists")
        
        updates.append("name = ?")
        params.append(data["name"])
        updates.append("slug = ?")
        params.append(generate_slug(data["name"]))
    
    # Verify parent if changing
    if "parent_id" in data and data["parent_id"]:
        if data["parent_id"] == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
        
        if not categories_service.check_category_exists_by_id(data["parent_id"]):
            raise HTTPException(status_code=404, detail="Parent category not found")
        
        updates.append("parent_id = ?")
        params.append(data["parent_id"])
    elif "parent_id" in data and data["parent_id"] is None:
        updates.append("parent_id = ?")
        params.append(None)
    
    for field in ["description", "icon", "sort_order"]:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])
    
    if "is_active" in data:
        updates.append("is_active = ?")
        params.append(1 if data["is_active"] else 0)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        categories_service.update_category_fields(category_id, ", ".join(updates), params)
    
    # Fetch updated category
    cat = categories_service.fetch_category_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    cat["is_active"] = bool(cat.get("is_active"))
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a category
    - Admin only
    - Cannot delete if has child categories or projects
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cat_data = categories_service.fetch_category_project_count(category_id)
    if not cat_data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check for children
    children = categories_service.count_child_categories(category_id)
    if children > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {children} child categories"
        )
    
    # Check for projects
    project_count = cat_data.get("project_count", 0)
    if project_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {project_count} projects. Set to inactive instead."
        )
    
    categories_service.delete_category_record(category_id)
    
    return None
