# @AI-HINT: Freelance Income Calculator engine – comprehensive income projections for self-employed workers
"""
Income Calculator Engine - Standalone, public freelance income calculator.
No authentication required. Projects annual/monthly income, calculates effective rates,
factors in taxes, expenses, retirement, and provides financial health insights.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger("megilance")

# ============================================================================
# Tax Brackets by Country (simplified)
# ============================================================================

TAX_BRACKETS: Dict[str, Dict[str, Any]] = {
    "us": {
        "label": "United States",
        "currency": "USD",
        "income_tax": [
            {"min": 0, "max": 11000, "rate": 0.10},
            {"min": 11001, "max": 44725, "rate": 0.12},
            {"min": 44726, "max": 95375, "rate": 0.22},
            {"min": 95376, "max": 182100, "rate": 0.24},
            {"min": 182101, "max": 231250, "rate": 0.32},
            {"min": 231251, "max": 578125, "rate": 0.35},
            {"min": 578126, "max": None, "rate": 0.37},
        ],
        "self_employment_tax": 0.153,
        "self_employment_deduction": 0.5,
        "standard_deduction": 14600,
    },
    "uk": {
        "label": "United Kingdom",
        "currency": "GBP",
        "income_tax": [
            {"min": 0, "max": 12570, "rate": 0.0},
            {"min": 12571, "max": 50270, "rate": 0.20},
            {"min": 50271, "max": 125140, "rate": 0.40},
            {"min": 125141, "max": None, "rate": 0.45},
        ],
        "self_employment_tax": 0.09,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
    "canada": {
        "label": "Canada",
        "currency": "CAD",
        "income_tax": [
            {"min": 0, "max": 55867, "rate": 0.15},
            {"min": 55868, "max": 111733, "rate": 0.205},
            {"min": 111734, "max": 154906, "rate": 0.26},
            {"min": 154907, "max": 220000, "rate": 0.29},
            {"min": 220001, "max": None, "rate": 0.33},
        ],
        "self_employment_tax": 0.1178,
        "self_employment_deduction": 0.5,
        "standard_deduction": 15705,
    },
    "australia": {
        "label": "Australia",
        "currency": "AUD",
        "income_tax": [
            {"min": 0, "max": 18200, "rate": 0.0},
            {"min": 18201, "max": 45000, "rate": 0.19},
            {"min": 45001, "max": 120000, "rate": 0.325},
            {"min": 120001, "max": 180000, "rate": 0.37},
            {"min": 180001, "max": None, "rate": 0.45},
        ],
        "self_employment_tax": 0.0,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
    "germany": {
        "label": "Germany",
        "currency": "EUR",
        "income_tax": [
            {"min": 0, "max": 10908, "rate": 0.0},
            {"min": 10909, "max": 62809, "rate": 0.24},
            {"min": 62810, "max": 277825, "rate": 0.42},
            {"min": 277826, "max": None, "rate": 0.45},
        ],
        "self_employment_tax": 0.186,
        "self_employment_deduction": 0.5,
        "standard_deduction": 1230,
    },
    "india": {
        "label": "India",
        "currency": "INR",
        "income_tax": [
            {"min": 0, "max": 300000, "rate": 0.0},
            {"min": 300001, "max": 700000, "rate": 0.05},
            {"min": 700001, "max": 1000000, "rate": 0.10},
            {"min": 1000001, "max": 1200000, "rate": 0.15},
            {"min": 1200001, "max": 1500000, "rate": 0.20},
            {"min": 1500001, "max": None, "rate": 0.30},
        ],
        "self_employment_tax": 0.0,
        "self_employment_deduction": 0,
        "standard_deduction": 50000,
    },
    "pakistan": {
        "label": "Pakistan",
        "currency": "PKR",
        "income_tax": [
            {"min": 0, "max": 600000, "rate": 0.0},
            {"min": 600001, "max": 1200000, "rate": 0.025},
            {"min": 1200001, "max": 2400000, "rate": 0.125},
            {"min": 2400001, "max": 3600000, "rate": 0.20},
            {"min": 3600001, "max": 6000000, "rate": 0.25},
            {"min": 6000001, "max": None, "rate": 0.35},
        ],
        "self_employment_tax": 0.0,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
    "uae": {
        "label": "United Arab Emirates",
        "currency": "AED",
        "income_tax": [
            {"min": 0, "max": None, "rate": 0.0},
        ],
        "self_employment_tax": 0.0,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
    "singapore": {
        "label": "Singapore",
        "currency": "SGD",
        "income_tax": [
            {"min": 0, "max": 20000, "rate": 0.0},
            {"min": 20001, "max": 30000, "rate": 0.02},
            {"min": 30001, "max": 40000, "rate": 0.035},
            {"min": 40001, "max": 80000, "rate": 0.07},
            {"min": 80001, "max": 120000, "rate": 0.115},
            {"min": 120001, "max": 160000, "rate": 0.15},
            {"min": 160001, "max": 200000, "rate": 0.18},
            {"min": 200001, "max": 240000, "rate": 0.19},
            {"min": 240001, "max": 280000, "rate": 0.195},
            {"min": 280001, "max": 320000, "rate": 0.20},
            {"min": 320001, "max": None, "rate": 0.22},
        ],
        "self_employment_tax": 0.0,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
    "france": {
        "label": "France",
        "currency": "EUR",
        "income_tax": [
            {"min": 0, "max": 11294, "rate": 0.0},
            {"min": 11295, "max": 28797, "rate": 0.11},
            {"min": 28798, "max": 82341, "rate": 0.30},
            {"min": 82342, "max": 177106, "rate": 0.41},
            {"min": 177107, "max": None, "rate": 0.45},
        ],
        "self_employment_tax": 0.22,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
    "netherlands": {
        "label": "Netherlands",
        "currency": "EUR",
        "income_tax": [
            {"min": 0, "max": 75518, "rate": 0.3693},
            {"min": 75519, "max": None, "rate": 0.4950},
        ],
        "self_employment_tax": 0.0,
        "self_employment_deduction": 0,
        "standard_deduction": 5030,
    },
    "brazil": {
        "label": "Brazil",
        "currency": "BRL",
        "income_tax": [
            {"min": 0, "max": 26963, "rate": 0.0},
            {"min": 26964, "max": 33919, "rate": 0.075},
            {"min": 33920, "max": 45012, "rate": 0.15},
            {"min": 45013, "max": 55976, "rate": 0.225},
            {"min": 55977, "max": None, "rate": 0.275},
        ],
        "self_employment_tax": 0.20,
        "self_employment_deduction": 0,
        "standard_deduction": 0,
    },
}

# ============================================================================
# Expense Categories
# ============================================================================

EXPENSE_CATEGORIES: List[Dict[str, Any]] = [
    {"key": "software", "label": "Software & Tools", "description": "SaaS subscriptions, design tools, dev tools", "icon": "monitor"},
    {"key": "hardware", "label": "Hardware & Equipment", "description": "Computer, peripherals, office equipment", "icon": "laptop"},
    {"key": "office", "label": "Office / Coworking", "description": "Rent, coworking membership, utilities", "icon": "building"},
    {"key": "marketing", "label": "Marketing & Advertising", "description": "Ads, portfolio hosting, business cards", "icon": "megaphone"},
    {"key": "insurance", "label": "Insurance", "description": "Professional liability, health, equipment", "icon": "shield"},
    {"key": "education", "label": "Education & Training", "description": "Courses, certifications, books, conferences", "icon": "book-open"},
    {"key": "travel", "label": "Travel & Transport", "description": "Business travel, commuting, mileage", "icon": "plane"},
    {"key": "accounting", "label": "Accounting & Legal", "description": "Bookkeeper, tax preparation, legal advice", "icon": "calculator"},
    {"key": "communication", "label": "Communication", "description": "Phone, internet, domain names", "icon": "wifi"},
    {"key": "retirement", "label": "Retirement Savings", "description": "IRA, pension contributions, 401k equivalent", "icon": "piggy-bank"},
    {"key": "other", "label": "Other Expenses", "description": "Miscellaneous business expenses", "icon": "more-horizontal"},
]

# ============================================================================
# Income Structure Options
# ============================================================================

INCOME_TYPES: List[Dict[str, str]] = [
    {"key": "hourly", "label": "Hourly Rate"},
    {"key": "daily", "label": "Day Rate"},
    {"key": "project", "label": "Per Project"},
    {"key": "retainer", "label": "Monthly Retainer"},
    {"key": "mixed", "label": "Mixed Income"},
]


# ============================================================================
# Engine Functions
# ============================================================================

def get_options() -> Dict[str, Any]:
    """Return all available calculator options."""
    return {
        "countries": [
            {"key": k, "label": v["label"], "currency": v["currency"]}
            for k, v in TAX_BRACKETS.items()
        ],
        "expense_categories": EXPENSE_CATEGORIES,
        "income_types": INCOME_TYPES,
    }


def calculate_income(
    # Income inputs
    income_type: str = "hourly",
    rate: float = 0,
    hours_per_week: float = 40,
    weeks_per_year: float = 48,
    days_per_week: float = 5,
    projects_per_year: int = 6,
    avg_project_value: float = 5000,
    monthly_retainer: float = 0,
    retainer_clients: int = 0,
    # Additional income streams (for mixed)
    additional_income: float = 0,
    # Tax & location
    country: str = "us",
    state_tax_rate: float = 0,
    # Expenses
    monthly_expenses: Dict[str, float] = None,
    # Goals
    savings_goal_percent: float = 20,
    emergency_fund_months: int = 6,
    retirement_contribution_percent: float = 10,
    # Work preferences
    vacation_weeks: int = 4,
    sick_days: int = 5,
) -> Dict[str, Any]:
    """Calculate comprehensive freelance income projections."""

    if not monthly_expenses:
        monthly_expenses = {}

    country_data = TAX_BRACKETS.get(country, TAX_BRACKETS["us"])
    currency = country_data["currency"]

    # STEP 1: Calculate gross annual income
    gross = _calculate_gross_income(
        income_type=income_type,
        rate=rate,
        hours_per_week=hours_per_week,
        weeks_per_year=weeks_per_year,
        days_per_week=days_per_week,
        projects_per_year=projects_per_year,
        avg_project_value=avg_project_value,
        monthly_retainer=monthly_retainer,
        retainer_clients=retainer_clients,
        additional_income=additional_income,
        vacation_weeks=vacation_weeks,
    )

    # STEP 2: Calculate total annual expenses
    annual_expenses = sum(monthly_expenses.values()) * 12
    expense_breakdown = [
        {"category": k, "monthly": v, "annual": v * 12, "label": next((c["label"] for c in EXPENSE_CATEGORIES if c["key"] == k), k)}
        for k, v in monthly_expenses.items()
        if v > 0
    ]

    # STEP 3: Calculate taxable income and taxes
    taxable_income = max(gross["annual"] - annual_expenses - country_data["standard_deduction"], 0)

    # Self-employment tax
    se_tax = taxable_income * country_data["self_employment_tax"]
    se_deduction = se_tax * country_data["self_employment_deduction"]
    adjusted_taxable = max(taxable_income - se_deduction, 0)

    # Income tax
    income_tax = _calculate_progressive_tax(adjusted_taxable, country_data["income_tax"])

    # State/provincial tax
    state_tax = adjusted_taxable * (state_tax_rate / 100)

    total_tax = income_tax + se_tax + state_tax

    # STEP 4: Net income
    net_annual = gross["annual"] - annual_expenses - total_tax
    net_monthly = net_annual / 12
    net_weekly = net_annual / 52

    # STEP 5: Effective rates
    billable_weeks = weeks_per_year - vacation_weeks
    billable_hours = billable_weeks * hours_per_week
    effective_hourly = net_annual / billable_hours if billable_hours > 0 else 0

    # STEP 6: Savings & goals
    monthly_savings = net_monthly * (savings_goal_percent / 100)
    monthly_retirement = net_monthly * (retirement_contribution_percent / 100)
    emergency_fund_target = net_monthly * emergency_fund_months
    disposable_monthly = net_monthly - monthly_savings - monthly_retirement

    # STEP 7: Tax breakdown
    effective_tax_rate = (total_tax / gross["annual"] * 100) if gross["annual"] > 0 else 0

    # STEP 8: Financial health analysis
    health = _analyze_financial_health(
        gross_annual=gross["annual"],
        net_annual=net_annual,
        annual_expenses=annual_expenses,
        effective_tax_rate=effective_tax_rate,
        savings_goal_percent=savings_goal_percent,
        effective_hourly=effective_hourly,
        income_type=income_type,
    )

    # STEP 9: Rate recommendations
    rate_recommendations = _get_rate_recommendations(
        net_annual=net_annual,
        billable_hours=billable_hours,
        annual_expenses=annual_expenses,
        total_tax=total_tax,
        savings_goal_percent=savings_goal_percent,
    )

    return {
        "income": {
            "gross_annual": round(gross["annual"], 2),
            "gross_monthly": round(gross["annual"] / 12, 2),
            "gross_weekly": round(gross["annual"] / 52, 2),
            "gross_daily": round(gross["annual"] / (billable_weeks * days_per_week), 2) if billable_weeks * days_per_week > 0 else 0,
            "breakdown": gross["breakdown"],
        },
        "expenses": {
            "annual": round(annual_expenses, 2),
            "monthly": round(annual_expenses / 12, 2),
            "breakdown": expense_breakdown,
            "expense_ratio": round(annual_expenses / gross["annual"] * 100, 1) if gross["annual"] > 0 else 0,
        },
        "taxes": {
            "income_tax": round(income_tax, 2),
            "self_employment_tax": round(se_tax, 2),
            "state_tax": round(state_tax, 2),
            "total_tax": round(total_tax, 2),
            "effective_rate": round(effective_tax_rate, 1),
            "quarterly_estimate": round(total_tax / 4, 2),
            "country": country_data["label"],
            "currency": currency,
        },
        "net_income": {
            "annual": round(net_annual, 2),
            "monthly": round(net_monthly, 2),
            "weekly": round(net_weekly, 2),
            "daily": round(net_annual / (billable_weeks * days_per_week), 2) if billable_weeks * days_per_week > 0 else 0,
        },
        "effective_rates": {
            "hourly": round(effective_hourly, 2),
            "daily": round(effective_hourly * (hours_per_week / days_per_week), 2) if days_per_week > 0 else 0,
            "billable_hours_year": round(billable_hours, 0),
            "billable_weeks": billable_weeks,
        },
        "savings": {
            "monthly_savings": round(monthly_savings, 2),
            "annual_savings": round(monthly_savings * 12, 2),
            "monthly_retirement": round(monthly_retirement, 2),
            "annual_retirement": round(monthly_retirement * 12, 2),
            "emergency_fund_target": round(emergency_fund_target, 2),
            "disposable_monthly": round(disposable_monthly, 2),
        },
        "health": health,
        "rate_recommendations": rate_recommendations,
        "meta": {
            "currency": currency,
            "country": country_data["label"],
            "generated_at": datetime.utcnow().isoformat(),
            "generator": "MegiLance Income Calculator",
        },
    }


def _calculate_gross_income(
    income_type, rate, hours_per_week, weeks_per_year, days_per_week,
    projects_per_year, avg_project_value, monthly_retainer, retainer_clients,
    additional_income, vacation_weeks,
) -> Dict[str, Any]:
    """Calculate gross annual income from various structures."""
    breakdown = []
    total = 0

    billable_weeks = weeks_per_year - vacation_weeks

    if income_type == "hourly":
        amount = rate * hours_per_week * billable_weeks
        total += amount
        breakdown.append({"source": "Hourly work", "annual": round(amount, 2), "detail": f"{rate}/hr x {hours_per_week}h/wk x {billable_weeks} weeks"})

    elif income_type == "daily":
        amount = rate * days_per_week * billable_weeks
        total += amount
        breakdown.append({"source": "Day rate", "annual": round(amount, 2), "detail": f"{rate}/day x {days_per_week} days/wk x {billable_weeks} weeks"})

    elif income_type == "project":
        amount = projects_per_year * avg_project_value
        total += amount
        breakdown.append({"source": "Project work", "annual": round(amount, 2), "detail": f"{projects_per_year} projects x {avg_project_value}/project"})

    elif income_type == "retainer":
        amount = monthly_retainer * retainer_clients * 12
        total += amount
        breakdown.append({"source": "Retainer clients", "annual": round(amount, 2), "detail": f"{retainer_clients} clients x {monthly_retainer}/mo"})

    elif income_type == "mixed":
        if rate > 0 and hours_per_week > 0:
            hourly_amount = rate * hours_per_week * billable_weeks
            total += hourly_amount
            breakdown.append({"source": "Hourly work", "annual": round(hourly_amount, 2)})
        if monthly_retainer > 0 and retainer_clients > 0:
            retainer_amount = monthly_retainer * retainer_clients * 12
            total += retainer_amount
            breakdown.append({"source": "Retainer clients", "annual": round(retainer_amount, 2)})
        if projects_per_year > 0 and avg_project_value > 0:
            project_amount = projects_per_year * avg_project_value
            total += project_amount
            breakdown.append({"source": "Project work", "annual": round(project_amount, 2)})

    if additional_income > 0:
        total += additional_income
        breakdown.append({"source": "Additional income", "annual": round(additional_income, 2)})

    return {"annual": total, "breakdown": breakdown}


def _calculate_progressive_tax(income: float, brackets: List[Dict]) -> float:
    """Calculate progressive income tax."""
    tax = 0
    for bracket in brackets:
        bracket_min = bracket["min"]
        bracket_max = bracket["max"]
        rate = bracket["rate"]

        if income <= bracket_min:
            break

        taxable_in_bracket = income - bracket_min
        if bracket_max is not None:
            taxable_in_bracket = min(taxable_in_bracket, bracket_max - bracket_min)

        tax += taxable_in_bracket * rate

    return tax


def _analyze_financial_health(
    gross_annual, net_annual, annual_expenses, effective_tax_rate,
    savings_goal_percent, effective_hourly, income_type,
) -> Dict[str, Any]:
    """Provide financial health insights."""
    insights = []
    score = 70  # Start with a baseline

    # Income level
    if net_annual > 100000:
        score += 10
        insights.append({"type": "positive", "title": "Strong Income", "message": "Your net income is above average for freelancers."})
    elif net_annual < 30000:
        score -= 10
        insights.append({"type": "warning", "title": "Low Net Income", "message": "Consider raising rates or increasing billable hours."})

    # Expense ratio
    expense_ratio = (annual_expenses / gross_annual * 100) if gross_annual > 0 else 0
    if expense_ratio > 40:
        score -= 15
        insights.append({"type": "warning", "title": "High Expense Ratio", "message": f"Expenses are {expense_ratio:.0f}% of gross income. Try to keep under 30%."})
    elif expense_ratio < 20:
        score += 5
        insights.append({"type": "positive", "title": "Lean Operations", "message": "Your expense ratio is healthy."})

    # Tax efficiency
    if effective_tax_rate > 35:
        insights.append({"type": "info", "title": "High Tax Burden", "message": "Consider consulting a tax advisor about deductions and retirement contributions."})
    elif effective_tax_rate < 15:
        score += 5
        insights.append({"type": "positive", "title": "Tax-Efficient", "message": "Your effective tax rate is well-managed."})

    # Savings
    if savings_goal_percent >= 20:
        score += 5
        insights.append({"type": "positive", "title": "Good Savings Goal", "message": f"Saving {savings_goal_percent}% is a strong financial habit."})
    elif savings_goal_percent < 10:
        score -= 5
        insights.append({"type": "warning", "title": "Low Savings Rate", "message": "Try to save at least 15-20% for emergencies and growth."})

    # Income diversification
    if income_type == "mixed":
        score += 5
        insights.append({"type": "positive", "title": "Diversified Income", "message": "Multiple income streams reduce risk."})
    else:
        insights.append({"type": "info", "title": "Single Income Stream", "message": "Consider diversifying with retainers or passive income."})

    score = max(0, min(100, score))
    level = "excellent" if score >= 85 else "good" if score >= 65 else "fair" if score >= 45 else "needs_improvement"

    return {
        "score": score,
        "level": level,
        "insights": insights,
    }


def _get_rate_recommendations(
    net_annual, billable_hours, annual_expenses, total_tax, savings_goal_percent,
) -> Dict[str, Any]:
    """Suggest optimal rates based on goals."""
    # Calculate break-even hourly rate
    total_costs = annual_expenses + total_tax
    break_even_hourly = total_costs / billable_hours if billable_hours > 0 else 0

    # Comfortable rate (covers costs + 20% savings)
    target_annual = (total_costs) / (1 - savings_goal_percent / 100) if savings_goal_percent < 100 else total_costs * 2
    comfortable_hourly = target_annual / billable_hours if billable_hours > 0 else 0

    # Premium rate (top 25% target)
    premium_hourly = comfortable_hourly * 1.5

    return {
        "break_even_hourly": round(break_even_hourly, 2),
        "comfortable_hourly": round(comfortable_hourly, 2),
        "premium_hourly": round(premium_hourly, 2),
        "break_even_annual": round(break_even_hourly * billable_hours, 2),
        "comfortable_annual": round(comfortable_hourly * billable_hours, 2),
        "premium_annual": round(premium_hourly * billable_hours, 2),
    }
