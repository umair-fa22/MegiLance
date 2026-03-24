# @AI-HINT: Blog CMS service - CRUD operations for blog posts via Turso HTTP API
import logging
import json
from typing import List, Optional
from datetime import datetime, timezone
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostInDB

BLOG_COLUMNS = "id, title, slug, excerpt, content, image_url, author, tags, is_published, is_news_trend, views, reading_time, created_at, updated_at"


def ensure_blog_table():
    """Create blog_posts table if it doesn't exist."""
    execute_query("""
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            excerpt TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            author TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            is_published INTEGER DEFAULT 0,
            is_news_trend INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            reading_time INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """, [])


def _row_to_post(row: dict) -> BlogPostInDB:
    """Convert a Turso row dict to a BlogPostInDB model."""
    tags = []
    if row.get("tags"):
        try:
            tags = json.loads(row["tags"])
        except (json.JSONDecodeError, TypeError):
            tags = []
    return BlogPostInDB(
        id=int(row["id"]),
        title=row["title"],
        slug=row["slug"],
        excerpt=row["excerpt"],
        content=row["content"],
        image_url=row.get("image_url"),
        author=row["author"],
        tags=tags,
        is_published=bool(int(row.get("is_published", 0))),
        is_news_trend=bool(int(row.get("is_news_trend", 0))),
        views=int(row.get("views", 0)),
        reading_time=int(row.get("reading_time", 0)),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


class BlogService:
    @staticmethod
    def calculate_reading_time(content: str) -> int:
        words_per_minute = 200
        words = len(content.split())
        return max(1, round(words / words_per_minute))

    @staticmethod
    def create_post(post: BlogPostCreate) -> Optional[BlogPostInDB]:
        ensure_blog_table()
        now = datetime.now(timezone.utc).isoformat()
        reading_time = BlogService.calculate_reading_time(post.content)
        tags_json = json.dumps(post.tags)

        execute_query(
            """INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author, tags,
               is_published, is_news_trend, views, reading_time, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [post.title, post.slug, post.excerpt, post.content, post.image_url,
             post.author, tags_json, int(post.is_published), int(post.is_news_trend),
             post.views, reading_time, now, now]
        )

        id_result = execute_query("SELECT last_insert_rowid() as id", [])
        if not id_result:
            return None
        rows = parse_rows(id_result)
        if not rows:
            return None
        new_id = int(rows[0]["id"])
        return BlogService.get_post(new_id)

    @staticmethod
    def get_post(post_id: int) -> Optional[BlogPostInDB]:
        result = execute_query(
            f"SELECT {BLOG_COLUMNS} FROM blog_posts WHERE id = ?", [post_id]
        )
        if not result or not result.get("rows"):
            return None
        rows = parse_rows(result)
        return _row_to_post(rows[0]) if rows else None

    @staticmethod
    def get_post_by_slug(slug: str) -> Optional[BlogPostInDB]:
        result = execute_query(
            f"SELECT {BLOG_COLUMNS} FROM blog_posts WHERE slug = ?", [slug]
        )
        if not result or not result.get("rows"):
            return None
        rows = parse_rows(result)
        return _row_to_post(rows[0]) if rows else None

    @staticmethod
    def get_posts(skip: int = 0, limit: int = 10, is_published: Optional[bool] = None, is_news_trend: Optional[bool] = None) -> List[BlogPostInDB]:
        conditions = []
        params: list = []
        if is_published is not None:
            conditions.append("is_published = ?")
            params.append(int(is_published))
        if is_news_trend is not None:
            conditions.append("is_news_trend = ?")
            params.append(int(is_news_trend))

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        result = execute_query(
            f"SELECT {BLOG_COLUMNS} FROM blog_posts {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [limit, skip]
        )
        if not result:
            return []
        return [_row_to_post(r) for r in parse_rows(result)]

    @staticmethod
    def update_post(post_id: int, post_update: BlogPostUpdate) -> Optional[BlogPostInDB]:
        update_data = post_update.model_dump(exclude_unset=True)
        if not update_data:
            return BlogService.get_post(post_id)

        if "content" in update_data:
            update_data["reading_time"] = BlogService.calculate_reading_time(update_data["content"])
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        _ALLOWED_BLOG_COLUMNS = frozenset({
            "title", "slug", "excerpt", "content", "image_url", "author",
            "tags", "is_published", "is_news_trend", "views", "reading_time", "updated_at",
        })

        set_parts = []
        params: list = []
        for key, value in update_data.items():
            if key not in _ALLOWED_BLOG_COLUMNS:
                continue
            set_parts.append(f"{key} = ?")
            if key == "tags":
                params.append(json.dumps(value))
            elif isinstance(value, bool):
                params.append(int(value))
            else:
                params.append(value)
        params.append(post_id)

        execute_query(
            f"UPDATE blog_posts SET {', '.join(set_parts)} WHERE id = ?",
            params
        )
        return BlogService.get_post(post_id)

    @staticmethod
    def increment_views(slug: str) -> bool:
        result = execute_query(
            "UPDATE blog_posts SET views = views + 1 WHERE slug = ?", [slug]
        )
        return result is not None

    @staticmethod
    def delete_post(post_id: int) -> bool:
        existing = BlogService.get_post(post_id)
        if not existing:
            return False
        execute_query("DELETE FROM blog_posts WHERE id = ?", [post_id])
        return True
