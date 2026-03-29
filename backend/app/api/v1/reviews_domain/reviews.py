# @AI-HINT: Review and Rating Management API - Turso-only, no SQLite fallback
# Enhanced with input validation and security measures
"""
Review and Rating Management API

Handles:
- Review creation (only contract parties)
- Review listing with filters
- Review stats calculation
- Review responses
- Rating aggregation
"""
import logging
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime, timezone
logger = logging.getLogger(__name__)

from app.core.security import get_current_user_from_token
from app.schemas.review import ReviewCreateRequest, ReviewUpdateRequest
from app.services import reviews_service
from app.services.db_utils import paginate_params

router = APIRouter()


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreateRequest,
    current_user = Depends(get_current_user)
):
    """
    Create a new review.
    
    Business rules:
    - Only contract parties (client or freelancer) can review
    - Cannot review yourself
    - One review per party per contract
    - Contract must be completed
    """
    user_id = current_user.get("user_id")
    contract_id = review_data.contract_id
    reviewed_user_id = review_data.reviewed_user_id
    
    # Get contract
    contract = reviews_service.get_contract_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Contract must be completed before reviews are allowed
    if contract.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed contracts")
    
    # Verify user is part of the contract
    if user_id not in [contract.get("client_id"), contract.get("freelancer_id")]:
        raise HTTPException(status_code=403, detail="Only contract parties can create reviews")
    
    # Verify not reviewing yourself
    if user_id == reviewed_user_id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")
    
    # Verify reviewed user is the other party
    other_party_id = contract.get("freelancer_id") if user_id == contract.get("client_id") else contract.get("client_id")
    if reviewed_user_id != other_party_id:
        raise HTTPException(status_code=400, detail="Can only review the other party in the contract")
    
    # Check for existing review
    if reviews_service.has_existing_review(contract_id, user_id, reviewed_user_id):
        raise HTTPException(status_code=400, detail="You have already reviewed this user for this contract")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Prepare rating breakdown
    rating_breakdown = {
        "communication": review_data.communication_rating,
        "quality": review_data.quality_rating,
        "professionalism": review_data.professionalism_rating,
        "deadline": review_data.deadline_rating
    }
    
    rating = review_data.rating
    is_public = review_data.is_public
    review_text = review_data.review_text
    
    # Create review
    new_id = reviews_service.create_review(
        contract_id, user_id, reviewed_user_id, rating,
        rating_breakdown, review_text, is_public, now
    )
    
    if not new_id:
        raise HTTPException(status_code=500, detail="Failed to create review")
    
    return {
        "id": new_id,
        "contract_id": contract_id,
        "reviewer_id": user_id,
        "reviewed_user_id": reviewed_user_id,
        "rating": rating,
        "communication_rating": review_data.communication_rating,
        "quality_rating": review_data.quality_rating,
        "professionalism_rating": review_data.professionalism_rating,
        "deadline_rating": review_data.deadline_rating,
        "review_text": review_text,
        "is_public": is_public,
        "created_at": now,
        "updated_at": now
    }


