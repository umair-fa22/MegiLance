# @AI-HINT: General-purpose AI Price Estimator engine - multi-industry, market-aware pricing intelligence
"""
AI Price Estimator Engine - Core estimation logic for general-purpose pricing.
Not limited to freelancing - works for any service/product pricing need.
Covers: software, design, marketing, writing, video, consulting, engineering, and more.

Enhanced with real-world data from:
- Arc.dev 2025 Developer Rate Survey (12,000+ developers, 122 countries)
- Upwork 50K Job Postings Dataset (2024)
- Fiverr Offers Dataset (2024)
- YunoJuno Rates Report 2025 (261K+ records)
- Pakistan freelancer market data (SBP IT Export reports)
"""

import math
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from app.db.turso_http import execute_query
from app.services.market_data_2025 import (
    DATA_VERSION,
    get_country_rate_data,
    get_pakistan_cities,
    get_platform_rates,
    get_upwork_service_rate,
    get_demand_data,
    get_south_asia_benchmark,
    calculate_data_driven_rate,
)

logger = logging.getLogger("megilance")

# ============================================================================
# Market Rate Database - Comprehensive industry benchmarks (USD/hour)
# Source: Aggregated from public market data, salary surveys, freelance platforms
# ============================================================================

MARKET_RATES: Dict[str, Dict[str, Dict[str, float]]] = {
    # ---- SOFTWARE & TECHNOLOGY ----
    "software_development": {
        "web_application": {"junior": 35, "mid": 65, "senior": 120, "expert": 200},
        "mobile_app": {"junior": 40, "mid": 75, "senior": 130, "expert": 220},
        "desktop_software": {"junior": 35, "mid": 60, "senior": 110, "expert": 180},
        "api_development": {"junior": 40, "mid": 70, "senior": 125, "expert": 200},
        "ecommerce_platform": {"junior": 35, "mid": 65, "senior": 115, "expert": 190},
        "saas_product": {"junior": 45, "mid": 80, "senior": 140, "expert": 250},
        "database_design": {"junior": 35, "mid": 60, "senior": 110, "expert": 175},
        "devops_infrastructure": {"junior": 40, "mid": 75, "senior": 135, "expert": 220},
        "ai_ml_solution": {"junior": 50, "mid": 90, "senior": 160, "expert": 300},
        "blockchain_web3": {"junior": 50, "mid": 95, "senior": 170, "expert": 320},
        "cybersecurity": {"junior": 45, "mid": 85, "senior": 150, "expert": 280},
        "iot_embedded": {"junior": 40, "mid": 75, "senior": 130, "expert": 210},
        "game_development": {"junior": 35, "mid": 65, "senior": 120, "expert": 200},
        "automation_scripting": {"junior": 30, "mid": 55, "senior": 100, "expert": 160},
    },
    # ---- DESIGN & CREATIVE ----
    "design_creative": {
        "logo_branding": {"junior": 25, "mid": 50, "senior": 100, "expert": 180},
        "ui_ux_design": {"junior": 30, "mid": 60, "senior": 110, "expert": 200},
        "web_design": {"junior": 25, "mid": 50, "senior": 95, "expert": 160},
        "graphic_design": {"junior": 20, "mid": 45, "senior": 85, "expert": 150},
        "illustration": {"junior": 25, "mid": 50, "senior": 95, "expert": 175},
        "motion_graphics": {"junior": 30, "mid": 60, "senior": 110, "expert": 190},
        "product_design": {"junior": 35, "mid": 70, "senior": 130, "expert": 220},
        "packaging_design": {"junior": 25, "mid": 50, "senior": 90, "expert": 160},
        "print_design": {"junior": 20, "mid": 40, "senior": 75, "expert": 130},
        "3d_modeling": {"junior": 30, "mid": 60, "senior": 110, "expert": 200},
    },
    # ---- MARKETING & GROWTH ----
    "marketing": {
        "seo_optimization": {"junior": 25, "mid": 50, "senior": 100, "expert": 175},
        "social_media": {"junior": 20, "mid": 40, "senior": 80, "expert": 140},
        "content_marketing": {"junior": 20, "mid": 40, "senior": 80, "expert": 150},
        "email_marketing": {"junior": 20, "mid": 40, "senior": 75, "expert": 130},
        "ppc_advertising": {"junior": 25, "mid": 55, "senior": 100, "expert": 180},
        "marketing_strategy": {"junior": 30, "mid": 60, "senior": 120, "expert": 200},
        "brand_strategy": {"junior": 30, "mid": 65, "senior": 125, "expert": 200},
        "influencer_marketing": {"junior": 20, "mid": 45, "senior": 85, "expert": 150},
        "analytics_reporting": {"junior": 25, "mid": 50, "senior": 95, "expert": 160},
        "conversion_optimization": {"junior": 30, "mid": 60, "senior": 110, "expert": 190},
    },
    # ---- WRITING & CONTENT ----
    "writing_content": {
        "blog_articles": {"junior": 15, "mid": 30, "senior": 60, "expert": 120},
        "copywriting": {"junior": 20, "mid": 40, "senior": 80, "expert": 160},
        "technical_writing": {"junior": 25, "mid": 50, "senior": 100, "expert": 175},
        "creative_writing": {"junior": 15, "mid": 30, "senior": 65, "expert": 130},
        "grant_writing": {"junior": 30, "mid": 55, "senior": 100, "expert": 175},
        "resume_writing": {"junior": 15, "mid": 30, "senior": 60, "expert": 100},
        "speechwriting": {"junior": 25, "mid": 50, "senior": 100, "expert": 180},
        "translation": {"junior": 15, "mid": 30, "senior": 55, "expert": 100},
        "editing_proofreading": {"junior": 15, "mid": 25, "senior": 50, "expert": 90},
        "scriptwriting": {"junior": 20, "mid": 45, "senior": 90, "expert": 175},
    },
    # ---- VIDEO & AUDIO ----
    "video_audio": {
        "video_editing": {"junior": 25, "mid": 50, "senior": 95, "expert": 175},
        "video_production": {"junior": 30, "mid": 65, "senior": 120, "expert": 225},
        "animation_2d": {"junior": 25, "mid": 55, "senior": 100, "expert": 185},
        "animation_3d": {"junior": 35, "mid": 70, "senior": 130, "expert": 240},
        "voice_over": {"junior": 15, "mid": 35, "senior": 70, "expert": 150},
        "music_production": {"junior": 20, "mid": 45, "senior": 90, "expert": 175},
        "podcast_production": {"junior": 20, "mid": 40, "senior": 75, "expert": 130},
        "sound_design": {"junior": 25, "mid": 50, "senior": 95, "expert": 175},
        "color_grading": {"junior": 25, "mid": 50, "senior": 90, "expert": 160},
    },
    # ---- CONSULTING & BUSINESS ----
    "consulting_business": {
        "business_consulting": {"junior": 40, "mid": 80, "senior": 160, "expert": 300},
        "financial_consulting": {"junior": 45, "mid": 90, "senior": 175, "expert": 350},
        "legal_consulting": {"junior": 50, "mid": 100, "senior": 200, "expert": 400},
        "hr_consulting": {"junior": 30, "mid": 60, "senior": 120, "expert": 200},
        "management_consulting": {"junior": 45, "mid": 90, "senior": 175, "expert": 350},
        "it_consulting": {"junior": 40, "mid": 80, "senior": 150, "expert": 275},
        "strategy_consulting": {"junior": 50, "mid": 100, "senior": 200, "expert": 375},
        "project_management": {"junior": 30, "mid": 60, "senior": 110, "expert": 190},
        "product_management": {"junior": 35, "mid": 70, "senior": 130, "expert": 225},
        "startup_advisory": {"junior": 40, "mid": 80, "senior": 150, "expert": 300},
    },
    # ---- DATA & ANALYTICS ----
    "data_analytics": {
        "data_analysis": {"junior": 30, "mid": 60, "senior": 110, "expert": 200},
        "data_engineering": {"junior": 40, "mid": 80, "senior": 140, "expert": 250},
        "data_visualization": {"junior": 30, "mid": 55, "senior": 100, "expert": 175},
        "business_intelligence": {"junior": 35, "mid": 70, "senior": 125, "expert": 220},
        "data_science": {"junior": 45, "mid": 85, "senior": 150, "expert": 275},
        "machine_learning": {"junior": 50, "mid": 95, "senior": 170, "expert": 320},
        "statistical_analysis": {"junior": 35, "mid": 65, "senior": 120, "expert": 210},
        "etl_pipelines": {"junior": 35, "mid": 70, "senior": 120, "expert": 200},
    },
    # ---- ENGINEERING & ARCHITECTURE ----
    "engineering": {
        "mechanical_engineering": {"junior": 35, "mid": 65, "senior": 120, "expert": 200},
        "electrical_engineering": {"junior": 35, "mid": 70, "senior": 125, "expert": 210},
        "civil_engineering": {"junior": 30, "mid": 60, "senior": 110, "expert": 185},
        "architectural_design": {"junior": 30, "mid": 65, "senior": 120, "expert": 200},
        "cad_drafting": {"junior": 20, "mid": 40, "senior": 75, "expert": 130},
        "structural_analysis": {"junior": 35, "mid": 70, "senior": 125, "expert": 210},
        "systems_engineering": {"junior": 40, "mid": 80, "senior": 145, "expert": 250},
    },
    # ---- EDUCATION & TRAINING ----
    "education_training": {
        "course_creation": {"junior": 20, "mid": 40, "senior": 80, "expert": 150},
        "tutoring": {"junior": 15, "mid": 30, "senior": 60, "expert": 120},
        "curriculum_design": {"junior": 25, "mid": 50, "senior": 90, "expert": 160},
        "elearning_development": {"junior": 30, "mid": 55, "senior": 100, "expert": 175},
        "corporate_training": {"junior": 30, "mid": 60, "senior": 110, "expert": 200},
        "workshop_facilitation": {"junior": 25, "mid": 50, "senior": 100, "expert": 180},
    },
    # ---- PHOTOGRAPHY & MEDIA ----
    "photography_media": {
        "product_photography": {"junior": 20, "mid": 45, "senior": 85, "expert": 160},
        "event_photography": {"junior": 20, "mid": 40, "senior": 80, "expert": 150},
        "photo_editing": {"junior": 15, "mid": 30, "senior": 55, "expert": 100},
        "drone_photography": {"junior": 30, "mid": 60, "senior": 110, "expert": 200},
        "real_estate_photography": {"junior": 20, "mid": 45, "senior": 85, "expert": 150},
    },
}

