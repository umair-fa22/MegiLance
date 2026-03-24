# @AI-HINT: Email templates service for customizable system notifications
"""Email Templates Service - Customizable email templates."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel
import logging
import uuid
logger = logging.getLogger(__name__)


class EmailTemplateType(str, Enum):
    # Auth related
    WELCOME = "welcome"
    VERIFY_EMAIL = "verify_email"
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGED = "password_changed"
    LOGIN_ALERT = "login_alert"
    
    # Project related
    PROJECT_POSTED = "project_posted"
    PROJECT_UPDATED = "project_updated"
    PROJECT_COMPLETED = "project_completed"
    PROJECT_MATCH = "project_match"
    
    # Proposal related
    PROPOSAL_RECEIVED = "proposal_received"
    PROPOSAL_ACCEPTED = "proposal_accepted"
    PROPOSAL_REJECTED = "proposal_rejected"
    
    # Contract related
    CONTRACT_CREATED = "contract_created"
    CONTRACT_SIGNED = "contract_signed"
    CONTRACT_COMPLETED = "contract_completed"
    
    # Payment related
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_SENT = "payment_sent"
    PAYMENT_FAILED = "payment_failed"
    INVOICE_CREATED = "invoice_created"
    INVOICE_PAID = "invoice_paid"
    
    # Milestone related
    MILESTONE_DUE = "milestone_due"
    MILESTONE_COMPLETED = "milestone_completed"
    MILESTONE_APPROVED = "milestone_approved"
    
    # Review related
    REVIEW_RECEIVED = "review_received"
    REVIEW_REMINDER = "review_reminder"
    
    # Meeting related
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_REMINDER = "meeting_reminder"
    MEETING_CANCELLED = "meeting_cancelled"
    
    # Digest
    DAILY_DIGEST = "daily_digest"
    WEEKLY_DIGEST = "weekly_digest"
    
    # Custom
    CUSTOM = "custom"


class EmailTemplate(BaseModel):
    """Email template model."""
    id: str
    template_type: EmailTemplateType
    name: str
    subject: str
    html_body: str
    text_body: str
    variables: List[str] = []  # Available variable placeholders
    is_active: bool = True
    is_system: bool = False  # System templates can't be deleted
    created_by: Optional[str] = None
    version: int = 1
    created_at: datetime
    updated_at: datetime


# Default system templates
DEFAULT_TEMPLATES: Dict[str, Dict[str, Any]] = {
    EmailTemplateType.WELCOME.value: {
        "name": "Welcome Email",
        "subject": "Welcome to MegiLance, {{user_name}}!",
        "html_body": """
