# @AI-HINT: Shared utilities for API route handlers — deduplication of common patterns
import logging
import re
from typing import Optional
logger = logging.getLogger(__name__)


# === Text Sanitization ===

SCRIPT_PATTERN = re.compile(r'(javascript:|on\w+=|<script)', re.IGNORECASE)
HTML_PATTERN = re.compile(r'<[^>]+>', re.IGNORECASE)


def sanitize_text(text: Optional[str], max_length: int = 1000) -> Optional[str]:
    """Sanitize text input to prevent XSS and limit length"""
    if text is None:
        return None
    text = text.strip()
    if len(text) > max_length:
        text = text[:max_length]
    text = SCRIPT_PATTERN.sub('', text)
    return text


def safe_str(val) -> Optional[str]:
    """Convert bytes/any to string safely"""
    if val is None:
        return None
    if isinstance(val, bytes):
        return val.decode('utf-8')
    return str(val) if val else None


# === Role Extraction ===

def get_user_role(user) -> Optional[str]:
    """Extract user role consistently from user object"""
    role = getattr(user, 'role', None)
    if role:
        return role
    user_type = getattr(user, 'user_type', None)
    return user_type


def is_admin(user) -> bool:
    """Check if user has admin role"""
    role = get_user_role(user)
    return role is not None and role.lower() == "admin"


# === Content Moderation ===

# Basic profanity/spam patterns (extend as needed)
_SPAM_PATTERNS = re.compile(
    r'(buy\s+cheap|earn\s+\$?\d+|click\s+here|free\s+money|nigerian?\s+prince|'
    r'make\s+money\s+fast|100%\s+free|act\s+now|limited\s+time\s+offer)',
    re.IGNORECASE
)

_CONTACT_SPAM_PATTERNS = re.compile(
    r'(whatsapp|telegram|signal)\s*[:\-]?\s*\+?\d{7,}',
    re.IGNORECASE
)


def moderate_content(text: Optional[str]) -> tuple[bool, Optional[str]]:
    """Check text for spam/prohibited content.
    Returns (is_ok, reason) — if is_ok is False, reason explains why.
    """
    if not text:
        return True, None
    if _SPAM_PATTERNS.search(text):
        return False, "Content contains prohibited spam patterns"
    if _CONTACT_SPAM_PATTERNS.search(text):
        return False, "Content contains off-platform contact solicitation"
    return True, None
