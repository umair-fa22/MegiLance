# @AI-HINT: Skill assessment engine with auto-grading and certification
"""Skill verification service: MCQ/coding assessments, auto-grading, and badges."""

import logging
import hashlib
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from enum import Enum
import random

logger = logging.getLogger(__name__)


class QuestionType(str, Enum):
    """Types of assessment questions"""
    MCQ = "mcq"  # Multiple choice
    MULTI_SELECT = "multi_select"  # Multiple correct answers
    CODE = "code"  # Code challenge
    SHORT_ANSWER = "short_answer"  # Free-form text
    TRUE_FALSE = "true_false"  # Boolean


class DifficultyLevel(str, Enum):
    """Assessment difficulty levels"""
    BASIC = "basic"  # Entry level
    INTERMEDIATE = "intermediate"  # 2-4 years experience
    EXPERT = "expert"  # 5+ years / specialist


class BadgeType(str, Enum):
    """Achievement badge types"""
    SKILL_VERIFIED = "skill_verified"  # Passed skill test
    TOP_PERFORMER = "top_performer"  # Top 10% score
    EXPERT_CERTIFIED = "expert_certified"  # Expert level passed
    SPEED_DEMON = "speed_demon"  # Completed in record time
    RISING_STAR = "rising_star"  # New user with great scores


# ============================================================================
# QUESTION BANK — loaded from data/question_bank.json
# TODO: migrate to database for dynamic question management
# ============================================================================

_DATA_DIR = Path(__file__).parent / "data"

def _load_question_bank() -> Dict[str, List[Dict[str, Any]]]:
    with open(_DATA_DIR / "question_bank.json", encoding="utf-8") as f:
        return json.load(f)

QUESTION_BANK: Dict[str, List[Dict[str, Any]]] = _load_question_bank()


# ============================================================================
# CODE EXECUTOR (Sandboxed)
# ============================================================================

class CodeExecutor:
    """
    Sandboxed code execution for skill assessments
    In production, use Docker containers or isolated VMs
    """
    
    TIMEOUT_SECONDS = 10
    MAX_OUTPUT_LENGTH = 10000
    
    @staticmethod
    def execute_python(code: str, test_cases: List[Dict]) -> Dict[str, Any]:
        """
        Execute Python code against test cases.
        
        SECURITY: Actual code execution is disabled — running arbitrary user code
        via subprocess without a proper sandbox (Docker/gVisor/Firecracker) is an
        arbitrary-code-execution vulnerability. All submissions are flagged for
        manual review instead.
        """
        results = []
        for i, test in enumerate(test_cases):
            results.append({
                "test_id": i,
                "passed": None,
                "manual_review": True
            })
        
        return {
            "all_passed": False,
            "results": results,
            "total_tests": len(test_cases),
            "passed_count": 0,
            "manual_review_required": True,
            "note": "Code execution requires sandboxed environment. Submitted for manual review."
        }
    
    @staticmethod
    def execute_javascript(code: str, test_cases: List[Dict]) -> Dict[str, Any]:
        """Execute JavaScript code against test cases"""
        # Similar implementation using Node.js
        # For now, return manual review required
        return {
            "all_passed": None,
            "manual_review": True,
            "message": "JavaScript execution requires Node.js environment"
        }


# ============================================================================
# ASSESSMENT ENGINE
# ============================================================================