<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
.header { text-align: center; margin-bottom: 30px; }
.logo { font-size: 24px; font-weight: bold; color: #4573df; }
h1 { color: #1a1a1a; margin: 0; font-size: 28px; }
p { color: #666; line-height: 1.6; }
.button { display: inline-block; background: #4573df; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
</style></head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">MegiLance</div>
    </div>
    <h1>Welcome, {{user_name}}!</h1>
    <p>Thank you for joining MegiLance. We're excited to have you on board!</p>
    <p>Your account has been successfully created. You can now:</p>
    <ul>
        <li>Browse and apply to projects</li>
        <li>Build your professional profile</li>
        <li>Connect with clients and freelancers</li>
    </ul>
    <p style="text-align: center; margin-top: 30px;">
        <a href="{{dashboard_url}}" class="button">Go to Dashboard</a>
    </p>
    <div class="footer">
        <p>© {{year}} MegiLance. All rights reserved.</p>
        <p>If you didn't create this account, please <a href="{{support_url}}">contact support</a>.</p>
    </div>
</div>
</body>
</html>
""",
        "text_body": """Welcome to MegiLance, {{user_name}}!

Thank you for joining MegiLance. We're excited to have you on board!

Your account has been successfully created. You can now:
- Browse and apply to projects
- Build your professional profile
- Connect with clients and freelancers

Go to your dashboard: {{dashboard_url}}

© {{year}} MegiLance. All rights reserved.
""",
        "variables": ["user_name", "dashboard_url", "support_url", "year"],
        "is_system": True
    },
    
    EmailTemplateType.PASSWORD_RESET.value: {
        "name": "Password Reset",
        "subject": "Reset Your MegiLance Password",
        "html_body": """
<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
.header { text-align: center; margin-bottom: 30px; }
.logo { font-size: 24px; font-weight: bold; color: #4573df; }
h1 { color: #1a1a1a; margin: 0; font-size: 24px; }
p { color: #666; line-height: 1.6; }
.button { display: inline-block; background: #4573df; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.code { background: #f0f0f0; padding: 16px; border-radius: 8px; font-size: 32px; letter-spacing: 4px; text-align: center; font-family: monospace; }
.footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
</style></head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">MegiLance</div>
    </div>
    <h1>Password Reset Request</h1>
    <p>Hi {{user_name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
        <a href="{{reset_url}}" class="button">Reset Password</a>
    </p>
    <p>Or use this code: <div class="code">{{reset_code}}</div></p>
    <p>This link will expire in {{expiry_hours}} hours.</p>
    <p style="color: #e81123;"><strong>If you didn't request this, please ignore this email and your password will remain unchanged.</strong></p>
    <div class="footer">
        <p>© {{year}} MegiLance. All rights reserved.</p>
    </div>
</div>
</body>
</html>
""",
        "text_body": """Password Reset Request

Hi {{user_name}},

We received a request to reset your password. Use this link to create a new password:

{{reset_url}}

Or use this code: {{reset_code}}

This link will expire in {{expiry_hours}} hours.

If you didn't request this, please ignore this email and your password will remain unchanged.

© {{year}} MegiLance. All rights reserved.
""",
        "variables": ["user_name", "reset_url", "reset_code", "expiry_hours", "year"],
        "is_system": True
    },
    
    EmailTemplateType.PROPOSAL_RECEIVED.value: {
        "name": "New Proposal Received",
        "subject": "New Proposal for \"{{project_title}}\"",
        "html_body": """
<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
.header { text-align: center; margin-bottom: 30px; }
.logo { font-size: 24px; font-weight: bold; color: #4573df; }
h1 { color: #1a1a1a; margin: 0; font-size: 24px; }
p { color: #666; line-height: 1.6; }
.proposal-card { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
.freelancer { display: flex; align-items: center; margin-bottom: 15px; }
.avatar { width: 50px; height: 50px; border-radius: 50%; background: #4573df; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
.button { display: inline-block; background: #4573df; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
</style></head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">MegiLance</div>
    </div>
    <h1>New Proposal Received!</h1>
    <p>Hi {{client_name}},</p>
    <p>You've received a new proposal for your project "<strong>{{project_title}}</strong>".</p>
    
    <div class="proposal-card">
        <div class="freelancer">
            <div class="avatar">{{freelancer_initials}}</div>
            <div>
                <strong>{{freelancer_name}}</strong><br>
                <span style="color: #999;">{{freelancer_title}}</span>
            </div>
        </div>
        <p><strong>Proposed Amount:</strong> ${{bid_amount}}</p>
        <p><strong>Timeline:</strong> {{delivery_time}}</p>
        <p><strong>Cover Letter:</strong></p>
        <p style="font-style: italic;">{{cover_letter_preview}}</p>
    </div>
    
    <p style="text-align: center;">
        <a href="{{proposal_url}}" class="button">View Full Proposal</a>
    </p>
    <div class="footer">
        <p>© {{year}} MegiLance. All rights reserved.</p>
    </div>
</div>
</body>
</html>
""",
        "text_body": """New Proposal Received!

Hi {{client_name}},

You've received a new proposal for your project "{{project_title}}".

From: {{freelancer_name}} ({{freelancer_title}})
Proposed Amount: ${{bid_amount}}
Timeline: {{delivery_time}}

Cover Letter:
{{cover_letter_preview}}

View the full proposal: {{proposal_url}}

© {{year}} MegiLance. All rights reserved.
""",
        "variables": ["client_name", "project_title", "freelancer_name", "freelancer_initials", "freelancer_title", "bid_amount", "delivery_time", "cover_letter_preview", "proposal_url", "year"],
        "is_system": True
    },
    
    EmailTemplateType.PAYMENT_RECEIVED.value: {
        "name": "Payment Received",
        "subject": "Payment Received: ${{amount}}",
        "html_body": """
<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
.header { text-align: center; margin-bottom: 30px; }
.logo { font-size: 24px; font-weight: bold; color: #4573df; }
h1 { color: #27AE60; margin: 0; font-size: 28px; }
p { color: #666; line-height: 1.6; }
.amount { font-size: 48px; font-weight: bold; color: #27AE60; text-align: center; margin: 30px 0; }
.details { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
.button { display: inline-block; background: #4573df; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
</style></head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">MegiLance</div>
    </div>
    <h1>💰 Payment Received!</h1>
    <div class="amount">${{amount}}</div>
    <p>Great news, {{user_name}}! A payment has been credited to your account.</p>
    
    <div class="details">
        <p><strong>Project:</strong> {{project_title}}</p>
        <p><strong>From:</strong> {{from_name}}</p>
        <p><strong>Date:</strong> {{payment_date}}</p>
        <p><strong>Reference:</strong> {{transaction_id}}</p>
    </div>
    
    <p style="text-align: center;">
        <a href="{{dashboard_url}}" class="button">View in Dashboard</a>
    </p>
    <div class="footer">
        <p>© {{year}} MegiLance. All rights reserved.</p>
    </div>
</div>
</body>
</html>
""",
        "text_body": """Payment Received!

Great news, {{user_name}}! A payment of ${{amount}} has been credited to your account.

Project: {{project_title}}
From: {{from_name}}
Date: {{payment_date}}
Reference: {{transaction_id}}

View in Dashboard: {{dashboard_url}}

© {{year}} MegiLance. All rights reserved.
""",
        "variables": ["user_name", "amount", "project_title", "from_name", "payment_date", "transaction_id", "dashboard_url", "year"],
        "is_system": True
    }
}


class EmailTemplatesService:
    """Service for managing email templates."""
    
    def __init__(self):
        self._templates: Dict[str, EmailTemplate] = {}
        self._init_default_templates()
    
    def _init_default_templates(self):
        """Initialize system default templates."""
        for template_type, config in DEFAULT_TEMPLATES.items():
            template = EmailTemplate(
                id=f"tpl_email_{template_type}",
                template_type=EmailTemplateType(template_type),
                name=config["name"],
                subject=config["subject"],
                html_body=config["html_body"],
                text_body=config["text_body"],
                variables=config["variables"],
                is_system=config.get("is_system", False),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            self._templates[template.id] = template
    
    async def get_template(
        self,
        template_type: EmailTemplateType
    ) -> Optional[EmailTemplate]:
        """Get template by type."""
        for template in self._templates.values():
            if template.template_type == template_type and template.is_active:
                return template
        return None
    
    async def get_template_by_id(self, template_id: str) -> Optional[EmailTemplate]:
        """Get template by ID."""
        return self._templates.get(template_id)
    
    async def list_templates(
        self,
        include_inactive: bool = False
    ) -> List[EmailTemplate]:
        """List all templates."""
        templates = list(self._templates.values())
        
        if not include_inactive:
            templates = [t for t in templates if t.is_active]
        
        return sorted(templates, key=lambda t: t.name)
    
    async def create_template(
        self,
        template_type: EmailTemplateType,
        name: str,
        subject: str,
        html_body: str,
        text_body: str,
        variables: List[str],
        created_by: str
    ) -> EmailTemplate:
        """Create a custom template."""
        template_id = f"tpl_email_{uuid.uuid4().hex[:12]}"
        
        template = EmailTemplate(
            id=template_id,
            template_type=template_type,
            name=name,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            variables=variables,
            is_system=False,
            created_by=created_by,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        self._templates[template_id] = template
        return template
    
    async def update_template(
        self,
        template_id: str,
        updates: Dict[str, Any]
    ) -> Optional[EmailTemplate]:
        """Update a template."""
        template = self._templates.get(template_id)
        if not template:
            return None
        
        allowed_fields = ["name", "subject", "html_body", "text_body", "variables", "is_active"]
        
        template_dict = template.dict()
        for field in allowed_fields:
            if field in updates:
                template_dict[field] = updates[field]
        
        template_dict["version"] = template.version + 1
        template_dict["updated_at"] = datetime.now(timezone.utc)
        
        updated_template = EmailTemplate(**template_dict)
        self._templates[template_id] = updated_template
        return updated_template
    
    async def delete_template(self, template_id: str) -> bool:
        """Delete a template (non-system only)."""
        template = self._templates.get(template_id)
        if not template or template.is_system:
            return False
        
        del self._templates[template_id]
        return True
    
    async def render_template(
        self,
        template_type: EmailTemplateType,
        variables: Dict[str, Any]
    ) -> Optional[Dict[str, str]]:
        """Render a template with variables."""
        template = await self.get_template(template_type)
        if not template:
            return None
        
        # Add common variables
        variables.setdefault("year", datetime.now(timezone.utc).year)
        variables.setdefault("support_url", "https://megilance.com/support")
        variables.setdefault("dashboard_url", "https://megilance.com/dashboard")
        
        subject = template.subject
        html_body = template.html_body
        text_body = template.text_body
        
        # Replace variables
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            subject = subject.replace(placeholder, str(var_value))
            html_body = html_body.replace(placeholder, str(var_value))
            text_body = text_body.replace(placeholder, str(var_value))
        
        return {
            "subject": subject,
            "html_body": html_body,
            "text_body": text_body
        }
    
    async def preview_template(
        self,
        template_id: str,
        sample_data: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, str]]:
        """Preview a template with sample data."""
        template = self._templates.get(template_id)
        if not template:
            return None
        
        # Generate sample data if not provided
        if not sample_data:
            sample_data = {
                "user_name": "John Doe",
                "client_name": "Jane Client",
                "freelancer_name": "Alex Freelancer",
                "freelancer_initials": "AF",
                "freelancer_title": "Full Stack Developer",
                "project_title": "E-commerce Website Development",
                "amount": "2,500.00",
                "bid_amount": "2,500.00",
                "delivery_time": "14 days",
                "cover_letter_preview": "I'm excited to work on this project...",
                "payment_date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
                "transaction_id": "TXN-123456",
                "from_name": "Acme Corp",
                "reset_url": "https://megilance.com/reset/abc123",
                "reset_code": "123456",
                "expiry_hours": "24",
                "proposal_url": "https://megilance.com/proposals/123"
            }
        
        return await self.render_template(template.template_type, sample_data)
    
    async def duplicate_template(
        self,
        template_id: str,
        created_by: str
    ) -> Optional[EmailTemplate]:
        """Duplicate a template."""
        original = self._templates.get(template_id)
        if not original:
            return None
        
        return await self.create_template(
            template_type=EmailTemplateType.CUSTOM,
            name=f"{original.name} (Copy)",
            subject=original.subject,
            html_body=original.html_body,
            text_body=original.text_body,
            variables=original.variables.copy(),
            created_by=created_by
        )


_singleton_email_templates_service = None

def get_email_templates_service() -> EmailTemplatesService:
    """Get email templates service instance."""
    global _singleton_email_templates_service
    if _singleton_email_templates_service is None:
        _singleton_email_templates_service = EmailTemplatesService()
    return _singleton_email_templates_service
