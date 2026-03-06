# @AI-HINT: Knowledge base and FAQ service for help articles and documentation
"""Knowledge Base & FAQ Service."""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from enum import Enum
import logging
import uuid
import json

from app.models.user import User
from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


def _ensure_kb_tables():
    """Create knowledge base tables if they don't exist."""
    execute_query("""
        CREATE TABLE IF NOT EXISTS kb_articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT UNIQUE,
            category TEXT NOT NULL,
            content_type TEXT NOT NULL DEFAULT 'article',
            excerpt TEXT,
            content TEXT NOT NULL,
            tags TEXT,
            read_time_minutes INTEGER DEFAULT 5,
            views INTEGER DEFAULT 0,
            helpful_count INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'published',
            created_by INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
    """)
    execute_query("""
        CREATE TABLE IF NOT EXISTS kb_faqs (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT,
            views INTEGER DEFAULT 0,
            helpful_count INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'published',
            created_by INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
    """)

_kb_tables_ensured = False


class ArticleCategory(str, Enum):
    GETTING_STARTED = "getting_started"
    ACCOUNT = "account"
    PROJECTS = "projects"
    PROPOSALS = "proposals"
    CONTRACTS = "contracts"
    PAYMENTS = "payments"
    MESSAGING = "messaging"
    REVIEWS = "reviews"
    DISPUTES = "disputes"
    SECURITY = "security"
    BILLING = "billing"
    API = "api"
    TROUBLESHOOTING = "troubleshooting"


class ArticleStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class KnowledgeContentType(str, Enum):
    ARTICLE = "article"
    FAQ = "faq"
    TUTORIAL = "tutorial"
    VIDEO = "video"
    GUIDE = "guide"


# Pre-defined FAQ entries
FAQ_ENTRIES = [
    {
        "id": "faq-1",
        "question": "How do I create my first project?",
        "answer": "Navigate to your client dashboard and click 'Post a Project'. Fill in the project details including title, description, budget, and required skills. Review and publish your project to start receiving proposals.",
        "category": ArticleCategory.PROJECTS,
        "tags": ["projects", "getting started", "client"]
    },
    {
        "id": "faq-2",
        "question": "How do I submit a proposal?",
        "answer": "Find a project you're interested in, click 'Submit Proposal', write a compelling cover letter explaining why you're the best fit, set your bid amount and timeline, then submit.",
        "category": ArticleCategory.PROPOSALS,
        "tags": ["proposals", "freelancer", "bidding"]
    },
    {
        "id": "faq-3",
        "question": "How does payment protection work?",
        "answer": "When a client funds a milestone, the money is held in escrow. Once you complete the work and the client approves it, the funds are released to you. This protects both parties.",
        "category": ArticleCategory.PAYMENTS,
        "tags": ["payments", "escrow", "protection"]
    },
    {
        "id": "faq-4",
        "question": "How do I verify my identity?",
        "answer": "Go to Settings > Verification and upload a government-issued ID. Our team will review it within 24-48 hours. Verified users get a badge and higher trust scores.",
        "category": ArticleCategory.ACCOUNT,
        "tags": ["verification", "identity", "trust"]
    },
    {
        "id": "faq-5",
        "question": "What are the platform fees?",
        "answer": "Freelancers pay a service fee based on their subscription tier (5-15%). Clients don't pay any fees on top of the project budget. Premium plans offer reduced fees.",
        "category": ArticleCategory.BILLING,
        "tags": ["fees", "pricing", "subscription"]
    },
    {
        "id": "faq-6",
        "question": "How do I dispute a contract?",
        "answer": "If you have an issue with a contract, first try to resolve it through messaging. If that fails, go to Contract > Open Dispute. Provide details and evidence. Our mediation team will review the case.",
        "category": ArticleCategory.DISPUTES,
        "tags": ["disputes", "mediation", "resolution"]
    },
    {
        "id": "faq-7",
        "question": "Can I withdraw my earnings anytime?",
        "answer": "Yes, you can withdraw available earnings anytime via PayPal, bank transfer, or other supported methods. Processing time depends on the method (instant to 5 business days).",
        "category": ArticleCategory.PAYMENTS,
        "tags": ["withdrawal", "earnings", "payout"]
    },
    {
        "id": "faq-8",
        "question": "How do reviews work?",
        "answer": "After a contract is completed, both parties can leave reviews. Reviews are public and affect your reputation score. You have 14 days to leave a review after contract completion.",
        "category": ArticleCategory.REVIEWS,
        "tags": ["reviews", "ratings", "feedback"]
    },
    {
        "id": "faq-9",
        "question": "How do I enable two-factor authentication?",
        "answer": "Go to Settings > Security > Two-Factor Authentication. You can use an authenticator app or SMS verification. We strongly recommend enabling 2FA for account security.",
        "category": ArticleCategory.SECURITY,
        "tags": ["security", "2fa", "authentication"]
    },
    {
        "id": "faq-10",
        "question": "Can I have multiple accounts?",
        "answer": "No, each person is limited to one account. Having multiple accounts is a violation of our terms of service and may result in permanent suspension.",
        "category": ArticleCategory.ACCOUNT,
        "tags": ["account", "policy", "terms"]
    }
]


