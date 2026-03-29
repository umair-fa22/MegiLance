"""
@AI-HINT: Payment tracking endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
Includes tiered platform fees, detailed breakdowns, and comprehensive earning analytics
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate
from app.db.turso_http import get_turso_http
from app.services.db_utils import sanitize_text, paginate_params
from app.services.stripe_service import StripeService
import logging

logger = logging.getLogger("megilance")

router = APIRouter()

# Validation constants
ALLOWED_PAYMENT_STATUSES = {"pending", "processing", "completed", "failed", "refunded", "cancelled"}
ALLOWED_CURRENCIES = {"USD", "USDT", "ETH", "BTC", "GBP", "EUR", "PKR"}
ALLOWED_PAYMENT_TYPES = {"milestone", "full", "hourly", "escrow", "refund", "bonus"}
ALLOWED_DIRECTIONS = {"incoming", "outgoing"}
MAX_AMOUNT = Decimal("1000000")  # 1 million max per transaction
MIN_AMOUNT = Decimal("0.01")

# Tiered platform fee structure (like Upwork's sliding scale)
# First $500 lifetime billing with a client: 20%
# $500.01-$10,000 lifetime billing: 10%
# Over $10,000 lifetime billing: 5%
PLATFORM_FEE_TIERS = [
    {"threshold": Decimal("500"), "rate": Decimal("0.20")},
    {"threshold": Decimal("10000"), "rate": Decimal("0.10")},
    {"threshold": Decimal("Infinity"), "rate": Decimal("0.05")},
]


def calculate_tiered_fee(amount: float, lifetime_billing: float = 0) -> dict:
    """Calculate platform fee using tiered structure based on lifetime billing with client."""
    amount_d = Decimal(str(amount))
    lifetime_d = Decimal(str(lifetime_billing))

    # Determine applicable tier based on lifetime billing
    fee_rate = PLATFORM_FEE_TIERS[-1]["rate"]
    for tier in PLATFORM_FEE_TIERS:
        if lifetime_d < tier["threshold"]:
            fee_rate = tier["rate"]
            break

    platform_fee = round(float(amount_d * fee_rate), 2)
    freelancer_amount = round(float(amount_d - Decimal(str(platform_fee))), 2)

    return {
        "amount": round(float(amount_d), 2),
        "platform_fee": platform_fee,
        "fee_percentage": round(float(fee_rate * 100), 1),
        "freelancer_amount": freelancer_amount,
        "tier": f"{round(float(fee_rate * 100))}% tier",
        "lifetime_billing": round(float(lifetime_d), 2),
    }


def validate_amount(amount: float) -> Decimal:
    """Validate and convert payment amount."""
    try:
        decimal_amount = Decimal(str(amount))
        if decimal_amount < MIN_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount must be at least {MIN_AMOUNT}"
            )
        if decimal_amount > MAX_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount cannot exceed {MAX_AMOUNT}"
            )
        return decimal_amount
    except InvalidOperation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount format"
        )


def _row_to_payment(row: list, columns: list = None) -> dict:
    """Convert database row to payment dict using column names"""
    if columns is None:
        columns = ["id", "contract_id", "from_user_id", "to_user_id", "amount", 
                   "currency", "status", "payment_type", "tx_hash", "escrow_address",
                   "description", "created_at", "updated_at", "completed_at"]
    
    # Build dict from column names
    raw = {}
    for i, col in enumerate(columns):
        raw[col] = row[i] if i < len(row) else None
    
    payment = {}
    for col in columns:
        val = raw.get(col)
        if col == "amount" and val is not None:
            payment[col] = round(float(val), 2)
        elif col == "tx_hash":
            payment["transaction_hash"] = val
            payment[col] = val
        else:
            payment[col] = val
            
    # Ensure required fields for Pydantic model
    if "currency" not in payment or payment["currency"] is None:
        payment["currency"] = "USD"
        
    return payment


@router.get("/", response_model=List[PaymentRead])
def list_payments(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    contract_id: Optional[str] = Query(None, max_length=50, description="Filter by contract"),
    payment_status: Optional[str] = Query(None, alias="status", description="Filter by payment status"),
    direction: Optional[str] = Query(None, description="incoming or outgoing"),
    current_user: User = Depends(get_current_active_user)
) -> list[dict]:
    """List payments for the authenticated user with optional filters."""
    offset, limit = paginate_params(page, page_size)
    # Validate filter values
    if payment_status and payment_status.lower() not in ALLOWED_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(ALLOWED_PAYMENT_STATUSES)}"
        )
    if direction and direction.lower() not in ALLOWED_DIRECTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid direction. Allowed: {', '.join(ALLOWED_DIRECTIONS)}"
        )
    
    try:
        turso = get_turso_http()
        
        # Updated query to match actual schema
        # Schema has: blockchain_tx_hash, processed_at
        # Missing: currency, escrow_address
        sql = """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                        'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                        description, created_at, updated_at, processed_at as completed_at 
                 FROM payments WHERE 1=1"""
        params = []
        
        # Restrict payments to user unless admin
        if current_user.role != "admin" and current_user.user_type != "admin":
            if direction == "incoming":
                sql += " AND to_user_id = ?"
                params.append(current_user.id)
            elif direction == "outgoing":
                sql += " AND from_user_id = ?"
                params.append(current_user.id)
            else:
                sql += " AND (from_user_id = ? OR to_user_id = ?)"
                params.extend([current_user.id, current_user.id])
        
        if contract_id:
            sql += " AND contract_id = ?"
            params.append(contract_id)
        if payment_status:
            sql += " AND status = ?"
            params.append(payment_status.lower())
        
        sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        result = turso.execute(sql, params)
        columns = result.get("columns", [])
        payments = [_row_to_payment(row, columns) for row in result.get("rows", [])]
        return payments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("list_payments failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Get a specific payment by ID."""
    try:
        turso = get_turso_http()
        
        result = turso.execute(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        payment = _row_to_payment(rows[0], result.get("columns", []))
        
        # Check access
        if current_user.role != "admin":
            if payment["from_user_id"] != current_user.id and payment["to_user_id"] != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


def validate_payment_input(payment: PaymentCreate) -> None:
    """Validate payment creation input."""
    # Validate amount
    validate_amount(payment.amount)
    
    # Validate currency
    currency = (payment.currency or "USD").upper()
    if currency not in ALLOWED_CURRENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid currency. Allowed: {', '.join(ALLOWED_CURRENCIES)}"
        )
    
    # Validate payment type
    payment_type = (payment.payment_type or "milestone").lower()
    if payment_type not in ALLOWED_PAYMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment type. Allowed: {', '.join(ALLOWED_PAYMENT_TYPES)}"
        )
    
    # Validate description length
    if payment.description and len(payment.description) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot exceed 1000 characters"
        )


