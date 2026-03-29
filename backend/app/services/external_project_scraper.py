"""
@AI-HINT: External project scraping service - aggregates freelance/remote projects
from multiple free APIs (RemoteOK, Jobicy, Arbeitnow) with built-in scam/spam detection.
This service powers the platform's project discovery feature, providing real opportunities
to freelancers even before organic listings are available on MegiLance.
"""

import requests
import json
import re
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from html import unescape

logger = logging.getLogger("megilance.external_projects")


# ============================================================================
# LANGUAGE DETECTION  (lightweight, no external deps)
# ============================================================================

# Common non-English words/patterns that indicate German, French, Spanish, etc.
_NON_ENGLISH_MARKERS = [
    # German
    "(m/w/d)", "(w/m/d)", "(m/f/d)", "(m/w/x)",
    "teilzeit", "vollzeit", "werkstudent", "praktikum", "stellenangebot",
    "kaufmännisch", "leitung", "verwaltung", "mitarbeiter", "arbeit",
    "sachbearbeiter", "geschäftsführ", "abteilung", "unternehmen",
    "anwendung", "netzwerk", "entwickl", "beratung", "buchhalt",
    "personalreferent", "allrounder", "techniker", "dachbegrünung",
    "rechnung", "backoffice", "zahnmedizin",
    # French
    "responsable", "développeur", "ingénieur", "chargé", "directeur",
    "poste", "entreprise", "gestionnaire", "adjoint",
    # Spanish
    "desarrollador", "gerente", "ingeniero", "puesto", "empresa",
    # Dutch
    "medewerker", "vacature", "afdeling",
]

# Common English words that strongly indicate English text
_ENGLISH_MARKERS = [
    "engineer", "developer", "manager", "analyst", "designer", "architect",
    "specialist", "coordinator", "consultant", "director", "lead",
    "senior", "junior", "associate", "intern", "assistant", "executive",
    "remote", "hybrid", "fullstack", "full-stack", "frontend", "backend",
    "software", "marketing", "product", "data", "customer", "support",
    "sales", "operations", "business", "strategy", "communication",
    "looking for", "we are", "you will", "responsibilities", "requirements",
    "experience", "opportunity", "position", "team", "work with",
    "apply now", "about the role", "what you", "your role",
]


def is_likely_english(title: str, description: str = "") -> bool:
    """Fast heuristic check if text is likely English (no ML/NLP deps)."""
    text = f"{title} {description[:500]}".lower()

    # Check for strong non-English markers in title
    title_lower = title.lower()
    for marker in _NON_ENGLISH_MARKERS:
        if marker in title_lower:
            return False

    # Count English vs non-English signals in combined text
    en_score = sum(1 for w in _ENGLISH_MARKERS if w in text)
    non_en_score = sum(1 for w in _NON_ENGLISH_MARKERS if w in text)

    # If no signals either way, check character patterns
    if en_score == 0 and non_en_score == 0:
        # German umlauts / accented chars in title → likely not English
        if re.search(r'[äöüßÄÖÜéèêëàâîïôùûçñ]', title):
            return False
        return True  # assume English if no clear signal

    return en_score >= non_en_score


# ============================================================================
# SCAM/SPAM DETECTION ENGINE
# ============================================================================

# Red-flag keywords commonly found in scam project listings
SCAM_KEYWORDS = [
    "wire transfer", "money order", "western union", "moneygram",
    "pay upfront", "registration fee", "processing fee", "advance payment",
    "send money", "bitcoin payment required", "crypto deposit",
    "guaranteed income", "earn $5000 per day", "make money fast",
    "no experience needed unlimited", "work from home $10000",
    "pyramid", "mlm", "multi-level", "network marketing opportunity",
    "click here to claim", "act now limited time", "congratulations you won",
    "nigerian prince", "inheritance fund", "lottery winner",
    "personal bank account", "social security number", "ssn required",
    "credit card required to apply", "pay to apply",
    "reshipping", "package forwarding", "mystery shopper send back",
    "cash handling from home", "payment processor work from home",
]