@router.get("", response_model=List[dict])
async def list_reviews(
    user_id: Optional[int] = Query(None, description="Filter by reviewed user"),
    reviewer_id: Optional[int] = Query(None, description="Filter by reviewer"),
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Minimum rating"),
    max_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Maximum rating"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    sort: Optional[str] = Query("newest", description="Sort: newest, oldest, highest, lowest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """
    List reviews with filtering and sorting.
    
    Only public reviews are visible unless you're:
    - The reviewer
    - The reviewed user
    - An admin
    """
    offset, limit = paginate_params(page, page_size)
    current_user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    where_clauses = []
    params = []
    
    if user_id is not None:
        where_clauses.append("reviewee_id = ?")
        params.append(user_id)
    
    if reviewer_id is not None:
        where_clauses.append("reviewer_id = ?")
        params.append(reviewer_id)
    
    if contract_id is not None:
        where_clauses.append("contract_id = ?")
        params.append(contract_id)
    
    if min_rating is not None:
        where_clauses.append("rating >= ?")
        params.append(min_rating)
    
    if max_rating is not None:
        where_clauses.append("rating <= ?")
        params.append(max_rating)
    
    # Privacy filter
    if role.lower() != "admin":
        where_clauses.append("(is_public = 1 OR reviewer_id = ? OR reviewee_id = ?)")
        params.extend([current_user_id, current_user_id])
    
    if is_public is not None:
        where_clauses.append("is_public = ?")
        params.append(1 if is_public else 0)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Sorting
    sort_map = {
        "newest": "r.created_at DESC",
        "oldest": "r.created_at ASC",
        "highest": "r.rating DESC",
        "lowest": "r.rating ASC",
    }
    order_by = sort_map.get(sort, "r.created_at DESC")
    
    params.extend([limit, offset])
    
    rows = reviews_service.query_reviews(where_sql, params, order_by=order_by)
    output = []
    for row in rows:
        # Parse breakdown
        breakdown = {}
        response_data = None
        try:
            if row.get("rating_breakdown"):
                breakdown = json.loads(row.get("rating_breakdown"))
                # Extract response if present
                if "response" in breakdown:
                    response_data = breakdown.pop("response")
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
            
        output.append({
            "id": row.get("id"),
            "contract_id": row.get("contract_id"),
            "reviewer_id": row.get("reviewer_id"),
            "reviewed_user_id": row.get("reviewee_id"),
            "rating": row.get("rating"),
            "communication_rating": breakdown.get("communication"),
            "quality_rating": breakdown.get("quality"),
            "professionalism_rating": breakdown.get("professionalism"),
            "deadline_rating": breakdown.get("deadline"),
            "review_text": row.get("comment"),
            "is_public": bool(row.get("is_public")),
            "response": response_data,
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
            "project_title": row.get("project_title"),
            "reviewed_user_name": row.get("reviewed_user_name"),
            "reviewer_name": row.get("reviewer_name")
        })
    return output


@router.get("/user/{user_id}", response_model=List[dict])
async def get_reviews_for_user(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Get all reviews for a specific user (as reviewee)."""
    offset, limit = paginate_params(page, page_size)
    current_user_id = current_user.get("user_id")
    role = current_user.get("role", "")

    where_sql = "reviewee_id = ?"
    params = [user_id]
    if role.lower() != "admin":
        where_sql += " AND (is_public = 1 OR reviewer_id = ? OR reviewee_id = ?)"
        params.extend([current_user_id, current_user_id])
    params.extend([limit, offset])

    rows = reviews_service.query_reviews(where_sql, params, order_by="r.created_at DESC")
    output = []
    for row in rows:
        breakdown = {}
        try:
            if row.get("rating_breakdown"):
                breakdown = json.loads(row.get("rating_breakdown"))
                breakdown.pop("response", None)
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
        output.append({
            "id": row.get("id"),
            "contract_id": row.get("contract_id"),
            "reviewer_id": row.get("reviewer_id"),
            "reviewed_user_id": row.get("reviewee_id"),
            "rating": row.get("rating"),
            "communication_rating": breakdown.get("communication"),
            "quality_rating": breakdown.get("quality"),
            "professionalism_rating": breakdown.get("professionalism"),
            "deadline_rating": breakdown.get("deadline"),
            "review_text": row.get("comment"),
            "is_public": bool(row.get("is_public")),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
            "project_title": row.get("project_title"),
            "reviewer_name": row.get("reviewer_name"),
        })
    return output


@router.get("/contract/{contract_id}", response_model=List[dict])
async def get_reviews_for_contract(
    contract_id: int,
    current_user = Depends(get_current_user)
):
    """Get all reviews for a specific contract."""
    current_user_id = current_user.get("user_id")
    role = current_user.get("role", "")

    where_sql = "contract_id = ?"
    params = [contract_id]
    if role.lower() != "admin":
        where_sql += " AND (is_public = 1 OR reviewer_id = ? OR reviewee_id = ?)"
        params.extend([current_user_id, current_user_id])
    params.extend([100, 0])

    rows = reviews_service.query_reviews(where_sql, params, order_by="r.created_at DESC")
    output = []
    for row in rows:
        breakdown = {}
        try:
            if row.get("rating_breakdown"):
                breakdown = json.loads(row.get("rating_breakdown"))
                breakdown.pop("response", None)
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
        output.append({
            "id": row.get("id"),
            "contract_id": row.get("contract_id"),
            "reviewer_id": row.get("reviewer_id"),
            "reviewed_user_id": row.get("reviewee_id"),
            "rating": row.get("rating"),
            "communication_rating": breakdown.get("communication"),
            "quality_rating": breakdown.get("quality"),
            "professionalism_rating": breakdown.get("professionalism"),
            "deadline_rating": breakdown.get("deadline"),
            "review_text": row.get("comment"),
            "is_public": bool(row.get("is_public")),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
            "project_title": row.get("project_title"),
            "reviewer_name": row.get("reviewer_name"),
        })
    return output


@router.get("/stats/{user_id}", response_model=dict)
async def get_review_stats(user_id: int):
    """
    Get aggregated review statistics for a user.
    
    Only includes public reviews in stats.
    """
    # Check user exists
    if not reviews_service.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    
    stats = reviews_service.get_review_aggregate_stats(user_id)
    rating_distribution = reviews_service.get_rating_distribution(user_id)
    
    total_reviews = stats.get("total_reviews") or 0
    avg_rating = stats.get("average_rating")
    
    return {
        "user_id": user_id,
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
        "communication_rating": stats.get("communication_avg", 0.0),
        "quality_rating": stats.get("quality_avg", 0.0),
        "professionalism_rating": stats.get("professionalism_avg", 0.0),
        "deadline_rating": stats.get("deadline_avg", 0.0),
        "rating_distribution": rating_distribution
    }


@router.get("/{review_id}", response_model=dict)
async def get_review(
    review_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get a specific review.
    
    Private reviews only visible to reviewer, reviewed user, or admin.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    row = reviews_service.get_review_by_id(review_id)
    if not row:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Privacy check
    if not row.get("is_public"):
        if role.lower() != "admin" and user_id not in [row.get("reviewer_id"), row.get("reviewee_id")]:
            raise HTTPException(status_code=403, detail="You don't have permission to view this review")
    
    breakdown = {}
    try:
        if row.get("rating_breakdown"):
            breakdown = json.loads(row.get("rating_breakdown"))
    except (json.JSONDecodeError, TypeError, ValueError):
        pass

    return {
        "id": row.get("id"),
        "contract_id": row.get("contract_id"),
        "reviewer_id": row.get("reviewer_id"),
        "reviewed_user_id": row.get("reviewee_id"),
        "rating": row.get("rating"),
        "communication_rating": breakdown.get("communication"),
        "quality_rating": breakdown.get("quality"),
        "professionalism_rating": breakdown.get("professionalism"),
        "deadline_rating": breakdown.get("deadline"),
        "review_text": row.get("comment"),
        "is_public": bool(row.get("is_public")),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at")
    }


@router.patch("/{review_id}", response_model=dict)
async def update_review(
    review_id: int,
    review_data: ReviewUpdateRequest,
    current_user = Depends(get_current_user)
):
    """
    Update a review.
    
    Only the reviewer can update their review.
    """
    user_id = current_user.get("user_id")
    
    review = reviews_service.get_review_for_permission_check(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if user_id != review.get("reviewer_id"):
        raise HTTPException(status_code=403, detail="You don't have permission to update this review")

    updates = []
    params = []
    
    # Handle rating breakdown updates
    current_breakdown = {}
    try:
        if review.get("rating_breakdown"):
            current_breakdown = json.loads(review.get("rating_breakdown"))
    except (json.JSONDecodeError, TypeError, ValueError):
        pass
        
    breakdown_changed = False
    for field_name, attr_name in [
        ("communication", "communication_rating"),
        ("quality", "quality_rating"),
        ("professionalism", "professionalism_rating"),
        ("deadline", "deadline_rating"),
    ]:
        value = getattr(review_data, attr_name, None)
        if value is not None:
            current_breakdown[field_name] = value
            breakdown_changed = True
            
    if breakdown_changed:
        updates.append("rating_breakdown = ?")
        params.append(json.dumps(current_breakdown))

    if review_data.rating is not None:
        updates.append("rating = ?")
        params.append(review_data.rating)
        
    if review_data.review_text is not None:
        updates.append("comment = ?")
        params.append(review_data.review_text)
        
    if review_data.is_public is not None:
        updates.append("is_public = ?")
        params.append(1 if review_data.is_public else 0)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(review_id)
        
        reviews_service.update_review_fields(review_id, ', '.join(updates), params)
    
    # Fetch updated review (reuse get logic)
    # ... (simplified for brevity, just return what we have)
    return await get_review(review_id, current_user)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a review.
    
    Only reviewer or admin can delete.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    review = reviews_service.get_review_owner(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Permission check
    if role.lower() != "admin" and user_id != review.get("reviewer_id"):
        raise HTTPException(status_code=403, detail="Only the reviewer or admin can delete this review")
    
    reviews_service.delete_review_record(review_id)


@router.post("/{review_id}/respond", response_model=dict)
async def respond_to_review(
    review_id: int,
    response_text: str = Query(..., min_length=10, max_length=2000, description="Response text"),
    current_user = Depends(get_current_user)
):
    """
    The reviewed user responds to a review (like Upwork/Fiverr reply feature).
    Only the person who was reviewed can respond, and only once per review.
    """
    user_id = current_user.get("user_id")

    review = reviews_service.get_review_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Only the reviewed person can respond
    if user_id != review.get("reviewee_id"):
        raise HTTPException(status_code=403, detail="Only the reviewed user can respond to this review")

    # Check if already responded
    breakdown = {}
    try:
        raw = review.get("rating_breakdown")
        if raw:
            breakdown = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        pass

    if breakdown.get("response"):
        raise HTTPException(status_code=400, detail="You have already responded to this review")

    # Store response in rating_breakdown JSON
    now = datetime.now(timezone.utc).isoformat()
    breakdown["response"] = {
        "text": response_text,
        "responded_by": user_id,
        "responded_at": now,
    }

    reviews_service.update_review_fields(
        review_id,
        "rating_breakdown = ?, updated_at = ?",
        [json.dumps(breakdown), now, review_id]
    )

    return {
        "review_id": review_id,
        "response_text": response_text,
        "responded_at": now,
        "message": "Response added successfully"
    }


# ── Sentiment Analysis Endpoints ──────────────────────────────────────


@router.get("/{review_id}/sentiment", response_model=dict)
async def get_review_sentiment(
    review_id: int,
    current_user=Depends(get_current_user),
):
    """Get AI sentiment analysis for a specific review."""
    review = reviews_service.get_review_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    text = review.get("comment", "")
    rating = review.get("rating")
    sentiment = reviews_service.analyze_review_sentiment(text, rating)
    if sentiment is None:
        raise HTTPException(status_code=503, detail="Sentiment analysis service unavailable")
    return sentiment


@router.get("/user/{user_id}/sentiment", response_model=dict)
async def get_user_review_sentiment(
    user_id: int,
    current_user=Depends(get_current_user),
):
    """Get aggregated sentiment analysis across all reviews for a user."""
    if not reviews_service.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")

    from app.services.sentiment_analysis import sentiment_analyzer
    rows = reviews_service.query_reviews(
        "reviewee_id = ? AND is_public = 1", [user_id, 100, 0]
    )
    review_dicts = [
        {"text": r.get("comment", ""), "rating": r.get("rating")} for r in rows if r.get("comment")
    ]
    if not review_dicts:
        return {"total": 0, "avg_compound": 0.0, "distribution": {}}
    return sentiment_analyzer.analyze_batch(review_dicts)
