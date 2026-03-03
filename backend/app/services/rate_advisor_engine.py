# @AI-HINT: AI Rate Advisor engine — personalized freelancer rate recommendations based on skills, location, experience
"""
AI Rate Advisor Engine - "What rate should YOU charge?"

Different from Price Estimator (which estimates project cost from a client perspective).
This tool helps FREELANCERS set their personal hourly and project rates based on:
1. Their specific skill combination
2. Experience level
3. Geographic location (country + city)
4. Target platform (Upwork, Fiverr, direct)
5. Market demand for their niche

Data-driven using Arc.dev 2025 survey, Upwork/Fiverr actual rates, and regional benchmarks.
"""

import math
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.market_data_2025 import (
    UPWORK_SERVICE_RATES,
    DEMAND_INDEX_2025,
    COUNTRY_DEVELOPER_RATES,
    CITY_RATES,
    PLATFORM_RATES,
    SOUTH_ASIA_BENCHMARKS,
    PAKISTAN_FREELANCE_STATS,
    get_country_rate_data,
    get_city_rate_data,
    get_platform_rates,
    get_upwork_service_rate,
    get_demand_data,
    get_south_asia_benchmark,
    calculate_data_driven_rate,
    DATA_VERSION,
)

logger = logging.getLogger("megilance")

# ============================================================================
# RATE CALCULATION CONSTANTS
# ============================================================================

# Experience level multipliers (relative to mid-level baseline)
EXPERIENCE_MULTIPLIERS = {
    "junior":  0.55,
    "mid":     1.00,
    "senior":  1.55,
    "expert":  2.10,
}

# Portfolio strength impacts rate negotiation power
PORTFOLIO_STRENGTH_BONUS = {
    "none": 0.0,
    "basic": 0.05,       # A few projects
    "strong": 0.12,      # 10+ quality projects
    "exceptional": 0.22, # Recognized work, awards, open source
}

# Platform fee structures (to calculate take-home)
PLATFORM_FEES = {
    "upwork": {"label": "Upwork", "fee_pct": 10.0, "note": "10% service fee (was 5-20% tiered, now flat 10%)"},
    "fiverr": {"label": "Fiverr", "fee_pct": 20.0, "note": "20% service fee on all orders"},
    "toptal": {"label": "Toptal", "fee_pct": 0.0, "note": "0% fee to freelancer (client pays markup)"},
    "direct": {"label": "Direct Client", "fee_pct": 0.0, "note": "No platform fees, but requires own marketing/invoicing"},
    "freelancer": {"label": "Freelancer.com", "fee_pct": 10.0, "note": "10% or $5 fixed fee"},
}

# Niche premium multipliers — specialized niches command higher rates
NICHE_PREMIUMS: Dict[str, Dict[str, Any]] = {
    "ai_ml_solution": {"premium": 1.35, "label": "AI / Machine Learning"},
    "machine_learning": {"premium": 1.35, "label": "Machine Learning"},
    "blockchain_web3": {"premium": 1.20, "label": "Blockchain / Web3"},
    "cybersecurity": {"premium": 1.40, "label": "Cybersecurity"},
    "devops_infrastructure": {"premium": 1.25, "label": "DevOps / Cloud"},
    "saas_product": {"premium": 1.15, "label": "SaaS Products"},
    "iot_embedded": {"premium": 1.20, "label": "IoT / Embedded"},
    "ar_vr_experience": {"premium": 1.25, "label": "AR/VR"},
}

# ============================================================================
# PUBLIC API FUNCTIONS
# ============================================================================

def get_rate_options() -> Dict[str, Any]:
    """Return options for the rate advisor form."""
    experiences = [
        {"key": "junior", "label": "Junior (0-2 years)", "description": "Learning and building portfolio"},
        {"key": "mid", "label": "Mid-Level (2-5 years)", "description": "Competent and independent"},
        {"key": "senior", "label": "Senior (5-10 years)", "description": "Expert with proven track record"},
        {"key": "expert", "label": "Expert (10+ years)", "description": "Industry leader, deep specialization"},
    ]
    portfolios = [
        {"key": "none", "label": "No portfolio yet"},
        {"key": "basic", "label": "A few projects (1-5)"},
        {"key": "strong", "label": "Solid portfolio (10+ projects)"},
        {"key": "exceptional", "label": "Exceptional (awards, recognized work)"},
    ]
    platforms = [
        {"key": k, **v} for k, v in PLATFORM_FEES.items()
    ]
    # Top service types from UPWORK_SERVICE_RATES
    service_types = []
    for key in sorted(UPWORK_SERVICE_RATES.keys()):
        label = key.replace("_", " ").title()
        service_types.append({"key": key, "label": label})

    # Top countries
    countries = []
    for cc, data in sorted(COUNTRY_DEVELOPER_RATES.items(), key=lambda x: x[1].get("rank", 999)):
        countries.append({
            "code": cc,
            "avg_rate": data["avg"],
            "rank": data.get("rank", 0),
        })

    return {
        "experience_levels": experiences,
        "portfolio_strengths": portfolios,
        "platforms": platforms,
        "service_types": service_types,
        "countries": countries[:30],
    }