# Regional cost multipliers (relative to US average) — legacy fallback
REGIONAL_MULTIPLIERS: Dict[str, float] = {
    "north_america": 1.0,
    "western_europe": 0.90,
    "eastern_europe": 0.45,
    "united_kingdom": 0.85,
    "australia_nz": 0.85,
    "south_asia": 0.30,
    "southeast_asia": 0.35,
    "east_asia": 0.55,
    "middle_east": 0.50,
    "latin_america": 0.40,
    "africa": 0.30,
    "global_remote": 0.65,
}

# ============================================================================
# Country-Level Pricing Data
# Each country has: region, rate_multiplier (what freelancers charge there),
# client_budget_multiplier (what clients there typically pay),
# currency, ppp_index (Purchasing Power Parity vs USD), cost_of_living_index
# ============================================================================

COUNTRY_DATA: Dict[str, Dict[str, Any]] = {
    # ============================================================================
    # Recalibrated from Arc.dev 2025 Developer Rate Survey (12,000+ devs, 122 countries)
    # rate_mult = country_avg_rate / US_avg_rate ($70/hr baseline)
    # client_budget_mult based on PPP + local market budget surveys
    # ============================================================================
    # ---- NORTH AMERICA ----
    "US": {"name": "United States", "region": "north_america", "rate_mult": 1.0, "client_budget_mult": 1.0, "currency": "USD", "ppp_index": 1.0, "col_index": 100, "flag": "🇺🇸"},
    "CA": {"name": "Canada", "region": "north_america", "rate_mult": 0.93, "client_budget_mult": 0.92, "currency": "CAD", "ppp_index": 0.84, "col_index": 87, "flag": "🇨🇦"},
    # ---- WESTERN EUROPE ----
    "GB": {"name": "United Kingdom", "region": "western_europe", "rate_mult": 0.87, "client_budget_mult": 0.88, "currency": "GBP", "ppp_index": 0.80, "col_index": 90, "flag": "🇬🇧"},
    "DE": {"name": "Germany", "region": "western_europe", "rate_mult": 0.89, "client_budget_mult": 0.88, "currency": "EUR", "ppp_index": 0.82, "col_index": 85, "flag": "🇩🇪"},
    "FR": {"name": "France", "region": "western_europe", "rate_mult": 0.79, "client_budget_mult": 0.82, "currency": "EUR", "ppp_index": 0.80, "col_index": 83, "flag": "🇫🇷"},
    "NL": {"name": "Netherlands", "region": "western_europe", "rate_mult": 0.84, "client_budget_mult": 0.86, "currency": "EUR", "ppp_index": 0.83, "col_index": 88, "flag": "🇳🇱"},
    "CH": {"name": "Switzerland", "region": "western_europe", "rate_mult": 1.27, "client_budget_mult": 1.15, "currency": "CHF", "ppp_index": 1.12, "col_index": 120, "flag": "🇨🇭"},
    "SE": {"name": "Sweden", "region": "western_europe", "rate_mult": 0.91, "client_budget_mult": 0.90, "currency": "SEK", "ppp_index": 0.78, "col_index": 86, "flag": "🇸🇪"},
    "NO": {"name": "Norway", "region": "western_europe", "rate_mult": 0.97, "client_budget_mult": 0.95, "currency": "NOK", "ppp_index": 0.88, "col_index": 105, "flag": "🇳🇴"},
    "DK": {"name": "Denmark", "region": "western_europe", "rate_mult": 0.90, "client_budget_mult": 0.90, "currency": "DKK", "ppp_index": 0.85, "col_index": 95, "flag": "🇩🇰"},
    "IE": {"name": "Ireland", "region": "western_europe", "rate_mult": 0.86, "client_budget_mult": 0.86, "currency": "EUR", "ppp_index": 0.82, "col_index": 89, "flag": "🇮🇪"},
    "ES": {"name": "Spain", "region": "western_europe", "rate_mult": 0.64, "client_budget_mult": 0.66, "currency": "EUR", "ppp_index": 0.68, "col_index": 65, "flag": "🇪🇸"},
    "IT": {"name": "Italy", "region": "western_europe", "rate_mult": 0.67, "client_budget_mult": 0.68, "currency": "EUR", "ppp_index": 0.70, "col_index": 70, "flag": "🇮🇹"},
    "PT": {"name": "Portugal", "region": "western_europe", "rate_mult": 0.57, "client_budget_mult": 0.58, "currency": "EUR", "ppp_index": 0.58, "col_index": 55, "flag": "🇵🇹"},
    "AT": {"name": "Austria", "region": "western_europe", "rate_mult": 0.77, "client_budget_mult": 0.80, "currency": "EUR", "ppp_index": 0.80, "col_index": 82, "flag": "🇦🇹"},
    "BE": {"name": "Belgium", "region": "western_europe", "rate_mult": 0.76, "client_budget_mult": 0.78, "currency": "EUR", "ppp_index": 0.78, "col_index": 80, "flag": "🇧🇪"},
    "FI": {"name": "Finland", "region": "western_europe", "rate_mult": 0.83, "client_budget_mult": 0.84, "currency": "EUR", "ppp_index": 0.79, "col_index": 83, "flag": "🇫🇮"},
    # ---- EASTERN EUROPE ----
    "PL": {"name": "Poland", "region": "eastern_europe", "rate_mult": 0.54, "client_budget_mult": 0.52, "currency": "PLN", "ppp_index": 0.48, "col_index": 45, "flag": "🇵🇱"},
    "RO": {"name": "Romania", "region": "eastern_europe", "rate_mult": 0.50, "client_budget_mult": 0.48, "currency": "RON", "ppp_index": 0.40, "col_index": 38, "flag": "🇷🇴"},
    "CZ": {"name": "Czech Republic", "region": "eastern_europe", "rate_mult": 0.57, "client_budget_mult": 0.55, "currency": "CZK", "ppp_index": 0.47, "col_index": 46, "flag": "🇨🇿"},
    "UA": {"name": "Ukraine", "region": "eastern_europe", "rate_mult": 0.43, "client_budget_mult": 0.40, "currency": "UAH", "ppp_index": 0.25, "col_index": 28, "flag": "🇺🇦"},
    "HU": {"name": "Hungary", "region": "eastern_europe", "rate_mult": 0.49, "client_budget_mult": 0.46, "currency": "HUF", "ppp_index": 0.40, "col_index": 40, "flag": "🇭🇺"},
    "BG": {"name": "Bulgaria", "region": "eastern_europe", "rate_mult": 0.47, "client_budget_mult": 0.44, "currency": "BGN", "ppp_index": 0.35, "col_index": 33, "flag": "🇧🇬"},
    "HR": {"name": "Croatia", "region": "eastern_europe", "rate_mult": 0.51, "client_budget_mult": 0.48, "currency": "EUR", "ppp_index": 0.42, "col_index": 42, "flag": "🇭🇷"},
    "RS": {"name": "Serbia", "region": "eastern_europe", "rate_mult": 0.46, "client_budget_mult": 0.42, "currency": "RSD", "ppp_index": 0.33, "col_index": 32, "flag": "🇷🇸"},
    "RU": {"name": "Russia", "region": "eastern_europe", "rate_mult": 0.46, "client_budget_mult": 0.42, "currency": "RUB", "ppp_index": 0.30, "col_index": 35, "flag": "🇷🇺"},
    # ---- AUSTRALIA & OCEANIA ----
    "AU": {"name": "Australia", "region": "australia_nz", "rate_mult": 1.30, "client_budget_mult": 1.05, "currency": "AUD", "ppp_index": 0.82, "col_index": 88, "flag": "🇦🇺"},
    "NZ": {"name": "New Zealand", "region": "australia_nz", "rate_mult": 1.00, "client_budget_mult": 0.90, "currency": "NZD", "ppp_index": 0.75, "col_index": 78, "flag": "🇳🇿"},
    # ---- SOUTH ASIA (Key target market - detailed calibration) ----
    "PK": {"name": "Pakistan", "region": "south_asia", "rate_mult": 0.26, "client_budget_mult": 0.18, "currency": "PKR", "ppp_index": 0.12, "col_index": 15, "flag": "🇵🇰"},
    "IN": {"name": "India", "region": "south_asia", "rate_mult": 0.36, "client_budget_mult": 0.28, "currency": "INR", "ppp_index": 0.18, "col_index": 22, "flag": "🇮🇳"},
    "BD": {"name": "Bangladesh", "region": "south_asia", "rate_mult": 0.17, "client_budget_mult": 0.12, "currency": "BDT", "ppp_index": 0.10, "col_index": 12, "flag": "🇧🇩"},
    "LK": {"name": "Sri Lanka", "region": "south_asia", "rate_mult": 0.31, "client_budget_mult": 0.24, "currency": "LKR", "ppp_index": 0.14, "col_index": 18, "flag": "🇱🇰"},
    "NP": {"name": "Nepal", "region": "south_asia", "rate_mult": 0.17, "client_budget_mult": 0.12, "currency": "NPR", "ppp_index": 0.10, "col_index": 12, "flag": "🇳🇵"},
    # ---- SOUTHEAST ASIA ----
    "PH": {"name": "Philippines", "region": "southeast_asia", "rate_mult": 0.31, "client_budget_mult": 0.26, "currency": "PHP", "ppp_index": 0.18, "col_index": 22, "flag": "🇵🇭"},
    "VN": {"name": "Vietnam", "region": "southeast_asia", "rate_mult": 0.29, "client_budget_mult": 0.24, "currency": "VND", "ppp_index": 0.16, "col_index": 20, "flag": "🇻🇳"},
    "ID": {"name": "Indonesia", "region": "southeast_asia", "rate_mult": 0.29, "client_budget_mult": 0.24, "currency": "IDR", "ppp_index": 0.16, "col_index": 20, "flag": "🇮🇩"},
    "TH": {"name": "Thailand", "region": "southeast_asia", "rate_mult": 0.46, "client_budget_mult": 0.38, "currency": "THB", "ppp_index": 0.22, "col_index": 30, "flag": "🇹🇭"},
    "MY": {"name": "Malaysia", "region": "southeast_asia", "rate_mult": 0.50, "client_budget_mult": 0.42, "currency": "MYR", "ppp_index": 0.28, "col_index": 35, "flag": "🇲🇾"},
    "SG": {"name": "Singapore", "region": "southeast_asia", "rate_mult": 0.79, "client_budget_mult": 0.76, "currency": "SGD", "ppp_index": 0.72, "col_index": 85, "flag": "🇸🇬"},
    # ---- EAST ASIA ----
    "JP": {"name": "Japan", "region": "east_asia", "rate_mult": 0.74, "client_budget_mult": 0.72, "currency": "JPY", "ppp_index": 0.60, "col_index": 72, "flag": "🇯🇵"},
    "KR": {"name": "South Korea", "region": "east_asia", "rate_mult": 0.69, "client_budget_mult": 0.65, "currency": "KRW", "ppp_index": 0.55, "col_index": 65, "flag": "🇰🇷"},
    "CN": {"name": "China", "region": "east_asia", "rate_mult": 0.49, "client_budget_mult": 0.44, "currency": "CNY", "ppp_index": 0.32, "col_index": 42, "flag": "🇨🇳"},
    "TW": {"name": "Taiwan", "region": "east_asia", "rate_mult": 0.63, "client_budget_mult": 0.58, "currency": "TWD", "ppp_index": 0.45, "col_index": 52, "flag": "🇹🇼"},
    "HK": {"name": "Hong Kong", "region": "east_asia", "rate_mult": 0.74, "client_budget_mult": 0.72, "currency": "HKD", "ppp_index": 0.68, "col_index": 82, "flag": "🇭🇰"},
    # ---- MIDDLE EAST ----
    "AE": {"name": "United Arab Emirates", "region": "middle_east", "rate_mult": 0.71, "client_budget_mult": 0.72, "currency": "AED", "ppp_index": 0.60, "col_index": 75, "flag": "🇦🇪"},
    "SA": {"name": "Saudi Arabia", "region": "middle_east", "rate_mult": 0.60, "client_budget_mult": 0.58, "currency": "SAR", "ppp_index": 0.48, "col_index": 55, "flag": "🇸🇦"},
    "QA": {"name": "Qatar", "region": "middle_east", "rate_mult": 0.69, "client_budget_mult": 0.68, "currency": "QAR", "ppp_index": 0.58, "col_index": 72, "flag": "🇶🇦"},
    "KW": {"name": "Kuwait", "region": "middle_east", "rate_mult": 0.64, "client_budget_mult": 0.62, "currency": "KWD", "ppp_index": 0.52, "col_index": 62, "flag": "🇰🇼"},
    "IL": {"name": "Israel", "region": "middle_east", "rate_mult": 0.83, "client_budget_mult": 0.82, "currency": "ILS", "ppp_index": 0.70, "col_index": 82, "flag": "🇮🇱"},
    "TR": {"name": "Turkey", "region": "middle_east", "rate_mult": 0.40, "client_budget_mult": 0.35, "currency": "TRY", "ppp_index": 0.22, "col_index": 30, "flag": "🇹🇷"},
    "JO": {"name": "Jordan", "region": "middle_east", "rate_mult": 0.40, "client_budget_mult": 0.38, "currency": "JOD", "ppp_index": 0.30, "col_index": 38, "flag": "🇯🇴"},
    "EG": {"name": "Egypt", "region": "middle_east", "rate_mult": 0.26, "client_budget_mult": 0.22, "currency": "EGP", "ppp_index": 0.12, "col_index": 18, "flag": "🇪🇬"},
    # ---- LATIN AMERICA ----
    "BR": {"name": "Brazil", "region": "latin_america", "rate_mult": 0.43, "client_budget_mult": 0.40, "currency": "BRL", "ppp_index": 0.28, "col_index": 35, "flag": "🇧🇷"},
    "MX": {"name": "Mexico", "region": "latin_america", "rate_mult": 0.46, "client_budget_mult": 0.42, "currency": "MXN", "ppp_index": 0.25, "col_index": 32, "flag": "🇲🇽"},
    "AR": {"name": "Argentina", "region": "latin_america", "rate_mult": 0.40, "client_budget_mult": 0.35, "currency": "ARS", "ppp_index": 0.18, "col_index": 28, "flag": "🇦🇷"},
    "CO": {"name": "Colombia", "region": "latin_america", "rate_mult": 0.39, "client_budget_mult": 0.34, "currency": "COP", "ppp_index": 0.20, "col_index": 26, "flag": "🇨🇴"},
    "CL": {"name": "Chile", "region": "latin_america", "rate_mult": 0.53, "client_budget_mult": 0.48, "currency": "CLP", "ppp_index": 0.32, "col_index": 38, "flag": "🇨🇱"},
    "PE": {"name": "Peru", "region": "latin_america", "rate_mult": 0.36, "client_budget_mult": 0.30, "currency": "PEN", "ppp_index": 0.18, "col_index": 24, "flag": "🇵🇪"},
    "UY": {"name": "Uruguay", "region": "latin_america", "rate_mult": 0.51, "client_budget_mult": 0.46, "currency": "UYU", "ppp_index": 0.30, "col_index": 40, "flag": "🇺🇾"},
    # ---- AFRICA ----
    "NG": {"name": "Nigeria", "region": "africa", "rate_mult": 0.21, "client_budget_mult": 0.17, "currency": "NGN", "ppp_index": 0.08, "col_index": 14, "flag": "🇳🇬"},
    "KE": {"name": "Kenya", "region": "africa", "rate_mult": 0.26, "client_budget_mult": 0.22, "currency": "KES", "ppp_index": 0.10, "col_index": 18, "flag": "🇰🇪"},
    "ZA": {"name": "South Africa", "region": "africa", "rate_mult": 0.39, "client_budget_mult": 0.35, "currency": "ZAR", "ppp_index": 0.22, "col_index": 30, "flag": "🇿🇦"},
    "GH": {"name": "Ghana", "region": "africa", "rate_mult": 0.21, "client_budget_mult": 0.17, "currency": "GHS", "ppp_index": 0.08, "col_index": 15, "flag": "🇬🇭"},
    "ET": {"name": "Ethiopia", "region": "africa", "rate_mult": 0.14, "client_budget_mult": 0.10, "currency": "ETB", "ppp_index": 0.06, "col_index": 10, "flag": "🇪🇹"},
    "TZ": {"name": "Tanzania", "region": "africa", "rate_mult": 0.17, "client_budget_mult": 0.14, "currency": "TZS", "ppp_index": 0.07, "col_index": 12, "flag": "🇹🇿"},
    "MA": {"name": "Morocco", "region": "africa", "rate_mult": 0.29, "client_budget_mult": 0.24, "currency": "MAD", "ppp_index": 0.15, "col_index": 22, "flag": "🇲🇦"},
    "TN": {"name": "Tunisia", "region": "africa", "rate_mult": 0.26, "client_budget_mult": 0.22, "currency": "TND", "ppp_index": 0.12, "col_index": 20, "flag": "🇹🇳"},
}

