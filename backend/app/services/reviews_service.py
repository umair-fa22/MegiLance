# @AI-HINT: Service layer for review CRUD operations - all DB access via Turso HTTP
"""Reviews Service - Data access layer for review and rating management."""

import json
import logging
from typing import Optional, List, Dict, Any

from app.db.turso_http import execute_query, parse_rows

try:
    from app.services.sentiment_analysis import sentiment_analyzer as _sa
except ImportError:
    _sa = None

logger = logging.getLogger(__name__)


def analyze_review_sentiment(text: str, rating: float = None) -> Optional[Dict[str, Any]]:
    """Run sentiment analysis on review text. Returns None if analyser unavailable."""
    if not _sa or not text:
        return None
    try:
        return _sa.analyze_review(text, rating)
    except Exception as exc:
        logger.warning("Sentiment analysis failed: %s", exc)
        return None


def get_contract_by_id(contract_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a contract by ID for review validation."""
    result = execute_query(
        "SELECT id, client_id, freelancer_id, status FROM contracts WHERE id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def has_existing_review(contract_id: int, reviewer_id: int, reviewee_id: int) -> bool:
    """Check if a review already exists for this contract/reviewer/reviewee combination."""
    result = execute_query(
        "SELECT id FROM reviews WHERE contract_id = ? AND reviewer_id = ? AND reviewee_id = ?",
        [contract_id, reviewer_id, reviewee_id]
    )
    return bool(result and result.get("rows"))


def create_review(
    contract_id: int,
    reviewer_id: int,
    reviewee_id: int,
    rating: float,
    rating_breakdown: Dict[str, Any],
    review_text: Optional[str],
    is_public: bool,
    now: str
) -> int:
    """Insert a new review and return its ID."""
    # Auto-analyze sentiment of the review text
    sentiment_data = analyze_review_sentiment(review_text, rating)
    sentiment_json = json.dumps(sentiment_data) if sentiment_data else None

    execute_query(
        """INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, 
                                rating_breakdown, comment, is_public, sentiment_data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            contract_id,
            reviewer_id,
            reviewee_id,
            rating,
            json.dumps(rating_breakdown),
            review_text,
            1 if is_public else 0,
            sentiment_json,
            now,
            now
        ]
    )

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    return new_id


def query_reviews(where_sql: str, params: List, order_by: str = "r.created_at DESC") -> List[Dict[str, Any]]:
    """Query reviews with joins, filtering, sorting, and pagination."""
    result = execute_query(
        f"""SELECT r.id, r.contract_id, r.reviewer_id, r.reviewee_id, r.rating,
                   r.rating_breakdown,
                   r.comment, r.is_public, r.created_at, r.updated_at,
                   p.title as project_title,
                   u.name as reviewed_user_name,
                   reviewer.name as reviewer_name
            FROM reviews r
            LEFT JOIN contracts c ON r.contract_id = c.id
            LEFT JOIN projects p ON c.project_id = p.id
            LEFT JOIN users u ON r.reviewee_id = u.id
            LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
            WHERE {where_sql}
            ORDER BY {order_by}
            LIMIT ? OFFSET ?""",
        params
    )
    if not result:
        return []
    return parse_rows(result)


def user_exists(user_id: int) -> bool:
    """Check if a user exists."""
    result = execute_query("SELECT id FROM users WHERE id = ?", [user_id])
    return bool(result and result.get("rows"))


def get_review_aggregate_stats(user_id: int) -> Dict[str, Any]:
    """Get aggregate review stats (count, average, sub-rating averages) for a user (public reviews only)."""
    result = execute_query(
        """SELECT COUNT(*) as total_reviews,
                  AVG(rating) as average_rating
           FROM reviews
           WHERE reviewee_id = ? AND is_public = 1""",
        [user_id]
    )
    stats = {"total_reviews": 0, "average_rating": 0.0}
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            stats = rows[0]

    # Compute sub-rating averages from rating_breakdown JSON
    breakdown_result = execute_query(
        """SELECT rating_breakdown FROM reviews
           WHERE reviewee_id = ? AND is_public = 1 AND rating_breakdown IS NOT NULL""",
        [user_id]
    )
    sub_totals = {"communication": 0.0, "quality": 0.0, "professionalism": 0.0, "deadline": 0.0}
    sub_counts = {"communication": 0, "quality": 0, "professionalism": 0, "deadline": 0}
    if breakdown_result and breakdown_result.get("rows"):
        bd_rows = parse_rows(breakdown_result)
        import json
        for row in bd_rows:
            raw = row.get("rating_breakdown")
            if not raw:
                continue
            try:
                bd = json.loads(raw) if isinstance(raw, str) else raw
            except (json.JSONDecodeError, TypeError):
                continue
            for key in sub_totals:
                val = bd.get(key)
                if val is not None:
                    sub_totals[key] += float(val)
                    sub_counts[key] += 1

    stats["communication_avg"] = round(sub_totals["communication"] / sub_counts["communication"], 2) if sub_counts["communication"] else 0.0
    stats["quality_avg"] = round(sub_totals["quality"] / sub_counts["quality"], 2) if sub_counts["quality"] else 0.0
    stats["professionalism_avg"] = round(sub_totals["professionalism"] / sub_counts["professionalism"], 2) if sub_counts["professionalism"] else 0.0
    stats["deadline_avg"] = round(sub_totals["deadline"] / sub_counts["deadline"], 2) if sub_counts["deadline"] else 0.0

    return stats


def get_rating_distribution(user_id: int) -> Dict[str, int]:
    """Get star rating distribution for a user (public reviews only)."""
    rating_distribution = {}
    for i in range(1, 6):
        result = execute_query(
            """SELECT COUNT(*) as count FROM reviews
               WHERE reviewee_id = ? AND is_public = 1 AND rating >= ? AND rating < ?""",
            [user_id, i, i + 1]
        )
        count = 0
        if result and result.get("rows"):
            count_rows = parse_rows(result)
            if count_rows:
                count = count_rows[0].get("count", 0)
        rating_distribution[f"{i}_star"] = count
    return rating_distribution


def get_review_by_id(review_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a single review by ID."""
    result = execute_query(
        """SELECT id, contract_id, reviewer_id, reviewee_id, rating,
                  rating_breakdown,
                  comment, is_public, created_at, updated_at
           FROM reviews WHERE id = ?""",
        [review_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def get_review_for_permission_check(review_id: int) -> Optional[Dict[str, Any]]:
    """Fetch minimal review data for permission checks."""
    result = execute_query(
        "SELECT id, reviewer_id, reviewee_id, rating_breakdown FROM reviews WHERE id = ?",
        [review_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def get_review_owner(review_id: int) -> Optional[Dict[str, Any]]:
    """Fetch review ID and reviewer_id for delete permission check."""
    result = execute_query(
        "SELECT id, reviewer_id FROM reviews WHERE id = ?",
        [review_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def update_review_fields(review_id: int, set_clause: str, params: List) -> None:
    """Update review fields."""
    execute_query(
        f"UPDATE reviews SET {set_clause} WHERE id = ?",
        params
    )


def delete_review_record(review_id: int) -> None:
    """Delete a review by ID."""
    execute_query("DELETE FROM reviews WHERE id = ?", [review_id])
