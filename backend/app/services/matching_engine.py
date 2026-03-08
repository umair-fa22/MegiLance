# @AI-HINT: AI-powered matching engine with skill graphs, synonym resolution, and multi-factor intelligent scoring
"""
AI-Powered Matching Engine v2.0
Intelligent matching using skill graphs, synonym resolution, behavioral signals,
historical success data, and multi-factor scoring with configurable weights.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
from app.db.turso_http import execute_query, parse_rows
from datetime import datetime, timedelta
import json
import logging
import math
from collections import defaultdict

logger = logging.getLogger(__name__)

# ============================================================================
# Skill Synonym Graph — resolves equivalent skill names
# ============================================================================

SKILL_SYNONYMS: Dict[str, Set[str]] = {
    "react": {"reactjs", "react.js", "react js"},
    "vue": {"vuejs", "vue.js", "vue js"},
    "angular": {"angularjs", "angular.js"},
    "node": {"nodejs", "node.js", "node js"},
    "express": {"expressjs", "express.js"},
    "next": {"nextjs", "next.js", "next js"},
    "nuxt": {"nuxtjs", "nuxt.js"},
    "typescript": {"ts"},
    "javascript": {"js", "ecmascript", "es6"},
    "python": {"python3", "py"},
    "csharp": {"c#", "c sharp"},
    "cpp": {"c++", "cplusplus"},
    "golang": {"go"},
    "postgresql": {"postgres", "psql"},
    "mongodb": {"mongo"},
    "mysql": {"mariadb"},
    "graphql": {"gql"},
    "rest": {"restful", "rest api", "restful api"},
    "aws": {"amazon web services", "amazon aws"},
    "gcp": {"google cloud", "google cloud platform"},
    "azure": {"microsoft azure"},
    "docker": {"containerization"},
    "kubernetes": {"k8s"},
    "ci/cd": {"cicd", "ci cd", "continuous integration"},
    "machine learning": {"ml"},
    "artificial intelligence": {"ai"},
    "deep learning": {"dl"},
    "natural language processing": {"nlp"},
    "html": {"html5"},
    "css": {"css3", "cascading style sheets"},
    "sass": {"scss"},
    "tailwind": {"tailwindcss", "tailwind css"},
    "bootstrap": {"bootstrap5"},
    "figma": {"figma design"},
    "photoshop": {"adobe photoshop", "ps"},
    "illustrator": {"adobe illustrator", "ai design"},
    "ui/ux": {"ui ux", "ux/ui", "ux ui", "user experience", "user interface"},
    "seo": {"search engine optimization"},
    "ppc": {"pay per click"},
    "google ads": {"adwords", "google adwords"},
    "facebook ads": {"meta ads"},
    "wordpress": {"wp"},
    "shopify": {"shopify development"},
    "flutter": {"flutter development"},
    "react native": {"rn", "react-native"},
    "swift": {"swiftui"},
    "kotlin": {"kotlin android"},
    "sql": {"structured query language"},
    "nosql": {"no sql"},
    "redis": {"redis cache"},
    "elasticsearch": {"elastic", "es"},
    "terraform": {"iac", "infrastructure as code"},
}

# Build reverse lookup: synonym -> canonical name
_SYNONYM_LOOKUP: Dict[str, str] = {}
for canonical, synonyms in SKILL_SYNONYMS.items():
    _SYNONYM_LOOKUP[canonical] = canonical
    for syn in synonyms:
        _SYNONYM_LOOKUP[syn] = canonical

# ============================================================================
# Skill Category Graph — skills that are related (partial credit)
# ============================================================================

SKILL_CATEGORIES: Dict[str, Set[str]] = {
    "frontend": {"react", "vue", "angular", "next", "nuxt", "html", "css", "sass", "tailwind", "bootstrap", "javascript", "typescript", "svelte"},
    "backend": {"node", "express", "python", "django", "flask", "fastapi", "golang", "java", "spring", "csharp", "ruby", "rails", "php", "laravel"},
    "mobile": {"react native", "flutter", "swift", "kotlin", "ios", "android"},
    "database": {"postgresql", "mysql", "mongodb", "redis", "sqlite", "sql", "nosql", "elasticsearch"},
    "devops": {"docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd", "linux", "nginx"},
    "ai_ml": {"machine learning", "deep learning", "natural language processing", "tensorflow", "pytorch", "scikit-learn", "data science"},
    "design": {"figma", "photoshop", "illustrator", "ui/ux", "sketch", "adobe xd", "graphic design"},
    "marketing": {"seo", "ppc", "google ads", "facebook ads", "content marketing", "email marketing", "social media"},
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill name to its canonical form."""
    lower = skill.strip().lower()
    return _SYNONYM_LOOKUP.get(lower, lower)


