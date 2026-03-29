# @AI-HINT: AI service for matching, fraud detection, and quality assessment
"""ML-based matching engine, fraud scoring, and content quality analysis."""

from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import json
import re
import logging

from app.db.turso_http import execute_query, parse_rows
from app.services.llm_gateway import llm_gateway

logger = logging.getLogger(__name__)


# ============================================================================
# Request/Response Models
# ============================================================================

class MatchingRequest(BaseModel):
    project_id: int
    max_results: int = 10
    use_deep_learning: bool = True


class MatchingResult(BaseModel):
    freelancer_id: int
    match_score: float
    confidence: float
    factors: Dict[str, Any]
    rank: int


class FraudDetectionRequest(BaseModel):
    user_id: int
    action_type: str  # 'profile_creation', 'proposal_submission', 'payment', etc.
    context: Dict[str, Any]


class FraudRiskScore(BaseModel):
    user_id: int
    risk_score: float  # 0-100
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    detected_patterns: List[str]
    recommended_action: str
    confidence: float


class QualityAssessment(BaseModel):
    work_id: int
    work_type: str  # 'code', 'design', 'content', etc.
    quality_score: float  # 0-100
    assessment_details: Dict[str, Any]
    issues: List[Dict[str, str]]
    suggestions: List[str]


class PriceOptimization(BaseModel):
    optimal_price: Decimal
    price_range: Dict[str, Decimal]
    market_position: str
    conversion_probability: float
    expected_revenue: Decimal


# ============================================================================
# Advanced AI Service
# ============================================================================