class SkillAssessmentEngine:
    """
    Production-grade skill assessment engine
    """
    
    def __init__(self):
        self.code_executor = CodeExecutor()
        # In-memory session storage (use Redis in production)
        self._active_sessions: Dict[str, Dict] = {}
    
    # =========================================================================
    # ASSESSMENT CREATION
    # =========================================================================
    
    def get_available_skills(self) -> List[Dict[str, Any]]:
        """Get list of skills with available assessments"""
        return [
            {
                "skill": skill,
                "question_count": len(questions),
                "difficulty_levels": list(set(q["difficulty"] for q in questions)),
                "has_coding": any(q["type"] == QuestionType.CODE.value for q in questions)
            }
            for skill, questions in QUESTION_BANK.items()
        ]
    
    def create_assessment(
        self,
        user_id: int,
        skill: str,
        difficulty: DifficultyLevel = DifficultyLevel.INTERMEDIATE,
        question_count: int = 10
    ) -> Dict[str, Any]:
        """Create a new skill assessment for a user"""
        if skill not in QUESTION_BANK:
            raise ValueError(f"Skill '{skill}' not available for assessment")
        
        # Get questions for difficulty level
        all_questions = QUESTION_BANK[skill]
        eligible = [q for q in all_questions if q["difficulty"] == difficulty.value]
        
        # Fallback to all questions if not enough
        if len(eligible) < question_count:
            eligible = all_questions
        
        # Random selection
        selected = random.sample(eligible, min(len(eligible), question_count))
        
        # Calculate total time and points
        total_time = sum(q["time_seconds"] for q in selected)
        total_points = sum(q["points"] for q in selected)
        
        # Generate session ID
        session_id = hashlib.sha256(
            f"{user_id}:{skill}:{datetime.now(timezone.utc).isoformat()}:{random.random()}".encode()
        ).hexdigest()[:16]
        
        # Create session
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "skill": skill,
            "difficulty": difficulty.value,
            "questions": selected,
            "answers": {},
            "current_index": 0,
            "total_points": total_points,
            "total_time_seconds": total_time,
            "time_limit": datetime.now(timezone.utc) + timedelta(seconds=total_time + 60),  # Buffer
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "status": "in_progress",
            "focus_events": [],  # Track tab switches for proctoring
            "score": None
        }
        
        self._active_sessions[session_id] = session
        
        # Return session info (without correct answers)
        return {
            "session_id": session_id,
            "skill": skill,
            "difficulty": difficulty.value,
            "question_count": len(selected),
            "total_time_seconds": total_time,
            "total_points": total_points,
            "time_limit": session["time_limit"].isoformat(),
            "first_question": self._sanitize_question(selected[0])
        }
    
    def _sanitize_question(self, question: Dict) -> Dict:
        """Remove correct answer from question for client"""
        sanitized = question.copy()
        sanitized.pop("correct", None)
        sanitized.pop("test_cases", None)
        return sanitized
    
    # =========================================================================
    # TAKING ASSESSMENT
    # =========================================================================
    
    def get_question(
        self,
        session_id: str,
        index: int
    ) -> Optional[Dict[str, Any]]:
        """Get a specific question from assessment"""
        session = self._active_sessions.get(session_id)
        if not session or session["status"] != "in_progress":
            return None
        
        # Check time limit
        if datetime.now(timezone.utc) > session["time_limit"]:
            self._complete_assessment(session_id, timeout=True)
            return None
        
        if index >= len(session["questions"]):
            return None
        
        question = session["questions"][index]
        
        return {
            "index": index,
            "total": len(session["questions"]),
            "question": self._sanitize_question(question),
            "already_answered": session["answers"].get(question["id"]) is not None,
            "previous_answer": session["answers"].get(question["id"]),
            "time_remaining": (session["time_limit"] - datetime.now(timezone.utc)).total_seconds()
        }
    
    def submit_answer(
        self,
        session_id: str,
        question_id: str,
        answer: Any
    ) -> Dict[str, Any]:
        """Submit answer for a question"""
        session = self._active_sessions.get(session_id)
        if not session or session["status"] != "in_progress":
            return {"error": "Invalid or expired session"}
        
        # Check time limit
        if datetime.now(timezone.utc) > session["time_limit"]:
            result = self._complete_assessment(session_id, timeout=True)
            return {"completed": True, "timeout": True, "result": result}
        
        # Find question
        question = next(
            (q for q in session["questions"] if q["id"] == question_id),
            None
        )
        if not question:
            return {"error": "Question not found"}
        
        # Store answer
        session["answers"][question_id] = {
            "answer": answer,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if all questions answered
        all_answered = len(session["answers"]) == len(session["questions"])
        
        return {
            "success": True,
            "questions_answered": len(session["answers"]),
            "total_questions": len(session["questions"]),
            "all_complete": all_answered
        }
    
    def record_focus_event(
        self,
        session_id: str,
        event_type: str  # "blur", "focus", "visibility_hidden", "visibility_visible"
    ) -> None:
        """Record focus events for proctoring"""
        session = self._active_sessions.get(session_id)
        if session and session["status"] == "in_progress":
            session["focus_events"].append({
                "type": event_type,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    # =========================================================================
    # GRADING
    # =========================================================================
    
    def complete_assessment(
        self,
        session_id: str
    ) -> Dict[str, Any]:
        """Complete and grade assessment"""
        return self._complete_assessment(session_id, timeout=False)
    
    def _complete_assessment(
        self,
        session_id: str,
        timeout: bool = False
    ) -> Dict[str, Any]:
        """Internal completion logic with grading"""
        session = self._active_sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}
        
        if session["status"] == "completed":
            return self._get_results(session)
        
        session["status"] = "completed"
        session["completed_at"] = datetime.now(timezone.utc).isoformat()
        session["timeout"] = timeout
        
        # Grade each question
        total_earned = 0
        question_results = []
        
        for question in session["questions"]:
            answer_data = session["answers"].get(question["id"])
            answer = answer_data["answer"] if answer_data else None
            
            result = self._grade_question(question, answer)
            result["question_id"] = question["id"]
            result["question_text"] = question["question"][:100]
            question_results.append(result)
            total_earned += result.get("points_earned", 0)
        
        # Calculate percentage
        percentage = (total_earned / session["total_points"] * 100) if session["total_points"] > 0 else 0
        
        # Determine pass/fail (70% threshold)
        passed = percentage >= 70
        
        # Check for focus violations
        blur_events = sum(1 for e in session["focus_events"] if e["type"] == "blur")
        integrity_warning = blur_events > 3
        
        # Calculate badges earned
        badges = self._calculate_badges(
            session, percentage, passed, blur_events
        )
        
        # Store results
        session["score"] = {
            "points_earned": total_earned,
            "total_points": session["total_points"],
            "percentage": round(percentage, 1),
            "passed": passed,
            "question_results": question_results,
            "badges": badges,
            "integrity_warning": integrity_warning,
            "focus_events_count": len(session["focus_events"])
        }
        
        return self._get_results(session)
    
    def _grade_question(
        self,
        question: Dict,
        answer: Any
    ) -> Dict[str, Any]:
        """Grade a single question"""
        q_type = question["type"]
        points = question["points"]
        
        if answer is None:
            return {
                "correct": False,
                "points_earned": 0,
                "max_points": points,
                "unanswered": True
            }
        
        if q_type == QuestionType.MCQ.value or q_type == QuestionType.TRUE_FALSE.value:
            correct = answer == question["correct"]
            return {
                "correct": correct,
                "points_earned": points if correct else 0,
                "max_points": points,
                "correct_answer": question["correct"]
            }
        
        elif q_type == QuestionType.MULTI_SELECT.value:
            # Partial credit for multi-select
            correct_set = set(question["correct"])
            answer_set = set(answer) if isinstance(answer, list) else {answer}
            
            correct_selected = len(correct_set & answer_set)
            wrong_selected = len(answer_set - correct_set)
            
            # Deduct for wrong selections
            score = max(0, correct_selected - wrong_selected)
            earned = (score / len(correct_set)) * points if correct_set else 0
            
            return {
                "correct": answer_set == correct_set,
                "points_earned": round(earned, 1),
                "max_points": points,
                "partial_credit": True
            }
        
        elif q_type == QuestionType.CODE.value:
            # Execute code
            test_cases = question.get("test_cases", [])
            
            if question["id"].startswith("py_"):
                result = CodeExecutor.execute_python(answer, test_cases)
            elif question["id"].startswith("js_"):
                result = CodeExecutor.execute_javascript(answer, test_cases)
            else:
                result = {"manual_review": True}
            
            if result.get("manual_review"):
                return {
                    "correct": None,
                    "points_earned": 0,  # Manual review needed
                    "max_points": points,
                    "manual_review": True,
                    "code_submitted": answer[:500]
                }
            
            # Partial credit for passing some tests
            passed = result.get("passed_count", 0)
            total = result.get("total_count", 1)
            earned = (passed / total) * points if total > 0 else 0
            
            return {
                "correct": result.get("all_passed", False),
                "points_earned": round(earned, 1),
                "max_points": points,
                "test_results": result["results"],
                "partial_credit": True
            }
        
        elif q_type == QuestionType.SHORT_ANSWER.value:
            # Short answers need manual review
            return {
                "correct": None,
                "points_earned": 0,
                "max_points": points,
                "manual_review": True,
                "answer_submitted": answer[:500]
            }
        
        return {
            "correct": False,
            "points_earned": 0,
            "max_points": points,
            "error": "Unknown question type"
        }
    
    def _calculate_badges(
        self,
        session: Dict,
        percentage: float,
        passed: bool,
        blur_events: int
    ) -> List[Dict[str, Any]]:
        """Calculate badges earned from assessment"""
        badges = []
        
        if passed:
            badges.append({
                "type": BadgeType.SKILL_VERIFIED.value,
                "name": f"{session['skill'].title()} Verified",
                "icon": "✓",
                "description": f"Passed {session['skill']} assessment"
            })
        
        if percentage >= 90:
            badges.append({
                "type": BadgeType.TOP_PERFORMER.value,
                "name": "Top Performer",
                "icon": "🏆",
                "description": "Scored in top 10%"
            })
        
        if session["difficulty"] == DifficultyLevel.EXPERT.value and passed:
            badges.append({
                "type": BadgeType.EXPERT_CERTIFIED.value,
                "name": f"{session['skill'].title()} Expert",
                "icon": "⭐",
                "description": "Expert-level certification"
            })
        
        # Speed demon - completed in less than 50% time
        if session.get("completed_at") and session.get("started_at"):
            time_taken = (
                datetime.fromisoformat(session["completed_at"]) -
                datetime.fromisoformat(session["started_at"])
            ).total_seconds()
            if time_taken < session["total_time_seconds"] * 0.5 and passed:
                badges.append({
                    "type": BadgeType.SPEED_DEMON.value,
                    "name": "Speed Demon",
                    "icon": "⚡",
                    "description": "Completed in record time"
                })
        
        return badges
    
    def _get_results(self, session: Dict) -> Dict[str, Any]:
        """Format assessment results"""
        score = session.get("score", {})
        
        return {
            "session_id": session["session_id"],
            "skill": session["skill"],
            "difficulty": session["difficulty"],
            "status": session["status"],
            "started_at": session["started_at"],
            "completed_at": session["completed_at"],
            "timeout": session.get("timeout", False),
            "score": score.get("percentage", 0),
            "passed": score.get("passed", False),
            "points_earned": score.get("points_earned", 0),
            "total_points": session["total_points"],
            "questions_answered": len(session["answers"]),
            "total_questions": len(session["questions"]),
            "badges": score.get("badges", []),
            "integrity_warning": score.get("integrity_warning", False),
            "question_results": score.get("question_results", [])
        }
    
    # =========================================================================
    # USER SKILL PROFILE
    # =========================================================================
    
    def get_user_skill_profile(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's skill assessment history and badges"""
        # In production, this would query the database
        user_sessions = [
            s for s in self._active_sessions.values()
            if s["user_id"] == user_id and s["status"] == "completed"
        ]
        
        skills = {}
        all_badges = []
        
        for session in user_sessions:
            skill = session["skill"]
            score = session.get("score", {})
            
            if skill not in skills or score.get("percentage", 0) > skills[skill].get("best_score", 0):
                skills[skill] = {
                    "skill": skill,
                    "difficulty": session["difficulty"],
                    "best_score": score.get("percentage", 0),
                    "passed": score.get("passed", False),
                    "assessed_at": session["completed_at"],
                    "attempts": sum(1 for s in user_sessions if s["skill"] == skill)
                }
            
            all_badges.extend(score.get("badges", []))
        
        return {
            "user_id": user_id,
            "skills": list(skills.values()),
            "badges": all_badges,
            "total_assessments": len(user_sessions),
            "skills_verified": sum(1 for s in skills.values() if s["passed"])
        }


# Factory function
_singleton_assessment_engine = None

def get_assessment_engine() -> SkillAssessmentEngine:
    """Get assessment engine instance"""
    global _singleton_assessment_engine
    if _singleton_assessment_engine is None:
        _singleton_assessment_engine = SkillAssessmentEngine()
    return _singleton_assessment_engine
