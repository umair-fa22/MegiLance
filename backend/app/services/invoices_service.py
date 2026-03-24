# @AI-HINT: Invoice CRUD service layer - all database operations for invoice endpoints
import logging
import json
from datetime import datetime, date, timezone
from typing import Optional, List
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, to_str, parse_date, parse_rows


def _row_to_invoice(row) -> dict:
    """Convert Turso row to invoice dict"""
    items = to_str(row[11])
    try:
        items_parsed = json.loads(items) if items else []
    except Exception:
        items_parsed = []

    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "invoice_number": to_str(row[1]),
        "contract_id": int(row[2].get("value")) if row[2].get("type") != "null" else None,
        "from_user_id": int(row[3].get("value")) if row[3].get("type") != "null" else None,
        "to_user_id": int(row[4].get("value")) if row[4].get("type") != "null" else None,
        "subtotal": float(row[5].get("value")) if row[5].get("type") != "null" else 0.0,
        "tax": float(row[6].get("value")) if row[6].get("type") != "null" else 0.0,
        "total": float(row[7].get("value")) if row[7].get("type") != "null" else 0.0,
        "due_date": parse_date(row[8]),
        "status": to_str(row[9]) or "pending",
        "notes": to_str(row[10]),
        "items": items_parsed,
        "payment_id": int(row[12].get("value")) if row[12].get("type") != "null" else None,
        "paid_date": parse_date(row[13]),
        "created_at": parse_date(row[14]),
        "updated_at": parse_date(row[15])
    }


_INVOICE_COLUMNS = """id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
               due_date, status, notes, items, payment_id, paid_date, created_at, updated_at"""