# Suspicious patterns in company names
SUSPICIOUS_COMPANY_PATTERNS = [
    r"^[A-Z]{2,3}\d+$",  # Random letter-number combos like "AB123"
    r"^(test|fake|scam|spam)",  # Obviously fake
    r"@gmail\.com$|@yahoo\.com$|@hotmail\.com$",  # Personal email as company
    r"^hiring\s",  # "Hiring Now" type fake companies
]

# Categories we map projects into (matching MegiLance's ProjectCategory)
CATEGORY_MAP = {
    # Development
    "developer": "Web Development",
    "web": "Web Development",
    "frontend": "Web Development",
    "backend": "Web Development",
    "full-stack": "Web Development",
    "fullstack": "Web Development",
    "react": "Web Development",
    "angular": "Web Development",
    "vue": "Web Development",
    "node": "Web Development",
    "python": "Web Development",
    "java": "Web Development",
    "javascript": "Web Development",
    "typescript": "Web Development",
    "ruby": "Web Development",
    "php": "Web Development",
    "laravel": "Web Development",
    "django": "Web Development",
    "devops": "Web Development",
    "cloud": "Web Development",
    "engineer": "Web Development",
    "software": "Web Development",
    
    # Mobile
    "mobile": "Mobile Development",
    "ios": "Mobile Development",
    "android": "Mobile Development",
    "flutter": "Mobile Development",
    "react native": "Mobile Development",
    "swift": "Mobile Development",
    "kotlin": "Mobile Development",
    
    # Data Science
    "data": "Data Science & Analytics",
    "machine learning": "Data Science & Analytics",
    "ml": "Data Science & Analytics",
    "ai": "Data Science & Analytics",
    "analytics": "Data Science & Analytics",
    "data science": "Data Science & Analytics",
    "deep learning": "Data Science & Analytics",
    
    # Design
    "design": "Design & Creative",
    "designer": "Design & Creative",
    "ui": "Design & Creative",
    "ux": "Design & Creative",
    "figma": "Design & Creative",
    "graphic": "Design & Creative",
    "creative": "Design & Creative",
    "illustration": "Design & Creative",
    
    # Writing
    "writer": "Writing & Content",
    "writing": "Writing & Content",
    "content": "Writing & Content",
    "copywriting": "Writing & Content",
    "editor": "Writing & Content",
    "blog": "Writing & Content",
    "seo": "Writing & Content",
    "copywriter": "Writing & Content",
    
    # Marketing
    "marketing": "Marketing & Sales",
    "sales": "Marketing & Sales",
    "growth": "Marketing & Sales",
    "social media": "Marketing & Sales",
    "ads": "Marketing & Sales",
    "advertising": "Marketing & Sales",
    "marketer": "Marketing & Sales",
    
    # Video
    "video": "Video & Animation",
    "animation": "Video & Animation",
    "motion": "Video & Animation",
    "editor": "Video & Animation",
    "3d": "Video & Animation",
}


def strip_html(html_text: str) -> str:
    """Remove HTML tags and decode entities to get plain text"""
    if not html_text:
        return ""
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', ' ', html_text)
    # Decode HTML entities
    clean = unescape(clean)
    # Normalize whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    # Remove the RemoteOK spam detection words
    clean = re.sub(r'Please mention the word \*\*\w+\*\* and tag [\w=]+ when applying.*$', '', clean, flags=re.DOTALL)
    return clean[:5000]  # Cap at 5000 chars for plain text


def categorize_project(title: str, tags: List[str], description: str = "") -> str:
    """Determine project category from title, tags, and description"""
    search_text = f"{title} {' '.join(tags)} {description[:500]}".lower()
    
    # Check each category keyword
    best_match = "Other"
    for keyword, category in CATEGORY_MAP.items():
        if keyword in search_text:
            best_match = category
            break  # Take first match (ordered by priority)
    
    return best_match


