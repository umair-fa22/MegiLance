# @AI-HINT: Gig marketplace API router - CRUD for gigs, ordering, delivery, and reviews
# Uses Turso HTTP API directly (no SQLAlchemy ORM)
"""Gig marketplace API endpoints using Turso HTTP API."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import logging
import json
import uuid
logger = logging.getLogger(__name__)

from app.db.turso_http import get_turso_http
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.db_utils import sanitize_text, paginate_params
from app.schemas.gig import (
    GigCreate, GigUpdate, GigOrderCreate, GigDeliveryCreate, GigRevisionRequest, GigReviewCreate, GigReviewSellerResponse
)

router = APIRouter()


# =====================
# HELPER FUNCTIONS
# =====================

def _row_to_gig(row: list, columns: list) -> dict:
    """Convert database row to gig dict"""
    result = {}
    for i, col in enumerate(columns):
        if i < len(row):
            val = row[i]
            # Parse JSON fields
            if col in ['tags', 'search_tags', 'images', 'extras', 'requirements', 
                       'basic_features', 'standard_features', 'premium_features'] and val:
                try:
                    result[col] = json.loads(val) if isinstance(val, str) else val
                except (json.JSONDecodeError, TypeError, ValueError):
                    result[col] = val
            else:
                result[col] = val
        else:
            result[col] = None
    return result


def _generate_order_number() -> str:
    """Generate unique order number"""
    import random
    import string
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"GIG-{timestamp}-{random_suffix}"


# =====================
# GIG CRUD
# =====================

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_gig(
    gig_data: GigCreate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Create a new gig (seller only)."""
    if current_user.user_type != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can create gigs"
        )
    
    turso = get_turso_http()
    
    # Generate unique slug
    base_slug = "-".join(gig_data.title.lower().split()[:5])
    slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
    
    # Prepare JSON fields
    tags_json = json.dumps(gig_data.tags) if gig_data.tags else None
    search_tags_json = json.dumps(gig_data.search_tags) if gig_data.search_tags else None
    basic_features_json = json.dumps(gig_data.basic_package.features) if gig_data.basic_package.features else None
    standard_features_json = json.dumps(gig_data.standard_package.features) if gig_data.standard_package and gig_data.standard_package.features else None
    premium_features_json = json.dumps(gig_data.premium_package.features) if gig_data.premium_package and gig_data.premium_package.features else None
    extras_json = json.dumps([e.model_dump() for e in gig_data.extras]) if gig_data.extras else None
    requirements_json = json.dumps(gig_data.requirements) if gig_data.requirements else None
    images_json = json.dumps(gig_data.images) if gig_data.images else None
    
    # Insert gig
    sql = """
    INSERT INTO gigs (
        seller_id, title, slug, description, short_description, category_id,
        tags, search_tags, basic_title, basic_description, basic_price, 
        basic_delivery_days, basic_revisions, basic_features,
        standard_title, standard_description, standard_price,
        standard_delivery_days, standard_revisions, standard_features,
        premium_title, premium_description, premium_price,
        premium_delivery_days, premium_revisions, premium_features,
        extras, requirements, images, video_url, thumbnail_url, status,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """
    
    params = [
        current_user.id, sanitize_text(gig_data.title), slug, sanitize_text(gig_data.description), 
        sanitize_text(gig_data.short_description) if gig_data.short_description else None, gig_data.category_id,
        tags_json, search_tags_json,
        # Basic package
        sanitize_text(gig_data.basic_package.title), sanitize_text(gig_data.basic_package.description),
        gig_data.basic_package.price, gig_data.basic_package.delivery_days,
        gig_data.basic_package.revisions, basic_features_json,
        # Standard package
        sanitize_text(gig_data.standard_package.title) if gig_data.standard_package else "Standard",
        sanitize_text(gig_data.standard_package.description) if gig_data.standard_package else None,
        gig_data.standard_package.price if gig_data.standard_package else gig_data.basic_package.price * 2,
        gig_data.standard_package.delivery_days if gig_data.standard_package else gig_data.basic_package.delivery_days,
        gig_data.standard_package.revisions if gig_data.standard_package else gig_data.basic_package.revisions + 1,
        standard_features_json,
        # Premium package
        sanitize_text(gig_data.premium_package.title) if gig_data.premium_package else "Premium",
        sanitize_text(gig_data.premium_package.description) if gig_data.premium_package else None,
        gig_data.premium_package.price if gig_data.premium_package else gig_data.basic_package.price * 4,
        gig_data.premium_package.delivery_days if gig_data.premium_package else gig_data.basic_package.delivery_days,
        gig_data.premium_package.revisions if gig_data.premium_package else gig_data.basic_package.revisions + 3,
        premium_features_json,
        # Extras, requirements, media
        extras_json, requirements_json, images_json, gig_data.video_url,
        gig_data.images[0] if gig_data.images else None,
        "draft"
    ]
    
    turso.execute(sql, params)
    
    # Get the created gig ID
    result = turso.execute("SELECT id FROM gigs WHERE slug = ?", [slug])
    
    if result.get("rows"):
        gig_id = result["rows"][0][0]
        return {
            "id": gig_id,
            "slug": slug,
            "message": "Gig created successfully"
        }
    
    raise HTTPException(status_code=500, detail="Failed to create gig")


