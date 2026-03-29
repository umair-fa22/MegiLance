# @AI-HINT: Seller Stats API router - seller tier system, JSS calculation, level benefits
# Uses Turso HTTP API directly (no SQLAlchemy ORM)
"""Seller stats and tier system API endpoints using Turso HTTP API."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime
import logging
import json
logger = logging.getLogger(__name__)

from app.db.turso_http import get_turso_http
from app.core.security import get_current_active_user
from app.models.user import User
# Schemas imported but using dict responses for flexibility

router = APIRouter()


# =====================
# LEVEL DEFINITIONS
# =====================

LEVEL_REQUIREMENTS = {
    "new_seller": {
        "min_orders": 0,
        "min_earnings": 0,
        "min_rating": 0,
        "min_completion_rate": 0,
        "min_on_time_rate": 0,
    },
    "bronze": {
        "min_orders": 5,
        "min_earnings": 100,
        "min_rating": 4.0,
        "min_completion_rate": 80,
        "min_on_time_rate": 80,
    },
    "silver": {
        "min_orders": 20,
        "min_earnings": 500,
        "min_rating": 4.5,
        "min_completion_rate": 90,
        "min_on_time_rate": 85,
    },
    "gold": {
        "min_orders": 50,
        "min_earnings": 2000,
        "min_rating": 4.7,
        "min_completion_rate": 95,
        "min_on_time_rate": 90,
    },
    "platinum": {
        "min_orders": 100,
        "min_earnings": 10000,
        "min_rating": 4.9,
        "min_completion_rate": 98,
        "min_on_time_rate": 95,
    }
}

LEVEL_BENEFITS = {
    "new_seller": {
        "commission_rate": 20,
        "featured_gigs": 0,
        "priority_support": False,
        "badges": ["new_seller"],
        "description": "Just getting started on the platform"
    },
    "bronze": {
        "commission_rate": 18,
        "featured_gigs": 1,
        "priority_support": False,
        "badges": ["bronze_seller", "verified"],
        "description": "Established seller with proven track record"
    },
    "silver": {
        "commission_rate": 15,
        "featured_gigs": 2,
        "priority_support": True,
        "badges": ["silver_seller", "verified", "top_rated"],
        "description": "High-performing seller with excellent reviews"
    },
    "gold": {
        "commission_rate": 12,
        "featured_gigs": 3,
        "priority_support": True,
        "badges": ["gold_seller", "verified", "top_rated", "trusted"],
        "description": "Elite seller with outstanding performance"
    },
    "platinum": {
        "commission_rate": 10,
        "featured_gigs": 5,
        "priority_support": True,
        "badges": ["platinum_seller", "verified", "top_rated", "trusted", "elite"],
        "description": "Top-tier seller with exceptional metrics"
    }
}

LEVEL_ORDER = ["new_seller", "bronze", "silver", "gold", "platinum"]


def calculate_jss(stats: dict) -> float:
    """Calculate Job Success Score (0-100)"""
    # Weighted components:
    # - Completion rate: 30%
    # - Ratings: 30%
    # - On-time delivery: 20%
    # - Repeat clients: 10%
    # - Disputes: 10% (penalty)
    
    completion_score = (stats.get("completion_rate", 0) / 100) * 30
    
    rating = stats.get("average_rating", 0)
    rating_score = (rating / 5.0) * 30 if rating > 0 else 0
    
    on_time_score = (stats.get("on_time_delivery_rate", 0) / 100) * 20
    
    repeat_score = (stats.get("repeat_client_rate", 0) / 100) * 10
    
    # Dispute penalty
    total_orders = stats.get("total_orders", 0)
    disputed = stats.get("disputed_orders", 0)
    dispute_rate = (disputed / total_orders * 100) if total_orders > 0 else 0
    dispute_penalty = min(dispute_rate * 2, 10)  # Max 10% penalty
    
    jss = completion_score + rating_score + on_time_score + repeat_score - dispute_penalty
    return max(0, min(100, jss))


def calculate_level(stats: dict) -> str:
    """Determine seller level based on stats"""
    for level in reversed(LEVEL_ORDER):
        reqs = LEVEL_REQUIREMENTS[level]
        if (
            stats.get("completed_orders", 0) >= reqs["min_orders"] and
            stats.get("total_earnings", 0) >= reqs["min_earnings"] and
            stats.get("average_rating", 0) >= reqs["min_rating"] and
            stats.get("completion_rate", 0) >= reqs["min_completion_rate"] and
            stats.get("on_time_delivery_rate", 0) >= reqs["min_on_time_rate"]
        ):
            return level
    return "new_seller"


# =====================
# ENDPOINTS
# =====================

@router.get("/me", response_model=dict)
def get_my_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's seller statistics."""
    if current_user.user_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers have seller stats"
        )
    
    turso = get_turso_http()
    
    # Get or create seller stats
    result = turso.execute("SELECT * FROM seller_stats WHERE user_id = ?", [current_user.id])
    
    if not result.get("rows"):
        # Create initial stats
        turso.execute("""
            INSERT INTO seller_stats (user_id, level, created_at, updated_at)
            VALUES (?, 'new_seller', datetime('now'), datetime('now'))
        """, [current_user.id])
        result = turso.execute("SELECT * FROM seller_stats WHERE user_id = ?", [current_user.id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to get seller stats")
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    
    stats = {}
    for i, col in enumerate(columns):
        stats[col] = row[i] if i < len(row) else None
    
    # Calculate JSS
    jss = calculate_jss(stats)
    
    # Calculate level
    calculated_level = calculate_level(stats)
    current_level = stats.get("level", "new_seller")
    
    # Update level if changed
    if calculated_level != current_level:
        turso.execute(
            "UPDATE seller_stats SET level = ?, level_updated_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?",
            [calculated_level, current_user.id]
        )
        stats["level"] = calculated_level
    
    # Get level progress
    current_idx = LEVEL_ORDER.index(stats.get("level", "new_seller"))
    next_level = LEVEL_ORDER[current_idx + 1] if current_idx < len(LEVEL_ORDER) - 1 else None
    
    level_progress = None
    if next_level:
        next_reqs = LEVEL_REQUIREMENTS[next_level]
        level_progress = {
            "current_level": stats.get("level"),
            "next_level": next_level,
            "requirements": {
                "orders": {
                    "current": stats.get("completed_orders", 0),
                    "required": next_reqs["min_orders"],
                    "percent": min(100, (stats.get("completed_orders", 0) / next_reqs["min_orders"]) * 100) if next_reqs["min_orders"] > 0 else 100
                },
                "earnings": {
                    "current": stats.get("total_earnings", 0),
                    "required": next_reqs["min_earnings"],
                    "percent": min(100, (stats.get("total_earnings", 0) / next_reqs["min_earnings"]) * 100) if next_reqs["min_earnings"] > 0 else 100
                },
                "rating": {
                    "current": stats.get("average_rating", 0),
                    "required": next_reqs["min_rating"],
                    "percent": min(100, (stats.get("average_rating", 0) / next_reqs["min_rating"]) * 100) if next_reqs["min_rating"] > 0 else 100
                },
                "completion_rate": {
                    "current": stats.get("completion_rate", 0),
                    "required": next_reqs["min_completion_rate"],
                    "percent": min(100, (stats.get("completion_rate", 0) / next_reqs["min_completion_rate"]) * 100) if next_reqs["min_completion_rate"] > 0 else 100
                },
                "on_time_rate": {
                    "current": stats.get("on_time_delivery_rate", 0),
                    "required": next_reqs["min_on_time_rate"],
                    "percent": min(100, (stats.get("on_time_delivery_rate", 0) / next_reqs["min_on_time_rate"]) * 100) if next_reqs["min_on_time_rate"] > 0 else 100
                }
            }
        }
    
    # Get level benefits
    level = stats.get("level", "new_seller")
    benefits = LEVEL_BENEFITS.get(level, LEVEL_BENEFITS["new_seller"])
    
    return {
        "user_id": current_user.id,
        "level": level,
        "jss_score": round(jss, 1),
        "total_orders": stats.get("total_orders", 0),
        "completed_orders": stats.get("completed_orders", 0),
        "cancelled_orders": stats.get("cancelled_orders", 0),
        "disputed_orders": stats.get("disputed_orders", 0),
        "average_rating": stats.get("average_rating", 0),
        "total_reviews": stats.get("total_reviews", 0),
        "five_star_reviews": stats.get("five_star_reviews", 0),
        "completion_rate": stats.get("completion_rate", 100),
        "on_time_delivery_rate": stats.get("on_time_delivery_rate", 100),
        "response_rate": stats.get("response_rate", 100),
        "avg_response_time_hours": stats.get("avg_response_time_hours", 0),
        "total_earnings": stats.get("total_earnings", 0),
        "unique_clients": stats.get("unique_clients", 0),
        "repeat_clients": stats.get("repeat_clients", 0),
        "repeat_client_rate": stats.get("repeat_client_rate", 0),
        "level_progress": level_progress,
        "benefits": benefits,
        "badges": json.loads(stats.get("badges", "[]")) if stats.get("badges") else benefits.get("badges", [])
    }


@router.get("/user/{user_id}", response_model=dict)
def get_user_stats(user_id: int):
    """Get seller stats for a specific user (public view)."""
    turso = get_turso_http()
    
    # Verify user is a freelancer
    user_result = turso.execute(
        "SELECT user_type, name, profile_image_url FROM users WHERE id = ?",
        [user_id]
    )
    
    if not user_result.get("rows"):
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_result["rows"][0][0] != "freelancer":
        raise HTTPException(status_code=400, detail="User is not a seller")
    
    # Get stats
    result = turso.execute("SELECT * FROM seller_stats WHERE user_id = ?", [user_id])
    
    if not result.get("rows"):
        # Return default stats if none exist
        return {
            "user_id": user_id,
            "full_name": user_result["rows"][0][1],
            "avatar_url": user_result["rows"][0][2],
            "level": "new_seller",
            "jss_score": 0,
            "completed_orders": 0,
            "average_rating": 0,
            "total_reviews": 0,
            "member_since": None
        }
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    
    stats = {}
    for i, col in enumerate(columns):
        stats[col] = row[i] if i < len(row) else None
    
    jss = calculate_jss(stats)
    benefits = LEVEL_BENEFITS.get(stats.get("level", "new_seller"), {})
    
    return {
        "user_id": user_id,
        "full_name": user_result["rows"][0][1],
        "avatar_url": user_result["rows"][0][2],
        "level": stats.get("level", "new_seller"),
        "jss_score": round(jss, 1),
        "completed_orders": stats.get("completed_orders", 0),
        "average_rating": stats.get("average_rating", 0),
        "total_reviews": stats.get("total_reviews", 0),
        "on_time_delivery_rate": stats.get("on_time_delivery_rate", 100),
        "response_rate": stats.get("response_rate", 100),
        "badges": benefits.get("badges", [])
    }


@router.post("/recalculate", response_model=dict)
def recalculate_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Recalculate seller stats from order history."""
    if current_user.user_type.lower() != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers have seller stats")
    
    turso = get_turso_http()
    
    # Get all orders for this seller
    orders_result = turso.execute("""
        SELECT status, completed_at, deadline, total_price, buyer_id
        FROM gig_orders
        WHERE seller_id = ?
    """, [current_user.id])
    
    orders = orders_result.get("rows", [])
    
    total_orders = len(orders)
    completed_orders = sum(1 for o in orders if o[0] == "completed")
    cancelled_orders = sum(1 for o in orders if o[0] == "cancelled")
    disputed_orders = sum(1 for o in orders if o[0] == "disputed")
    
    # Calculate on-time rate
    on_time = 0
    for o in orders:
        if o[0] == "completed" and o[1] and o[2]:
            completed_at = datetime.fromisoformat(o[1].replace('Z', '+00:00')) if isinstance(o[1], str) else o[1]
            deadline = datetime.fromisoformat(o[2].replace('Z', '+00:00')) if isinstance(o[2], str) else o[2]
            if completed_at <= deadline:
                on_time += 1
    
    on_time_rate = (on_time / completed_orders * 100) if completed_orders > 0 else 100
    completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 100
    
    # Calculate earnings
    total_earnings = sum(o[3] or 0 for o in orders if o[0] == "completed")
    
    # Calculate unique and repeat clients
    buyer_ids = [o[4] for o in orders if o[0] == "completed"]
    unique_clients = len(set(buyer_ids))
    repeat_clients = len(buyer_ids) - unique_clients
    repeat_client_rate = (repeat_clients / len(buyer_ids) * 100) if buyer_ids else 0
    
    # Get review stats
    reviews_result = turso.execute("""
        SELECT COUNT(*), AVG(rating_overall), SUM(CASE WHEN rating_overall >= 4.5 THEN 1 ELSE 0 END)
        FROM gig_reviews
        WHERE seller_id = ?
    """, [current_user.id])
    
    review_row = reviews_result["rows"][0] if reviews_result.get("rows") else [0, 0, 0]
    total_reviews = review_row[0] or 0
    average_rating = review_row[1] or 0
    five_star_reviews = review_row[2] or 0
    
    # Build stats dict
    stats = {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "disputed_orders": disputed_orders,
        "on_time_delivery_rate": round(on_time_rate, 1),
        "completion_rate": round(completion_rate, 1),
        "total_earnings": total_earnings,
        "unique_clients": unique_clients,
        "repeat_clients": repeat_clients,
        "repeat_client_rate": round(repeat_client_rate, 1),
        "total_reviews": total_reviews,
        "average_rating": round(average_rating, 2) if average_rating else 0,
        "five_star_reviews": five_star_reviews
    }
    
    # Calculate JSS and level
    jss = calculate_jss(stats)
    level = calculate_level(stats)
    
    # Update or insert stats
    existing = turso.execute("SELECT id FROM seller_stats WHERE user_id = ?", [current_user.id])
    
    if existing.get("rows"):
        turso.execute("""
            UPDATE seller_stats SET
                level = ?, total_orders = ?, completed_orders = ?, cancelled_orders = ?,
                disputed_orders = ?, on_time_delivery_rate = ?, completion_rate = ?,
                total_earnings = ?, unique_clients = ?, repeat_clients = ?,
                repeat_client_rate = ?, total_reviews = ?, average_rating = ?,
                five_star_reviews = ?, jss_score = ?, jss_calculated_at = datetime('now'),
                updated_at = datetime('now')
            WHERE user_id = ?
        """, [
            level, total_orders, completed_orders, cancelled_orders, disputed_orders,
            on_time_rate, completion_rate, total_earnings, unique_clients, repeat_clients,
            repeat_client_rate, total_reviews, average_rating, five_star_reviews, jss,
            current_user.id
        ])
    else:
        turso.execute("""
            INSERT INTO seller_stats (
                user_id, level, total_orders, completed_orders, cancelled_orders,
                disputed_orders, on_time_delivery_rate, completion_rate,
                total_earnings, unique_clients, repeat_clients, repeat_client_rate,
                total_reviews, average_rating, five_star_reviews, jss_score,
                jss_calculated_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
        """, [
            current_user.id, level, total_orders, completed_orders, cancelled_orders,
            disputed_orders, on_time_rate, completion_rate, total_earnings, unique_clients,
            repeat_clients, repeat_client_rate, total_reviews, average_rating,
            five_star_reviews, jss
        ])
    
    return {
        "message": "Stats recalculated successfully",
        "level": level,
        "jss_score": round(jss, 1),
        "stats": stats
    }


@router.get("/levels", response_model=dict)
def get_all_levels():
    """Get information about all seller levels and their requirements."""
    levels = []
    for level in LEVEL_ORDER:
        levels.append({
            "level": level,
            "requirements": LEVEL_REQUIREMENTS[level],
            "benefits": LEVEL_BENEFITS[level]
        })
    return {"levels": levels}


@router.get("/leaderboard", response_model=dict)
def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    level: Optional[str] = None
):
    """Get top sellers leaderboard."""
    turso = get_turso_http()
    
    sql = """
    SELECT s.user_id, s.level, s.jss_score, s.completed_orders, s.average_rating,
           s.total_earnings, u.name, u.profile_image_url
    FROM seller_stats s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.completed_orders > 0
    """
    params = []
    
    if level:
        sql += " AND s.level = ?"
        params.append(level)
    
    sql += " ORDER BY s.jss_score DESC, s.completed_orders DESC LIMIT ?"
    params.append(limit)
    
    result = turso.execute(sql, params)
    
    sellers = []
    for i, row in enumerate(result.get("rows", []), 1):
        sellers.append({
            "rank": i,
            "user_id": row[0],
            "level": row[1],
            "jss_score": row[2],
            "completed_orders": row[3],
            "average_rating": row[4],
            "full_name": row[6],
            "avatar_url": row[7],
            "badges": LEVEL_BENEFITS.get(row[1], {}).get("badges", [])
        })
    
    return {
        "sellers": sellers,
        "total": len(sellers)
    }
