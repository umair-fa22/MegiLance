# @AI-HINT: Skills Management API - Turso-only, no SQLite fallback
"""
Skills Management API

Handles:
- Skills catalog (public listing)
- User skill management
- Skill verification
- Admin skill CRUD
- Industry metadata
- Freelancer search by skill/industry
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user_from_token
from app.services import skills_service
from app.services.db_utils import paginate_params
from app.schemas.skill import SkillCreate, SkillUpdate, UserSkillCreate, UserSkillUpdate

router = APIRouter()


def get_current_user(token_data=Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


# ============ Skills Catalog ============

@router.get("/", response_model=List[dict])
async def list_skills(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name or description"),
    active_only: bool = Query(True, description="Only active skills"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=200)
):
    """List all skills in the catalog. Public endpoint."""
    offset, limit = paginate_params(page, page_size)
    return skills_service.list_skills(category, search, active_only, offset, limit)


@router.get("/categories")
async def list_skill_categories():
    """Get list of all skill categories. Public endpoint."""
    return {"categories": skills_service.list_skill_categories()}


@router.get("/industries")
async def list_industries():
    """Get list of all industries. Public endpoint."""
    return skills_service.INDUSTRIES


@router.get("/freelancers/match", response_model=List[dict])
async def match_freelancers(
    skill_slug: str = Query(..., description="Skill slug or name"),
    industry_slug: Optional[str] = Query(None, description="Industry slug"),
    limit: int = Query(10, ge=1, le=50)
):
    """Find freelancers matching a skill and optionally an industry."""
    skill = skills_service.find_skill_by_slug(skill_slug)
    if not skill:
        return []
    return skills_service.match_freelancers(skill["id"], skill["name"], industry_slug, limit)


@router.get("/{skill_id}", response_model=dict)
async def get_skill(skill_id: int):
    """Get a specific skill. Public endpoint."""
    skill = skills_service.get_skill_by_id(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: SkillCreate,
    current_user=Depends(get_current_user)
):
    """Create a new skill (admin only)."""
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create skills")

    if skills_service.skill_name_exists(skill_data.name):
        raise HTTPException(status_code=400, detail="A skill with this name already exists")

    return skills_service.create_skill(skill_data.model_dump())


@router.patch("/{skill_id}", response_model=dict)
async def update_skill(
    skill_id: int,
    skill_data: SkillUpdate,
    current_user=Depends(get_current_user)
):
    """Update a skill (admin only)."""
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update skills")

    if not skills_service.skill_exists(skill_id):
        raise HTTPException(status_code=404, detail="Skill not found")

    data = skill_data.model_dump(exclude_unset=True)
    if "name" in data:
        if skills_service.skill_name_exists(data["name"], exclude_id=skill_id):
            raise HTTPException(status_code=400, detail="A skill with this name already exists")

    updated = skills_service.update_skill(skill_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Skill not found")
    return updated


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: int,
    current_user=Depends(get_current_user)
):
    """Delete a skill (admin only). Soft delete."""
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete skills")

    if not skills_service.skill_exists(skill_id):
        raise HTTPException(status_code=404, detail="Skill not found")

    skills_service.soft_delete_skill(skill_id)


# ============ User Skills ============

@router.get("/user-skills", response_model=List[dict])
async def list_user_skills(
    user_id: Optional[int] = Query(None, description="Filter by user (defaults to current user)"),
    skill_category: Optional[str] = Query(None, description="Filter by skill category"),
    min_proficiency: Optional[int] = Query(None, ge=1, le=5, description="Minimum proficiency level"),
    verified_only: bool = Query(False, description="Only verified skills"),
    current_user=Depends(get_current_user)
):
    """List user skills. Defaults to current user's skills."""
    target_user_id = user_id if user_id is not None else current_user.get("user_id")
    return skills_service.list_user_skills(target_user_id, skill_category, min_proficiency, verified_only)


@router.post("/user-skills", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_user_skill(
    user_skill_data: UserSkillCreate,
    current_user=Depends(get_current_user)
):
    """Add a skill to current user's profile."""
    user_id = current_user.get("user_id")
    skill_id = user_skill_data.skill_id

    if not skills_service.active_skill_exists(skill_id):
        raise HTTPException(status_code=404, detail="Skill not found or inactive")

    if skills_service.user_has_skill(user_id, skill_id):
        raise HTTPException(status_code=400, detail="You already have this skill in your profile")

    return skills_service.add_user_skill(user_id, user_skill_data.model_dump())


@router.patch("/user-skills/{user_skill_id}", response_model=dict)
async def update_user_skill(
    user_skill_id: int,
    user_skill_data: UserSkillUpdate,
    current_user=Depends(get_current_user)
):
    """Update a user skill. Users can update own; admins can verify."""
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")

    owner = skills_service.get_user_skill_owner(user_skill_id)
    if not owner:
        raise HTTPException(status_code=404, detail="User skill not found")

    is_admin = role.lower() == "admin"
    data = user_skill_data.model_dump(exclude_unset=True)
    if is_admin:
        pass
    elif user_id == owner.get("user_id"):
        if "is_verified" in data:
            raise HTTPException(status_code=403, detail="You cannot verify your own skills")
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to update this skill")

    updated = skills_service.update_user_skill(user_skill_id, data, is_admin, user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User skill not found")
    return updated


@router.delete("/user-skills/{user_skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_skill(
    user_skill_id: int,
    current_user=Depends(get_current_user)
):
    """Remove a skill from user's profile. Users can only remove their own."""
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")

    owner = skills_service.get_user_skill_owner(user_skill_id)
    if not owner:
        raise HTTPException(status_code=404, detail="User skill not found")

    if user_id != owner.get("user_id") and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to delete this skill")

    skills_service.delete_user_skill(user_skill_id)