@router.get("", response_model=List[dict])
def list_gigs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    seller_id: Optional[int] = None,
    filter_status: Optional[str] = Query("active", alias="status"),
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query("created_at", enum=["created_at", "price", "rating", "orders"])
) -> list[dict]:
    """List/search gigs with filters."""
    offset, limit = paginate_params(page, page_size)
    turso = get_turso_http()
    
    # Build query
    sql = """
    SELECT g.id, g.title, g.slug, g.short_description, g.thumbnail_url,
           g.basic_price, g.rating_average, g.rating_count, g.orders_completed,
           g.seller_id, g.category_id, g.status, g.is_featured,
           u.name as seller_name, u.profile_image_url as seller_avatar
    FROM gigs g
    LEFT JOIN users u ON g.seller_id = u.id
    WHERE 1=1
    """
    params = []
    
    if filter_status:
        sql += " AND g.status = ?"
        params.append(filter_status)
    
    if category_id:
        sql += " AND g.category_id = ?"
        params.append(category_id)
    
    if seller_id:
        sql += " AND g.seller_id = ?"
        params.append(seller_id)
    
    if search:
        safe_search = search.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        sql += " AND (g.title LIKE ? ESCAPE '\\' OR g.description LIKE ? ESCAPE '\\' OR g.tags LIKE ? ESCAPE '\\')"
        search_term = f"%{safe_search}%"
        params.extend([search_term, search_term, search_term])
    
    if min_price:
        sql += " AND g.basic_price >= ?"
        params.append(min_price)
    
    if max_price:
        sql += " AND g.basic_price <= ?"
        params.append(max_price)
    
    # Sorting
    sort_map = {
        "created_at": "g.created_at DESC",
        "price": "g.basic_price ASC",
        "rating": "g.rating_average DESC",
        "orders": "g.orders_completed DESC"
    }
    sql += f" ORDER BY g.is_featured DESC, {sort_map.get(sort_by, 'g.created_at DESC')}"
    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    result = turso.execute(sql, params)
    
    gigs = []
    columns = ["id", "title", "slug", "short_description", "thumbnail_url",
               "basic_price", "rating_average", "rating_count", "orders_completed",
               "seller_id", "category_id", "status", "is_featured",
               "seller_name", "seller_avatar"]
    
    for row in result.get("rows", []):
        gig = _row_to_gig(row, columns)
        gigs.append(gig)
    
    return gigs


