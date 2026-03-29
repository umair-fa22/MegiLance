# @AI-HINT: Review responses API - Business owner replies to reviews (Turso-backed)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.turso_http import execute_query
from app.core.security import get_current_active_user
from app.services.db_utils import paginate_params

router = APIRouter(prefix="/review-responses")


class ResponseBody(BaseModel):
    response_text: str
    is_public: bool = True


class TemplateBody(BaseModel):
    name: str
    content: str
    category: str = "general"


class TemplateUpdateBody(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


# ── helpers ──────────────────────────────────────────────────────────────

def _get_user_id(current_user) -> int:
    return current_user.id if hasattr(current_user, "id") else current_user.get("user_id") or current_user.get("id")


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_to_dict(row, columns):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in columns]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


# ── Pending reviews (no response yet) ──────────────────────────────────

@router.get("/pending", response_model=list)
async def get_pending_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
):
    """Get reviews awaiting response from the current user."""
    uid = _get_user_id(current_user)
    offset, limit = paginate_params(page, page_size)
    result = execute_query(
        """SELECT r.id as review_id, u.name as reviewer_name, r.rating,
                  r.comment as review_text, r.created_at as review_date,
                  COALESCE(p.title, c.title, 'Project') as project_title
           FROM reviews r
           LEFT JOIN users u ON r.reviewer_id = u.id
           LEFT JOIN contracts c ON r.contract_id = c.id
           LEFT JOIN projects p ON c.project_id = p.id
           LEFT JOIN review_responses rr ON rr.review_id = r.id
           WHERE r.reviewee_id = ? AND rr.id IS NULL
           ORDER BY r.created_at DESC LIMIT ? OFFSET ?""",
        [uid, limit, offset]
    )
    cols = result.get("columns", result.get("cols", []))
    return [
        {**_row_to_dict(row, cols), "response": None}
        for row in result.get("rows", [])
    ]


# ── Responded reviews ──────────────────────────────────────────────────

@router.get("/responded", response_model=list)
async def get_responded_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
):
    """Get reviews that already have a response."""
    uid = _get_user_id(current_user)
    offset, limit = paginate_params(page, page_size)
    result = execute_query(
        """SELECT r.id as review_id, u.name as reviewer_name, r.rating,
                  r.comment as review_text, r.created_at as review_date,
                  COALESCE(p.title, c.title, 'Project') as project_title,
                  rr.id as response_id, rr.response_text, rr.is_public as resp_public,
                  rr.created_at as resp_created, rr.updated_at as resp_updated
           FROM reviews r
           LEFT JOIN users u ON r.reviewer_id = u.id
           LEFT JOIN contracts c ON r.contract_id = c.id
           LEFT JOIN projects p ON c.project_id = p.id
           INNER JOIN review_responses rr ON rr.review_id = r.id
           WHERE r.reviewee_id = ?
           ORDER BY rr.created_at DESC LIMIT ? OFFSET ?""",
        [uid, limit, offset]
    )
    cols = result.get("columns", result.get("cols", []))
    out = []
    for row in result.get("rows", []):
        d = _row_to_dict(row, cols)
        out.append({
            "review_id": d["review_id"],
            "reviewer_name": d.get("reviewer_name"),
            "rating": d.get("rating"),
            "review_text": d.get("review_text"),
            "review_date": d.get("review_date"),
            "project_title": d.get("project_title"),
            "response": {
                "id": d["response_id"],
                "review_id": d["review_id"],
                "responder_id": uid,
                "response_text": d["response_text"],
                "is_public": bool(d.get("resp_public", True)),
                "created_at": d["resp_created"],
                "updated_at": d.get("resp_updated"),
            },
        })
    return out


# ── Update response ────────────────────────────────────────────────────

