# @AI-HINT: Expense & Tax Calculator engine – self-employment tax/expense planning tool
"""
Expense & Tax Calculator Engine - Standalone, public self-employment tax calculator.
No authentication required. Calculates quarterly estimated taxes, deductible expenses,
profit/loss, and provides tax-saving recommendations.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger("megilance")

# ============================================================================
# Tax Filing Statuses
# ============================================================================

FILING_STATUSES: List[Dict[str, str]] = [
    {"key": "single", "label": "Single / Individual"},
    {"key": "married_joint", "label": "Married Filing Jointly"},
    {"key": "married_separate", "label": "Married Filing Separately"},
    {"key": "head_household", "label": "Head of Household"},
    {"key": "sole_proprietor", "label": "Sole Proprietor"},
    {"key": "llc_single", "label": "LLC (Single Member)"},
    {"key": "partnership", "label": "Partnership / LLC Multi-Member"},
    {"key": "s_corp", "label": "S Corporation"},
]

# ============================================================================
# Tax Regions with Rates
# ============================================================================

TAX_REGIONS: Dict[str, Dict[str, Any]] = {
    "us": {
        "label": "United States",
        "currency": "USD",
        "federal_brackets": [
            {"min": 0, "max": 11600, "rate": 0.10},
            {"min": 11601, "max": 47150, "rate": 0.12},
            {"min": 47151, "max": 100525, "rate": 0.22},
            {"min": 100526, "max": 191950, "rate": 0.24},
            {"min": 191951, "max": 243725, "rate": 0.32},
            {"min": 243726, "max": 609350, "rate": 0.35},
            {"min": 609351, "max": None, "rate": 0.37},
        ],
        "self_employment_rate": 0.153,
        "se_income_threshold": 400,
        "se_deduction_factor": 0.5,
        "standard_deduction": {"single": 14600, "married_joint": 29200, "married_separate": 14600, "head_household": 21900},
        "has_state_tax": True,
    },
    "uk": {
        "label": "United Kingdom",
        "currency": "GBP",
        "federal_brackets": [
            {"min": 0, "max": 12570, "rate": 0.0},
            {"min": 12571, "max": 50270, "rate": 0.20},
            {"min": 50271, "max": 125140, "rate": 0.40},
            {"min": 125141, "max": None, "rate": 0.45},
        ],
        "self_employment_rate": 0.09,
        "se_income_threshold": 12570,
        "se_deduction_factor": 0,
        "standard_deduction": {"single": 0},
        "has_state_tax": False,
    },
    "canada": {
        "label": "Canada",
        "currency": "CAD",
        "federal_brackets": [
            {"min": 0, "max": 55867, "rate": 0.15},
            {"min": 55868, "max": 111733, "rate": 0.205},
            {"min": 111734, "max": 154906, "rate": 0.26},
            {"min": 154907, "max": 220000, "rate": 0.29},
            {"min": 220001, "max": None, "rate": 0.33},
        ],
        "self_employment_rate": 0.1178,
        "se_income_threshold": 3500,
        "se_deduction_factor": 0.5,
        "standard_deduction": {"single": 15705},
        "has_state_tax": True,
    },
    "australia": {
        "label": "Australia",
        "currency": "AUD",
        "federal_brackets": [
            {"min": 0, "max": 18200, "rate": 0.0},
            {"min": 18201, "max": 45000, "rate": 0.19},
            {"min": 45001, "max": 120000, "rate": 0.325},
            {"min": 120001, "max": 180000, "rate": 0.37},
            {"min": 180001, "max": None, "rate": 0.45},
        ],
        "self_employment_rate": 0.0,
        "se_income_threshold": 0,
        "se_deduction_factor": 0,
        "standard_deduction": {"single": 0},
        "has_state_tax": False,
    },
    "germany": {
        "label": "Germany",
        "currency": "EUR",
        "federal_brackets": [
            {"min": 0, "max": 10908, "rate": 0.0},
            {"min": 10909, "max": 62809, "rate": 0.24},
            {"min": 62810, "max": 277825, "rate": 0.42},
            {"min": 277826, "max": None, "rate": 0.45},
        ],
        "self_employment_rate": 0.186,
        "se_income_threshold": 0,
        "se_deduction_factor": 0.5,
        "standard_deduction": {"single": 1230},
        "has_state_tax": False,
    },
    "india": {
        "label": "India",
        "currency": "INR",
        "federal_brackets": [
            {"min": 0, "max": 300000, "rate": 0.0},
            {"min": 300001, "max": 700000, "rate": 0.05},
            {"min": 700001, "max": 1000000, "rate": 0.10},
            {"min": 1000001, "max": 1200000, "rate": 0.15},
            {"min": 1200001, "max": 1500000, "rate": 0.20},
            {"min": 1500001, "max": None, "rate": 0.30},
        ],
        "self_employment_rate": 0.0,
        "se_income_threshold": 0,
        "se_deduction_factor": 0,
        "standard_deduction": {"single": 50000},
        "has_state_tax": False,
    },
    "pakistan": {
        "label": "Pakistan",
        "currency": "PKR",
        "federal_brackets": [
            {"min": 0, "max": 600000, "rate": 0.0},
            {"min": 600001, "max": 1200000, "rate": 0.025},
            {"min": 1200001, "max": 2400000, "rate": 0.125},
            {"min": 2400001, "max": 3600000, "rate": 0.20},
            {"min": 3600001, "max": 6000000, "rate": 0.25},
            {"min": 6000001, "max": None, "rate": 0.35},
        ],
        "self_employment_rate": 0.0,
        "se_income_threshold": 0,
        "se_deduction_factor": 0,
        "standard_deduction": {"single": 0},
        "has_state_tax": False,
    },
    "uae": {
        "label": "United Arab Emirates",
        "currency": "AED",
        "federal_brackets": [
            {"min": 0, "max": None, "rate": 0.0},
        ],
        "self_employment_rate": 0.0,
        "se_income_threshold": 0,
        "se_deduction_factor": 0,
        "standard_deduction": {"single": 0},
        "has_state_tax": False,
    },
    "singapore": {
        "label": "Singapore",
        "currency": "SGD",
        "federal_brackets": [
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
        "self_employment_rate": 0.0,
        "se_income_threshold": 0,
        "se_deduction_factor": 0,
        "standard_deduction": {"single": 0},
        "has_state_tax": False,
    },
}

# ============================================================================
# Deduction Categories
# ============================================================================

DEDUCTION_CATEGORIES: List[Dict[str, Any]] = [
    {"key": "home_office", "label": "Home Office", "description": "Dedicated workspace, utilities, internet (proportional)", "icon": "home", "deductible_percent": 100},
    {"key": "equipment", "label": "Equipment & Hardware", "description": "Computer, monitors, peripherals, furniture", "icon": "laptop", "deductible_percent": 100},
    {"key": "software", "label": "Software & Subscriptions", "description": "SaaS tools, design software, dev tools, hosting", "icon": "monitor", "deductible_percent": 100},
    {"key": "travel", "label": "Business Travel", "description": "Flights, hotels, ground transport for business", "icon": "plane", "deductible_percent": 100},
    {"key": "meals", "label": "Business Meals", "description": "Meals with clients or during business travel", "icon": "coffee", "deductible_percent": 50},
    {"key": "marketing", "label": "Marketing & Advertising", "description": "Online ads, portfolio site, business cards, PR", "icon": "megaphone", "deductible_percent": 100},
    {"key": "education", "label": "Education & Training", "description": "Courses, certifications, books, conferences", "icon": "book-open", "deductible_percent": 100},
    {"key": "insurance", "label": "Business Insurance", "description": "Professional liability, E&O, equipment insurance", "icon": "shield", "deductible_percent": 100},
    {"key": "health_insurance", "label": "Health Insurance (SE)", "description": "Self-employed health insurance premiums", "icon": "heart", "deductible_percent": 100},
    {"key": "accounting", "label": "Accounting & Legal", "description": "Bookkeeper, CPA, tax prep, legal services", "icon": "calculator", "deductible_percent": 100},
    {"key": "phone_internet", "label": "Phone & Internet", "description": "Business portion of phone and internet bills", "icon": "wifi", "deductible_percent": 50},
    {"key": "vehicle", "label": "Vehicle / Mileage", "description": "Business use of vehicle, mileage deduction", "icon": "car", "deductible_percent": 100},
    {"key": "retirement", "label": "Retirement Contributions", "description": "SEP-IRA, Solo 401(k), pension contributions", "icon": "piggy-bank", "deductible_percent": 100},
    {"key": "subcontractors", "label": "Subcontractor Payments", "description": "Payments to subcontractors and freelancers", "icon": "users", "deductible_percent": 100},
    {"key": "rent", "label": "Office Rent", "description": "Dedicated office space or coworking membership", "icon": "building", "deductible_percent": 100},
    {"key": "bank_fees", "label": "Bank & Payment Fees", "description": "Business bank fees, payment processing, Stripe/PayPal", "icon": "credit-card", "deductible_percent": 100},
    {"key": "other", "label": "Other Business Expenses", "description": "Miscellaneous deductible business expenses", "icon": "more-horizontal", "deductible_percent": 100},
]

# ============================================================================
# US State Tax Rates (simplified – top marginal or flat)
# ============================================================================

US_STATE_TAXES: Dict[str, Dict[str, Any]] = {
    "none": {"label": "No State Tax", "rate": 0},
    "california": {"label": "California", "rate": 13.3},
    "new_york": {"label": "New York", "rate": 10.9},
    "texas": {"label": "Texas", "rate": 0},
    "florida": {"label": "Florida", "rate": 0},
    "washington": {"label": "Washington", "rate": 0},
    "illinois": {"label": "Illinois", "rate": 4.95},
    "pennsylvania": {"label": "Pennsylvania", "rate": 3.07},
    "ohio": {"label": "Ohio", "rate": 3.99},
    "georgia": {"label": "Georgia", "rate": 5.49},
    "north_carolina": {"label": "North Carolina", "rate": 4.5},
    "michigan": {"label": "Michigan", "rate": 4.25},
    "new_jersey": {"label": "New Jersey", "rate": 10.75},
    "virginia": {"label": "Virginia", "rate": 5.75},
    "massachusetts": {"label": "Massachusetts", "rate": 5.0},
    "colorado": {"label": "Colorado", "rate": 4.4},
    "tennessee": {"label": "Tennessee", "rate": 0},
    "nevada": {"label": "Nevada", "rate": 0},
    "oregon": {"label": "Oregon", "rate": 9.9},
    "maryland": {"label": "Maryland", "rate": 5.75},
    "minnesota": {"label": "Minnesota", "rate": 9.85},
    "connecticut": {"label": "Connecticut", "rate": 6.99},
    "hawaii": {"label": "Hawaii", "rate": 11.0},
    "delaware": {"label": "Delaware", "rate": 6.6},
    "other_state": {"label": "Other State", "rate": 5.0},
}


# ============================================================================
# Engine Functions
# ============================================================================

def get_options() -> Dict[str, Any]:
    """Return all available calculator options."""
    return {
        "filing_statuses": FILING_STATUSES,
        "regions": [
            {"key": k, "label": v["label"], "currency": v["currency"], "has_state_tax": v["has_state_tax"]}
            for k, v in TAX_REGIONS.items()
        ],
        "deduction_categories": DEDUCTION_CATEGORIES,
        "us_state_taxes": [
            {"key": k, "label": v["label"], "rate": v["rate"]}
            for k, v in US_STATE_TAXES.items()
        ],
    }


def calculate_taxes(
    # Income
    gross_income: float = 0,
    other_income: float = 0,
    # Region & Filing
    region: str = "us",
    filing_status: str = "single",
    us_state: str = "none",
    custom_state_rate: float = 0,
    # Expenses / Deductions
    expenses: Dict[str, float] = None,
    additional_deductions: float = 0,
    use_standard_deduction: bool = True,
    # Retirement
    retirement_contribution: float = 0,
    # Health
    health_insurance_premium: float = 0,
    # Quarterly
    taxes_already_paid: float = 0,
    current_quarter: int = 1,
    # Previous year comparison
    previous_year_income: Optional[float] = None,
) -> Dict[str, Any]:
    """Calculate comprehensive tax breakdown for self-employed individuals."""

    if not expenses:
        expenses = {}

    region_data = TAX_REGIONS.get(region, TAX_REGIONS["us"])
    currency = region_data["currency"]

    # ===== STEP 1: Total Income =====
    total_income = gross_income + other_income

    # ===== STEP 2: Business Expenses & Deductions =====
    expense_breakdown = []
    total_deductible = 0
    total_expenses = 0

    for cat_key, amount in expenses.items():
        if amount <= 0:
            continue
        cat_info = next((c for c in DEDUCTION_CATEGORIES if c["key"] == cat_key), None)
        deduct_pct = cat_info["deductible_percent"] if cat_info else 100
        deductible = amount * (deduct_pct / 100)
        total_expenses += amount
        total_deductible += deductible
        expense_breakdown.append({
            "category": cat_key,
            "label": cat_info["label"] if cat_info else cat_key,
            "amount": round(amount, 2),
            "deductible_percent": deduct_pct,
            "deductible_amount": round(deductible, 2),
        })

    # Sort by amount descending
    expense_breakdown.sort(key=lambda x: x["amount"], reverse=True)

    # ===== STEP 3: Net Business Income =====
    net_business_income = max(total_income - total_deductible, 0)

    # ===== STEP 4: Self-Employment Tax =====
    se_rate = region_data["self_employment_rate"]
    se_threshold = region_data["se_income_threshold"]
    se_taxable = max(net_business_income - se_threshold, 0)
    se_tax = se_taxable * se_rate
    se_deduction = se_tax * region_data["se_deduction_factor"]

    # ===== STEP 5: Adjusted Gross Income =====
    standard_ded = region_data["standard_deduction"].get(filing_status, region_data["standard_deduction"].get("single", 0))
    deduction_amount = standard_ded if use_standard_deduction else 0
    total_above_line = se_deduction + retirement_contribution + health_insurance_premium + additional_deductions

    agi = max(net_business_income - total_above_line, 0)
    taxable_income = max(agi - deduction_amount, 0)

    # ===== STEP 6: Federal Income Tax =====
    federal_tax = _calc_progressive_tax(taxable_income, region_data["federal_brackets"])

    # ===== STEP 7: State/Provincial Tax =====
    state_tax = 0
    state_label = "N/A"
    if region_data["has_state_tax"]:
        if region == "us":
            state_info = US_STATE_TAXES.get(us_state, US_STATE_TAXES["none"])
            state_rate = state_info["rate"] / 100 if state_info["rate"] > 0 else custom_state_rate / 100
            state_tax = taxable_income * state_rate
            state_label = state_info["label"]
        else:
            state_tax = taxable_income * (custom_state_rate / 100)
            state_label = "Provincial"

    # ===== STEP 8: Total Tax =====
    total_tax = federal_tax + se_tax + state_tax

    # ===== STEP 9: Net After Tax =====
    net_after_tax = total_income - total_expenses - total_tax - retirement_contribution

    # ===== STEP 10: Effective Tax Rate =====
    effective_rate = (total_tax / total_income * 100) if total_income > 0 else 0

    # ===== STEP 11: Quarterly Estimates =====
    quarterly_tax = total_tax / 4
    remaining_quarters = max(4 - current_quarter + 1, 1)
    remaining_tax = max(total_tax - taxes_already_paid, 0)
    per_remaining_quarter = remaining_tax / remaining_quarters

    # ===== STEP 12: Monthly Breakdown =====
    monthly = {
        "gross_income": round(total_income / 12, 2),
        "expenses": round(total_expenses / 12, 2),
        "tax_set_aside": round(total_tax / 12, 2),
        "net_take_home": round(net_after_tax / 12, 2),
    }

    # ===== STEP 13: Profit & Loss Summary =====
    profit_loss = {
        "revenue": round(total_income, 2),
        "cost_of_goods": 0,
        "gross_profit": round(total_income, 2),
        "operating_expenses": round(total_expenses, 2),
        "operating_income": round(total_income - total_expenses, 2),
        "taxes": round(total_tax, 2),
        "net_profit": round(net_after_tax, 2),
        "profit_margin": round((net_after_tax / total_income * 100) if total_income > 0 else 0, 1),
    }

    # ===== STEP 14: Year-over-Year Comparison =====
    yoy = None
    if previous_year_income is not None and previous_year_income > 0:
        growth = ((total_income - previous_year_income) / previous_year_income) * 100
        yoy = {
            "previous_year": round(previous_year_income, 2),
            "current_year": round(total_income, 2),
            "growth_percent": round(growth, 1),
            "growth_direction": "up" if growth > 0 else "down" if growth < 0 else "flat",
        }

    # ===== STEP 15: Tax-Saving Recommendations =====
    recommendations = _get_tax_recommendations(
        region=region,
        total_income=total_income,
        total_expenses=total_expenses,
        total_tax=total_tax,
        effective_rate=effective_rate,
        retirement_contribution=retirement_contribution,
        health_insurance_premium=health_insurance_premium,
        expenses=expenses,
        use_standard_deduction=use_standard_deduction,
        total_deductible=total_deductible,
        standard_ded=standard_ded,
    )

    return {
        "income": {
            "gross_business_income": round(gross_income, 2),
            "other_income": round(other_income, 2),
            "total_income": round(total_income, 2),
        },
        "deductions": {
            "business_expenses": round(total_deductible, 2),
            "se_tax_deduction": round(se_deduction, 2),
            "retirement_contribution": round(retirement_contribution, 2),
            "health_insurance": round(health_insurance_premium, 2),
            "additional": round(additional_deductions, 2),
            "standard_deduction": round(deduction_amount, 2),
            "total_deductions": round(total_deductible + total_above_line + deduction_amount, 2),
            "using_standard": use_standard_deduction,
        },
        "expenses": {
            "total": round(total_expenses, 2),
            "total_deductible": round(total_deductible, 2),
            "breakdown": expense_breakdown,
        },
        "taxes": {
            "self_employment_tax": round(se_tax, 2),
            "federal_income_tax": round(federal_tax, 2),
            "state_tax": round(state_tax, 2),
            "state_label": state_label,
            "total_tax": round(total_tax, 2),
            "effective_rate": round(effective_rate, 1),
            "marginal_rate": _get_marginal_rate(taxable_income, region_data["federal_brackets"]),
        },
        "quarterly": {
            "estimated_quarterly": round(quarterly_tax, 2),
            "taxes_already_paid": round(taxes_already_paid, 2),
            "remaining_tax": round(remaining_tax, 2),
            "per_remaining_quarter": round(per_remaining_quarter, 2),
            "current_quarter": current_quarter,
        },
        "net_income": {
            "annual": round(net_after_tax, 2),
            "monthly": monthly,
        },
        "profit_loss": profit_loss,
        "year_over_year": yoy,
        "recommendations": recommendations,
        "meta": {
            "region": region_data["label"],
            "currency": currency,
            "filing_status": filing_status,
            "tax_year": datetime.now(timezone.utc).year,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generator": "MegiLance Expense & Tax Calculator",
            "disclaimer": "This is an estimate for planning purposes only. Consult a qualified tax professional for actual tax filing.",
        },
    }


def _calc_progressive_tax(income: float, brackets: List[Dict]) -> float:
    """Calculate progressive income tax."""
    tax = 0
    for bracket in brackets:
        b_min = bracket["min"]
        b_max = bracket["max"]
        rate = bracket["rate"]

        if income <= b_min:
            break

        taxable_in = income - b_min
        if b_max is not None:
            taxable_in = min(taxable_in, b_max - b_min)

        tax += taxable_in * rate

    return tax


def _get_marginal_rate(income: float, brackets: List[Dict]) -> float:
    """Get the marginal tax rate for a given income."""
    rate = 0
    for bracket in brackets:
        if income >= bracket["min"]:
            rate = bracket["rate"]
        else:
            break
    return round(rate * 100, 1)


def _get_tax_recommendations(
    region, total_income, total_expenses, total_tax, effective_rate,
    retirement_contribution, health_insurance_premium, expenses,
    use_standard_deduction, total_deductible, standard_ded,
) -> List[Dict[str, str]]:
    """Generate tax-saving recommendations."""
    recs = []

    # Retirement contributions
    if retirement_contribution < total_income * 0.10 and total_income > 20000:
        max_sep = min(total_income * 0.25, 66000)
        recs.append({
            "type": "savings",
            "title": "Maximize Retirement Contributions",
            "message": f"You could contribute up to {max_sep:,.0f} to a SEP-IRA or Solo 401(k), reducing taxable income.",
            "potential_savings": round(max_sep * 0.22, 2),
        })

    # Health insurance
    if health_insurance_premium == 0 and region == "us":
        recs.append({
            "type": "deduction",
            "title": "Deduct Health Insurance Premiums",
            "message": "Self-employed individuals can deduct health insurance premiums as an above-the-line deduction.",
        })

    # Home office
    if "home_office" not in expenses or expenses.get("home_office", 0) == 0:
        recs.append({
            "type": "deduction",
            "title": "Claim Home Office Deduction",
            "message": "If you work from home, you may qualify for the home office deduction (simplified: $5/sq ft, up to $1,500).",
        })

    # Standard vs itemized
    if use_standard_deduction and total_deductible > standard_ded * 1.1:
        recs.append({
            "type": "strategy",
            "title": "Consider Itemizing Deductions",
            "message": f"Your business deductions ({total_deductible:,.0f}) exceed the standard deduction ({standard_ded:,.0f}). Itemizing may save more.",
        })

    # Vehicle / mileage
    if "vehicle" not in expenses or expenses.get("vehicle", 0) == 0:
        recs.append({
            "type": "deduction",
            "title": "Track Business Mileage",
            "message": "If you drive for business, track mileage for deductions (IRS rate: $0.67/mile in 2024).",
        })

    # Education
    if "education" not in expenses or expenses.get("education", 0) == 0:
        recs.append({
            "type": "deduction",
            "title": "Deduct Professional Development",
            "message": "Courses, certifications, books, and conferences related to your business are fully deductible.",
        })

    # High tax burden
    if effective_rate > 30:
        recs.append({
            "type": "strategy",
            "title": "Consider Business Structure Change",
            "message": "With a high effective rate, an S-Corp election could reduce self-employment tax liability.",
        })

    # Quarterly payments
    if total_tax > 1000:
        recs.append({
            "type": "planning",
            "title": "Make Quarterly Estimated Payments",
            "message": "Avoid underpayment penalties by making quarterly estimated tax payments to the IRS.",
        })

    # General
    recs.append({
        "type": "general",
        "title": "Consult a Tax Professional",
        "message": "This estimate is for planning purposes. A CPA can identify additional deductions specific to your situation.",
    })

    return recs
