# @AI-HINT: Standalone Contract Builder engine – AI-assisted legal document generation without auth
"""
Contract Builder Engine - Standalone, public contract/agreement builder.
No authentication required. Generates NDAs, freelance contracts, SLAs, service agreements.
Includes clause library, jurisdiction-aware terms, and professional templates.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import hashlib

logger = logging.getLogger("megilance")

# ============================================================================
# Contract Types
# ============================================================================

CONTRACT_TYPES: Dict[str, Dict[str, Any]] = {
    "freelance_service": {
        "label": "Freelance Service Agreement",
        "description": "Standard contract between a client and an independent contractor",
        "icon": "briefcase",
        "common_for": ["Freelancers", "Consultants", "Agencies"],
    },
    "nda": {
        "label": "Non-Disclosure Agreement (NDA)",
        "description": "Protect confidential information shared between parties",
        "icon": "shield",
        "common_for": ["All industries", "Pre-project discussions"],
    },
    "sla": {
        "label": "Service Level Agreement (SLA)",
        "description": "Define service quality standards, uptime, and support terms",
        "icon": "check-circle",
        "common_for": ["SaaS", "IT Services", "Hosting"],
    },
    "partnership": {
        "label": "Partnership Agreement",
        "description": "Terms for business partnerships and joint ventures",
        "icon": "users",
        "common_for": ["Startups", "Joint Ventures", "Co-founders"],
    },
    "consulting": {
        "label": "Consulting Agreement",
        "description": "Professional consulting engagement terms and deliverables",
        "icon": "message-circle",
        "common_for": ["Management Consulting", "IT Advisory", "Strategy"],
    },
    "employment": {
        "label": "Employment Contract",
        "description": "Terms of employment including salary, benefits, and responsibilities",
        "icon": "user-check",
        "common_for": ["Full-time hires", "Part-time positions"],
    },
    "subcontractor": {
        "label": "Subcontractor Agreement",
        "description": "Engage subcontractors for project work under your lead",
        "icon": "git-branch",
        "common_for": ["Agencies", "General Contractors"],
    },
    "licensing": {
        "label": "Software License Agreement",
        "description": "Terms for software licensing, usage rights, and restrictions",
        "icon": "key",
        "common_for": ["SaaS", "Software Products", "APIs"],
    },
}

# ============================================================================
# Clause Library
# ============================================================================

CLAUSE_LIBRARY: Dict[str, Dict[str, Any]] = {
    # Payment clauses
    "payment_terms": {
        "category": "payment",
        "label": "Payment Terms",
        "description": "Define payment schedule, methods, and late fees",
        "applicable_to": ["freelance_service", "consulting", "subcontractor", "sla"],
    },
    "payment_milestones": {
        "category": "payment",
        "label": "Milestone-Based Payments",
        "description": "Tie payments to project milestones and deliverables",
        "applicable_to": ["freelance_service", "consulting", "subcontractor"],
    },
    "late_payment": {
        "category": "payment",
        "label": "Late Payment Penalties",
        "description": "Interest charges and penalties for overdue payments",
        "applicable_to": ["freelance_service", "consulting", "subcontractor", "sla"],
    },
    # IP clauses
    "ip_assignment": {
        "category": "intellectual_property",
        "label": "IP Assignment",
        "description": "Transfer all intellectual property rights to the client upon payment",
        "applicable_to": ["freelance_service", "consulting", "subcontractor"],
    },
    "ip_license": {
        "category": "intellectual_property",
        "label": "IP License (Non-Exclusive)",
        "description": "Grant a non-exclusive license to use the work product",
        "applicable_to": ["freelance_service", "consulting", "licensing"],
    },
    "ip_retention": {
        "category": "intellectual_property",
        "label": "IP Retention by Creator",
        "description": "Creator retains IP ownership, client gets usage license",
        "applicable_to": ["freelance_service", "consulting"],
    },
    # Confidentiality
    "confidentiality": {
        "category": "confidentiality",
        "label": "Confidentiality Clause",
        "description": "Mutual or one-way confidentiality obligations",
        "applicable_to": ["freelance_service", "nda", "consulting", "partnership", "employment", "subcontractor"],
    },
    "non_compete": {
        "category": "confidentiality",
        "label": "Non-Compete Clause",
        "description": "Restrict competition during and after the contract",
        "applicable_to": ["employment", "partnership", "consulting"],
    },
    "non_solicitation": {
        "category": "confidentiality",
        "label": "Non-Solicitation Clause",
        "description": "Prevent solicitation of employees or clients",
        "applicable_to": ["employment", "partnership", "consulting", "subcontractor"],
    },
    # Liability
    "limitation_liability": {
        "category": "liability",
        "label": "Limitation of Liability",
        "description": "Cap liability to the total project value or a fixed amount",
        "applicable_to": ["freelance_service", "consulting", "sla", "licensing", "subcontractor"],
    },
    "indemnification": {
        "category": "liability",
        "label": "Indemnification",
        "description": "Hold harmless provisions for both parties",
        "applicable_to": ["freelance_service", "consulting", "sla", "licensing", "subcontractor"],
    },
    "warranty": {
        "category": "liability",
        "label": "Warranty & Guarantees",
        "description": "Quality guarantee period for delivered work",
        "applicable_to": ["freelance_service", "consulting", "sla", "licensing"],
    },
    # Termination
    "termination_convenience": {
        "category": "termination",
        "label": "Termination for Convenience",
        "description": "Either party can terminate with notice period",
        "applicable_to": ["freelance_service", "consulting", "employment", "sla", "subcontractor"],
    },
    "termination_cause": {
        "category": "termination",
        "label": "Termination for Cause",
        "description": "Terminate immediately upon material breach",
        "applicable_to": ["freelance_service", "consulting", "employment", "sla", "subcontractor", "partnership"],
    },
    "kill_fee": {
        "category": "termination",
        "label": "Kill Fee / Cancellation Fee",
        "description": "Compensation owed if the project is canceled prematurely",
        "applicable_to": ["freelance_service", "consulting"],
    },
    # Scope
    "scope_of_work": {
        "category": "scope",
        "label": "Scope of Work",
        "description": "Detailed description of deliverables and responsibilities",
        "applicable_to": ["freelance_service", "consulting", "subcontractor", "sla"],
    },
    "change_orders": {
        "category": "scope",
        "label": "Change Order Process",
        "description": "Process for handling scope changes and additional work",
        "applicable_to": ["freelance_service", "consulting", "subcontractor"],
    },
    "revision_policy": {
        "category": "scope",
        "label": "Revision Policy",
        "description": "Number of revisions included and cost for additional revisions",
        "applicable_to": ["freelance_service", "consulting"],
    },
    # Other
    "force_majeure": {
        "category": "general",
        "label": "Force Majeure",
        "description": "Protection against unforeseeable events beyond control",
        "applicable_to": ["freelance_service", "consulting", "sla", "partnership", "employment", "subcontractor"],
    },
    "dispute_resolution": {
        "category": "general",
        "label": "Dispute Resolution",
        "description": "Mediation, arbitration, or litigation process for disputes",
        "applicable_to": ["freelance_service", "consulting", "sla", "partnership", "employment", "subcontractor", "nda", "licensing"],
    },
    "governing_law": {
        "category": "general",
        "label": "Governing Law & Jurisdiction",
        "description": "Which jurisdiction's laws govern this contract",
        "applicable_to": ["freelance_service", "consulting", "sla", "partnership", "employment", "subcontractor", "nda", "licensing"],
    },
    "entire_agreement": {
        "category": "general",
        "label": "Entire Agreement Clause",
        "description": "This contract supersedes all prior agreements",
        "applicable_to": ["freelance_service", "consulting", "sla", "partnership", "employment", "subcontractor", "nda", "licensing"],
    },
    # SLA specific
    "uptime_guarantee": {
        "category": "sla",
        "label": "Uptime Guarantee",
        "description": "Minimum uptime percentage commitment (e.g. 99.9%)",
        "applicable_to": ["sla"],
    },
    "response_time": {
        "category": "sla",
        "label": "Response Time SLA",
        "description": "Maximum response times for support requests by priority",
        "applicable_to": ["sla"],
    },
    "service_credits": {
        "category": "sla",
        "label": "Service Credits",
        "description": "Credits or refunds for SLA breaches",
        "applicable_to": ["sla"],
    },
}

# ============================================================================
# Jurisdictions
# ============================================================================

JURISDICTIONS: List[Dict[str, str]] = [
    {"key": "us_federal", "label": "United States (Federal)"},
    {"key": "us_california", "label": "United States - California"},
    {"key": "us_new_york", "label": "United States - New York"},
    {"key": "us_texas", "label": "United States - Texas"},
    {"key": "us_delaware", "label": "United States - Delaware"},
    {"key": "uk", "label": "United Kingdom"},
    {"key": "eu_general", "label": "European Union (General)"},
    {"key": "eu_germany", "label": "Germany"},
    {"key": "eu_france", "label": "France"},
    {"key": "eu_netherlands", "label": "Netherlands"},
    {"key": "canada", "label": "Canada"},
    {"key": "canada_ontario", "label": "Canada - Ontario"},
    {"key": "australia", "label": "Australia"},
    {"key": "india", "label": "India"},
    {"key": "pakistan", "label": "Pakistan"},
    {"key": "singapore", "label": "Singapore"},
    {"key": "uae", "label": "United Arab Emirates"},
    {"key": "hong_kong", "label": "Hong Kong"},
    {"key": "japan", "label": "Japan"},
    {"key": "brazil", "label": "Brazil"},
    {"key": "south_africa", "label": "South Africa"},
    {"key": "nigeria", "label": "Nigeria"},
    {"key": "other", "label": "Other / Custom"},
]


# ============================================================================
# Engine Functions
# ============================================================================

def get_options() -> Dict[str, Any]:
    """Return all available contract builder options."""
    return {
        "contract_types": [
            {
                "key": k,
                "label": v["label"],
                "description": v["description"],
                "icon": v["icon"],
                "common_for": v["common_for"],
            }
            for k, v in CONTRACT_TYPES.items()
        ],
        "clause_categories": _get_clause_categories(),
        "jurisdictions": JURISDICTIONS,
    }


def get_clauses_for_type(contract_type: str) -> List[Dict[str, Any]]:
    """Return recommended and available clauses for a contract type."""
    result = []
    for key, clause in CLAUSE_LIBRARY.items():
        if contract_type in clause["applicable_to"]:
            result.append({
                "key": key,
                "category": clause["category"],
                "label": clause["label"],
                "description": clause["description"],
            })
    return result


def build_contract(
    contract_type: str,
    # Parties
    party_a_name: str = "",
    party_a_role: str = "Client",
    party_a_address: str = "",
    party_a_email: str = "",
    party_b_name: str = "",
    party_b_role: str = "Contractor",
    party_b_address: str = "",
    party_b_email: str = "",
    # Terms
    start_date: str = "",
    end_date: str = "",
    auto_renew: bool = False,
    jurisdiction: str = "us_federal",
    # Financial
    total_value: Optional[float] = None,
    currency: str = "USD",
    payment_schedule: str = "milestone",  # milestone, monthly, weekly, on_completion, upfront
    # Clauses
    selected_clauses: List[str] = None,
    # Custom details
    scope_description: str = "",
    deliverables: List[str] = None,
    revision_rounds: int = 2,
    notice_period_days: int = 14,
    warranty_days: int = 30,
    # NDA specific
    nda_type: str = "mutual",  # mutual, one_way
    confidentiality_period_months: int = 24,
    # SLA specific
    uptime_percentage: float = 99.9,
    support_hours: str = "business",  # business, 24_7
) -> Dict[str, Any]:
    """Build a complete contract document from parameters."""

    if not selected_clauses:
        selected_clauses = []
    if not deliverables:
        deliverables = []

    # Generate contract ID
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    hash_input = f"{party_a_name}{party_b_name}{ts}"
    short_hash = hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()
    contract_id = f"CTR-{short_hash}"

    # Get type info
    type_info = CONTRACT_TYPES.get(contract_type, CONTRACT_TYPES["freelance_service"])

    # Build clauses content
    clauses_content = _generate_clauses(
        contract_type=contract_type,
        selected_clauses=selected_clauses,
        party_a_name=party_a_name or "Party A",
        party_a_role=party_a_role,
        party_b_name=party_b_name or "Party B",
        party_b_role=party_b_role,
        total_value=total_value,
        currency=currency,
        payment_schedule=payment_schedule,
        scope_description=scope_description,
        deliverables=deliverables,
        revision_rounds=revision_rounds,
        notice_period_days=notice_period_days,
        warranty_days=warranty_days,
        nda_type=nda_type,
        confidentiality_period_months=confidentiality_period_months,
        uptime_percentage=uptime_percentage,
        support_hours=support_hours,
        jurisdiction=jurisdiction,
        start_date=start_date,
        end_date=end_date,
    )

    # Get jurisdiction info
    jurisdiction_info = next((j for j in JURISDICTIONS if j["key"] == jurisdiction), {"key": jurisdiction, "label": jurisdiction})

    # Risk analysis
    risk_analysis = _analyze_contract_risks(
        contract_type=contract_type,
        selected_clauses=selected_clauses,
        total_value=total_value,
        notice_period_days=notice_period_days,
        warranty_days=warranty_days,
    )

    # Completeness score
    completeness = _calculate_completeness(
        contract_type=contract_type,
        selected_clauses=selected_clauses,
        party_a_name=party_a_name,
        party_b_name=party_b_name,
        scope_description=scope_description,
        deliverables=deliverables,
        total_value=total_value,
    )

    return {
        "contract": {
            "id": contract_id,
            "type": contract_type,
            "type_label": type_info["label"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "draft",
        },
        "parties": {
            "party_a": {
                "name": party_a_name,
                "role": party_a_role,
                "address": party_a_address,
                "email": party_a_email,
            },
            "party_b": {
                "name": party_b_name,
                "role": party_b_role,
                "address": party_b_address,
                "email": party_b_email,
            },
        },
        "terms": {
            "start_date": start_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "end_date": end_date,
            "auto_renew": auto_renew,
            "jurisdiction": jurisdiction_info,
            "notice_period_days": notice_period_days,
        },
        "financial": {
            "total_value": total_value,
            "currency": currency,
            "payment_schedule": payment_schedule,
            "payment_schedule_label": payment_schedule.replace("_", " ").title(),
        },
        "scope": {
            "description": scope_description,
            "deliverables": deliverables,
            "revision_rounds": revision_rounds,
            "warranty_days": warranty_days,
        },
        "clauses": clauses_content,
        "selected_clause_keys": selected_clauses,
        "risk_analysis": risk_analysis,
        "completeness": completeness,
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generator": "MegiLance Contract Builder",
            "version": "1.0",
        },
    }


def _get_clause_categories() -> List[Dict[str, Any]]:
    """Get clause categories with counts."""
    cats: Dict[str, int] = {}
    for clause in CLAUSE_LIBRARY.values():
        cat = clause["category"]
        cats[cat] = cats.get(cat, 0) + 1

    cat_labels = {
        "payment": "Payment & Billing",
        "intellectual_property": "Intellectual Property",
        "confidentiality": "Confidentiality & Non-Compete",
        "liability": "Liability & Warranty",
        "termination": "Termination",
        "scope": "Scope & Revisions",
        "general": "General Terms",
        "sla": "Service Level",
    }

    return [
        {"key": k, "label": cat_labels.get(k, k.title()), "count": v}
        for k, v in cats.items()
    ]


def _generate_clauses(
    contract_type: str,
    selected_clauses: List[str],
    party_a_name: str,
    party_a_role: str,
    party_b_name: str,
    party_b_role: str,
    total_value: Optional[float],
    currency: str,
    payment_schedule: str,
    scope_description: str,
    deliverables: List[str],
    revision_rounds: int,
    notice_period_days: int,
    warranty_days: int,
    nda_type: str,
    confidentiality_period_months: int,
    uptime_percentage: float,
    support_hours: str,
    jurisdiction: str,
    start_date: str,
    end_date: str,
) -> List[Dict[str, Any]]:
    """Generate formatted clause content."""
    clauses = []
    section_num = 1

    # Recitals / Preamble
    clauses.append({
        "section": section_num,
        "title": "Recitals",
        "content": (
            f"This {CONTRACT_TYPES.get(contract_type, {}).get('label', 'Agreement')} "
            f"(\"Agreement\") is entered into as of {start_date or 'the date of signing'}, "
            f"by and between {party_a_name or 'Party A'} (\"{party_a_role}\") "
            f"and {party_b_name or 'Party B'} (\"{party_b_role}\"). "
            f"Both parties agree to the terms and conditions outlined herein."
        ),
        "type": "standard",
    })
    section_num += 1

    # Generate content for each selected clause
    for clause_key in selected_clauses:
        clause_info = CLAUSE_LIBRARY.get(clause_key)
        if not clause_info:
            continue

        content = _get_clause_content(
            clause_key=clause_key,
            party_a=party_a_name or "Party A",
            party_a_role=party_a_role,
            party_b=party_b_name or "Party B",
            party_b_role=party_b_role,
            total_value=total_value,
            currency=currency,
            payment_schedule=payment_schedule,
            scope_description=scope_description,
            deliverables=deliverables,
            revision_rounds=revision_rounds,
            notice_period_days=notice_period_days,
            warranty_days=warranty_days,
            nda_type=nda_type,
            confidentiality_period_months=confidentiality_period_months,
            uptime_percentage=uptime_percentage,
            support_hours=support_hours,
            jurisdiction=jurisdiction,
            end_date=end_date,
        )

        clauses.append({
            "section": section_num,
            "title": clause_info["label"],
            "content": content,
            "type": clause_info["category"],
        })
        section_num += 1

    # Signature block
    clauses.append({
        "section": section_num,
        "title": "Signatures",
        "content": (
            f"IN WITNESS WHEREOF, the parties have executed this Agreement as of the date set forth above.\n\n"
            f"{party_a_role}: {party_a_name or '___________________'}\n"
            f"Signature: ___________________\nDate: ___________________\n\n"
            f"{party_b_role}: {party_b_name or '___________________'}\n"
            f"Signature: ___________________\nDate: ___________________"
        ),
        "type": "signature",
    })

    return clauses


def _get_clause_content(
    clause_key: str, party_a: str, party_a_role: str, party_b: str,
    party_b_role: str, total_value, currency, payment_schedule,
    scope_description, deliverables, revision_rounds, notice_period_days,
    warranty_days, nda_type, confidentiality_period_months,
    uptime_percentage, support_hours, jurisdiction, end_date,
) -> str:
    """Generate specific clause content based on key and parameters."""
    templates = {
        "payment_terms": (
            f"The {party_a_role} agrees to pay the {party_b_role} "
            f"{'the total amount of ' + currency + ' ' + str(total_value) if total_value else 'as agreed upon'} "
            f"according to the following schedule: {payment_schedule.replace('_', ' ').title()}. "
            f"All payments shall be made within 30 days of invoice receipt unless otherwise specified. "
            f"Payments may be made via bank transfer, check, or other mutually agreed methods."
        ),
        "payment_milestones": (
            f"Payments shall be tied to the completion and acceptance of project milestones as defined in the Scope of Work. "
            f"The {party_b_role} shall submit deliverables for each milestone, and the {party_a_role} shall review and approve "
            f"within 5 business days. Payment for each milestone shall be released upon written acceptance."
        ),
        "late_payment": (
            f"If any payment is not received by the {party_b_role} within 15 days of the due date, "
            f"interest shall accrue at a rate of 1.5% per month on the outstanding balance. "
            f"The {party_b_role} reserves the right to suspend work until all overdue payments are settled."
        ),
        "ip_assignment": (
            f"Upon full payment, all intellectual property rights, including copyrights, patents, and trade secrets, "
            f"in the work product created by the {party_b_role} under this Agreement shall be irrevocably assigned to the {party_a_role}. "
            f"The {party_b_role} shall execute any documents necessary to perfect such assignment."
        ),
        "ip_license": (
            f"The {party_b_role} retains ownership of all intellectual property created under this Agreement. "
            f"The {party_a_role} is hereby granted a perpetual, non-exclusive, worldwide license to use, modify, "
            f"and distribute the work product for their business purposes."
        ),
        "ip_retention": (
            f"All intellectual property created under this Agreement shall remain the sole property of the {party_b_role}. "
            f"The {party_a_role} receives a limited, non-transferable license to use the delivered work product "
            f"for its intended purpose only."
        ),
        "confidentiality": (
            f"{'Both parties' if nda_type == 'mutual' else f'The {party_b_role}'} agree to hold in strict confidence "
            f"all proprietary information, trade secrets, business plans, technical data, and other confidential information "
            f"disclosed during the term of this Agreement. This obligation shall survive for {confidentiality_period_months} months "
            f"after termination of this Agreement. Confidential information does not include information that is publicly available, "
            f"independently developed, or rightfully received from a third party."
        ),
        "non_compete": (
            f"During the term of this Agreement and for 12 months thereafter, the {party_b_role} agrees not to directly compete "
            f"with the {party_a_role}'s business within the same market segment. This restriction applies to the geographic "
            f"area where the {party_a_role} actively conducts business."
        ),
        "non_solicitation": (
            "For a period of 12 months following termination of this Agreement, neither party shall directly solicit or attempt "
            "to hire any employees, contractors, or clients of the other party who were involved in the performance of this Agreement."
        ),
        "limitation_liability": (
            f"The total liability of either party under this Agreement shall not exceed "
            f"{'the total contract value of ' + currency + ' ' + str(total_value) if total_value else 'the total fees paid under this Agreement'}. "
            f"In no event shall either party be liable for indirect, incidental, consequential, special, or punitive damages."
        ),
        "indemnification": (
            "Each party agrees to indemnify, defend, and hold harmless the other party from and against any and all claims, "
            "damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from a breach of this Agreement "
            "or the negligent or wrongful acts of the indemnifying party."
        ),
        "warranty": (
            f"The {party_b_role} warrants that all work product will be free from material defects for a period of {warranty_days} days "
            f"following delivery and acceptance. During this warranty period, the {party_b_role} will correct any defects at no additional cost."
        ),
        "termination_convenience": (
            f"Either party may terminate this Agreement for any reason by providing {notice_period_days} days' written notice. "
            f"Upon termination, the {party_a_role} shall pay for all work completed up to the effective date of termination."
        ),
        "termination_cause": (
            "Either party may terminate this Agreement immediately upon written notice if the other party materially breaches "
            "this Agreement and fails to cure such breach within 10 business days of receiving written notice of the breach."
        ),
        "kill_fee": (
            f"If the {party_a_role} terminates this Agreement before completion for reasons other than the {party_b_role}'s breach, "
            f"the {party_a_role} shall pay a cancellation fee equal to 25% of the remaining contract value, "
            f"in addition to payment for all work completed."
        ),
        "scope_of_work": (
            f"{scope_description or 'The scope of work shall be as mutually agreed upon by both parties.'}"
            + ("\n\nDeliverables:\n" + "\n".join(f"• {d}" for d in deliverables) if deliverables else "")
        ),
        "change_orders": (
            "Any changes to the agreed scope of work must be documented in a written Change Order, "
            "signed by both parties. Change Orders shall specify the modified deliverables, timeline impact, "
            "and any additional costs. Work on changes shall not begin until the Change Order is approved."
        ),
        "revision_policy": (
            f"This Agreement includes up to {revision_rounds} rounds of revisions for each deliverable. "
            f"Additional revision rounds beyond the included amount will be billed at the {party_b_role}'s standard hourly rate."
        ),
        "force_majeure": (
            "Neither party shall be liable for delays or failures in performance resulting from circumstances beyond their "
            "reasonable control, including but not limited to natural disasters, war, pandemic, government restrictions, "
            "or disruption to essential services. The affected party shall provide prompt notice and make reasonable efforts to mitigate."
        ),
        "dispute_resolution": (
            "Any disputes arising under this Agreement shall first be resolved through good-faith negotiation. "
            "If negotiation fails, the parties agree to submit the dispute to binding arbitration in accordance with "
            "the rules of the jurisdiction specified herein, before resorting to litigation."
        ),
        "governing_law": (
            f"This Agreement shall be governed by and construed in accordance with the laws of "
            f"{next((j['label'] for j in JURISDICTIONS if j['key'] == jurisdiction), jurisdiction)}. "
            f"Any legal proceedings shall be brought in the courts of that jurisdiction."
        ),
        "entire_agreement": (
            "This Agreement constitutes the entire understanding between the parties concerning the subject matter hereof "
            "and supersedes all prior negotiations, agreements, and understandings, whether written or oral. "
            "No modification of this Agreement shall be valid unless made in writing and signed by both parties."
        ),
        "uptime_guarantee": (
            f"The service provider guarantees a minimum uptime of {uptime_percentage}% measured on a monthly basis. "
            f"Scheduled maintenance windows shall not count toward downtime calculations."
        ),
        "response_time": (
            f"Support requests shall be responded to within the following timeframes: "
            f"Critical (service down): 1 hour, High: 4 hours, Medium: 8 hours, Low: 24 hours. "
            f"Support is available during {'24/7' if support_hours == '24_7' else 'business hours (9 AM - 6 PM, Monday-Friday)'}."
        ),
        "service_credits": (
            f"If the service provider fails to meet the uptime guarantee, service credits shall be issued: "
            f"99.0-{uptime_percentage}%: 10% credit, 95.0-99.0%: 25% credit, below 95.0%: 50% credit. "
            f"Credits shall be applied to the next billing cycle."
        ),
    }

    return templates.get(clause_key, f"[Clause content for '{clause_key}' to be drafted.]")


def _analyze_contract_risks(
    contract_type: str,
    selected_clauses: List[str],
    total_value: Optional[float],
    notice_period_days: int,
    warranty_days: int,
) -> List[Dict[str, str]]:
    """Analyze potential risks in the contract."""
    risks = []

    # Missing critical clauses
    critical_clauses = {
        "freelance_service": ["payment_terms", "scope_of_work", "ip_assignment", "termination_convenience"],
        "nda": ["confidentiality", "governing_law"],
        "sla": ["uptime_guarantee", "response_time", "limitation_liability"],
        "consulting": ["payment_terms", "scope_of_work", "confidentiality"],
        "partnership": ["confidentiality", "termination_cause", "dispute_resolution"],
        "employment": ["confidentiality", "termination_cause", "non_compete"],
        "subcontractor": ["payment_terms", "scope_of_work", "ip_assignment"],
        "licensing": ["ip_license", "limitation_liability", "termination_convenience"],
    }

    required = critical_clauses.get(contract_type, [])
    missing = [c for c in required if c not in selected_clauses]

    for m in missing:
        clause_info = CLAUSE_LIBRARY.get(m, {"label": m})
        risks.append({
            "severity": "high",
            "title": f"Missing: {clause_info.get('label', m)}",
            "message": f"This clause is typically essential for {CONTRACT_TYPES.get(contract_type, {}).get('label', 'this type of')} contracts.",
            "recommendation": f"Consider adding the '{clause_info.get('label', m)}' clause for better protection.",
        })

    if total_value and total_value > 10000 and "limitation_liability" not in selected_clauses:
        risks.append({
            "severity": "high",
            "title": "No Liability Cap for High-Value Contract",
            "message": f"This contract is valued at {total_value} but has no limitation of liability.",
            "recommendation": "Add a limitation of liability clause to cap exposure.",
        })

    if notice_period_days < 7:
        risks.append({
            "severity": "medium",
            "title": "Short Notice Period",
            "message": f"A {notice_period_days}-day notice period may not provide enough time to transition.",
            "recommendation": "Consider extending to at least 14 days.",
        })

    if warranty_days < 14:
        risks.append({
            "severity": "medium",
            "title": "Short Warranty Period",
            "message": f"A {warranty_days}-day warranty may not adequately protect the client.",
            "recommendation": "Consider a 30-day minimum warranty period.",
        })

    if "dispute_resolution" not in selected_clauses:
        risks.append({
            "severity": "medium",
            "title": "No Dispute Resolution Clause",
            "message": "Without a dispute resolution clause, disagreements may escalate to costly litigation.",
            "recommendation": "Add a dispute resolution clause with mediation or arbitration.",
        })

    if not risks:
        risks.append({
            "severity": "low",
            "title": "Well-Structured Contract",
            "message": "This contract includes essential clauses and appears well-balanced.",
            "recommendation": "Review specific clause details to ensure they match your requirements.",
        })

    return risks


def _calculate_completeness(
    contract_type: str,
    selected_clauses: List[str],
    party_a_name: str,
    party_b_name: str,
    scope_description: str,
    deliverables: List[str],
    total_value: Optional[float],
) -> Dict[str, Any]:
    """Calculate contract completeness score."""
    score = 0
    max_score = 100
    factors = []

    # Party information (20 pts)
    if party_a_name:
        score += 10
        factors.append({"factor": "Party A identified", "points": 10})
    if party_b_name:
        score += 10
        factors.append({"factor": "Party B identified", "points": 10})

    # Financial terms (15 pts)
    if total_value:
        score += 15
        factors.append({"factor": "Financial terms defined", "points": 15})

    # Scope (15 pts)
    if scope_description:
        score += 10
        factors.append({"factor": "Scope described", "points": 10})
    if deliverables:
        score += 5
        factors.append({"factor": "Deliverables listed", "points": 5})

    # Clauses (50 pts)
    available_clauses = get_clauses_for_type(contract_type)
    if available_clauses:
        clause_ratio = len(selected_clauses) / len(available_clauses)
        clause_pts = min(int(clause_ratio * 50), 50)
        score += clause_pts
        factors.append({"factor": f"{len(selected_clauses)}/{len(available_clauses)} clauses selected", "points": clause_pts})

    score = min(score, max_score)
    level = "excellent" if score >= 85 else "good" if score >= 65 else "fair" if score >= 45 else "needs_work"

    return {
        "score": score,
        "level": level,
        "factors": factors,
    }
