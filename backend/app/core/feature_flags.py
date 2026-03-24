# @AI-HINT: Backend feature flags system for A/B testing and gradual rollouts
"""
Feature Flags System - Backend implementation for experimentation.

Features:
- Deterministic user-based rollouts
- A/B testing support
- Flag configuration management
- Analytics integration
"""

import logging
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel
logger = logging.getLogger(__name__)


class RolloutType(str, Enum):
    """Types of feature rollout strategies."""
    PERCENTAGE = "percentage"
    USER_IDS = "user_ids"
    USER_ATTRIBUTES = "user_attributes"
    ENVIRONMENT = "environment"
    ALL = "all"
    NONE = "none"


class FeatureFlag(BaseModel):
    """Feature flag definition."""
    name: str
    description: Optional[str] = None
    is_active: bool = True
    rollout_percentage: int = 100
    rollout_type: RolloutType = RolloutType.PERCENTAGE
    allowed_user_ids: List[int] = []
    required_attributes: Dict[str, Any] = {}
    variants: List[str] = []
    default_variant: str = "control"
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)


# Default feature flags configuration
DEFAULT_FLAGS: Dict[str, FeatureFlag] = {
    # AI Features
    "ai_project_wizard": FeatureFlag(
        name="ai_project_wizard",
        description="AI-powered project creation wizard",
        rollout_percentage=100,
        variants=["control", "ai_wizard", "hybrid"],
        default_variant="ai_wizard"
    ),
    "ai_proposal_generator": FeatureFlag(
        name="ai_proposal_generator",
        description="AI-generated proposal drafts for freelancers",
        rollout_percentage=100,
        variants=["control", "basic_ai", "advanced_ai"],
        default_variant="advanced_ai"
    ),
    "ai_matching_v2": FeatureFlag(
        name="ai_matching_v2",
        description="Next-gen AI matching algorithm with embeddings",
        rollout_percentage=50,
        variants=["control", "embedding_match"],
        default_variant="control"
    ),
    
    # Collaboration Features
    "workroom_kanban": FeatureFlag(
        name="workroom_kanban",
        description="Kanban-style task management in workrooms",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    "real_time_collaboration": FeatureFlag(
        name="real_time_collaboration",
        description="Real-time document collaboration",
        rollout_percentage=30,
        default_variant="control"
    ),
    
    # Community Features
    "community_hub": FeatureFlag(
        name="community_hub",
        description="Community Q&A and playbooks hub",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    "gamification_v2": FeatureFlag(
        name="gamification_v2",
        description="Enhanced gamification with challenges",
        rollout_percentage=75,
        default_variant="control"
    ),
    
    # Payment Features
    "multi_currency": FeatureFlag(
        name="multi_currency",
        description="Multi-currency project pricing",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    "escrow_auto_release": FeatureFlag(
        name="escrow_auto_release",
        description="Automatic escrow release on milestone approval",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    
    # UI/UX Features
    "new_dashboard_layout": FeatureFlag(
        name="new_dashboard_layout",
        description="Redesigned dashboard with widgets",
        rollout_percentage=20,
        variants=["control", "widgets_v1", "widgets_v2"],
        default_variant="control"
    ),
    "dark_mode_v2": FeatureFlag(
        name="dark_mode_v2",
        description="Enhanced dark mode with better contrast",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    
    # Search Features
    "semantic_search": FeatureFlag(
        name="semantic_search",
        description="AI-powered semantic search",
        rollout_percentage=60,
        default_variant="control"
    ),
    "search_filters_v2": FeatureFlag(
        name="search_filters_v2",
        description="Enhanced search filters UI",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    
    # Notifications
    "push_notifications": FeatureFlag(
        name="push_notifications",
        description="Browser push notifications",
        rollout_percentage=80,
        default_variant="enabled"
    ),
    "email_digest": FeatureFlag(
        name="email_digest",
        description="Weekly email digest feature",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    
    # Analytics
    "analytics_pro": FeatureFlag(
        name="analytics_pro",
        description="Advanced analytics with predictions",
        rollout_percentage=100,
        default_variant="enabled"
    ),
    
    # Experiments
    "pricing_experiment_q1": FeatureFlag(
        name="pricing_experiment_q1",
        description="Q1 2025 pricing experiment",
        rollout_percentage=10,
        variants=["control", "lower_fees", "volume_discount"],
        default_variant="control"
    ),
    "onboarding_flow_v3": FeatureFlag(
        name="onboarding_flow_v3",
        description="New user onboarding flow experiment",
        rollout_percentage=25,
        variants=["control", "guided", "quick_start"],
        default_variant="control"
    )
}


class FeatureFlags:
    """
    Feature Flags Manager for backend.
    
    Usage:
        flags = FeatureFlags()
        if await flags.is_enabled("ai_project_wizard", user_id=123):
            # Use AI wizard flow
            pass
        
        variant = await flags.get_variant("pricing_experiment_q1", user_id=123)
        if variant == "volume_discount":
            # Apply volume discount pricing
            pass
    """
    
    def __init__(self, custom_flags: Optional[Dict[str, FeatureFlag]] = None):
        """Initialize with default or custom flags."""
        self._flags = custom_flags or DEFAULT_FLAGS.copy()
        self._overrides: Dict[str, bool] = {}
        self._analytics: List[Dict[str, Any]] = []
    
    def _compute_user_hash(self, user_id: int, flag_name: str) -> int:
        """Compute deterministic hash for consistent user experience."""
        hash_input = f"{user_id}:{flag_name}"
        hash_bytes = hashlib.md5(hash_input.encode()).hexdigest()
        return int(hash_bytes, 16) % 100
    
    async def is_enabled(
        self,
        flag_name: str,
        user_id: Optional[int] = None,
        user_attributes: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Check if a feature flag is enabled for a user.
        
        Args:
            flag_name: Name of the feature flag
            user_id: Optional user ID for percentage-based rollouts
            user_attributes: Optional user attributes for attribute-based targeting
        
        Returns:
            True if feature is enabled, False otherwise
        """
        # Check for override
        if flag_name in self._overrides:
            return self._overrides[flag_name]
        
        # Get flag configuration
        flag = self._flags.get(flag_name)
        if not flag:
            return False
        
        if not flag.is_active:
            return False
        
        # Handle different rollout types
        if flag.rollout_type == RolloutType.NONE:
            return False
        
        if flag.rollout_type == RolloutType.ALL:
            return True
        
        if flag.rollout_type == RolloutType.USER_IDS:
            return user_id in flag.allowed_user_ids if user_id else False
        
        if flag.rollout_type == RolloutType.USER_ATTRIBUTES and user_attributes:
            for key, value in flag.required_attributes.items():
                if user_attributes.get(key) != value:
                    return False
            return True
        
        # Percentage-based rollout (default)
        if flag.rollout_percentage >= 100:
            return True
        
        if flag.rollout_percentage <= 0:
            return False
        
        if user_id:
            user_hash = self._compute_user_hash(user_id, flag_name)
            return user_hash < flag.rollout_percentage
        
        # No user_id, use random for anonymous users
        import random
        return random.randint(0, 99) < flag.rollout_percentage
    
    async def get_variant(
        self,
        flag_name: str,
        user_id: Optional[int] = None
    ) -> str:
        """
        Get the variant for a feature flag (for A/B testing).
        
        Args:
            flag_name: Name of the feature flag
            user_id: Optional user ID for deterministic variant assignment
        
        Returns:
            Variant name (e.g., "control", "treatment_a", etc.)
        """
        flag = self._flags.get(flag_name)
        if not flag or not flag.is_active:
            return flag.default_variant if flag else "control"
        
        if not flag.variants:
            return flag.default_variant
        
        # Check if user is in rollout
        if not await self.is_enabled(flag_name, user_id):
            return "control"
        
        if user_id:
            # Deterministic variant assignment
            variant_hash = self._compute_user_hash(user_id, f"{flag_name}_variant")
            variant_index = variant_hash % len(flag.variants)
            return flag.variants[variant_index]
        
        # Random for anonymous users
        import random
        return random.choice(flag.variants)
    
    async def get_flag(self, flag_name: str) -> Optional[FeatureFlag]:
        """Get flag configuration."""
        return self._flags.get(flag_name)
    
    async def get_all_flags(self) -> Dict[str, FeatureFlag]:
        """Get all flag configurations."""
        return self._flags.copy()
    
    async def set_override(self, flag_name: str, enabled: bool) -> None:
        """Set a temporary override for a flag (useful for testing)."""
        self._overrides[flag_name] = enabled
    
    async def clear_override(self, flag_name: str) -> None:
        """Clear an override."""
        self._overrides.pop(flag_name, None)
    
    async def clear_all_overrides(self) -> None:
        """Clear all overrides."""
        self._overrides.clear()
    
    async def track_exposure(
        self,
        flag_name: str,
        user_id: int,
        variant: str,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Track when a user is exposed to a feature/variant.
        This data is used for A/B test analysis.
        """
        self._analytics.append({
            "flag_name": flag_name,
            "user_id": user_id,
            "variant": variant,
            "context": context or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    async def get_analytics(self, flag_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get analytics data for flags."""
        if flag_name:
            return [a for a in self._analytics if a["flag_name"] == flag_name]
        return self._analytics.copy()


# Singleton instance
_feature_flags_instance: Optional[FeatureFlags] = None


def get_feature_flags() -> FeatureFlags:
    """Get the feature flags singleton instance."""
    global _feature_flags_instance
    if _feature_flags_instance is None:
        _feature_flags_instance = FeatureFlags()
    return _feature_flags_instance
