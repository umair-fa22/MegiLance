# @AI-HINT: Comments service - threaded commenting system for projects, proposals, and deliverables
"""Comments Service - Threaded Discussion System."""

import logging
import uuid
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from collections import defaultdict
logger = logging.getLogger(__name__)


class CommentsService:
    """Service for managing comments and discussions."""
    
    # Comment types by resource
    COMMENT_TYPES = [
        "project", "proposal", "deliverable", "milestone",
        "contract", "portfolio", "review", "dispute", "task"
    ]
    
    # Available reactions
    REACTIONS = {
        "thumbs_up": "👍",
        "thumbs_down": "👎",
        "heart": "❤️",
        "laugh": "😄",
        "surprised": "😮",
        "sad": "😢",
        "thinking": "🤔",
        "celebrate": "🎉",
        "fire": "🔥",
        "rocket": "🚀"
    }
    
    # Max comment depth for threading
    MAX_DEPTH = 5
    
    def __init__(self):
        # In-memory storage
        self._comments: Dict[str, Dict] = {}  # comment_id -> comment
        self._resource_comments: Dict[str, List[str]] = defaultdict(list)  # resource_key -> [comment_ids]
        self._user_mentions: Dict[str, List[str]] = defaultdict(list)  # user_id -> [comment_ids where mentioned]
        self._edit_history: Dict[str, List[Dict]] = defaultdict(list)  # comment_id -> edits
    
    def _generate_resource_key(self, resource_type: str, resource_id: str) -> str:
        """Generate key for resource comment lookup."""
        return f"{resource_type}:{resource_id}"
    
    def _extract_mentions(self, content: str) -> List[str]:
        """Extract @mentions from comment content."""
        pattern = r'@(\w+)'
        return re.findall(pattern, content)
    
    def _render_markdown(self, content: str) -> str:
        """Basic markdown rendering (in production use proper library)."""
        # Bold
        content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
        # Italic
        content = re.sub(r'\*(.+?)\*', r'<em>\1</em>', content)
        # Code
        content = re.sub(r'`(.+?)`', r'<code>\1</code>', content)
        # Links
        content = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', content)
        return content
    
    async def create_comment(
        self,
        user_id: str,
        resource_type: str,
        resource_id: str,
        content: str,
        parent_comment_id: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Create a new comment.
        
        Args:
            user_id: Author's user ID
            resource_type: Type of resource being commented on
            resource_id: ID of the resource
            content: Comment content (supports Markdown)
            parent_comment_id: For replies/threading
            attachments: Optional file attachments
        """
        if resource_type not in self.COMMENT_TYPES:
            raise ValueError(f"Invalid resource type. Must be one of: {self.COMMENT_TYPES}")
        
        # Check nesting depth
        depth = 0
        if parent_comment_id:
            parent = self._comments.get(parent_comment_id)
            if not parent:
                raise ValueError("Parent comment not found")
            depth = parent.get("depth", 0) + 1
            if depth > self.MAX_DEPTH:
                raise ValueError(f"Maximum comment depth ({self.MAX_DEPTH}) exceeded")
        
        comment_id = str(uuid.uuid4())
        resource_key = self._generate_resource_key(resource_type, resource_id)
        
        # Extract mentions
        mentions = self._extract_mentions(content)
        
        comment = {
            "id": comment_id,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "resource_key": resource_key,
            "content": content,
            "content_html": self._render_markdown(content),
            "parent_id": parent_comment_id,
            "depth": depth,
            "mentions": mentions,
            "attachments": attachments or [],
            "reactions": {},
            "reply_count": 0,
            "is_edited": False,
            "is_pinned": False,
            "is_resolved": False,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._comments[comment_id] = comment
        self._resource_comments[resource_key].append(comment_id)
        
        # Track mentions
        for mention in mentions:
            self._user_mentions[mention].append(comment_id)
        
        # Update parent reply count
        if parent_comment_id and parent_comment_id in self._comments:
            self._comments[parent_comment_id]["reply_count"] += 1
        
        return {
            "success": True,
            "comment": comment
        }
    
    async def get_comments(
        self,
        resource_type: str,
        resource_id: str,
        include_deleted: bool = False,
        sort: str = "newest",  # newest, oldest, top
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get comments for a resource.
        
        Returns flat list with threading info (parent_id, depth).
        """
        resource_key = self._generate_resource_key(resource_type, resource_id)
        comment_ids = self._resource_comments.get(resource_key, [])
        
        comments = []
        for cid in comment_ids:
            comment = self._comments.get(cid)
            if comment:
                if not include_deleted and comment.get("is_deleted"):
                    continue
                comments.append(comment)
        
        # Sort
        if sort == "newest":
            comments.sort(key=lambda x: x["created_at"], reverse=True)
        elif sort == "oldest":
            comments.sort(key=lambda x: x["created_at"])
        elif sort == "top":
            # Sort by reaction count
            comments.sort(key=lambda x: sum(len(r) for r in x.get("reactions", {}).values()), reverse=True)
        
        # Paginate
        paginated = comments[offset:offset + limit]
        
        return {
            "comments": paginated,
            "total": len(comments),
            "has_more": len(comments) > offset + limit
        }
    
    async def get_threaded_comments(
        self,
        resource_type: str,
        resource_id: str,
        include_deleted: bool = False
    ) -> Dict[str, Any]:
        """
        Get comments organized as a thread tree.
        """
        flat_result = await self.get_comments(
            db=db,
            resource_type=resource_type,
            resource_id=resource_id,
            include_deleted=include_deleted,
            sort="oldest",
            limit=1000
        )
        
        comments = flat_result["comments"]
        
        # Build tree
        root_comments = []
        comment_map = {c["id"]: {**c, "replies": []} for c in comments}
        
        for comment in comments:
            comment_with_replies = comment_map[comment["id"]]
            parent_id = comment.get("parent_id")
            
            if parent_id and parent_id in comment_map:
                comment_map[parent_id]["replies"].append(comment_with_replies)
            else:
                root_comments.append(comment_with_replies)
        
        return {
            "threads": root_comments,
            "total": len(comments)
        }
    
    async def get_comment(
        self,
        comment_id: str
    ) -> Dict[str, Any]:
        """Get a single comment by ID."""
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        return comment
    
    async def update_comment(
        self,
        user_id: str,
        comment_id: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Update a comment's content.
        
        Preserves edit history.
        """
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        if comment["user_id"] != user_id:
            raise ValueError("Can only edit your own comments")
        
        if comment.get("is_deleted"):
            raise ValueError("Cannot edit deleted comment")
        
        # Save to edit history
        self._edit_history[comment_id].append({
            "content": comment["content"],
            "edited_at": comment["updated_at"]
        })
        
        # Update comment
        comment["content"] = content
        comment["content_html"] = self._render_markdown(content)
        comment["mentions"] = self._extract_mentions(content)
        comment["is_edited"] = True
        comment["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        return {
            "success": True,
            "comment": comment
        }
    
    async def delete_comment(
        self,
        user_id: str,
        comment_id: str,
        is_admin: bool = False
    ) -> Dict[str, Any]:
        """
        Soft delete a comment.
        
        Comment remains but content is hidden.
        """
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        if comment["user_id"] != user_id and not is_admin:
            raise ValueError("Can only delete your own comments")
        
        comment["is_deleted"] = True
        comment["deleted_at"] = datetime.now(timezone.utc).isoformat()
        comment["deleted_by"] = user_id
        comment["content"] = "[deleted]"
        comment["content_html"] = "<em>[deleted]</em>"
        
        return {
            "success": True,
            "message": "Comment deleted"
        }
    
    async def add_reaction(
        self,
        user_id: str,
        comment_id: str,
        reaction: str
    ) -> Dict[str, Any]:
        """Add a reaction to a comment."""
        if reaction not in self.REACTIONS:
            raise ValueError(f"Invalid reaction. Must be one of: {list(self.REACTIONS.keys())}")
        
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        if comment.get("is_deleted"):
            raise ValueError("Cannot react to deleted comment")
        
        if reaction not in comment["reactions"]:
            comment["reactions"][reaction] = []
        
        if user_id in comment["reactions"][reaction]:
            return {
                "success": False,
                "message": "Already reacted with this emoji"
            }
        
        comment["reactions"][reaction].append(user_id)
        
        return {
            "success": True,
            "reactions": self._format_reactions(comment["reactions"])
        }
    
    async def remove_reaction(
        self,
        user_id: str,
        comment_id: str,
        reaction: str
    ) -> Dict[str, Any]:
        """Remove a reaction from a comment."""
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        if reaction in comment["reactions"] and user_id in comment["reactions"][reaction]:
            comment["reactions"][reaction].remove(user_id)
            if not comment["reactions"][reaction]:
                del comment["reactions"][reaction]
        
        return {
            "success": True,
            "reactions": self._format_reactions(comment["reactions"])
        }
    
    def _format_reactions(self, reactions: Dict) -> List[Dict]:
        """Format reactions for response."""
        return [
            {
                "type": r_type,
                "emoji": self.REACTIONS[r_type],
                "count": len(users),
                "users": users[:10]  # Limit shown users
            }
            for r_type, users in reactions.items()
            if users
        ]
    
    async def pin_comment(
        self,
        user_id: str,
        comment_id: str,
        is_admin: bool = False
    ) -> Dict[str, Any]:
        """Pin a comment (admin or resource owner only)."""
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        if not is_admin:
            raise ValueError("Only admins can pin comments")
        
        comment["is_pinned"] = True
        comment["pinned_at"] = datetime.now(timezone.utc).isoformat()
        comment["pinned_by"] = user_id
        
        return {
            "success": True,
            "message": "Comment pinned"
        }
    
    async def unpin_comment(
        self,
        user_id: str,
        comment_id: str,
        is_admin: bool = False
    ) -> Dict[str, Any]:
        """Unpin a comment."""
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        comment["is_pinned"] = False
        
        return {
            "success": True,
            "message": "Comment unpinned"
        }
    
    async def resolve_comment(
        self,
        user_id: str,
        comment_id: str
    ) -> Dict[str, Any]:
        """Mark a comment thread as resolved."""
        comment = self._comments.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        comment["is_resolved"] = True
        comment["resolved_at"] = datetime.now(timezone.utc).isoformat()
        comment["resolved_by"] = user_id
        
        return {
            "success": True,
            "message": "Comment marked as resolved"
        }
    
    async def get_edit_history(
        self,
        comment_id: str
    ) -> Dict[str, Any]:
        """Get edit history for a comment."""
        if comment_id not in self._comments:
            raise ValueError("Comment not found")
        
        history = self._edit_history.get(comment_id, [])
        
        return {
            "comment_id": comment_id,
            "edit_count": len(history),
            "history": history
        }
    
    async def get_user_mentions(
        self,
        user_id: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get comments where user is mentioned."""
        mention_ids = self._user_mentions.get(user_id, [])
        
        mentions = []
        for cid in mention_ids[-limit:]:
            comment = self._comments.get(cid)
            if comment and not comment.get("is_deleted"):
                mentions.append(comment)
        
        mentions.reverse()  # Most recent first
        
        return {
            "mentions": mentions,
            "total": len(mention_ids)
        }
    
    async def get_comment_stats(
        self,
        resource_type: str,
        resource_id: str
    ) -> Dict[str, Any]:
        """Get comment statistics for a resource."""
        resource_key = self._generate_resource_key(resource_type, resource_id)
        comment_ids = self._resource_comments.get(resource_key, [])
        
        total = len(comment_ids)
        active = 0
        unique_users = set()
        total_reactions = 0
        
        for cid in comment_ids:
            comment = self._comments.get(cid)
            if comment:
                if not comment.get("is_deleted"):
                    active += 1
                    unique_users.add(comment["user_id"])
                    total_reactions += sum(len(r) for r in comment.get("reactions", {}).values())
        
        return {
            "total_comments": total,
            "active_comments": active,
            "deleted_comments": total - active,
            "unique_commenters": len(unique_users),
            "total_reactions": total_reactions
        }


# Singleton instance
comments_service = CommentsService()
