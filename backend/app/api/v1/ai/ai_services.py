"""
@AI-HINT: AI-powered services API endpoints - Turso HTTP only
Price estimation, freelancer matching, fraud detection
"""

import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

logger = logging.getLogger("megilance")

from app.core.security import get_current_user
from app.models.project import ProjectCategory
from app.services import ai_services_service
from app.services.llm_gateway import llm_gateway

router = APIRouter(tags=["AI Services"])  # Prefix is added in routers.py

# System prompt for the MegiLance chatbot
CHATBOT_SYSTEM_PROMPT = """You are the MegiLance AI Assistant, a helpful and professional customer support agent for MegiLance - an AI-powered freelancing platform.

Your capabilities:
- Answer questions about how MegiLance works
- Explain the freelancer hiring process
- Describe payment protection and escrow system
- Help users understand project posting, proposals, and contracts
- Provide guidance on platform features
- Be friendly, concise, and professional

Key MegiLance features you should know:
1. Escrow Protection: Funds are held securely until work is approved
2. Milestone-based Payments: Projects can be split into paid milestones
3. Smart Matching: AI recommends freelancers based on skills and project needs
4. Reviews & Ratings: Both clients and freelancers are rated
5. Secure Messaging: Built-in chat with file sharing
6. Contract Builder: Create professional contracts with templates

If asked about specific account issues, pricing, or technical problems, suggest contacting support@megilance.site or visiting the Help Center.

Keep responses concise (under 150 words) unless detailed explanation is needed."""

# ============ Chatbot Endpoint ============

@router.post("/chat")
async def ai_chatbot(
    message: str,
):
    """
    AI Chatbot endpoint - responds to user queries using LLM
    
    **No authentication required** - public chatbot
    """
    # Use LLM for intelligent responses
    try:
        response = await llm_gateway.generate_text(
            prompt=message,
            system_message=CHATBOT_SYSTEM_PROMPT,
            max_tokens=300,
            temperature=0.7
        )
        
        if response and not response.startswith("Error") and not response.startswith("AI service"):
            return {
                "response": response,
                "confidence": 0.9,
                "source": "llm"
            }
    except Exception as e:
        logger.warning(f"LLM chatbot failed: {e}")
    
    # Fallback to rule-based responses if LLM fails
    message_lower = message.lower()
    
    if "hello" in message_lower or "hi" in message_lower:
        return {
            "response": "Hello! I'm MegiLance AI assistant. How can I help you today?",
            "confidence": 0.95,
            "source": "rules"
        }
    elif "price" in message_lower or "cost" in message_lower:
        return {
            "response": "I can help you estimate project costs! Please use the /ai/estimate-price endpoint with your project details.",
            "confidence": 0.9,
            "source": "rules"
        }
    elif "freelancer" in message_lower:
        return {
            "response": "Looking for freelancers? I can match you with the best talent for your project. Try posting a project first!",
            "confidence": 0.85,
            "source": "rules"
        }
    elif "help" in message_lower:
        return {
            "response": "I can assist with: project price estimation, freelancer matching, and answering questions about MegiLance. What would you like to know?",
            "confidence": 0.9,
            "source": "rules"
        }
    else:
        return {
            "response": "Thanks for your message! I'm here to help with questions about MegiLance - hiring freelancers, posting projects, payments, and more. What would you like to know?",
            "confidence": 0.6,
            "source": "rules"
        }


# ============ Fraud Detection Endpoint ============