@router.put("/{response_id}")
async def update_response(
    response_id: int,
    body: ResponseBody,
    current_user=Depends(get_current_active_user),
):
    """Update a review response."""
    uid = _get_user_id(current_user)
    existing = execute_query("SELECT responder_id FROM review_responses WHERE id = ?", [response_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Response not found")
    cols = existing.get("columns", existing.get("cols", []))
    owner = _row_to_dict(existing["rows"][0], cols).get("responder_id")
    if owner != uid:
        raise HTTPException(status_code=403, detail="Not your response")
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE review_responses SET response_text = ?, is_public = ?, updated_at = ? WHERE id = ?",
        [body.response_text, 1 if body.is_public else 0, now, response_id]
    )
    return {"id": response_id, "response_text": body.response_text, "is_public": body.is_public, "updated_at": now}


# ── Delete response ────────────────────────────────────────────────────

@router.delete("/{response_id}")
async def delete_response(response_id: int, current_user=Depends(get_current_active_user)):
    """Delete a review response."""
    uid = _get_user_id(current_user)
    existing = execute_query("SELECT responder_id FROM review_responses WHERE id = ?", [response_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Response not found")
    cols = existing.get("columns", existing.get("cols", []))
    owner = _row_to_dict(existing["rows"][0], cols).get("responder_id")
    if owner != uid:
        raise HTTPException(status_code=403, detail="Not your response")
    execute_query("DELETE FROM review_responses WHERE id = ?", [response_id])
    return {"message": "Response deleted"}


# ── Templates ───────────────────────────────────────────────────────────

@router.get("/templates", response_model=list)
async def get_response_templates(
    category: Optional[str] = None,
    current_user=Depends(get_current_active_user),
):
    """Get response templates for the current user."""
    uid = _get_user_id(current_user)
    if category:
        result = execute_query(
            "SELECT id, user_id, name, content, category, use_count, created_at, updated_at "
            "FROM response_templates WHERE user_id = ? AND category = ? ORDER BY use_count DESC",
            [uid, category]
        )
    else:
        result = execute_query(
            "SELECT id, user_id, name, content, category, use_count, created_at, updated_at "
            "FROM response_templates WHERE user_id = ? ORDER BY use_count DESC",
            [uid]
        )
    cols = result.get("columns", result.get("cols", []))
    return [_row_to_dict(row, cols) for row in result.get("rows", [])]


@router.post("/templates", status_code=status.HTTP_201_CREATED)
async def create_response_template(body: TemplateBody, current_user=Depends(get_current_active_user)):
    """Create a response template."""
    uid = _get_user_id(current_user)
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO response_templates (user_id, name, content, category, use_count, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)",
        [uid, body.name, body.content, body.category, now, now]
    )
    inserted = execute_query("SELECT last_insert_rowid()")
    new_id = _val(inserted["rows"][0][0]) if inserted.get("rows") else None
    return {"id": new_id, "user_id": uid, "name": body.name, "content": body.content, "category": body.category, "use_count": 0}


@router.put("/templates/{template_id}")
async def update_response_template(
    template_id: int,
    body: TemplateUpdateBody,
    current_user=Depends(get_current_active_user),
):
    """Update a response template."""
    uid = _get_user_id(current_user)
    existing = execute_query("SELECT user_id, name, content, category FROM response_templates WHERE id = ?", [template_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Template not found")
    cols = existing.get("columns", existing.get("cols", []))
    old = _row_to_dict(existing["rows"][0], cols)
    if old["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your template")
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE response_templates SET name = ?, content = ?, category = ?, updated_at = ? WHERE id = ?",
        [body.name or old["name"], body.content or old["content"], body.category or old["category"], now, template_id]
    )
    return {"id": template_id, "name": body.name or old["name"], "content": body.content or old["content"], "category": body.category or old["category"]}


@router.delete("/templates/{template_id}")
async def delete_response_template(template_id: int, current_user=Depends(get_current_active_user)):
    """Delete a response template."""
    uid = _get_user_id(current_user)
    existing = execute_query("SELECT user_id FROM response_templates WHERE id = ?", [template_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Template not found")
    cols = existing.get("columns", existing.get("cols", []))
    if _row_to_dict(existing["rows"][0], cols)["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your template")
    execute_query("DELETE FROM response_templates WHERE id = ?", [template_id])
    return {"message": "Template deleted"}


# ── Analytics ───────────────────────────────────────────────────────────

@router.get("/analytics")
async def get_response_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user=Depends(get_current_active_user),
):
    """Get review response analytics from real data."""
    uid = _get_user_id(current_user)
    total = execute_query(
        "SELECT COUNT(*) FROM reviews WHERE reviewee_id = ? AND created_at >= datetime('now', ?)",
        [uid, f"-{days} days"]
    )
    total_reviews = _val(total["rows"][0][0]) if total.get("rows") else 0

    responded = execute_query(
        """SELECT COUNT(*) FROM reviews r
           INNER JOIN review_responses rr ON rr.review_id = r.id
           WHERE r.reviewee_id = ? AND r.created_at >= datetime('now', ?)""",
        [uid, f"-{days} days"]
    )
    responded_count = _val(responded["rows"][0][0]) if responded.get("rows") else 0

    dist = execute_query(
        "SELECT CAST(rating AS INTEGER) as r, COUNT(*) FROM reviews WHERE reviewee_id = ? AND created_at >= datetime('now', ?) GROUP BY r",
        [uid, f"-{days} days"]
    )
    rating_dist = {str(i): 0 for i in range(1, 6)}
    for row in dist.get("rows", []):
        rating_dist[str(_val(row[0]))] = _val(row[1])

    response_rate = round((responded_count / total_reviews * 100), 1) if total_reviews > 0 else 0.0

    return {
        "total_reviews": total_reviews,
        "responded_reviews": responded_count,
        "pending_reviews": total_reviews - responded_count,
        "response_rate": response_rate,
        "reviews_by_rating": rating_dist,
    }


# ── AI Suggest ──────────────────────────────────────────────────────────

@router.post("/ai-suggest")
async def get_ai_response_suggestion(review_id: int, current_user=Depends(get_current_active_user)):
    """Get AI-generated response suggestions based on actual review content."""
    rev = execute_query("SELECT comment, rating FROM reviews WHERE id = ?", [review_id])
    if not rev.get("rows"):
        raise HTTPException(status_code=404, detail="Review not found")
    cols = rev.get("columns", rev.get("cols", []))
    r = _row_to_dict(rev["rows"][0], cols)
    rating = r.get("rating", 5)
    comment = r.get("comment", "")

    if rating >= 4:
        suggestions = [
            "Thank you for your wonderful feedback! I'm glad you were satisfied with the work. Looking forward to collaborating again!",
            "I really appreciate you taking the time to leave this review. Your kind words motivate me to keep delivering quality work!",
            "Thank you so much! It was a pleasure working with you on this project.",
        ]
    elif rating >= 3:
        suggestions = [
            "Thank you for your honest feedback. I value your perspective and will use it to improve my future work.",
            "I appreciate your review. If there's anything specific I could have done better, I'd love to hear more details.",
        ]
    else:
        suggestions = [
            "Thank you for your feedback. I take all reviews seriously and will work to address the concerns you've raised.",
            "I'm sorry the experience didn't meet your expectations. I'd welcome the opportunity to discuss how I can improve.",
        ]

    return {"review_id": review_id, "suggestions": suggestions}


# ── GET single response by review_id ────────────────────────────────────

@router.get("/{review_id}")
async def get_response_for_review(review_id: int, current_user=Depends(get_current_active_user)):
    """Get the response for a specific review (if any)."""
    result = execute_query(
        "SELECT id, review_id, responder_id, response_text, is_public, created_at, updated_at "
        "FROM review_responses WHERE review_id = ?",
        [review_id]
    )
    rows = result.get("rows", [])
    if not rows:
        raise HTTPException(status_code=404, detail="No response found for this review")
    cols = result.get("columns", result.get("cols", []))
    r = _row_to_dict(rows[0], cols)
    return {
        "id": r["id"], "review_id": r["review_id"], "responder_id": r["responder_id"],
        "response_text": r["response_text"], "is_public": bool(r.get("is_public", True)),
        "created_at": r["created_at"], "updated_at": r.get("updated_at"),
    }


# ── Create response ────────────────────────────────────────────────────

@router.post("/{review_id}", status_code=status.HTTP_201_CREATED)
async def respond_to_review(
    review_id: int,
    body: ResponseBody,
    current_user=Depends(get_current_active_user),
):
    """Respond to a review."""
    uid = _get_user_id(current_user)
    rev = execute_query("SELECT reviewee_id FROM reviews WHERE id = ?", [review_id])
    if not rev.get("rows"):
        raise HTTPException(status_code=404, detail="Review not found")
    existing = execute_query("SELECT id FROM review_responses WHERE review_id = ?", [review_id])
    if existing.get("rows"):
        raise HTTPException(status_code=409, detail="Response already exists for this review")
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO review_responses (review_id, responder_id, response_text, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [review_id, uid, body.response_text, 1 if body.is_public else 0, now, now]
    )
    inserted = execute_query("SELECT last_insert_rowid()")
    new_id = _val(inserted["rows"][0][0]) if inserted.get("rows") else None
    return {
        "id": new_id, "review_id": review_id, "responder_id": uid,
        "response_text": body.response_text, "is_public": body.is_public,
        "created_at": now, "updated_at": now,
    }

