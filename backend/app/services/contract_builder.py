# @AI-HINT: Visual contract builder with clause library
"""Contract Builder Service - Visual contract creation with templates and clauses."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import logging
import uuid
logger = logging.getLogger(__name__)


class ClauseCategory(str, Enum):
    PAYMENT = "payment"
    SCOPE = "scope"
    TIMELINE = "timeline"
    IP_RIGHTS = "ip_rights"
    CONFIDENTIALITY = "confidentiality"
    TERMINATION = "termination"
    LIABILITY = "liability"
    DISPUTE = "dispute"
    WARRANTY = "warranty"
    INDEMNIFICATION = "indemnification"


class ContractType(str, Enum):
    FIXED_PRICE = "fixed_price"
    HOURLY = "hourly"
    MILESTONE = "milestone"
    RETAINER = "retainer"
    NDA = "nda"
    CUSTOM = "custom"


class ContractBuilderService:
    """Service for visual contract building."""
    
    def __init__(self):
        pass
    
    # Contract Templates
    async def get_contract_templates(
        self,
        contract_type: Optional[ContractType] = None
    ) -> List[Dict[str, Any]]:
        """Get contract templates."""
        templates = [
            {
                "id": "tpl-fixed",
                "name": "Fixed Price Contract",
                "type": ContractType.FIXED_PRICE.value,
                "description": "Standard contract for fixed-price projects",
                "clauses": ["payment_fixed", "scope_standard", "timeline_fixed", "ip_transfer", "confidentiality_standard"],
                "popularity": 85,
                "last_updated": "2024-01-15"
            },
            {
                "id": "tpl-hourly",
                "name": "Hourly Contract",
                "type": ContractType.HOURLY.value,
                "description": "Contract for hourly-based work with time tracking",
                "clauses": ["payment_hourly", "scope_flexible", "timeline_ongoing", "ip_transfer", "confidentiality_standard"],
                "popularity": 72,
                "last_updated": "2024-01-12"
            },
            {
                "id": "tpl-milestone",
                "name": "Milestone-Based Contract",
                "type": ContractType.MILESTONE.value,
                "description": "Contract with milestone-based payments and deliverables",
                "clauses": ["payment_milestone", "scope_detailed", "timeline_milestone", "ip_transfer", "confidentiality_standard"],
                "popularity": 65,
                "last_updated": "2024-01-10"
            },
            {
                "id": "tpl-nda",
                "name": "Non-Disclosure Agreement",
                "type": ContractType.NDA.value,
                "description": "Standard NDA for protecting confidential information",
                "clauses": ["confidentiality_strict", "termination_nda", "liability_limited", "dispute_arbitration"],
                "popularity": 45,
                "last_updated": "2024-01-08"
            },
            {
                "id": "tpl-retainer",
                "name": "Retainer Agreement",
                "type": ContractType.RETAINER.value,
                "description": "Monthly retainer for ongoing services",
                "clauses": ["payment_retainer", "scope_retainer", "timeline_monthly", "ip_transfer", "confidentiality_standard"],
                "popularity": 38,
                "last_updated": "2024-01-05"
            }
        ]
        
        if contract_type:
            templates = [t for t in templates if t["type"] == contract_type.value]
        
        return templates
    
    async def get_template_details(
        self,
        template_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get full template with content."""
        return {
            "id": template_id,
            "name": "Fixed Price Contract",
            "type": "fixed_price",
            "sections": [
                {
                    "id": "sec-1",
                    "title": "Parties",
                    "content": "This Agreement is entered into by and between {{client_name}} (\"Client\") and {{freelancer_name}} (\"Contractor\").",
                    "order": 1,
                    "is_required": True
                },
                {
                    "id": "sec-2",
                    "title": "Scope of Work",
                    "content": "{{scope_description}}",
                    "order": 2,
                    "is_required": True
                },
                {
                    "id": "sec-3",
                    "title": "Payment Terms",
                    "content": "Client agrees to pay Contractor {{total_amount}} {{currency}} for the completion of the work described above.",
                    "order": 3,
                    "is_required": True
                }
            ],
            "variables": [
                {"name": "client_name", "type": "string", "required": True},
                {"name": "freelancer_name", "type": "string", "required": True},
                {"name": "scope_description", "type": "text", "required": True},
                {"name": "total_amount", "type": "number", "required": True},
                {"name": "currency", "type": "string", "default": "USD"}
            ]
        }
    
    # Clause Library
    async def get_clause_library(
        self,
        category: Optional[ClauseCategory] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get clause library."""
        clauses = [
            {
                "id": "payment_fixed",
                "name": "Fixed Price Payment",
                "category": ClauseCategory.PAYMENT.value,
                "content": "Client agrees to pay Contractor a fixed fee of {{amount}} {{currency}} for the complete work. Payment shall be made {{payment_schedule}}.",
                "variables": ["amount", "currency", "payment_schedule"],
                "tags": ["payment", "fixed", "standard"]
            },
            {
                "id": "payment_hourly",
                "name": "Hourly Payment",
                "category": ClauseCategory.PAYMENT.value,
                "content": "Client agrees to pay Contractor at the rate of {{hourly_rate}} {{currency}} per hour. Contractor will submit timesheets {{timesheet_frequency}}.",
                "variables": ["hourly_rate", "currency", "timesheet_frequency"],
                "tags": ["payment", "hourly", "time-tracking"]
            },
            {
                "id": "payment_milestone",
                "name": "Milestone Payment",
                "category": ClauseCategory.PAYMENT.value,
                "content": "Payment will be made in milestones as follows: {{milestone_details}}. Each milestone payment will be released upon Client approval.",
                "variables": ["milestone_details"],
                "tags": ["payment", "milestone", "escrow"]
            },
            {
                "id": "ip_transfer",
                "name": "IP Transfer",
                "category": ClauseCategory.IP_RIGHTS.value,
                "content": "Upon full payment, Contractor assigns to Client all intellectual property rights in the deliverables, including copyrights, patents, and trade secrets.",
                "variables": [],
                "tags": ["ip", "copyright", "ownership"]
            },
            {
                "id": "ip_license",
                "name": "IP License",
                "category": ClauseCategory.IP_RIGHTS.value,
                "content": "Contractor grants Client a {{license_type}} license to use the deliverables for {{permitted_uses}}.",
                "variables": ["license_type", "permitted_uses"],
                "tags": ["ip", "license", "usage-rights"]
            },
            {
                "id": "confidentiality_standard",
                "name": "Standard Confidentiality",
                "category": ClauseCategory.CONFIDENTIALITY.value,
                "content": "Both parties agree to keep confidential all proprietary information disclosed during the project. This obligation survives for {{confidentiality_period}} after termination.",
                "variables": ["confidentiality_period"],
                "tags": ["confidentiality", "nda", "standard"]
            },
            {
                "id": "confidentiality_strict",
                "name": "Strict Confidentiality",
                "category": ClauseCategory.CONFIDENTIALITY.value,
                "content": "Receiving party agrees to: (a) hold confidential information in strict confidence; (b) not disclose to any third party; (c) use only for the agreed purpose; (d) return or destroy upon request.",
                "variables": [],
                "tags": ["confidentiality", "nda", "strict"]
            },
            {
                "id": "termination_standard",
                "name": "Standard Termination",
                "category": ClauseCategory.TERMINATION.value,
                "content": "Either party may terminate this Agreement with {{notice_period}} written notice. Upon termination, Client pays for work completed to date.",
                "variables": ["notice_period"],
                "tags": ["termination", "notice", "standard"]
            },
            {
                "id": "liability_limited",
                "name": "Limited Liability",
                "category": ClauseCategory.LIABILITY.value,
                "content": "Contractor's total liability shall not exceed {{liability_cap}}. Neither party shall be liable for indirect, incidental, or consequential damages.",
                "variables": ["liability_cap"],
                "tags": ["liability", "cap", "limitation"]
            },
            {
                "id": "dispute_arbitration",
                "name": "Arbitration",
                "category": ClauseCategory.DISPUTE.value,
                "content": "Any disputes shall be resolved through binding arbitration in {{arbitration_location}} under {{arbitration_rules}} rules.",
                "variables": ["arbitration_location", "arbitration_rules"],
                "tags": ["dispute", "arbitration", "resolution"]
            }
        ]
        
        if category:
            clauses = [c for c in clauses if c["category"] == category.value]
        
        if search:
            search_lower = search.lower()
            clauses = [c for c in clauses if search_lower in c["name"].lower() or search_lower in c["content"].lower()]
        
        return clauses
    
    async def get_clause(
        self,
        clause_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get clause details."""
        clauses = await self.get_clause_library()
        return next((c for c in clauses if c["id"] == clause_id), None)
    
    # Contract Building
    async def create_contract_draft(
        self,
        user_id: int,
        name: str,
        template_id: Optional[str] = None,
        contract_type: ContractType = ContractType.CUSTOM
    ) -> Dict[str, Any]:
        """Create a new contract draft."""
        contract_id = str(uuid.uuid4())
        
        sections = []
        if template_id:
            template = await self.get_template_details(template_id)
            if template:
                sections = template.get("sections", [])
        
        contract = {
            "id": contract_id,
            "user_id": user_id,
            "name": name,
            "type": contract_type.value,
            "template_id": template_id,
            "status": "draft",
            "sections": sections,
            "variables": {},
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        return contract
    
    async def add_section(
        self,
        contract_id: str,
        user_id: int,
        title: str,
        content: str,
        order: Optional[int] = None
    ) -> Dict[str, Any]:
        """Add a section to contract."""
        section = {
            "id": str(uuid.uuid4()),
            "title": title,
            "content": content,
            "order": order or 999,
            "is_required": False,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        
        return section
    
    async def add_clause(
        self,
        contract_id: str,
        user_id: int,
        clause_id: str,
        section_id: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Add a clause from library to contract."""
        clause = await self.get_clause(clause_id)
        if not clause:
            return {"success": False, "error": "Clause not found"}
        
        # Apply variables
        content = clause["content"]
        if variables:
            for var, value in variables.items():
                content = content.replace(f"{{{{{var}}}}}", str(value))
        
        return {
            "success": True,
            "clause_id": clause_id,
            "section_id": section_id,
            "content": content
        }
    
    async def update_section(
        self,
        contract_id: str,
        user_id: int,
        section_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a contract section."""
        return {
            "section_id": section_id,
            **updates,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def remove_section(
        self,
        contract_id: str,
        user_id: int,
        section_id: str
    ) -> bool:
        """Remove a section from contract."""
        return True
    
    async def reorder_sections(
        self,
        contract_id: str,
        user_id: int,
        section_order: List[str]
    ) -> Dict[str, Any]:
        """Reorder contract sections."""
        return {
            "contract_id": contract_id,
            "section_order": section_order,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def set_variables(
        self,
        contract_id: str,
        user_id: int,
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Set contract variables."""
        return {
            "contract_id": contract_id,
            "variables": variables,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def preview_contract(
        self,
        contract_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Preview contract with variables applied."""
        return {
            "contract_id": contract_id,
            "html": "<html><body><h1>Contract Preview</h1><p>Contract content with variables applied...</p></body></html>",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def export_contract(
        self,
        contract_id: str,
        user_id: int,
        format: str = "pdf"  # pdf, docx, html
    ) -> Dict[str, Any]:
        """Export contract to file."""
        return {
            "contract_id": contract_id,
            "format": format,
            "download_url": f"/api/contracts/{contract_id}/download/{format}",
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        }
    
    # Version Control
    async def create_version(
        self,
        contract_id: str,
        user_id: int,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new version of the contract."""
        return {
            "contract_id": contract_id,
            "version": 2,
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_versions(
        self,
        contract_id: str,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get contract version history."""
        return [
            {
                "version": 1,
                "created_at": "2024-01-10T10:00:00",
                "created_by": "John Doe",
                "notes": "Initial draft"
            },
            {
                "version": 2,
                "created_at": "2024-01-12T14:30:00",
                "created_by": "John Doe",
                "notes": "Added payment terms"
            }
        ]
    
    async def compare_versions(
        self,
        contract_id: str,
        user_id: int,
        version_a: int,
        version_b: int
    ) -> Dict[str, Any]:
        """Compare two contract versions."""
        return {
            "contract_id": contract_id,
            "version_a": version_a,
            "version_b": version_b,
            "changes": [
                {
                    "section": "Payment Terms",
                    "type": "modified",
                    "old_value": "$5,000",
                    "new_value": "$6,000"
                },
                {
                    "section": "Timeline",
                    "type": "added",
                    "new_value": "Project deadline: February 28, 2024"
                }
            ]
        }
    
    # Custom Clauses
    async def create_custom_clause(
        self,
        user_id: int,
        name: str,
        category: ClauseCategory,
        content: str,
        variables: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a custom clause."""
        return {
            "id": f"custom-{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "name": name,
            "category": category.value,
            "content": content,
            "variables": variables or [],
            "is_custom": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_user_custom_clauses(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get user's custom clauses."""
        return [
            {
                "id": "custom-abc123",
                "name": "My Payment Terms",
                "category": "payment",
                "is_custom": True,
                "created_at": "2024-01-05T00:00:00"
            }
        ]


_singleton_contract_builder_service = None

def get_contract_builder_service() -> ContractBuilderService:
    """Factory function for contract builder service."""
    global _singleton_contract_builder_service
    if _singleton_contract_builder_service is None:
        _singleton_contract_builder_service = ContractBuilderService()
    return _singleton_contract_builder_service
