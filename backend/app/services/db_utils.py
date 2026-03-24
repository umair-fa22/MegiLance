# @AI-HINT: Shared database utility functions for Turso HTTP row parsing
"""Shared utility functions for Turso HTTP database operations."""

import logging
import re
from typing import Any, Optional
from decimal import Decimal, ROUND_HALF_UP
logger = logging.getLogger(__name__)

# XSS/injection pattern for text sanitization
SCRIPT_PATTERN = re.compile(r'(javascript:|on\w+=|<script)', re.IGNORECASE)


def get_val(row: list, idx: int, default: Any = None) -> Any:
    """Extract value from a Turso HTTP result row by index.
    
    Turso rows are lists of dicts like {"type": "text", "value": "..."}
    """
    if idx >= len(row):
        return default
    cell = row[idx]
    if isinstance(cell, dict):
        if cell.get("type") == "null":
            return default
        return cell.get("value", default)
    return cell if cell is not None else default


def safe_str(val: Any) -> Optional[str]:
    """Convert a value to string, handling bytes and None."""
    if val is None:
        return None
    if isinstance(val, bytes):
        return val.decode('utf-8')
    return str(val) if val else None


def safe_int(val: Any, default: int = 0) -> int:
    """Convert a value to int safely."""
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def safe_float(val: Any, default: float = 0.0) -> float:
    """Convert a value to float safely."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_decimal(val: Any, default: str = "0.00") -> Decimal:
    """Convert a value to Decimal for financial precision.
    
    Always returns Decimal with 2 decimal places for monetary values.
    """
    if val is None:
        return Decimal(default)
    try:
        return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return Decimal(default)


def safe_bool(val: Any, default: bool = False) -> bool:
    """Convert a value to bool safely."""
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    if isinstance(val, str):
        return val.lower() in ('true', '1', 'yes')
    return default


def sanitize_text(content: str) -> str:
    """Sanitize text content by removing potential XSS vectors.
    
    Strips javascript: URIs, inline event handlers, and script tags.
    """
    if not content:
        return content
    return SCRIPT_PATTERN.sub('', content).strip()


def sanitize_html(content: str) -> str:
    """More aggressive HTML sanitization - strips all HTML tags."""
    if not content:
        return content
    content = SCRIPT_PATTERN.sub('', content)
    content = re.sub(r'<[^>]+>', '', content)
    return content.strip()


def paginate_params(page: int = 1, page_size: int = 20, max_page_size: int = 100) -> tuple[int, int]:
    """Normalize pagination parameters and return (offset, limit).
    
    Ensures page >= 1 and page_size is within bounds.
    """
    page = max(1, page)
    page_size = max(1, min(page_size, max_page_size))
    offset = (page - 1) * page_size
    return offset, page_size


def get_user_role(user: Any) -> str:
    """Extract normalized user role from a user object.
    
    Handles both ORM objects and UserProxy dicts that may have
    'role', 'user_type', or both attributes.
    """
    role = getattr(user, 'role', None) or getattr(user, 'user_type', 'client')
    if hasattr(role, 'value'):
        role = role.value
    return str(role).lower()
