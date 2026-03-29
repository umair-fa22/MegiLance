# @AI-HINT: AI Proposal Writer engine — generates winning freelancer proposals with market-data-backed pricing
"""
AI Proposal Writer Engine - Public, stateless proposal generator.

Generates customized, persuasive proposals for freelancers by:
1. Analyzing the project description to extract key requirements
2. Matching freelancer skills to project needs
3. Suggesting competitive pricing backed by market data
4. Structuring the proposal with proven winning patterns
5. Adding personalization hooks based on project context

Different from ai_writing.py (which requires auth + DB session).
This is a standalone public tool like scope_planner / price_estimator.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.market_data_2025 import (
    get_upwork_service_rate,
    get_demand_data,
    get_country_rate_data,
    DATA_VERSION,
)

logger = logging.getLogger("megilance")

# ============================================================================
# PROPOSAL TEMPLATES — Proven structures for different project types
# ============================================================================

TONE_CONFIGS = {
    "professional": {
        "greeting": "Dear Hiring Manager",
        "closing": "Best regards",
        "style": "formal but approachable",
        "enthusiasm_level": "measured",
    },
    "friendly": {
        "greeting": "Hi there",
        "closing": "Looking forward to hearing from you!",
        "style": "warm and conversational",
        "enthusiasm_level": "high",
    },
    "confident": {
        "greeting": "Hello",
        "closing": "Let's make this happen",
        "style": "direct and assertive",
        "enthusiasm_level": "high",
    },
    "formal": {
        "greeting": "Dear Sir/Madam",
        "closing": "Respectfully",
        "style": "traditional business formal",
        "enthusiasm_level": "low",
    },
}

# Project type detection keywords
PROJECT_TYPE_KEYWORDS = {
    "web_application": ["website", "web app", "webapp", "frontend", "backend", "full stack", "fullstack", "react", "angular", "vue", "next.js", "django", "laravel", "rails"],
    "mobile_app": ["mobile", "ios", "android", "flutter", "react native", "app development", "swift", "kotlin"],
    "ecommerce_platform": ["ecommerce", "e-commerce", "online store", "shopify", "woocommerce", "marketplace", "product listing"],
    "api_development": ["api", "rest", "graphql", "microservice", "backend api", "endpoint"],
    "ui_ux_design": ["ui", "ux", "user interface", "user experience", "design system", "wireframe", "prototype", "figma"],
    "ai_ml_solution": ["machine learning", "ai", "artificial intelligence", "nlp", "computer vision", "deep learning", "tensorflow", "pytorch", "llm", "chatbot", "gpt"],
    "data_science": ["data analysis", "data science", "analytics", "dashboard", "visualization", "power bi", "tableau"],
    "seo_optimization": ["seo", "search engine", "keyword", "ranking", "organic traffic", "google ranking"],
    "graphic_design": ["logo", "branding", "graphic design", "visual identity", "banner", "poster", "flyer"],
    "video_editing": ["video", "editing", "youtube", "animation", "motion graphics", "after effects"],
    "copywriting": ["copywriting", "content writing", "blog", "article", "copy", "marketing copy"],
    "devops_infrastructure": ["devops", "ci/cd", "docker", "kubernetes", "aws", "cloud", "infrastructure", "deployment"],
    "cybersecurity": ["security", "penetration testing", "vulnerability", "cybersecurity", "audit"],
    "blockchain_web3": ["blockchain", "web3", "smart contract", "solidity", "nft", "defi", "ethereum"],
}

# ============================================================================
# PUBLIC API FUNCTIONS
# ============================================================================

def get_proposal_options() -> Dict[str, Any]:
    """Return options for the proposal writer form."""
    tones = [
        {"key": "professional", "label": "Professional", "description": "Formal but approachable — best for most projects"},
        {"key": "friendly", "label": "Friendly", "description": "Warm and conversational — small projects, creative work"},
        {"key": "confident", "label": "Confident", "description": "Direct and assertive — when you're a strong fit"},
        {"key": "formal", "label": "Formal", "description": "Traditional business formal — enterprise/government clients"},
    ]

    lengths = [
        {"key": "concise", "label": "Concise (~150 words)", "description": "Quick, punchy proposal for simple projects"},
        {"key": "standard", "label": "Standard (~300 words)", "description": "Balanced detail — works for most projects"},
        {"key": "detailed", "label": "Detailed (~500 words)", "description": "In-depth for complex/high-budget projects"},
    ]

    return {
        "tones": tones,
        "lengths": lengths,
        "max_skills": 10,
        "max_highlights": 5,
    }


async def generate_proposal(
    project_title: str,
    project_description: str,
    freelancer_skills: List[str],
    experience_level: str = "mid",
    tone: str = "professional",
    length: str = "standard",
    freelancer_name: Optional[str] = None,
    years_experience: Optional[int] = None,
    highlight_points: Optional[List[str]] = None,
    proposed_rate: Optional[float] = None,
    proposed_timeline: Optional[str] = None,
    country_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate a winning proposal.

    Returns:
    - Full proposal text (ready to submit)
    - Suggested rate based on market data
    - Skill match analysis
    - Proposal scoring (how strong it is)
    - Improvement tips
    """
    # 1. Detect project type from description
    detected_type = _detect_project_type(project_title, project_description)

    # 2. Analyze skill match
    skill_match = _analyze_skill_match(freelancer_skills, project_description, detected_type)

    # 3. Get suggested rate from market data
    suggested_rate = _suggest_rate(detected_type, experience_level, country_code)

    # 4. Generate the proposal
    proposal_text = await _compose_proposal(
        project_title=project_title,
        project_description=project_description,
        skills=freelancer_skills,
        skill_match=skill_match,
        experience_level=experience_level,
        tone=tone,
        length=length,
        freelancer_name=freelancer_name,
        years_experience=years_experience,
        highlight_points=highlight_points,
        proposed_rate=proposed_rate or suggested_rate["recommended"],
        proposed_timeline=proposed_timeline,
        detected_type=detected_type,
    )

    # 5. Score the proposal
    score = _score_proposal(proposal_text, skill_match, highlight_points, proposed_rate, proposed_timeline)

    # 6. Generate improvement tips
    tips = _generate_tips(skill_match, highlight_points, proposed_rate, proposed_timeline, score)

    return {
        "proposal": proposal_text,
        "word_count": len(proposal_text.split()),
        "detected_project_type": detected_type,
        "skill_match": skill_match,
        "suggested_rate": suggested_rate,
        "proposal_score": score,
        "tips": tips,
        "meta": {
            "tone": tone,
            "length": length,
            "experience_level": experience_level,
            "data_version": DATA_VERSION,
            "generated_at": datetime.utcnow().isoformat(),
        },
    }


