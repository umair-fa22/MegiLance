# @AI-HINT: AI-powered matching API endpoints for intelligent project-freelancer recommendations
"""
AI Matching API
Provides ML-powered recommendations for projects and freelancers
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from app.core.security import get_current_active_user
from app.services.matching_engine import get_matching_service, MatchingEngine
from app.db.turso_http import execute_query, parse_rows
import logging

logger = logging.getLogger("megilance")


router = APIRouter(prefix="/matching", tags=["ai-matching"])


# Response Models
class MatchFactors(BaseModel):
    """Match score breakdown"""
    skill_match: float
    success_rate: float
    avg_rating: float
    budget_match: float
    experience_match: float
    availability: float
    response_rate: float


class FreelancerRecommendation(BaseModel):
    """Freelancer recommendation for a project"""
    freelancer_id: int
    freelancer_name: str
    freelancer_bio: Optional[str]
    hourly_rate: Optional[float]
    location: Optional[str]
    profile_image_url: Optional[str]
    match_score: float
    match_factors: MatchFactors


class ProjectRecommendation(BaseModel):
    """Project recommendation for a freelancer"""
    project_id: int
    project_title: str
    project_description: str
    category: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    budget_type: str
    experience_level: str
    created_at: str
    match_score: float
    match_factors: MatchFactors


class RecommendationResponse(BaseModel):
    """Recommendation response wrapper"""
    recommendations: List[dict]
    total: int
    algorithm: str
    generated_at: str


# Endpoints
@router.get("/recommendations")
async def get_general_recommendations(
    limit: int = Query(3, ge=1, le=10),
    current_user = Depends(get_current_active_user)
):
    """
    Get general freelancer recommendations for the client dashboard.
    If the client has active projects, recommends based on the most recent one.
    Otherwise, recommends top-rated freelancers.
    """
    try:
        # Check if client has active projects
        result = await execute_query(
            "SELECT id, title FROM projects WHERE client_id = ? AND status IN ('open', 'in_progress') ORDER BY created_at DESC LIMIT 1",
            [current_user["id"]]
        )
        projects = parse_rows(result)
        
        if projects:
            # Recommend based on most recent project
            matching_service = get_matching_service()
            recommendations = await matching_service.get_recommended_freelancers(
                project_id=projects[0]["id"],
                limit=limit,
                min_score=0.4
            )
            return {
                "recommendations": recommendations,
                "context": f"Based on your project: {projects[0]['title']}",
                "project_id": projects[0]["id"]
            }
        
        # No active projects — recommend top-rated freelancers
        result = await execute_query(
            "SELECT id, email, name, bio, profile_image_url, hourly_rate, location, rating "
            "FROM users WHERE LOWER(user_type) = 'freelancer' AND is_active = 1 "
            "ORDER BY rating DESC NULLS LAST "
            "LIMIT ?",
            [limit]
        )
        rows = parse_rows(result)
        
        recommendations = []
        for row in rows:
            user_rating = float(row.get("rating") or 0)
            rating_factor = min(user_rating / 5.0, 1.0) if user_rating > 0 else 0.5
            match_score = round(0.6 + (rating_factor * 0.4), 2)
            
            recommendations.append({
                "freelancer_id": row.get("id"),
                "freelancer_name": row.get("name") or (row.get("email", "").split("@")[0] if row.get("email") else "Freelancer"),
                "freelancer_bio": row.get("bio"),
                "profile_image_url": row.get("profile_image_url"),
                "hourly_rate": row.get("hourly_rate"),
                "location": row.get("location"),
                "match_score": match_score,
                "match_factors": {
                    "skill_match": 0.7,
                    "success_rate": rating_factor,
                    "avg_rating": rating_factor,
                    "budget_match": 0.7,
                    "experience_match": 0.7,
                    "availability": 1.0,
                    "response_rate": 0.8
                }
            })
        
        return {
            "recommendations": recommendations,
            "context": "Top rated freelancers",
            "project_id": None
        }
    except Exception as e:
        logger.error("get_general_recommendations failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred. Please try again."
        )


@router.get("/freelancers/{project_id}")
async def get_freelancer_recommendations(
    project_id: int,
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations"),
    min_score: float = Query(0.5, ge=0.0, le=1.0, description="Minimum match score"),
    current_user = Depends(get_current_active_user)
):
    """
    Get AI-powered freelancer recommendations for a project
    
    Uses ML algorithms to match:
    - Skill compatibility (30% weight)
    - Historical success rate (20% weight)
    - Average ratings (15% weight)
    - Budget alignment (15% weight)
    - Experience level match (10% weight)
    - Current availability (5% weight)
    - Response rate (5% weight)
    
    Returns ranked list of freelancers with match scores and explanations
    """
    matching_service = get_matching_service()
    
    try:
        recommendations = await matching_service.get_recommended_freelancers(
            project_id=project_id,
            limit=limit,
            min_score=min_score
        )
        
        return {
            "recommendations": recommendations,
            "total": len(recommendations),
            "algorithm": "weighted_multi_factor_v1",
            "generated_at": str(datetime.now(timezone.utc))
        }
    
    except Exception as e:
        logger.error("get_freelancer_recommendations failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred. Please try again."
        )


@router.get("/projects")
async def get_project_recommendations(
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(0.5, ge=0.0, le=1.0),
    current_user = Depends(get_current_active_user)
):
    """
    Get AI-powered project recommendations for the current freelancer
    
    Returns projects that best match the freelancer's:
    - Skills and expertise
    - Experience level
    - Hourly rate expectations
    - Availability
    - Historical success in similar projects
    """
    freelancer_id = current_user["id"]
    matching_service = get_matching_service()
    
    try:
        recommendations = await matching_service.get_recommended_projects(
            freelancer_id=freelancer_id,
            limit=limit,
            min_score=min_score
        )
        
        return {
            "recommendations": recommendations,
            "total": len(recommendations),
            "algorithm": "weighted_multi_factor_v1",
            "generated_at": str(datetime.now(timezone.utc))
        }
    
    except Exception as e:
        logger.error("get_project_recommendations failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred. Please try again."
        )


@router.get("/score/{project_id}/{freelancer_id}")
async def get_match_score(
    project_id: int,
    freelancer_id: int,
    current_user = Depends(get_current_active_user)
):
    """
    Get detailed match score between a specific project and freelancer
    
    Returns:
    - Overall match score (0.0 to 1.0)
    - Breakdown of individual factors
    - Weights used in calculation
    - Explanation of score
    """
    matching_service = get_matching_service()
    
    # Get project and freelancer via Turso
    result = await execute_query("SELECT * FROM projects WHERE id = ?", [project_id])
    projects = parse_rows(result)
    if not projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = await execute_query("SELECT * FROM users WHERE id = ?", [freelancer_id])
    freelancers = parse_rows(result)
    if not freelancers:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    
    # Calculate match score
    match_result = await matching_service.calculate_match_score(projects[0], freelancers[0])
    
    return {
        "project_id": project_id,
        "freelancer_id": freelancer_id,
        "match_score": match_result["score"],
        "factors": match_result["factors"],
        "weights": match_result["weights"],
        "interpretation": _interpret_score(match_result["score"])
    }


@router.post("/track-click")
async def track_recommendation_click(
    item_type: str = Query(..., pattern="^(project|freelancer)$"),
    item_id: int = Query(...),
    score: float = Query(...),
    current_user = Depends(get_current_active_user)
):
    """
    Track when a user clicks on a recommendation
    
    This data is used to improve the ML matching algorithm over time
    """
    matching_service = get_matching_service()
    
    try:
        await matching_service.track_recommendation_click(
            user_id=current_user["id"],
            item_type=item_type,
            item_id=item_id,
            score=score
        )
        
        return {
            "status": "tracked",
            "message": "Recommendation interaction recorded"
        }
    
    except Exception as e:
        logger.error("track_recommendation_click failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred. Please try again."
        )


@router.get("/algorithm-info")
async def get_algorithm_info():
    """
    Get information about the matching algorithm
    
    Returns:
    - Algorithm version
    - Factors used
    - Weights applied
    - Description of methodology
    """
    return {
        "algorithm": "weighted_multi_factor_v1",
        "version": "1.0.0",
        "factors": {
            "skill_match": {
                "weight": 0.30,
                "description": "Jaccard similarity between required and freelancer skills"
            },
            "success_rate": {
                "weight": 0.20,
                "description": "Percentage of successfully completed contracts"
            },
            "avg_rating": {
                "weight": 0.15,
                "description": "Average rating from client reviews"
            },
            "budget_match": {
                "weight": 0.15,
                "description": "Alignment between project budget and freelancer rate"
            },
            "experience_match": {
                "weight": 0.10,
                "description": "Match between required and actual experience level"
            },
            "availability": {
                "weight": 0.05,
                "description": "Current availability based on active contracts"
            },
            "response_rate": {
                "weight": 0.05,
                "description": "Historical proposal acceptance rate"
            }
        },
        "methodology": "Weighted multi-factor scoring with ML-based skill embeddings",
        "minimum_score": 0.5,
        "maximum_score": 1.0
    }


def _interpret_score(score: float) -> str:
    """Interpret match score into human-readable description"""
    if score >= 0.9:
        return "Excellent match - Highly recommended"
    elif score >= 0.8:
        return "Very good match - Strongly recommended"
    elif score >= 0.7:
        return "Good match - Recommended"
    elif score >= 0.6:
        return "Fair match - Consider reviewing"
    elif score >= 0.5:
        return "Moderate match - May be suitable"
    else:
        return "Low match - Not recommended"
