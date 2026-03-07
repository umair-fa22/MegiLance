# @AI-HINT: Activity feed service - timeline of user activities and platform events
"""Activity Feed Service - User Activity Timeline & Social Features."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from collections import defaultdict


class ActivityFeedService:
    """Service for managing user activity feeds and social features."""
    
    # Activity types
    ACTIVITY_TYPES = {
        # Project activities
        "project_created": {"icon": "📋", "template": "{user} created a new project: {title}"},
        "project_completed": {"icon": "✅", "template": "{user} completed project: {title}"},
        "project_milestone": {"icon": "🎯", "template": "{user} reached a milestone on {title}"},
        
        # Proposal activities
        "proposal_submitted": {"icon": "📝", "template": "{user} submitted a proposal"},
        "proposal_accepted": {"icon": "🎉", "template": "{user}'s proposal was accepted"},
        "proposal_won": {"icon": "🏆", "template": "{user} won a project"},
        
        # Review activities
        "review_received": {"icon": "⭐", "template": "{user} received a {rating}-star review"},
        "review_given": {"icon": "📝", "template": "{user} left a review"},
        
        # Achievement activities
        "badge_earned": {"icon": "🏅", "template": "{user} earned the {badge} badge"},
        "level_up": {"icon": "📈", "template": "{user} reached level {level}"},
        "milestone_achieved": {"icon": "🎯", "template": "{user} achieved: {achievement}"},
        
        # Profile activities
        "skill_added": {"icon": "🛠️", "template": "{user} added skill: {skill}"},
        "portfolio_updated": {"icon": "💼", "template": "{user} updated their portfolio"},
        "profile_verified": {"icon": "✓", "template": "{user} verified their identity"},
        
        # Social activities
        "started_following": {"icon": "👥", "template": "{user} started following {target}"},
        "joined_team": {"icon": "🤝", "template": "{user} joined team {team}"},
        
        # Payment activities
        "payment_received": {"icon": "💰", "template": "{user} received a payment"},
        "earning_milestone": {"icon": "💎", "template": "{user} reached ${amount} in earnings"}
    }
    
    # Privacy levels
    PRIVACY_LEVELS = ["public", "followers", "private"]
    
    def __init__(self):
        # In-memory storage
        self._activities: Dict[str, List[Dict]] = {}  # user_id -> activities
        self._followers: Dict[str, set] = defaultdict(set)  # user_id -> follower_ids
        self._following: Dict[str, set] = defaultdict(set)  # user_id -> following_ids
        self._privacy_settings: Dict[str, Dict] = {}  # user_id -> settings
        self._aggregated_feed: Dict[str, List[Dict]] = {}  # user_id -> feed items
    
    async def create_activity(
        self,
        user_id: str,
        activity_type: str,
        data: Dict[str, Any],
        privacy: str = "public",
        target_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new activity entry.
        
        Args:
            user_id: User who performed the activity
            activity_type: Type of activity
            data: Activity-specific data
            privacy: Privacy level (public, followers, private)
            target_user_id: Optional target user (for social activities)
        """
        if activity_type not in self.ACTIVITY_TYPES:
            raise ValueError(f"Unknown activity type: {activity_type}")
        
        if privacy not in self.PRIVACY_LEVELS:
            raise ValueError(f"Invalid privacy level: {privacy}")
        
        activity_config = self.ACTIVITY_TYPES[activity_type]
        
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "activity_type": activity_type,
            "icon": activity_config["icon"],
            "data": data,
            "privacy": privacy,
            "target_user_id": target_user_id,
            "likes": [],
            "comments": [],
            "is_aggregated": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Generate display text
        activity["display_text"] = self._generate_display_text(activity_type, data)
        
        # Store activity
        if user_id not in self._activities:
            self._activities[user_id] = []
        self._activities[user_id].insert(0, activity)
        
        # Keep only last 1000 activities per user
        self._activities[user_id] = self._activities[user_id][:1000]
        
        # Invalidate aggregated feeds for followers
        await self._invalidate_follower_feeds(user_id)
        
        return {
            "success": True,
            "activity": activity
        }
    
    def _generate_display_text(self, activity_type: str, data: Dict) -> str:
        """Generate display text from template."""
        template = self.ACTIVITY_TYPES[activity_type]["template"]
        try:
            return template.format(**data)
        except KeyError:
            return template
    
    async def _invalidate_follower_feeds(self, user_id: str):
        """Invalidate cached feeds for all followers."""
        followers = self._followers.get(user_id, set())
        for follower_id in followers:
            self._aggregated_feed.pop(follower_id, None)
    
    async def get_user_activities(
        self,
        user_id: str,
        viewer_id: Optional[str] = None,
        activity_types: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get activities for a specific user.
        
        Args:
            user_id: User whose activities to fetch
            viewer_id: User viewing the activities (for privacy filtering)
            activity_types: Filter by specific types
            limit: Max results
            offset: Pagination offset
        """
        activities = self._activities.get(user_id, [])
        
        # Apply privacy filter
        if viewer_id != user_id:
            is_follower = viewer_id in self._followers.get(user_id, set()) if viewer_id else False
            
            if is_follower:
                activities = [a for a in activities if a["privacy"] != "private"]
            else:
                activities = [a for a in activities if a["privacy"] == "public"]
        
        # Filter by type
        if activity_types:
            activities = [a for a in activities if a["activity_type"] in activity_types]
        
        # Paginate
        paginated = activities[offset:offset + limit]
        
        return {
            "activities": paginated,
            "total": len(activities),
            "has_more": len(activities) > offset + limit
        }
    
    async def get_feed(
        self,
        user_id: str,
        include_own: bool = True,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Get aggregated feed for a user (own + following activities).
        """
        # Check cache
        if user_id in self._aggregated_feed:
            cached = self._aggregated_feed[user_id]
            return {
                "feed": cached[:limit],
                "total": len(cached),
                "cached": True
            }
        
        # Build feed from following + own
        feed = []
        
        # Own activities
        if include_own:
            own_activities = self._activities.get(user_id, [])
            for activity in own_activities:
                activity_copy = activity.copy()
                activity_copy["is_own"] = True
                feed.append(activity_copy)
        
        # Following activities
        following = self._following.get(user_id, set())
        for followed_id in following:
            followed_activities = self._activities.get(followed_id, [])
            for activity in followed_activities:
                # Only include public or follower-visible
                if activity["privacy"] in ["public", "followers"]:
                    activity_copy = activity.copy()
                    activity_copy["is_own"] = False
                    feed.append(activity_copy)
        
        # Sort by date
        feed.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Aggregate similar activities
        feed = self._aggregate_activities(feed)
        
        # Cache result
        self._aggregated_feed[user_id] = feed
        
        return {
            "feed": feed[:limit],
            "total": len(feed),
            "cached": False
        }
    
    def _aggregate_activities(self, activities: List[Dict]) -> List[Dict]:
        """Aggregate similar consecutive activities."""
        if not activities:
            return []
        
        aggregated = []
        current_group = None
        
        for activity in activities:
            if current_group is None:
                current_group = {
                    "activities": [activity],
                    "type": activity["activity_type"],
                    "user_id": activity["user_id"]
                }
            elif (
                activity["activity_type"] == current_group["type"] and
                activity["user_id"] == current_group["user_id"] and
                len(current_group["activities"]) < 5
            ):
                # Same type and user, aggregate
                current_group["activities"].append(activity)
            else:
                # Finalize current group
                if len(current_group["activities"]) > 1:
                    aggregated.append(self._create_aggregate(current_group))
                else:
                    aggregated.append(current_group["activities"][0])
                
                current_group = {
                    "activities": [activity],
                    "type": activity["activity_type"],
                    "user_id": activity["user_id"]
                }
        
        # Don't forget last group
        if current_group:
            if len(current_group["activities"]) > 1:
                aggregated.append(self._create_aggregate(current_group))
            else:
                aggregated.append(current_group["activities"][0])
        
        return aggregated
    
    def _create_aggregate(self, group: Dict) -> Dict:
        """Create an aggregated activity entry."""
        activities = group["activities"]
        first = activities[0]
        
        return {
            "id": f"agg_{first['id']}",
            "user_id": first["user_id"],
            "activity_type": first["activity_type"],
            "icon": first["icon"],
            "display_text": f"{len(activities)} {first['activity_type'].replace('_', ' ')} activities",
            "is_aggregated": True,
            "aggregated_count": len(activities),
            "aggregated_activities": activities,
            "created_at": first["created_at"],
            "privacy": first["privacy"]
        }
    
    async def follow_user(
        self,
        follower_id: str,
        target_id: str
    ) -> Dict[str, Any]:
        """Follow a user."""
        if follower_id == target_id:
            raise ValueError("Cannot follow yourself")
        
        if target_id in self._following[follower_id]:
            return {
                "success": False,
                "message": "Already following this user"
            }
        
        self._following[follower_id].add(target_id)
        self._followers[target_id].add(follower_id)
        
        # Invalidate feed cache
        self._aggregated_feed.pop(follower_id, None)
        
        # Create activity
        await self.create_activity(
            db=db,
            user_id=follower_id,
            activity_type="started_following",
            data={"user": "You", "target": target_id},
            privacy="public",
            target_user_id=target_id
        )
        
        return {
            "success": True,
            "message": "Now following user",
            "following_count": len(self._following[follower_id]),
            "target_followers": len(self._followers[target_id])
        }
    
    async def unfollow_user(
        self,
        follower_id: str,
        target_id: str
    ) -> Dict[str, Any]:
        """Unfollow a user."""
        if target_id not in self._following[follower_id]:
            return {
                "success": False,
                "message": "Not following this user"
            }
        
        self._following[follower_id].discard(target_id)
        self._followers[target_id].discard(follower_id)
        
        # Invalidate feed cache
        self._aggregated_feed.pop(follower_id, None)
        
        return {
            "success": True,
            "message": "Unfollowed user",
            "following_count": len(self._following[follower_id])
        }
    
    async def get_followers(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get user's followers."""
        followers = list(self._followers.get(user_id, set()))
        
        return {
            "followers": followers[offset:offset + limit],
            "total": len(followers),
            "has_more": len(followers) > offset + limit
        }
    
    async def get_following(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get users that user is following."""
        following = list(self._following.get(user_id, set()))
        
        return {
            "following": following[offset:offset + limit],
            "total": len(following),
            "has_more": len(following) > offset + limit
        }
    
    async def update_privacy_settings(
        self,
        user_id: str,
        settings: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Update activity privacy settings.
        
        Settings example:
        {
            "default_privacy": "followers",
            "project_activities": "public",
            "payment_activities": "private",
            "profile_activities": "followers"
        }
        """
        if user_id not in self._privacy_settings:
            self._privacy_settings[user_id] = {
                "default_privacy": "public"
            }
        
        # Validate privacy levels
        for key, value in settings.items():
            if value not in self.PRIVACY_LEVELS:
                raise ValueError(f"Invalid privacy level for {key}: {value}")
        
        self._privacy_settings[user_id].update(settings)
        
        return {
            "success": True,
            "settings": self._privacy_settings[user_id]
        }
    
    async def get_privacy_settings(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Get user's privacy settings."""
        return self._privacy_settings.get(user_id, {"default_privacy": "public"})
    
    async def like_activity(
        self,
        user_id: str,
        activity_id: str
    ) -> Dict[str, Any]:
        """Like an activity."""
        for user_activities in self._activities.values():
            for activity in user_activities:
                if activity["id"] == activity_id:
                    if user_id in activity["likes"]:
                        return {"success": False, "message": "Already liked"}
                    
                    activity["likes"].append(user_id)
                    return {
                        "success": True,
                        "likes_count": len(activity["likes"])
                    }
        
        raise ValueError("Activity not found")
    
    async def unlike_activity(
        self,
        user_id: str,
        activity_id: str
    ) -> Dict[str, Any]:
        """Unlike an activity."""
        for user_activities in self._activities.values():
            for activity in user_activities:
                if activity["id"] == activity_id:
                    if user_id not in activity["likes"]:
                        return {"success": False, "message": "Not liked"}
                    
                    activity["likes"].remove(user_id)
                    return {
                        "success": True,
                        "likes_count": len(activity["likes"])
                    }
        
        raise ValueError("Activity not found")
    
    async def comment_on_activity(
        self,
        user_id: str,
        activity_id: str,
        comment: str
    ) -> Dict[str, Any]:
        """Add comment to an activity."""
        for user_activities in self._activities.values():
            for activity in user_activities:
                if activity["id"] == activity_id:
                    comment_entry = {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "comment": comment,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    activity["comments"].append(comment_entry)
                    
                    return {
                        "success": True,
                        "comment": comment_entry,
                        "comments_count": len(activity["comments"])
                    }
        
        raise ValueError("Activity not found")
    
    async def delete_activity(
        self,
        user_id: str,
        activity_id: str
    ) -> Dict[str, Any]:
        """Delete own activity."""
        activities = self._activities.get(user_id, [])
        
        for i, activity in enumerate(activities):
            if activity["id"] == activity_id:
                deleted = activities.pop(i)
                await self._invalidate_follower_feeds(user_id)
                return {
                    "success": True,
                    "deleted_activity_type": deleted["activity_type"]
                }
        
        raise ValueError("Activity not found or not owned by user")
    
    async def get_activity_stats(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Get activity statistics for a user."""
        activities = self._activities.get(user_id, [])
        
        type_counts = defaultdict(int)
        total_likes = 0
        total_comments = 0
        
        for activity in activities:
            type_counts[activity["activity_type"]] += 1
            total_likes += len(activity.get("likes", []))
            total_comments += len(activity.get("comments", []))
        
        return {
            "total_activities": len(activities),
            "by_type": dict(type_counts),
            "total_likes_received": total_likes,
            "total_comments_received": total_comments,
            "followers_count": len(self._followers.get(user_id, set())),
            "following_count": len(self._following.get(user_id, set()))
        }
    
    async def get_trending_activities(
        self,
        time_range_hours: int = 24,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get trending activities across the platform."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=time_range_hours)
        
        all_activities = []
        for user_activities in self._activities.values():
            for activity in user_activities:
                if activity["privacy"] == "public":
                    activity_time = datetime.fromisoformat(activity["created_at"])
                    if activity_time >= cutoff:
                        # Calculate engagement score
                        score = (
                            len(activity.get("likes", [])) * 2 +
                            len(activity.get("comments", [])) * 3
                        )
                        activity_copy = activity.copy()
                        activity_copy["engagement_score"] = score
                        all_activities.append(activity_copy)
        
        # Sort by engagement
        all_activities.sort(key=lambda x: x["engagement_score"], reverse=True)
        
        return {
            "trending": all_activities[:limit],
            "time_range_hours": time_range_hours
        }


# Singleton instance
activity_feed_service = ActivityFeedService()