# ============================================================================
# INTERNAL FUNCTIONS
# ============================================================================

def _detect_project_type(title: str, description: str) -> Dict[str, Any]:
    """Detect project type from title and description keywords."""
    text = f"{title} {description}".lower()
    scores = {}

    for ptype, keywords in PROJECT_TYPE_KEYWORDS.items():
        match_count = sum(1 for kw in keywords if kw in text)
        if match_count > 0:
            scores[ptype] = match_count

    if not scores:
        return {"primary": "web_application", "confidence": 0.3, "all_matches": []}

    sorted_types = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_types[0]
    max_possible = len(PROJECT_TYPE_KEYWORDS.get(primary[0], []))
    confidence = min(primary[1] / max(max_possible * 0.3, 1), 1.0)

    return {
        "primary": primary[0],
        "confidence": round(confidence, 2),
        "all_matches": [{"type": t, "keyword_matches": c} for t, c in sorted_types[:3]],
    }


def _analyze_skill_match(
    freelancer_skills: List[str],
    project_description: str,
    detected_type: Dict,
) -> Dict[str, Any]:
    """Analyze how well freelancer skills match the project."""
    desc_lower = project_description.lower()

    matched = []
    unmatched = []
    for skill in freelancer_skills:
        skill_lower = skill.lower()
        # Check if skill is mentioned in description
        is_mentioned = skill_lower in desc_lower or skill_lower.replace(" ", "") in desc_lower
        # Check if skill is relevant to detected project type
        primary_type = detected_type["primary"]
        keywords = PROJECT_TYPE_KEYWORDS.get(primary_type, [])
        is_relevant = any(skill_lower in kw or kw in skill_lower for kw in keywords)

        if is_mentioned or is_relevant:
            matched.append({"skill": skill, "mentioned_in_description": is_mentioned, "relevant_to_type": is_relevant})
        else:
            unmatched.append(skill)

    match_pct = round(len(matched) / max(len(freelancer_skills), 1) * 100)

    # Detect required skills from description that freelancer may be missing
    missing_signals = []
    for ptype, keywords in PROJECT_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                # Check if any freelancer skill covers this
                skill_covers = any(kw in s.lower() or s.lower() in kw for s in freelancer_skills)
                if not skill_covers:
                    missing_signals.append(kw)

    return {
        "matched_skills": matched,
        "other_skills": unmatched,
        "match_percentage": match_pct,
        "match_level": "excellent" if match_pct >= 80 else "good" if match_pct >= 60 else "moderate" if match_pct >= 40 else "weak",
        "missing_signals": list(set(missing_signals))[:5],
    }


