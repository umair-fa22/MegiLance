# @AI-HINT: AI Skill Analyzer engine — market demand analysis, skill gap identification, career path recommendations
"""
AI Skill Analyzer Engine - Standalone, stateless scoring engine.

Analyzes a freelancer's current skills against 2025 market demand data to:
1. Score each skill's market value and demand trend
2. Identify in-demand skills the user is MISSING
3. Recommend a personalized learning path with ROI projections
4. Show salary/rate impact of acquiring new skills
5. Compare against regional competition

Uses real data from market_data_2025 module (Arc.dev, Upwork, Fiverr datasets).
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from app.services.market_data_2025 import (
    COUNTRY_DEVELOPER_RATES,
    PAKISTAN_FREELANCE_STATS,
    get_country_rate_data,
    get_demand_data,
    get_upwork_service_rate,
    get_south_asia_benchmark,
    DATA_VERSION,
)

logger = logging.getLogger("megilance")

# ============================================================================
# SKILL TAXONOMY — maps user-facing skill names to internal service_type keys
# ============================================================================

SKILL_TAXONOMY: Dict[str, Dict[str, Any]] = {
    # Software & Technology
    "react": {"service_types": ["web_application", "saas_product"], "category": "software_development", "label": "React.js"},
    "angular": {"service_types": ["web_application"], "category": "software_development", "label": "Angular"},
    "vue": {"service_types": ["web_application"], "category": "software_development", "label": "Vue.js"},
    "nextjs": {"service_types": ["web_application", "saas_product"], "category": "software_development", "label": "Next.js"},
    "nodejs": {"service_types": ["web_application", "api_development"], "category": "software_development", "label": "Node.js"},
    "python": {"service_types": ["web_application", "ai_ml_solution", "data_science", "automation_scripting"], "category": "software_development", "label": "Python"},
    "django": {"service_types": ["web_application"], "category": "software_development", "label": "Django"},
    "fastapi": {"service_types": ["api_development", "web_application"], "category": "software_development", "label": "FastAPI"},
    "java": {"service_types": ["web_application", "mobile_app", "desktop_software"], "category": "software_development", "label": "Java"},
    "csharp": {"service_types": ["web_application", "desktop_software", "game_development"], "category": "software_development", "label": "C#"},
    "dotnet": {"service_types": ["web_application", "desktop_software"], "category": "software_development", "label": ".NET"},
    "php": {"service_types": ["web_application", "ecommerce_platform"], "category": "software_development", "label": "PHP"},
    "laravel": {"service_types": ["web_application"], "category": "software_development", "label": "Laravel"},
    "wordpress": {"service_types": ["web_application", "ecommerce_platform"], "category": "software_development", "label": "WordPress"},
    "shopify": {"service_types": ["ecommerce_platform"], "category": "software_development", "label": "Shopify"},
    "ruby": {"service_types": ["web_application"], "category": "software_development", "label": "Ruby on Rails"},
    "go": {"service_types": ["api_development", "devops_infrastructure"], "category": "software_development", "label": "Go"},
    "rust": {"service_types": ["desktop_software", "blockchain_web3"], "category": "software_development", "label": "Rust"},
    "typescript": {"service_types": ["web_application", "saas_product"], "category": "software_development", "label": "TypeScript"},
    "swift": {"service_types": ["mobile_app"], "category": "software_development", "label": "Swift (iOS)"},
    "kotlin": {"service_types": ["mobile_app"], "category": "software_development", "label": "Kotlin (Android)"},
    "flutter": {"service_types": ["mobile_app"], "category": "software_development", "label": "Flutter"},
    "react_native": {"service_types": ["mobile_app"], "category": "software_development", "label": "React Native"},
    "sql": {"service_types": ["database_design", "data_analysis"], "category": "software_development", "label": "SQL"},
    "mongodb": {"service_types": ["database_design"], "category": "software_development", "label": "MongoDB"},
    "postgresql": {"service_types": ["database_design"], "category": "software_development", "label": "PostgreSQL"},
    "aws": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "AWS"},
    "azure": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "Azure"},
    "gcp": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "Google Cloud"},
    "docker": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "Docker"},
    "kubernetes": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "Kubernetes"},
    "terraform": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "Terraform"},
    "ci_cd": {"service_types": ["devops_infrastructure"], "category": "software_development", "label": "CI/CD Pipelines"},
    "tensorflow": {"service_types": ["ai_ml_solution", "machine_learning"], "category": "software_development", "label": "TensorFlow"},
    "pytorch": {"service_types": ["ai_ml_solution", "machine_learning"], "category": "software_development", "label": "PyTorch"},
    "machine_learning": {"service_types": ["ai_ml_solution", "machine_learning", "data_science"], "category": "software_development", "label": "Machine Learning"},
    "deep_learning": {"service_types": ["ai_ml_solution", "machine_learning"], "category": "software_development", "label": "Deep Learning"},
    "nlp": {"service_types": ["ai_ml_solution"], "category": "software_development", "label": "NLP"},
    "computer_vision": {"service_types": ["ai_ml_solution"], "category": "software_development", "label": "Computer Vision"},
    "llm": {"service_types": ["ai_ml_solution"], "category": "software_development", "label": "LLM / Prompt Engineering"},
    "solidity": {"service_types": ["blockchain_web3"], "category": "software_development", "label": "Solidity"},
    "web3": {"service_types": ["blockchain_web3"], "category": "software_development", "label": "Web3 / DApps"},
    "cybersecurity": {"service_types": ["cybersecurity"], "category": "software_development", "label": "Cybersecurity"},
    "penetration_testing": {"service_types": ["cybersecurity"], "category": "software_development", "label": "Penetration Testing"},
    "unity": {"service_types": ["game_development"], "category": "software_development", "label": "Unity Game Dev"},
    "unreal": {"service_types": ["game_development"], "category": "software_development", "label": "Unreal Engine"},
    "embedded": {"service_types": ["iot_embedded"], "category": "software_development", "label": "Embedded / IoT"},

    # Design & Creative
    "figma": {"service_types": ["ui_ux_design", "web_design"], "category": "design_creative", "label": "Figma"},
    "adobe_xd": {"service_types": ["ui_ux_design"], "category": "design_creative", "label": "Adobe XD"},
    "photoshop": {"service_types": ["graphic_design", "photo_editing"], "category": "design_creative", "label": "Photoshop"},
    "illustrator": {"service_types": ["graphic_design", "illustration", "logo_branding"], "category": "design_creative", "label": "Illustrator"},
    "after_effects": {"service_types": ["motion_graphics", "animation_2d"], "category": "design_creative", "label": "After Effects"},
    "blender": {"service_types": ["3d_modeling", "animation_3d"], "category": "design_creative", "label": "Blender 3D"},
    "canva": {"service_types": ["graphic_design"], "category": "design_creative", "label": "Canva"},
    "ui_ux": {"service_types": ["ui_ux_design", "product_design"], "category": "design_creative", "label": "UI/UX Design"},
    "logo_design": {"service_types": ["logo_branding"], "category": "design_creative", "label": "Logo Design"},
    "branding": {"service_types": ["logo_branding", "brand_strategy"], "category": "design_creative", "label": "Branding"},

    # Marketing
    "seo": {"service_types": ["seo_optimization"], "category": "marketing", "label": "SEO"},
    "google_ads": {"service_types": ["ppc_advertising"], "category": "marketing", "label": "Google Ads"},
    "facebook_ads": {"service_types": ["ppc_advertising", "social_media"], "category": "marketing", "label": "Facebook/Meta Ads"},
    "social_media_marketing": {"service_types": ["social_media"], "category": "marketing", "label": "Social Media Marketing"},
    "email_marketing": {"service_types": ["email_marketing"], "category": "marketing", "label": "Email Marketing"},
    "content_marketing": {"service_types": ["content_marketing"], "category": "marketing", "label": "Content Marketing"},
    "analytics": {"service_types": ["analytics_reporting"], "category": "marketing", "label": "Analytics & Reporting"},

    # Writing
    "copywriting": {"service_types": ["copywriting"], "category": "writing_content", "label": "Copywriting"},
    "technical_writing": {"service_types": ["technical_writing"], "category": "writing_content", "label": "Technical Writing"},
    "blog_writing": {"service_types": ["blog_articles"], "category": "writing_content", "label": "Blog Writing"},
    "creative_writing": {"service_types": ["creative_writing"], "category": "writing_content", "label": "Creative Writing"},
    "grant_writing": {"service_types": ["grant_writing"], "category": "writing_content", "label": "Grant Writing"},

    # Video & Audio
    "video_editing": {"service_types": ["video_editing"], "category": "video_audio", "label": "Video Editing"},
    "premiere_pro": {"service_types": ["video_editing", "video_production"], "category": "video_audio", "label": "Premiere Pro"},
    "davinci_resolve": {"service_types": ["video_editing", "color_grading"], "category": "video_audio", "label": "DaVinci Resolve"},
    "voice_over": {"service_types": ["voice_over"], "category": "video_audio", "label": "Voice Over"},

    # Data
    "data_analysis": {"service_types": ["data_analysis", "data_visualization"], "category": "data_analytics", "label": "Data Analysis"},
    "power_bi": {"service_types": ["business_intelligence", "data_visualization"], "category": "data_analytics", "label": "Power BI"},
    "tableau": {"service_types": ["business_intelligence", "data_visualization"], "category": "data_analytics", "label": "Tableau"},
    "pandas": {"service_types": ["data_analysis", "data_science"], "category": "data_analytics", "label": "Pandas / NumPy"},
    "r_programming": {"service_types": ["statistical_analysis", "data_science"], "category": "data_analytics", "label": "R Programming"},
    "excel_advanced": {"service_types": ["data_analysis"], "category": "data_analytics", "label": "Advanced Excel"},

    # Consulting
    "project_management": {"service_types": ["project_management"], "category": "consulting_business", "label": "Project Management"},
    "agile_scrum": {"service_types": ["project_management"], "category": "consulting_business", "label": "Agile / Scrum"},
    "product_management": {"service_types": ["product_management"], "category": "consulting_business", "label": "Product Management"},
    "business_analysis": {"service_types": ["business_consulting"], "category": "consulting_business", "label": "Business Analysis"},
}

# High-value skill combinations that multiply rate potential
SKILL_SYNERGIES: List[Dict[str, Any]] = [
    {
        "skills": ["python", "machine_learning", "tensorflow"],
        "label": "AI/ML Engineer",
        "rate_premium": 1.35,
        "demand": "surging",
        "description": "Highest-demand combination in 2025. AI/ML engineers command 35% premium.",
    },
    {
        "skills": ["react", "nodejs", "typescript"],
        "label": "Full-Stack JavaScript",
        "rate_premium": 1.15,
        "demand": "high",
        "description": "Most hired stack on Upwork 2024-2025. Strong and stable demand.",
    },
    {
        "skills": ["python", "aws", "docker", "kubernetes"],
        "label": "Cloud/DevOps Engineer",
        "rate_premium": 1.30,
        "demand": "surging",
        "description": "DevOps engineers are in critical shortage. 30% rate premium over general dev.",
    },
    {
        "skills": ["figma", "ui_ux", "react"],
        "label": "Design Engineer",
        "rate_premium": 1.25,
        "demand": "growing",
        "description": "Hybrid design+code roles are the fastest-growing niche in tech freelancing.",
    },
    {
        "skills": ["python", "sql", "pandas", "power_bi"],
        "label": "Data Analyst",
        "rate_premium": 1.20,
        "demand": "high",
        "description": "Data literacy is in demand across all industries. Strong market positioning.",
    },
    {
        "skills": ["cybersecurity", "penetration_testing", "aws"],
        "label": "Cloud Security Specialist",
        "rate_premium": 1.40,
        "demand": "surging",
        "description": "Top-paying niche. Security talent gap is massive globally.",
    },
    {
        "skills": ["flutter", "firebase", "ui_ux"],
        "label": "Mobile App Developer",
        "rate_premium": 1.15,
        "demand": "high",
        "description": "Cross-platform mobile dev with design skills is highly sought after.",
    },
    {
        "skills": ["seo", "google_ads", "analytics"],
        "label": "Growth Marketing Specialist",
        "rate_premium": 1.20,
        "demand": "growing",
        "description": "Full-funnel marketing expertise with analytics drives premium rates.",
    },
    {
        "skills": ["video_editing", "after_effects", "premiere_pro"],
        "label": "Video Production Specialist",
        "rate_premium": 1.10,
        "demand": "growing",
        "description": "Video content demand continues to rise with short-form platforms.",
    },
    {
        "skills": ["solidity", "web3", "react"],
        "label": "Web3 Full-Stack Developer",
        "rate_premium": 1.25,
        "demand": "moderate",
        "description": "Blockchain demand has cooled from 2022 peak but still pays premium for quality.",
    },
    {
        "skills": ["python", "llm", "nlp"],
        "label": "LLM/AI Application Developer",
        "rate_premium": 1.45,
        "demand": "surging",
        "description": "The hottest niche in 2025. LLM app builders command the highest premiums.",
    },
]

# ============================================================================
# CORE ANALYSIS FUNCTIONS
# ============================================================================

def get_available_skills() -> List[Dict[str, Any]]:
    """Return all analyzable skills grouped by category."""
    categories: Dict[str, List[Dict[str, Any]]] = {}
    for key, info in SKILL_TAXONOMY.items():
        cat = info["category"]
        if cat not in categories:
            categories[cat] = []
        # Get primary demand data
        primary_svc = info["service_types"][0] if info["service_types"] else None
        demand_info = get_demand_data(primary_svc) if primary_svc else None
        categories[cat].append({
            "key": key,
            "label": info["label"],
            "demand_score": demand_info["demand_score"] if demand_info else 50,
            "trend": demand_info.get("trend", "stable") if demand_info else "unknown",
        })

    category_labels = {
        "software_development": "Software & Technology",
        "design_creative": "Design & Creative",
        "marketing": "Marketing & Growth",
        "writing_content": "Writing & Content",
        "video_audio": "Video & Audio",
        "data_analytics": "Data & Analytics",
        "consulting_business": "Consulting & Business",
    }
    result = []
    for cat_key, skills in categories.items():
        skills.sort(key=lambda s: s["demand_score"], reverse=True)
        result.append({
            "key": cat_key,
            "label": category_labels.get(cat_key, cat_key),
            "skills": skills,
        })
    return result


def analyze_skills(
    user_skills: List[str],
    experience_level: str = "mid",
    country_code: Optional[str] = None,
    target_role: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Comprehensive skill analysis.

    Returns:
    - Per-skill scores (demand, rate impact, trend)
    - Matched synergies (powerful skill combos the user has)
    - Skill gaps (high-value skills to learn)
    - Personalized recommendations with ROI
    - Regional competitiveness score
    """
    # Normalize skill keys
    normalized_skills = [s.lower().strip().replace(" ", "_").replace("-", "_") for s in user_skills]
    valid_skills = [s for s in normalized_skills if s in SKILL_TAXONOMY]
    unknown_skills = [s for s in normalized_skills if s not in SKILL_TAXONOMY]

    # 1. Score each user skill
    skill_scores = []
    total_demand = 0
    for skill_key in valid_skills:
        info = SKILL_TAXONOMY[skill_key]
        scores = _score_skill(skill_key, info, experience_level, country_code)
        skill_scores.append(scores)
        total_demand += scores["demand_score"]

    skill_scores.sort(key=lambda s: s["market_value_score"], reverse=True)

    # 2. Detect synergies
    matched_synergies = []
    for syn in SKILL_SYNERGIES:
        match_count = sum(1 for s in syn["skills"] if s in valid_skills)
        if match_count >= 2:
            matched_synergies.append({
                **syn,
                "matched_count": match_count,
                "total_count": len(syn["skills"]),
                "completion_pct": round(match_count / len(syn["skills"]) * 100),
                "missing_skills": [s for s in syn["skills"] if s not in valid_skills],
            })
    matched_synergies.sort(key=lambda s: s["completion_pct"], reverse=True)

    # 3. Identify skill gaps — high-demand skills the user doesn't have
    skill_gaps = _identify_skill_gaps(valid_skills, experience_level, country_code, target_role)

    # 4. Career path recommendations
    recommendations = _build_recommendations(
        valid_skills, skill_scores, matched_synergies, skill_gaps, experience_level, country_code
    )

    # 5. Overall profile score
    profile_score = _calculate_profile_score(skill_scores, matched_synergies, valid_skills)

    # 6. Regional competitiveness
    regional_context = None
    if country_code:
        regional_context = _build_regional_context(country_code, valid_skills, experience_level)

    # 7. Rate estimate based on skills
    estimated_rate = _estimate_rate_from_skills(valid_skills, experience_level, country_code)

    return {
        "profile_score": profile_score,
        "skill_count": len(valid_skills),
        "skills_analyzed": skill_scores,
        "synergies": matched_synergies,
        "skill_gaps": skill_gaps[:10],  # Top 10 recommendations
        "recommendations": recommendations,
        "estimated_rate": estimated_rate,
        "regional_context": regional_context,
        "unknown_skills": unknown_skills,
        "meta": {
            "experience_level": experience_level,
            "country_code": country_code,
            "target_role": target_role,
            "data_version": DATA_VERSION,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def _score_skill(
    skill_key: str,
    info: Dict[str, Any],
    experience_level: str,
    country_code: Optional[str],
) -> Dict[str, Any]:
    """Score a single skill based on market demand and rate data."""
    service_types = info["service_types"]

    # Aggregate demand across all service types this skill maps to
    max_demand = 0
    best_trend = "unknown"
    demand_scores = []
    for svc in service_types:
        dd = get_demand_data(svc)
        if dd:
            demand_scores.append(dd["demand_score"])
            if dd["demand_score"] > max_demand:
                max_demand = dd["demand_score"]
                best_trend = dd.get("trend", "unknown")

    avg_demand = sum(demand_scores) / len(demand_scores) if demand_scores else 50

    # Rate data — avg across service types
    rates = []
    for svc in service_types:
        svc_rate = get_upwork_service_rate(svc)
        if svc_rate:
            rate = svc_rate.get(experience_level, svc_rate.get("mid", 40))
            rates.append(rate)

    avg_rate = sum(rates) / len(rates) if rates else 40
    max_rate = max(rates) if rates else 40

    # Country adjustment
    country_mult = 1.0
    if country_code:
        crd = get_country_rate_data(country_code)
        if crd:
            us_rate = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
            country_mult = crd["avg"] / us_rate if us_rate else 1.0

    adjusted_rate = avg_rate * country_mult

    # Market value score (0-100)
    # Combines demand (60%) and rate potential (40%)
    rate_score = min(avg_rate / 2, 100)  # $200/hr = 100 score
    market_value_score = round(avg_demand * 0.6 + rate_score * 0.4)

    return {
        "skill": skill_key,
        "label": info["label"],
        "category": info["category"],
        "demand_score": round(avg_demand),
        "demand_trend": best_trend,
        "market_value_score": market_value_score,
        "global_avg_rate": round(avg_rate, 2),
        "your_estimated_rate": round(adjusted_rate, 2),
        "max_rate_potential": round(max_rate * (1.0 if not country_code else country_mult), 2),
        "service_types": service_types,
    }


def _identify_skill_gaps(
    current_skills: List[str],
    experience_level: str,
    country_code: Optional[str],
    target_role: Optional[str],
) -> List[Dict[str, Any]]:
    """Identify high-value skills the user doesn't have."""
    gaps = []

    for skill_key, info in SKILL_TAXONOMY.items():
        if skill_key in current_skills:
            continue

        # Score the missing skill
        score = _score_skill(skill_key, info, experience_level, country_code)

        # Check if it completes any synergy
        completes_synergy = None
        for syn in SKILL_SYNERGIES:
            if skill_key in syn["skills"]:
                match_count = sum(1 for s in syn["skills"] if s in current_skills)
                if match_count >= 1:
                    completes_synergy = {
                        "label": syn["label"],
                        "current_match": match_count,
                        "total": len(syn["skills"]),
                        "rate_premium": syn["rate_premium"],
                    }
                    break

        # Learning time estimate (months)
        learn_time = _estimate_learning_time(skill_key, current_skills)

        # ROI: potential rate increase per month of learning
        rate_increase = score["global_avg_rate"] * 0.15  # Each skill adds ~15% rate potential
        if completes_synergy:
            rate_increase *= completes_synergy["rate_premium"]
        roi_per_month = rate_increase / max(learn_time, 1)

        gaps.append({
            **score,
            "completes_synergy": completes_synergy,
            "learn_time_months": learn_time,
            "potential_rate_increase": round(rate_increase, 2),
            "roi_per_month": round(roi_per_month, 2),
            "priority": "critical" if score["demand_score"] >= 85 and roi_per_month > 5 else
                       "high" if score["demand_score"] >= 70 or roi_per_month > 3 else
                       "medium" if score["demand_score"] >= 50 else "low",
        })

    # Sort by ROI per month (best learning investments first)
    gaps.sort(key=lambda g: g["roi_per_month"], reverse=True)
    return gaps


def _estimate_learning_time(skill_key: str, current_skills: List[str]) -> float:
    """Estimate months to learn a skill based on related skills already known."""
    # Base learning times (months)
    base_times = {
        "react": 2, "angular": 3, "vue": 2, "nextjs": 1.5, "nodejs": 2,
        "python": 2, "django": 2, "fastapi": 1.5, "java": 4, "csharp": 4,
        "dotnet": 3, "php": 2, "laravel": 2, "wordpress": 1, "shopify": 1,
        "ruby": 3, "go": 3, "rust": 5, "typescript": 1.5,
        "swift": 3, "kotlin": 3, "flutter": 2.5, "react_native": 2,
        "sql": 1.5, "mongodb": 1, "postgresql": 1.5,
        "aws": 3, "azure": 3, "gcp": 3, "docker": 1.5, "kubernetes": 3,
        "terraform": 2.5, "ci_cd": 2,
        "tensorflow": 4, "pytorch": 4, "machine_learning": 6,
        "deep_learning": 5, "nlp": 4, "computer_vision": 4, "llm": 3,
        "solidity": 3, "web3": 4, "cybersecurity": 6, "penetration_testing": 4,
        "unity": 4, "unreal": 5, "embedded": 4,
        "figma": 1, "adobe_xd": 1, "photoshop": 2, "illustrator": 2,
        "after_effects": 3, "blender": 4, "canva": 0.5,
        "ui_ux": 3, "logo_design": 2, "branding": 2,
        "seo": 2, "google_ads": 2, "facebook_ads": 1.5,
        "social_media_marketing": 1, "email_marketing": 1, "content_marketing": 2,
        "analytics": 2,
        "copywriting": 2, "technical_writing": 2, "blog_writing": 1,
        "creative_writing": 3, "grant_writing": 3,
        "video_editing": 2, "premiere_pro": 2, "davinci_resolve": 2, "voice_over": 1,
        "data_analysis": 2, "power_bi": 2, "tableau": 2,
        "pandas": 2, "r_programming": 3, "excel_advanced": 1,
        "project_management": 2, "agile_scrum": 1, "product_management": 3,
        "business_analysis": 2,
    }
    base = base_times.get(skill_key, 3)

    # Reduce time if related skills are known
    info = SKILL_TAXONOMY.get(skill_key, {})
    related_discount = 0
    for cs in current_skills:
        cs_info = SKILL_TAXONOMY.get(cs, {})
        # Same category → 15% faster, same service type → 10% faster
        if cs_info.get("category") == info.get("category"):
            related_discount += 0.15
        if set(cs_info.get("service_types", [])) & set(info.get("service_types", [])):
            related_discount += 0.10

    discount = min(related_discount, 0.5)  # Max 50% reduction
    return round(base * (1 - discount), 1)


def _build_recommendations(
    skills: List[str],
    skill_scores: List[Dict],
    synergies: List[Dict],
    gaps: List[Dict],
    experience_level: str,
    country_code: Optional[str],
) -> List[Dict[str, Any]]:
    """Build personalized career recommendations."""
    recs = []

    # Rec 1: Complete the closest synergy
    for syn in synergies:
        if syn["missing_skills"] and syn["completion_pct"] >= 50:
            missing = syn["missing_skills"]
            missing_labels = [SKILL_TAXONOMY[s]["label"] for s in missing if s in SKILL_TAXONOMY]
            recs.append({
                "type": "synergy_completion",
                "priority": "high",
                "title": f"Complete Your {syn['label']} Stack",
                "description": f"You're {syn['completion_pct']}% there! Learn {', '.join(missing_labels)} to unlock a {int((syn['rate_premium']-1)*100)}% rate premium.",
                "skills_to_learn": missing,
                "rate_impact": f"+{int((syn['rate_premium']-1)*100)}%",
            })
            break

    # Rec 2: Highest ROI skill gap
    if gaps:
        top_gap = gaps[0]
        recs.append({
            "type": "highest_roi_skill",
            "priority": "high",
            "title": f"Learn {top_gap['label']} for Maximum ROI",
            "description": f"Market demand: {top_gap['demand_score']}/100 ({top_gap['demand_trend']}). Estimated +${top_gap['potential_rate_increase']:.0f}/hr after ~{top_gap['learn_time_months']:.0f} months of learning.",
            "skills_to_learn": [top_gap["skill"]],
            "rate_impact": f"+${top_gap['potential_rate_increase']:.0f}/hr",
        })

    # Rec 3: Surging demand alert
    surging = [s for s in skill_scores if s["demand_trend"] == "surging"]
    if surging:
        labels = [s["label"] for s in surging[:3]]
        recs.append({
            "type": "leverage_surging",
            "priority": "medium",
            "title": "Capitalize on Surging Demand",
            "description": f"Your skills {', '.join(labels)} are in surging demand. Consider raising your rates and targeting premium clients.",
            "skills_to_learn": [],
            "rate_impact": "+10-20% rate increase opportunity",
        })

    # Rec 4: Declining skill warning
    declining = [s for s in skill_scores if s["demand_trend"] == "declining"]
    if declining:
        labels = [s["label"] for s in declining[:3]]
        recs.append({
            "type": "declining_warning",
            "priority": "medium",
            "title": "Diversify Away from Declining Skills",
            "description": f"{', '.join(labels)} show declining demand. Consider pivoting time toward higher-growth areas.",
            "skills_to_learn": [g["skill"] for g in gaps[:2]] if gaps else [],
            "rate_impact": "Protect future earnings",
        })

    # Rec 5: Experience level advice
    if experience_level == "junior":
        recs.append({
            "type": "career_growth",
            "priority": "medium",
            "title": "Build Your Portfolio Fast",
            "description": "As a junior, focus on completing 5-10 projects on platforms like Upwork/Fiverr to build social proof. Rates increase 40-60% from junior to mid-level.",
            "skills_to_learn": [],
            "rate_impact": "+40-60% when reaching mid-level",
        })
    elif experience_level == "mid":
        recs.append({
            "type": "career_growth",
            "priority": "medium",
            "title": "Specialize to Reach Senior Level",
            "description": "Mid-level freelancers who specialize in a niche earn 30-50% more than generalists. Pick your strongest skills and double down.",
            "skills_to_learn": [],
            "rate_impact": "+30-50% with specialization",
        })

    # Rec 6: Regional context
    if country_code:
        sa_bench = get_south_asia_benchmark(country_code)
        if sa_bench and sa_bench.get("rate_trend") == "rising":
            recs.append({
                "type": "regional_opportunity",
                "priority": "low",
                "title": f"Rising Rates in {sa_bench['name']}",
                "description": f"Freelancer rates in {sa_bench['name']} are rising ~{sa_bench.get('rate_trend_pct', 0)}% YoY. Your skills position you to benefit from this trend.",
                "skills_to_learn": [],
                "rate_impact": f"+{sa_bench.get('rate_trend_pct', 0)}% YoY trend",
            })

    return recs


def _calculate_profile_score(
    skill_scores: List[Dict],
    synergies: List[Dict],
    skills: List[str],
) -> Dict[str, Any]:
    """Calculate overall freelancer profile strength score."""
    if not skill_scores:
        return {"score": 0, "level": "beginner", "label": "No skills analyzed"}

    # Base: average market value of skills (0-100)
    avg_market = sum(s["market_value_score"] for s in skill_scores) / len(skill_scores)

    # Bonus: Skill diversity across categories
    categories = set(s["category"] for s in skill_scores)
    diversity_bonus = min(len(categories) * 3, 10)

    # Bonus: Synergy matches
    synergy_bonus = min(len([s for s in synergies if s["completion_pct"] >= 75]) * 5, 15)

    # Bonus: Skill count (more skills = more versatile)
    count_bonus = min(len(skills) * 1.5, 10)

    # Bonus: Having surging-demand skills
    surging_count = sum(1 for s in skill_scores if s["demand_trend"] == "surging")
    surging_bonus = min(surging_count * 4, 12)

    score = min(round(avg_market + diversity_bonus + synergy_bonus + count_bonus + surging_bonus), 100)

    if score >= 85:
        level, label = "elite", "Elite Profile — Top 5% market positioning"
    elif score >= 70:
        level, label = "strong", "Strong Profile — Well-positioned for premium clients"
    elif score >= 55:
        level, label = "good", "Good Profile — Competitive in the market"
    elif score >= 40:
        level, label = "developing", "Developing Profile — Room for strategic improvement"
    else:
        level, label = "emerging", "Emerging Profile — Focus on building in-demand skills"

    return {"score": score, "level": level, "label": label}


def _build_regional_context(
    country_code: str,
    skills: List[str],
    experience_level: str,
) -> Dict[str, Any]:
    """Build regional competitiveness analysis."""
    country = get_country_rate_data(country_code)
    if not country:
        return {"available": False}

    us_rate = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
    rate_ratio = country["avg"] / us_rate if us_rate else 0

    # Check Pakistan-specific stats
    pk_stats = None
    if country_code == "PK":
        pk_stats = {
            "market_size": PAKISTAN_FREELANCE_STATS["market_size_usd_millions"],
            "growth": PAKISTAN_FREELANCE_STATS["yoy_growth_pct"],
            "top_skills": PAKISTAN_FREELANCE_STATS["top_skills"][:5],
            "your_skill_alignment": sum(
                1 for s in skills
                if any(ts.lower() in SKILL_TAXONOMY.get(s, {}).get("label", "").lower()
                       for ts in PAKISTAN_FREELANCE_STATS["top_skills"])
            ),
        }

    # Regional comparison
    comparison = []
    compare_codes = ["US", "GB", "IN", "PK", "PH", "BD", "UA", "BR"]
    for cc in compare_codes:
        cr = get_country_rate_data(cc)
        if cr and cc != country_code:
            comparison.append({
                "code": cc,
                "avg_rate": cr["avg"],
                "your_competitive_advantage": round((1 - country["avg"] / max(cr["avg"], 1)) * 100)
                if cr["avg"] > country["avg"] else 0,
            })

    return {
        "available": True,
        "country_code": country_code,
        "avg_rate": country["avg"],
        "median_rate": country["median"],
        "rate_vs_us": round(rate_ratio * 100),
        "sample_size": country.get("sample", 0),
        "global_rank": country.get("rank", 0),
        "pakistan_stats": pk_stats,
        "comparison": sorted(comparison, key=lambda c: c["avg_rate"], reverse=True),
    }


def _estimate_rate_from_skills(
    skills: List[str],
    experience_level: str,
    country_code: Optional[str],
) -> Dict[str, Any]:
    """Estimate hourly rate based on user's skill portfolio."""
    if not skills:
        return {"hourly_rate": 0, "range_low": 0, "range_high": 0}

    rates = []
    for sk in skills:
        info = SKILL_TAXONOMY.get(sk)
        if not info:
            continue
        for svc in info["service_types"]:
            svc_rate = get_upwork_service_rate(svc)
            if svc_rate:
                rates.append(svc_rate.get(experience_level, svc_rate.get("mid", 40)))

    if not rates:
        return {"hourly_rate": 40, "range_low": 25, "range_high": 60}

    avg_rate = sum(rates) / len(rates)
    max_rate = max(rates)

    # Country adjustment
    if country_code:
        crd = get_country_rate_data(country_code)
        if crd:
            us_avg = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
            mult = crd["avg"] / us_avg if us_avg else 1.0
            avg_rate *= mult
            max_rate *= mult

    return {
        "hourly_rate": round(avg_rate, 2),
        "range_low": round(avg_rate * 0.75, 2),
        "range_high": round(max_rate * 1.1, 2),
        "currency": "USD",
    }