def get_skill_category(skill: str) -> Optional[str]:
    """Find which category a skill belongs to."""
    norm = normalize_skill(skill)
    for cat, skills in SKILL_CATEGORIES.items():
        if norm in skills:
            return cat
    return None


class MatchingEngine:
    """AI-powered matching engine for project-freelancer recommendations"""
    
    def __init__(self):
        self._ensure_matching_tables()
    
    def _ensure_matching_tables(self):
        """Create matching-related tables if they don't exist"""
        try:
            execute_query("""
                CREATE TABLE IF NOT EXISTS skill_embeddings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_name VARCHAR(100) NOT NULL UNIQUE,
                    embedding_vector TEXT NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            execute_query("""
                CREATE TABLE IF NOT EXISTS match_scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    freelancer_id INTEGER NOT NULL,
                    score FLOAT NOT NULL,
                    factors TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(project_id) REFERENCES projects(id),
                    FOREIGN KEY(freelancer_id) REFERENCES users(id),
                    UNIQUE(project_id, freelancer_id)
                )
            """)
            
            execute_query("""
                CREATE TABLE IF NOT EXISTS recommendation_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_type VARCHAR(20) NOT NULL,
                    item_id INTEGER NOT NULL,
                    score FLOAT NOT NULL,
                    shown_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    clicked BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """)
        except Exception as e:
            logger.error("Failed to create matching tables: %s", e)
    
    def calculate_skill_match_score(self, project_skills: List[str], freelancer_skills: List[str]) -> Dict[str, Any]:
        """
        Advanced skill matching with synonym resolution and category-based partial credit.
        Returns detailed match info with score 0.0-1.0.
        """
        if not project_skills or not freelancer_skills:
            return {"score": 0.0, "exact_matches": [], "synonym_matches": [], "category_matches": [], "missing": list(project_skills or [])}

        # Normalize all skills
        proj_normalized = {normalize_skill(s): s for s in project_skills}
        free_normalized = {normalize_skill(s): s for s in freelancer_skills}

        proj_set = set(proj_normalized.keys())
        free_set = set(free_normalized.keys())

        # 1. Direct/synonym matches (full credit)
        exact_matches = proj_set & free_set

        # 2. Category-based partial credit for unmatched skills
        unmatched_proj = proj_set - exact_matches
        category_matches = []
        for ps in list(unmatched_proj):
            ps_cat = get_skill_category(ps)
            if ps_cat:
                for fs in free_set:
                    if get_skill_category(fs) == ps_cat:
                        category_matches.append((ps, fs, ps_cat))
                        unmatched_proj.discard(ps)
                        break

        if len(proj_set) == 0:
            return {"score": 0.0, "exact_matches": [], "synonym_matches": [], "category_matches": [], "missing": []}

        # Score: exact matches = 1.0 credit, category matches = 0.4 credit
        match_score = (len(exact_matches) + len(category_matches) * 0.4) / len(proj_set)

        # Coverage bonus: covering ALL required skills is highly valued
        coverage = len(exact_matches) / len(proj_set)
        coverage_bonus = 0.15 if coverage >= 1.0 else 0.08 if coverage >= 0.8 else 0.0

        # Breadth bonus: freelancer with many additional relevant skills
        extra_skills = free_set - exact_matches
        relevant_extra = sum(1 for s in extra_skills if get_skill_category(s) is not None)
        breadth_bonus = min(relevant_extra * 0.02, 0.1)

        score = min(match_score + coverage_bonus + breadth_bonus, 1.0)

        return {
            "score": round(score, 4),
            "exact_matches": [proj_normalized.get(m, m) for m in exact_matches],
            "synonym_matches": [],  # Already resolved by normalization
            "category_matches": [(proj_normalized.get(p, p), f, c) for p, f, c in category_matches],
            "missing": [proj_normalized.get(m, m) for m in unmatched_proj],
        }
    
    def calculate_success_rate(self, freelancer_id: int) -> float:
        """Calculate freelancer's historical success rate"""
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM contracts WHERE freelancer_id = ? AND status = ?",
            [freelancer_id, "completed"]
        )
        completed = parse_rows(result)[0]["cnt"] if parse_rows(result) else 0
        
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM contracts WHERE freelancer_id = ?",
            [freelancer_id]
        )
        total = parse_rows(result)[0]["cnt"] if parse_rows(result) else 0
        
        if total == 0:
            return 0.5  # Neutral score for new freelancers
        
        return completed / total
    
    def calculate_avg_rating(self, freelancer_id: int) -> float:
        """Calculate average rating from reviews"""
        result = execute_query(
            "SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = ?",
            [freelancer_id]
        )
        rows = parse_rows(result)
        avg = rows[0]["avg_rating"] if rows and rows[0]["avg_rating"] is not None else None
        
        return float(avg) if avg else 0.0
    
    def calculate_budget_match_score(self, project: Dict, freelancer: Dict) -> float:
        """
        Calculate how well freelancer's rate matches project budget
        Returns score from 0.0 to 1.0
        """
        hourly_rate = freelancer.get("hourly_rate")
        budget_max = project.get("budget_max")
        if not hourly_rate or not budget_max:
            return 0.5  # Neutral if no data
        
        hourly_rate = float(hourly_rate)
        budget_max = float(budget_max)
        budget_min = float(project.get("budget_min") or 0)
        
        # For hourly projects
        if project.get("budget_type") == "hourly":
            if hourly_rate <= budget_max:
                return 1.0
            else:
                overage = (hourly_rate - budget_max) / budget_max
                return max(0.0, 1.0 - (overage * 0.5))
        
        # For fixed projects
        elif project.get("budget_type") == "fixed":
            estimated_hours = (budget_max + budget_min) / 2 / hourly_rate
            if estimated_hours >= 10:
                return 1.0
            else:
                return 0.7
        
        return 0.5
    
    def calculate_experience_match_score(self, project: Dict, freelancer: Dict) -> float:
        """
        Match freelancer experience level with project requirements
        """
        if not project.get("experience_level"):
            return 1.0  # No preference
        
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM contracts WHERE freelancer_id = ? AND status = ?",
            [freelancer.get("id"), "completed"]
        )
        completed_count = parse_rows(result)[0]["cnt"] if parse_rows(result) else 0
        
        level_map = {
            "entry": (0, 5),
            "intermediate": (5, 15),
            "expert": (15, float('inf'))
        }
        
        required_range = level_map.get(project.get("experience_level", "").lower(), (0, float('inf')))
        
        if required_range[0] <= completed_count <= required_range[1]:
            return 1.0
        elif completed_count > required_range[1]:
            # Overqualified - slight penalty
            return 0.8
        else:
            # Underqualified - larger penalty
            return 0.4
    
    def calculate_availability_score(self, freelancer_id: int) -> float:
        """
        Calculate freelancer availability based on active contracts
        """
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM contracts WHERE freelancer_id = ? AND status IN ('active', 'in_progress')",
            [freelancer_id]
        )
        active_contracts = parse_rows(result)[0]["cnt"] if parse_rows(result) else 0
        
        if active_contracts == 0:
            return 1.0  # Fully available
        elif active_contracts == 1:
            return 0.7  # Somewhat available
        elif active_contracts == 2:
            return 0.4  # Limited availability
        else:
            return 0.1  # Very busy
    
    def calculate_response_rate(self, freelancer_id: int) -> float:
        """
        Calculate how quickly freelancer responds to proposals
        """
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM proposals WHERE freelancer_id = ?",
            [freelancer_id]
        )
        proposals = parse_rows(result)[0]["cnt"] if parse_rows(result) else 0
        
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM proposals WHERE freelancer_id = ? AND status = ?",
            [freelancer_id, "accepted"]
        )
        accepted = parse_rows(result)[0]["cnt"] if parse_rows(result) else 0
        
        if proposals == 0:
            return 0.5  # Neutral for new users
        
        return min(accepted / proposals, 1.0)
    
    def _parse_skills(self, raw) -> List[str]:
        """Safely parse a skills field (JSON string, list, or CSV)."""
        if not raw:
            return []
        if isinstance(raw, list):
            return [str(s).strip() for s in raw if s]
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(s).strip() for s in parsed if s]
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
            # Fallback: comma-separated
            return [s.strip() for s in raw.split(",") if s.strip()]
        return []

    def calculate_match_score(self, project: Dict, freelancer: Dict) -> Dict[str, Any]:
        """
        Calculate comprehensive match score between project and freelancer.
        Uses skill synonym resolution, category matching, behavioral signals,
        and configurable weights for multi-factor scoring.
        """
        project_skills = self._parse_skills(project.get("skills"))
        freelancer_skills = self._parse_skills(freelancer.get("skills"))

        freelancer_id = freelancer.get("id")

        # Calculate individual factors
        skill_result = self.calculate_skill_match_score(project_skills, freelancer_skills)
        avg_rating = self.calculate_avg_rating(freelancer_id)
        success_rate = self.calculate_success_rate(freelancer_id)
        budget_match = self.calculate_budget_match_score(project, freelancer)
        experience = self.calculate_experience_match_score(project, freelancer)
        availability = self.calculate_availability_score(freelancer_id)
        response_rate = self.calculate_response_rate(freelancer_id)
        recency = self._calculate_recency_score(freelancer_id)
        sentiment_score = self._calculate_sentiment_score(freelancer_id)

        factors = {
            "skill_match": skill_result["score"],
            "success_rate": success_rate,
            "avg_rating": min(avg_rating / 5.0, 1.0),
            "budget_match": budget_match,
            "experience_match": experience,
            "availability": availability,
            "response_rate": response_rate,
            "recency": recency,
            "review_sentiment": sentiment_score,
        }

        # Configurable weights (sum = 1.0)
        weights = {
            "skill_match": 0.28,
            "success_rate": 0.13,
            "avg_rating": 0.13,
            "budget_match": 0.13,
            "experience_match": 0.10,
            "availability": 0.05,
            "response_rate": 0.05,
            "recency": 0.05,
            "review_sentiment": 0.08,
        }

        total_score = sum(factors[k] * weights[k] for k in factors)

        # Match quality label
        if total_score >= 0.85:
            quality = "excellent"
        elif total_score >= 0.70:
            quality = "strong"
        elif total_score >= 0.55:
            quality = "good"
        elif total_score >= 0.40:
            quality = "fair"
        else:
            quality = "weak"

        return {
            "score": round(total_score, 3),
            "quality": quality,
            "factors": {k: round(v, 3) for k, v in factors.items()},
            "weights": weights,
            "skill_details": {
                "exact_matches": skill_result["exact_matches"],
                "category_matches": [(p, f, c) for p, f, c in skill_result.get("category_matches", [])],
                "missing_skills": skill_result["missing"],
            },
        }

    def _calculate_recency_score(self, freelancer_id: int) -> float:
        """Score based on how recently the freelancer was active."""

    def _calculate_sentiment_score(self, freelancer_id: int) -> float:
        """
        Calculate a 0-1 sentiment score from review text analysis.
        Uses VADER compound scores stored in sentiment_data or re-analyzes on the fly.
        """
        try:
            # Try to get pre-computed sentiment data
            result = execute_query(
                "SELECT sentiment_data, comment, rating FROM reviews WHERE reviewee_id = ? AND is_public = 1",
                [freelancer_id]
            )
            rows = parse_rows(result)
            if not rows:
                return 0.5  # Neutral for no reviews

            compounds = []
            for row in rows:
                sd = row.get("sentiment_data")
                if sd:
                    try:
                        data = json.loads(sd) if isinstance(sd, str) else sd
                        if "compound" in data:
                            compounds.append(float(data["compound"]))
                            continue
                    except (json.JSONDecodeError, TypeError, ValueError):
                        pass
                # Fallback: analyze on the fly
                comment = row.get("comment")
                if comment:
                    try:
                        from app.services.sentiment_analysis import sentiment_analyzer
                        result_s = sentiment_analyzer.analyze(comment)
                        compounds.append(result_s["compound"])
                    except Exception:
                        pass

            if not compounds:
                return 0.5

            avg_compound = sum(compounds) / len(compounds)
            # Map compound (-1 to +1) to score (0 to 1)
            return round((avg_compound + 1.0) / 2.0, 4)
        except Exception as e:
            logger.warning("Sentiment score calculation failed: %s", e)
            return 0.5
        result = execute_query(
            "SELECT MAX(created_at) as last_activity FROM proposals WHERE freelancer_id = ?",
            [freelancer_id]
        )
        rows = parse_rows(result)
        last_activity_str = rows[0]["last_activity"] if rows and rows[0].get("last_activity") else None

        if not last_activity_str:
            result = execute_query(
                "SELECT MAX(created_at) as last_activity FROM contracts WHERE freelancer_id = ?",
                [freelancer_id]
            )
            rows = parse_rows(result)
            last_activity_str = rows[0]["last_activity"] if rows and rows[0].get("last_activity") else None

        if not last_activity_str:
            return 0.3  # New freelancer - neutral-low

        try:
            last_activity = datetime.fromisoformat(str(last_activity_str).replace("Z", "+00:00"))
            days_ago = (datetime.utcnow() - last_activity.replace(tzinfo=None)).days
        except (ValueError, TypeError):
            return 0.3

        if days_ago <= 7:
            return 1.0
        elif days_ago <= 30:
            return 0.8
        elif days_ago <= 90:
            return 0.5
        else:
            return 0.2
    
    def get_recommended_freelancers(
        self,
        project_id: int,
        limit: int = 10,
        min_score: float = 0.3,
        diversity: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Get recommended freelancers for a project using AI matching.
        Includes diversity boosting to avoid showing only top-heavy results.
        """
        result = execute_query(
            "SELECT * FROM projects WHERE id = ?", [project_id]
        )
        projects = parse_rows(result)
        if not projects:
            return []
        project = projects[0]

        result = execute_query(
            "SELECT * FROM users WHERE user_type = ? AND is_active = 1",
            ["freelancer"]
        )
        freelancers = parse_rows(result)

        recommendations = []
        for freelancer in freelancers:
            match_result = self.calculate_match_score(project, freelancer)

            if match_result["score"] >= min_score:
                name = freelancer.get("name") or f"{freelancer.get('first_name') or ''} {freelancer.get('last_name') or ''}".strip()
                rec = {
                    "freelancer_id": freelancer.get("id"),
                    "freelancer_name": name,
                    "freelancer_bio": (freelancer.get("bio") or "")[:300],
                    "hourly_rate": freelancer.get("hourly_rate"),
                    "location": freelancer.get("location"),
                    "profile_image_url": freelancer.get("profile_image_url"),
                    "match_score": match_result["score"],
                    "match_quality": match_result["quality"],
                    "match_factors": match_result["factors"],
                    "skill_details": match_result["skill_details"],
                }
                recommendations.append(rec)

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)

        # Diversity: ensure we don't only recommend from one price tier
        if diversity and len(recommendations) > limit:
            recommendations = self._apply_diversity(recommendations, limit)

        final = recommendations[:limit]

        # Cache top results
        for rec in final:
            try:
                execute_query(
                    "INSERT OR REPLACE INTO match_scores (project_id, freelancer_id, score, factors) VALUES (?, ?, ?, ?)",
                    [project_id, rec["freelancer_id"], rec["match_score"], json.dumps(rec["match_factors"])]
                )
            except Exception:
                pass

        return final

    def _apply_diversity(self, recommendations: List[Dict], limit: int) -> List[Dict]:
        """
        Apply diversity boosting: mix top matches with some variety
        in price range and location to avoid homogeneous results.
        """
        if len(recommendations) <= limit:
            return recommendations

        # Take top 60% by score, fill remaining 40% with diverse picks
        top_count = max(int(limit * 0.6), 1)
        result = recommendations[:top_count]
        seen_ids = {r["freelancer_id"] for r in result}

        # Group remaining by rate bracket
        remaining = [r for r in recommendations[top_count:] if r["freelancer_id"] not in seen_ids]
        rate_buckets: Dict[str, List[Dict]] = defaultdict(list)
        for r in remaining:
            rate = r.get("hourly_rate") or 0
            bucket = "budget" if rate < 30 else "mid" if rate < 80 else "premium" if rate < 150 else "expert"
            rate_buckets[bucket].append(r)

        # Round-robin from each bucket to fill remaining slots
        remaining_slots = limit - len(result)
        buckets = list(rate_buckets.values())
        bucket_idx = 0
        while remaining_slots > 0 and buckets:
            bucket = buckets[bucket_idx % len(buckets)]
            if bucket:
                result.append(bucket.pop(0))
                remaining_slots -= 1
            if not bucket:
                buckets.remove(bucket)
            if buckets:
                bucket_idx = (bucket_idx + 1) % len(buckets)

        return result
    
    def get_recommended_projects(
        self,
        freelancer_id: int,
        limit: int = 10,
        min_score: float = 0.3,
    ) -> List[Dict[str, Any]]:
        """
        Get recommended projects for a freelancer with detailed match insights.
        """
        result = execute_query(
            "SELECT * FROM users WHERE id = ?", [freelancer_id]
        )
        freelancers = parse_rows(result)
        if not freelancers:
            return []
        freelancer = freelancers[0]

        result = execute_query(
            "SELECT * FROM projects WHERE status = ?", ["open"]
        )
        projects = parse_rows(result)

        recommendations = []
        for project in projects:
            match_result = self.calculate_match_score(project, freelancer)

            if match_result["score"] >= min_score:
                created_at = project.get("created_at")
                if created_at and not isinstance(created_at, str):
                    created_at = created_at.isoformat()
                recommendations.append({
                    "project_id": project.get("id"),
                    "project_title": project.get("title"),
                    "project_description": (project.get("description") or "")[:400],
                    "category": project.get("category"),
                    "budget_min": project.get("budget_min"),
                    "budget_max": project.get("budget_max"),
                    "budget_type": project.get("budget_type"),
                    "experience_level": project.get("experience_level"),
                    "created_at": created_at,
                    "match_score": match_result["score"],
                    "match_quality": match_result["quality"],
                    "match_factors": match_result["factors"],
                    "skill_details": match_result["skill_details"],
                    "why_good_fit": self._generate_fit_reason(match_result),
                })

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations[:limit]

    def _generate_fit_reason(self, match_result: Dict[str, Any]) -> str:
        """Generate a human-readable reason why this is a good match."""
        reasons = []
        factors = match_result["factors"]
        skill_details = match_result.get("skill_details", {})

        if factors.get("skill_match", 0) >= 0.8:
            exact = skill_details.get("exact_matches", [])
            if exact:
                reasons.append(f"Strong skill match: {', '.join(exact[:3])}")
            else:
                reasons.append("Excellent skill alignment")
        elif factors.get("skill_match", 0) >= 0.5:
            reasons.append("Good skill overlap with requirements")

        if factors.get("avg_rating", 0) >= 0.9:
            reasons.append("Top-rated professional")
        if factors.get("success_rate", 0) >= 0.8:
            reasons.append("High project completion rate")
        if factors.get("budget_match", 0) >= 0.9:
            reasons.append("Rate fits within budget")
        if factors.get("availability", 0) >= 0.9:
            reasons.append("Immediately available")

        return "; ".join(reasons[:3]) if reasons else "Relevant background and experience"
    
    def track_recommendation_click(self, user_id: int, item_type: str, item_id: int, score: float):
        """Track when a user clicks on a recommendation (for ML training data)"""
        try:
            execute_query(
                """
                    INSERT INTO recommendation_history (user_id, item_type, item_id, score, clicked)
                    VALUES (?, ?, ?, ?, 1)
                """,
                [user_id, item_type, item_id, score]
            )
        except Exception:
            pass


_matching_service_instance = None

def get_matching_service() -> MatchingEngine:
    """Singleton factory for matching service"""
    global _matching_service_instance
    if _matching_service_instance is None:
        _matching_service_instance = MatchingEngine()
    return _matching_service_instance
