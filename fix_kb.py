import re

with open("E:/MegiLance/backend/app/services/knowledge_base.py", "r", encoding="utf-8") as f:
    text = f.read()

new_get_faqs = """    async def get_faqs(
        self,
        category: Optional[ArticleCategory] = None,
        search_query: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        \"\"\"Get FAQ entries from database with fallback to defaults\"\"\"
        try:
            from app.db.turso_http import execute_query, parse_rows
            
            query = "SELECT * FROM kb_faqs WHERE status = 'published'"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
                
            if search_query:
                query += " AND (question LIKE ? OR answer LIKE ?)"
                params.extend([f"%{search_query}%", f"%{search_query}%"])
                
            query += " ORDER BY helpful_count DESC, views DESC LIMIT ?"
            params.append(limit)
            
            result = execute_query(query, params)
            db_faqs = parse_rows(result)
            
            if not db_faqs and not search_query:
                # Fallback to default if DB is empty and no specific search
                faqs = FAQ_ENTRIES.copy()
                if category:
                    faqs = [f for f in faqs if f["category"] == category]
                return faqs[:limit]
            
            # Format results
            formatted_faqs = []
            for row in db_faqs:
                row_dict = dict(row)
                if isinstance(row_dict.get("tags"), str) and row_dict["tags"]:
                    try:
                        import json
                        row_dict["tags"] = json.loads(row_dict["tags"])
                    except:
                        pass
                formatted_faqs.append(row_dict)
                
            return formatted_faqs
        except Exception as e:
            logger.error(f"Error fetching FAQs: {e}")
            # Fallback to static
            faqs = FAQ_ENTRIES.copy()
            if category:
                faqs = [f for f in faqs if f["category"] == category]
            if search_query:
                query_lower = search_query.lower()
                faqs = [f for f in faqs if query_lower in f["question"].lower() or query_lower in f["answer"].lower()]
            return faqs[:limit]"""

text = re.sub(r'    async def get_faqs\([\s\S]*?\]\n', new_get_faqs + "\n", text, count=1)


new_get_articles = """    async def get_articles(
        self,
        category: Optional[ArticleCategory] = None,
        content_type: Optional[KnowledgeContentType] = None,
        search_query: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        \"\"\"Get help articles from database\"\"\"
        try:
            from app.db.turso_http import execute_query, parse_rows
            
            query = "SELECT * FROM kb_articles WHERE status = 'published'"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
                
            if content_type:
                query += " AND content_type = ?"
                params.append(content_type)
                
            if search_query:
                query += " AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)"
                params.extend([f"%{search_query}%", f"%{search_query}%", f"%{search_query}%"])
                
            query += " ORDER BY helpful_count DESC, created_at DESC LIMIT ?"
            params.append(limit)
            
            result = execute_query(query, params)
            db_articles = parse_rows(result)
            
            if not db_articles and not search_query:
                articles = HELP_ARTICLES.copy()
                if category:
                    articles = [a for a in articles if a["category"] == category]
                if content_type:
                    articles = [a for a in articles if a["content_type"] == content_type]
                return articles[:limit]
                
            formatted_articles = []
            for row in db_articles:
                row_dict = dict(row)
                if isinstance(row_dict.get("tags"), str) and row_dict["tags"]:
                    try:
                        import json
                        row_dict["tags"] = json.loads(row_dict["tags"])
                    except:
                        pass
                formatted_articles.append(row_dict)
                
            return formatted_articles
        except Exception as e:
            logger.error(f"Error fetching articles: {e}")
            articles = HELP_ARTICLES.copy()
            if category:
                articles = [a for a in articles if a["category"] == category]
            if content_type:
                articles = [a for a in articles if a["content_type"] == content_type]
            if search_query:
                query_lower = search_query.lower()
                articles = [a for a in articles if query_lower in a["title"].lower() or query_lower in a["content"].lower()]
            return articles[:limit]"""

text = re.sub(r'    async def get_articles\([\s\S]*?\]\n', new_get_articles + "\n", text, count=1)

with open("E:/MegiLance/backend/app/services/knowledge_base.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Injected actual DB calls to KB!")