@router.post("/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: PaymentCreate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Create a new payment record."""
    # Validate input
    validate_payment_input(payment)
    
    # Prevent self-payment
    if payment.to_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send payment to yourself"
        )
    
    try:
        turso = get_turso_http()
        
        # Verify recipient exists
        recipient = turso.fetch_one(
            "SELECT id, is_active FROM users WHERE id = ?",
            [payment.to_user_id]
        )
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient user not found"
            )
        if not recipient[1]:  # is_active
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recipient account is not active"
            )
        
        now = datetime.now(timezone.utc).isoformat()
        payment_type = (payment.payment_type or "milestone").lower()
        description = sanitize_text(payment.description, 1000) if payment.description else ""
        
        # Calculate tiered platform fee based on lifetime billing between users
        lifetime_result = turso.fetch_one(
            """SELECT COALESCE(SUM(amount), 0) FROM payments
               WHERE from_user_id = ? AND to_user_id = ? AND status = 'completed'""",
            [current_user.id, payment.to_user_id]
        )
        lifetime_billing = float(lifetime_result[0]) if lifetime_result else 0
        fee_info = calculate_tiered_fee(payment.amount, lifetime_billing)
        platform_fee = fee_info["platform_fee"]
        freelancer_amount = fee_info["freelancer_amount"]
        
        # Insert and get ID atomically
        results = turso.execute_many([
            {
                "q": """INSERT INTO payments (contract_id, from_user_id, to_user_id, amount,
                                     payment_type, payment_method, status, description,
                                     platform_fee, freelancer_amount,
                                     created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                "params": [payment.contract_id, current_user.id, payment.to_user_id, payment.amount,
             payment_type, "crypto", "pending", description, 
             platform_fee, freelancer_amount,
             now, now]
            },
            {
                "q": "SELECT last_insert_rowid() as id",
                "params": []
            }
        ])
        
        # Get the new payment ID from the batch result
        new_id = None
        if len(results) >= 2:
            id_rows = results[1].get("rows", [])
            if id_rows:
                new_id = id_rows[0][0]
                if isinstance(new_id, dict):
                    new_id = new_id.get("value")
        
        if not new_id:
            raise HTTPException(status_code=500, detail="Failed to create payment")
        
        # Fetch the created payment by its actual ID
        result = turso.execute(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [int(new_id)]
        )
        columns = result.get("columns", [])
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=500, detail="Payment created but not found")
        
        # Integrate Stripe service to generate payment intent securely
        payment_dict = _row_to_payment(rows[0], columns)
        
        try:
            stripe_service = StripeService()
            stripe_pi = stripe_service.create_payment_intent(
                amount=payment.amount,
                currency=payment.currency,
                metadata={
                    "payment_id": str(new_id),
                    "from_user_id": str(current_user.id),
                    "to_user_id": str(payment.to_user_id)
                }
            )
            payment_dict["stripe_payment_id"] = stripe_pi.id
            payment_dict["stripe_client_secret"] = stripe_pi.client_secret
        except Exception as e:
            logger.error(f"Failed to generate stripe payment intent for {new_id}: {e}")
            payment_dict["stripe_payment_id"] = None
            payment_dict["stripe_client_secret"] = None

        return payment_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("create_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(
    payment_id: int,
    payment_update: PaymentUpdate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Update a payment (admin or payment creator only)."""
    try:
        turso = get_turso_http()
        
        # Check payment exists
        existing = turso.fetch_one(
            "SELECT from_user_id, status FROM payments WHERE id = ?",
            [payment_id]
        )
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        # Check authorization
        if current_user.role != "admin" and existing[0] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # Prevent modification of completed/refunded payments
        current_status = existing[1] if len(existing) > 1 else None
        if current_status in ("completed", "refunded"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify a {current_status} payment"
            )
        
        # Build update
        updates = []
        params = []
        update_data = payment_update.dict(exclude_unset=True)
        
        ALLOWED_PAYMENT_COLUMNS = frozenset({
            'payment_type', 'description', 'amount', 'transaction_hash',
        })
        
        for key, value in update_data.items():
            if key not in ALLOWED_PAYMENT_COLUMNS:
                continue
            # Validate status
            if key == "status" and value:
                if value.lower() not in ALLOWED_PAYMENT_STATUSES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status. Allowed: {', '.join(ALLOWED_PAYMENT_STATUSES)}"
                    )
                value = value.lower()
            # Validate payment_type
            if key == "payment_type" and value:
                if value.lower() not in ALLOWED_PAYMENT_TYPES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid payment type. Allowed: {', '.join(ALLOWED_PAYMENT_TYPES)}"
                    )
                value = value.lower()
            # Validate description length
            if key == "description" and value:
                value = sanitize_text(value, 1000)
            # Validate amount
            if key == "amount" and value is not None:
                validate_amount(value)
            
            # Map keys to DB columns
            if key == "transaction_hash":
                updates.append("blockchain_tx_hash = ?")
                params.append(sanitize_text(value, 200) if value else value)
            else:
                updates.append(f"{key} = ?")
                params.append(value)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(payment_id)
            
            turso.execute(f"UPDATE payments SET {', '.join(updates)} WHERE id = ?", params)
        
        # Return updated payment
        result = turso.execute(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found after update")
        return _row_to_payment(rows[0], result.get("columns", []))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.post("/{payment_id}/complete", response_model=PaymentRead)
def complete_payment(
    payment_id: int,
    tx_hash: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Mark a payment as completed (admin only — prevents self-completion fraud)."""
    try:
        turso = get_turso_http()
        
        existing = turso.fetch_one("SELECT from_user_id, to_user_id, status FROM payments WHERE id = ?", [payment_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        # Only admin can mark payments complete to prevent fraud
        if current_user.role != "admin" and current_user.user_type != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can mark payments as completed"
            )
        
        # Validate current status allows completion
        current_status = existing[2] if len(existing) > 2 else None
        if current_status not in ("pending", "processing"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete a payment with status '{current_status}'"
            )
        
        now = datetime.now(timezone.utc).isoformat()
        turso.execute(
            "UPDATE payments SET status = ?, processed_at = ?, blockchain_tx_hash = ?, updated_at = ? WHERE id = ?",
            ["completed", now, tx_hash, now, payment_id]
        )
        
        result = turso.execute(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found after completion")
        return _row_to_payment(rows[0], result.get("columns", []))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("complete_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/stats/summary")
def get_payment_stats(
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Get payment statistics for the current user."""
    try:
        turso = get_turso_http()
        
        # Get totals
        incoming = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
            [current_user.id]
        )
        outgoing = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'completed'",
            [current_user.id]
        )
        pending = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE (from_user_id = ? OR to_user_id = ?) AND status = 'pending'",
            [current_user.id, current_user.id]
        )
        
        return {
            "total_received": round(float(incoming[0]), 2) if incoming else 0,
            "total_sent": round(float(outgoing[0]), 2) if outgoing else 0,
            "pending_amount": round(float(pending[0]), 2) if pending else 0
        }
        
    except Exception as e:
        logger.error("get_payment_stats failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/stats/earnings")
