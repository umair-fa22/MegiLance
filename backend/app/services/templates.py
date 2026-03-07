# @AI-HINT: Templates service for reusable project/proposal/contract templates
"""Templates Service - Reusable template management."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel


class TemplateType(str, Enum):
    PROJECT = "project"
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    MILESTONE = "milestone"
    MESSAGE = "message"
    INVOICE = "invoice"


class TemplateCategory(str, Enum):
    WEB_DEVELOPMENT = "web_development"
    MOBILE_APP = "mobile_app"
    DESIGN = "design"
    WRITING = "writing"
    MARKETING = "marketing"
    DATA_SCIENCE = "data_science"
    VIDEO_PRODUCTION = "video_production"
    CONSULTING = "consulting"
    OTHER = "other"


class TemplateVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    MARKETPLACE = "marketplace"


class Template(BaseModel):
    """Template data model."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    template_type: TemplateType
    category: TemplateCategory
    visibility: TemplateVisibility = TemplateVisibility.PRIVATE
    content: Dict[str, Any]
    variables: List[Dict[str, Any]] = []  # Placeholder variables
    tags: List[str] = []
    usage_count: int = 0
    rating: float = 0.0
    rating_count: int = 0
    price: Optional[float] = None  # For marketplace templates
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime


class TemplatesService:
    """Service for managing reusable templates."""
    
    def __init__(self):
        # In-memory storage for demo
        self._templates: Dict[str, Template] = {}
        self._user_favorites: Dict[str, List[str]] = {}
        self._init_default_templates()
    
    def _init_default_templates(self):
        """Initialize system default templates."""
        default_templates = [
            {
                "id": "tpl_project_web",
                "user_id": "system",
                "name": "Standard Web Development Project",
                "description": "Complete web development project template with all essential milestones",
                "template_type": TemplateType.PROJECT,
                "category": TemplateCategory.WEB_DEVELOPMENT,
                "visibility": TemplateVisibility.PUBLIC,
                "content": {
                    "title": "{{project_name}} - Web Development",
                    "description": "Professional web development project for {{client_name}}",
                    "budget_min": 1000,
                    "budget_max": 5000,
                    "duration_days": 30,
                    "skills_required": ["HTML", "CSS", "JavaScript", "React"],
                    "deliverables": [
                        "Responsive design",
                        "SEO optimization",
                        "Performance optimization",
                        "Cross-browser compatibility"
                    ]
                },
                "variables": [
                    {"name": "project_name", "type": "string", "required": True},
                    {"name": "client_name", "type": "string", "required": True}
                ],
                "tags": ["web", "development", "frontend"],
                "is_featured": True
            },
            {
                "id": "tpl_proposal_standard",
                "user_id": "system",
                "name": "Professional Proposal Template",
                "description": "Winning proposal template with all key sections",
                "template_type": TemplateType.PROPOSAL,
                "category": TemplateCategory.OTHER,
                "visibility": TemplateVisibility.PUBLIC,
                "content": {
                    "cover_letter": "Dear {{client_name}},\n\nI am excited to submit my proposal for {{project_name}}. With {{years_experience}} years of experience in {{expertise_area}}, I am confident I can deliver exceptional results.\n\n{{custom_pitch}}\n\nLooking forward to discussing this opportunity.\n\nBest regards,\n{{freelancer_name}}",
                    "timeline": "{{estimated_duration}} days",
                    "milestones": [
                        {"name": "Discovery & Planning", "percentage": 20},
                        {"name": "Development Phase 1", "percentage": 30},
                        {"name": "Development Phase 2", "percentage": 30},
                        {"name": "Testing & Delivery", "percentage": 20}
                    ],
                    "terms": "Payment upon milestone completion. Revisions included."
                },
                "variables": [
                    {"name": "client_name", "type": "string", "required": True},
                    {"name": "project_name", "type": "string", "required": True},
                    {"name": "years_experience", "type": "number", "required": True},
                    {"name": "expertise_area", "type": "string", "required": True},
                    {"name": "custom_pitch", "type": "text", "required": True},
                    {"name": "freelancer_name", "type": "string", "required": True},
                    {"name": "estimated_duration", "type": "number", "required": True}
                ],
                "tags": ["proposal", "professional", "winning"],
                "is_featured": True
            },
            {
                "id": "tpl_contract_standard",
                "user_id": "system",
                "name": "Standard Service Agreement",
                "description": "Professional contract template for freelance services",
                "template_type": TemplateType.CONTRACT,
                "category": TemplateCategory.OTHER,
                "visibility": TemplateVisibility.PUBLIC,
                "content": {
                    "title": "Service Agreement - {{project_name}}",
                    "parties": {
                        "client": "{{client_name}} ({{client_email}})",
                        "freelancer": "{{freelancer_name}} ({{freelancer_email}})"
                    },
                    "scope_of_work": "{{scope_description}}",
                    "payment_terms": {
                        "total_amount": "{{total_amount}}",
                        "payment_schedule": "{{payment_schedule}}",
                        "payment_method": "Escrow via MegiLance"
                    },
                    "timeline": {
                        "start_date": "{{start_date}}",
                        "end_date": "{{end_date}}"
                    },
                    "intellectual_property": "All work product created shall be owned by Client upon full payment.",
                    "confidentiality": "Both parties agree to maintain confidentiality of proprietary information.",
                    "termination": "Either party may terminate with 7 days written notice. Payment due for completed work."
                },
                "variables": [
                    {"name": "project_name", "type": "string", "required": True},
                    {"name": "client_name", "type": "string", "required": True},
                    {"name": "client_email", "type": "email", "required": True},
                    {"name": "freelancer_name", "type": "string", "required": True},
                    {"name": "freelancer_email", "type": "email", "required": True},
                    {"name": "scope_description", "type": "text", "required": True},
                    {"name": "total_amount", "type": "currency", "required": True},
                    {"name": "payment_schedule", "type": "string", "required": True},
                    {"name": "start_date", "type": "date", "required": True},
                    {"name": "end_date", "type": "date", "required": True}
                ],
                "tags": ["contract", "legal", "agreement"],
                "is_featured": True
            },
            {
                "id": "tpl_milestones_agile",
                "user_id": "system",
                "name": "Agile Sprint Milestones",
                "description": "2-week sprint-based milestone structure",
                "template_type": TemplateType.MILESTONE,
                "category": TemplateCategory.WEB_DEVELOPMENT,
                "visibility": TemplateVisibility.PUBLIC,
                "content": {
                    "sprint_duration": 14,
                    "milestones": [
                        {
                            "name": "Sprint 1 - Foundation",
                            "description": "Setup, architecture, and core functionality",
                            "duration_days": 14,
                            "percentage": 25,
                            "deliverables": ["Project setup", "Core architecture", "Basic functionality"]
                        },
                        {
                            "name": "Sprint 2 - Core Features",
                            "description": "Main feature development",
                            "duration_days": 14,
                            "percentage": 30,
                            "deliverables": ["Feature A", "Feature B", "Unit tests"]
                        },
                        {
                            "name": "Sprint 3 - Advanced Features",
                            "description": "Secondary features and integrations",
                            "duration_days": 14,
                            "percentage": 25,
                            "deliverables": ["Feature C", "Integrations", "API documentation"]
                        },
                        {
                            "name": "Sprint 4 - Polish & Launch",
                            "description": "Testing, bug fixes, and deployment",
                            "duration_days": 14,
                            "percentage": 20,
                            "deliverables": ["QA testing", "Bug fixes", "Deployment", "Documentation"]
                        }
                    ]
                },
                "variables": [],
                "tags": ["agile", "sprint", "milestones"],
                "is_featured": True
            }
        ]
        
        for tpl_data in default_templates:
            tpl = Template(
                **tpl_data,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            self._templates[tpl.id] = tpl
    
    async def create_template(
        self,
        user_id: str,
        name: str,
        template_type: TemplateType,
        category: TemplateCategory,
        content: Dict[str, Any],
        description: Optional[str] = None,
        variables: Optional[List[Dict[str, Any]]] = None,
        tags: Optional[List[str]] = None,
        visibility: TemplateVisibility = TemplateVisibility.PRIVATE,
        price: Optional[float] = None
    ) -> Template:
        """Create a new template."""
        import uuid
        template_id = f"tpl_{uuid.uuid4().hex[:12]}"
        
        template = Template(
            id=template_id,
            user_id=user_id,
            name=name,
            description=description,
            template_type=template_type,
            category=category,
            visibility=visibility,
            content=content,
            variables=variables or [],
            tags=tags or [],
            price=price,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        self._templates[template_id] = template
        return template
    
    async def get_template(self, template_id: str) -> Optional[Template]:
        """Get a template by ID."""
        return self._templates.get(template_id)
    
    async def get_user_templates(
        self,
        user_id: str,
        template_type: Optional[TemplateType] = None
    ) -> List[Template]:
        """Get all templates owned by a user."""
        templates = [
            t for t in self._templates.values()
            if t.user_id == user_id
        ]
        
        if template_type:
            templates = [t for t in templates if t.template_type == template_type]
        
        return sorted(templates, key=lambda t: t.updated_at, reverse=True)
    
    async def get_public_templates(
        self,
        template_type: Optional[TemplateType] = None,
        category: Optional[TemplateCategory] = None,
        search_query: Optional[str] = None,
        featured_only: bool = False,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get public/marketplace templates."""
        templates = [
            t for t in self._templates.values()
            if t.visibility in [TemplateVisibility.PUBLIC, TemplateVisibility.MARKETPLACE]
        ]
        
        if template_type:
            templates = [t for t in templates if t.template_type == template_type]
        
        if category:
            templates = [t for t in templates if t.category == category]
        
        if search_query:
            query = search_query.lower()
            templates = [
                t for t in templates
                if query in t.name.lower() or 
                   (t.description and query in t.description.lower()) or
                   any(query in tag.lower() for tag in t.tags)
            ]
        
        if featured_only:
            templates = [t for t in templates if t.is_featured]
        
        # Sort by popularity
        templates = sorted(templates, key=lambda t: (t.is_featured, t.usage_count), reverse=True)
        
        total = len(templates)
        templates = templates[offset:offset + limit]
        
        return {
            "templates": templates,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    
    async def update_template(
        self,
        template_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Template]:
        """Update an existing template."""
        template = self._templates.get(template_id)
        if not template or template.user_id != user_id:
            return None
        
        allowed_fields = [
            "name", "description", "content", "variables", 
            "tags", "visibility", "category", "price"
        ]
        
        template_dict = template.dict()
        for field in allowed_fields:
            if field in updates:
                template_dict[field] = updates[field]
        
        template_dict["updated_at"] = datetime.now(timezone.utc)
        
        updated_template = Template(**template_dict)
        self._templates[template_id] = updated_template
        return updated_template
    
    async def delete_template(self, template_id: str, user_id: str) -> bool:
        """Delete a template."""
        template = self._templates.get(template_id)
        if not template or template.user_id != user_id:
            return False
        
        del self._templates[template_id]
        return True
    
    async def duplicate_template(
        self,
        template_id: str,
        user_id: str,
        new_name: Optional[str] = None
    ) -> Optional[Template]:
        """Duplicate a template."""
        original = self._templates.get(template_id)
        if not original:
            return None
        
        # Check access
        if original.visibility == TemplateVisibility.PRIVATE and original.user_id != user_id:
            return None
        
        import uuid
        new_id = f"tpl_{uuid.uuid4().hex[:12]}"
        
        new_template = Template(
            id=new_id,
            user_id=user_id,
            name=new_name or f"{original.name} (Copy)",
            description=original.description,
            template_type=original.template_type,
            category=original.category,
            visibility=TemplateVisibility.PRIVATE,
            content=original.content.copy(),
            variables=original.variables.copy(),
            tags=original.tags.copy(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        self._templates[new_id] = new_template
        
        # Increment usage count on original
        original.usage_count += 1
        
        return new_template
    
    async def apply_template(
        self,
        template_id: str,
        variables: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Apply variables to a template and return rendered content."""
        template = self._templates.get(template_id)
        if not template:
            return None
        
        # Deep copy content
        import json
        content_str = json.dumps(template.content)
        
        # Replace variables
        for var in template.variables:
            var_name = var["name"]
            if var_name in variables:
                placeholder = f"{{{{{var_name}}}}}"
                value = str(variables[var_name])
                content_str = content_str.replace(placeholder, value)
        
        # Increment usage count
        template.usage_count += 1
        
        return {
            "template_id": template_id,
            "template_name": template.name,
            "rendered_content": json.loads(content_str),
            "applied_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def rate_template(
        self,
        template_id: str,
        user_id: str,
        rating: float
    ) -> Optional[Template]:
        """Rate a template (1-5 stars)."""
        template = self._templates.get(template_id)
        if not template:
            return None
        
        # Clamp rating
        rating = max(1, min(5, rating))
        
        # Update rating (simple average)
        total_rating = template.rating * template.rating_count + rating
        template.rating_count += 1
        template.rating = total_rating / template.rating_count
        
        return template
    
    async def add_to_favorites(self, user_id: str, template_id: str) -> bool:
        """Add template to user's favorites."""
        if template_id not in self._templates:
            return False
        
        if user_id not in self._user_favorites:
            self._user_favorites[user_id] = []
        
        if template_id not in self._user_favorites[user_id]:
            self._user_favorites[user_id].append(template_id)
        
        return True
    
    async def remove_from_favorites(self, user_id: str, template_id: str) -> bool:
        """Remove template from user's favorites."""
        if user_id not in self._user_favorites:
            return False
        
        if template_id in self._user_favorites[user_id]:
            self._user_favorites[user_id].remove(template_id)
            return True
        
        return False
    
    async def get_favorites(self, user_id: str) -> List[Template]:
        """Get user's favorite templates."""
        if user_id not in self._user_favorites:
            return []
        
        return [
            self._templates[tid]
            for tid in self._user_favorites[user_id]
            if tid in self._templates
        ]
    
    async def get_template_stats(self, user_id: str) -> Dict[str, Any]:
        """Get template statistics for a user."""
        user_templates = [
            t for t in self._templates.values()
            if t.user_id == user_id
        ]
        
        return {
            "total_templates": len(user_templates),
            "by_type": {
                ttype.value: len([t for t in user_templates if t.template_type == ttype])
                for ttype in TemplateType
            },
            "total_usage": sum(t.usage_count for t in user_templates),
            "avg_rating": (
                sum(t.rating for t in user_templates if t.rating > 0) / 
                len([t for t in user_templates if t.rating > 0])
                if any(t.rating > 0 for t in user_templates) else 0
            ),
            "marketplace_templates": len([
                t for t in user_templates 
                if t.visibility == TemplateVisibility.MARKETPLACE
            ])
        }


_singleton_templates_service = None

def get_templates_service() -> TemplatesService:
    """Get templates service instance."""
    global _singleton_templates_service
    if _singleton_templates_service is None:
        _singleton_templates_service = TemplatesService()
    return _singleton_templates_service