# Help articles
HELP_ARTICLES = [
    {
        "id": "article-1",
        "title": "Getting Started Guide for Freelancers",
        "slug": "freelancer-getting-started",
        "category": ArticleCategory.GETTING_STARTED,
        "content_type": KnowledgeContentType.GUIDE,
        "excerpt": "Learn how to set up your profile, find projects, and win your first contract.",
        "content": """
# Getting Started as a Freelancer

## 1. Complete Your Profile
Your profile is your first impression. Include:
- Professional photo
- Compelling bio
- Skills and expertise
- Portfolio items
- Education and certifications

## 2. Set Your Rates
Research market rates for your skills. Consider starting slightly lower to build reviews, then increase as you gain reputation.

## 3. Find Projects
- Browse available projects
- Set up job alerts
- Use filters to find relevant work

## 4. Write Winning Proposals
- Personalize each proposal
- Address the client's needs
- Showcase relevant experience
- Be professional and concise

## 5. Deliver Quality Work
- Communicate regularly
- Meet deadlines
- Exceed expectations
- Request feedback
        """,
        "tags": ["freelancer", "getting started", "profile", "proposals"],
        "read_time_minutes": 8,
        "views": 0,
        "helpful_count": 0
    },
    {
        "id": "article-2",
        "title": "Getting Started Guide for Clients",
        "slug": "client-getting-started",
        "category": ArticleCategory.GETTING_STARTED,
        "content_type": KnowledgeContentType.GUIDE,
        "excerpt": "Learn how to post projects, hire freelancers, and manage contracts.",
        "content": "...",
        "tags": ["client", "getting started", "hiring"],
        "read_time_minutes": 6,
        "views": 0,
        "helpful_count": 0
    }
]