@router.post("/fraud-check")
async def fraud_detection(
    text: str,
):
    """
    AI Fraud Detection - analyzes text for potential fraud indicators.

    Uses pattern-based heuristics across multiple categories:
    urgency/pressure, payment red-flags, off-platform contact,
    personal-info harvesting, unrealistic offers, credential skipping,
    plus structural signals like ALL-CAPS ratio and exclamation density.

    **No authentication required** - can be used during project posting.
    """
    text_lower = text.lower()
    text_stripped = text.strip()
    word_count = len(text_stripped.split())

    score = 0
    warnings: list[dict] = []

    # ── Category 1: Urgency / pressure language ──
    urgency_patterns = [
        (r'\burgent\b', 'Uses urgency keyword "urgent"'),
        (r'\basap\b', 'Uses high-pressure abbreviation "ASAP"'),
        (r'\bimmediately\b', 'Demands immediate action'),
        (r'\bright now\b', 'Pressures for instant response'),
        (r'\bact now\b', 'Classic pressure phrase "act now"'),
        (r'\blimited time\b', 'Creates artificial scarcity'),
        (r'\bdon\'?t miss\b', 'FOMO-inducing language'),
        (r'\blast chance\b', 'Artificial deadline pressure'),
        (r'\bhurry\b', 'Rushing language detected'),
    ]
    urgency_hits = 0
    for pattern, desc in urgency_patterns:
        if re.search(pattern, text_lower):
            urgency_hits += 1
            warnings.append({"category": "urgency", "severity": "medium", "detail": desc})
    if urgency_hits:
        score += min(urgency_hits * 8, 20)

    # ── Category 2: Suspicious payment language ──
    payment_patterns = [
        (r'\bguaranteed?\b', 'Contains unrealistic payment guarantees'),
        (r'\b100\s*%\b', 'Claims absolute certainty'),
        (r'\beasy\s+money\b', 'Promises easy income'),
        (r'\bquick\s+money\b', 'Promises quick income'),
        (r'\brisk\s*free\b', 'Claims risk-free opportunity'),
        (r'\badvance\s+payment\b', 'Requests advance payment'),
        (r'\bupfront\s+fee\b', 'Requests upfront fees'),
        (r'\bprocessing\s+fee\b', 'Mentions suspicious processing fees'),
        (r'\bwire\s+money\b', 'Requests wire transfer'),
        (r'\bwestern\s+union\b', 'Mentions Western Union'),
        (r'\bmoneygram\b', 'Mentions MoneyGram'),
        (r'\bcryptocurrency.*send\b', 'Requests direct crypto payment'),
        (r'\bbitcoin.*send\b', 'Requests direct Bitcoin payment'),
    ]
    payment_hits = 0
    for pattern, desc in payment_patterns:
        if re.search(pattern, text_lower):
            payment_hits += 1
            warnings.append({"category": "payment", "severity": "high", "detail": desc})
    if payment_hits:
        score += min(payment_hits * 10, 30)

    # ── Category 3: Off-platform contact ──
    contact_patterns = [
        (r'\btelegram\b', 'Tries to move to Telegram'),
        (r'\bwhatsapp\b', 'Tries to move to WhatsApp'),
        (r'\bsignal\s+(?:app|me)\b', 'Tries to move to Signal'),
        (r'\bcontact\s+me\s+(?:at|on|via)\b', 'Requests off-platform contact'),
        (r'\bemail\s+me\s+(?:at|directly)\b', 'Requests direct email contact'),
        (r'\btext\s+me\b', 'Requests phone contact'),
        (r'\bcall\s+me\b', 'Requests phone call'),
        (r'@[\w]+\b(?!.*\.com)', 'Contains potential messaging handle'),
    ]
    contact_hits = 0
    for pattern, desc in contact_patterns:
        if re.search(pattern, text_lower):
            contact_hits += 1
            warnings.append({"category": "off_platform", "severity": "high", "detail": desc})
    if contact_hits:
        score += min(contact_hits * 12, 30)

    # ── Category 4: Personal / financial info harvesting ──
    info_patterns = [
        (r'\bbank\s+(?:details|account|info)\b', 'Requests bank information'),
        (r'\bssn\b|\bsocial\s+security\b', 'Requests Social Security Number'),
        (r'\bcredit\s+card\b', 'Requests credit card details'),
        (r'\bpassword\b', 'Mentions password sharing'),
        (r'\bidentity\s+(?:card|document)\b', 'Requests identity documents outside proper channels'),
        (r'\bsend\s+(?:your|me)\s+(?:id|passport)\b', 'Requests personal ID documents'),
    ]
    info_hits = 0
    for pattern, desc in info_patterns:
        if re.search(pattern, text_lower):
            info_hits += 1
            warnings.append({"category": "info_harvesting", "severity": "critical", "detail": desc})
    if info_hits:
        score += min(info_hits * 15, 35)

    # ── Category 5: Unrealistic offer signals ──
    if re.search(r'\$\d{5,}', text) and re.search(r'\bsimple\b|\beasy\b|\bquick\b', text_lower):
        score += 15
        warnings.append({"category": "unrealistic", "severity": "high", "detail": "Offers unusually high payment for described work"})

    # ── Category 6: No credentials needed ──
    if re.search(r'\bno\s+(?:portfolio|experience|skills?)\s+(?:needed|required)\b', text_lower):
        score += 10
        warnings.append({"category": "credentials", "severity": "medium", "detail": "No credentials required for professional work"})

    # ── Structural signals ──
    if word_count > 0:
        caps_words = sum(1 for w in text_stripped.split() if w.isupper() and len(w) > 1)
        caps_ratio = caps_words / word_count
        if caps_ratio > 0.3 and word_count > 5:
            score += 8
            warnings.append({"category": "style", "severity": "low", "detail": f"Excessive capitalisation ({int(caps_ratio*100)}% ALL-CAPS words)"})

    excl_count = text.count('!')
    if excl_count > 3:
        score += min(excl_count * 2, 10)
        warnings.append({"category": "style", "severity": "low", "detail": f"Excessive exclamation marks ({excl_count})"})

    # Cap at 100
    score = min(score, 100)

    # Determine risk level
    if score >= 70:
        risk_level = "Critical"
    elif score >= 45:
        risk_level = "High"
    elif score >= 20:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Confidence depends on text length – more words = more signal
    base_confidence = 70
    length_bonus = min(word_count, 150) / 150 * 25  # up to +25 for longer text
    confidence = round(base_confidence + length_bonus)

    return {
        "score": score,
        "risk_level": risk_level,
        "warnings": warnings,
        "confidence": confidence,
        "flags": [w["detail"] for w in warnings],
        "message": f"{len(warnings)} potential issue(s) detected" if warnings else "No obvious fraud indicators",
        # Legacy fields kept for backwards compat
        "risk_score": score,
    }