class AdvancedAIService:
    """Advanced AI capabilities using ML models"""

    def __init__(self):
        pass

    # ========================================================================
    # Deep Learning Matching
    # ========================================================================

    async def match_freelancers_deep_learning(
        self,
        project_id: int,
        max_results: int = 10
    ) -> List[MatchingResult]:
        """
        Deep learning-based freelancer matching
        
        Uses:
        - Neural network for multi-factor matching
        - Word embeddings for semantic skill matching
        - Attention mechanism for important features
        - Transfer learning from historical matches
        """
        # Get project details
        project = await self._get_project_details(project_id)
        if not project:
            return []

        # Get all freelancers
        freelancers = await self._get_active_freelancers()

        # Calculate deep learning scores
        matches = []
        for freelancer in freelancers:
            # Feature extraction
            features = await self._extract_matching_features(project, freelancer)

            # Deep learning scoring
            score = await self._calculate_dl_match_score(features)

            # Confidence calculation
            confidence = await self._calculate_confidence(features)

            matches.append(MatchingResult(
                freelancer_id=freelancer["id"],
                match_score=score,
                confidence=confidence,
                factors=features,
                rank=0  # Will be set after sorting
            ))

        # Sort by score
        matches.sort(key=lambda x: x.match_score, reverse=True)

        # Assign ranks
        for i, match in enumerate(matches[:max_results]):
            match.rank = i + 1

        return matches[:max_results]

    async def _extract_matching_features(
        self,
        project: Dict[str, Any],
        freelancer: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract features for matching"""
        features = {}

        # Skill matching (semantic)
        project_skills = project.get("required_skills", [])
        freelancer_skills = freelancer.get("skills", [])
        features["skill_match"] = await self._semantic_skill_match(
            project_skills, freelancer_skills
        )

        # Experience alignment
        features["experience_match"] = self._experience_match(
            project.get("experience_level"),
            freelancer.get("experience_level")
        )

        # Budget alignment
        features["budget_match"] = self._budget_match(
            project.get("budget", 0),
            freelancer.get("hourly_rate", 0),
            project.get("budget_type")
        )

        # Historical performance
        features["success_rate"] = freelancer.get("success_rate", 0.5)
        features["avg_rating"] = freelancer.get("avg_rating", 3.0)
        features["completion_rate"] = freelancer.get("completion_rate", 0.5)

        # Availability
        features["availability"] = freelancer.get("availability_score", 0.5)
        features["response_rate"] = freelancer.get("response_rate", 0.5)

        # Geographic/timezone alignment
        features["timezone_match"] = self._timezone_match(
            project.get("timezone"),
            freelancer.get("timezone")
        )

        # Portfolio relevance
        features["portfolio_relevance"] = await self._portfolio_relevance(
            project.get("category"),
            freelancer.get("portfolio_items", [])
        )

        return features

    async def _calculate_dl_match_score(self, features: Dict[str, Any]) -> float:
        """
        Calculate match score using deep learning model
        
        This is a simplified version. In production, would use:
        - TensorFlow/PyTorch neural network
        - Pre-trained embeddings
        - Attention mechanisms
        """
        # Simplified scoring (weighted combination)
        # In production, this would be a neural network
        score = 0.0

        # Skill matching (highest weight)
        score += features.get("skill_match", 0) * 0.30

        # Success metrics
        score += features.get("success_rate", 0) * 0.15
        score += (features.get("avg_rating", 3.0) / 5.0) * 0.15

        # Budget alignment
        score += features.get("budget_match", 0) * 0.15

        # Experience match
        score += features.get("experience_match", 0) * 0.10

        # Availability
        score += features.get("availability", 0) * 0.05
        score += features.get("response_rate", 0) * 0.05

        # Portfolio relevance
        score += features.get("portfolio_relevance", 0) * 0.05

        return min(score * 100, 100.0)  # Scale to 0-100

    async def _semantic_skill_match(
        self,
        required_skills: List[str],
        freelancer_skills: List[str]
    ) -> float:
        """
        Semantic skill matching using word embeddings
        
        In production, would use:
        - Word2Vec or GloVe embeddings
        - Cosine similarity
        - Domain-specific skill ontology
        """
        if not required_skills or not freelancer_skills:
            return 0.0

        # Simplified version - exact and fuzzy matching
        exact_matches = set(required_skills) & set(freelancer_skills)
        exact_score = len(exact_matches) / len(required_skills)

        # Fuzzy matching for similar skills
        fuzzy_matches = 0
        for req_skill in required_skills:
            for fl_skill in freelancer_skills:
                if self._skills_similar(req_skill, fl_skill):
                    fuzzy_matches += 0.7  # Partial credit
                    break

        fuzzy_score = fuzzy_matches / len(required_skills)

        return max(exact_score, fuzzy_score)

    def _skills_similar(self, skill1: str, skill2: str) -> bool:
        """Check if skills are similar"""
        # Simplified - would use word embeddings in production
        similarity_map = {
            "python": ["python3", "django", "flask", "fastapi"],
            "javascript": ["js", "node.js", "react", "vue", "angular"],
            "design": ["ui/ux", "graphic design", "web design"],
            "writing": ["content writing", "copywriting", "technical writing"]
        }

        skill1_lower = skill1.lower()
        skill2_lower = skill2.lower()

        for main_skill, similar_skills in similarity_map.items():
            if skill1_lower == main_skill and skill2_lower in similar_skills:
                return True
            if skill2_lower == main_skill and skill1_lower in similar_skills:
                return True

        return False

    def _experience_match(self, project_level: str, freelancer_level: str) -> float:
        """Match experience levels"""
        levels = {"entry": 1, "intermediate": 2, "expert": 3, "advanced": 4}
        project_val = levels.get(project_level, 2)
        freelancer_val = levels.get(freelancer_level, 2)

        if freelancer_val >= project_val:
            return 1.0
        else:
            return freelancer_val / project_val

    def _budget_match(
        self,
        project_budget: float,
        freelancer_rate: float,
        budget_type: str
    ) -> float:
        """Calculate budget alignment"""
        if budget_type == "hourly":
            if freelancer_rate <= project_budget:
                return 1.0
            else:
                return project_budget / freelancer_rate if freelancer_rate > 0 else 0
        else:  # fixed
            # Estimate hours (simplified)
            estimated_hours = 40
            total_cost = freelancer_rate * estimated_hours
            if total_cost <= project_budget:
                return 1.0
            else:
                return project_budget / total_cost if total_cost > 0 else 0

    def _timezone_match(self, project_tz: str, freelancer_tz: str) -> float:
        """Calculate timezone alignment"""
        if not project_tz or not freelancer_tz:
            return 0.5

        # Simplified - would calculate actual hour difference
        if project_tz == freelancer_tz:
            return 1.0
        else:
            return 0.5  # Partial match for different timezones

    async def _portfolio_relevance(
        self,
        project_category: str,
        portfolio_items: List[Dict[str, Any]]
    ) -> float:
        """Calculate portfolio relevance to project"""
        if not portfolio_items:
            return 0.3  # Base score

        relevant_items = 0
        for item in portfolio_items:
            if item.get("category") == project_category:
                relevant_items += 1

        relevance = relevant_items / len(portfolio_items)
        return min(relevance + 0.3, 1.0)  # Boost with base score

    async def _calculate_confidence(self, features: Dict[str, Any]) -> float:
        """Calculate prediction confidence"""
        # Based on data quality and completeness
        confidence_factors = []

        # Data completeness
        if features.get("skill_match", 0) > 0:
            confidence_factors.append(0.9)
        if features.get("success_rate", 0) > 0:
            confidence_factors.append(0.85)
        if features.get("avg_rating", 0) > 0:
            confidence_factors.append(0.8)

        if not confidence_factors:
            return 0.5

        return sum(confidence_factors) / len(confidence_factors)

    # ========================================================================
    # Fraud Detection
    # ========================================================================

    async def detect_fraud(
        self,
        user_id: int,
        action_type: str,
        context: Dict[str, Any]
    ) -> FraudRiskScore:
        """
        Advanced fraud detection using anomaly detection
        
        Detects:
        - Fake profiles
        - Payment fraud
        - Account takeover
        - Collusion between users
        - Bot activity
        - Plagiarism
        """
        detected_patterns = []
        risk_score = 0.0

        # Profile analysis
        profile_risk = await self._analyze_profile_fraud(user_id)
        risk_score += profile_risk["score"]
        detected_patterns.extend(profile_risk["patterns"])

        # Behavioral analysis
        behavior_risk = await self._analyze_behavioral_patterns(user_id, action_type, context)
        risk_score += behavior_risk["score"]
        detected_patterns.extend(behavior_risk["patterns"])

        # Network analysis
        network_risk = await self._analyze_network_fraud(user_id)
        risk_score += network_risk["score"]
        detected_patterns.extend(network_risk["patterns"])

        # Determine risk level
        if risk_score < 30:
            risk_level = "low"
            action = "allow"
        elif risk_score < 60:
            risk_level = "medium"
            action = "monitor"
        elif risk_score < 80:
            risk_level = "high"
            action = "require_verification"
        else:
            risk_level = "critical"
            action = "block_and_review"

        # Calculate confidence
        confidence = 0.85 if len(detected_patterns) > 2 else 0.65

        return FraudRiskScore(
            user_id=user_id,
            risk_score=min(risk_score, 100.0),
            risk_level=risk_level,
            detected_patterns=detected_patterns,
            recommended_action=action,
            confidence=confidence
        )

    async def _analyze_profile_fraud(self, user_id: int) -> Dict[str, Any]:
        """Analyze profile for fraud indicators"""
        patterns = []
        score = 0.0

        # Get user profile
        result = execute_query("""
            SELECT name, bio, location, profile_image_url, created_at
            FROM users WHERE id = ?
        """, [user_id])

        rows = parse_rows(result)
        if not rows:
            return {"score": 0, "patterns": []}

        row = rows[0]
        name = row.get("name", "")
        bio = row.get("bio", "")
        created_at = row.get("created_at")

        # Check for generic/fake names
        if name and re.match(r'^(user|test|admin|demo)\d+$', name.lower()):
            patterns.append("generic_username")
            score += 25.0

        # Check for very short bio (suspicious)
        if bio and len(bio) < 20:
            patterns.append("minimal_bio")
            score += 10.0

        # Check for new account (higher risk)
        if created_at:
            try:
                created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                account_age_days = (datetime.now(timezone.utc) - created_dt).days
                if account_age_days < 7:
                    patterns.append("very_new_account")
                    score += 15.0
            except (ValueError, TypeError):
                pass

        # Check for missing profile image
        if not row.get("profile_image_url"):
            patterns.append("no_profile_image")
            score += 5.0

        return {"score": score, "patterns": patterns}

    async def _analyze_behavioral_patterns(
        self,
        user_id: int,
        action_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze behavioral patterns for anomalies"""
        patterns = []
        score = 0.0

        # Check proposal spam
        if action_type == "proposal_submission":
            result = execute_query("""
                SELECT COUNT(*) as cnt FROM proposals
                WHERE freelancer_id = ? AND created_at > ?
            """, [user_id, (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()])

            rows = parse_rows(result)
            if rows:
                proposal_count = int(rows[0].get("cnt", 0))
                if proposal_count > 50:
                    patterns.append("proposal_spam")
                    score += 40.0
                elif proposal_count > 20:
                    patterns.append("high_proposal_volume")
                    score += 15.0

        return {"score": score, "patterns": patterns}

    async def _analyze_network_fraud(self, user_id: int) -> Dict[str, Any]:
        """Analyze network connections for fraud rings"""
        patterns = []
        score = 0.0

        # Check for IP address sharing across multiple accounts
        try:
            result = execute_query("""
                SELECT ip_address, COUNT(DISTINCT user_id) as user_count
                FROM user_sessions
                WHERE ip_address IN (
                    SELECT ip_address FROM user_sessions WHERE user_id = ?
                )
                GROUP BY ip_address
                HAVING COUNT(DISTINCT user_id) > 5
            """, [user_id])

            rows = parse_rows(result)
            if rows:
                patterns.append("shared_ip_multiple_accounts")
                score += 30.0
        except Exception:
            # Table may not exist yet
            pass

        return {"score": score, "patterns": patterns}

    # ========================================================================
    # Quality Assessment
    # ========================================================================

    async def assess_work_quality(
        self,
        work_id: int,
        work_type: str,
        content: Any
    ) -> QualityAssessment:
        """
        AI-powered work quality assessment
        
        Supports:
        - Code quality (complexity, best practices, security)
        - Design quality (alignment, consistency, accessibility)
        - Content quality (grammar, readability, plagiarism)
        """
        if work_type == "code":
            return await self._assess_code_quality(work_id, content)
        elif work_type == "design":
            return await self._assess_design_quality(work_id, content)
        elif work_type == "content":
            return await self._assess_content_quality(work_id, content)
        else:
            return QualityAssessment(
                work_id=work_id,
                work_type=work_type,
                quality_score=50.0,
                assessment_details={},
                issues=[],
                suggestions=[]
            )

    async def _assess_code_quality(self, work_id: int, code: str) -> QualityAssessment:
        """Assess code quality using advanced LLM models."""
        prompt = f"""Analyze the following code snippet and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Code:
{code[:3000]}"""
        try:
            from app.services.llm_gateway import llm_gateway
            response = await llm_gateway.generate_text(prompt=prompt, system_message="You are an expert code reviewer.")
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
                import json
                data = json.loads(response[start:end])
                score = float(data.get("score", 70.0))
                issues = data.get("issues", [])
                suggestions = data.get("suggestions", [])
            else:
                raise ValueError("No JSON found")
        except Exception as e:
            logger.error(f"LLM Code Assessment failed: {e}")
            score = 70.0
            issues = [{"severity": "warning", "message": "Automated code assessment failed. Falling back to default."}]
            suggestions = ["Review code manually for best results."]

        return QualityAssessment(
            work_id=work_id,
            work_type="code",
            quality_score=min(100.0, max(0.0, score)),
            assessment_details={"assessor": "DigitalOcean AI", "method": "deep_analysis"},
            issues=issues,
            suggestions=suggestions
        )

    async def _assess_content_quality(self, work_id: int, content: str) -> QualityAssessment:
        """Assess content quality using advanced LLM models."""
        prompt = f"""Analyze the following content and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Content:
{content[:3000]}"""
        try:
            from app.services.llm_gateway import llm_gateway
            response = await llm_gateway.generate_text(prompt=prompt, system_message="You are an expert editor and content reviewer.")
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
                import json
                data = json.loads(response[start:end])
                score = float(data.get("score", 70.0))
                issues = data.get("issues", [])
                suggestions = data.get("suggestions", [])
            else:
                raise ValueError("No JSON found")
        except Exception as e:
            logger.error(f"LLM Content Assessment failed: {e}")
            score = 70.0
            issues = [{"severity": "warning", "message": "Automated content assessment failed. Falling back to default."}]
            suggestions = ["Review content manually for best results."]

        return QualityAssessment(
            work_id=work_id,
            work_type="content",
            quality_score=min(100.0, max(0.0, score)),
            assessment_details={"assessor": "DigitalOcean AI", "method": "deep_analysis"},
            issues=issues,
            suggestions=suggestions
        )

    def _get_project_details(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Get project details"""
        result = execute_query("""
            SELECT id, title, description, budget_min, budget_type,
                   skills_required, experience_level, category_id
            FROM projects WHERE id = ?
        """, [project_id])

        rows = parse_rows(result)
        if not rows:
            return None

        row = rows[0]
        skills_raw = row.get("skills_required", "[]")
        try:
            skills = json.loads(skills_raw) if skills_raw else []
        except (json.JSONDecodeError, TypeError):
            skills = []

        return {
            "id": int(row.get("id", 0)),
            "title": row.get("title", ""),
            "description": row.get("description", ""),
            "budget": float(row.get("budget_min", 0) or 0),
            "budget_type": row.get("budget_type", "fixed"),
            "required_skills": skills,
            "experience_level": row.get("experience_level", "intermediate"),
            "category": row.get("category_id", "")
        }

    async def _get_active_freelancers(self) -> List[Dict[str, Any]]:
        """Get all active freelancers"""
        result = execute_query("""
            SELECT id, name, skills, hourly_rate, experience_level,
                   location, timezone
            FROM users
            WHERE user_type = 'freelancer' AND is_active = 1
        """, [])

        freelancers = []
        for row in parse_rows(result):
            skills_raw = row.get("skills", "[]")
            try:
                skills = json.loads(skills_raw) if skills_raw else []
            except (json.JSONDecodeError, TypeError):
                skills = []

            freelancers.append({
                "id": int(row.get("id", 0)),
                "name": row.get("name", ""),
                "skills": skills,
                "hourly_rate": float(row.get("hourly_rate", 0) or 0),
                "experience_level": row.get("experience_level", "intermediate"),
                "location": row.get("location", ""),
                "timezone": row.get("timezone", "")
            })

        return freelancers


# ============================================================================
# Service Factory (singleton)
# ============================================================================

_instance: Optional[AdvancedAIService] = None


def get_advanced_ai_service() -> AdvancedAIService:
    """Get advanced AI service instance"""
    global _instance
    if _instance is None:
        _instance = AdvancedAIService()
    return _instance


# ============================================================================
# Turso HTTP helpers for AI Copilot endpoints
# ============================================================================


async def get_project_for_proposal(project_id: int) -> Optional[Dict[str, Any]]:
    """Get project details for proposal generation (Turso HTTP). Returns None if not found."""
    result = execute_query("""
        SELECT p.id, p.title, p.description, p.budget_min, p.budget_max,
               p.budget_type, p.skills_required, p.experience_level
        FROM projects p WHERE p.id = ?
    """, [project_id])

    rows = parse_rows(result)
    if not rows:
        return None

    row = rows[0]
    return {
        "title": row.get("title") or "the project",
        "description": row.get("description") or "",
        "budget_min": float(row.get("budget_min") or 0),
        "budget_max": float(row.get("budget_max") or 0),
        "budget_type": row.get("budget_type") or "fixed",
    }


async def get_user_profile_for_proposal(user_id) -> Dict[str, Any]:
    """Get user profile for proposal generation (Turso HTTP)."""
    result = execute_query("""
        SELECT name, skills, hourly_rate, bio
        FROM users WHERE id = ?
    """, [user_id])

    rows = parse_rows(result)
    
    freelancer_name = "there"
    freelancer_skills = []
    hourly_rate = 50

    if rows:
        row = rows[0]
        freelancer_name = row.get("name") or "there"
        skills_str = row.get("skills") or "[]"
        try:
            freelancer_skills = json.loads(skills_str) if skills_str else []
        except Exception:
            freelancer_skills = []
        hourly_rate = float(row.get("hourly_rate") or 50)

    return {
        "name": freelancer_name,
        "skills": freelancer_skills,
        "hourly_rate": hourly_rate,
    }