def detect_experience_level(title: str, description: str) -> str:
    """Detect experience level from title and description"""
    text = f"{title} {description[:1000]}".lower()
    
    if any(w in text for w in ["senior", "sr.", "lead", "principal", "staff", "architect"]):
        return "Expert"
    elif any(w in text for w in ["mid", "intermediate", "2-5 years", "3+ years", "4+ years"]):
        return "Intermediate"
    elif any(w in text for w in ["junior", "jr.", "entry", "intern", "graduate", "trainee", "0-2 years"]):
        return "Entry"
    
    return "any"


def calculate_trust_score(project: Dict[str, Any]) -> Tuple[float, bool, Optional[str]]:
    """
    Calculate trust score for a scraped project listing.
    Returns: (score: 0.0-1.0, is_flagged: bool, flag_reason: Optional[str])
    
    Scoring factors:
    - Company name present and reasonable: +0.15
    - Has description > 100 chars: +0.15
    - Has valid apply URL: +0.1
    - Has budget info: +0.1
    - Source is reputable: +0.15
    - No scam keywords: +0.2
    - Company has logo: +0.05
    - Posted date is recent: +0.1
    """
    score = 0.0
    reasons = []
    
    title = project.get("title", "")
    company = project.get("company", "")
    description = project.get("description", "")
    apply_url = project.get("apply_url", "")
    budget_min = project.get("budget_min", 0)
    budget_max = project.get("budget_max", 0)
    source = project.get("source", "")
    company_logo = project.get("company_logo", "")
    
    # 1. Company name check (+0.15)
    if company and len(company) > 1:
        is_suspicious = False
        for pattern in SUSPICIOUS_COMPANY_PATTERNS:
            if re.search(pattern, company, re.IGNORECASE):
                is_suspicious = True
                reasons.append(f"Suspicious company name pattern: {company}")
                break
        if not is_suspicious:
            score += 0.15
    else:
        reasons.append("Missing or empty company name")
    
    # 2. Description quality (+0.15)
    desc_plain = strip_html(description)
    if len(desc_plain) > 100:
        score += 0.15
    elif len(desc_plain) > 30:
        score += 0.07
    else:
        reasons.append("Description too short or missing")
    
    # 3. Valid apply URL (+0.1)
    if apply_url and apply_url.startswith("http"):
        score += 0.1
    else:
        reasons.append("Invalid or missing apply URL")
    
    # 4. Budget info (+0.1)
    if budget_min and budget_min > 0 or budget_max and budget_max > 0:
        score += 0.1
        # Check for unrealistic budgets
        if budget_max and budget_max > 1000000:
            score -= 0.1
            reasons.append(f"Unrealistic budget: ${budget_max}")
    
    # 5. Source reputation (+0.15)
    reputable_sources = ["remoteok", "jobicy", "arbeitnow", "weworkremotely"]
    if source.lower() in reputable_sources:
        score += 0.15
    
    # 6. Scam keyword check (+0.2)
    full_text = f"{title} {desc_plain} {company}".lower()
    found_scam_words = []
    for keyword in SCAM_KEYWORDS:
        if keyword.lower() in full_text:
            found_scam_words.append(keyword)
    
    if not found_scam_words:
        score += 0.2
    else:
        reasons.append(f"Scam keywords found: {', '.join(found_scam_words[:3])}")
    
    # 7. Company logo (+0.05)
    if company_logo and len(company_logo) > 5:
        score += 0.05
    
    # 8. Recency (+0.1)
    posted = project.get("posted_at")
    if posted:
        if isinstance(posted, str):
            try:
                posted = datetime.fromisoformat(posted.replace("Z", "+00:00"))
            except Exception:
                posted = None
        if posted and (datetime.now(timezone.utc) - posted).days < 30:
            score += 0.1
        elif posted and (datetime.now(timezone.utc) - posted).days < 90:
            score += 0.05
    
    # Determine if flagged
    is_flagged = score < 0.3 or len(found_scam_words) > 0
    flag_reason = "; ".join(reasons) if reasons else None
    
    return round(min(score, 1.0), 2), is_flagged, flag_reason


