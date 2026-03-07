# @AI-HINT: Saved search queries - persistent user search preferences stored in Turso DB
"""Saved Searches Service - Persistent Search Queries & Alerts (Database-backed)."""

import uuid
import json
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional


from app.db.turso_http import get_turso_http


class SavedSearchesService:
    """Service for managing saved search queries and alerts (Turso DB backed)."""

    MAX_SAVED_SEARCHES = 50

    SEARCH_CATEGORIES = [
        "projects", "freelancers", "companies",
        "skills", "jobs", "portfolios", "gigs"
    ]

    def __init__(self):
        self.search_templates = self._load_search_templates()

    def _load_search_templates(self) -> Dict[str, List[Dict]]:
        return {
            "projects": [
                {"name": "High Budget Projects", "criteria": {"min_budget": 5000, "sort": "budget_desc"}, "description": "Projects with budget > $5000"},
                {"name": "Urgent Projects", "criteria": {"deadline_days": 7, "sort": "deadline_asc"}, "description": "Projects due within 7 days"},
                {"name": "New Projects Today", "criteria": {"posted_within": "24h", "sort": "date_desc"}, "description": "Projects posted in last 24 hours"},
                {"name": "Fixed Price Projects", "criteria": {"pricing_type": "fixed", "sort": "budget_desc"}, "description": "Fixed price projects only"},
            ],
            "freelancers": [
                {"name": "Top Rated Freelancers", "criteria": {"min_rating": 4.5, "sort": "rating_desc"}, "description": "Freelancers with 4.5+ rating"},
                {"name": "Available Now", "criteria": {"availability": "immediate", "sort": "relevance"}, "description": "Freelancers available for immediate work"},
                {"name": "Verified Professionals", "criteria": {"verified": True, "kyc_status": "approved"}, "description": "Identity-verified freelancers"},
            ],
            "gigs": [
                {"name": "Top Rated Gigs", "criteria": {"min_rating": 4.5, "sort": "rating_desc"}, "description": "Gigs with 4.5+ rating"},
                {"name": "Budget Gigs", "criteria": {"max_price": 50, "sort": "price_asc"}, "description": "Affordable gigs under $50"},
            ],
            "jobs": [
                {"name": "Remote Jobs", "criteria": {"location": "remote", "sort": "date_desc"}, "description": "Remote work opportunities"},
                {"name": "Entry Level", "criteria": {"experience_level": "entry", "sort": "date_desc"}, "description": "Jobs for beginners"},
            ],
        }

    def _generate_search_hash(self, criteria: Dict) -> str:
        serialized = json.dumps(criteria, sort_keys=True)
        return hashlib.md5(serialized.encode()).hexdigest()[:12]

    def _turso(self):
        return get_turso_http()

    # ── CRUD ──

    async def save_search(
        self, user_id: str, name: str, category: str,
        criteria: Dict[str, Any], description: Optional[str] = None,
        is_alert: bool = False, alert_frequency: str = "daily"
    ) -> Dict[str, Any]:
        if category not in self.SEARCH_CATEGORIES:
            raise ValueError(f"Invalid category. Must be one of: {self.SEARCH_CATEGORIES}")

        row = self._turso().fetch_one(
            "SELECT COUNT(*) FROM saved_searches WHERE user_id = ?", [user_id]
        )
        count = int(row[0]) if row else 0
        if count >= self.MAX_SAVED_SEARCHES:
            raise ValueError(f"Maximum saved searches limit ({self.MAX_SAVED_SEARCHES}) reached")

        search_id = str(uuid.uuid4())
        search_hash = self._generate_search_hash(criteria)
        now = datetime.now(timezone.utc).isoformat()
        criteria_json = json.dumps(criteria)

        self._turso().execute(
            """INSERT INTO saved_searches
               (id, user_id, name, category, criteria, description, search_hash,
                is_alert, alert_frequency, results_count, use_count, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)""",
            [search_id, user_id, name, category, criteria_json, description,
             search_hash, 1 if is_alert else 0,
             alert_frequency if is_alert else None, now, now]
        )

        saved_search = {
            "id": search_id, "user_id": user_id, "name": name,
            "category": category, "criteria": criteria,
            "description": description, "search_hash": search_hash,
            "is_alert": is_alert,
            "alert_frequency": alert_frequency if is_alert else None,
            "last_alert_sent": None, "results_count": 0, "use_count": 0,
            "created_at": now, "updated_at": now,
        }
        return {"success": True, "saved_search": saved_search, "message": f"Search '{name}' saved successfully"}

    async def get_saved_searches(
        self, user_id: str,
        category: Optional[str] = None, include_alerts_only: bool = False
    ) -> Dict[str, Any]:
        sql = ("SELECT id, user_id, name, category, criteria, description, search_hash, "
               "is_alert, alert_frequency, last_alert_sent, results_count, use_count, "
               "created_at, updated_at FROM saved_searches WHERE user_id = ?")
        params: list = [user_id]
        if category:
            sql += " AND category = ?"
            params.append(category)
        if include_alerts_only:
            sql += " AND is_alert = 1"
        sql += " ORDER BY created_at DESC"

        result = self._turso().execute(sql, params)
        searches = self._parse_search_rows(result)

        by_category: Dict[str, int] = {}
        for s in searches:
            by_category[s["category"]] = by_category.get(s["category"], 0) + 1

        return {"saved_searches": searches, "total": len(searches), "by_category": by_category}

    def _parse_search_rows(self, result: Dict) -> List[Dict]:
        cols = [c for c in result.get("columns", [])]
        rows = result.get("rows", [])
        items = []
        for row in rows:
            item = dict(zip(cols, row))
            if item.get("criteria"):
                try:
                    item["criteria"] = json.loads(item["criteria"])
                except (json.JSONDecodeError, TypeError):
                    pass
            item["is_alert"] = bool(item.get("is_alert"))
            items.append(item)
        return items

    async def update_saved_search(
        self, user_id: str, search_id: str, updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        allowed = ["name", "criteria", "description", "is_alert", "alert_frequency"]
        set_parts = []
        params = []
        for key, val in updates.items():
            if key not in allowed:
                continue
            if key == "criteria":
                set_parts.append("criteria = ?")
                params.append(json.dumps(val))
                set_parts.append("search_hash = ?")
                params.append(self._generate_search_hash(val))
            elif key == "is_alert":
                set_parts.append("is_alert = ?")
                params.append(1 if val else 0)
            else:
                set_parts.append(f"{key} = ?")
                params.append(val)

        if not set_parts:
            raise ValueError("No valid fields to update")

        now = datetime.now(timezone.utc).isoformat()
        set_parts.append("updated_at = ?")
        params.append(now)
        params.extend([search_id, user_id])

        self._turso().execute(
            f"UPDATE saved_searches SET {', '.join(set_parts)} WHERE id = ? AND user_id = ?",
            params
        )

        row = self._turso().fetch_one(
            "SELECT id FROM saved_searches WHERE id = ? AND user_id = ?",
            [search_id, user_id]
        )
        if not row:
            raise ValueError("Saved search not found")

        return {"success": True, "message": "Search updated successfully"}

    async def delete_saved_search(self, user_id: str, search_id: str) -> Dict[str, Any]:
        row = self._turso().fetch_one(
            "SELECT name FROM saved_searches WHERE id = ? AND user_id = ?", [search_id, user_id]
        )
        if not row:
            raise ValueError("Saved search not found")
        self._turso().execute("DELETE FROM saved_searches WHERE id = ? AND user_id = ?", [search_id, user_id])
        return {"success": True, "deleted_search": row[0], "message": "Search deleted successfully"}

    # ── Execute saved search with REAL DB queries ──

    async def execute_saved_search(self, user_id: str, search_id: str) -> Dict[str, Any]:
        row = self._turso().fetch_one(
            "SELECT id, name, category, criteria, use_count FROM saved_searches WHERE id = ? AND user_id = ?",
            [search_id, user_id]
        )
        if not row:
            raise ValueError("Saved search not found")

        category = row[2]
        try:
            criteria = json.loads(row[3]) if isinstance(row[3], str) else row[3]
        except (json.JSONDecodeError, TypeError):
            criteria = {}

        self._turso().execute(
            "UPDATE saved_searches SET use_count = use_count + 1 WHERE id = ?", [search_id]
        )

        results = self._execute_real_search(category, criteria)

        self._turso().execute(
            "UPDATE saved_searches SET results_count = ? WHERE id = ?",
            [len(results), search_id]
        )

        await self.add_to_history(db, user_id, category, criteria, len(results))

        now = datetime.now(timezone.utc).isoformat()
        return {
            "search": {"id": row[0], "name": row[1], "category": category, "criteria": criteria},
            "results": results,
            "total_results": len(results),
            "executed_at": now,
        }

    def _execute_real_search(self, category: str, criteria: Dict) -> List[Dict]:
        """Execute a real database search based on category and criteria."""
        turso = self._turso()
        if category == "projects":
            return self._search_projects(turso, criteria)
        elif category == "freelancers":
            return self._search_freelancers(turso, criteria)
        elif category == "gigs":
            return self._search_gigs(turso, criteria)
        elif category == "skills":
            return self._search_skills(turso, criteria)
        elif category == "jobs":
            return self._search_projects(turso, criteria)
        else:
            return []

    def _search_projects(self, turso, criteria: Dict) -> List[Dict]:
        conditions = ["status = 'open'"]
        params: list = []

        if criteria.get("min_budget"):
            conditions.append("budget_min >= ?")
            params.append(criteria["min_budget"])
        if criteria.get("max_budget"):
            conditions.append("budget_max <= ?")
            params.append(criteria["max_budget"])
        if criteria.get("pricing_type"):
            conditions.append("budget_type = ?")
            params.append(criteria["pricing_type"])
        if criteria.get("experience_level"):
            conditions.append("experience_level = ?")
            params.append(criteria["experience_level"])
        if criteria.get("category"):
            conditions.append("category LIKE ?")
            params.append(f"%{criteria['category']}%")
        if criteria.get("query"):
            q = criteria["query"]
            conditions.append("(title LIKE ? OR description LIKE ?)")
            params.extend([f"%{q}%", f"%{q}%"])
        if criteria.get("posted_within") == "24h":
            conditions.append("created_at >= datetime('now', '-1 day')")
        if criteria.get("deadline_days"):
            conditions.append("created_at >= datetime('now', ?)")
            params.append(f"-{criteria['deadline_days']} days")

        sort_map = {
            "budget_desc": "budget_max DESC",
            "budget_asc": "budget_min ASC",
            "date_desc": "created_at DESC",
            "date_asc": "created_at ASC",
            "deadline_asc": "created_at ASC",
        }
        order = sort_map.get(criteria.get("sort", ""), "created_at DESC")

        where = " AND ".join(conditions) if conditions else "1=1"
        sql = (f"SELECT id, title, description, category, budget_type, budget_min, budget_max, "
               f"experience_level, status, skills, created_at FROM projects WHERE {where} ORDER BY {order} LIMIT 50")

        result = turso.execute(sql, params)
        items = []
        for row in result.get("rows", []):
            items.append({
                "id": row[0], "title": row[1],
                "description": (row[2] or "")[:200],
                "category": row[3], "budget_type": row[4],
                "budget_min": row[5], "budget_max": row[6],
                "experience_level": row[7], "status": row[8],
                "skills": row[9], "created_at": row[10],
            })
        return items

    def _search_freelancers(self, turso, criteria: Dict) -> List[Dict]:
        conditions = ["LOWER(user_type) = 'freelancer'", "is_active = 1"]
        params: list = []

        if criteria.get("min_rate"):
            conditions.append("hourly_rate >= ?")
            params.append(criteria["min_rate"])
        if criteria.get("max_rate"):
            conditions.append("hourly_rate <= ?")
            params.append(criteria["max_rate"])
        if criteria.get("query"):
            q = criteria["query"]
            conditions.append("(name LIKE ? OR bio LIKE ?)")
            params.extend([f"%{q}%", f"%{q}%"])
        if criteria.get("availability") == "immediate":
            conditions.append("availability_status = 'available'")
        if criteria.get("verified"):
            conditions.append("kyc_status = 'approved'")
        if criteria.get("location"):
            conditions.append("location LIKE ?")
            params.append(f"%{criteria['location']}%")

        sort_map = {
            "rating_desc": "created_at DESC",
            "rate_high": "hourly_rate DESC",
            "rate_low": "hourly_rate ASC",
            "date_desc": "created_at DESC",
        }
        order = sort_map.get(criteria.get("sort", ""), "created_at DESC")

        where = " AND ".join(conditions)
        sql = (f"SELECT id, name, first_name, last_name, bio, hourly_rate, location, skills, created_at "
               f"FROM users WHERE {where} ORDER BY {order} LIMIT 50")

        result = turso.execute(sql, params)
        items = []
        for row in result.get("rows", []):
            name = row[1]
            if not name:
                first = row[2] or ""
                last = row[3] or ""
                name = f"{first} {last}".strip()
            items.append({
                "id": row[0], "name": name,
                "bio": (row[4] or "")[:200],
                "hourly_rate": row[5], "location": row[6],
                "skills": row[7], "created_at": row[8],
            })
        return items

    def _search_gigs(self, turso, criteria: Dict) -> List[Dict]:
        conditions = ["status = 'active'"]
        params: list = []

        if criteria.get("min_price"):
            conditions.append("basic_price >= ?")
            params.append(criteria["min_price"])
        if criteria.get("max_price"):
            conditions.append("basic_price <= ?")
            params.append(criteria["max_price"])
        if criteria.get("min_rating"):
            conditions.append("rating_average >= ?")
            params.append(criteria["min_rating"])
        if criteria.get("category_id"):
            conditions.append("category_id = ?")
            params.append(criteria["category_id"])
        if criteria.get("query"):
            q = criteria["query"]
            conditions.append("(title LIKE ? OR description LIKE ?)")
            params.extend([f"%{q}%", f"%{q}%"])

        sort_map = {
            "rating_desc": "rating_average DESC",
            "price_asc": "basic_price ASC",
            "price_desc": "basic_price DESC",
            "date_desc": "created_at DESC",
            "orders": "orders_completed DESC",
        }
        order = sort_map.get(criteria.get("sort", ""), "created_at DESC")

        where = " AND ".join(conditions)
        sql = (f"SELECT id, title, slug, short_description, basic_price, rating_average, "
               f"rating_count, orders_completed, seller_id, created_at FROM gigs WHERE {where} ORDER BY {order} LIMIT 50")

        result = turso.execute(sql, params)
        items = []
        for row in result.get("rows", []):
            items.append({
                "id": row[0], "title": row[1], "slug": row[2],
                "short_description": row[3], "basic_price": row[4],
                "rating_average": row[5], "rating_count": row[6],
                "orders_completed": row[7], "seller_id": row[8],
                "created_at": row[9],
            })
        return items

    def _search_skills(self, turso, criteria: Dict) -> List[Dict]:
        conditions = ["1=1"]
        params: list = []

        if criteria.get("query"):
            conditions.append("name LIKE ?")
            params.append(f"%{criteria['query']}%")
        if criteria.get("category"):
            conditions.append("category LIKE ?")
            params.append(f"%{criteria['category']}%")

        where = " AND ".join(conditions)
        result = turso.execute(
            f"SELECT id, name, category FROM skills WHERE {where} ORDER BY name LIMIT 50", params
        )
        items = []
        for row in result.get("rows", []):
            items.append({"id": row[0], "name": row[1], "category": row[2]})
        return items

    # ── History (DB-backed) ──

    async def add_to_history(
        self, user_id: str, category: str,
        criteria: Dict[str, Any], results_count: int = 0
    ) -> Dict[str, Any]:
        entry_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self._turso().execute(
            """INSERT INTO search_history (id, user_id, category, criteria, search_hash, results_count, searched_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [entry_id, user_id, category, json.dumps(criteria),
             self._generate_search_hash(criteria), results_count, now]
        )
        # Prune old entries (keep last 100 per user)
        self._turso().execute(
            """DELETE FROM search_history WHERE id IN (
                SELECT id FROM search_history WHERE user_id = ?
                ORDER BY searched_at DESC LIMIT -1 OFFSET 100
            )""", [user_id]
        )
        return {"tracked": True, "entry_id": entry_id}

    async def get_search_history(
        self, user_id: str,
        category: Optional[str] = None, limit: int = 20
    ) -> Dict[str, Any]:
        sql = ("SELECT id, category, criteria, search_hash, results_count, searched_at "
               "FROM search_history WHERE user_id = ?")
        params: list = [user_id]
        if category:
            sql += " AND category = ?"
            params.append(category)
        sql += " ORDER BY searched_at DESC LIMIT ?"
        params.append(limit)

        result = self._turso().execute(sql, params)
        history = []
        hashes = set()
        for row in result.get("rows", []):
            crit = row[2]
            try:
                crit = json.loads(crit) if isinstance(crit, str) else crit
            except (json.JSONDecodeError, TypeError):
                pass
            hashes.add(row[3])
            history.append({
                "id": row[0], "category": row[1], "criteria": crit,
                "search_hash": row[3], "results_count": row[4], "searched_at": row[5],
            })

        return {"history": history, "total": len(history), "unique_searches": len(hashes)}

    async def clear_search_history(
        self, user_id: str, category: Optional[str] = None
    ) -> Dict[str, Any]:
        if category:
            self._turso().execute(
                "DELETE FROM search_history WHERE user_id = ? AND category = ?", [user_id, category]
            )
            return {"success": True, "message": f"Cleared {category} search history"}
        else:
            self._turso().execute("DELETE FROM search_history WHERE user_id = ?", [user_id])
            return {"success": True, "message": "Cleared all search history"}

    # ── Popular / Templates ──

    async def get_popular_searches(
        self, category: Optional[str] = None, limit: int = 10
    ) -> Dict[str, Any]:
        sql = "SELECT category, criteria, search_hash, COUNT(*) as cnt FROM search_history"
        params: list = []
        if category:
            sql += " WHERE category = ?"
            params.append(category)
        sql += " GROUP BY search_hash ORDER BY cnt DESC LIMIT ?"
        params.append(limit)

        result = self._turso().execute(sql, params)
        popular = []
        for row in result.get("rows", []):
            crit = row[1]
            try:
                crit = json.loads(crit) if isinstance(crit, str) else crit
            except (json.JSONDecodeError, TypeError):
                pass
            popular.append({
                "category": row[0], "criteria": crit,
                "search_hash": row[2], "count": row[3],
            })

        total_row = self._turso().fetch_one("SELECT COUNT(DISTINCT search_hash) FROM search_history", [])
        total_tracked = int(total_row[0]) if total_row else 0

        return {"popular_searches": popular, "total_tracked": total_tracked}

    async def get_search_templates(
        self, category: Optional[str] = None
    ) -> Dict[str, Any]:
        if category:
            templates = {category: self.search_templates.get(category, [])}
        else:
            templates = self.search_templates
        return {"templates": templates, "categories": list(self.search_templates.keys())}

    async def create_search_from_template(
        self, user_id: str, category: str,
        template_name: str, custom_name: Optional[str] = None
    ) -> Dict[str, Any]:
        templates = self.search_templates.get(category, [])
        for template in templates:
            if template["name"] == template_name:
                return await self.save_search(
                    user_id=user_id,
                    name=custom_name or template["name"],
                    category=category, criteria=template["criteria"],
                    description=template["description"],
                )
        raise ValueError(f"Template '{template_name}' not found in category '{category}'")

    async def toggle_search_alert(
        self, user_id: str, search_id: str,
        enable: bool, frequency: str = "daily"
    ) -> Dict[str, Any]:
        row = self._turso().fetch_one(
            "SELECT name FROM saved_searches WHERE id = ? AND user_id = ?", [search_id, user_id]
        )
        if not row:
            raise ValueError("Saved search not found")

        self._turso().execute(
            "UPDATE saved_searches SET is_alert = ?, alert_frequency = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            [1 if enable else 0, frequency if enable else None,
             datetime.now(timezone.utc).isoformat(), search_id, user_id]
        )
        return {
            "success": True, "search_id": search_id,
            "alerts_enabled": enable,
            "frequency": frequency if enable else None,
            "message": f"Alerts {'enabled' if enable else 'disabled'} for '{row[0]}'",
        }

    async def process_search_alerts(self) -> Dict[str, Any]:
        """Process alerts — fetch DB-based saved searches with alerts enabled."""
        result = self._turso().execute(
            "SELECT id, user_id, name, category, criteria, alert_frequency, last_alert_sent "
            "FROM saved_searches WHERE is_alert = 1", []
        )
        alerts_processed = 0
        notifications_sent = 0
        now = datetime.now(timezone.utc)

        for row in result.get("rows", []):
            search_id, _user_id, _name, _category, _criteria_json, frequency, last_sent = row
            should_send = False
            if not last_sent:
                should_send = True
            else:
                try:
                    last_dt = datetime.fromisoformat(last_sent)
                except (ValueError, TypeError):
                    should_send = True
                    last_dt = None
                if last_dt:
                    if frequency == "instant":
                        should_send = True
                    elif frequency == "daily":
                        should_send = (now - last_dt) >= timedelta(days=1)
                    elif frequency == "weekly":
                        should_send = (now - last_dt) >= timedelta(weeks=1)

            if should_send:
                self._turso().execute(
                    "UPDATE saved_searches SET last_alert_sent = ? WHERE id = ?",
                    [now.isoformat(), search_id]
                )
                notifications_sent += 1
            alerts_processed += 1

        return {
            "alerts_processed": alerts_processed,
            "notifications_sent": notifications_sent,
            "processed_at": now.isoformat(),
        }

    async def get_search_analytics(self, user_id: str) -> Dict[str, Any]:
        saved_row = self._turso().fetch_one(
            "SELECT COUNT(*) FROM saved_searches WHERE user_id = ?", [user_id]
        )
        alert_row = self._turso().fetch_one(
            "SELECT COUNT(*) FROM saved_searches WHERE user_id = ? AND is_alert = 1", [user_id]
        )
        history_row = self._turso().fetch_one(
            "SELECT COUNT(*) FROM search_history WHERE user_id = ?", [user_id]
        )
        last_row = self._turso().fetch_one(
            "SELECT searched_at FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 1",
            [user_id]
        )

        top_result = self._turso().execute(
            "SELECT name, use_count FROM saved_searches WHERE user_id = ? ORDER BY use_count DESC LIMIT 5",
            [user_id]
        )
        most_used = [{"name": r[0], "use_count": r[1]} for r in top_result.get("rows", [])]

        cat_result = self._turso().execute(
            "SELECT category, COUNT(*) as cnt FROM search_history WHERE user_id = ? GROUP BY category",
            [user_id]
        )
        cat_counts = {r[0]: r[1] for r in cat_result.get("rows", [])}

        return {
            "total_saved_searches": int(saved_row[0]) if saved_row else 0,
            "active_alerts": int(alert_row[0]) if alert_row else 0,
            "total_searches_performed": int(history_row[0]) if history_row else 0,
            "most_used_searches": most_used,
            "searches_by_category": cat_counts,
            "last_search_at": last_row[0] if last_row else None,
        }


# Singleton instance
saved_searches_service = SavedSearchesService()
