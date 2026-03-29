# @AI-HINT: Wallet service layer - all database operations for wallet/balance/transaction endpoints
from datetime import datetime, timezone
from typing import Optional

from app.db.turso_http import execute_query
from app.services.db_utils import get_val as _get_val


def ensure_wallet_tables():
    """Create wallet tables if they don't exist"""
    execute_query("""
        CREATE TABLE IF NOT EXISTS wallet_balances (
            user_id INTEGER PRIMARY KEY,
            available REAL DEFAULT 0,
            pending REAL DEFAULT 0,
            escrow REAL DEFAULT 0,
            currency TEXT DEFAULT 'USD',
            updated_at TEXT
        )
    """)

    execute_query("""
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            status TEXT DEFAULT 'pending',
            description TEXT,
            reference_id TEXT,
            metadata TEXT,
            created_at TEXT,
            completed_at TEXT
        )
    """)

    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id 
        ON wallet_transactions(user_id)
    """)

    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status 
        ON wallet_transactions(status)
    """)

    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_status 
        ON wallet_transactions(user_id, status)
    """)

    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created 
        ON wallet_transactions(created_at DESC)
    """)

    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created 
        ON wallet_transactions(user_id, created_at DESC)
    """)

    execute_query("""
        CREATE TABLE IF NOT EXISTS payout_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            frequency TEXT DEFAULT 'weekly',
            minimum_amount REAL DEFAULT 100,
            destination_type TEXT,
            destination_details TEXT,
            is_active INTEGER DEFAULT 1,
            next_payout_at TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)


def get_or_create_balance(user_id: int) -> dict:
    """Get user's wallet balance, creating entry if needed."""
    result = execute_query(
        "SELECT available, pending, escrow, currency, updated_at FROM wallet_balances WHERE user_id = ?",
        [user_id]
    )

    if result and result.get("rows") and len(result["rows"]) > 0:
        row = result["rows"][0]
        available = float(_get_val(row, 0, 0))
        pending = float(_get_val(row, 1, 0))
        escrow = float(_get_val(row, 2, 0))

        return {
            "available": available,
            "pending": pending,
            "escrow": escrow,
            "total": available + pending + escrow,
            "currency": _get_val(row, 3, "USD"),
            "last_updated": _get_val(row, 4, None)
        }

    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO wallet_balances (user_id, available, pending, escrow, currency, updated_at) VALUES (?, 0, 0, 0, 'USD', ?)",
        [user_id, now]
    )
    return {"available": 0, "pending": 0, "escrow": 0, "total": 0, "currency": "USD", "last_updated": now}


def get_transaction_history(user_id: int, skip: int, limit: int,
                            tx_type: Optional[str], tx_status: Optional[str],
                            from_date: Optional[str], to_date: Optional[str]) -> list:
    """Get wallet transactions with filters."""
    sql = "SELECT id, type, amount, currency, status, description, reference_id, created_at, completed_at FROM wallet_transactions WHERE user_id = ?"
    params: list = [user_id]

    if tx_type:
        sql += " AND type = ?"
        params.append(tx_type)
    if tx_status:
        sql += " AND status = ?"
        params.append(tx_status)
    if from_date:
        sql += " AND created_at >= ?"
        params.append(from_date)
    if to_date:
        sql += " AND created_at <= ?"
        params.append(to_date)

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([int(limit), int(skip)])

    result = execute_query(sql, params)

    transactions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            transactions.append({
                "id": _get_val(row, 0),
                "type": _get_val(row, 1, "unknown"),
                "amount": float(_get_val(row, 2, 0)),
                "currency": _get_val(row, 3, "USD"),
                "status": _get_val(row, 4, "pending"),
                "description": _get_val(row, 5),
                "reference_id": _get_val(row, 6),
                "created_at": _get_val(row, 7, ""),
                "completed_at": _get_val(row, 8)
            })

    return transactions


def deduct_for_withdrawal(user_id: int, amount: float) -> bool:
    """Deduct from available, add to pending for a withdrawal.
    Returns True if deduction succeeded, False if insufficient balance (atomic check)."""
    now = datetime.now(timezone.utc).isoformat()
    result = execute_query(
        "UPDATE wallet_balances SET available = available - ?, pending = pending + ?, updated_at = ? WHERE user_id = ? AND available >= ?",
        [amount, amount, now, user_id, amount]
    )
    # Turso HTTP returns rows_affected for UPDATE statements
    rows_affected = 0
    if isinstance(result, dict):
        rows_affected = result.get("rows_affected", 0)
    elif isinstance(result, int):
        rows_affected = result
    return rows_affected > 0


