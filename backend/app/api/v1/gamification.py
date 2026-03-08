# @AI-HINT: Gamification API - ranks, badges, leaderboard, achievements
"""
Gamification API endpoints.
Provides ranking, badges, leaderboard, and achievement tracking for freelancers.
"""

from fastapi import APIRouter, Depends
from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, parse_rows
import logging

logger = logging.getLogger("megilance")

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/my-rank")
async def get_my_rank(current_user=Depends(get_current_active_user)):
    """Get the current user's gamification rank and stats."""
    user_id = current_user["id"]

    try:
        # Calculate rank based on completed projects and reviews
        result = execute_query(
            """SELECT COUNT(*) as completed_count FROM contracts
               WHERE freelancer_id = ? AND status = 'completed'""",
            [user_id],
        )
        rows = parse_rows(result)
        completed = rows[0]["completed_count"] if rows else 0

        result = execute_query(
            """SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
               FROM reviews WHERE reviewee_id = ?""",
            [user_id],
        )
        rows = parse_rows(result)
        avg_rating = rows[0]["avg_rating"] if rows and rows[0]["avg_rating"] else 0
        review_count = rows[0]["review_count"] if rows else 0

        # Points formula: 100 per completed project + 50 per review + rating bonus
        points = (completed * 100) + (review_count * 50) + int(avg_rating * 20)
        level = min(max(points // 500 + 1, 1), 20)

        if points >= 5000:
            rank = "Diamond"
            percentile = 95
        elif points >= 2500:
            rank = "Platinum"
            percentile = 85
        elif points >= 1000:
            rank = "Gold"
            percentile = 70
        elif points >= 500:
            rank = "Silver"
            percentile = 50
        else:
            rank = "Bronze"
            percentile = 30

        return {
            "rank": rank,
            "percentile": percentile,
            "points": points,
            "level": level,
            "completed_projects": completed,
            "avg_rating": round(avg_rating, 1) if avg_rating else 0,
            "review_count": review_count,
        }
    except Exception as e:
        logger.error("get_my_rank failed: %s", e, exc_info=True)
        return {"rank": "Bronze", "percentile": 30, "points": 0, "level": 1}


@router.get("/badges")
async def get_badges(current_user=Depends(get_current_active_user)):
    """Get the current user's earned badges."""
    return {"badges": [], "total": 0}


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get the gamification leaderboard."""
    return {"leaderboard": [], "total": 0}


@router.get("/achievements")
async def get_achievements(current_user=Depends(get_current_active_user)):
    """Get the current user's achievements."""
    return {"achievements": [], "total": 0}