def get_earnings_dashboard(
    period: str = Query("month", pattern=r'^(week|month|quarter|year|all)$'),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    Comprehensive earnings dashboard for freelancers / spending dashboard for clients.
    Shows period breakdown, trends, top clients/freelancers, and fee summary.
    """
    try:
        turso = get_turso_http()
        now = datetime.now(timezone.utc)

        # Calculate period start
        period_map = {
            "week": now - timedelta(days=7),
            "month": now - timedelta(days=30),
            "quarter": now - timedelta(days=90),
            "year": now - timedelta(days=365),
            "all": datetime(2020, 1, 1, tzinfo=timezone.utc),
        }
        period_start = period_map[period].isoformat()

        user_type = getattr(current_user, "user_type", "") or ""
        is_freelancer = user_type.lower() == "freelancer"

        if is_freelancer:
            direction_col = "to_user_id"
            partner_col = "from_user_id"
        else:
            direction_col = "from_user_id"
            partner_col = "to_user_id"

        # Period earnings/spending
        period_total = turso.fetch_one(
            f"""SELECT COALESCE(SUM(amount), 0), COUNT(*)
                FROM payments WHERE {direction_col} = ? AND status = 'completed'
                AND created_at >= ?""",
            [current_user.id, period_start]
        )
        period_amount = round(float(period_total[0]), 2) if period_total else 0
        period_count = int(period_total[1]) if period_total else 0

        # Platform fees paid in period
        fees_paid = turso.fetch_one(
            f"""SELECT COALESCE(SUM(platform_fee), 0)
                FROM payments WHERE {direction_col} = ? AND status = 'completed'
                AND created_at >= ?""",
            [current_user.id, period_start]
        )
        total_fees = round(float(fees_paid[0]), 2) if fees_paid else 0

        # All-time totals
        all_time = turso.fetch_one(
            f"""SELECT COALESCE(SUM(amount), 0), COUNT(*)
                FROM payments WHERE {direction_col} = ? AND status = 'completed'""",
            [current_user.id]
        )
        all_time_amount = round(float(all_time[0]), 2) if all_time else 0
        all_time_count = int(all_time[1]) if all_time else 0

        # Average per transaction
        avg_per_tx = round(period_amount / period_count, 2) if period_count > 0 else 0

        # Top partners (clients for freelancer / freelancers for client)
        top_result = turso.execute(
            f"""SELECT u.id, u.name, u.first_name, u.last_name,
                       COALESCE(SUM(p.amount), 0) as total,
                       COUNT(p.id) as tx_count
                FROM payments p
                JOIN users u ON p.{partner_col} = u.id
                WHERE p.{direction_col} = ? AND p.status = 'completed'
                AND p.created_at >= ?
                GROUP BY u.id
                ORDER BY total DESC
                LIMIT 5""",
            [current_user.id, period_start]
        )
        top_partners = []
        for row in top_result.get("rows", []):
            name = row[1] or ""
            if not name and (row[2] or row[3]):
                name = f"{row[2] or ''} {row[3] or ''}".strip()
            top_partners.append({
                "user_id": row[0],
                "name": name,
                "total_amount": round(float(row[4]), 2),
                "transaction_count": int(row[5]),
            })

        # Monthly trend (last 6 months)
        six_months_ago = (now - timedelta(days=180)).isoformat()
        trend_result = turso.execute(
            f"""SELECT strftime('%Y-%m', created_at) as month,
                       COALESCE(SUM(amount), 0) as total,
                       COUNT(*) as count
                FROM payments
                WHERE {direction_col} = ? AND status = 'completed'
                AND created_at >= ?
                GROUP BY month
                ORDER BY month ASC""",
            [current_user.id, six_months_ago]
        )
        monthly_trend = []
        for row in trend_result.get("rows", []):
            monthly_trend.append({
                "month": row[0],
                "amount": round(float(row[1]), 2),
                "count": int(row[2]),
            })

        # Pending payments
        pending_result = turso.fetch_one(
            f"""SELECT COALESCE(SUM(amount), 0), COUNT(*)
                FROM payments WHERE {direction_col} = ? AND status IN ('pending', 'processing')""",
            [current_user.id]
        )
        pending_amount = round(float(pending_result[0]), 2) if pending_result else 0
        pending_count = int(pending_result[1]) if pending_result else 0

        label = "earnings" if is_freelancer else "spending"
        return {
            "user_id": current_user.id,
            "period": period,
            "type": label,
            f"period_{label}": period_amount,
            "period_transactions": period_count,
            f"period_average_{label}": avg_per_tx,
            "period_fees_paid": total_fees,
            f"all_time_{label}": all_time_amount,
            "all_time_transactions": all_time_count,
            "pending_amount": pending_amount,
            "pending_count": pending_count,
            f"top_{'clients' if is_freelancer else 'freelancers'}": top_partners,
            "monthly_trend": monthly_trend,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_earnings_dashboard failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/fee-calculator")
def calculate_fee(
    amount: float = Query(..., gt=0, le=1000000, description="Payment amount"),
    to_user_id: Optional[int] = Query(None, description="Recipient user ID for tier calculation"),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    Calculate platform fees for a given amount.
    Uses tiered fee structure based on lifetime billing between the two users.
    """
    try:
        lifetime_billing = 0
        if to_user_id:
            turso = get_turso_http()
            result = turso.fetch_one(
                """SELECT COALESCE(SUM(amount), 0) FROM payments
                   WHERE from_user_id = ? AND to_user_id = ? AND status = 'completed'""",
                [current_user.id, to_user_id]
            )
            lifetime_billing = float(result[0]) if result else 0

        fee_info = calculate_tiered_fee(amount, lifetime_billing)
        fee_info["tiers"] = [
            {"range": "$0 - $500", "rate": "20%"},
            {"range": "$500.01 - $10,000", "rate": "10%"},
            {"range": "Over $10,000", "rate": "5%"},
        ]
        return fee_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error("calculate_fee failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