@router.get("/match-freelancers/{project_id}")
async def match_freelancers_to_project(
    project_id: int,
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered freelancer matches for a project
    
    - **project_id**: ID of the project
    - **limit**: Maximum number of matches to return
    """
    try:
        project = ai_services_service.get_project_with_skills(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        required_skills = project["required_skills"]
        freelancers = ai_services_service.get_active_freelancers(limit * 3)

        matches = []
        for fl in freelancers:
            freelancer_skills = fl["skills"]
            if isinstance(freelancer_skills, list) and isinstance(required_skills, list):
                matching_skills = set([s.lower() for s in freelancer_skills]) & set([s.lower() for s in required_skills])
                score = len(matching_skills) / max(len(required_skills), 1)
            else:
                matching_skills = set()
                score = 0.5

            matches.append({
                "freelancer_id": fl["freelancer_id"],
                "name": fl["name"],
                "skills": freelancer_skills,
                "hourly_rate": fl["hourly_rate"],
                "rating": fl["rating"],
                "profile_image": fl["profile_image"],
                "bio": fl["bio"],
                "completed_projects": fl["completed_projects"],
                "match_score": round(score * 100, 2),
                "match_reason": f"Matched {len(matching_skills)} skills"
            })

        matches.sort(key=lambda x: x["match_score"], reverse=True)
        matches = matches[:limit]

        return {
            "project_id": project_id,
            "matches": matches,
            "total_matches": len(matches)
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error matching freelancers to project", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


@router.post("/estimate-price")
async def estimate_project_price(
    category: ProjectCategory,
    skills_required: List[str],
    description: str = "",
    estimated_hours: Optional[int] = None,
    complexity: str = "moderate",
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered price estimation for a project
    
    - **category**: Project category
    - **skills_required**: List of required skills
    - **description**: Project description
    - **estimated_hours**: Estimated hours (optional)
    - **complexity**: simple, moderate, complex, or expert
    """
    try:
        # Base rates by complexity
        complexity_multipliers = {
            "simple": 0.7,
            "moderate": 1.0,
            "complex": 1.4,
            "expert": 2.0
        }
        multiplier = complexity_multipliers.get(complexity.lower(), 1.0)
        
        category_value = category.value if hasattr(category, 'value') else str(category)
        avg_budget = ai_services_service.get_category_avg_budget(category_value)

        skills_pattern = "%".join(skills_required[:3]) if skills_required else "%"
        avg_hourly = ai_services_service.get_skills_avg_hourly_rate(skills_pattern)
        
        # Calculate estimates
        hours = estimated_hours or 40
        hourly_estimate = avg_hourly * multiplier
        total_estimate = hourly_estimate * hours
        
        # Adjust based on category average
        if avg_budget > 0:
            total_estimate = (total_estimate + avg_budget) / 2
        
        return {
            "estimated_hourly_rate": round(hourly_estimate, 2),
            "estimated_total": round(total_estimate, 2),
            "estimated_hours": hours,
            "low_estimate": round(total_estimate * 0.7, 2),
            "high_estimate": round(total_estimate * 1.4, 2),
            "complexity": complexity,
            "category": category.value if hasattr(category, 'value') else str(category),
            "confidence": 0.75,
            "factors": [
                f"Based on {len(skills_required)} required skills",
                f"Complexity: {complexity}",
                f"Category average: ${avg_budget:.2f}"
            ]
        }
    except Exception:
        logger.error("Error estimating price", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


@router.get("/estimate-freelancer-rate/{freelancer_id}")
async def estimate_freelancer_hourly_rate(
    freelancer_id: int,
    years_experience: Optional[int] = None,
    skills: Optional[List[str]] = None,
    completed_projects: Optional[int] = None,
    average_rating: Optional[float] = None,
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered rate estimation for a freelancer
    
    - **freelancer_id**: ID of the freelancer
    - **years_experience**: Years of professional experience
    - **skills**: List of skills
    - **completed_projects**: Number of completed projects
    - **average_rating**: Average client rating
    """
    try:
        fl = ai_services_service.get_freelancer_for_rate_estimation(freelancer_id)
        if not fl:
            raise HTTPException(status_code=404, detail="Freelancer not found")

        current_rate = fl["current_rate"]
        actual_rating = average_rating or fl["rating"] or 0
        actual_completed = completed_projects or fl["completed_projects"] or 0
        actual_experience = years_experience or fl["years_experience"] or 0
        
        # Base rate calculation
        base_rate = 25  # Minimum rate
        
        # Experience factor (+$5 per year, max +$50)
        experience_bonus = min(actual_experience * 5, 50)
        
        # Project completion bonus (+$2 per 10 projects, max +$30)
        project_bonus = min((actual_completed // 10) * 2, 30)
        
        # Rating bonus (+$10 for each star above 3)
        rating_bonus = max(0, (actual_rating - 3) * 10)
        
        estimated_rate = base_rate + experience_bonus + project_bonus + rating_bonus
        
        return {
            "freelancer_id": freelancer_id,
            "current_rate": current_rate,
            "estimated_rate": round(estimated_rate, 2),
            "low_estimate": round(estimated_rate * 0.8, 2),
            "high_estimate": round(estimated_rate * 1.3, 2),
            "factors": {
                "base_rate": base_rate,
                "experience_bonus": experience_bonus,
                "project_bonus": project_bonus,
                "rating_bonus": rating_bonus
            },
            "confidence": 0.7
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error estimating freelancer rate", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


@router.get("/fraud-check/user/{user_id}")
async def check_user_fraud_risk(
    user_id: int,
    current_user = Depends(get_current_user)
):
    """
    Analyze user for fraudulent behavior
    
    - **user_id**: ID of the user to analyze
    
    Requires admin privileges or own user
    """
    user_type = current_user.user_type.lower() if current_user.user_type else ""
    is_admin = user_type == "admin" or current_user.role.lower() == "admin"
    
    # Only allow admins or self
    if current_user.id != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check this user"
        )
    
    try:
        user_data = ai_services_service.get_user_for_fraud_check(user_id)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        email = user_data["email"]
        bio = user_data["bio"]
        is_verified = user_data["is_verified"]

        risk_factors = []
        risk_score = 0

        # Check for suspicious email domains
        suspicious_domains = ["tempmail", "guerrilla", "10minute", "throwaway"]
        for domain in suspicious_domains:
            if domain in email.lower():
                risk_factors.append("Suspicious email domain")
                risk_score += 30
                break

        # Check if unverified
        if not is_verified:
            risk_factors.append("Unverified account")
            risk_score += 20

        # Check bio for fraud keywords
        fraud_keywords = ["guaranteed", "risk free", "wire transfer", "western union"]
        for keyword in fraud_keywords:
            if keyword.lower() in bio.lower():
                risk_factors.append(f"Suspicious term in bio: {keyword}")
                risk_score += 15

        # Check complaint history
        complaints = ai_services_service.get_urgent_ticket_count(user_id)
        if complaints > 3:
            risk_factors.append(f"High complaint count: {complaints}")
            risk_score += complaints * 5
        
        risk_score = min(risk_score, 100)
        
        return {
            "user_id": user_id,
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
            "risk_factors": risk_factors,
            "recommendation": "Review account" if risk_score > 60 else "Monitor" if risk_score > 30 else "No action needed"
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error analyzing user for fraud risk", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


@router.get("/fraud-check/project/{project_id}")
async def check_project_fraud_risk(
    project_id: int,
    current_user = Depends(get_current_user)
):
    """
    Analyze project for fraudulent characteristics
    
    - **project_id**: ID of the project to analyze
    """
    try:
        proj = ai_services_service.get_project_for_fraud_check(project_id)
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        title = proj["title"]
        description = proj["description"]
        budget = proj["budget"]

        risk_factors = []
        risk_score = 0

        # Check for fraud keywords in title/description
        fraud_keywords = ["guaranteed income", "easy money", "wire transfer",
                         "western union", "personal information", "advance payment"]

        text_to_check = f"{title} {description}".lower()
        for keyword in fraud_keywords:
            if keyword in text_to_check:
                risk_factors.append(f"Suspicious term: {keyword}")
                risk_score += 20

        # Unusually high or low budget
        if budget and (budget > 100000 or budget < 5):
            risk_factors.append(f"Unusual budget: ${budget}")
            risk_score += 15

        # Check for contact info in description
        if re.search(r'\b[\w.-]+@[\w.-]+\.\w+\b', description):
            risk_factors.append("Email address in description")
            risk_score += 25
        if re.search(r'\b\d{10,}\b', description):
            risk_factors.append("Possible phone number in description")
            risk_score += 20
        
        risk_score = min(risk_score, 100)
        
        return {
            "project_id": project_id,
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
            "risk_factors": risk_factors,
            "recommendation": "Manual review required" if risk_score > 60 else "Monitor" if risk_score > 30 else "Approved"
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error analyzing project for fraud risk", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


@router.get("/fraud-check/proposal/{proposal_id}")
async def check_proposal_fraud_risk(
    proposal_id: int,
    current_user = Depends(get_current_user)
):
    """
    Analyze proposal for suspicious activity
    
    - **proposal_id**: ID of the proposal to analyze
    """
    try:
        prop = ai_services_service.get_proposal_for_fraud_check(proposal_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Proposal not found")

        cover_letter = prop["cover_letter"]
        bid_amount = prop["bid_amount"]

        risk_factors = []
        risk_score = 0

        # Check for fraud keywords
        fraud_keywords = ["guaranteed", "outside platform", "direct payment",
                         "personal email", "whatsapp", "telegram"]

        for keyword in fraud_keywords:
            if keyword.lower() in cover_letter.lower():
                risk_factors.append(f"Suspicious term: {keyword}")
                risk_score += 20

        # Check for contact info
        if re.search(r'\b[\w.-]+@[\w.-]+\.\w+\b', cover_letter):
            risk_factors.append("Email address in cover letter")
            risk_score += 30
        if re.search(r'\b\d{10,}\b', cover_letter):
            risk_factors.append("Possible phone number in cover letter")
            risk_score += 25
        
        # Very low bid (possible bait)
        if bid_amount and bid_amount < 10:
            risk_factors.append(f"Very low bid: ${bid_amount}")
            risk_score += 15
        
        # Very short cover letter
        if len(cover_letter) < 50:
            risk_factors.append("Very short cover letter")
            risk_score += 10
        
        risk_score = min(risk_score, 100)
        
        return {
            "proposal_id": proposal_id,
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
            "risk_factors": risk_factors,
            "recommendation": "Reject" if risk_score > 60 else "Review" if risk_score > 30 else "Approved"
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error analyzing proposal for fraud risk", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


# ============ Skill Extraction Endpoint ============

@router.post("/extract-skills")
async def extract_skills_from_text(
    text: str,
    current_user = Depends(get_current_user)
):
    """
    AI Skill Extraction - extracts skills from project description or profile text
    
    - **text**: Text to analyze for skills
    """
    # Common skill keywords organized by category
    skill_categories = {
        "programming": ["python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "rust", "php", "swift", "kotlin"],
        "web_development": ["html", "css", "react", "vue", "angular", "node.js", "express", "django", "flask", "fastapi", "nextjs", "gatsby"],
        "mobile": ["ios", "android", "flutter", "react native", "swift", "kotlin", "xamarin"],
        "database": ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "sqlite", "oracle"],
        "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "devops"],
        "data_science": ["machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "data analysis", "nlp", "computer vision"],
        "design": ["figma", "sketch", "adobe xd", "photoshop", "illustrator", "ui/ux", "wireframing", "prototyping"],
        "soft_skills": ["communication", "leadership", "project management", "agile", "scrum", "team collaboration"]
    }
    
    text_lower = text.lower()
    extracted_skills = []
    skill_details = []
    
    for category, skills in skill_categories.items():
        for skill in skills:
            if skill in text_lower:
                extracted_skills.append(skill)
                skill_details.append({
                    "skill": skill,
                    "category": category.replace("_", " ").title(),
                    "confidence": 0.9 if skill.lower() in text_lower.split() else 0.7
                })
    
    # Remove duplicates while preserving order
    seen = set()
    unique_skills = []
    unique_details = []
    for skill, detail in zip(extracted_skills, skill_details):
        if skill not in seen:
            seen.add(skill)
            unique_skills.append(skill)
            unique_details.append(detail)
    
    return {
        "skills": unique_skills,
        "details": unique_details,
        "total_found": len(unique_skills),
        "text_length": len(text)
    }


# ============ Proposal Generation Endpoint ============

@router.post("/generate-proposal")
async def generate_proposal(
    project_title: str,
    project_description: str,
    freelancer_name: str = "Professional",
    years_experience: int = 3,
    current_user = Depends(get_current_user)
):
    """
    AI Proposal Generator - generates professional cover letter for a project
    
    - **project_title**: Title of the project
    - **project_description**: Description of the project requirements
    - **freelancer_name**: Name of the freelancer
    - **years_experience**: Years of relevant experience
    """
    # Detect key project aspects for personalization
    desc_lower = project_description.lower()
    
    # Detect project type
    if "web" in desc_lower or "website" in desc_lower:
        project_type = "web development"
        expertise = "building responsive, user-friendly web applications"
    elif "mobile" in desc_lower or "app" in desc_lower:
        project_type = "mobile application"
        expertise = "developing intuitive mobile experiences"
    elif "data" in desc_lower or "analytics" in desc_lower:
        project_type = "data analytics"
        expertise = "transforming data into actionable insights"
    elif "design" in desc_lower or "ui" in desc_lower:
        project_type = "design"
        expertise = "creating visually polished and functional designs"
    else:
        project_type = "software development"
        expertise = "delivering high-quality technical solutions"
    
    # Generate proposal
    proposal = f"""Dear Hiring Manager,

I am writing to express my strong interest in the "{project_title}" project. After carefully reviewing your requirements, I am confident that my {years_experience}+ years of experience in {project_type} make me an excellent fit for this opportunity.

Your project particularly caught my attention because it aligns with my passion for {expertise}. I have successfully completed similar projects in the past, consistently delivering results that exceed client expectations.

Here's what I bring to the table:

• Proven expertise in {project_type} with a track record of on-time delivery
• Strong communication skills ensuring you're always updated on progress
• Attention to detail and commitment to quality in every aspect
• Flexibility to adapt to your specific requirements and feedback

I would love the opportunity to discuss how I can contribute to the success of this project. I am available to start immediately and can adjust my schedule to meet your timeline.

Looking forward to collaborating with you!

Best regards,
{freelancer_name}"""

    return {
        "proposal": proposal,
        "word_count": len(proposal.split()),
        "project_type_detected": project_type,
        "personalization_level": "high" if len(project_description) > 100 else "medium"
    }


# ============ Sentiment Analysis Endpoint ============

@router.post("/analyze-sentiment")
async def analyze_sentiment(
    text: str,
):
    """
    AI Sentiment Analysis - analyzes text sentiment for reviews and feedback
    
    **No authentication required** - can be used for review analysis
    """
    positive_words = ['excellent', 'great', 'good', 'amazing', 'awesome', 'wonderful', 
                     'fantastic', 'love', 'best', 'perfect', 'outstanding', 'brilliant',
                     'satisfied', 'happy', 'pleased', 'impressed', 'recommend', 'professional',
                     'quality', 'helpful', 'responsive', 'talented', 'skilled', 'efficient']
    negative_words = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'hate',
                     'disappointed', 'unsatisfied', 'unprofessional', 'late', 'never',
                     'waste', 'refund', 'scam', 'avoid', 'slow', 'rude', 'incomplete',
                     'missing', 'wrong', 'fail', 'failed', 'problem', 'issue']
    
    text_lower = text.lower()
    
    positive_matches = [word for word in positive_words if word in text_lower]
    negative_matches = [word for word in negative_words if word in text_lower]
    
    positive_count = len(positive_matches)
    negative_count = len(negative_matches)
    
    if positive_count > negative_count:
        sentiment = "POSITIVE"
        score = min(0.95, 0.6 + (positive_count * 0.08))
    elif negative_count > positive_count:
        sentiment = "NEGATIVE"
        score = min(0.95, 0.6 + (negative_count * 0.08))
    else:
        sentiment = "NEUTRAL"
        score = 0.5
    
    return {
        "sentiment": sentiment,
        "score": round(score, 2),
        "confidence": "high" if abs(positive_count - negative_count) > 2 else "medium" if positive_count + negative_count > 0 else "low",
        "positive_indicators": positive_matches[:5],
        "negative_indicators": negative_matches[:5]
    }


# ============ Profile Optimization Endpoint ============

@router.get("/profile-suggestions/{user_id}")
async def get_profile_optimization_suggestions(
    user_id: int,
    current_user = Depends(get_current_user)
):
    """
    AI Profile Optimizer - provides suggestions to improve freelancer profile
    
    - **user_id**: ID of the user to analyze
    """
    # Only allow self or admin
    user_type = current_user.user_type.lower() if current_user.user_type else ""
    is_admin = user_type == "admin" or current_user.role.lower() == "admin"
    
    if current_user.id != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this profile"
        )
    
    try:
        profile = ai_services_service.get_user_profile_for_suggestions(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User not found")

        bio = profile["bio"]
        skills_str = profile["skills_str"]
        hourly_rate = profile["hourly_rate"]
        portfolio_url = profile["portfolio_url"]
        profile_image = profile["profile_image"]

        suggestions = []
        profile_score = 100

        # Check bio
        if not bio:
            suggestions.append({
                "area": "Bio",
                "priority": "high",
                "suggestion": "Add a professional bio describing your expertise and experience",
                "impact": "+15 profile visibility"
            })
            profile_score -= 15
        elif len(bio) < 100:
            suggestions.append({
                "area": "Bio",
                "priority": "medium",
                "suggestion": "Expand your bio to at least 150 words for better engagement",
                "impact": "+10 profile visibility"
            })
            profile_score -= 10

        # Check skills
        try:
            skills = json.loads(skills_str) if skills_str else []
        except Exception:
            skills = skills_str.split(",") if skills_str else []
        
        if len(skills) < 3:
            suggestions.append({
                "area": "Skills",
                "priority": "high",
                "suggestion": "Add at least 5 relevant skills to improve job matching",
                "impact": "+20 match accuracy"
            })
            profile_score -= 20
        elif len(skills) < 5:
            suggestions.append({
                "area": "Skills",
                "priority": "medium",
                "suggestion": "Consider adding more skills to broaden your opportunities",
                "impact": "+10 match accuracy"
            })
            profile_score -= 10
        
        # Check hourly rate
        if not hourly_rate:
            suggestions.append({
                "area": "Hourly Rate",
                "priority": "high",
                "suggestion": "Set your hourly rate to appear in project searches",
                "impact": "+15 search visibility"
            })
            profile_score -= 15
        
        # Check portfolio
        if not portfolio_url:
            suggestions.append({
                "area": "Portfolio",
                "priority": "medium",
                "suggestion": "Add a portfolio link to showcase your work",
                "impact": "+10 client trust"
            })
            profile_score -= 10
        
        # Check profile image
        if not profile_image:
            suggestions.append({
                "area": "Profile Image",
                "priority": "high",
                "suggestion": "Upload a professional profile photo",
                "impact": "+15 client engagement"
            })
            profile_score -= 15
        
        return {
            "user_id": user_id,
            "profile_score": max(0, profile_score),
            "suggestions": suggestions,
            "suggestion_count": len(suggestions),
            "next_steps": suggestions[0]["suggestion"] if suggestions else "Your profile looks great!"
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error analyzing profile for optimization suggestions", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


# ============ Job Recommendation Endpoint ============

@router.get("/recommend-jobs/{user_id}")
async def recommend_jobs_for_user(
    user_id: int,
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """
    AI Job Recommender - recommends suitable projects based on user skills
    
    - **user_id**: ID of the freelancer
    - **limit**: Maximum number of recommendations
    """
    # Only allow self or admin
    user_type = current_user.user_type.lower() if current_user.user_type else ""
    is_admin = user_type == "admin" or current_user.role.lower() == "admin"
    
    if current_user.id != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    try:
        user_data = ai_services_service.get_user_skills_and_rate(user_id)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        user_skills = user_data["skills"]
        user_skills_lower = [s.lower().strip() for s in user_skills if s]

        projects = ai_services_service.get_open_projects(limit * 3)

        recommendations = []
        for proj in projects:
            proj_skills = proj["skills"]
            proj_skills_lower = [s.lower().strip() for s in proj_skills if s]

            matching_skills = set(user_skills_lower) & set(proj_skills_lower)
            match_score = len(matching_skills) / max(len(proj_skills_lower), 1) * 100

            if match_score > 0:
                recommendations.append({
                    "project_id": proj["project_id"],
                    "title": proj["title"],
                    "category": proj["category"],
                    "budget_range": f"${proj['budget_min']}-${proj['budget_max']}",
                    "matching_skills": list(matching_skills),
                    "match_score": round(match_score, 1),
                    "match_reason": f"Matched {len(matching_skills)} of {len(proj_skills_lower)} required skills"
                })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        recommendations = recommendations[:limit]
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations),
            "user_skills": user_skills[:10]
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Error recommending jobs for user", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again."
        )


# ============ Project Categorization Endpoint ============

@router.post("/categorize-project")
async def categorize_project(
    title: str,
    description: str,
    current_user = Depends(get_current_user)
):
    """
    AI Project Categorization - automatically categorizes projects based on title and description
    
    - **title**: Project title
    - **description**: Project description
    
    Returns the most likely category and confidence scores for all categories
    """
    # Category keywords mapping
    category_keywords = {
        "web_development": ["website", "web app", "frontend", "backend", "fullstack", "html", "css", "javascript", 
                           "react", "vue", "angular", "node", "django", "flask", "php", "laravel", "wordpress"],
        "mobile_development": ["mobile app", "ios", "android", "flutter", "react native", "swift", "kotlin", 
                              "mobile", "smartphone", "tablet", "app development"],
        "design": ["logo", "ui", "ux", "graphic design", "branding", "photoshop", "illustrator", "figma", 
                  "sketch", "wireframe", "mockup", "prototype", "visual design"],
        "data_science": ["machine learning", "data analysis", "ai", "deep learning", "nlp", "computer vision",
                        "tensorflow", "pytorch", "pandas", "numpy", "data mining", "predictive model"],
        "writing": ["content writing", "blog", "article", "copywriting", "technical writing", "seo content",
                   "ghostwriting", "editing", "proofreading", "creative writing"],
        "marketing": ["seo", "social media", "digital marketing", "email campaign", "ppc", "google ads",
                     "facebook ads", "marketing strategy", "brand awareness", "lead generation"],
        "video_audio": ["video editing", "animation", "motion graphics", "sound design", "music production",
                       "voiceover", "podcast", "youtube", "after effects", "premiere pro"],
        "blockchain": ["smart contract", "web3", "cryptocurrency", "nft", "defi", "ethereum", "solidity",
                      "blockchain", "crypto", "decentralized"],
        "game_development": ["game", "unity", "unreal engine", "3d modeling", "game design", "gaming",
                            "multiplayer", "mobile game", "pc game"],
        "devops": ["devops", "ci/cd", "docker", "kubernetes", "aws", "azure", "gcp", "cloud deployment",
                  "infrastructure", "monitoring", "automation"]
    }
    
    # Combine title and description for analysis
    text = f"{title} {description}".lower()
    
    # Calculate scores for each category
    category_scores = {}
    for category, keywords in category_keywords.items():
        matches = sum(1 for keyword in keywords if keyword in text)
        # Normalize score based on keyword matches
        score = min(1.0, matches / 3)  # Cap at 1.0, full confidence after 3+ keyword matches
        category_scores[category] = round(score, 3)
    
    # Find best category
    best_category = max(category_scores, key=category_scores.get)
    best_score = category_scores[best_category]
    
    # If no strong match, default to "other"
    if best_score < 0.3:
        best_category = "other"
        best_score = 0.5
    
    return {
        "category": best_category,
        "confidence": best_score,
        "all_scores": category_scores,
        "title": title,
        "analysis_quality": "high" if len(description) > 50 else "medium"
    }