def _suggest_rate(
    detected_type: Dict,
    experience_level: str,
    country_code: Optional[str],
) -> Dict[str, Any]:
    """Suggest a competitive rate based on market data."""
    primary_type = detected_type["primary"]

    svc_rate = get_upwork_service_rate(primary_type)
    if svc_rate:
        rate = svc_rate.get(experience_level, svc_rate.get("mid", 40))
    else:
        # Fallback
        base_rates = {"junior": 20, "mid": 40, "senior": 70, "expert": 100}
        rate = base_rates.get(experience_level, 40)

    # Country adjustment
    if country_code:
        crd = get_country_rate_data(country_code)
        if crd:
            from app.services.market_data_2025 import COUNTRY_DEVELOPER_RATES
            us_avg = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
            rate *= crd["avg"] / us_avg if us_avg else 1.0

    # Demand premium
    dd = get_demand_data(primary_type)
    if dd:
        demand_mult = 0.90 + (dd["demand_score"] / 100) * 0.20
        rate *= demand_mult

    recommended = round(rate, 2)
    return {
        "recommended": recommended,
        "range_low": round(recommended * 0.80, 2),
        "range_high": round(recommended * 1.25, 2),
        "currency": "USD",
        "basis": f"Based on Upwork {experience_level}-level rates for {primary_type.replace('_', ' ')}",
    }