# Grouped countries by region for the UI
REGION_GROUPS: Dict[str, Dict[str, str]] = {
    "north_america": {"label": "North America", "icon": "🌎"},
    "western_europe": {"label": "Western Europe", "icon": "🌍"},
    "eastern_europe": {"label": "Eastern Europe", "icon": "🌍"},
    "australia_nz": {"label": "Australia & Oceania", "icon": "🌏"},
    "south_asia": {"label": "South Asia", "icon": "🌏"},
    "southeast_asia": {"label": "Southeast Asia", "icon": "🌏"},
    "east_asia": {"label": "East Asia", "icon": "🌏"},
    "middle_east": {"label": "Middle East & North Africa", "icon": "🌍"},
    "latin_america": {"label": "Latin America", "icon": "🌎"},
    "africa": {"label": "Africa", "icon": "🌍"},
}

# Timeline urgency multipliers
URGENCY_MULTIPLIERS: Dict[str, float] = {
    "critical": 1.75,   # Need it yesterday
    "urgent": 1.40,     # Within days
    "standard": 1.0,    # Normal timeline
    "relaxed": 0.90,    # No rush
    "ongoing": 0.80,    # Long-term retainer
}

# Quality tier multipliers
QUALITY_MULTIPLIERS: Dict[str, float] = {
    "budget": 0.60,       # MVP / basic quality
    "standard": 1.0,      # Professional quality
    "premium": 1.50,      # High-end, polished
    "enterprise": 2.0,    # Enterprise-grade, bulletproof
}