def generate_invoice_number() -> str:
    """Generate unique invoice number in format INV-YYYY-MM-####"""
    now = datetime.now(timezone.utc)
    prefix = f"INV-{now.year}-{now.month:02d}-"

    result = execute_query("""
        SELECT invoice_number FROM invoices 
        WHERE invoice_number LIKE ? 
        ORDER BY invoice_number DESC LIMIT 1
    """, [f"{prefix}%"])

    if result and result.get("rows"):
        last_num_str = to_str(result["rows"][0][0])
        if last_num_str:
            last_num = int(last_num_str.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
    else:
        new_num = 1

    return f"{prefix}{new_num:04d}"


def get_contract_freelancer(contract_id: int) -> Optional[dict]:
    """Get contract and verify it exists, return dict with id and freelancer_id or None."""
    result = execute_query("SELECT id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "freelancer_id": int(row[1].get("value"))
    }


def create_invoice(contract_id: int, from_user_id: int, to_user_id: int,
                   items: list, tax_rate: float, due_date, notes: Optional[str]) -> dict:
    """Create a new invoice and return it."""
    subtotal = sum(item.get('amount', 0) for item in items)
    tax = subtotal * (tax_rate / 100)
    total = subtotal + tax
    items_json = json.dumps(items)

    now = datetime.now(timezone.utc).isoformat()
    due_date_str = due_date.isoformat() if due_date else None
    invoice_number = generate_invoice_number()

    execute_query("""
        INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
                             due_date, status, notes, items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    """, [invoice_number, contract_id, from_user_id, to_user_id,
          subtotal, tax, total, due_date_str, notes, items_json, now, now])

    return get_invoice_by_number(invoice_number)


def get_invoice_by_number(invoice_number: str) -> Optional[dict]:
    """Fetch an invoice by its invoice_number."""
    result = execute_query(f"SELECT {_INVOICE_COLUMNS} FROM invoices WHERE invoice_number = ?", [invoice_number])
    if not result or not result.get("rows"):
        return None
    return _row_to_invoice(result["rows"][0])


def get_invoice_by_id(invoice_id: int) -> Optional[dict]:
    """Fetch an invoice by its ID."""
    result = execute_query(f"SELECT {_INVOICE_COLUMNS} FROM invoices WHERE id = ?", [invoice_id])
    if not result or not result.get("rows"):
        return None
    return _row_to_invoice(result["rows"][0])


def mark_overdue_invoices():
    """Update pending invoices past due date to 'overdue'."""
    today = date.today().isoformat()
    execute_query("""
        UPDATE invoices SET status = 'overdue' 
        WHERE status = 'pending' AND due_date < ?
    """, [today])


def list_invoices(user_id: int, user_role: str, contract_id: Optional[int],
                  status_filter: Optional[str], from_date: Optional[date],
                  to_date: Optional[date], page: int, page_size: int) -> dict:
    """List invoices with filters based on role. Returns dict with invoices, total, page, page_size."""
    mark_overdue_invoices()

    if user_role == "freelancer":
        sql = f"SELECT {_INVOICE_COLUMNS} FROM invoices WHERE from_user_id = ?"
        params: list = [user_id]
    elif user_role == "client":
        sql = f"SELECT {_INVOICE_COLUMNS} FROM invoices WHERE to_user_id = ?"
        params = [user_id]
    else:
        sql = f"SELECT {_INVOICE_COLUMNS} FROM invoices WHERE 1=1"
        params = []

    if contract_id:
        sql += " AND contract_id = ?"
        params.append(contract_id)
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    if from_date:
        sql += " AND created_at >= ?"
        params.append(datetime.combine(from_date, datetime.min.time()).isoformat())
    if to_date:
        sql += " AND created_at <= ?"
        params.append(datetime.combine(to_date, datetime.max.time()).isoformat())

    count_sql = sql.replace(f"SELECT {_INVOICE_COLUMNS}", "SELECT COUNT(*)")
    count_result = execute_query(count_sql, params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(count_result["rows"][0][0].get("value"))

    offset = (page - 1) * page_size
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([page_size, offset])

    result = execute_query(sql, params)
    invoices = []
    if result and result.get("rows"):
        for row in result["rows"]:
            invoices.append(_row_to_invoice(row))

    return {"invoices": invoices, "total": total, "page": page, "page_size": page_size}


def get_invoice_for_payment(invoice_id: int) -> Optional[dict]:
    """Get invoice payment info (id, to_user_id, status)."""
    result = execute_query("SELECT id, to_user_id, status FROM invoices WHERE id = ?", [invoice_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "to_user_id": int(row[1].get("value")),
        "status": to_str(row[2])
    }


def verify_payment_exists(payment_id: int) -> bool:
    """Check if a payment record exists."""
    result = execute_query("SELECT id FROM payments WHERE id = ?", [payment_id])
    return bool(result and result.get("rows"))


def get_invoice_total(invoice_id: int) -> float:
    """Get the total amount of an invoice."""
    result = execute_query("SELECT total FROM invoices WHERE id = ?", [invoice_id])
    if result and result.get("rows"):
        return float(result["rows"][0][0].get("value", 0))
    return 0.0


def create_manual_payment(user_id: int, amount: float, invoice_id: int) -> Optional[int]:
    """Create a manual payment record and return its ID."""
    result = execute_query("""
        INSERT INTO payments (user_id, amount, currency, status, payment_method, description, created_at, updated_at)
        VALUES (?, ?, 'USD', 'completed', 'manual', ?, datetime('now'), datetime('now'))
    """, [user_id, amount, f"Manual payment for invoice #{invoice_id}"])
    if not result:
        return None
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    rows = parse_rows(id_result) if id_result else []
    return int(rows[0]["id"]) if rows else None


def mark_invoice_paid(invoice_id: int, payment_id: Optional[int]):
    """Mark an invoice as paid with the given payment_id."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE invoices SET payment_id = ?, status = 'paid', paid_date = ?, updated_at = ?
        WHERE id = ?
    """, [payment_id, now, now, invoice_id])


def get_invoice_for_update(invoice_id: int) -> Optional[dict]:
    """Get invoice ownership/status info for update validation."""
    result = execute_query("SELECT id, from_user_id, status FROM invoices WHERE id = ?", [invoice_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "from_user_id": int(row[1].get("value")),
        "status": to_str(row[2])
    }


def update_invoice_fields(invoice_id: int, update_dict: dict):
    """Update specified fields on an invoice."""
    update_fields = []
    params = []
    for field, value in update_dict.items():
        if field == "due_date" and value:
            update_fields.append(f"{field} = ?")
            params.append(value.isoformat())
        else:
            update_fields.append(f"{field} = ?")
            params.append(value)

    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(invoice_id)
        execute_query(f"UPDATE invoices SET {', '.join(update_fields)} WHERE id = ?", params)


def delete_invoice(invoice_id: int):
    """Delete an invoice by ID."""
    execute_query("DELETE FROM invoices WHERE id = ?", [invoice_id])