async def _compose_proposal(
    project_title: str,
    project_description: str,
    skills: List[str],
    skill_match: Dict,
    experience_level: str,
    tone: str,
    length: str,
    freelancer_name: Optional[str],
    years_experience: Optional[int],
    highlight_points: Optional[List[str]],
    proposed_rate: float,
    proposed_timeline: Optional[str],
    detected_type: Dict,
) -> str:
    """Compose the full proposal text using proven template patterns."""
    cfg = TONE_CONFIGS.get(tone, TONE_CONFIGS["professional"])
    matched_skills = [m["skill"] for m in skill_match["matched_skills"]]
    is_concise = length == "concise"
    is_detailed = length == "detailed"

    # --- OPENING ---
    opening = f"{cfg['greeting']},\n\n"

    if tone == "confident":
        opening += f'I\'m exactly what you need for "{project_title}". '
    elif tone == "friendly":
        opening += f'I just read through your project "{project_title}" and I\'m really excited about it! '
    else:
        opening += f'I\'m writing to express my strong interest in your project "{project_title}". '

    # Connect to their needs
    if matched_skills:
        skills_text = ", ".join(matched_skills[:4])
        opening += f"With deep expertise in {skills_text}, I can deliver exactly what you're looking for."
    else:
        opening += f"My background in {', '.join(skills[:3])} positions me well to tackle this project."

    sections = [opening]

    # --- WHY ME (skip for concise) ---
    if not is_concise:
        why_me = "\n**Why I'm the Right Fit:**\n"
        exp_text = {
            "junior": "an enthusiastic and detail-oriented developer",
            "mid": f"a seasoned professional with {years_experience or '3+'}+ years of focused experience",
            "senior": f"a senior specialist with {years_experience or '7+'}+ years of delivering high-impact solutions",
            "expert": f"an industry expert with {years_experience or '10+'}+ years and a proven track record",
        }
        why_me += f"\n{exp_text.get(experience_level, exp_text['mid'])}. "

        if highlight_points:
            for point in highlight_points[:3]:
                why_me += f"\n- {point}"
        else:
            why_me += "\n- Consistent track record of on-time, on-budget delivery"
            why_me += "\n- Clear, proactive communication throughout the project"
            if experience_level in ("senior", "expert"):
                why_me += "\n- Trusted by clients for complex, high-stakes projects"

        sections.append(why_me)

    # --- APPROACH ---
    ptype = detected_type["primary"]
    approach = "\n**My Approach:**\n"
    if ptype in ("web_application", "mobile_app", "saas_product"):
        approach += """
1. Requirements deep-dive to fully understand your vision
2. Architecture planning with scalability in mind
3. Iterative development with milestone demos
4. Thorough testing and quality assurance
5. Deployment and handover with documentation"""
    elif ptype in ("ai_ml_solution", "data_science"):
        approach += """
1. Data assessment and feasibility analysis
2. Model selection and prototyping
3. Training, tuning, and validation
4. Integration with your existing systems
5. Monitoring setup and performance metrics"""
    elif ptype in ("ui_ux_design", "graphic_design"):
        approach += """
1. Discovery session to understand your brand and users
2. Research and moodboard creation
3. Wireframes and interactive prototypes
4. Visual design iterations with your feedback
5. Final assets and design system handoff"""
    elif ptype in ("seo_optimization", "copywriting"):
        approach += """
1. Current state audit and competitor analysis
2. Strategy development with clear KPIs
3. Implementation of optimizations
4. Content creation aligned with your goals
5. Performance tracking and reporting"""
    else:
        approach += """
1. Thorough requirements analysis
2. Strategic planning and milestone definition
3. Implementation with regular progress updates
4. Quality assurance and testing
5. Delivery, review, and iteration"""

    if not is_concise:
        sections.append(approach)

    # --- PRICING & TIMELINE ---
    pricing = "\n**Pricing & Timeline:**\n"
    pricing += f"\n- Rate: ${proposed_rate:.0f}/hr (competitive based on current market rates)"
    if proposed_timeline:
        pricing += f"\n- Estimated timeline: {proposed_timeline}"
    pricing += "\n- Flexible on milestones and payment structure"
    sections.append(pricing)

    # --- CLOSING ---
    closing = "\n"
    if tone == "confident":
        closing += "I'm ready to start immediately. Let's discuss the details and get this project moving."
    elif tone == "friendly":
        closing += "I'd love to chat more about your project! Feel free to reach out anytime — I'm very responsive."
    else:
        closing += "I would welcome the opportunity to discuss this project in more detail. I'm available for a call at your convenience."

    closing += f"\n\n{cfg['closing']}"
    if freelancer_name:
        closing += f",\n{freelancer_name}"

    sections.append(closing)

    return "\n".join(sections)