# Scope complexity multipliers (number of features / deliverables)
SCOPE_MULTIPLIERS: Dict[str, float] = {
    "minimal": 0.5,    # 1-2 deliverables
    "small": 0.8,      # 3-5 deliverables
    "medium": 1.0,     # 6-10 deliverables
    "large": 1.5,      # 11-20 deliverables
    "enterprise": 2.5, # 20+ deliverables
}

# Common deliverable templates per service type (label, estimated hours)
DELIVERABLE_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "web_application": [
        {"label": "Requirements & Planning", "hours": 8, "category": "planning"},
        {"label": "UI/UX Design & Wireframes", "hours": 16, "category": "design"},
        {"label": "Frontend Development", "hours": 40, "category": "development"},
        {"label": "Backend Development", "hours": 40, "category": "development"},
        {"label": "Database Design & Setup", "hours": 8, "category": "development"},
        {"label": "API Integration", "hours": 16, "category": "development"},
        {"label": "Testing & QA", "hours": 16, "category": "testing"},
        {"label": "Deployment & Launch", "hours": 8, "category": "deployment"},
        {"label": "Documentation", "hours": 8, "category": "documentation"},
    ],
    "mobile_app": [
        {"label": "Requirements & Planning", "hours": 8, "category": "planning"},
        {"label": "UI/UX Design", "hours": 20, "category": "design"},
        {"label": "App Development", "hours": 60, "category": "development"},
        {"label": "Backend/API Development", "hours": 30, "category": "development"},
        {"label": "Testing (Unit + Integration)", "hours": 20, "category": "testing"},
        {"label": "App Store Submission", "hours": 4, "category": "deployment"},
        {"label": "Documentation", "hours": 6, "category": "documentation"},
    ],
    "logo_branding": [
        {"label": "Brand Discovery & Research", "hours": 4, "category": "planning"},
        {"label": "Concept Sketches (3-5 options)", "hours": 8, "category": "design"},
        {"label": "Digital Refinement", "hours": 6, "category": "design"},
        {"label": "Revision Rounds (2-3)", "hours": 6, "category": "design"},
        {"label": "Final Deliverables (all formats)", "hours": 3, "category": "delivery"},
        {"label": "Brand Guidelines Document", "hours": 4, "category": "documentation"},
    ],
    "seo_optimization": [
        {"label": "SEO Audit & Analysis", "hours": 8, "category": "planning"},
        {"label": "Keyword Research", "hours": 6, "category": "research"},
        {"label": "On-Page Optimization", "hours": 12, "category": "implementation"},
        {"label": "Technical SEO Fixes", "hours": 10, "category": "implementation"},
        {"label": "Content Strategy", "hours": 6, "category": "planning"},
        {"label": "Link Building Plan", "hours": 8, "category": "implementation"},
        {"label": "Reporting & Analytics Setup", "hours": 4, "category": "reporting"},
    ],
    "video_production": [
        {"label": "Script & Storyboard", "hours": 8, "category": "planning"},
        {"label": "Pre-Production", "hours": 6, "category": "planning"},
        {"label": "Filming / Recording", "hours": 12, "category": "production"},
        {"label": "Video Editing", "hours": 16, "category": "post_production"},
        {"label": "Color Grading & Audio", "hours": 6, "category": "post_production"},
        {"label": "Revisions (2 rounds)", "hours": 6, "category": "revision"},
        {"label": "Final Export & Delivery", "hours": 2, "category": "delivery"},
    ],
    "business_consulting": [
        {"label": "Discovery & Assessment", "hours": 8, "category": "planning"},
        {"label": "Market Research", "hours": 12, "category": "research"},
        {"label": "Strategy Development", "hours": 16, "category": "analysis"},
        {"label": "Financial Modeling", "hours": 10, "category": "analysis"},
        {"label": "Presentation & Deliverables", "hours": 8, "category": "delivery"},
        {"label": "Implementation Support", "hours": 12, "category": "implementation"},
    ],
    "data_analysis": [
        {"label": "Data Collection & Cleaning", "hours": 10, "category": "preparation"},
        {"label": "Exploratory Analysis", "hours": 8, "category": "analysis"},
        {"label": "Statistical Modeling", "hours": 12, "category": "analysis"},
        {"label": "Visualization & Dashboards", "hours": 10, "category": "delivery"},
        {"label": "Report & Insights", "hours": 6, "category": "documentation"},
    ],
}

# Market demand indicators (affects pricing direction)
DEMAND_INDICATORS: Dict[str, str] = {
    "ai_ml_solution": "very_high",
    "blockchain_web3": "high",
    "cybersecurity": "very_high",
    "data_science": "high",
    "DevOps_infrastructure": "high",
    "ui_ux_design": "high",
    "saas_product": "high",
    "mobile_app": "high",
    "seo_optimization": "moderate",
    "video_production": "moderate",
    "blog_articles": "saturated",
    "translation": "saturated",
    "editing_proofreading": "saturated",
    "print_design": "low",
}


# ============================================================================
# Estimation Engine
# ============================================================================

def get_categories() -> List[Dict[str, Any]]:
    """Return all available categories with their service types."""
    result = []
    category_labels = {
        "software_development": {"label": "Software & Technology", "icon": "code", "description": "Web, mobile, AI/ML, DevOps, and more"},
        "design_creative": {"label": "Design & Creative", "icon": "palette", "description": "UI/UX, logos, graphics, 3D, and branding"},
        "marketing": {"label": "Marketing & Growth", "icon": "trending-up", "description": "SEO, social media, PPC, and strategy"},
        "writing_content": {"label": "Writing & Content", "icon": "file-text", "description": "Blog posts, copywriting, technical writing"},
        "video_audio": {"label": "Video & Audio", "icon": "video", "description": "Editing, production, animation, voiceover"},
        "consulting_business": {"label": "Consulting & Business", "icon": "briefcase", "description": "Strategy, finance, management, advisory"},
        "data_analytics": {"label": "Data & Analytics", "icon": "bar-chart", "description": "Data science, BI, ML, visualization"},
        "engineering": {"label": "Engineering & Architecture", "icon": "settings", "description": "Mechanical, electrical, civil, CAD"},
        "education_training": {"label": "Education & Training", "icon": "book", "description": "Courses, tutoring, e-learning, workshops"},
        "photography_media": {"label": "Photography & Media", "icon": "camera", "description": "Product, event, real estate, drone"},
    }

    for cat_key, services in MARKET_RATES.items():
        cat_info = category_labels.get(cat_key, {"label": cat_key, "icon": "layers", "description": ""})
        service_list = []
        for svc_key, rates in services.items():
            demand_data = get_demand_data(svc_key)
            if demand_data:
                demand_score = demand_data["demand_score"]
                demand = (
                    "very_high" if demand_score >= 85
                    else "high" if demand_score >= 70
                    else "moderate" if demand_score >= 50
                    else "low" if demand_score >= 30
                    else "saturated"
                )
                demand_trend = demand_data.get("trend", "stable")
            else:
                demand = DEMAND_INDICATORS.get(svc_key, "moderate")
                demand_trend = "unknown"
            service_list.append({
                "key": svc_key,
                "label": svc_key.replace("_", " ").title(),
                "avg_rate": round((rates["mid"] + rates["senior"]) / 2, 2),
                "demand": demand,
                "demand_trend": demand_trend,
            })
        result.append({
            "key": cat_key,
            "label": cat_info["label"],
            "icon": cat_info["icon"],
            "description": cat_info["description"],
            "services": service_list,
        })
    return result


def get_regions() -> List[Dict[str, Any]]:
    """Return available regions with their countries and multipliers."""
    regions = []
    for region_key, region_info in REGION_GROUPS.items():
        countries = []
        for code, cdata in COUNTRY_DATA.items():
            if cdata["region"] == region_key:
                countries.append({
                    "code": code,
                    "name": cdata["name"],
                    "flag": cdata["flag"],
                    "rate_multiplier": cdata["rate_mult"],
                    "client_budget_multiplier": cdata["client_budget_mult"],
                    "currency": cdata["currency"],
                    "cost_of_living": cdata["col_index"],
                })
        countries.sort(key=lambda c: c["name"])
        regions.append({
            "key": region_key,
            "label": region_info["label"],
            "icon": region_info["icon"],
            "multiplier": REGIONAL_MULTIPLIERS.get(region_key, 0.65),
            "countries": countries,
        })
    return regions


def get_countries() -> List[Dict[str, Any]]:
    """Return flat list of all countries for quick lookup."""
    result = []
    for code, cdata in COUNTRY_DATA.items():
        result.append({
            "code": code,
            "name": cdata["name"],
            "region": cdata["region"],
            "flag": cdata["flag"],
            "rate_multiplier": cdata["rate_mult"],
            "client_budget_multiplier": cdata["client_budget_mult"],
            "currency": cdata["currency"],
            "ppp_index": cdata["ppp_index"],
            "cost_of_living": cdata["col_index"],
        })
    result.sort(key=lambda c: c["name"])
    return result