@router.get("/{gig_id}", response_model=dict)
def get_gig(gig_id: int) -> dict:
    """Get gig details by ID."""
    turso = get_turso_http()
    
    sql = """
    SELECT g.*, u.full_name as seller_name, u.avatar_url as seller_avatar,
           u.created_at as seller_member_since
    FROM gigs g
    LEFT JOIN users u ON g.seller_id = u.id
    WHERE g.id = ?
    """
    
    result = turso.execute(sql, [gig_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    
    gig = _row_to_gig(row, columns)
    
    # Get FAQs
    faq_result = turso.execute(
        "SELECT id, question, answer, display_order FROM gig_faqs WHERE gig_id = ? ORDER BY display_order",
        [gig_id]
    )
    gig["faqs"] = [{"id": r[0], "question": r[1], "answer": r[2], "order": r[3]} 
                  for r in faq_result.get("rows", [])]
    
    # Get recent reviews
    reviews_result = turso.execute("""
        SELECT r.id, r.rating_overall, r.review_text, r.created_at,
               u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
        FROM gig_reviews r
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE r.gig_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
    """, [gig_id])
    gig["recent_reviews"] = [
        {
            "id": r[0], "rating": r[1], "text": r[2], "created_at": r[3],
            "reviewer_name": r[4], "reviewer_avatar": r[5]
        }
        for r in reviews_result.get("rows", [])
    ]
    
    return gig


@router.get("/slug/{slug}", response_model=dict)
def get_gig_by_slug(slug: str) -> dict:
    """Get gig details by slug."""
    turso = get_turso_http()
    
    result = turso.execute("SELECT id FROM gigs WHERE slug = ?", [slug])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    gig_id = result["rows"][0][0]
    return get_gig(gig_id)


@router.put("/{gig_id}", response_model=dict)
def update_gig(
    gig_id: int,
    gig_data: GigUpdate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Update a gig (owner only)."""
    turso = get_turso_http()
    
    # Verify ownership
    result = turso.execute("SELECT seller_id FROM gigs WHERE id = ?", [gig_id])
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    if result["rows"][0][0] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build update query dynamically
    updates = []
    params = []
    
    update_fields = gig_data.dict(exclude_unset=True)
    
    ALLOWED_GIG_COLUMNS = frozenset({
        'title', 'description', 'category', 'subcategory', 'tags', 'images',
        'extras', 'requirements', 'delivery_time', 'revisions', 'price',
        'packages',
    })
    
    text_fields = {'title', 'description', 'category', 'subcategory'}
    for field, value in update_fields.items():
        if field not in ALLOWED_GIG_COLUMNS:
            continue
        if value is not None:
            if field in ['tags', 'images', 'extras', 'requirements']:
                value = json.dumps(value)
            elif field in text_fields:
                value = sanitize_text(value)
            updates.append(f"{field} = ?")
            params.append(value)
    
    if not updates:
        return {"message": "No updates provided"}
    
    updates.append("updated_at = datetime('now')")
    params.append(gig_id)
    
    sql = f"UPDATE gigs SET {', '.join(updates)} WHERE id = ?"
    turso.execute(sql, params)
    
    return {"message": "Gig updated successfully"}


@router.post("/{gig_id}/publish", response_model=dict)
def publish_gig(
    gig_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Publish a draft gig."""
    turso = get_turso_http()
    
    # Verify ownership and status
    result = turso.execute(
        "SELECT seller_id, status FROM gigs WHERE id = ?", 
        [gig_id]
    )
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    seller_id, gig_status = result["rows"][0]
    
    if seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if gig_status not in ["draft", "paused"]:
        raise HTTPException(status_code=400, detail=f"Cannot publish gig with status '{gig_status}'")
    
    # Publish
    turso.execute(
        "UPDATE gigs SET status = 'active', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        [gig_id]
    )
    
    return {"message": "Gig published successfully"}


@router.post("/{gig_id}/pause", response_model=dict)
def pause_gig(
    gig_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Pause an active gig."""
    turso = get_turso_http()
    
    # Verify ownership
    result = turso.execute("SELECT seller_id, status FROM gigs WHERE id = ?", [gig_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    if result["rows"][0][0] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    turso.execute(
        "UPDATE gigs SET status = 'paused', updated_at = datetime('now') WHERE id = ?",
        [gig_id]
    )
    
    return {"message": "Gig paused"}


@router.delete("/{gig_id}", response_model=dict)
def delete_gig(
    gig_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Delete a gig (archive it)."""
    turso = get_turso_http()
    
    # Verify ownership
    result = turso.execute("SELECT seller_id FROM gigs WHERE id = ?", [gig_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    if result["rows"][0][0] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Archive instead of hard delete
    turso.execute(
        "UPDATE gigs SET status = 'archived', updated_at = datetime('now') WHERE id = ?",
        [gig_id]
    )
    
    return {"message": "Gig deleted"}


# =====================
# GIG ORDERS
# =====================

@router.post("/orders", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: GigOrderCreate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Create a new gig order (buyer)."""
    turso = get_turso_http()
    
    # Get gig details
    result = turso.execute("""
        SELECT id, seller_id, status, 
               basic_price, basic_delivery_days, basic_revisions,
               standard_price, standard_delivery_days, standard_revisions,
               premium_price, premium_delivery_days, premium_revisions,
               title
        FROM gigs WHERE id = ?
    """, [order_data.gig_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Gig not found")
    
    gig = result["rows"][0]
    gig_id, seller_id, gig_status = gig[0], gig[1], gig[2]
    
    if gig_status != "active":
        raise HTTPException(status_code=400, detail="Gig is not available")
    
    if seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot order your own gig")
    
    # Get package details based on tier
    tier = order_data.package_tier
    if tier == "basic":
        price, delivery_days, revisions = gig[3], gig[4], gig[5]
    elif tier == "standard":
        price, delivery_days, revisions = gig[6], gig[7], gig[8]
    elif tier == "premium":
        price, delivery_days, revisions = gig[9], gig[10], gig[11]
    else:
        raise HTTPException(status_code=400, detail="Invalid package tier")
    
    if not price:
        raise HTTPException(status_code=400, detail=f"{tier.capitalize()} package not available")
    
    # Calculate pricing
    quantity = order_data.quantity or 1
    base_price = price * quantity
    
    # Calculate extras price from selected extras
    extras_price = 0.0
    extra_delivery_days = 0
    if order_data.selected_extras:
        extras_result = turso.execute("SELECT extras FROM gigs WHERE id = ?", [gig_id])
        if extras_result and extras_result.get("rows"):
            extras_raw = extras_result["rows"][0][0]
            extras_str = extras_raw.get("value") if isinstance(extras_raw, dict) else extras_raw
            if extras_str and extras_str != "null":
                available_extras = json.loads(extras_str)
                extras_by_id = {e.get("id", ""): e for e in available_extras}
                for extra_id in order_data.selected_extras:
                    if extra_id in extras_by_id:
                        extras_price += extras_by_id[extra_id].get("price", 0)
                        extra_delivery_days += extras_by_id[extra_id].get("delivery_days_add", 0)
    
    service_fee = base_price * 0.05  # 5% service fee
    total_price = base_price + extras_price + service_fee
    
    # Calculate deadline (include extra days from extras)
    deadline = (datetime.now(timezone.utc) + timedelta(days=delivery_days + extra_delivery_days)).isoformat()
    
    # Generate order number
    order_number = _generate_order_number()
    
    # Create order
    sql = """
    INSERT INTO gig_orders (
        order_number, gig_id, buyer_id, seller_id, package_tier, package_title,
        quantity, base_price, extras_price, service_fee, total_price,
        delivery_days, deadline, revisions_allowed, status, payment_status,
        buyer_notes, selected_extras, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_requirements', 'pending', ?, ?, datetime('now'), datetime('now'))
    """
    
    params = [
        order_number, gig_id, current_user.id, seller_id, tier,
        f"{gig[12]} - {tier.capitalize()}", quantity, base_price,
        extras_price, service_fee, total_price, delivery_days, deadline,
        revisions or 0, sanitize_text(order_data.buyer_notes) if order_data.buyer_notes else None,
        json.dumps(order_data.selected_extras) if order_data.selected_extras else None
    ]
    
    turso.execute(sql, params)
    
    # Get the created order ID
    result = turso.execute("SELECT id FROM gig_orders WHERE order_number = ?", [order_number])
    
    if result.get("rows"):
        order_id = result["rows"][0][0]
        
        # Update gig order count
        turso.execute(
            "UPDATE gigs SET orders_in_progress = orders_in_progress + 1 WHERE id = ?",
            [gig_id]
        )
        
        return {
            "id": order_id,
            "order_number": order_number,
            "total_price": total_price,
            "deadline": deadline,
            "message": "Order created successfully"
        }
    
    raise HTTPException(status_code=500, detail="Failed to create order")


@router.get("/orders", response_model=List[dict])
def list_orders(
    role: str = Query("buyer", enum=["buyer", "seller"]),
    filter_status: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
) -> list[dict]:
    """List orders for current user."""
    offset, limit = paginate_params(page, page_size)
    turso = get_turso_http()
    
    if role == "buyer":
        sql = """
        SELECT o.id, o.order_number, o.gig_id, o.package_tier, o.package_title,
               o.total_price, o.status, o.deadline, o.created_at,
               g.title as gig_title, g.thumbnail_url,
               u.full_name as other_user_name
        FROM gig_orders o
        LEFT JOIN gigs g ON o.gig_id = g.id
        LEFT JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ?
        """
    else:
        sql = """
        SELECT o.id, o.order_number, o.gig_id, o.package_tier, o.package_title,
               o.total_price, o.status, o.deadline, o.created_at,
               g.title as gig_title, g.thumbnail_url,
               u.full_name as other_user_name
        FROM gig_orders o
        LEFT JOIN gigs g ON o.gig_id = g.id
        LEFT JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ?
        """
    
    params = [current_user.id]
    
    if filter_status:
        sql += " AND o.status = ?"
        params.append(filter_status)
    
    sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    result = turso.execute(sql, params)
    
    orders = []
    for row in result.get("rows", []):
        orders.append({
            "id": row[0], "order_number": row[1], "gig_id": row[2],
            "package_tier": row[3], "package_title": row[4],
            "total_price": row[5], "status": row[6], "deadline": row[7],
            "created_at": row[8], "gig_title": row[9], "thumbnail_url": row[10],
            "other_user_name": row[11]
        })
    
    return orders


@router.get("/orders/{order_id}", response_model=dict)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Get order details."""
    turso = get_turso_http()
    
    result = turso.execute("SELECT * FROM gig_orders WHERE id = ?", [order_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Order not found")
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    
    order = {}
    for i, col in enumerate(columns):
        order[col] = row[i]
    
    # Check access
    if order.get("buyer_id") != current_user.id and order.get("seller_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get deliveries
    deliveries = turso.execute(
        "SELECT * FROM gig_deliveries WHERE order_id = ? ORDER BY delivery_number DESC",
        [order_id]
    )
    order["deliveries"] = [dict(zip(deliveries.get("columns", []), r)) 
                          for r in deliveries.get("rows", [])]
    
    # Get revisions
    revisions = turso.execute(
        "SELECT * FROM gig_revisions WHERE order_id = ? ORDER BY revision_number DESC",
        [order_id]
    )
    order["revisions"] = [dict(zip(revisions.get("columns", []), r)) 
                         for r in revisions.get("rows", [])]
    
    return order


@router.post("/orders/{order_id}/deliver", response_model=dict)
def deliver_order(
    order_id: int,
    delivery_data: GigDeliveryCreate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Submit a delivery for an order (seller)."""
    turso = get_turso_http()
    
    # Verify order and ownership
    result = turso.execute(
        "SELECT seller_id, status FROM gig_orders WHERE id = ?",
        [order_id]
    )
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Order not found")
    
    seller_id, order_status = result["rows"][0]
    
    if seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order_status not in ["in_progress", "revision_requested"]:
        raise HTTPException(status_code=400, detail=f"Cannot deliver order with status '{order_status}'")
    
    # Get next delivery number
    count_result = turso.execute(
        "SELECT MAX(delivery_number) FROM gig_deliveries WHERE order_id = ?",
        [order_id]
    )
    max_num = count_result["rows"][0][0] if count_result.get("rows") and count_result["rows"][0][0] else 0
    delivery_number = max_num + 1
    
    # Create delivery
    sql = """
    INSERT INTO gig_deliveries (order_id, delivery_number, message, files, source_files, is_final, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    """
    
    files_json = json.dumps(delivery_data.files) if delivery_data.files else None
    source_files_json = json.dumps(delivery_data.source_files) if delivery_data.source_files else None
    
    turso.execute(sql, [
        order_id, delivery_number, sanitize_text(delivery_data.message) if delivery_data.message else None,
        files_json, source_files_json, delivery_data.is_final or False
    ])
    
    # Update order status
    turso.execute(
        "UPDATE gig_orders SET status = 'delivered', delivered_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        [order_id]
    )
    
    # Get delivery ID
    result = turso.execute(
        "SELECT id FROM gig_deliveries WHERE order_id = ? AND delivery_number = ?",
        [order_id, delivery_number]
    )
    
    return {
        "delivery_id": result["rows"][0][0] if result.get("rows") else None,
        "delivery_number": delivery_number,
        "message": "Delivery submitted successfully"
    }


@router.post("/orders/{order_id}/accept", response_model=dict)
def accept_delivery(
    order_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Accept a delivery and complete the order (buyer)."""
    turso = get_turso_http()
    
    # Verify order and ownership
    result = turso.execute(
        "SELECT buyer_id, seller_id, gig_id, status FROM gig_orders WHERE id = ?",
        [order_id]
    )
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Order not found")
    
    buyer_id, seller_id, gig_id, order_status = result["rows"][0]
    
    if buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order_status != "delivered":
        raise HTTPException(status_code=400, detail="Order has not been delivered yet")
    
    # Complete order
    turso.execute(
        "UPDATE gig_orders SET status = 'completed', completed_at = datetime('now'), payment_status = 'released', updated_at = datetime('now') WHERE id = ?",
        [order_id]
    )
    
    # Update gig stats
    turso.execute("""
        UPDATE gigs SET 
            orders_completed = orders_completed + 1,
            orders_in_progress = CASE WHEN orders_in_progress > 0 THEN orders_in_progress - 1 ELSE 0 END
        WHERE id = ?
    """, [gig_id])
    
    # Update/create seller stats
    existing = turso.execute("SELECT id FROM seller_stats WHERE user_id = ?", [seller_id])
    if existing.get("rows"):
        turso.execute("""
            UPDATE seller_stats SET
                total_orders = total_orders + 1,
                completed_orders = completed_orders + 1,
                updated_at = datetime('now')
            WHERE user_id = ?
        """, [seller_id])
    else:
        turso.execute("""
            INSERT INTO seller_stats (user_id, total_orders, completed_orders, created_at, updated_at)
            VALUES (?, 1, 1, datetime('now'), datetime('now'))
        """, [seller_id])
    
    return {"message": "Order completed successfully"}


@router.post("/orders/{order_id}/revision", response_model=dict)
def request_revision(
    order_id: int,
    revision_data: GigRevisionRequest,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Request a revision (buyer)."""
    turso = get_turso_http()
    
    # Verify order and ownership
    result = turso.execute(
        "SELECT buyer_id, status, revisions_allowed, revisions_used FROM gig_orders WHERE id = ?",
        [order_id]
    )
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Order not found")
    
    buyer_id, order_status, revisions_allowed, revisions_used = result["rows"][0]
    
    if buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order_status != "delivered":
        raise HTTPException(status_code=400, detail="Can only request revision for delivered orders")
    
    revisions_allowed = revisions_allowed or 0
    revisions_used = revisions_used or 0
    
    if revisions_used >= revisions_allowed:
        raise HTTPException(status_code=400, detail="No revisions remaining")
    
    # Get next revision number
    revision_number = revisions_used + 1
    
    # Create revision request
    sql = """
    INSERT INTO gig_revisions (order_id, revision_number, requester_id, request_description, request_files, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    """
    
    files_json = json.dumps(revision_data.files) if revision_data.files else None
    
    turso.execute(sql, [
        order_id, revision_number, current_user.id,
        sanitize_text(revision_data.description), files_json
    ])
    
    # Update order
    turso.execute(
        "UPDATE gig_orders SET status = 'revision_requested', revisions_used = revisions_used + 1, updated_at = datetime('now') WHERE id = ?",
        [order_id]
    )
    
    # Get revision ID
    result = turso.execute(
        "SELECT id FROM gig_revisions WHERE order_id = ? AND revision_number = ?",
        [order_id, revision_number]
    )
    
    return {
        "revision_id": result["rows"][0][0] if result.get("rows") else None,
        "revision_number": revision_number,
        "revisions_remaining": revisions_allowed - revision_number,
        "message": "Revision requested"
    }


# =====================
# GIG REVIEWS
# =====================

@router.post("/reviews", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: GigReviewCreate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Leave a review for a completed order (buyer)."""
    turso = get_turso_http()
    
    # Verify order
    result = turso.execute(
        "SELECT buyer_id, seller_id, gig_id, status FROM gig_orders WHERE id = ?",
        [review_data.order_id]
    )
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Order not found")
    
    buyer_id, seller_id, gig_id, order_status = result["rows"][0]
    
    if buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order_status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed orders")
    
    # Check if already reviewed
    existing = turso.execute(
        "SELECT id FROM gig_reviews WHERE order_id = ?",
        [review_data.order_id]
    )
    if existing.get("rows"):
        raise HTTPException(status_code=400, detail="Order already reviewed")
    
    # Calculate overall rating
    rating_overall = (
        review_data.rating_communication + 
        review_data.rating_service + 
        review_data.rating_delivery + 
        review_data.rating_recommendation
    ) / 4.0
    
    # Create review
    sql = """
    INSERT INTO gig_reviews (
        order_id, gig_id, reviewer_id, seller_id,
        rating_communication, rating_service, rating_delivery, rating_recommendation, rating_overall,
        review_text, review_images, private_feedback, is_public, is_verified_purchase,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, datetime('now'), datetime('now'))
    """
    
    images_json = json.dumps(review_data.images) if review_data.images else None
    
    turso.execute(sql, [
        review_data.order_id, gig_id, current_user.id, seller_id,
        review_data.rating_communication, review_data.rating_service,
        review_data.rating_delivery, review_data.rating_recommendation,
        rating_overall, sanitize_text(review_data.review_text), images_json,
        sanitize_text(review_data.private_feedback) if review_data.private_feedback else None
    ])
    
    # Update gig ratings
    avg_result = turso.execute(
        "SELECT AVG(rating_overall) FROM gig_reviews WHERE gig_id = ?",
        [gig_id]
    )
    avg_rating = avg_result["rows"][0][0] if avg_result.get("rows") else 0
    
    turso.execute("""
        UPDATE gigs SET 
            rating_count = rating_count + 1,
            rating_average = ?
        WHERE id = ?
    """, [avg_rating, gig_id])
    
    # Update seller stats
    seller_avg = turso.execute(
        "SELECT AVG(rating_overall) FROM gig_reviews WHERE seller_id = ?",
        [seller_id]
    )
    seller_avg_rating = seller_avg["rows"][0][0] if seller_avg.get("rows") else 0
    
    existing_stats = turso.execute("SELECT id FROM seller_stats WHERE user_id = ?", [seller_id])
    if existing_stats.get("rows"):
        turso.execute("""
            UPDATE seller_stats SET
                total_reviews = total_reviews + 1,
                average_rating = ?,
                five_star_reviews = five_star_reviews + CASE WHEN ? >= 4.5 THEN 1 ELSE 0 END,
                updated_at = datetime('now')
            WHERE user_id = ?
        """, [seller_avg_rating, rating_overall, seller_id])
    
    # Get review ID
    result = turso.execute(
        "SELECT id FROM gig_reviews WHERE order_id = ?",
        [review_data.order_id]
    )
    
    return {
        "id": result["rows"][0][0] if result.get("rows") else None,
        "rating_overall": rating_overall,
        "message": "Review submitted successfully"
    }


@router.get("/{gig_id}/reviews", response_model=List[dict])
def get_gig_reviews(
    gig_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> list[dict]:
    """Get reviews for a gig."""
    offset, limit = paginate_params(page, page_size)
    turso = get_turso_http()
    
    sql = """
    SELECT r.id, r.rating_overall, r.rating_communication, r.rating_service,
           r.rating_delivery, r.rating_recommendation, r.review_text, r.review_images,
           r.seller_response, r.seller_responded_at, r.helpful_votes, r.created_at,
           u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
    FROM gig_reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.gig_id = ? AND r.is_public = 1
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
    """
    
    result = turso.execute(sql, [gig_id, limit, offset])
    
    reviews = []
    for row in result.get("rows", []):
        reviews.append({
            "id": row[0],
            "rating_overall": row[1],
            "rating_communication": row[2],
            "rating_service": row[3],
            "rating_delivery": row[4],
            "rating_recommendation": row[5],
            "review_text": row[6],
            "review_images": json.loads(row[7]) if row[7] else [],
            "seller_response": row[8],
            "seller_responded_at": row[9],
            "helpful_votes": row[10],
            "created_at": row[11],
            "reviewer_name": row[12],
            "reviewer_avatar": row[13]
        })
    
    return reviews


@router.post("/reviews/{review_id}/respond", response_model=dict)
def respond_to_review(
    review_id: int,
    response_data: GigReviewSellerResponse,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Respond to a review (seller)."""
    turso = get_turso_http()
    
    # Verify ownership
    result = turso.execute("SELECT seller_id FROM gig_reviews WHERE id = ?", [review_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Review not found")
    
    if result["rows"][0][0] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    turso.execute(
        "UPDATE gig_reviews SET seller_response = ?, seller_responded_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        [sanitize_text(response_data.response), review_id]
    )
    
    return {"message": "Response added"}


# =====================
# SELLER GIG MANAGEMENT
# =====================

@router.get("/seller/my-gigs", response_model=List[dict])
def get_my_gigs(
    filter_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user)
) -> list[dict]:
    """Get current user's gigs (seller)."""
    turso = get_turso_http()
    
    sql = """
    SELECT id, title, slug, thumbnail_url, basic_price, status,
           rating_average, rating_count, orders_completed, orders_in_progress,
           impressions, clicks, created_at
    FROM gigs
    WHERE seller_id = ?
    """
    params = [current_user.id]
    
    if filter_status:
        sql += " AND status = ?"
        params.append(filter_status)
    
    sql += " ORDER BY created_at DESC"
    
    result = turso.execute(sql, params)
    
    gigs = []
    columns = ["id", "title", "slug", "thumbnail_url", "basic_price", "status",
               "rating_average", "rating_count", "orders_completed", "orders_in_progress",
               "impressions", "clicks", "created_at"]
    
    for row in result.get("rows", []):
        gig = {}
        for i, col in enumerate(columns):
            gig[col] = row[i] if i < len(row) else None
        gigs.append(gig)
    
    return gigs