def _score_proposal(
    proposal_text: str,
    skill_match: Dict,
    highlight_points: Optional[List[str]],
    proposed_rate: Optional[float],
    proposed_timeline: Optional[str],
) -> Dict[str, Any]:
    """Score the proposal on multiple dimensions."""
    word_count = len(proposal_text.split())

    scores = {}

    # Relevance (0-25): How well skills match
    match_pct = skill_match["match_percentage"]
    scores["relevance"] = min(round(match_pct * 0.25), 25)

    # Personalization (0-25): Custom details included
    personal_score = 5  # Base
    if highlight_points:
        personal_score += min(len(highlight_points) * 4, 12)
    if proposed_timeline:
        personal_score += 4
    if proposed_rate:
        personal_score += 4
    scores["personalization"] = min(personal_score, 25)

    # Completeness (0-25): Has all key sections
    completeness = 5
    if "approach" in proposal_text.lower() or "my approach" in proposal_text.lower():
        completeness += 5
    if "$" in proposal_text or "rate" in proposal_text.lower():
        completeness += 5
    if "timeline" in proposal_text.lower() or "deliver" in proposal_text.lower():
        completeness += 5
    if 150 <= word_count <= 600:
        completeness += 5
    scores["completeness"] = min(completeness, 25)

    # Professionalism (0-25): Structure, length, no errors
    prof = 10
    if 100 < word_count < 700:
        prof += 5
    if "**" in proposal_text:  # Has formatting
        prof += 5
    if any(word in proposal_text.lower() for word in ["milestone", "quality", "communication", "experience"]):
        prof += 5
    scores["professionalism"] = min(prof, 25)

    total = sum(scores.values())
    level = (
        "excellent" if total >= 85 else
        "strong" if total >= 70 else
        "good" if total >= 55 else
        "needs_improvement"
    )

    return {
        "total": total,
        "max": 100,
        "level": level,
        "breakdown": scores,
    }


def _generate_tips(
    skill_match: Dict,
    highlight_points: Optional[List[str]],
    proposed_rate: Optional[float],
    proposed_timeline: Optional[str],
    score: Dict,
) -> List[Dict[str, str]]:
    """Generate specific tips to improve the proposal."""
    tips = []

    if skill_match["match_percentage"] < 60:
        tips.append({
            "type": "critical",
            "tip": "Strengthen skill alignment",
            "detail": "Less than 60% of your skills match the project. Emphasize transferable skills and relevant experience explicitly.",
        })

    if skill_match.get("missing_signals"):
        missing = ", ".join(skill_match["missing_signals"][:3])
        tips.append({
            "type": "important",
            "tip": f"Address mentioned technologies: {missing}",
            "detail": "The project mentions technologies you didn't list. If you have experience with these, add them. If not, explain how your skills apply.",
        })

    if not highlight_points:
        tips.append({
            "type": "improvement",
            "tip": "Add specific achievements",
            "detail": "Proposals with concrete results ('Increased conversion by 40%', 'Delivered 2 weeks early') win 3x more projects.",
        })

    if not proposed_timeline:
        tips.append({
            "type": "improvement",
            "tip": "Include a timeline estimate",
            "detail": "Clients prefer proposals with estimated timelines. Even a range ('2-4 weeks') shows planning ability.",
        })

    if not proposed_rate:
        tips.append({
            "type": "improvement",
            "tip": "Mention your rate explicitly",
            "detail": "Transparent pricing builds trust. Proposals with clear pricing have higher acceptance rates.",
        })

    # General best practices
    tips.append({
        "type": "best_practice",
        "tip": "Personalize the opening line",
        "detail": "Reference something specific from the project description to show you actually read it. Generic proposals are ignored.",
    })

    if score["total"] >= 70:
        tips.append({
            "type": "optimization",
            "tip": "Follow up within 24-48 hours",
            "detail": "If the client hasn't responded, a brief polite follow-up increases your close rate by 20-30%.",
        })

    return tips