# ============================================================================
# Smart Hours Estimation — helps users who don't know how many hours needed
# ============================================================================

# Complexity questions per category — user answers these to get hours suggestion
COMPLEXITY_QUESTIONS: Dict[str, List[Dict[str, Any]]] = {
    "software_development": [
        {
            "id": "pages_screens",
            "label": "How many pages/screens?",
            "type": "select",
            "options": [
                {"value": "1-3", "label": "1–3 pages (simple)", "hours": 20},
                {"value": "4-8", "label": "4–8 pages (standard)", "hours": 50},
                {"value": "9-20", "label": "9–20 pages (complex)", "hours": 100},
                {"value": "20+", "label": "20+ pages (large app)", "hours": 200},
            ],
        },
        {
            "id": "auth_users",
            "label": "User accounts & authentication?",
            "type": "select",
            "options": [
                {"value": "none", "label": "No user accounts", "hours": 0},
                {"value": "basic", "label": "Basic login/signup", "hours": 16},
                {"value": "social", "label": "Social + email login", "hours": 24},
                {"value": "advanced", "label": "Roles, permissions, SSO", "hours": 40},
            ],
        },
        {
            "id": "database",
            "label": "Database complexity?",
            "type": "select",
            "options": [
                {"value": "none", "label": "No database (static)", "hours": 0},
                {"value": "simple", "label": "Simple data storage", "hours": 12},
                {"value": "moderate", "label": "Multiple related tables", "hours": 30},
                {"value": "complex", "label": "Complex queries, search, analytics", "hours": 50},
            ],
        },
        {
            "id": "integrations",
            "label": "Third-party integrations?",
            "type": "select",
            "options": [
                {"value": "none", "label": "None", "hours": 0},
                {"value": "1-2", "label": "1–2 APIs (e.g., payment, email)", "hours": 16},
                {"value": "3-5", "label": "3–5 APIs", "hours": 35},
                {"value": "5+", "label": "5+ complex integrations", "hours": 60},
            ],
        },
        {
            "id": "design_level",
            "label": "Design requirements?",
            "type": "select",
            "options": [
                {"value": "basic", "label": "Basic / template-based", "hours": 8},
                {"value": "custom", "label": "Custom design needed", "hours": 24},
                {"value": "premium", "label": "Premium UI/UX with animations", "hours": 48},
            ],
        },
    ],
    "design_creative": [
        {
            "id": "deliverables_count",
            "label": "Number of design deliverables?",
            "type": "select",
            "options": [
                {"value": "1-2", "label": "1–2 items", "hours": 10},
                {"value": "3-5", "label": "3–5 items", "hours": 24},
                {"value": "6-10", "label": "6–10 items", "hours": 45},
                {"value": "10+", "label": "10+ items (full brand kit)", "hours": 80},
            ],
        },
        {
            "id": "revision_rounds",
            "label": "Expected revision rounds?",
            "type": "select",
            "options": [
                {"value": "1", "label": "1 round", "hours": 4},
                {"value": "2-3", "label": "2–3 rounds", "hours": 10},
                {"value": "unlimited", "label": "Until perfect", "hours": 20},
            ],
        },
        {
            "id": "complexity",
            "label": "Design complexity?",
            "type": "select",
            "options": [
                {"value": "simple", "label": "Simple / minimalist", "hours": 6},
                {"value": "moderate", "label": "Moderate detail", "hours": 16},
                {"value": "complex", "label": "Highly detailed / illustrations", "hours": 35},
            ],
        },
    ],
    "marketing_growth": [
        {
            "id": "channels",
            "label": "Marketing channels?",
            "type": "select",
            "options": [
                {"value": "1", "label": "Single channel", "hours": 15},
                {"value": "2-3", "label": "2–3 channels", "hours": 35},
                {"value": "4+", "label": "Full multi-channel strategy", "hours": 70},
            ],
        },
        {
            "id": "content_volume",
            "label": "Content creation volume?",
            "type": "select",
            "options": [
                {"value": "low", "label": "Minimal content needed", "hours": 8},
                {"value": "moderate", "label": "Regular content (weekly)", "hours": 25},
                {"value": "high", "label": "Heavy content requirements", "hours": 50},
            ],
        },
        {
            "id": "analytics",
            "label": "Analytics & reporting?",
            "type": "select",
            "options": [
                {"value": "basic", "label": "Basic tracking", "hours": 5},
                {"value": "detailed", "label": "Detailed reporting & KPIs", "hours": 15},
                {"value": "advanced", "label": "Custom dashboards & attribution", "hours": 30},
            ],
        },
    ],
    "writing_content": [
        {
            "id": "word_count",
            "label": "Total word count?",
            "type": "select",
            "options": [
                {"value": "short", "label": "Under 2,000 words", "hours": 6},
                {"value": "medium", "label": "2,000–10,000 words", "hours": 20},
                {"value": "long", "label": "10,000–50,000 words", "hours": 60},
                {"value": "book", "label": "50,000+ words (book/manual)", "hours": 150},
            ],
        },
        {
            "id": "research",
            "label": "Research intensity?",
            "type": "select",
            "options": [
                {"value": "minimal", "label": "Minimal research", "hours": 3},
                {"value": "moderate", "label": "Moderate research needed", "hours": 12},
                {"value": "deep", "label": "Deep research / technical", "hours": 30},
            ],
        },
        {
            "id": "revisions",
            "label": "Editing & revision rounds?",
            "type": "select",
            "options": [
                {"value": "1", "label": "1 revision", "hours": 4},
                {"value": "2-3", "label": "2–3 rounds", "hours": 10},
                {"value": "extensive", "label": "Extensive editing", "hours": 20},
            ],
        },
    ],
    "video_animation": [
        {
            "id": "duration",
            "label": "Final video duration?",
            "type": "select",
            "options": [
                {"value": "short", "label": "Under 1 minute", "hours": 15},
                {"value": "medium", "label": "1–5 minutes", "hours": 35},
                {"value": "long", "label": "5–15 minutes", "hours": 70},
                {"value": "extended", "label": "15+ minutes", "hours": 120},
            ],
        },
        {
            "id": "production",
            "label": "Production complexity?",
            "type": "select",
            "options": [
                {"value": "simple", "label": "Simple (stock + text)", "hours": 8},
                {"value": "moderate", "label": "Moderate (custom graphics)", "hours": 20},
                {"value": "complex", "label": "Complex (animation / 3D)", "hours": 50},
            ],
        },
    ],
}

# Fallback generic questions for any category
GENERIC_COMPLEXITY_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "overall_scope",
        "label": "Overall project scope?",
        "type": "select",
        "options": [
            {"value": "tiny", "label": "Very small task (a few hours)", "hours": 8},
            {"value": "small", "label": "Small project (a few days)", "hours": 25},
            {"value": "medium", "label": "Medium project (1–2 weeks)", "hours": 60},
            {"value": "large", "label": "Large project (3–6 weeks)", "hours": 160},
            {"value": "enterprise", "label": "Enterprise scale (2+ months)", "hours": 400},
        ],
    },
    {
        "id": "revisions_general",
        "label": "Expected revision rounds?",
        "type": "select",
        "options": [
            {"value": "1", "label": "1 revision", "hours": 5},
            {"value": "2-3", "label": "2–3 rounds", "hours": 12},
            {"value": "unlimited", "label": "Multiple until satisfied", "hours": 25},
        ],
    },
    {
        "id": "complexity_general",
        "label": "Technical complexity?",
        "type": "select",
        "options": [
            {"value": "simple", "label": "Straightforward / standard", "hours": 0},
            {"value": "moderate", "label": "Some complexity", "hours": 15},
            {"value": "complex", "label": "Highly complex / specialized", "hours": 40},
        ],
    },
]


def get_hours_questions(category: str) -> List[Dict[str, Any]]:
    """Return complexity questions for a given category to help estimate hours."""
    return COMPLEXITY_QUESTIONS.get(category, GENERIC_COMPLEXITY_QUESTIONS)


