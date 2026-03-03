# @AI-HINT: Content moderation service for safety and compliance
"""Content Moderation Service - AI-powered content safety."""

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
import secrets

logger = logging.getLogger(__name__)


class ModerationContentType(str, Enum):
    """Content types for moderation."""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    PROFILE = "profile"
    PROJECT = "project"
    MESSAGE = "message"
    REVIEW = "review"


class ModerationResult(str, Enum):
    """Moderation result types."""
    APPROVED = "approved"
    FLAGGED = "flagged"
    REJECTED = "rejected"
    PENDING_REVIEW = "pending_review"


class ViolationType(str, Enum):
    """Types of content violations."""
    PROFANITY = "profanity"
    SPAM = "spam"
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    ADULT_CONTENT = "adult_content"
    VIOLENCE = "violence"
    PERSONAL_INFO = "personal_info"
    SCAM = "scam"
    COPYRIGHT = "copyright"
    OTHER = "other"


class ReportStatus(str, Enum):
    """User report status."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


# Profanity word list (simplified)
PROFANITY_WORDS = {
    "badword1", "badword2", "spam", "scam", "fraud"
}

# Spam patterns
SPAM_PATTERNS = [
    r'buy\s+now',
    r'click\s+here',
    r'make\s+money\s+fast',
    r'work\s+from\s+home\s+\$\d+',
    r'(?:https?://)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?(?:\s+){0,2}(?:https?://)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}',  # Multiple links
]

# Personal info patterns
PII_PATTERNS = [
    r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Phone numbers
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Emails (only flag in certain contexts)
    r'\b\d{3}[-]?\d{2}[-]?\d{4}\b',  # SSN
]


class ContentModerationService:
    """
    Content moderation service.
    
    Provides AI-powered content safety checks and reporting.
    Uses Turso DB tables: moderation_logs, moderation_reports, user_reputation, user_violations.
    """

    def __init__(self, db: Session):
        self.db = db

    def _turso(self):
        from app.db.turso_http import get_turso_http
        return get_turso_http()
    
    async def moderate_text(
        self,
        text: str,
        content_type: ModerationContentType,
        user_id: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze text content for violations.
        
        Args:
            text: Text to analyze
            content_type: Type of content
            user_id: Author user ID
            context: Additional context
            
        Returns:
            Moderation result
        """
        violations = []
        risk_score = 0.0
        
        # Check profanity
        profanity_found = self._check_profanity(text)
        if profanity_found:
            violations.append({
                "type": ViolationType.PROFANITY.value,
                "severity": "medium",
                "details": f"Found {len(profanity_found)} profane words"
            })
            risk_score += 30.0
        
        # Check spam patterns
        spam_matches = self._check_spam(text)
        if spam_matches:
            violations.append({
                "type": ViolationType.SPAM.value,
                "severity": "high",
                "details": "Content matches spam patterns"
            })
            risk_score += 50.0
        
        # Check for PII
        pii_found = self._check_pii(text, content_type)
        if pii_found:
            violations.append({
                "type": ViolationType.PERSONAL_INFO.value,
                "severity": "medium",
                "details": "Contains personal information"
            })
            risk_score += 20.0
        
        # Check for scam indicators
        if self._check_scam_indicators(text):
            violations.append({
                "type": ViolationType.SCAM.value,
                "severity": "high",
                "details": "Contains potential scam indicators"
            })
            risk_score += 60.0
        
        # Determine result
        if risk_score >= 70:
            result = ModerationResult.REJECTED
        elif risk_score >= 40:
            result = ModerationResult.PENDING_REVIEW
        elif risk_score >= 20:
            result = ModerationResult.FLAGGED
        else:
            result = ModerationResult.APPROVED
        
        # Log moderation to DB
        import json as _json
        log_id = f"mod_{secrets.token_urlsafe(8)}"
        now = datetime.now(timezone.utc).isoformat()
        self._turso().execute(
            """INSERT INTO moderation_logs (id, content_type, user_id, result, risk_score, violations, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [log_id, content_type.value, user_id, result.value, risk_score, _json.dumps(violations), now]
        )
        
        # Track user violations
        if user_id and violations:
            await self._track_user_violation(user_id, violations, risk_score)
        
        return {
            "result": result.value,
            "risk_score": risk_score,
            "violations": violations,
            "requires_review": result in [ModerationResult.PENDING_REVIEW, ModerationResult.FLAGGED],
            "action_taken": self._get_action_message(result)
        }
    
    async def report_content(
        self,
        reporter_id: int,
        reported_user_id: int,
        content_type: ModerationContentType,
        content_id: str,
        violation_type: ViolationType,
        description: str
    ) -> Dict[str, Any]:
        """Submit a user report."""
        report_id = f"report_{secrets.token_urlsafe(12)}"
        now = datetime.now(timezone.utc).isoformat()

        self._turso().execute(
            """INSERT INTO moderation_reports
               (id, reporter_id, reported_user_id, content_type, content_id,
                violation_type, description, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [report_id, reporter_id, reported_user_id, content_type.value,
             content_id, violation_type.value, description, ReportStatus.PENDING.value, now]
        )

        report = {
            "id": report_id, "reporter_id": reporter_id,
            "reported_user_id": reported_user_id,
            "content_type": content_type.value, "content_id": content_id,
            "violation_type": violation_type.value, "description": description,
            "status": ReportStatus.PENDING.value, "created_at": now,
            "resolved_at": None, "resolution": None, "moderator_notes": None
        }
        logger.info(f"Content report submitted: {report_id}")
        return report
    
    async def get_report(
        self,
        report_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get report details."""
        row = self._turso().fetch_one(
            """SELECT id, reporter_id, reported_user_id, content_type, content_id,
                      violation_type, description, status, resolution, moderator_notes,
                      created_at, resolved_at
               FROM moderation_reports WHERE id = ?""", [report_id]
        )
        if not row:
            return None
        cols = ["id", "reporter_id", "reported_user_id", "content_type", "content_id",
                "violation_type", "description", "status", "resolution", "moderator_notes",
                "created_at", "resolved_at"]
        return dict(zip(cols, row))
    
    async def list_reports(
        self,
        status: Optional[ReportStatus] = None,
        user_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List reports with filters."""
        sql = ("SELECT id, reporter_id, reported_user_id, content_type, content_id, "
               "violation_type, description, status, resolution, moderator_notes, "
               "created_at, resolved_at FROM moderation_reports WHERE 1=1")
        params: list = []
        if status:
            sql += " AND status = ?"
            params.append(status.value)
        if user_id:
            sql += " AND reported_user_id = ?"
            params.append(user_id)
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        result = self._turso().execute(sql, params)
        cols = ["id", "reporter_id", "reported_user_id", "content_type", "content_id",
                "violation_type", "description", "status", "resolution", "moderator_notes",
                "created_at", "resolved_at"]
        return [dict(zip(cols, row)) for row in result.get("rows", [])]
    
    async def resolve_report(
        self,
        report_id: str,
        resolution: str,
        moderator_notes: Optional[str] = None,
        take_action: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Resolve a report."""
        report = await self.get_report(report_id)
        if not report:
            return None

        now = datetime.now(timezone.utc).isoformat()
        self._turso().execute(
            """UPDATE moderation_reports
               SET status = ?, resolved_at = ?, resolution = ?, moderator_notes = ?
               WHERE id = ?""",
            [ReportStatus.RESOLVED.value, now, resolution, moderator_notes, report_id]
        )
        report["status"] = ReportStatus.RESOLVED.value
        report["resolved_at"] = now
        report["resolution"] = resolution
        report["moderator_notes"] = moderator_notes

        if take_action:
            await self._apply_penalty(report["reported_user_id"], report["violation_type"])

        return report
    
    async def get_user_reputation(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's reputation score."""
        row = self._turso().fetch_one(
            "SELECT reputation_score, is_blocked, blocked_until FROM user_reputation WHERE user_id = ?",
            [user_id]
        )
        if row:
            reputation = float(row[0]) if row[0] is not None else 100.0
            is_blocked = bool(row[1])
            blocked_until = row[2]
        else:
            reputation = 100.0
            is_blocked = False
            blocked_until = None

        # Auto-unblock if block expired
        if is_blocked and blocked_until:
            try:
                block_dt = datetime.fromisoformat(blocked_until)
                if datetime.now(timezone.utc) > block_dt:
                    self._turso().execute(
                        "UPDATE user_reputation SET is_blocked = 0, blocked_until = NULL, updated_at = ? WHERE user_id = ?",
                        [datetime.now(timezone.utc).isoformat(), user_id]
                    )
                    is_blocked = False
            except (ValueError, TypeError):
                pass

        # Get recent violations
        viol_result = self._turso().execute(
            "SELECT violation_type, severity, details, created_at FROM user_violations WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
            [user_id]
        )
        recent = [{"type": r[0], "severity": r[1], "details": r[2], "timestamp": r[3]} for r in viol_result.get("rows", [])]
        total_row = self._turso().fetch_one(
            "SELECT COUNT(*) FROM user_violations WHERE user_id = ?", [user_id]
        )

        if reputation >= 90:
            trust_level = "excellent"
        elif reputation >= 70:
            trust_level = "good"
        elif reputation >= 50:
            trust_level = "fair"
        elif reputation >= 30:
            trust_level = "poor"
        else:
            trust_level = "untrusted"

        return {
            "user_id": user_id,
            "reputation_score": reputation,
            "trust_level": trust_level,
            "total_violations": int(total_row[0]) if total_row else 0,
            "recent_violations": recent,
            "is_blocked": is_blocked
        }
    
    async def is_user_blocked(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Check if user is blocked."""
        row = self._turso().fetch_one(
            "SELECT is_blocked, blocked_until FROM user_reputation WHERE user_id = ?", [user_id]
        )
        if not row or not row[0]:
            return {"blocked": False}

        blocked_until = row[1]
        if not blocked_until:
            return {"blocked": True, "blocked_until": None, "remaining_seconds": 0}

        try:
            block_dt = datetime.fromisoformat(blocked_until)
        except (ValueError, TypeError):
            return {"blocked": True, "blocked_until": blocked_until, "remaining_seconds": 0}

        now = datetime.now(timezone.utc)
        if now > block_dt:
            self._turso().execute(
                "UPDATE user_reputation SET is_blocked = 0, blocked_until = NULL, updated_at = ? WHERE user_id = ?",
                [now.isoformat(), user_id]
            )
            return {"blocked": False}

        return {
            "blocked": True,
            "blocked_until": block_dt.isoformat(),
            "remaining_seconds": int((block_dt - now).total_seconds())
        }
    
    async def get_moderation_stats(self) -> Dict[str, Any]:
        """Get moderation statistics."""
        turso = self._turso()
        total_row = turso.fetch_one("SELECT COUNT(*) FROM moderation_logs", [])
        total = int(total_row[0]) if total_row else 0

        result_rows = turso.execute(
            "SELECT result, COUNT(*) FROM moderation_logs GROUP BY result", []
        )
        by_result = {r[0]: r[1] for r in result_rows.get("rows", [])}

        # Count violations from user_violations table
        viol_rows = turso.execute(
            "SELECT violation_type, COUNT(*) FROM user_violations GROUP BY violation_type", []
        )
        by_violation = {r[0]: r[1] for r in viol_rows.get("rows", [])}

        pending_row = turso.fetch_one(
            "SELECT COUNT(*) FROM moderation_reports WHERE status = ?", [ReportStatus.PENDING.value]
        )
        total_reports_row = turso.fetch_one("SELECT COUNT(*) FROM moderation_reports", [])
        blocked_row = turso.fetch_one(
            "SELECT COUNT(*) FROM user_reputation WHERE is_blocked = 1", []
        )

        return {
            "total_moderations": total,
            "by_result": by_result,
            "by_violation_type": by_violation,
            "pending_reports": int(pending_row[0]) if pending_row else 0,
            "total_reports": int(total_reports_row[0]) if total_reports_row else 0,
            "blocked_users": int(blocked_row[0]) if blocked_row else 0
        }
    
    def _check_profanity(self, text: str) -> List[str]:
        """Check text for profanity."""
        words = text.lower().split()
        found = []
        
        for word in words:
            # Remove punctuation
            clean_word = re.sub(r'[^\w]', '', word)
            if clean_word in PROFANITY_WORDS:
                found.append(clean_word)
        
        return found
    
    def _check_spam(self, text: str) -> List[str]:
        """Check text for spam patterns."""
        matches = []
        text_lower = text.lower()
        
        for pattern in SPAM_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                matches.append(pattern)
        
        return matches
    
    def _check_pii(
        self,
        text: str,
        content_type: ModerationContentType
    ) -> List[str]:
        """Check for personal information."""
        # Only flag PII in public contexts
        if content_type not in [ModerationContentType.PROJECT, ModerationContentType.PROFILE, ModerationContentType.REVIEW]:
            return []
        
        found = []
        for pattern in PII_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                found.extend(matches)
        
        return found
    
    def _check_scam_indicators(self, text: str) -> bool:
        """Check for scam indicators."""
        scam_phrases = [
            "send money",
            "wire transfer",
            "western union",
            "gift card",
            "advance payment",
            "pay upfront",
            "too good to be true",
            "guaranteed income",
            "work from home $",
            "make money fast"
        ]
        
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in scam_phrases)
    
    async def _track_user_violation(
        self,
        user_id: int,
        violations: List[Dict[str, Any]],
        risk_score: float
    ) -> None:
        """Track user violations and update reputation."""
        turso = self._turso()
        now = datetime.now(timezone.utc).isoformat()

        for violation in violations:
            turso.execute(
                """INSERT INTO user_violations (user_id, violation_type, severity, details, risk_score, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                [user_id, violation.get("type", "other"), violation.get("severity", "medium"),
                 violation.get("details", ""), risk_score, now]
            )

        # Ensure user_reputation row exists, then reduce reputation
        row = turso.fetch_one("SELECT reputation_score FROM user_reputation WHERE user_id = ?", [user_id])
        if row:
            current = float(row[0]) if row[0] is not None else 100.0
            new_rep = max(0, current - risk_score / 10.0)
            turso.execute(
                "UPDATE user_reputation SET reputation_score = ?, updated_at = ? WHERE user_id = ?",
                [new_rep, now, user_id]
            )
        else:
            new_rep = max(0, 100.0 - risk_score / 10.0)
            turso.execute(
                "INSERT INTO user_reputation (user_id, reputation_score, updated_at) VALUES (?, ?, ?)",
                [user_id, new_rep, now]
            )

        # Auto-block if reputation drops below 20
        if new_rep < 20:
            block_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            turso.execute(
                "UPDATE user_reputation SET is_blocked = 1, blocked_until = ?, updated_at = ? WHERE user_id = ?",
                [block_until, now, user_id]
            )
            logger.warning(f"User {user_id} auto-blocked due to low reputation")
    
    async def _apply_penalty(
        self,
        user_id: int,
        violation_type: str
    ) -> None:
        """Apply penalty to user."""
        penalties = {
            ViolationType.PROFANITY.value: 10,
            ViolationType.SPAM.value: 20,
            ViolationType.HARASSMENT.value: 30,
            ViolationType.HATE_SPEECH.value: 40,
            ViolationType.SCAM.value: 50,
            ViolationType.ADULT_CONTENT.value: 25,
        }
        penalty = penalties.get(violation_type, 15)
        turso = self._turso()
        now = datetime.now(timezone.utc).isoformat()

        row = turso.fetch_one("SELECT reputation_score FROM user_reputation WHERE user_id = ?", [user_id])
        if row:
            new_rep = max(0, float(row[0] or 100.0) - penalty)
            turso.execute(
                "UPDATE user_reputation SET reputation_score = ?, updated_at = ? WHERE user_id = ?",
                [new_rep, now, user_id]
            )
        else:
            new_rep = max(0, 100.0 - penalty)
            turso.execute(
                "INSERT INTO user_reputation (user_id, reputation_score, updated_at) VALUES (?, ?, ?)",
                [user_id, new_rep, now]
            )

        # Block if 5+ violations in last 30 days
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        recent_row = turso.fetch_one(
            "SELECT COUNT(*) FROM user_violations WHERE user_id = ? AND created_at > ?",
            [user_id, cutoff]
        )
        recent_count = int(recent_row[0]) if recent_row else 0

        if recent_count >= 5:
            block_until = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            turso.execute(
                "UPDATE user_reputation SET is_blocked = 1, blocked_until = ?, updated_at = ? WHERE user_id = ?",
                [block_until, now, user_id]
            )
    
    def _get_action_message(self, result: ModerationResult) -> str:
        """Get action message for result."""
        messages = {
            ModerationResult.APPROVED: "Content approved",
            ModerationResult.FLAGGED: "Content flagged for potential issues",
            ModerationResult.REJECTED: "Content rejected - violates community guidelines",
            ModerationResult.PENDING_REVIEW: "Content held for manual review"
        }
        return messages.get(result, "Unknown")


# Singleton instance
_moderation_service: Optional[ContentModerationService] = None


def get_moderation_service(db: Session) -> ContentModerationService:
    """Get or create moderation service instance."""
    global _moderation_service
    if _moderation_service is None:
        _moderation_service = ContentModerationService(db)
    else:
        _moderation_service.db = db
    return _moderation_service