def advise_rate(
    service_type: str,
    experience_level: str = "mid",
    country_code: Optional[str] = None,
    city: Optional[str] = None,
    portfolio_strength: str = "basic",
    target_platform: str = "upwork",
    weekly_hours: int = 40,
    skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Generate personalized rate recommendation.

    Returns:
    - Recommended hourly rate (low / recommended / premium)
    - Monthly / annual income projections
    - Platform-specific advice (fees, take-home)
    - How you compare to market benchmarks
    - Rate negotiation tips
    """
    # 1. Base rate from market data
    base_rate = _calculate_base_rate(service_type, experience_level)

    # 2. Geographic adjustment
    geo_adj = _geographic_adjustment(country_code, city)

    # 3. Demand multiplier
    demand_adj = _demand_adjustment(service_type)

    # 4. Portfolio bonus
    portfolio_bonus = PORTFOLIO_STRENGTH_BONUS.get(portfolio_strength, 0.05)

    # 5. Niche premium
    niche_info = NICHE_PREMIUMS.get(service_type, {"premium": 1.0, "label": service_type.replace("_", " ").title()})
    niche_mult = niche_info["premium"]

    # 6. Calculate rates
    adjusted_rate = base_rate * geo_adj["multiplier"] * demand_adj["multiplier"] * niche_mult * (1 + portfolio_bonus)

    recommended_rate = round(adjusted_rate, 2)
    low_rate = round(adjusted_rate * 0.80, 2)       # 20% below = minimum viable
    premium_rate = round(adjusted_rate * 1.30, 2)    # 30% above = premium positioning

    # 7. Platform fee calculation
    platform_info = _calculate_platform_earnings(recommended_rate, target_platform, weekly_hours)

    # 8. Market comparison
    market_comparison = _compare_to_market(recommended_rate, service_type, experience_level, country_code)

    # 9. Income projections
    income = _project_income(recommended_rate, weekly_hours, target_platform)

    # 10. Rate negotiation tips
    tips = _generate_rate_tips(
        service_type, experience_level, country_code, demand_adj, portfolio_strength, recommended_rate
    )

    # 11. Rate breakdown showing how we got here
    rate_breakdown = _build_rate_breakdown(
        base_rate, geo_adj, demand_adj, portfolio_bonus, niche_mult, recommended_rate
    )

    # 12. Cross-platform comparison
    platform_comparison = _cross_platform_comparison(recommended_rate, weekly_hours)

    return {
        "rates": {
            "minimum": low_rate,
            "recommended": recommended_rate,
            "premium": premium_rate,
            "currency": "USD",
        },
        "income": income,
        "platform": platform_info,
        "platform_comparison": platform_comparison,
        "market_comparison": market_comparison,
        "rate_breakdown": rate_breakdown,
        "tips": tips,
        "meta": {
            "service_type": service_type,
            "experience_level": experience_level,
            "country_code": country_code,
            "city": city,
            "portfolio_strength": portfolio_strength,
            "target_platform": target_platform,
            "niche_premium_applied": niche_mult > 1.0,
            "data_version": DATA_VERSION,
            "generated_at": datetime.utcnow().isoformat(),
        },
    }


# ============================================================================
# INTERNAL CALCULATION FUNCTIONS
# ============================================================================

def _calculate_base_rate(service_type: str, experience_level: str) -> float:
    """Calculate base rate from Upwork market data + experience multiplier."""
    # Try Upwork service rates first (most granular)
    svc_rate = get_upwork_service_rate(service_type)
    if svc_rate:
        rate = svc_rate.get(experience_level, svc_rate.get("mid", 40))
        return rate

    # Fall back to platform category rates
    platform_data = get_platform_rates("upwork")
    if platform_data:
        categories = platform_data.get("categories", {})
        for cat_key, cat_data in categories.items():
            tiers = cat_data.get("tiers", {})
            tier_key = {"junior": "entry", "mid": "mid", "senior": "expert", "expert": "expert"}.get(experience_level, "mid")
            if tier_key in tiers:
                return tiers[tier_key]

    # Absolute fallback
    base = 40
    mult = EXPERIENCE_MULTIPLIERS.get(experience_level, 1.0)
    return base * mult


def _geographic_adjustment(
    country_code: Optional[str],
    city: Optional[str],
) -> Dict[str, Any]:
    """Calculate geographic rate adjustment."""
    if not country_code:
        return {"multiplier": 1.0, "source": "global_average", "details": None}

    # Try city-level first
    if city:
        city_data = get_city_rate_data(city, country_code)
        if city_data:
            us_rate = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
            mult = city_data["avg"] / us_rate if us_rate else 1.0
            return {
                "multiplier": round(mult, 3),
                "source": "city_data",
                "details": {
                    "city": city,
                    "country": country_code,
                    "city_avg_rate": city_data["avg"],
                    "city_median_rate": city_data.get("median", city_data["avg"]),
                },
            }

    # Country-level
    crd = get_country_rate_data(country_code)
    if crd:
        us_rate = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
        mult = crd["avg"] / us_rate if us_rate else 1.0
        return {
            "multiplier": round(mult, 3),
            "source": "country_data",
            "details": {
                "country": country_code,
                "country_avg_rate": crd["avg"],
                "country_median_rate": crd.get("median", crd["avg"]),
                "sample_size": crd.get("sample", 0),
                "rank": crd.get("rank", 0),
            },
        }

    return {"multiplier": 1.0, "source": "no_data", "details": None}


def _demand_adjustment(service_type: str) -> Dict[str, Any]:
    """Adjust rate based on current market demand for the service type."""
    dd = get_demand_data(service_type)
    if not dd:
        return {"multiplier": 1.0, "demand_score": 50, "trend": "unknown"}

    score = dd["demand_score"]
    trend = dd.get("trend", "stable")
    supply = dd.get("supply_level", "balanced")

    # Demand score → multiplier mapping
    # 90+ demand → 1.15x, 70+ → 1.05x, 50 → 1.0x, 30 → 0.90x, 10 → 0.80x
    mult = 0.80 + (score / 100) * 0.40  # Linear: 0.80 to 1.20

    # Supply adjustment: scarce supply → boost, oversaturated → reduce
    if supply == "very_low":
        mult *= 1.08
    elif supply == "low":
        mult *= 1.04
    elif supply == "high":
        mult *= 0.96
    elif supply == "very_high":
        mult *= 0.92

    return {
        "multiplier": round(mult, 3),
        "demand_score": score,
        "trend": trend,
        "supply_level": supply,
        "growth_yoy_pct": dd.get("growth_yoy_pct"),
    }


def _calculate_platform_earnings(
    hourly_rate: float,
    platform: str,
    weekly_hours: int,
) -> Dict[str, Any]:
    """Calculate take-home earnings after platform fees."""
    fee_info = PLATFORM_FEES.get(platform, PLATFORM_FEES["direct"])
    fee_pct = fee_info["fee_pct"]
    take_home_rate = hourly_rate * (1 - fee_pct / 100)

    return {
        "platform": fee_info["label"],
        "gross_rate": hourly_rate,
        "fee_pct": fee_pct,
        "take_home_rate": round(take_home_rate, 2),
        "fee_per_hour": round(hourly_rate - take_home_rate, 2),
        "note": fee_info["note"],
    }


def _project_income(
    hourly_rate: float,
    weekly_hours: int,
    platform: str,
) -> Dict[str, Any]:
    """Project income at different utilization levels."""
    fee_pct = PLATFORM_FEES.get(platform, {}).get("fee_pct", 0)
    net_rate = hourly_rate * (1 - fee_pct / 100)

    # Utilization: not all hours are billable
    scenarios = {
        "conservative": {"utilization": 0.60, "label": "Conservative (60% billable)"},
        "average": {"utilization": 0.75, "label": "Average (75% billable)"},
        "optimistic": {"utilization": 0.90, "label": "Optimistic (90% billable)"},
    }
    projections = {}
    for key, sc in scenarios.items():
        billable_hours_week = weekly_hours * sc["utilization"]
        weekly = net_rate * billable_hours_week
        monthly = weekly * 4.33  # Avg weeks/month
        annual = monthly * 11    # Account for vacation/downtime
        projections[key] = {
            "label": sc["label"],
            "billable_hours_week": round(billable_hours_week, 1),
            "weekly": round(weekly, 2),
            "monthly": round(monthly, 2),
            "annual": round(annual, 2),
        }

    return {
        "hourly_net": round(net_rate, 2),
        "projections": projections,
    }


def _compare_to_market(
    rate: float,
    service_type: str,
    experience_level: str,
    country_code: Optional[str],
) -> Dict[str, Any]:
    """Show how the recommended rate compares to market benchmarks."""
    comparisons = []

    # 1. Upwork global benchmark
    svc_rate = get_upwork_service_rate(service_type)
    if svc_rate:
        mid_rate = svc_rate.get("mid", 40)
        comparisons.append({
            "benchmark": "Upwork Global Average",
            "rate": mid_rate,
            "your_position": _position_label(rate, mid_rate),
            "difference_pct": round((rate / mid_rate - 1) * 100) if mid_rate else 0,
        })

    # 2. Country benchmark
    if country_code:
        crd = get_country_rate_data(country_code)
        if crd:
            comparisons.append({
                "benchmark": f"{country_code} Average Developer Rate",
                "rate": crd["avg"],
                "your_position": _position_label(rate, crd["avg"]),
                "difference_pct": round((rate / crd["avg"] - 1) * 100) if crd["avg"] else 0,
            })

    # 3. US benchmark (global top)
    us_data = get_country_rate_data("US")
    if us_data:
        comparisons.append({
            "benchmark": "US Average Developer Rate",
            "rate": us_data["avg"],
            "your_position": _position_label(rate, us_data["avg"]),
            "difference_pct": round((rate / us_data["avg"] - 1) * 100) if us_data["avg"] else 0,
        })

    # 4. Pakistan-specific (if relevant)
    if country_code == "PK":
        pk_skills = PAKISTAN_FREELANCE_STATS.get("freelancer_skill_rates_usd", {})
        # Find closest matching skill
        svc_label = service_type.replace("_", " ").lower()
        for skill_name, pk_rate_range in pk_skills.items():
            if any(word in svc_label for word in skill_name.lower().split()):
                avg_pk = (pk_rate_range["min"] + pk_rate_range["max"]) / 2
                comparisons.append({
                    "benchmark": f"Pakistan '{skill_name}' Average",
                    "rate": avg_pk,
                    "your_position": _position_label(rate, avg_pk),
                    "difference_pct": round((rate / avg_pk - 1) * 100) if avg_pk else 0,
                })
                break

    # Percentile estimate
    percentile = _estimate_percentile(rate, service_type, country_code)

    return {
        "comparisons": comparisons,
        "estimated_percentile": percentile,
    }


def _position_label(your_rate: float, benchmark: float) -> str:
    if benchmark == 0:
        return "N/A"
    ratio = your_rate / benchmark
    if ratio >= 1.3:
        return "Premium (top tier)"
    elif ratio >= 1.1:
        return "Above average"
    elif ratio >= 0.9:
        return "Market rate"
    elif ratio >= 0.7:
        return "Below average"
    else:
        return "Budget tier"


def _estimate_percentile(rate: float, service_type: str, country_code: Optional[str]) -> int:
    """Rough percentile estimate — where does this rate land?"""
    # Get reference points
    svc_rates = get_upwork_service_rate(service_type)
    if not svc_rates:
        return 50

    junior = svc_rates.get("junior", 20)
    mid = svc_rates.get("mid", 40)
    senior = svc_rates.get("senior", 70)
    expert = svc_rates.get("expert", 100)

    # Country adjust reference points
    if country_code:
        crd = get_country_rate_data(country_code)
        if crd:
            us_avg = COUNTRY_DEVELOPER_RATES.get("US", {}).get("avg", 70)
            mult = crd["avg"] / us_avg if us_avg else 1.0
            junior, mid, senior, expert = junior * mult, mid * mult, senior * mult, expert * mult

    # Map rate to percentile via linear interpolation between tiers
    if rate <= junior:
        return max(5, round(25 * (rate / junior)))
    elif rate <= mid:
        return round(25 + 25 * ((rate - junior) / max(mid - junior, 1)))
    elif rate <= senior:
        return round(50 + 25 * ((rate - mid) / max(senior - mid, 1)))
    elif rate <= expert:
        return round(75 + 20 * ((rate - senior) / max(expert - senior, 1)))
    else:
        return min(99, round(95 + 4 * ((rate - expert) / max(expert, 1))))


def _cross_platform_comparison(hourly_rate: float, weekly_hours: int) -> List[Dict[str, Any]]:
    """Compare earnings across platforms."""
    result = []
    for key, info in PLATFORM_FEES.items():
        fee = info["fee_pct"]
        net = hourly_rate * (1 - fee / 100)
        weekly = net * weekly_hours * 0.75  # 75% utilization
        monthly = weekly * 4.33
        result.append({
            "platform": info["label"],
            "fee_pct": fee,
            "net_hourly": round(net, 2),
            "monthly_estimate": round(monthly, 2),
            "annual_estimate": round(monthly * 11, 2),
        })
    result.sort(key=lambda x: x["net_hourly"], reverse=True)
    return result


def _generate_rate_tips(
    service_type: str,
    experience_level: str,
    country_code: Optional[str],
    demand_adj: Dict,
    portfolio_strength: str,
    rate: float,
) -> List[Dict[str, str]]:
    """Generate actionable rate-setting tips."""
    tips = []

    # Demand-based tips
    trend = demand_adj.get("trend", "stable")
    if trend == "surging":
        tips.append({
            "type": "opportunity",
            "title": "Demand is surging — raise your rate!",
            "detail": f"'{service_type.replace('_', ' ').title()}' demand is surging ({demand_adj['demand_score']}/100). Consider setting your rate 15-25% above the recommended rate.",
        })
    elif trend == "declining":
        tips.append({
            "type": "warning",
            "title": "Demand is declining — diversify",
            "detail": "This service type has declining demand. Consider adding complementary skills to maintain/grow your rate.",
        })

    # Portfolio tips
    if portfolio_strength in ("none", "basic"):
        tips.append({
            "type": "growth",
            "title": "Build your portfolio to unlock higher rates",
            "detail": "Freelancers with strong portfolios charge 12-22% more. Consider doing 2-3 showcase projects, even at lower rates, to build social proof.",
        })

    # Experience progression
    if experience_level == "junior":
        tips.append({
            "type": "growth",
            "title": "Raise rates every 3-6 months",
            "detail": "Junior freelancers typically double their rate within 12-18 months. Start competitive, deliver quality, then increase rates with each new client.",
        })
    elif experience_level == "mid":
        tips.append({
            "type": "strategy",
            "title": "Specialize to reach senior rates",
            "detail": "Specialists earn 30-50% more than generalists. Pick a niche, build deep expertise, and position yourself as the go-to expert.",
        })

    # Regional tips
    if country_code in ("PK", "IN", "BD"):
        tips.append({
            "type": "strategy",
            "title": "Target US/EU clients for premium rates",
            "detail": "Your location gives you a cost advantage. Market directly to US/EU clients via LinkedIn or direct outreach — they see your rate as competitive while you earn premium income locally.",
        })

    # Platform tip
    tips.append({
        "type": "optimization",
        "title": "Consider Direct Clients",
        "detail": f"Platforms take 10-20% fees. At ${rate:.0f}/hr, you lose ${rate * 0.10:.0f}-${rate * 0.20:.0f}/hr to fees. Build a client pipeline for direct work to maximize take-home pay.",
    })

    # Value pricing tip
    tips.append({
        "type": "advanced",
        "title": "Experiment with project-based pricing",
        "detail": "Fixed-price projects often yield higher effective hourly rates. Estimate effort, add 30% buffer, and quote a flat fee. As you get faster, your effective rate increases.",
    })

    return tips


def _build_rate_breakdown(
    base_rate: float,
    geo_adj: Dict,
    demand_adj: Dict,
    portfolio_bonus: float,
    niche_mult: float,
    final_rate: float,
) -> List[Dict[str, Any]]:
    """Show step-by-step how we calculated the rate."""
    steps = [
        {
            "step": "Market Base Rate",
            "value": round(base_rate, 2),
            "description": "Global average for this service type and experience level",
        },
    ]

    if geo_adj["multiplier"] != 1.0:
        geo_rate = base_rate * geo_adj["multiplier"]
        steps.append({
            "step": "Geographic Adjustment",
            "value": round(geo_rate, 2),
            "description": f"Adjusted for {geo_adj.get('source', 'location')} (×{geo_adj['multiplier']})",
        })

    if demand_adj["multiplier"] != 1.0:
        steps.append({
            "step": "Demand Adjustment",
            "value": None,
            "description": f"Market demand {demand_adj['demand_score']}/100, trend: {demand_adj['trend']} (×{demand_adj['multiplier']})",
        })

    if niche_mult > 1.0:
        steps.append({
            "step": "Niche Premium",
            "value": None,
            "description": f"Specialized niche premium (×{niche_mult})",
        })

    if portfolio_bonus > 0:
        steps.append({
            "step": "Portfolio Bonus",
            "value": None,
            "description": f"Portfolio strength bonus (+{int(portfolio_bonus * 100)}%)",
        })

    steps.append({
        "step": "Recommended Rate",
        "value": final_rate,
        "description": "Your personalized recommended hourly rate",
    })

    return steps