def calculate_smart_hours(
    category: str,
    service_type: str,
    scope: str,
    answers: Dict[str, str],
    features: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Calculate smart hour estimate from user's complexity answers.
    Returns total hours, per-answer breakdown, and confidence info.
    """
    questions = COMPLEXITY_QUESTIONS.get(category, GENERIC_COMPLEXITY_QUESTIONS)
    question_map = {q["id"]: q for q in questions}

    total_hours = 0
    breakdown_items = []

    for qid, answer_value in answers.items():
        q = question_map.get(qid)
        if not q:
            continue
        for opt in q.get("options", []):
            if opt["value"] == answer_value:
                h = opt["hours"]
                total_hours += h
                breakdown_items.append({
                    "question": q["label"],
                    "answer": opt["label"],
                    "hours": h,
                })
                break

    # Features add ~3% each (capped 50%)
    feature_bonus = 1.0
    if features and len(features) > 0:
        feature_bonus = min(1.0 + len(features) * 0.03, 1.5)

    # Apply scope multiplier on top of what questions produced
    scope_mult = SCOPE_MULTIPLIERS.get(scope, 1.0)
    adjusted_hours = max(int(total_hours * scope_mult * feature_bonus), 4)

    # Check against template for this service type for baseline validation
    templates = DELIVERABLE_TEMPLATES.get(service_type)
    template_hours = sum(d["hours"] for d in templates) * scope_mult if templates else None
    template_adjusted = int(template_hours) if template_hours else None

    # Use weighted blend if template exists
    if template_adjusted and adjusted_hours > 0:
        blended = int(adjusted_hours * 0.6 + template_adjusted * 0.4)
    else:
        blended = adjusted_hours

    return {
        "estimated_hours": blended,
        "question_hours": total_hours,
        "adjusted_hours": adjusted_hours,
        "template_hours": template_adjusted,
        "breakdown": breakdown_items,
        "scope_multiplier": scope_mult,
        "feature_bonus": round(feature_bonus, 2),
        "low_hours": max(int(blended * 0.75), 4),
        "high_hours": int(blended * 1.4),
        "confidence": "high" if len(answers) >= len(questions) else "medium" if len(answers) >= len(questions) * 0.5 else "low",
    }


def estimate_price(
    category: str,
    service_type: str,
    experience_level: str = "mid",
    region: str = "global_remote",
    urgency: str = "standard",
    quality_tier: str = "standard",
    scope: str = "medium",
    estimated_hours: Optional[int] = None,
    description: str = "",
    features: Optional[List[str]] = None,
    team_size: int = 1,
    client_country: Optional[str] = None,
    freelancer_country: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Core estimation function. Returns comprehensive price estimate.
    
    General-purpose - works for any user, any industry, any service need.
    Now supports country-level pricing using client_country and freelancer_country
    ISO codes for precise regional calculations.
    """
    # 1. Look up base hourly rate
    category_rates = MARKET_RATES.get(category, {})
    service_rates = category_rates.get(service_type, None)

    if not service_rates:
        # Fallback: use category average
        if category_rates:
            all_rates = list(category_rates.values())
            service_rates = {
                "junior": sum(r["junior"] for r in all_rates) / len(all_rates),
                "mid": sum(r["mid"] for r in all_rates) / len(all_rates),
                "senior": sum(r["senior"] for r in all_rates) / len(all_rates),
                "expert": sum(r["expert"] for r in all_rates) / len(all_rates),
            }
        else:
            service_rates = {"junior": 30, "mid": 55, "senior": 100, "expert": 175}

    base_rate = service_rates.get(experience_level, service_rates["mid"])

    # 1b. Blend with real-world data from market_data_2025
    data_driven = calculate_data_driven_rate(
        service_type, experience_level,
        country_code=freelancer_country or client_country,
    )
    if data_driven["confidence"] != "low":
        # Weighted blend: 55% hardcoded rates, 45% real-world data
        base_rate = base_rate * 0.55 + data_driven["rate"] * 0.45
    data_sources_used = data_driven.get("sources", [])

    # 2. Apply multipliers — use country-level data if available
    client_data = COUNTRY_DATA.get(client_country, None) if client_country else None
    freelancer_data = COUNTRY_DATA.get(freelancer_country, None) if freelancer_country else None

    # Determine effective regional multiplier
    if freelancer_data:
        # Freelancer country directly sets the rate multiplier
        regional_mult = freelancer_data["rate_mult"]
    elif client_data:
        # If only client country, use client budget multiplier for price expectations
        regional_mult = client_data["client_budget_mult"]
    else:
        regional_mult = REGIONAL_MULTIPLIERS.get(region, 0.65)

    urgency_mult = URGENCY_MULTIPLIERS.get(urgency, 1.0)
    quality_mult = QUALITY_MULTIPLIERS.get(quality_tier, 1.0)
    scope_mult = SCOPE_MULTIPLIERS.get(scope, 1.0)

    effective_rate = base_rate * regional_mult * urgency_mult * quality_mult

    # 3. Calculate hours
    if estimated_hours and estimated_hours > 0:
        total_hours = estimated_hours
    else:
        # Estimate hours from scope and service type templates
        templates = DELIVERABLE_TEMPLATES.get(service_type)
        if templates:
            total_hours = sum(d["hours"] for d in templates)
            total_hours = int(total_hours * scope_mult)
        else:
            # Generic hour estimation based on scope
            scope_hours = {
                "minimal": 10, "small": 25, "medium": 60,
                "large": 120, "enterprise": 250
            }
            total_hours = scope_hours.get(scope, 60)

    # Adjust for team size
    if team_size > 1:
        total_hours = int(total_hours * (1 + (team_size - 1) * 0.7))

    # 4. Description complexity bonus
    desc_bonus = 1.0
    if description:
        word_count = len(description.split())
        if word_count > 200:
            desc_bonus = 1.15
        elif word_count > 100:
            desc_bonus = 1.08

    # 5. Features bonus
    features_bonus = 1.0
    if features:
        features_bonus = 1 + len(features) * 0.03
        features_bonus = min(features_bonus, 1.5)  # Cap at 50% increase

    # 6. Demand adjustment — use DEMAND_INDEX_2025 for granular data
    demand_data_2025 = get_demand_data(service_type)
    if demand_data_2025:
        dscore = demand_data_2025["demand_score"]
        # Continuous demand multiplier: score 50 → 1.0, score 100 → 1.20, score 0 → 0.80
        demand_mult = 0.80 + (dscore / 100) * 0.40
        demand = (
            "very_high" if dscore >= 85
            else "high" if dscore >= 70
            else "moderate" if dscore >= 50
            else "low" if dscore >= 30
            else "saturated"
        )
        demand_trend = demand_data_2025.get("trend", "stable")
        data_sources_used.append("Demand Index 2025")
    else:
        demand = DEMAND_INDICATORS.get(service_type, "moderate")
        demand_mult = {
            "very_high": 1.15,
            "high": 1.08,
            "moderate": 1.0,
            "low": 0.90,
            "saturated": 0.80,
        }.get(demand, 1.0)
        demand_trend = "unknown"

    effective_rate *= demand_mult * desc_bonus * features_bonus

    # 7. Calculate totals
    total_estimate = effective_rate * total_hours
    low_estimate = total_estimate * 0.75
    high_estimate = total_estimate * 1.35

    # 8. Build cost breakdown
    breakdown = _build_breakdown(service_type, total_estimate, total_hours, effective_rate)

    # 9. Calculate confidence score
    confidence = _calculate_confidence(
        category, service_type, estimated_hours, description, features, experience_level,
        data_sources_used=data_sources_used,
        freelancer_country=freelancer_country,
    )

    # 10. Market comparison
    market_comparison = _build_market_comparison(
        service_rates, regional_mult, total_hours, total_estimate
    )

    # 11. Pricing factors analysis
    factors = _build_factors(
        experience_level, region, urgency, quality_tier, scope, demand,
        regional_mult, urgency_mult, quality_mult, scope_mult, demand_mult,
        client_data, freelancer_data
    )

    # 12. ROI insights
    roi_insights = _build_roi_insights(category, service_type, total_estimate, quality_tier)

    # 13. Timeline estimation
    timeline = _estimate_timeline(total_hours, team_size, urgency)

    # 14. Regional analysis — detailed country-level pricing context
    regional_analysis = _build_regional_analysis(
        client_data, freelancer_data, region, base_rate,
        effective_rate, regional_mult, total_estimate,
        service_type=service_type,
    )

    return {
        "estimate": {
            "hourly_rate": round(effective_rate, 2),
            "total_hours": total_hours,
            "total_estimate": round(total_estimate, 2),
            "low_estimate": round(low_estimate, 2),
            "high_estimate": round(high_estimate, 2),
            "currency": "USD",
        },
        "breakdown": breakdown,
        "confidence": confidence,
        "market_comparison": market_comparison,
        "factors": factors,
        "roi_insights": roi_insights,
        "timeline": timeline,
        "demand_level": demand,
        "demand_trend": demand_trend,
        "regional_analysis": regional_analysis,
        "meta": {
            "category": category,
            "service_type": service_type,
            "experience_level": experience_level,
            "region": region,
            "urgency": urgency,
            "quality_tier": quality_tier,
            "scope": scope,
            "team_size": team_size,
            "client_country": client_country,
            "freelancer_country": freelancer_country,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "data_version": DATA_VERSION,
            "data_sources": data_sources_used,
        }
    }


def _build_breakdown(
    service_type: str,
    total_estimate: float,
    total_hours: int,
    effective_rate: float
) -> List[Dict[str, Any]]:
    """Build detailed cost breakdown by phase/deliverable."""
    templates = DELIVERABLE_TEMPLATES.get(service_type)
    if templates:
        template_total_hours = sum(d["hours"] for d in templates)
        items = []
        for d in templates:
            pct = d["hours"] / template_total_hours
            items.append({
                "label": d["label"],
                "category": d["category"],
                "hours": round(total_hours * pct),
                "cost": round(total_estimate * pct, 2),
                "percentage": round(pct * 100, 1),
            })
        return items

    # Generic breakdown
    default_phases = [
        ("Planning & Requirements", 0.10),
        ("Design & Prototyping", 0.15),
        ("Core Development / Execution", 0.45),
        ("Testing & Quality Assurance", 0.15),
        ("Review & Revisions", 0.10),
        ("Delivery & Handoff", 0.05),
    ]
    return [
        {
            "label": label,
            "category": label.split(" ")[0].lower(),
            "hours": round(total_hours * pct),
            "cost": round(total_estimate * pct, 2),
            "percentage": round(pct * 100, 1),
        }
        for label, pct in default_phases
    ]


def _calculate_confidence(
    category: str,
    service_type: str,
    estimated_hours: Optional[int],
    description: str,
    features: Optional[List[str]],
    experience_level: str,
    data_sources_used: Optional[List[str]] = None,
    freelancer_country: Optional[str] = None,
) -> Dict[str, Any]:
    """Calculate estimation confidence score with factors and data quality."""
    score = 60  # Base confidence
    factors = []

    # Known category/service
    if category in MARKET_RATES and service_type in MARKET_RATES.get(category, {}):
        score += 15
        factors.append({"factor": "Known service type", "impact": "+15"})
    else:
        factors.append({"factor": "Generic category fallback", "impact": "+0"})

    # Hours provided
    if estimated_hours and estimated_hours > 0:
        score += 10
        factors.append({"factor": "Hours specified by user", "impact": "+10"})

    # Description quality
    if description:
        words = len(description.split())
        if words > 200:
            score += 10
            factors.append({"factor": "Detailed description (200+ words)", "impact": "+10"})
        elif words > 50:
            score += 5
            factors.append({"factor": "Moderate description", "impact": "+5"})

    # Features specified
    if features and len(features) > 0:
        bonus = min(len(features) * 2, 10)
        score += bonus
        factors.append({"factor": f"{len(features)} features specified", "impact": f"+{bonus}"})

    # Data source coverage — real-world data improves confidence
    src_count = len(data_sources_used) if data_sources_used else 0
    if src_count >= 3:
        score += 8
        factors.append({"factor": f"Backed by {src_count} data sources", "impact": "+8"})
    elif src_count >= 1:
        score += 4
        factors.append({"factor": f"Backed by {src_count} data source(s)", "impact": "+4"})

    # Country-level rate data from Arc.dev survey
    if freelancer_country:
        country_rate = get_country_rate_data(freelancer_country)
        if country_rate and country_rate.get("sample", 0) >= 50:
            score += 5
            factors.append({"factor": f"Strong survey data for {freelancer_country} (n={country_rate['sample']})", "impact": "+5"})
        elif country_rate:
            score += 2
            factors.append({"factor": f"Limited survey data for {freelancer_country} (n={country_rate.get('sample', 0)})", "impact": "+2"})

    # Upwork service rate data available
    upwork_rate = get_upwork_service_rate(service_type)
    if upwork_rate:
        score += 3
        factors.append({"factor": "Upwork rate benchmark available", "impact": "+3"})

    score = min(score, 98)

    level = "high" if score >= 80 else "medium" if score >= 65 else "low"

    return {
        "score": score,
        "level": level,
        "factors": factors,
        "data_sources_count": src_count,
    }


def _build_market_comparison(
    service_rates: Dict[str, float],
    regional_mult: float,
    total_hours: int,
    total_estimate: float,
) -> Dict[str, Any]:
    """Compare estimate against market rate tiers."""
    budget_total = service_rates["junior"] * regional_mult * total_hours
    standard_total = service_rates["mid"] * regional_mult * total_hours
    premium_total = service_rates["senior"] * regional_mult * total_hours
    enterprise_total = service_rates["expert"] * regional_mult * total_hours

    # Determine where the estimate falls
    if total_estimate <= budget_total * 1.1:
        position = "budget"
        position_label = "Budget-Friendly"
    elif total_estimate <= standard_total * 1.1:
        position = "standard"
        position_label = "Market Rate"
    elif total_estimate <= premium_total * 1.1:
        position = "premium"
        position_label = "Premium"
    else:
        position = "enterprise"
        position_label = "Enterprise-Grade"

    return {
        "tiers": {
            "budget": {"label": "Budget", "total": round(budget_total, 2), "hourly": round(service_rates["junior"] * regional_mult, 2)},
            "standard": {"label": "Standard", "total": round(standard_total, 2), "hourly": round(service_rates["mid"] * regional_mult, 2)},
            "premium": {"label": "Premium", "total": round(premium_total, 2), "hourly": round(service_rates["senior"] * regional_mult, 2)},
            "enterprise": {"label": "Enterprise", "total": round(enterprise_total, 2), "hourly": round(service_rates["expert"] * regional_mult, 2)},
        },
        "your_position": position,
        "your_position_label": position_label,
    }


def _build_factors(
    experience_level: str,
    region: str,
    urgency: str,
    quality_tier: str,
    scope: str,
    demand: str,
    regional_mult: float,
    urgency_mult: float,
    quality_mult: float,
    scope_mult: float,
    demand_mult: float,
    client_data: Optional[Dict[str, Any]] = None,
    freelancer_data: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Build pricing factors analysis."""
    factors = []

    # Experience
    exp_labels = {"junior": "Junior", "mid": "Mid-Level", "senior": "Senior", "expert": "Expert"}
    exp_impact = {"junior": "cost_saver", "mid": "neutral", "senior": "premium", "expert": "premium"}
    factors.append({
        "label": "Experience Level",
        "value": exp_labels.get(experience_level, experience_level),
        "impact": exp_impact.get(experience_level, "neutral"),
        "description": "Sets the base hourly rate tier",
    })

    # Region — enhanced with country-level detail
    if freelancer_data:
        name = freelancer_data["name"]
        flag = freelancer_data["flag"]
        mult = freelancer_data["rate_mult"]
        if mult < 0.3:
            impact = "cost_saver"
            desc = f"Freelancers from {name} offer highly competitive rates (Col: {freelancer_data['col_index']}/100)"
        elif mult < 0.6:
            impact = "cost_saver"
            desc = f"Moderate cost savings hiring from {name}"
        elif mult >= 0.9:
            impact = "premium"
            desc = f"Premium market rates in {name} (Col: {freelancer_data['col_index']}/100)"
        else:
            impact = "neutral"
            desc = f"Standard pricing for {name}"
        factors.append({
            "label": "Freelancer Location",
            "value": f"{flag} {name}",
            "impact": impact,
            "multiplier": mult,
            "description": desc,
        })
    elif client_data:
        name = client_data["name"]
        flag = client_data["flag"]
        mult = client_data["client_budget_mult"]
        if mult < 0.3:
            impact = "cost_saver"
            desc = f"Budget expectations from {name} reflect local purchasing power (PPP: {client_data['ppp_index']})"
        elif mult < 0.6:
            impact = "cost_saver"
            desc = f"Moderate budget expectations from {name}"
        elif mult >= 0.9:
            impact = "premium"
            desc = f"Clients from {name} typically have higher budgets"
        else:
            impact = "neutral"
            desc = f"Standard budget range for {name}"
        factors.append({
            "label": "Client Location",
            "value": f"{flag} {name}",
            "impact": impact,
            "multiplier": mult,
            "description": desc,
        })
    else:
        if regional_mult < 0.5:
            impact = "cost_saver"
            desc = "Significant cost savings from this region"
        elif regional_mult < 0.8:
            impact = "cost_saver"
            desc = "Moderate cost savings"
        elif regional_mult >= 1.0:
            impact = "premium"
            desc = "Premium market rates"
        else:
            impact = "neutral"
            desc = "Standard regional pricing"
        factors.append({
            "label": "Region",
            "value": region.replace("_", " ").title(),
            "impact": impact,
            "multiplier": regional_mult,
            "description": desc,
        })

    # Urgency
    if urgency_mult > 1.2:
        u_impact = "premium"
        u_desc = f"Rush delivery adds {int((urgency_mult - 1) * 100)}% to cost"
    elif urgency_mult < 1.0:
        u_impact = "cost_saver"
        u_desc = f"Flexible timeline saves {int((1 - urgency_mult) * 100)}%"
    else:
        u_impact = "neutral"
        u_desc = "Standard timeline pricing"

    factors.append({
        "label": "Timeline",
        "value": urgency.replace("_", " ").title(),
        "impact": u_impact,
        "multiplier": urgency_mult,
        "description": u_desc,
    })

    # Quality
    if quality_mult > 1.2:
        q_impact = "premium"
        q_desc = f"Premium quality adds {int((quality_mult - 1) * 100)}% to cost"
    elif quality_mult < 0.8:
        q_impact = "cost_saver"
        q_desc = f"Budget tier saves {int((1 - quality_mult) * 100)}%"
    else:
        q_impact = "neutral"
        q_desc = "Standard quality level"

    factors.append({
        "label": "Quality Tier",
        "value": quality_tier.replace("_", " ").title(),
        "impact": q_impact,
        "multiplier": quality_mult,
        "description": q_desc,
    })

    # Demand
    demand_labels = {
        "very_high": "Very High Demand",
        "high": "High Demand",
        "moderate": "Moderate Demand",
        "low": "Low Demand",
        "saturated": "Saturated Market",
    }
    demand_impact = {
        "very_high": "premium",
        "high": "premium",
        "moderate": "neutral",
        "low": "cost_saver",
        "saturated": "cost_saver",
    }
    factors.append({
        "label": "Market Demand",
        "value": demand_labels.get(demand, demand),
        "impact": demand_impact.get(demand, "neutral"),
        "multiplier": demand_mult,
        "description": "Current market supply/demand for this service",
    })

    return factors


def _build_roi_insights(
    category: str,
    service_type: str,
    total_estimate: float,
    quality_tier: str,
) -> List[Dict[str, str]]:
    """Generate ROI-focused insights for the estimate."""
    insights = []

    # General ROI insight
    if quality_tier == "budget":
        insights.append({
            "type": "warning",
            "title": "Budget Quality Trade-off",
            "message": "Budget pricing may require more revisions or maintenance later. Consider if this aligns with your long-term goals.",
        })
    elif quality_tier == "premium" or quality_tier == "enterprise":
        insights.append({
            "type": "positive",
            "title": "Quality Investment",
            "message": "Premium quality typically yields better user satisfaction, fewer bugs, and lower long-term maintenance costs.",
        })

    # Category-specific insights
    if category == "software_development":
        insights.append({
            "type": "info",
            "title": "Tech Investment ROI",
            "message": "Software projects typically see 3-5x ROI within 18 months when properly scoped and executed.",
        })
    elif category == "marketing":
        insights.append({
            "type": "info",
            "title": "Marketing ROI",
            "message": "Expect measurable results within 3-6 months for SEO, and immediate tracking for paid campaigns.",
        })
    elif category == "design_creative":
        insights.append({
            "type": "info",
            "title": "Design Impact",
            "message": "Professional design can increase conversion rates by 20-40% and significantly improve brand perception.",
        })

    # Cost saving tip
    if total_estimate > 5000:
        insights.append({
            "type": "tip",
            "title": "Cost Optimization",
            "message": "Consider phased delivery with milestones. This reduces risk and allows budget adjustments between phases.",
        })

    return insights


def _estimate_timeline(
    total_hours: int,
    team_size: int,
    urgency: str,
) -> Dict[str, Any]:
    """Estimate project timeline based on hours and team."""
    effective_hours_per_day = 6  # Realistic productive hours per day
    days_per_week = 5

    parallel_hours = total_hours / max(team_size, 1)
    working_days = math.ceil(parallel_hours / effective_hours_per_day)

    # Urgency adjustment
    if urgency == "critical":
        effective_hours_per_day = 8
        working_days = math.ceil(parallel_hours / effective_hours_per_day)
    elif urgency == "relaxed":
        working_days = int(working_days * 1.3)
    elif urgency == "ongoing":
        working_days = int(working_days * 1.5)

    weeks = math.ceil(working_days / days_per_week)

    if weeks <= 1:
        label = f"{working_days} days"
    elif weeks <= 4:
        label = f"{weeks} weeks"
    else:
        months = round(weeks / 4.33, 1)
        label = f"{months} months"

    return {
        "working_days": working_days,
        "weeks": weeks,
        "label": label,
        "team_size": team_size,
        "hours_per_day": effective_hours_per_day,
    }


def _build_regional_analysis(
    client_data: Optional[Dict[str, Any]],
    freelancer_data: Optional[Dict[str, Any]],
    region: str,
    base_rate: float,
    effective_rate: float,
    regional_mult: float,
    total_estimate: float,
    service_type: str = "",
) -> Dict[str, Any]:
    """Build detailed regional pricing analysis with country-specific context."""
    analysis: Dict[str, Any] = {
        "has_country_data": bool(client_data or freelancer_data),
        "pricing_context": [],
        "comparison_countries": [],
    }

    if client_data:
        analysis["client_country"] = {
            "code": next(k for k, v in COUNTRY_DATA.items() if v["name"] == client_data["name"]),
            "name": client_data["name"],
            "flag": client_data["flag"],
            "currency": client_data["currency"],
            "cost_of_living": client_data["col_index"],
            "ppp_index": client_data["ppp_index"],
            "budget_multiplier": client_data["client_budget_mult"],
        }
        # Local currency equivalent (approximate)
        ppp = client_data["ppp_index"]
        if ppp > 0:
            local_purchasing_power = total_estimate * ppp
            analysis["local_value_context"] = {
                "usd_total": round(total_estimate, 2),
                "ppp_adjusted": round(local_purchasing_power, 2),
                "ppp_ratio": round(ppp, 2),
                "description": (
                    f"${round(total_estimate):,} USD has the purchasing power of "
                    f"~${round(total_estimate / ppp):,} in the US, "
                    f"making this {'a significant' if ppp < 0.3 else 'a moderate' if ppp < 0.7 else 'a comparable'} "
                    f"investment for clients in {client_data['name']}."
                ),
            }

        # Context tips for this client country
        col = client_data["col_index"]
        if col < 25:
            analysis["pricing_context"].append({
                "type": "warning",
                "title": "Budget Sensitivity",
                "message": f"Clients from {client_data['name']} (Cost of Living: {col}/100) typically have tighter budgets. Consider offering milestone-based payments or phased delivery.",
            })
        elif col < 50:
            analysis["pricing_context"].append({
                "type": "info",
                "title": "Moderate Budget Market",
                "message": f"Clients from {client_data['name']} generally expect competitive pricing. Value-based proposals work well here.",
            })
        else:
            analysis["pricing_context"].append({
                "type": "positive",
                "title": "Strong Budget Market",
                "message": f"Clients from {client_data['name']} typically have healthy budgets for quality work.",
            })

    if freelancer_data:
        analysis["freelancer_country"] = {
            "code": next(k for k, v in COUNTRY_DATA.items() if v["name"] == freelancer_data["name"]),
            "name": freelancer_data["name"],
            "flag": freelancer_data["flag"],
            "currency": freelancer_data["currency"],
            "cost_of_living": freelancer_data["col_index"],
            "rate_multiplier": freelancer_data["rate_mult"],
        }
        col = freelancer_data["col_index"]
        if col < 25:
            analysis["pricing_context"].append({
                "type": "positive",
                "title": "Competitive Rates",
                "message": f"Freelancers from {freelancer_data['name']} offer excellent value with rates reflecting local cost of living ({col}/100).",
            })

    # Build comparison across key countries for context
    comparison_codes = ["US", "GB", "DE", "IN", "PK", "PH", "BR", "UA", "AE", "AU"]
    for code in comparison_codes:
        cdata = COUNTRY_DATA.get(code)
        if cdata:
            local_rate = round(base_rate * cdata["rate_mult"], 2)
            analysis["comparison_countries"].append({
                "code": code,
                "name": cdata["name"],
                "flag": cdata["flag"],
                "hourly_rate": local_rate,
                "rate_multiplier": cdata["rate_mult"],
                "cost_of_living": cdata["col_index"],
            })

    analysis["comparison_countries"].sort(key=lambda c: c["hourly_rate"], reverse=True)

    # Cross-platform rate comparison (Upwork vs Fiverr)
    platform_comparison = {}
    service_to_platform_map = {
        "web_application": "web_development", "mobile_app": "mobile_development",
        "ecommerce_platform": "web_development", "saas_product": "web_development",
        "api_development": "web_development", "ui_ux_design": "design",
        "logo_branding": "design", "graphic_design": "design", "web_design": "design",
        "seo_optimization": "marketing_seo", "content_marketing": "marketing_seo",
        "social_media": "marketing_seo", "ppc_advertising": "marketing_seo",
        "blog_articles": "writing", "copywriting": "writing", "technical_writing": "writing",
        "video_editing": "video_animation", "video_production": "video_animation",
        "animation_2d": "video_animation", "data_science": "data_science_ai",
        "ai_ml_solution": "data_science_ai", "machine_learning": "data_science_ai",
        "business_consulting": "consulting", "financial_consulting": "consulting",
    }
    platform_cat = service_to_platform_map.get(service_type, "")
    if platform_cat:
        for plat in ["upwork", "fiverr"]:
            plat_data = get_platform_rates(plat, platform_cat)
            if plat_data:
                platform_comparison[plat] = plat_data
    if platform_comparison:
        analysis["platform_rates"] = platform_comparison

    # Pakistan city-level data if the freelancer is from PK
    freelancer_code = None
    if freelancer_data:
        freelancer_code = next(
            (k for k, v in COUNTRY_DATA.items() if v["name"] == freelancer_data["name"]),
            None,
        )
    if freelancer_code == "PK":
        pk_cities = get_pakistan_cities()
        if pk_cities:
            analysis["city_rates"] = pk_cities

    # South Asia benchmark context
    sa_code = freelancer_code or (
        next((k for k, v in COUNTRY_DATA.items() if v["name"] == client_data["name"]), None)
        if client_data else None
    )
    if sa_code:
        sa_bench = get_south_asia_benchmark(sa_code)
        if sa_bench:
            analysis["regional_benchmark"] = sa_bench

    return analysis


def get_platform_market_data(category: str, service_type: str) -> Dict[str, Any]:
    """
    Fetch real market data from our platform database to enhance estimates.
    Pulls actual project budgets and freelancer rates from MegiLance data.
    """
    data = {
        "avg_project_budget": None,
        "avg_hourly_rate": None,
        "total_projects": 0,
        "total_freelancers": 0,
    }

    try:
        # Get average budget for similar projects
        result = execute_query(
            """SELECT AVG((budget_min + budget_max) / 2) as avg_budget, COUNT(*) as cnt
               FROM projects
               WHERE category LIKE ? AND status IN ('completed', 'in_progress')""",
            [f"%{service_type.replace('_', ' ')}%"]
        )
        if result and result.get("rows"):
            row = result["rows"][0]
            if row[0].get("type") != "null":
                data["avg_project_budget"] = float(row[0].get("value", 0))
            if row[1].get("type") != "null":
                data["total_projects"] = int(row[1].get("value", 0))

        # Get average freelancer rate for relevant skills
        result = execute_query(
            """SELECT AVG(hourly_rate) as avg_rate, COUNT(*) as cnt
               FROM users
               WHERE user_type = 'Freelancer' AND hourly_rate > 0 AND is_active = 1""",
            []
        )
        if result and result.get("rows"):
            row = result["rows"][0]
            if row[0].get("type") != "null":
                data["avg_hourly_rate"] = float(row[0].get("value", 0))
            if row[1].get("type") != "null":
                data["total_freelancers"] = int(row[1].get("value", 0))

    except Exception as e:
        logger.warning(f"Failed to fetch platform market data: {e}")

    return data