# ============================================================================
# PROJECT SCRAPERS - One per source
# ============================================================================

def scrape_remoteok() -> List[Dict[str, Any]]:
    """
    Scrape projects from RemoteOK free JSON API.
    API: https://remoteok.com/api
    Rate limit: Be respectful, cache results
    """
    projects = []
    try:
        logger.info("Scraping RemoteOK...")
        headers = {
            "User-Agent": "MegiLance/1.0 (freelance platform aggregator)",
            "Accept": "application/json"
        }
        resp = requests.get("https://remoteok.com/api", headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        # First item is legal notice, skip it
        for item in data[1:]:
            if not isinstance(item, dict):
                continue
            
            tags = item.get("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]
            
            description = item.get("description", "")
            title = item.get("position", "") or item.get("title", "")
            company = item.get("company", "Unknown")
            
            # Parse posted date
            posted_at = None
            date_str = item.get("date", "")
            if date_str:
                try:
                    posted_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except Exception:
                    pass
            
            budget_min = item.get("salary_min", 0)
            budget_max = item.get("salary_max", 0)
            
            # Generate unique source ID
            source_id = f"remoteok_{item.get('id', item.get('slug', ''))}"
            
            project = {
                "source": "remoteok",
                "source_id": source_id,
                "source_url": item.get("url", f"https://remoteok.com/remote-jobs/{item.get('slug', '')}"),
                "title": title,
                "company": company,
                "company_logo": item.get("company_logo", "") or item.get("logo", ""),
                "description": description,
                "description_plain": strip_html(description),
                "tags": tags,
                "category": categorize_project(title, tags, description),
                "project_type": "remote",
                "experience_level": detect_experience_level(title, description),
                "budget_min": budget_min if budget_min and budget_min > 0 else None,
                "budget_max": budget_max if budget_max and budget_max > 0 else None,
                "budget_currency": "USD",
                "budget_period": "yearly",
                "location": item.get("location", "Remote") or "Remote",
                "geo": None,
                "apply_url": item.get("apply_url", item.get("url", "")),
                "posted_at": posted_at,
            }
            
            # Skip non-English projects
            if not is_likely_english(title, description):
                continue

            trust_score, is_flagged, flag_reason = calculate_trust_score(project)
            project["trust_score"] = trust_score
            project["is_flagged"] = is_flagged
            project["flag_reason"] = flag_reason
            
            projects.append(project)
        
        logger.info(f"RemoteOK: scraped {len(projects)} English projects")
    except Exception as e:
        logger.error(f"RemoteOK scraping error: {e}")
    
    return projects


def scrape_jobicy() -> List[Dict[str, Any]]:
    """
    Scrape projects from Jobicy free API.
    API: https://jobicy.com/api/v2/remote-jobs
    Free tier, no API key needed, structured JSON response
    """
    projects = []
    try:
        logger.info("Scraping Jobicy...")
        headers = {
            "User-Agent": "MegiLance/1.0 (freelance platform aggregator)",
            "Accept": "application/json"
        }
        # Get 50 projects at a time
        resp = requests.get(
            "https://jobicy.com/api/v2/remote-jobs?count=50",
            headers=headers,
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        
        for item in data.get("jobs", []):
            title = item.get("jobTitle", "")
            company = item.get("companyName", "Unknown")
            description = item.get("jobDescription", "")
            excerpt = item.get("jobExcerpt", "")
            
            # Parse tags from industry
            industries = item.get("jobIndustry", [])
            tags = []
            if isinstance(industries, list):
                tags = [i.replace("&amp;", "&") for i in industries]
            
            # Posted date
            posted_at = None
            pub_date = item.get("pubDate", "")
            if pub_date:
                try:
                    posted_at = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                except Exception:
                    pass
            
            source_id = f"jobicy_{item.get('id', '')}"
            
            project = {
                "source": "jobicy",
                "source_id": source_id,
                "source_url": item.get("url", ""),
                "title": title,
                "company": company,
                "company_logo": item.get("companyLogo", ""),
                "description": description or excerpt,
                "description_plain": strip_html(description or excerpt),
                "tags": tags,
                "category": categorize_project(title, tags, description),
                "project_type": "remote",
                "experience_level": detect_experience_level(title, description),
                "budget_min": item.get("salaryMin"),
                "budget_max": item.get("salaryMax"),
                "budget_currency": item.get("salaryCurrency", "USD"),
                "budget_period": item.get("salaryPeriod", "yearly"),
                "location": item.get("jobGeo", "Remote") or "Remote",
                "geo": item.get("jobGeo"),
                "apply_url": item.get("url", ""),
                "posted_at": posted_at,
            }
            
            # Skip non-English projects
            if not is_likely_english(title, description):
                continue

            trust_score, is_flagged, flag_reason = calculate_trust_score(project)
            project["trust_score"] = trust_score
            project["is_flagged"] = is_flagged
            project["flag_reason"] = flag_reason
            
            projects.append(project)
        
        logger.info(f"Jobicy: scraped {len(projects)} English projects")
    except Exception as e:
        logger.error(f"Jobicy scraping error: {e}")
    
    return projects


def scrape_arbeitnow() -> List[Dict[str, Any]]:
    """
    Scrape projects from Arbeitnow free API.
    API: https://www.arbeitnow.com/api/job-board-api
    Free, no API key needed
    """
    projects = []
    try:
        logger.info("Scraping Arbeitnow...")
        headers = {
            "User-Agent": "MegiLance/1.0 (freelance platform aggregator)",
            "Accept": "application/json"
        }
        resp = requests.get(
            "https://www.arbeitnow.com/api/job-board-api",
            headers=headers,
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        
        for item in data.get("data", []):
            title = item.get("title", "")
            company = item.get("company_name", "Unknown")
            description = item.get("description", "")
            
            tags = item.get("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]
            
            posted_at = None
            created = item.get("created_at")
            if created:
                try:
                    posted_at = datetime.fromtimestamp(created, tz=timezone.utc)
                except Exception:
                    pass
            
            source_id = f"arbeitnow_{item.get('slug', hashlib.md5(title.encode()).hexdigest()[:10])}"
            
            project = {
                "source": "arbeitnow",
                "source_id": source_id,
                "source_url": item.get("url", ""),
                "title": title,
                "company": company,
                "company_logo": item.get("company_logo", ""),
                "description": description,
                "description_plain": strip_html(description),
                "tags": tags,
                "category": categorize_project(title, tags, description),
                "project_type": "remote" if item.get("remote", False) else "onsite",
                "experience_level": detect_experience_level(title, description),
                "budget_min": None,
                "budget_max": None,
                "budget_currency": "EUR",
                "budget_period": "fixed",
                "location": item.get("location", "Remote") or "Remote",
                "geo": None,
                "apply_url": item.get("url", ""),
                "posted_at": posted_at,
            }
            
            # Skip non-English projects (Arbeitnow returns many German listings)
            if not is_likely_english(title, description):
                continue

            trust_score, is_flagged, flag_reason = calculate_trust_score(project)
            project["trust_score"] = trust_score
            project["is_flagged"] = is_flagged
            project["flag_reason"] = flag_reason
            
            projects.append(project)
        
        logger.info(f"Arbeitnow: scraped {len(projects)} English projects")
    except Exception as e:
        logger.error(f"Arbeitnow scraping error: {e}")
    
    return projects


# ============================================================================
# MAIN SCRAPING ORCHESTRATOR
# ============================================================================

def scrape_all_sources() -> Dict[str, Any]:
    """
    Scrape all project sources and return combined results with stats.
    This is the main entry point called by the API endpoint.
    """
    all_projects = []
    errors = []
    sources_scraped = []
    
    # Scrape each source
    scrapers = [
        ("remoteok", scrape_remoteok),
        ("jobicy", scrape_jobicy),
        ("arbeitnow", scrape_arbeitnow),
    ]
    
    for source_name, scraper_fn in scrapers:
        try:
            projects = scraper_fn()
            all_projects.extend(projects)
            sources_scraped.append(source_name)
        except Exception as e:
            errors.append(f"{source_name}: {str(e)}")
            logger.error(f"Scraper {source_name} failed: {e}")
    
    # Filter out flagged projects (but keep them for admin review)
    verified_projects = [p for p in all_projects if not p.get("is_flagged", False)]
    flagged_projects = [p for p in all_projects if p.get("is_flagged", False)]
    
    return {
        "all_projects": all_projects,
        "verified_projects": verified_projects,
        "flagged_projects": flagged_projects,
        "stats": {
            "total_scraped": len(all_projects),
            "verified": len(verified_projects),
            "flagged": len(flagged_projects),
            "sources": sources_scraped,
            "errors": errors,
        }
    }


def save_projects_to_db(turso, projects: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Save scraped projects to Turso database using batch INSERT OR REPLACE
    for maximum performance (single HTTP request per batch of 25).
    Returns counts of inserted and updated projects.
    """
    saved = 0
    errors = 0
    batch_size = 25  # Turso HTTP API batch limit
    now = datetime.now(timezone.utc).isoformat()

    # Build all statements for batch execution
    statements = []
    for project in projects:
        try:
            tags_json = json.dumps(project.get("tags", []))
            posted_at = project.get("posted_at")
            if posted_at and isinstance(posted_at, datetime):
                posted_at = posted_at.isoformat()

            statements.append({
                "q": """INSERT OR REPLACE INTO external_projects (
                    source, source_id, source_url,
                    title, company, company_logo,
                    description, description_plain,
                    category, tags, project_type, experience_level,
                    budget_min, budget_max, budget_currency, budget_period,
                    location, geo, apply_url,
                    trust_score, is_verified, is_flagged, flag_reason,
                    posted_at, scraped_at,
                    views_count, clicks_count, saves_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                "params": [
                    project["source"], project["source_id"], project["source_url"],
                    project["title"], project["company"], project.get("company_logo"),
                    project["description"][:10000], project.get("description_plain", "")[:5000],
                    project["category"], tags_json, project["project_type"], project["experience_level"],
                    project.get("budget_min"), project.get("budget_max"),
                    project.get("budget_currency", "USD"), project.get("budget_period", "fixed"),
                    project["location"], project.get("geo"), project["apply_url"],
                    project.get("trust_score", 0.5), 0,
                    1 if project.get("is_flagged", False) else 0,
                    project.get("flag_reason"),
                    posted_at, now,
                    0, 0, 0
                ]
            })
        except Exception as e:
            logger.error(f"Error preparing project {project.get('source_id')}: {e}")
            errors += 1

    # Execute in batches
    for i in range(0, len(statements), batch_size):
        batch = statements[i:i + batch_size]
        try:
            turso.execute_many(batch)
            saved += len(batch)
            logger.info(f"Batch saved {len(batch)} projects ({i + len(batch)}/{len(statements)})")
        except Exception as e:
            logger.error(f"Batch save error at offset {i}: {e}")
            # Fallback: try one-by-one for this batch
            for stmt in batch:
                try:
                    turso.execute(stmt["q"], stmt["params"])
                    saved += 1
                except Exception as e2:
                    logger.error(f"Individual save error: {e2}")
                    errors += 1

    return {"inserted": saved, "updated": 0, "errors": errors}