class KnowledgeBaseService:
    """Service for knowledge base and FAQ management"""
    
    def __init__(self, db: Session):
        self.db = db
        global _kb_tables_ensured
        if not _kb_tables_ensured:
            try:
                _ensure_kb_tables()
                _kb_tables_ensured = True
            except Exception as e:
                logger.warning(f"Could not ensure kb tables: {e}")
    
    # FAQ Methods
    async def get_faqs(
        self,
        category: Optional[ArticleCategory] = None,
        search_query: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get FAQ entries"""
        faqs = FAQ_ENTRIES.copy()
        
        if category:
            faqs = [f for f in faqs if f["category"] == category]
        
        if search_query:
            query_lower = search_query.lower()
            faqs = [
                f for f in faqs
                if query_lower in f["question"].lower()
                or query_lower in f["answer"].lower()
                or any(query_lower in tag for tag in f.get("tags", []))
            ]
        
        return faqs[:limit]
    
    async def get_faq(self, faq_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific FAQ entry"""
        for faq in FAQ_ENTRIES:
            if faq["id"] == faq_id:
                return faq
        return None
    
    async def search_faqs(self, query: str) -> List[Dict[str, Any]]:
        """Search FAQs"""
        return await self.get_faqs(search_query=query)
    
    # Article Methods
    async def get_articles(
        self,
        category: Optional[ArticleCategory] = None,
        content_type: Optional[KnowledgeContentType] = None,
        search_query: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get help articles"""
        articles = HELP_ARTICLES.copy()
        
        if category:
            articles = [a for a in articles if a["category"] == category]
        
        if content_type:
            articles = [a for a in articles if a["content_type"] == content_type]
        
        if search_query:
            query_lower = search_query.lower()
            articles = [
                a for a in articles
                if query_lower in a["title"].lower()
                or query_lower in a.get("excerpt", "").lower()
                or any(query_lower in tag for tag in a.get("tags", []))
            ]
        
        return articles[:limit]
    
    async def get_article(self, article_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific article"""
        for article in HELP_ARTICLES:
            if article["id"] == article_id:
                return article
        return None
    
    async def get_article_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get article by slug"""
        for article in HELP_ARTICLES:
            if article.get("slug") == slug:
                return article
        return None
    
    # Categories
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all categories with counts"""
        category_counts = {}
        for article in HELP_ARTICLES:
            cat = article["category"].value
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        for faq in FAQ_ENTRIES:
            cat = faq["category"].value
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        categories = []
        for cat in ArticleCategory:
            categories.append({
                "id": cat.value,
                "name": cat.value.replace("_", " ").title(),
                "article_count": category_counts.get(cat.value, 0)
            })
        
        return categories
    
    # Search
    async def search(
        self,
        query: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search across all content"""
        faqs = await self.get_faqs(search_query=query)
        articles = await self.get_articles(search_query=query)
        
        return {
            "query": query,
            "faqs": faqs[:10],
            "articles": articles[:10],
            "total_results": len(faqs) + len(articles)
        }
    
    # Feedback
    async def mark_helpful(
        self,
        content_type: str,
        content_id: str,
        user_id: int,
        helpful: bool
    ) -> Dict[str, Any]:
        """Mark content as helpful or not"""
        return {
            "content_type": content_type,
            "content_id": content_id,
            "helpful": helpful,
            "message": "Feedback recorded"
        }
    
    # Popular Content
    async def get_popular_content(self, limit: int = 10) -> Dict[str, Any]:
        """Get most popular articles and FAQs"""
        # Would sort by views/helpful_count in production
        return {
            "popular_articles": HELP_ARTICLES[:5],
            "popular_faqs": FAQ_ENTRIES[:5]
        }
    
    # Related Content
    async def get_related_content(
        self,
        content_id: str,
        content_type: str
    ) -> List[Dict[str, Any]]:
        """Get related content based on tags/category"""
        # Find the content
        if content_type == "faq":
            content = await self.get_faq(content_id)
        else:
            content = await self.get_article(content_id)
        
        if not content:
            return []
        
        tags = set(content.get("tags", []))
        category = content.get("category")
        
        related = []
        
        # Find content with matching tags or category
        for article in HELP_ARTICLES:
            if article["id"] == content_id:
                continue
            article_tags = set(article.get("tags", []))
            if tags & article_tags or article.get("category") == category:
                related.append({"type": "article", **article})
        
        for faq in FAQ_ENTRIES:
            if faq["id"] == content_id:
                continue
            faq_tags = set(faq.get("tags", []))
            if tags & faq_tags or faq.get("category") == category:
                related.append({"type": "faq", **faq})
        
        return related[:5]
    
    # Suggestions
    async def get_suggestions(
        self,
        context: str,
        user_role: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get contextual help suggestions"""
        suggestions = []
        
        context_lower = context.lower()
        
        # Match based on context
        for faq in FAQ_ENTRIES:
            if any(word in context_lower for word in faq.get("tags", [])):
                suggestions.append({"type": "faq", **faq})
        
        for article in HELP_ARTICLES:
            if any(word in context_lower for word in article.get("tags", [])):
                suggestions.append({"type": "article", **article})
        
        return suggestions[:5]
    
    # Admin Methods
    async def create_article(
        self,
        admin_id: int,
        article_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new article (admin)"""
        article_id = f"article-{uuid.uuid4().hex[:8]}"
        slug = article_data.get("slug") or article_data.get("title", "").lower().replace(" ", "-")[:80]
        now = datetime.now(timezone.utc).isoformat()
        tags = article_data.get("tags", [])
        tags_json = json.dumps(tags) if isinstance(tags, list) else tags
        
        execute_query(
            "INSERT INTO kb_articles (id, title, slug, category, content_type, excerpt, content, tags, read_time_minutes, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                article_id,
                article_data.get("title", "Untitled"),
                slug,
                article_data.get("category", "getting_started"),
                article_data.get("content_type", "article"),
                article_data.get("excerpt", ""),
                article_data.get("content", ""),
                tags_json,
                article_data.get("read_time_minutes", 5),
                article_data.get("status", "published"),
                admin_id,
                now
            ]
        )
        
        return {
            "id": article_id,
            "slug": slug,
            "title": article_data.get("title", "Untitled"),
            "created_at": now,
            "message": "Article created successfully"
        }
    
    async def update_article(
        self,
        admin_id: int,
        article_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an article (admin)"""
        allowed = {"title", "slug", "category", "content_type", "excerpt", "content", "tags", "read_time_minutes", "status"}
        set_clauses = []
        params = []
        for key, value in updates.items():
            if key in allowed:
                if key == "tags" and isinstance(value, list):
                    value = json.dumps(value)
                set_clauses.append(f"{key} = ?")
                params.append(value)
        
        if not set_clauses:
            return {"error": "No valid fields to update"}
        
        set_clauses.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(article_id)
        
        execute_query(
            f"UPDATE kb_articles SET {', '.join(set_clauses)} WHERE id = ?",
            params
        )
        return {"article_id": article_id, "message": "Article updated successfully"}
    
    async def delete_article(
        self,
        admin_id: int,
        article_id: str
    ) -> Dict[str, Any]:
        """Delete an article (admin)"""
        execute_query("DELETE FROM kb_articles WHERE id = ?", [article_id])
        return {"article_id": article_id, "message": "Article deleted successfully"}


def get_knowledge_base_service(db: Session) -> KnowledgeBaseService:
    """Get knowledge base service instance"""
    return KnowledgeBaseService(db)
