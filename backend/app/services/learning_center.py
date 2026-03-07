# @AI-HINT: Learning center service for tutorials and guides
"""Learning Center Service - Educational content and tutorials."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from enum import Enum
import uuid


class LearningContentType(str, Enum):
    ARTICLE = "article"
    VIDEO = "video"
    TUTORIAL = "tutorial"
    QUIZ = "quiz"
    COURSE = "course"
    WEBINAR = "webinar"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class LearningCategory(str, Enum):
    GETTING_STARTED = "getting_started"
    FREELANCING = "freelancing"
    SKILLS = "skills"
    BUSINESS = "business"
    MARKETING = "marketing"
    FINANCE = "finance"
    TOOLS = "tools"
    BEST_PRACTICES = "best_practices"


class LearningCenterService:
    """Educational content and learning service."""
    
    def __init__(self):
        pass
    
    # Content Discovery
    async def get_featured_content(self) -> List[Dict[str, Any]]:
        """Get featured learning content."""
        return [
            {
                "content_id": str(uuid.uuid4()),
                "title": "Getting Started with MegiLance",
                "type": LearningContentType.COURSE,
                "category": LearningCategory.GETTING_STARTED,
                "difficulty": DifficultyLevel.BEGINNER,
                "duration_minutes": 45,
                "thumbnail": "/images/courses/getting-started.jpg",
                "rating": 4.9,
                "enrolled": 15000,
                "featured": True
            },
            {
                "content_id": str(uuid.uuid4()),
                "title": "Winning Proposals That Convert",
                "type": LearningContentType.VIDEO,
                "category": LearningCategory.FREELANCING,
                "difficulty": DifficultyLevel.INTERMEDIATE,
                "duration_minutes": 30,
                "thumbnail": "/images/courses/proposals.jpg",
                "rating": 4.8,
                "enrolled": 8500,
                "featured": True
            }
        ]
    
    async def search_content(
        self,
        query: Optional[str] = None,
        content_type: Optional[LearningContentType] = None,
        category: Optional[LearningCategory] = None,
        difficulty: Optional[DifficultyLevel] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search learning content."""
        return {
            "results": [
                {
                    "content_id": str(uuid.uuid4()),
                    "title": "Building Your Freelance Brand",
                    "type": LearningContentType.ARTICLE,
                    "category": LearningCategory.MARKETING,
                    "difficulty": DifficultyLevel.INTERMEDIATE,
                    "duration_minutes": 15,
                    "rating": 4.7,
                    "views": 5200
                }
            ],
            "total": 150,
            "limit": limit,
            "offset": offset
        }
    
    async def get_content_by_category(
        self,
        category: LearningCategory
    ) -> List[Dict[str, Any]]:
        """Get content by category."""
        return [
            {
                "content_id": str(uuid.uuid4()),
                "title": f"Introduction to {category.value.replace('_', ' ').title()}",
                "type": LearningContentType.TUTORIAL,
                "difficulty": DifficultyLevel.BEGINNER,
                "duration_minutes": 20,
                "rating": 4.6
            }
        ]
    
    # Content Details
    async def get_content(self, content_id: str) -> Optional[Dict[str, Any]]:
        """Get content details."""
        return {
            "content_id": content_id,
            "title": "Getting Started with MegiLance",
            "description": "Learn everything you need to know to start your freelancing journey on MegiLance.",
            "type": LearningContentType.COURSE,
            "category": LearningCategory.GETTING_STARTED,
            "difficulty": DifficultyLevel.BEGINNER,
            "duration_minutes": 45,
            "author": {
                "name": "MegiLance Team",
                "avatar": "/images/megilance-team.jpg",
                "bio": "Official MegiLance educational content"
            },
            "modules": [
                {
                    "module_id": "m1",
                    "title": "Creating Your Profile",
                    "lessons": [
                        {"lesson_id": "l1", "title": "Profile Basics", "duration": 5},
                        {"lesson_id": "l2", "title": "Writing Your Bio", "duration": 8},
                        {"lesson_id": "l3", "title": "Adding Skills", "duration": 5}
                    ]
                },
                {
                    "module_id": "m2",
                    "title": "Finding Work",
                    "lessons": [
                        {"lesson_id": "l4", "title": "Searching Projects", "duration": 7},
                        {"lesson_id": "l5", "title": "Writing Proposals", "duration": 10},
                        {"lesson_id": "l6", "title": "Pricing Strategies", "duration": 10}
                    ]
                }
            ],
            "rating": 4.9,
            "reviews_count": 1250,
            "enrolled": 15000,
            "requirements": ["Basic computer skills", "Interest in freelancing"],
            "outcomes": [
                "Create a compelling freelancer profile",
                "Find and win your first project",
                "Understand pricing strategies"
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Learning Paths
    async def get_learning_paths(self) -> List[Dict[str, Any]]:
        """Get available learning paths."""
        return [
            {
                "path_id": str(uuid.uuid4()),
                "name": "Freelancer Fundamentals",
                "description": "Master the basics of successful freelancing",
                "difficulty": DifficultyLevel.BEGINNER,
                "courses_count": 5,
                "total_duration_hours": 8,
                "enrolled": 12000,
                "completion_rate": 68
            },
            {
                "path_id": str(uuid.uuid4()),
                "name": "Advanced Business Skills",
                "description": "Scale your freelance business to the next level",
                "difficulty": DifficultyLevel.ADVANCED,
                "courses_count": 7,
                "total_duration_hours": 15,
                "enrolled": 5500,
                "completion_rate": 45
            }
        ]
    
    async def get_learning_path(self, path_id: str) -> Optional[Dict[str, Any]]:
        """Get learning path details."""
        return {
            "path_id": path_id,
            "name": "Freelancer Fundamentals",
            "description": "Master the basics of successful freelancing",
            "difficulty": DifficultyLevel.BEGINNER,
            "courses": [
                {"course_id": "c1", "title": "Getting Started", "order": 1, "required": True},
                {"course_id": "c2", "title": "Profile Optimization", "order": 2, "required": True},
                {"course_id": "c3", "title": "Proposal Writing", "order": 3, "required": True},
                {"course_id": "c4", "title": "Client Communication", "order": 4, "required": True},
                {"course_id": "c5", "title": "Project Management", "order": 5, "required": False}
            ],
            "total_duration_hours": 8,
            "certification": {
                "available": True,
                "name": "Certified MegiLance Freelancer",
                "badge": "/badges/certified-freelancer.png"
            },
            "enrolled": 12000
        }
    
    async def enroll_in_path(
        self,
        user_id: int,
        path_id: str
    ) -> Dict[str, Any]:
        """Enroll user in a learning path."""
        return {
            "enrollment_id": str(uuid.uuid4()),
            "user_id": user_id,
            "path_id": path_id,
            "status": "enrolled",
            "enrolled_at": datetime.now(timezone.utc).isoformat(),
            "progress": 0,
            "expected_completion": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
    
    # Progress Tracking
    async def get_user_progress(self, user_id: int) -> Dict[str, Any]:
        """Get user's learning progress."""
        return {
            "user_id": user_id,
            "total_courses_enrolled": 8,
            "courses_completed": 5,
            "total_hours_learned": 12.5,
            "certificates_earned": 2,
            "current_streak_days": 7,
            "longest_streak_days": 15,
            "in_progress": [
                {
                    "content_id": "c1",
                    "title": "Advanced Proposal Writing",
                    "progress": 65,
                    "last_accessed": datetime.now(timezone.utc).isoformat()
                }
            ],
            "completed": [
                {
                    "content_id": "c2",
                    "title": "Getting Started",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "score": 95
                }
            ],
            "recommendations": [
                {
                    "content_id": "c3",
                    "title": "Client Retention Strategies",
                    "reason": "Based on your completed courses"
                }
            ]
        }
    
    async def update_progress(
        self,
        user_id: int,
        content_id: str,
        lesson_id: str,
        completed: bool = True,
        time_spent_seconds: int = 0
    ) -> Dict[str, Any]:
        """Update learning progress."""
        return {
            "user_id": user_id,
            "content_id": content_id,
            "lesson_id": lesson_id,
            "completed": completed,
            "time_spent_seconds": time_spent_seconds,
            "overall_progress": 75,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def mark_content_complete(
        self,
        user_id: int,
        content_id: str,
        quiz_score: Optional[int] = None
    ) -> Dict[str, Any]:
        """Mark content as complete."""
        return {
            "user_id": user_id,
            "content_id": content_id,
            "status": "completed",
            "quiz_score": quiz_score,
            "points_earned": 100,
            "certificate_earned": True,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Quizzes
    async def get_quiz(
        self,
        content_id: str,
        lesson_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get quiz for content."""
        return {
            "quiz_id": str(uuid.uuid4()),
            "content_id": content_id,
            "title": "Knowledge Check",
            "questions": [
                {
                    "question_id": "q1",
                    "question": "What is the recommended profile completion percentage?",
                    "type": "multiple_choice",
                    "options": ["50%", "75%", "100%", "It doesn't matter"],
                    "correct_index": 2
                },
                {
                    "question_id": "q2",
                    "question": "Which of these should be included in a proposal?",
                    "type": "multiple_select",
                    "options": ["Introduction", "Relevant experience", "Price", "Timeline", "All of the above"],
                    "correct_indices": [0, 1, 2, 3, 4]
                }
            ],
            "passing_score": 70,
            "time_limit_minutes": 10,
            "attempts_allowed": 3
        }
    
    async def submit_quiz(
        self,
        user_id: int,
        quiz_id: str,
        answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Submit quiz answers."""
        return {
            "user_id": user_id,
            "quiz_id": quiz_id,
            "score": 90,
            "passed": True,
            "time_taken_seconds": 180,
            "correct_answers": 9,
            "total_questions": 10,
            "feedback": {
                "q1": {"correct": True},
                "q2": {"correct": True}
            },
            "attempts_remaining": 2,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Webinars
    async def get_upcoming_webinars(self) -> List[Dict[str, Any]]:
        """Get upcoming webinars."""
        return [
            {
                "webinar_id": str(uuid.uuid4()),
                "title": "Freelancing in 2024: Trends and Opportunities",
                "description": "Learn about the latest trends in freelancing",
                "host": {
                    "name": "Sarah Johnson",
                    "title": "Freelance Expert"
                },
                "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
                "duration_minutes": 60,
                "registered": 250,
                "max_participants": 500,
                "is_free": True
            }
        ]
    
    async def register_for_webinar(
        self,
        user_id: int,
        webinar_id: str
    ) -> Dict[str, Any]:
        """Register for a webinar."""
        return {
            "registration_id": str(uuid.uuid4()),
            "user_id": user_id,
            "webinar_id": webinar_id,
            "status": "registered",
            "calendar_link": f"/calendar/webinar/{webinar_id}",
            "reminder_set": True,
            "registered_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Certifications
    async def get_available_certifications(self) -> List[Dict[str, Any]]:
        """Get available certifications."""
        return [
            {
                "certification_id": "cert-freelancer",
                "name": "Certified MegiLance Freelancer",
                "description": "Demonstrates proficiency in using the MegiLance platform",
                "requirements": ["Complete Fundamentals path", "Pass certification exam"],
                "badge": "/badges/certified-freelancer.png",
                "validity_months": 24
            },
            {
                "certification_id": "cert-expert",
                "name": "MegiLance Expert",
                "description": "Advanced certification for top performers",
                "requirements": ["Complete Advanced path", "Score 90%+ on exam", "50+ completed projects"],
                "badge": "/badges/expert.png",
                "validity_months": 12
            }
        ]
    
    async def get_user_certifications(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's earned certifications."""
        return [
            {
                "certification_id": "cert-freelancer",
                "name": "Certified MegiLance Freelancer",
                "earned_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=730)).isoformat(),
                "verification_code": str(uuid.uuid4())[:8].upper(),
                "badge_url": "/badges/certified-freelancer.png",
                "linkedin_eligible": True
            }
        ]
    
    # Bookmarks
    async def bookmark_content(
        self,
        user_id: int,
        content_id: str
    ) -> Dict[str, Any]:
        """Bookmark content for later."""
        return {
            "user_id": user_id,
            "content_id": content_id,
            "bookmarked": True,
            "bookmarked_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_bookmarks(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's bookmarked content."""
        return [
            {
                "content_id": str(uuid.uuid4()),
                "title": "Advanced Pricing Strategies",
                "type": LearningContentType.VIDEO,
                "bookmarked_at": datetime.now(timezone.utc).isoformat()
            }
        ]
    
    async def remove_bookmark(
        self,
        user_id: int,
        content_id: str
    ) -> bool:
        """Remove bookmark."""
        return True


_singleton_learning_service = None

def get_learning_service() -> LearningCenterService:
    global _singleton_learning_service
    if _singleton_learning_service is None:
        _singleton_learning_service = LearningCenterService()
    return _singleton_learning_service
