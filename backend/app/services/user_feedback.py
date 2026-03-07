# @AI-HINT: User feedback system for NPS surveys, feature requests, and satisfaction tracking
"""User Feedback System Service."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from enum import Enum
import logging
import json
import uuid

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class FeedbackType(str, Enum):
    GENERAL = "general"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    IMPROVEMENT = "improvement"
    COMPLAINT = "complaint"
    PRAISE = "praise"
    SUPPORT = "support"


class FeedbackStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    IN_REVIEW = "in_review"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DECLINED = "declined"
    DUPLICATE = "duplicate"


class SurveyType(str, Enum):
    NPS = "nps"  # Net Promoter Score
    CSAT = "csat"  # Customer Satisfaction
    CES = "ces"  # Customer Effort Score
    CUSTOM = "custom"


class FeedbackPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# Pre-defined surveys
SURVEY_TEMPLATES = {
    SurveyType.NPS: {
        "name": "Net Promoter Score",
        "description": "Measure customer loyalty and satisfaction",
        "questions": [
            {
                "id": "nps_score",
                "text": "On a scale of 0-10, how likely are you to recommend MegiLance to a friend or colleague?",
                "type": "scale",
                "min": 0,
                "max": 10
            },
            {
                "id": "nps_reason",
                "text": "What's the primary reason for your score?",
                "type": "text",
                "optional": True
            }
        ]
    },
    SurveyType.CSAT: {
        "name": "Customer Satisfaction",
        "description": "Measure overall satisfaction with a specific interaction",
        "questions": [
            {
                "id": "csat_score",
                "text": "How satisfied are you with your experience?",
                "type": "scale",
                "min": 1,
                "max": 5,
                "labels": ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"]
            },
            {
                "id": "csat_feedback",
                "text": "Any additional comments?",
                "type": "text",
                "optional": True
            }
        ]
    },
    SurveyType.CES: {
        "name": "Customer Effort Score",
        "description": "Measure ease of completing a task",
        "questions": [
            {
                "id": "ces_score",
                "text": "How easy was it to complete your task today?",
                "type": "scale",
                "min": 1,
                "max": 7,
                "labels": ["Very Difficult", "Difficult", "Somewhat Difficult", "Neutral", 
                          "Somewhat Easy", "Easy", "Very Easy"]
            },
            {
                "id": "ces_task",
                "text": "What task were you trying to complete?",
                "type": "text",
                "optional": True
            }
        ]
    }
}


class UserFeedbackService:
    """Service for user feedback management"""
    
    def __init__(self):
        pass
    
    # Feedback Submission
    async def submit_feedback(
        self,
        user_id: int,
        feedback_type: FeedbackType,
        title: str,
        description: str,
        category: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Submit user feedback"""
        fb_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            """INSERT INTO user_feedback (id, user_id, type, title, description, category, status, priority, metadata, votes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)""",
            [fb_id, user_id, feedback_type.value, title, description, category,
             FeedbackStatus.NEW.value, FeedbackPriority.MEDIUM.value,
             json.dumps(metadata or {}), now, now]
        )
        return {"feedback": {
            "id": fb_id, "user_id": user_id, "type": feedback_type.value,
            "title": title, "description": description, "category": category,
            "status": FeedbackStatus.NEW.value, "priority": FeedbackPriority.MEDIUM.value,
            "votes": 0, "created_at": now
        }}
    
    async def get_user_feedback(
        self,
        user_id: int,
        status_filter: Optional[FeedbackStatus] = None,
        type_filter: Optional[FeedbackType] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get user's submitted feedback"""
        sql = "SELECT * FROM user_feedback WHERE user_id = ?"
        params: list = [user_id]
        if status_filter:
            sql += " AND status = ?"
            params.append(status_filter.value)
        if type_filter:
            sql += " AND type = ?"
            params.append(type_filter.value)
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        result = execute_query(sql, params)
        rows = parse_rows(result)
        return {"feedback": rows, "total": len(rows)}
    
    async def get_feedback(self, feedback_id: str) -> Optional[Dict[str, Any]]:
        """Get specific feedback details"""
        result = execute_query("SELECT * FROM user_feedback WHERE id = ?", [feedback_id])
        rows = parse_rows(result)
        if not rows:
            return {"error": "Feedback not found"}
        row = rows[0]
        if row.get("metadata"):
            try:
                row["metadata"] = json.loads(row["metadata"])
            except (json.JSONDecodeError, TypeError):
                pass
        return row
    
    async def update_feedback(
        self,
        feedback_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update feedback (admin)"""
        allowed = {"status", "priority", "admin_response", "category"}
        sets = []
        params = []
        for k, v in updates.items():
            if k in allowed:
                sets.append(f"{k} = ?")
                params.append(v)
        if not sets:
            return {"error": "No valid fields"}
        sets.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(feedback_id)
        execute_query(f"UPDATE user_feedback SET {', '.join(sets)} WHERE id = ?", params)
        return {"message": "Feedback updated", "feedback_id": feedback_id}
    
    # Voting
    async def vote_feedback(
        self,
        user_id: int,
        feedback_id: str,
        vote: int
    ) -> Dict[str, Any]:
        """Vote on feedback (upvote/downvote)"""
        now = datetime.now(timezone.utc).isoformat()
        # Upsert vote
        execute_query(
            "INSERT INTO feedback_votes (feedback_id, user_id, vote, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(feedback_id, user_id) DO UPDATE SET vote = ?",
            [feedback_id, user_id, vote, now, vote]
        )
        # Recalculate total votes
        vr = execute_query("SELECT COALESCE(SUM(vote), 0) as total FROM feedback_votes WHERE feedback_id = ?", [feedback_id])
        vrows = parse_rows(vr)
        total = int(vrows[0].get("total", 0)) if vrows else 0
        execute_query("UPDATE user_feedback SET votes = ? WHERE id = ?", [total, feedback_id])
        return {"message": "Vote recorded", "feedback_id": feedback_id, "vote": vote, "total_votes": total}
    
    async def unvote_feedback(
        self,
        user_id: int,
        feedback_id: str
    ) -> Dict[str, Any]:
        """Remove vote from feedback"""
        execute_query("DELETE FROM feedback_votes WHERE feedback_id = ? AND user_id = ?", [feedback_id, user_id])
        vr = execute_query("SELECT COALESCE(SUM(vote), 0) as total FROM feedback_votes WHERE feedback_id = ?", [feedback_id])
        vrows = parse_rows(vr)
        total = int(vrows[0].get("total", 0)) if vrows else 0
        execute_query("UPDATE user_feedback SET votes = ? WHERE id = ?", [total, feedback_id])
        return {"message": "Vote removed", "feedback_id": feedback_id, "total_votes": total}
    
    # Public Feedback Board
    async def get_public_feedback(
        self,
        status_filter: Optional[FeedbackStatus] = None,
        type_filter: Optional[FeedbackType] = None,
        sort_by: str = "votes",
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get public feedback board"""
        sql = "SELECT id, user_id, type, title, description, category, status, priority, votes, created_at FROM user_feedback WHERE 1=1"
        params: list = []
        if status_filter:
            sql += " AND status = ?"
            params.append(status_filter.value)
        if type_filter:
            sql += " AND type = ?"
            params.append(type_filter.value)
        
        order = {"votes": "votes DESC", "recent": "created_at DESC", "trending": "votes DESC, created_at DESC"}
        sql += f" ORDER BY {order.get(sort_by, 'votes DESC')} LIMIT ?"
        params.append(limit)
        result = execute_query(sql, params)
        rows = parse_rows(result)
        return {"feedback": rows, "total": len(rows), "sort_by": sort_by}
    
    # Feature Requests
    async def submit_feature_request(
        self,
        user_id: int,
        title: str,
        description: str,
        use_case: Optional[str] = None,
        priority_to_user: Optional[str] = None
    ) -> Dict[str, Any]:
        """Submit a feature request"""
        return await self.submit_feedback(
            user_id=user_id,
            feedback_type=FeedbackType.FEATURE_REQUEST,
            title=title,
            description=description,
            metadata={"use_case": use_case, "priority_to_user": priority_to_user}
        )
    
    async def get_feature_roadmap(self) -> Dict[str, Any]:
        """Get public feature roadmap"""
        roadmap = {}
        for status_val in ["planned", "in_progress", "completed", "in_review"]:
            result = execute_query(
                "SELECT id, title, description, votes, created_at FROM user_feedback WHERE type = 'feature_request' AND status = ? ORDER BY votes DESC LIMIT 20",
                [status_val]
            )
            roadmap[status_val] = parse_rows(result)
        return {"roadmap": roadmap}
    
    # Surveys
    async def get_survey_templates(self) -> List[Dict[str, Any]]:
        """Get available survey templates"""
        templates = []
        for survey_type, template in SURVEY_TEMPLATES.items():
            templates.append({"type": survey_type.value, **template})
        return templates
    
    async def get_survey_template(self, survey_type: SurveyType) -> Optional[Dict[str, Any]]:
        """Get specific survey template"""
        template = SURVEY_TEMPLATES.get(survey_type)
        if not template:
            return None
        return {"type": survey_type.value, **template}
    
    async def create_survey(
        self,
        admin_id: int,
        survey_type: SurveyType,
        name: str,
        target_audience: Optional[str] = None,
        questions: Optional[List[Dict[str, Any]]] = None,
        active_days: int = 30
    ) -> Dict[str, Any]:
        """Create a survey (admin)"""
        template = SURVEY_TEMPLATES.get(survey_type, {})
        survey_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        expires_at = (datetime.now(timezone.utc) + timedelta(days=active_days)).isoformat()
        q = questions or template.get("questions", [])
        
        execute_query(
            "INSERT INTO surveys (id, type, name, questions, target_audience, created_by, is_active, response_count, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)",
            [survey_id, survey_type.value, name, json.dumps(q), target_audience, admin_id, now, expires_at]
        )
        return {"survey": {
            "id": survey_id, "type": survey_type.value, "name": name,
            "questions": q, "target_audience": target_audience,
            "created_by": admin_id, "is_active": True,
            "created_at": now, "expires_at": expires_at, "response_count": 0
        }}
    
    async def submit_survey_response(
        self,
        user_id: int,
        survey_id: str,
        responses: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Submit survey response"""
        resp_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            "INSERT INTO survey_responses (id, survey_id, user_id, responses, submitted_at) VALUES (?, ?, ?, ?, ?)",
            [resp_id, survey_id, user_id, json.dumps(responses), now]
        )
        execute_query(
            "UPDATE surveys SET response_count = response_count + 1 WHERE id = ?",
            [survey_id]
        )
        return {"response": {"id": resp_id, "survey_id": survey_id, "user_id": user_id, "submitted_at": now}}
    
    async def get_active_surveys(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get active surveys for user"""
        now = datetime.now(timezone.utc).isoformat()
        result = execute_query(
            "SELECT s.* FROM surveys s WHERE s.is_active = 1 AND (s.expires_at IS NULL OR s.expires_at > ?) AND s.id NOT IN (SELECT survey_id FROM survey_responses WHERE user_id = ?) ORDER BY s.created_at DESC",
            [now, user_id]
        )
        rows = parse_rows(result)
        for row in rows:
            if row.get("questions"):
                try:
                    row["questions"] = json.loads(row["questions"])
                except (json.JSONDecodeError, TypeError):
                    pass
        return {"surveys": rows}
    
    # NPS Tracking
    async def calculate_nps(
        self,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Calculate Net Promoter Score"""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = execute_query(
            "SELECT sr.responses FROM survey_responses sr JOIN surveys s ON sr.survey_id = s.id WHERE s.type = 'nps' AND sr.submitted_at > ?",
            [cutoff]
        )
        rows = parse_rows(result)
        
        scores = []
        for row in rows:
            try:
                resp = json.loads(row.get("responses", "{}")) if isinstance(row.get("responses"), str) else row.get("responses", {})
                if "nps_score" in resp:
                    scores.append(int(resp["nps_score"]))
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
        
        total = len(scores)
        if total == 0:
            return {"nps_score": 0, "promoters_percentage": 0, "passives_percentage": 0, "detractors_percentage": 0, "total_responses": 0, "period_days": period_days}
        
        promoters = sum(1 for s in scores if s >= 9)
        passives = sum(1 for s in scores if 7 <= s <= 8)
        detractors = sum(1 for s in scores if s <= 6)
        
        nps = round((promoters / total - detractors / total) * 100, 1)
        return {
            "nps_score": nps,
            "promoters_percentage": round(promoters / total * 100, 1),
            "passives_percentage": round(passives / total * 100, 1),
            "detractors_percentage": round(detractors / total * 100, 1),
            "total_responses": total,
            "period_days": period_days
        }
    
    async def get_nps_trend(
        self,
        periods: int = 6,
        period_type: str = "month"
    ) -> Dict[str, Any]:
        """Get NPS trend over time"""
        trend = []
        days_per_period = 30 if period_type == "month" else 7
        now = datetime.now(timezone.utc)
        for i in range(periods - 1, -1, -1):
            start = now - timedelta(days=(i + 1) * days_per_period)
            end = now - timedelta(days=i * days_per_period)
            result = execute_query(
                "SELECT sr.responses FROM survey_responses sr JOIN surveys s ON sr.survey_id = s.id WHERE s.type = 'nps' AND sr.submitted_at > ? AND sr.submitted_at <= ?",
                [start.isoformat(), end.isoformat()]
            )
            rows = parse_rows(result)
            scores = []
            for row in rows:
                try:
                    resp = json.loads(row.get("responses", "{}")) if isinstance(row.get("responses"), str) else {}
                    if "nps_score" in resp:
                        scores.append(int(resp["nps_score"]))
                except (json.JSONDecodeError, TypeError, ValueError):
                    pass
            total = len(scores)
            if total > 0:
                p = sum(1 for s in scores if s >= 9)
                d = sum(1 for s in scores if s <= 6)
                nps = round((p / total - d / total) * 100, 1)
            else:
                nps = 0
            trend.append({"period": end.strftime("%Y-%m-%d"), "nps_score": nps, "responses": total})
        return {"trend": trend, "periods": periods, "period_type": period_type}
    
    # CSAT Tracking
    async def calculate_csat(
        self,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Calculate Customer Satisfaction Score"""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = execute_query(
            "SELECT sr.responses FROM survey_responses sr JOIN surveys s ON sr.survey_id = s.id WHERE s.type = 'csat' AND sr.submitted_at > ?",
            [cutoff]
        )
        rows = parse_rows(result)
        scores = []
        for row in rows:
            try:
                resp = json.loads(row.get("responses", "{}")) if isinstance(row.get("responses"), str) else {}
                if "csat_score" in resp:
                    scores.append(int(resp["csat_score"]))
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
        total = len(scores)
        avg = sum(scores) / total if total else 0
        satisfied = sum(1 for s in scores if s >= 4)
        return {
            "csat_score": round(satisfied / total * 100, 1) if total else 0,
            "average_rating": round(avg, 2),
            "total_responses": total,
            "period_days": period_days
        }
    
    # Satisfaction by Feature
    async def get_satisfaction_by_feature(
        self,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get satisfaction breakdown by feature/category"""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = execute_query(
            "SELECT category, AVG(CASE WHEN type = 'praise' THEN 5 WHEN type = 'improvement' THEN 3 WHEN type = 'complaint' THEN 1 ELSE 3 END) as avg_score, COUNT(*) as cnt FROM user_feedback WHERE created_at > ? AND category IS NOT NULL GROUP BY category",
            [cutoff]
        )
        rows = parse_rows(result)
        by_feature = {r["category"]: {"average_score": round(float(r.get("avg_score", 0)), 2), "count": int(r.get("cnt", 0))} for r in rows}
        return {"by_feature": by_feature, "period_days": period_days}
    
    # Admin Analytics
    async def get_feedback_analytics(
        self,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get feedback analytics (admin)"""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        
        total_r = execute_query("SELECT COUNT(*) as cnt FROM user_feedback WHERE created_at > ?", [cutoff])
        total = int(parse_rows(total_r)[0].get("cnt", 0)) if parse_rows(total_r) else 0
        
        type_r = execute_query("SELECT type, COUNT(*) as cnt FROM user_feedback WHERE created_at > ? GROUP BY type", [cutoff])
        by_type = {r["type"]: int(r["cnt"]) for r in parse_rows(type_r)}
        
        status_r = execute_query("SELECT status, COUNT(*) as cnt FROM user_feedback WHERE created_at > ? GROUP BY status", [cutoff])
        by_status = {r["status"]: int(r["cnt"]) for r in parse_rows(status_r)}
        
        completed = int(by_status.get("completed", 0))
        resolution_rate = round(completed / total * 100, 1) if total else 0
        
        return {
            "period_days": period_days,
            "total_feedback": total,
            "by_type": by_type,
            "by_status": by_status,
            "resolution_rate": resolution_rate
        }
    
    async def get_sentiment_analysis(
        self,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get feedback sentiment analysis"""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = execute_query(
            "SELECT type, COUNT(*) as cnt FROM user_feedback WHERE created_at > ? GROUP BY type",
            [cutoff]
        )
        rows = parse_rows(result)
        positive = 0
        negative = 0
        neutral = 0
        for r in rows:
            cnt = int(r.get("cnt", 0))
            if r.get("type") in ("praise",):
                positive += cnt
            elif r.get("type") in ("complaint", "bug_report"):
                negative += cnt
            else:
                neutral += cnt
        total = positive + negative + neutral
        overall = "positive" if positive > negative else ("negative" if negative > positive else "neutral")
        return {
            "overall_sentiment": overall,
            "sentiment_breakdown": {"positive": positive, "neutral": neutral, "negative": negative},
            "total": total
        }
    
    # Quick Feedback (in-app)
    async def submit_quick_feedback(
        self,
        user_id: int,
        page: str,
        rating: int,
        comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """Submit quick in-app feedback"""
        fb_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            "INSERT INTO user_feedback (id, user_id, type, title, description, category, status, priority, metadata, votes, created_at, updated_at) VALUES (?, ?, 'general', ?, ?, ?, 'new', 'low', '{}', 0, ?, ?)",
            [fb_id, user_id, f"Quick feedback: {page}", comment or f"Rating: {rating}/5", page, now, now]
        )
        return {"message": "Quick feedback received", "page": page, "rating": rating, "id": fb_id}


def get_user_feedback_service() -> UserFeedbackService:
    """Get user feedback service instance"""
    return UserFeedbackService()
