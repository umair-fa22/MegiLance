# @AI-HINT: AI services module - exports all AI routers
from . import ai_advanced
from . import ai_matching
from . import ai_services
from . import ai_writing
from . import chatbot
from . import fraud_detection
from . import skill_analyzer

__all__ = [
    "ai_advanced",
    "ai_matching",
    "ai_services",
    "ai_writing",
    "chatbot",
    "fraud_detection",
    "skill_analyzer",
]
