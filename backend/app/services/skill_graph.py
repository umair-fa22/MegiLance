# @AI-HINT: Skill graph and endorsement system service
"""Skill Graph Service - Skill relationships, endorsements, and verification."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class EndorsementStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class VerificationStatus(str, Enum):
    NOT_VERIFIED = "not_verified"
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class SkillGraphService:
    """Service for skill graph and endorsements."""
    
    def __init__(self):
        pass
    
    # Skill Taxonomy
    async def get_skill_categories(self) -> List[Dict[str, Any]]:
        """Get skill categories."""
        return [
            {
                "id": "development",
                "name": "Development",
                "icon": "code",
                "subcategories": ["web", "mobile", "backend", "devops", "data"]
            },
            {
                "id": "design",
                "name": "Design",
                "icon": "palette",
                "subcategories": ["ui", "ux", "graphic", "motion", "branding"]
            },
            {
                "id": "marketing",
                "name": "Marketing",
                "icon": "megaphone",
                "subcategories": ["digital", "content", "seo", "social", "email"]
            },
            {
                "id": "writing",
                "name": "Writing",
                "icon": "pen",
                "subcategories": ["copywriting", "technical", "content", "creative", "editing"]
            },
            {
                "id": "business",
                "name": "Business",
                "icon": "briefcase",
                "subcategories": ["consulting", "project-management", "sales", "finance", "operations"]
            }
        ]
    
    async def get_skills(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get skills from taxonomy."""
        skills = [
            {"id": "python", "name": "Python", "category": "development", "subcategory": "backend", "popularity": 95},
            {"id": "javascript", "name": "JavaScript", "category": "development", "subcategory": "web", "popularity": 98},
            {"id": "react", "name": "React", "category": "development", "subcategory": "web", "popularity": 92},
            {"id": "typescript", "name": "TypeScript", "category": "development", "subcategory": "web", "popularity": 88},
            {"id": "nodejs", "name": "Node.js", "category": "development", "subcategory": "backend", "popularity": 90},
            {"id": "figma", "name": "Figma", "category": "design", "subcategory": "ui", "popularity": 94},
            {"id": "ux-research", "name": "UX Research", "category": "design", "subcategory": "ux", "popularity": 78},
            {"id": "seo", "name": "SEO", "category": "marketing", "subcategory": "seo", "popularity": 85},
            {"id": "content-writing", "name": "Content Writing", "category": "writing", "subcategory": "content", "popularity": 82}
        ]
        
        if category:
            skills = [s for s in skills if s["category"] == category]
        
        if search:
            search_lower = search.lower()
            skills = [s for s in skills if search_lower in s["name"].lower()]
        
        return skills
    
    async def get_skill_relationships(
        self,
        skill_id: str
    ) -> Dict[str, Any]:
        """Get skill relationships (related, prerequisites, advanced)."""
        relationships = {
            "python": {
                "prerequisites": [],
                "related": ["django", "flask", "fastapi", "pandas", "numpy"],
                "advanced": ["machine-learning", "data-science", "ai"],
                "complements": ["sql", "docker", "aws"]
            },
            "react": {
                "prerequisites": ["javascript", "html", "css"],
                "related": ["redux", "nextjs", "gatsby"],
                "advanced": ["react-native", "graphql"],
                "complements": ["typescript", "nodejs", "figma"]
            }
        }
        
        return relationships.get(skill_id, {
            "prerequisites": [],
            "related": [],
            "advanced": [],
            "complements": []
        })
    
    # User Skills
    async def get_user_skills(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get user's skills with levels and endorsements."""
        return [
            {
                "skill_id": "python",
                "name": "Python",
                "level": SkillLevel.ADVANCED.value,
                "endorsement_count": 15,
                "verified": True,
                "years_experience": 5,
                "projects_count": 23
            },
            {
                "skill_id": "javascript",
                "name": "JavaScript",
                "level": SkillLevel.EXPERT.value,
                "endorsement_count": 28,
                "verified": True,
                "years_experience": 7,
                "projects_count": 45
            },
            {
                "skill_id": "react",
                "name": "React",
                "level": SkillLevel.ADVANCED.value,
                "endorsement_count": 22,
                "verified": False,
                "years_experience": 4,
                "projects_count": 32
            }
        ]
    
    async def add_user_skill(
        self,
        user_id: int,
        skill_id: str,
        level: SkillLevel,
        years_experience: Optional[int] = None
    ) -> Dict[str, Any]:
        """Add a skill to user's profile."""
        return {
            "skill_id": skill_id,
            "user_id": user_id,
            "level": level.value,
            "years_experience": years_experience,
            "endorsement_count": 0,
            "verified": False,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def update_user_skill(
        self,
        user_id: int,
        skill_id: str,
        level: Optional[SkillLevel] = None,
        years_experience: Optional[int] = None
    ) -> Dict[str, Any]:
        """Update user's skill."""
        return {
            "skill_id": skill_id,
            "level": level.value if level else "advanced",
            "years_experience": years_experience,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def remove_user_skill(
        self,
        user_id: int,
        skill_id: str
    ) -> bool:
        """Remove a skill from user's profile."""
        return True
    
    # Endorsements
    async def get_endorsements(
        self,
        user_id: int,
        skill_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get endorsements for user."""
        endorsements = [
            {
                "id": "end-1",
                "skill_id": "python",
                "skill_name": "Python",
                "endorser_id": 2,
                "endorser_name": "Jane Smith",
                "endorser_title": "Senior Developer",
                "endorser_avatar": "/avatars/jane.jpg",
                "message": "Excellent Python skills. Worked together on a data pipeline project.",
                "relationship": "colleague",
                "project_id": "proj-123",
                "endorsed_at": "2024-01-10T00:00:00"
            },
            {
                "id": "end-2",
                "skill_id": "react",
                "skill_name": "React",
                "endorser_id": 3,
                "endorser_name": "Bob Johnson",
                "endorser_title": "Tech Lead",
                "endorser_avatar": "/avatars/bob.jpg",
                "message": "Great React developer. Built our entire frontend.",
                "relationship": "client",
                "project_id": "proj-456",
                "endorsed_at": "2024-01-05T00:00:00"
            }
        ]
        
        if skill_id:
            endorsements = [e for e in endorsements if e["skill_id"] == skill_id]
        
        return endorsements
    
    async def request_endorsement(
        self,
        user_id: int,
        endorser_id: int,
        skill_id: str,
        project_id: Optional[str] = None,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Request an endorsement."""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "endorser_id": endorser_id,
            "skill_id": skill_id,
            "project_id": project_id,
            "message": message,
            "status": EndorsementStatus.PENDING.value,
            "requested_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def give_endorsement(
        self,
        endorser_id: int,
        user_id: int,
        skill_id: str,
        message: str,
        relationship: str,
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Give an endorsement to another user."""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "endorser_id": endorser_id,
            "skill_id": skill_id,
            "message": message,
            "relationship": relationship,
            "project_id": project_id,
            "status": EndorsementStatus.ACCEPTED.value,
            "endorsed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def respond_to_endorsement_request(
        self,
        endorser_id: int,
        request_id: str,
        accept: bool,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Respond to an endorsement request."""
        return {
            "request_id": request_id,
            "status": EndorsementStatus.ACCEPTED.value if accept else EndorsementStatus.DECLINED.value,
            "message": message,
            "responded_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_pending_endorsement_requests(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get pending endorsement requests for user to respond to."""
        return [
            {
                "id": "req-1",
                "requester_id": 5,
                "requester_name": "Alice Brown",
                "skill_id": "javascript",
                "skill_name": "JavaScript",
                "project_id": "proj-789",
                "message": "Would you endorse my JavaScript skills from our project?",
                "requested_at": "2024-01-18T00:00:00"
            }
        ]
    
    # Skill Verification
    async def get_verification_tests(
        self,
        skill_id: str
    ) -> Dict[str, Any]:
        """Get available verification tests for a skill."""
        return {
            "skill_id": skill_id,
            "tests": [
                {
                    "id": "test-basic",
                    "name": "Basic Assessment",
                    "level": "beginner",
                    "duration_minutes": 15,
                    "questions": 20,
                    "passing_score": 70
                },
                {
                    "id": "test-intermediate",
                    "name": "Intermediate Assessment",
                    "level": "intermediate",
                    "duration_minutes": 30,
                    "questions": 30,
                    "passing_score": 75
                },
                {
                    "id": "test-advanced",
                    "name": "Advanced Assessment",
                    "level": "advanced",
                    "duration_minutes": 45,
                    "questions": 40,
                    "passing_score": 80
                }
            ]
        }
    
    async def start_verification_test(
        self,
        user_id: int,
        skill_id: str,
        test_id: str
    ) -> Dict[str, Any]:
        """Start a skill verification test."""
        questions = self._get_test_questions(skill_id, test_id)
        # Strip correct_answer from the response sent to the client
        client_questions = [
            {"id": q["id"], "text": q["text"], "options": q["options"]}
            for q in questions
        ]
        attempt_id = str(uuid.uuid4())
        # Store answer key in-memory for the attempt duration (keyed by attempt_id)
        if not hasattr(self, "_active_attempts"):
            self._active_attempts: Dict[str, Dict] = {}
        self._active_attempts[attempt_id] = {
            "user_id": user_id,
            "skill_id": skill_id,
            "test_id": test_id,
            "answer_key": {q["id"]: q["correct_answer"] for q in questions},
            "started_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=30),
        }
        return {
            "attempt_id": attempt_id,
            "skill_id": skill_id,
            "test_id": test_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
            "questions": client_questions
        }
    
    def _get_test_questions(self, skill_id: str, test_id: str) -> List[Dict]:
        """Return questions with correct answers for the given skill/test."""
        # Question banks per skill - easily extensible
        question_banks = {
            "python": [
                {"id": "py1", "text": "What keyword is used to define a function in Python?", "options": ["func", "def", "function", "define"], "correct_answer": "B"},
                {"id": "py2", "text": "Which of the following is a valid list comprehension?", "options": ["[x for x in range(10)]", "{x for x in range(10)}", "(x for x in range(10))", "list(x: range(10))"], "correct_answer": "A"},
                {"id": "py3", "text": "What does 'self' refer to in a class method?", "options": ["The class itself", "The current instance", "The parent class", "A global variable"], "correct_answer": "B"},
                {"id": "py4", "text": "Which data type is immutable?", "options": ["list", "dict", "set", "tuple"], "correct_answer": "D"},
                {"id": "py5", "text": "What does the 'yield' keyword do?", "options": ["Stops execution", "Returns a value and pauses the generator", "Raises an exception", "Imports a module"], "correct_answer": "B"},
            ],
            "javascript": [
                {"id": "js1", "text": "What is the correct way to declare a constant?", "options": ["var x", "let x", "const x", "constant x"], "correct_answer": "C"},
                {"id": "js2", "text": "What does '===' check?", "options": ["Value only", "Value and type", "Type only", "Reference"], "correct_answer": "B"},
                {"id": "js3", "text": "Which method adds an element to the end of an array?", "options": ["push()", "pop()", "shift()", "unshift()"], "correct_answer": "A"},
                {"id": "js4", "text": "What does 'typeof null' return?", "options": ["null", "undefined", "object", "boolean"], "correct_answer": "C"},
                {"id": "js5", "text": "Which is NOT a primitive type?", "options": ["string", "number", "object", "boolean"], "correct_answer": "C"},
            ],
            "react": [
                {"id": "re1", "text": "What hook is used for side effects?", "options": ["useState", "useEffect", "useContext", "useRef"], "correct_answer": "B"},
                {"id": "re2", "text": "What is JSX?", "options": ["A database query language", "A syntax extension for JavaScript", "A CSS framework", "A testing tool"], "correct_answer": "B"},
                {"id": "re3", "text": "How do you pass data from parent to child component?", "options": ["state", "props", "context", "refs"], "correct_answer": "B"},
                {"id": "re4", "text": "Which hook manages local state?", "options": ["useEffect", "useReducer", "useState", "useMemo"], "correct_answer": "C"},
                {"id": "re5", "text": "What is the virtual DOM?", "options": ["A browser feature", "A lightweight copy of the real DOM", "A database", "A CSS engine"], "correct_answer": "B"},
            ],
        }
        # Default generic questions for unknown skills
        default_questions = [
            {"id": "gen1", "text": "What is version control?", "options": ["A coding language", "A system for tracking changes", "A design tool", "A database"], "correct_answer": "B"},
            {"id": "gen2", "text": "What does API stand for?", "options": ["Application Programming Interface", "Advanced Program Integration", "Automated Process Input", "Application Process Interface"], "correct_answer": "A"},
            {"id": "gen3", "text": "What is a variable?", "options": ["A constant value", "A named storage location", "A function", "A loop"], "correct_answer": "B"},
            {"id": "gen4", "text": "What does debugging mean?", "options": ["Writing code", "Finding and fixing errors", "Deploying software", "Designing interfaces"], "correct_answer": "B"},
            {"id": "gen5", "text": "What is an algorithm?", "options": ["A programming language", "A step-by-step procedure", "A data structure", "A design pattern"], "correct_answer": "B"},
        ]
        return question_banks.get(skill_id, default_questions)
    
    async def submit_verification_test(
        self,
        user_id: int,
        attempt_id: str,
        answers: Dict[str, str]
    ) -> Dict[str, Any]:
        """Submit verification test answers and compute real score."""
        if not hasattr(self, "_active_attempts"):
            self._active_attempts = {}

        attempt = self._active_attempts.pop(attempt_id, None)
        if not attempt:
            # Attempt expired or not found — can't grade without answer key
            return {
                "attempt_id": attempt_id,
                "score": 0,
                "passed": False,
                "status": VerificationStatus.FAILED.value,
                "badge_awarded": None,
                "error": "Test attempt not found or expired",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }

        # Check if attempt expired
        if datetime.now(timezone.utc) > attempt["expires_at"]:
            return {
                "attempt_id": attempt_id,
                "score": 0,
                "passed": False,
                "status": VerificationStatus.FAILED.value,
                "badge_awarded": None,
                "error": "Test attempt has expired",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }

        answer_key = attempt["answer_key"]
        total = len(answer_key)
        correct = 0
        for qid, correct_ans in answer_key.items():
            submitted = answers.get(qid, "").strip().upper()
            if submitted == correct_ans.upper():
                correct += 1

        score = round((correct / total) * 100) if total > 0 else 0
        # Determine passing threshold based on test level
        test_id = attempt.get("test_id", "")
        if "advanced" in test_id:
            passing_score = 80
        elif "intermediate" in test_id:
            passing_score = 75
        else:
            passing_score = 70
        passed = score >= passing_score
        skill_id = attempt.get("skill_id", "")

        return {
            "attempt_id": attempt_id,
            "score": score,
            "correct_answers": correct,
            "total_questions": total,
            "passed": passed,
            "status": VerificationStatus.VERIFIED.value if passed else VerificationStatus.FAILED.value,
            "badge_awarded": f"{skill_id}-{test_id.replace('test-', '')}" if passed else None,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_verification_history(
        self,
        user_id: int,
        skill_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get user's verification test history."""
        return [
            {
                "skill_id": "python",
                "test_id": "test-advanced",
                "score": 92,
                "passed": True,
                "completed_at": "2024-01-10T00:00:00",
                "badge": "python-advanced"
            }
        ]
    
    # Skill Recommendations
    async def get_skill_recommendations(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get skill recommendations based on user's profile."""
        user_skills = await self.get_user_skills(user_id)
        skill_ids = [s["skill_id"] for s in user_skills]
        
        return {
            "trending": [
                {"skill_id": "typescript", "name": "TypeScript", "reason": "Growing demand, complements JavaScript"},
                {"skill_id": "graphql", "name": "GraphQL", "reason": "Trending with React development"},
                {"skill_id": "docker", "name": "Docker", "reason": "Essential for modern deployment"}
            ],
            "complement_your_skills": [
                {"skill_id": "nextjs", "name": "Next.js", "reason": "Builds on your React expertise"},
                {"skill_id": "postgresql", "name": "PostgreSQL", "reason": "Complements your backend skills"}
            ],
            "in_demand": [
                {"skill_id": "ai-ml", "name": "AI/ML", "reason": "Highest paying skill category"},
                {"skill_id": "cloud-architecture", "name": "Cloud Architecture", "reason": "Growing enterprise demand"}
            ],
            "complete_your_profile": [
                {"skill_id": "git", "name": "Git", "reason": "Essential for collaboration"},
                {"skill_id": "agile", "name": "Agile", "reason": "Common project methodology"}
            ]
        }
    
    # Skill Analytics
    async def get_skill_analytics(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get analytics about user's skills."""
        return {
            "total_skills": 8,
            "verified_skills": 3,
            "total_endorsements": 45,
            "skill_distribution": {
                "development": 5,
                "design": 2,
                "business": 1
            },
            "level_distribution": {
                "expert": 2,
                "advanced": 4,
                "intermediate": 2,
                "beginner": 0
            },
            "top_endorsed_skills": [
                {"skill": "JavaScript", "endorsements": 28},
                {"skill": "React", "endorsements": 22},
                {"skill": "Python", "endorsements": 15}
            ],
            "endorsement_trend": [
                {"month": "2024-01", "count": 8},
                {"month": "2023-12", "count": 12},
                {"month": "2023-11", "count": 5}
            ]
        }
    
    # Learning Paths
    async def get_learning_paths(
        self,
        skill_id: str
    ) -> List[Dict[str, Any]]:
        """Get learning paths for a skill."""
        return [
            {
                "id": "path-1",
                "name": "Python Developer Path",
                "description": "From basics to advanced Python development",
                "skills": ["python-basics", "python-advanced", "django", "fastapi", "testing"],
                "estimated_hours": 120,
                "resources": [
                    {"type": "course", "name": "Python Masterclass", "provider": "Udemy"},
                    {"type": "book", "name": "Fluent Python", "author": "Luciano Ramalho"},
                    {"type": "project", "name": "Build a REST API"}
                ]
            }
        ]


_singleton_skill_graph_service = None

def get_skill_graph_service() -> SkillGraphService:
    """Factory function for skill graph service."""
    global _singleton_skill_graph_service
    if _singleton_skill_graph_service is None:
        _singleton_skill_graph_service = SkillGraphService()
    return _singleton_skill_graph_service