def create_transaction(user_id: int, tx_type: str, amount: float, currency: str,
                       status: str, description: str, reference_id: str,
                       metadata: str):
    """Insert a wallet transaction record."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO wallet_transactions (user_id, type, amount, currency, status, description, reference_id, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [user_id, tx_type, amount, currency, status, description, reference_id, metadata, now])


def get_wallet_analytics(user_id: int, start_date: str) -> dict:
    """Get income, expenses, and transaction count for analytics."""
    income_result = execute_query("""
        SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
        WHERE user_id = ? AND type IN ('deposit', 'escrow_release', 'milestone_payment', 'bonus')
        AND status = 'completed' AND created_at >= ?
    """, [user_id, start_date])

    total_income = 0
    if income_result and income_result.get("rows"):
        val = income_result["rows"][0][0]
        if isinstance(val, dict):
            total_income = float(val.get("value", 0) or 0)
        else:
            total_income = float(val or 0)

    expense_result = execute_query("""
        SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
        WHERE user_id = ? AND type IN ('withdrawal', 'fee', 'escrow_lock')
        AND status = 'completed' AND created_at >= ?
    """, [user_id, start_date])

    total_expenses = 0
    if expense_result and expense_result.get("rows"):
        val = expense_result["rows"][0][0]
        if isinstance(val, dict):
            total_expenses = float(val.get("value", 0) or 0)
        else:
            total_expenses = float(val or 0)

    count_result = execute_query("""
        SELECT COUNT(*) FROM wallet_transactions 
        WHERE user_id = ? AND created_at >= ?
    """, [user_id, start_date])

    transaction_count = 0
    if count_result and count_result.get("rows"):
        val = count_result["rows"][0][0]
        if isinstance(val, dict):
            transaction_count = int(val.get("value", 0) or 0)
        else:
            transaction_count = int(val or 0)

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "transaction_count": transaction_count
    }


def get_payout_schedule(user_id: int) -> Optional[dict]:
    """Get user's payout schedule, or None if not configured."""
    result = execute_query("""
        SELECT frequency, minimum_amount, destination_type, destination_details, is_active, next_payout_at
        FROM payout_schedules WHERE user_id = ?
    """, [user_id])

    if result and result.get("rows") and len(result["rows"]) > 0:
        row = result["rows"][0]
        return {
            "is_configured": True,
            "frequency": _get_val(row, 0, "weekly"),
            "minimum_amount": float(_get_val(row, 1, 100)),
            "destination_type": _get_val(row, 2),
            "destination_details": _get_val(row, 3),
            "is_active": bool(_get_val(row, 4, 1)),
            "next_payout_at": _get_val(row, 5)
        }

    return None


def upsert_payout_schedule(user_id: int, frequency: str, minimum_amount: float,
                           destination_type: str, destination_details: str,
                           next_payout: str):
    """Insert or update the payout schedule for a user."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO payout_schedules (user_id, frequency, minimum_amount, destination_type, destination_details, is_active, next_payout_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            frequency = excluded.frequency,
            minimum_amount = excluded.minimum_amount,
            destination_type = excluded.destination_type,
            destination_details = excluded.destination_details,
            is_active = 1,
            next_payout_at = excluded.next_payout_at,
            updated_at = excluded.updated_at
    """, [user_id, frequency, minimum_amount, destination_type, destination_details, next_payout, now, now])


def disable_payout_schedule(user_id: int):
    """Disable automatic payouts for a user."""
    execute_query(
        "UPDATE payout_schedules SET is_active = 0, updated_at = ? WHERE user_id = ?",
        [datetime.now(timezone.utc).isoformat(), user_id]
    )


def credit_balance(user_id: int, amount: float) -> bool:
    """Credit the available balance for a user (e.g., after successful deposit).
    Returns True if credit succeeded."""
    now = datetime.now(timezone.utc).isoformat()
    # Ensure wallet exists first
    get_or_create_balance(user_id)
    
    result = execute_query(
        "UPDATE wallet_balances SET available = available + ?, updated_at = ? WHERE user_id = ?",
        [amount, now, user_id]
    )
    rows_affected = 0
    if isinstance(result, dict):
        rows_affected = result.get("rows_affected", 0)
    elif isinstance(result, int):
        rows_affected = result
    return rows_affected > 0


def update_transaction_status(reference_id: str, new_status: str, completed: bool = False):
    """Update a wallet transaction's status by reference_id.
    If completed=True, also sets completed_at timestamp."""
    now = datetime.now(timezone.utc).isoformat()
    if completed:
        execute_query(
            "UPDATE wallet_transactions SET status = ?, completed_at = ? WHERE reference_id = ?",
            [new_status, now, reference_id]
        )
    else:
        execute_query(
            "UPDATE wallet_transactions SET status = ? WHERE reference_id = ?",
            [new_status, reference_id]
        )


def get_transaction_by_reference(reference_id: str) -> Optional[dict]:
    """Get a wallet transaction by its reference_id."""
    result = execute_query(
        "SELECT id, user_id, type, amount, currency, status, description, reference_id, created_at, completed_at FROM wallet_transactions WHERE reference_id = ?",
        [reference_id]
    )
    if result and result.get("rows") and len(result["rows"]) > 0:
        row = result["rows"][0]
        return {
            "id": _get_val(row, 0),
            "user_id": _get_val(row, 1),
            "type": _get_val(row, 2, "unknown"),
            "amount": float(_get_val(row, 3, 0)),
            "currency": _get_val(row, 4, "USD"),
            "status": _get_val(row, 5, "pending"),
            "description": _get_val(row, 6),
            "reference_id": _get_val(row, 7),
            "created_at": _get_val(row, 8, ""),
            "completed_at": _get_val(row, 9)
        }
    return None
