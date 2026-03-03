# @AI-HINT: Saved search queries - persistent user search preferences and alerts
"""Saved Searches Service - Persistent Search Queries & Alerts."""

import uuid
import json
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session


class SavedSearchesService:
    """Service for managing saved search queries and alerts."""
    
    # Maximum saved searches per user
    MAX_SAVED_SEARCHES = 50
    
    # Search categories
    SEARCH_CATEGORIES = [
        "projects", "freelancers", "companies", 
        "skills", "jobs", "portfolios"
    ]
    
    def __init__(self):
        self.search_templates = self._load_search_templates()
    
    def _load_search_templates(self) -> Dict[str, List[Dict]]:
        """Load predefined search templates."""
        return {
            "projects": [
                {
                    "name": "High Budget Projects",
                    "criteria": {"min_budget": 5000, "sort": "budget_desc"},
                    "description": "Projects with budget > $5000"
                },
                {
                    "name": "Urgent Projects",
                    "criteria": {"deadline_days": 7, "sort": "deadline_asc"},
                    "description": "Projects due within 7 days"
                },
                {
                    "name": "New Projects Today",
                    "criteria": {"posted_within": "24h", "sort": "date_desc"},
                    "description": "Projects posted in last 24 hours"
                },
                {
                    "name": "Fixed Price Projects",
                    "criteria": {"pricing_type": "fixed", "sort": "budget_desc"},
                    "description": "Fixed price projects only"
                }
            ],
            "freelancers": [
                {
                    "name": "Top Rated Freelancers",
                    "criteria": {"min_rating": 4.5, "sort": "rating_desc"},
                    "description": "Freelancers with 4.5+ rating"
                },
                {
                    "name": "Available Now",
                    "criteria": {"availability": "immediate", "sort": "relevance"},
                    "description": "Freelancers available for immediate work"
                },
                {
                    "name": "Verified Professionals",
                    "criteria": {"verified": True, "kyc_status": "approved"},
                    "description": "Identity-verified freelancers"
                }
            ],
            "jobs": [
                {
                    "name": "Remote Jobs",
                    "criteria": {"location": "remote", "sort": "date_desc"},
                    "description": "Remote work opportunities"
                },
                {
                    "name": "Entry Level",
                    "criteria": {"experience_level": "entry", "sort": "date_desc"},
                    "description": "Jobs for beginners"
                }
            ]
        }
    
    def _generate_search_hash(self, criteria: Dict) -> str:
        """Generate unique hash for search criteria."""
        serialized = json.dumps(criteria, sort_keys=True)
        return hashlib.md5(serialized.encode()).hexdigest()[:12]
    
    # In-memory storage (would be database in production)
    _saved_searches: Dict[str, List[Dict]] = {}
    _search_history: Dict[str, List[Dict]] = {}
    _search_alerts: Dict[str, List[Dict]] = {}
    _popular_searches: List[Dict] = []
    
    async def save_search(
        self,
        db: Session,
        user_id: str,
        name: str,
        category: str,
        criteria: Dict[str, Any],
        description: Optional[str] = None,
        is_alert: bool = False,
        alert_frequency: str = "daily"
    ) -> Dict[str, Any]:
        """
        Save a search query for future use.
        
        Args:
            user_id: User saving the search
            name: Display name for the saved search
            category: Search category (projects, freelancers, etc.)
            criteria: Search criteria/filters
            description: Optional description
            is_alert: Whether to enable email alerts
            alert_frequency: How often to send alerts (daily, weekly, instant)
        """
        if category not in self.SEARCH_CATEGORIES:
            raise ValueError(f"Invalid category. Must be one of: {self.SEARCH_CATEGORIES}")
        
        # Check user's saved search limit
        user_searches = self._saved_searches.get(user_id, [])
        if len(user_searches) >= self.MAX_SAVED_SEARCHES:
            raise ValueError(f"Maximum saved searches limit ({self.MAX_SAVED_SEARCHES}) reached")
        
        search_id = str(uuid.uuid4())
        search_hash = self._generate_search_hash(criteria)
        
        saved_search = {
            "id": search_id,
            "user_id": user_id,
            "name": name,
            "category": category,
            "criteria": criteria,
            "description": description,
            "search_hash": search_hash,
            "is_alert": is_alert,
            "alert_frequency": alert_frequency if is_alert else None,
            "last_alert_sent": None,
            "results_count": 0,
            "use_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if user_id not in self._saved_searches:
            self._saved_searches[user_id] = []
        self._saved_searches[user_id].append(saved_search)
        
        # Track for popularity
        self._track_search_popularity(category, criteria)
        
        return {
            "success": True,
            "saved_search": saved_search,
            "message": f"Search '{name}' saved successfully"
        }
    
    async def get_saved_searches(
        self,
        db: Session,
        user_id: str,
        category: Optional[str] = None,
        include_alerts_only: bool = False
    ) -> Dict[str, Any]:
        """Get user's saved searches with optional filtering."""
        searches = self._saved_searches.get(user_id, [])
        
        if category:
            searches = [s for s in searches if s["category"] == category]
        
        if include_alerts_only:
            searches = [s for s in searches if s["is_alert"]]
        
        # Sort by most recent first
        searches = sorted(searches, key=lambda x: x["created_at"], reverse=True)
        
        return {
            "saved_searches": searches,
            "total": len(searches),
            "by_category": self._group_by_category(searches)
        }
    
    def _group_by_category(self, searches: List[Dict]) -> Dict[str, int]:
        """Group search count by category."""
        counts = {}
        for search in searches:
            cat = search["category"]
            counts[cat] = counts.get(cat, 0) + 1
        return counts
    
    async def update_saved_search(
        self,
        db: Session,
        user_id: str,
        search_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a saved search."""
        searches = self._saved_searches.get(user_id, [])
        
        for search in searches:
            if search["id"] == search_id:
                allowed_updates = ["name", "criteria", "description", "is_alert", "alert_frequency"]
                for key, value in updates.items():
                    if key in allowed_updates:
                        search[key] = value
                
                if "criteria" in updates:
                    search["search_hash"] = self._generate_search_hash(updates["criteria"])
                
                search["updated_at"] = datetime.now(timezone.utc).isoformat()
                
                return {
                    "success": True,
                    "saved_search": search,
                    "message": "Search updated successfully"
                }
        
        raise ValueError("Saved search not found")
    
    async def delete_saved_search(
        self,
        db: Session,
        user_id: str,
        search_id: str
    ) -> Dict[str, Any]:
        """Delete a saved search."""
        searches = self._saved_searches.get(user_id, [])
        
        for i, search in enumerate(searches):
            if search["id"] == search_id:
                deleted = searches.pop(i)
                return {
                    "success": True,
                    "deleted_search": deleted["name"],
                    "message": "Search deleted successfully"
                }
        
        raise ValueError("Saved search not found")
    
    async def execute_saved_search(
        self,
        db: Session,
        user_id: str,
        search_id: str
    ) -> Dict[str, Any]:
        """Execute a saved search and return mock results."""
        searches = self._saved_searches.get(user_id, [])
        
        for search in searches:
            if search["id"] == search_id:
                # Increment use count
                search["use_count"] = search.get("use_count", 0) + 1
                
                # Track in history
                await self.add_to_history(db, user_id, search["category"], search["criteria"])
                
                # Mock results based on category
                results = self._generate_mock_results(search["category"], search["criteria"])
                
                # Update results count
                search["results_count"] = len(results)
                
                return {
                    "search": search,
                    "results": results,
                    "total_results": len(results),
                    "executed_at": datetime.now(timezone.utc).isoformat()
                }
        
        raise ValueError("Saved search not found")
    
    def _generate_mock_results(self, category: str, criteria: Dict) -> List[Dict]:
        """STUB: Return empty results until real search backend is integrated."""
        # TODO: Query actual search index (e.g., Meilisearch / Elasticsearch)
        return []
    
    async def add_to_history(
        self,
        db: Session,
        user_id: str,
        category: str,
        criteria: Dict[str, Any],
        results_count: int = 0
    ) -> Dict[str, Any]:
        """Track search in user's history."""
        history_entry = {
            "id": str(uuid.uuid4()),
            "category": category,
            "criteria": criteria,
            "search_hash": self._generate_search_hash(criteria),
            "results_count": results_count,
            "searched_at": datetime.now(timezone.utc).isoformat()
        }
        
        if user_id not in self._search_history:
            self._search_history[user_id] = []
        
        # Keep only last 100 searches
        self._search_history[user_id].insert(0, history_entry)
        self._search_history[user_id] = self._search_history[user_id][:100]
        
        return {"tracked": True, "entry_id": history_entry["id"]}
    
    async def get_search_history(
        self,
        db: Session,
        user_id: str,
        category: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get user's recent search history."""
        history = self._search_history.get(user_id, [])
        
        if category:
            history = [h for h in history if h["category"] == category]
        
        history = history[:limit]
        
        return {
            "history": history,
            "total": len(history),
            "unique_searches": len(set(h["search_hash"] for h in history))
        }
    
    async def clear_search_history(
        self,
        db: Session,
        user_id: str,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Clear user's search history."""
        if category:
            history = self._search_history.get(user_id, [])
            self._search_history[user_id] = [h for h in history if h["category"] != category]
            return {"success": True, "message": f"Cleared {category} search history"}
        else:
            self._search_history[user_id] = []
            return {"success": True, "message": "Cleared all search history"}
    
    def _track_search_popularity(self, category: str, criteria: Dict):
        """Track search for popularity analytics."""
        search_hash = self._generate_search_hash(criteria)
        
        for popular in self._popular_searches:
            if popular["search_hash"] == search_hash:
                popular["count"] += 1
                popular["last_used"] = datetime.now(timezone.utc).isoformat()
                return
        
        self._popular_searches.append({
            "search_hash": search_hash,
            "category": category,
            "criteria": criteria,
            "count": 1,
            "first_used": datetime.now(timezone.utc).isoformat(),
            "last_used": datetime.now(timezone.utc).isoformat()
        })
        
        # Keep only top 1000 popular searches
        self._popular_searches = sorted(
            self._popular_searches, 
            key=lambda x: x["count"], 
            reverse=True
        )[:1000]
    
    async def get_popular_searches(
        self,
        db: Session,
        category: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get most popular searches."""
        popular = self._popular_searches
        
        if category:
            popular = [p for p in popular if p["category"] == category]
        
        popular = popular[:limit]
        
        return {
            "popular_searches": popular,
            "total_tracked": len(self._popular_searches)
        }
    
    async def get_search_templates(
        self,
        db: Session,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get predefined search templates."""
        if category:
            templates = {category: self.search_templates.get(category, [])}
        else:
            templates = self.search_templates
        
        return {
            "templates": templates,
            "categories": list(self.search_templates.keys())
        }
    
    async def create_search_from_template(
        self,
        db: Session,
        user_id: str,
        category: str,
        template_name: str,
        custom_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a saved search from a template."""
        templates = self.search_templates.get(category, [])
        
        for template in templates:
            if template["name"] == template_name:
                return await self.save_search(
                    db=db,
                    user_id=user_id,
                    name=custom_name or template["name"],
                    category=category,
                    criteria=template["criteria"],
                    description=template["description"]
                )
        
        raise ValueError(f"Template '{template_name}' not found in category '{category}'")
    
    async def toggle_search_alert(
        self,
        db: Session,
        user_id: str,
        search_id: str,
        enable: bool,
        frequency: str = "daily"
    ) -> Dict[str, Any]:
        """Enable or disable alerts for a saved search."""
        searches = self._saved_searches.get(user_id, [])
        
        for search in searches:
            if search["id"] == search_id:
                search["is_alert"] = enable
                search["alert_frequency"] = frequency if enable else None
                search["updated_at"] = datetime.now(timezone.utc).isoformat()
                
                return {
                    "success": True,
                    "search_id": search_id,
                    "alerts_enabled": enable,
                    "frequency": frequency if enable else None,
                    "message": f"Alerts {'enabled' if enable else 'disabled'} for '{search['name']}'"
                }
        
        raise ValueError("Saved search not found")
    
    async def process_search_alerts(self, db: Session) -> Dict[str, Any]:
        """Process and send search alerts (called by scheduler)."""
        alerts_processed = 0
        notifications_sent = 0
        
        for user_id, searches in self._saved_searches.items():
            for search in searches:
                if not search.get("is_alert"):
                    continue
                
                frequency = search.get("alert_frequency", "daily")
                last_sent = search.get("last_alert_sent")
                
                should_send = False
                if not last_sent:
                    should_send = True
                else:
                    last_sent_dt = datetime.fromisoformat(last_sent)
                    if frequency == "instant":
                        should_send = True
                    elif frequency == "daily":
                        should_send = datetime.now(timezone.utc) - last_sent_dt >= timedelta(days=1)
                    elif frequency == "weekly":
                        should_send = datetime.now(timezone.utc) - last_sent_dt >= timedelta(weeks=1)
                
                if should_send:
                    # Would send actual email notification here
                    search["last_alert_sent"] = datetime.now(timezone.utc).isoformat()
                    notifications_sent += 1
                
                alerts_processed += 1
        
        return {
            "alerts_processed": alerts_processed,
            "notifications_sent": notifications_sent,
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_search_analytics(
        self,
        db: Session,
        user_id: str
    ) -> Dict[str, Any]:
        """Get search analytics for a user."""
        searches = self._saved_searches.get(user_id, [])
        history = self._search_history.get(user_id, [])
        
        # Most used saved searches
        most_used = sorted(searches, key=lambda x: x.get("use_count", 0), reverse=True)[:5]
        
        # Category breakdown
        category_counts = {}
        for h in history:
            cat = h["category"]
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        return {
            "total_saved_searches": len(searches),
            "active_alerts": len([s for s in searches if s.get("is_alert")]),
            "total_searches_performed": len(history),
            "most_used_searches": [{"name": s["name"], "use_count": s.get("use_count", 0)} for s in most_used],
            "searches_by_category": category_counts,
            "last_search_at": history[0]["searched_at"] if history else None
        }


# Singleton instance
saved_searches_service = SavedSearchesService()
