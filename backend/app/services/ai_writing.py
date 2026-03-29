# @AI-HINT: AI writing assistant for proposals and descriptions
"""AI Writing Assistant Service - AI-powered content generation and enhancement."""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid
import json
import logging
import re
from collections import Counter
from app.services.llm_gateway import llm_gateway

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class WritingContentType(str, Enum):
    PROPOSAL = "proposal"
    PROJECT_DESCRIPTION = "project_description"
    PROFILE_BIO = "profile_bio"
    MESSAGE = "message"
    PORTFOLIO_DESCRIPTION = "portfolio_description"
    REVIEW_RESPONSE = "review_response"
    CONTRACT_CLAUSE = "contract_clause"


class ToneStyle(str, Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    FORMAL = "formal"
    CASUAL = "casual"
    PERSUASIVE = "persuasive"
    CONFIDENT = "confident"


class AIWritingService:
    """Service for AI-powered writing assistance."""
    
    def __init__(self):
        self._tables_ready = False
    
    async def _ensure_tables(self):
        if self._tables_ready:
            return
        execute_query("""
            CREATE TABLE IF NOT EXISTS ai_writing_history (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                content_type TEXT NOT NULL,
                tone TEXT,
                intent TEXT,
                word_count INTEGER DEFAULT 0,
                content TEXT,
                metadata TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """, [])
        execute_query("""
            CREATE TABLE IF NOT EXISTS ai_writing_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                content_type TEXT NOT NULL,
                structure TEXT,
                variables TEXT,
                template_body TEXT,
                is_builtin INTEGER DEFAULT 0,
                created_by INTEGER,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """, [])
        self._tables_ready = True
    
    async def _log_generation(self, gen_id: str, user_id: int, content_type: str,
                               tone: str, word_count: int, content: str,
                               metadata: Optional[Dict] = None):
        """Log a content generation to history."""
        execute_query(
            """INSERT INTO ai_writing_history (id, user_id, content_type, tone, word_count, content, metadata, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [gen_id, user_id, content_type, tone, word_count, content,
             json.dumps(metadata or {}), datetime.now(timezone.utc).isoformat()]
        )
    
    # Content Generation
    async def generate_proposal(
        self,
        user_id: int,
        project_title: str,
        project_description: str,
        user_skills: List[str],
        user_experience: Optional[str] = None,
        tone: ToneStyle = ToneStyle.PROFESSIONAL,
        highlight_points: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate a proposal for a project using LLM."""
        await self._ensure_tables()
        
        prompt = f"""Write a professional freelancer proposal for a project titled '{project_title}'.

Project Description:
{project_description}

My Skills: {', '.join(user_skills)}
My Experience: {user_experience or 'Experienced professional.'}

Please make the tone {tone.value}."""
        if highlight_points:
            prompt += f"""\nMake sure to highlight these points: {', '.join(highlight_points)}"""
            
        generated_content = await llm_gateway.generate_text(prompt, system_message="You are an expert freelancer writing a high-converting proposal.")
        
        if not generated_content or len(generated_content) < 20:
             # Fallback
             generated_content = f"""Dear Client,\n\nI am excited to submit my proposal for '{project_title}'..."""
             
        word_count = len(generated_content.split())
        
        # Log the generation
        await self._log_generation(
            user_id,
            WritingContentType.PROPOSAL,
            prompt,
            generated_content,
            {"tone": tone.value}
        )
        
        return {
            "content": generated_content,
            "word_count": word_count,
            "tone": tone.value,
            "suggestions": ["Consider adding a question to engage the client at the end."]
        }
    
    async def generate_project_description(
        self,
        user_id: int,
        project_type: str,
        key_features: List[str],
        target_audience: Optional[str] = None,
        budget_range: Optional[str] = None,
        tone: ToneStyle = ToneStyle.PROFESSIONAL
    ) -> Dict[str, Any]:
        """Generate a project description using LLM."""
        await self._ensure_tables()
        
        prompt = f"""Write a detailed project description based on these requirements: {requirements}

Project Category: {category}
Desired Tone: {tone.value}"""
        generated_content = await llm_gateway.generate_text(prompt, system_message="You are an expert project manager writing clear, comprehensive project descriptions.")
        
        if not generated_content:
            generated_content = f"Project Requirements: {requirements}"
            
        word_count = len(generated_content.split())
        
        await self._log_generation(user_id, WritingContentType.PROJECT_DESCRIPTION, prompt, generated_content, {"category": category})
        
        return {
            "content": generated_content,
            "word_count": word_count,
            "formatting_suggestions": ["Use bullet points for deliverables"]
        }
    
    async def generate_profile_bio(
        self,
        user_id: int,
        skills: List[str],
        experience_years: int,
        specialization: str,
        achievements: Optional[List[str]] = None,
        tone: ToneStyle = ToneStyle.PROFESSIONAL
    ) -> Dict[str, Any]:
        """Generate a profile bio."""
        await self._ensure_tables()
        
        bio = f"""I'm a passionate {specialization} with {experience_years}+ years of experience crafting exceptional solutions for clients worldwide.

**Expertise:**
{', '.join(skills[:5])}

**What Sets Me Apart:**

✓ Proven track record with {experience_years * 10}+ successful projects
✓ Clear communication and timely delivery
✓ Client satisfaction is my top priority
✓ Always staying updated with the latest trends

{f"**Key Achievements:**{chr(10)}{chr(10).join(f'• {a}' for a in achievements)}" if achievements else ""}

Let's collaborate and bring your vision to life! I'm available for both short-term and long-term projects."""
        
        gen_id = str(uuid.uuid4())
        word_count = len(bio.split())
        
        suggestions = []
        if not achievements:
            suggestions.append("Add specific achievements to strengthen your profile")
        if len(skills) < 5:
            suggestions.append("List more skills to appear in more search results")
        if experience_years < 2:
            suggestions.append("Emphasize projects completed rather than years of experience")
        suggestions.append("Add specific metrics from past projects")
        suggestions.append("Include certifications if you have any")
        
        await self._log_generation(gen_id, user_id, WritingContentType.PROFILE_BIO.value,
                                    tone.value, word_count, bio,
                                    {"specialization": specialization, "experience_years": experience_years})
        
        return {
            "id": gen_id,
            "content_type": WritingContentType.PROFILE_BIO.value,
            "content": bio,
            "tone": tone.value,
            "word_count": word_count,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "suggestions": suggestions
        }
    
    async def generate_message(
        self,
        user_id: int,
        context: str,
        intent: str,
        recipient_name: Optional[str] = None,
        tone: ToneStyle = ToneStyle.FRIENDLY
    ) -> Dict[str, Any]:
        """Generate a professional message."""
        await self._ensure_tables()
        
        name_greeting = f' {recipient_name}' if recipient_name else ''
        
        messages = {
            "inquiry": f"""Hi{name_greeting},

I came across your project and I'm very interested in learning more about it. {context}

Could you please share more details about:
1. The specific requirements
2. Your expected timeline
3. Any preferences for collaboration

Looking forward to hearing from you!

Best regards""",
            "follow_up": f"""Hi{name_greeting},

I wanted to follow up on our previous conversation about {context}.

Have you had a chance to review the details we discussed? I'm eager to move forward and would be happy to address any questions or concerns you might have.

Please let me know how you'd like to proceed.

Best regards""",
            "introduction": f"""Hi{name_greeting},

I'm reaching out to introduce myself. {context}

I believe my skills and experience would be a great fit for your needs. I'd love the opportunity to discuss how I can help you achieve your goals.

Would you be available for a brief chat this week?

Best regards""",
            "negotiation": f"""Hi{name_greeting},

Thank you for considering me for this opportunity. {context}

After reviewing the project scope, I'd like to discuss the terms to ensure we're aligned on expectations. I'm confident we can find an arrangement that works well for both of us.

Looking forward to your thoughts.

Best regards"""
        }
        
        message = messages.get(intent, messages["inquiry"])
        gen_id = str(uuid.uuid4())
        
        await self._log_generation(gen_id, user_id, WritingContentType.MESSAGE.value,
                                    tone.value, len(message.split()), message,
                                    {"intent": intent, "recipient": recipient_name})
        
        return {
            "id": gen_id,
            "content_type": WritingContentType.MESSAGE.value,
            "content": message,
            "intent": intent,
            "tone": tone.value,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def generate_upsell_suggestions(
        self,
        user_id: int,
        project_description: str,
        proposal_content: str
    ) -> Dict[str, Any]:
        """Generate upsell suggestions based on project context."""
        await self._ensure_tables()
        
        desc_lower = project_description.lower() + " " + proposal_content.lower()
        suggestions = []
        
        # Analyze project context to produce relevant upsells
        if any(kw in desc_lower for kw in ["website", "web app", "frontend", "landing page", "ui", "ux"]):
            suggestions.append({
                "title": "SEO Optimization Package",
                "description": "Add on-page SEO, meta tags, sitemap, and schema markup to improve search rankings.",
                "type": "milestone",
                "relevance": "high"
            })
            suggestions.append({
                "title": "Performance Optimization",
                "description": "Lighthouse audit, lazy loading, image optimization, and caching strategy.",
                "type": "milestone",
                "relevance": "high"
            })
        
        if any(kw in desc_lower for kw in ["mobile", "app", "ios", "android", "react native", "flutter"]):
            suggestions.append({
                "title": "App Store Submission",
                "description": "Handle the full app store submission process including screenshots and descriptions.",
                "type": "milestone",
                "relevance": "high"
            })
            suggestions.append({
                "title": "Push Notification Setup",
                "description": "Integrate push notifications with FCM/APNs for user engagement.",
                "type": "milestone",
                "relevance": "medium"
            })
        
        if any(kw in desc_lower for kw in ["backend", "api", "database", "server", "microservice"]):
            suggestions.append({
                "title": "API Documentation",
                "description": "Comprehensive Swagger/OpenAPI documentation for all endpoints.",
                "type": "milestone",
                "relevance": "medium"
            })
            suggestions.append({
                "title": "Load Testing & Scaling Plan",
                "description": "Stress test the system and provide a scaling roadmap.",
                "type": "milestone",
                "relevance": "medium"
            })
        
        if any(kw in desc_lower for kw in ["design", "brand", "logo", "graphic", "illustration"]):
            suggestions.append({
                "title": "Brand Guidelines Document",
                "description": "Deliver a complete brand style guide with colors, typography, and usage rules.",
                "type": "milestone",
                "relevance": "high"
            })
        
        # Universal upsells
        suggestions.append({
            "title": "Monthly Maintenance & Support",
            "description": "Ongoing bug fixes, updates, and priority support for a fixed monthly fee.",
            "type": "retainer",
            "relevance": "medium"
        })
        suggestions.append({
            "title": "Training & Documentation",
            "description": "Comprehensive documentation and video walkthroughs for your team.",
            "type": "milestone",
            "relevance": "low"
        })
        
        # Sort by relevance
        relevance_order = {"high": 0, "medium": 1, "low": 2}
        suggestions.sort(key=lambda s: relevance_order.get(s.get("relevance", "low"), 2))
        
        gen_id = str(uuid.uuid4())
        await self._log_generation(gen_id, user_id, "upsell",
                                    None, 0, json.dumps(suggestions),
                                    {"suggestions_count": len(suggestions)})
        
        return {"id": gen_id, "suggestions": suggestions[:6]}

    # Content Enhancement
    async def improve_content(
        self,
        user_id: int,
        content: str,
        content_type: WritingContentType,
        improvements: List[str] = None
    ) -> Dict[str, Any]:
        """Improve existing content with basic rule-based enhancements."""
        await self._ensure_tables()
        improvements = improvements or ["clarity", "grammar"]
        
        improved = content
        changes = []
        
        # Basic grammar/style improvements
        replacements = {
            "  ": (" ", "Double space removed"),
            " ,": (",", "Space before comma removed"),
            " .": (".", "Space before period removed"),
            "dont": ("don't", "Missing apostrophe"),
            "cant": ("can't", "Missing apostrophe"),
            "wont": ("won't", "Missing apostrophe"),
            "im ": ("I'm ", "Missing apostrophe and capitalization"),
            "i ": ("I ", "Pronoun capitalization"),
            "etc..": ("etc.", "Punctuation fix"),
        }
        
        if "grammar" in improvements:
            for old, (new, reason) in replacements.items():
                if old in improved.lower():
                    idx = improved.lower().find(old)
                    original_text = improved[idx:idx+len(old)]
                    improved = improved[:idx] + new + improved[idx+len(old):]
                    changes.append({"type": "grammar", "original": original_text, "improved": new, "reason": reason})
        
        # Calculate readability (Flesch-like approximation)
        words = content.split()
        sentences = [s.strip() for s in re.split(r'[.!?]+', content) if s.strip()]
        avg_sentence_len = len(words) / max(len(sentences), 1)
        before_score = max(0, min(100, int(100 - avg_sentence_len * 2)))
        
        improved_words = improved.split()
        improved_sentences = [s.strip() for s in re.split(r'[.!?]+', improved) if s.strip()]
        improved_avg = len(improved_words) / max(len(improved_sentences), 1)
        after_score = max(0, min(100, int(100 - improved_avg * 2)))
        
        # If clarity improvement requested, add suggestions for long sentences
        if "clarity" in improvements:
            for i, sent in enumerate(sentences):
                if len(sent.split()) > 30:
                    changes.append({
                        "type": "clarity",
                        "original": sent[:50] + "...",
                        "improved": "(Consider splitting into shorter sentences)",
                        "reason": f"Sentence {i+1} is {len(sent.split())} words — may be hard to read"
                    })
        
        gen_id = str(uuid.uuid4())
        await self._log_generation(gen_id, user_id, f"improve_{content_type.value}",
                                    None, len(improved.split()), improved,
                                    {"improvements": improvements, "changes_count": len(changes)})
        
        return {
            "id": gen_id,
            "original": content,
            "improved": improved,
            "improvements_applied": improvements,
            "changes": changes,
            "readability_score": {
                "before": before_score,
                "after": after_score
            },
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def adjust_tone(
        self,
        user_id: int,
        content: str,
        target_tone: ToneStyle
    ) -> Dict[str, Any]:
        """Adjust the tone of content using rule-based transformations."""
        await self._ensure_tables()
        
        adjusted = content
        
        # Basic tone adjustments
        if target_tone == ToneStyle.FORMAL:
            replacements = {"Hi": "Dear Sir/Madam", "Hey": "Dear Sir/Madam",
                          "Thanks": "Thank you", "ASAP": "at your earliest convenience",
                          "OK": "acceptable", "cool": "satisfactory"}
            for old, new in replacements.items():
                adjusted = adjusted.replace(old, new)
        elif target_tone == ToneStyle.CASUAL:
            replacements = {"Dear Sir/Madam": "Hey there", "Sincerely": "Cheers",
                          "Best regards": "Thanks!", "I would like to": "I'd love to",
                          "Please do not hesitate": "Feel free"}
            for old, new in replacements.items():
                adjusted = adjusted.replace(old, new)
        elif target_tone == ToneStyle.PERSUASIVE:
            if not adjusted.endswith("?") and not adjusted.endswith("!"):
                adjusted += "\n\nDon't miss this opportunity — let's make it happen!"
        
        # Detect original tone
        original_tone = "neutral"
        lower = content.lower()
        if any(w in lower for w in ["dear", "sincerely", "regards"]):
            original_tone = "formal"
        elif any(w in lower for w in ["hey", "cool", "awesome"]):
            original_tone = "casual"
        
        gen_id = str(uuid.uuid4())
        await self._log_generation(gen_id, user_id, "tone_adjustment",
                                    target_tone.value, len(adjusted.split()), adjusted,
                                    {"original_tone": original_tone})
        
        return {
            "id": gen_id,
            "original": content,
            "adjusted": adjusted,
            "original_tone": original_tone,
            "target_tone": target_tone.value,
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def expand_content(
        self,
        user_id: int,
        content: str,
        target_length: int,
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Expand content toward target length by adding relevant sections."""
        await self._ensure_tables()
        
        original_words = content.split()
        original_length = len(original_words)
        expanded = content
        
        # Add focus-area sections if specified
        if focus_areas:
            for area in focus_areas:
                expanded += f"\n\n**{area.title()}:**\n"
                expanded += f"Further details regarding {area.lower()} will enhance the overall quality and comprehensiveness of this content. "
                expanded += f"Consider elaborating on specific aspects of {area.lower()} that are most relevant to the target audience."
        
        # If still below target, add a structured expansion
        if len(expanded.split()) < target_length:
            gap = target_length - len(expanded.split())
            if gap > 20:
                expanded += "\n\n**Additional Context:**\n"
                expanded += "This section provides supplementary information to strengthen the overall message. "
                expanded += "Key points have been reinforced and supporting details have been added for clarity."
        
        actual_expanded_length = len(expanded.split())
        gen_id = str(uuid.uuid4())
        
        await self._log_generation(gen_id, user_id, "expand",
                                    None, actual_expanded_length, expanded,
                                    {"target_length": target_length, "focus_areas": focus_areas or []})
        
        return {
            "id": gen_id,
            "original": content,
            "expanded": expanded,
            "original_length": original_length,
            "expanded_length": actual_expanded_length,
            "target_length": target_length,
            "focus_areas": focus_areas or [],
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def summarize_content(
        self,
        user_id: int,
        content: str,
        target_length: int = 100
    ) -> Dict[str, Any]:
        """Summarize content to target length using extractive approach."""
        await self._ensure_tables()
        
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', content) if s.strip()]
        words = content.split()
        
        if len(words) <= target_length:
            summary = content
        else:
            # Extractive: pick sentences that contribute most keywords
            word_freq = Counter(w.lower() for w in words if len(w) > 3)
            scored = []
            for sent in sentences:
                score = sum(word_freq.get(w.lower(), 0) for w in sent.split() if len(w) > 3)
                scored.append((score, sent))
            scored.sort(key=lambda x: x[0], reverse=True)
            
            selected = []
            current_len = 0
            for score, sent in scored:
                sent_len = len(sent.split())
                if current_len + sent_len <= target_length:
                    selected.append(sent)
                    current_len += sent_len
                if current_len >= target_length:
                    break
            
            if not selected:
                selected = [' '.join(words[:target_length]) + "..."]
            
            summary = ' '.join(selected)
        
        gen_id = str(uuid.uuid4())
        await self._log_generation(gen_id, user_id, "summarize",
                                    None, len(summary.split()), summary,
                                    {"target_length": target_length})
        
        return {
            "id": gen_id,
            "original": content,
            "summary": summary,
            "original_length": len(words),
            "summary_length": len(summary.split()),
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def analyze_feasibility(
        self,
        user_id: int,
        project_description: str,
        budget_min: float,
        budget_max: float,
        timeline_days: int
    ) -> Dict[str, Any]:
        """Analyze project feasibility based on description, budget, and timeline."""
        await self._ensure_tables()
        
        words = project_description.split()
        word_count = len(words)
        
        # Complexity scoring based on description analysis
        complexity_indicators = ["microservice", "scalab", "real-time", "machine learning",
                               "ai", "blockchain", "distributed", "multi-tenant",
                               "high availability", "migration", "legacy", "enterprise"]
        complexity_hits = sum(1 for ind in complexity_indicators if ind in project_description.lower())
        complexity_score = min(10, max(1, complexity_hits * 2 + word_count // 100))
        
        # Budget realism based on complexity
        min_budget_estimate = complexity_score * 500
        budget_realism = "High" if budget_max >= min_budget_estimate else ("Medium" if budget_max >= min_budget_estimate * 0.5 else "Low")
        
        # Timeline realism based on complexity
        min_days_estimate = complexity_score * 5
        timeline_realism = "Realistic" if timeline_days >= min_days_estimate else ("Tight" if timeline_days >= min_days_estimate * 0.5 else "Unrealistic")
        
        flags = []
        recommendations = []
        
        if budget_realism == "Low":
            flags.append(f"Budget range (${budget_min}-${budget_max}) may be too low for estimated complexity (score: {complexity_score}/10)")
            recommendations.append(f"Consider increasing budget to at least ${min_budget_estimate}")
        if timeline_realism == "Unrealistic":
            flags.append(f"Timeline of {timeline_days} days is very tight for this scope")
            recommendations.append(f"Consider extending to at least {min_days_estimate} days")
        elif timeline_realism == "Tight":
            flags.append(f"Timeline of {timeline_days} days is achievable but tight")
            recommendations.append("Include buffer time for revisions")
        
        if not flags:
            recommendations.append("Project scope, budget, and timeline appear well-aligned")
        
        if complexity_score >= 7:
            recommendations.append("Consider breaking this into multiple milestones")
        
        return {
            "complexity_score": complexity_score,
            "budget_realism": budget_realism,
            "timeline_realism": timeline_realism,
            "estimated_min_budget": min_budget_estimate,
            "estimated_min_days": min_days_estimate,
            "flags": flags,
            "recommendations": recommendations
        }

    # Analysis
    async def analyze_content(
        self,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Analyze content for quality and suggestions."""
        await self._ensure_tables()
        
        words = content.split()
        sentences = [s.strip() for s in re.split(r'[.!?]+', content) if s.strip()]
        word_count = len(words)
        sentence_count = max(len(sentences), 1)
        avg_sentence_length = word_count / sentence_count
        
        # Readability score (simplified Flesch-like)
        readability_score = max(0, min(100, int(100 - avg_sentence_length * 2)))
        if readability_score >= 70:
            level = "Easy to read"
        elif readability_score >= 50:
            level = "Professional"
        else:
            level = "Complex"
        
        # Tone detection
        lower = content.lower()
        tone_signals = {
            "professional": ["experience", "expertise", "quality", "deliver", "solution", "project", "milestone"],
            "friendly": ["love", "excited", "happy", "great", "amazing", "wonderful", "enjoy"],
            "formal": ["hereby", "regarding", "furthermore", "therefore", "sincerely", "respectfully"],
            "confident": ["guarantee", "proven", "ensure", "confident", "committed", "expert"],
            "casual": ["hey", "cool", "awesome", "stuff", "gonna", "wanna"],
        }
        tone_scores = {}
        for tone, keywords in tone_signals.items():
            tone_scores[tone] = sum(1 for kw in keywords if kw in lower)
        
        sorted_tones = sorted(tone_scores.items(), key=lambda x: x[1], reverse=True)
        primary_tone = sorted_tones[0][0] if sorted_tones[0][1] > 0 else "neutral"
        primary_confidence = min(1.0, sorted_tones[0][1] / max(sentence_count, 1))
        secondary_tones = [t for t, s in sorted_tones[1:3] if s > 0]
        
        # Keyword density (top content words, excluding common stopwords)
        stopwords = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                     "have", "has", "had", "do", "does", "did", "will", "would",
                     "could", "should", "may", "might", "can", "to", "of", "in",
                     "for", "on", "with", "at", "by", "from", "as", "into", "and",
                     "or", "but", "not", "this", "that", "it", "i", "you", "we", "they",
                     "my", "your", "our", "their", "its", "his", "her"}
        word_freq = Counter(w.lower().strip(".,!?;:\"'()") for w in words
                           if w.lower().strip(".,!?;:\"'()") not in stopwords and len(w) > 2)
        keyword_density = dict(word_freq.most_common(10))
        
        # Suggestions
        suggestions = []
        if avg_sentence_length > 25:
            suggestions.append({"type": "readability", "suggestion": "Break up long sentences for easier reading"})
        if word_count < 50:
            suggestions.append({"type": "length", "suggestion": "Content is quite short — consider adding more detail"})
        if not any(c in content for c in ["?", "!"]):
            suggestions.append({"type": "engagement", "suggestion": "Add questions or exclamations to engage the reader"})
        if not any(marker in content for marker in ["- ", "• ", "* ", "1.", "1)"]):
            suggestions.append({"type": "structure", "suggestion": "Consider using bullet points or numbered lists"})
        if primary_tone == "neutral":
            suggestions.append({"type": "tone", "suggestion": "Add personality — the tone is quite neutral"})
        
        # Sentiment (simple positive/negative word counting)
        positive_words = {"great", "excellent", "amazing", "good", "best", "love", "wonderful", "perfect",
                         "outstanding", "fantastic", "exceptional", "success", "confident", "excited"}
        negative_words = {"bad", "poor", "terrible", "worst", "hate", "awful", "horrible", "fail",
                         "disappointed", "problem", "issue", "concern", "difficult", "unfortunately"}
        pos_count = sum(1 for w in words if w.lower().strip(".,!?") in positive_words)
        neg_count = sum(1 for w in words if w.lower().strip(".,!?") in negative_words)
        total_sentiment = pos_count + neg_count
        if total_sentiment == 0:
            sentiment_score = 0.5
            sentiment_label = "neutral"
        else:
            sentiment_score = round(pos_count / total_sentiment, 2)
            sentiment_label = "positive" if sentiment_score > 0.6 else ("negative" if sentiment_score < 0.4 else "mixed")
        
        return {
            "statistics": {
                "word_count": word_count,
                "sentence_count": len(sentences),
                "average_sentence_length": round(avg_sentence_length, 1),
                "reading_time_minutes": round(word_count / 200, 1)
            },
            "readability": {
                "score": readability_score,
                "level": level,
            },
            "tone_analysis": {
                "primary_tone": primary_tone,
                "confidence": round(primary_confidence, 2),
                "secondary_tones": secondary_tones
            },
            "keyword_density": keyword_density,
            "suggestions": suggestions,
            "sentiment": {
                "score": sentiment_score,
                "label": sentiment_label
            },
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def check_grammar(
        self,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Check grammar and spelling with rule-based detection."""
        await self._ensure_tables()
        
        issues = []
        
        # Common grammar patterns to detect
        grammar_rules = [
            (r'\b(teh)\b', "the", "spelling", "Common misspelling"),
            (r'\b(recieve)\b', "receive", "spelling", "i before e except after c"),
            (r'\b(occured)\b', "occurred", "spelling", "Double 'r' required"),
            (r'\b(seperate)\b', "separate", "spelling", "Common misspelling"),
            (r'\b(definately)\b', "definitely", "spelling", "Common misspelling"),
            (r'\b(accomodate)\b', "accommodate", "spelling", "Double 'c' and 'm'"),
            (r'\b(alot)\b', "a lot", "grammar", "Should be two words"),
            (r'\b(could of)\b', "could have", "grammar", "Incorrect auxiliary verb"),
            (r'\b(should of)\b', "should have", "grammar", "Incorrect auxiliary verb"),
            (r'\b(would of)\b', "would have", "grammar", "Incorrect auxiliary verb"),
            (r'\b(your)\s+(welcome)\b', "you're welcome", "grammar", "your → you're (contraction)"),
            (r'\b(its)\s+(a)\b', "it's a", "grammar", "its → it's (contraction)"),
            (r'\b(their)\s+(is|are|was|were)\b', "there", "grammar", "their → there (location/existence)"),
            (r'(\s{2,})', " ", "formatting", "Multiple consecutive spaces"),
            (r'\s+([,.])', lambda m: m.group(1), "formatting", "Space before punctuation"),
        ]
        
        corrected = content
        for pattern, suggestion_text, issue_type, reason in grammar_rules:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                issues.append({
                    "type": issue_type,
                    "text": match.group(0),
                    "suggestion": suggestion_text if isinstance(suggestion_text, str) else suggestion_text(match),
                    "position": {"start": match.start(), "end": match.end()},
                    "reason": reason
                })
                if isinstance(suggestion_text, str):
                    corrected = corrected[:match.start()] + suggestion_text + corrected[match.end():]
        
        # Check for sentences not starting with uppercase
        for match in re.finditer(r'(?<=[.!?]\s)([a-z])', content):
            issues.append({
                "type": "grammar",
                "text": match.group(0),
                "suggestion": match.group(0).upper(),
                "position": {"start": match.start(), "end": match.end()},
                "reason": "Sentence should start with uppercase"
            })
        
        gen_id = str(uuid.uuid4())
        await self._log_generation(gen_id, user_id, "grammar_check",
                                    None, len(content.split()), corrected,
                                    {"issues_found": len(issues)})
        
        return {
            "id": gen_id,
            "issues": issues,
            "total_issues": len(issues),
            "corrected_content": corrected,
            "checked_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Templates
    BUILTIN_TEMPLATES = [
        {
            "id": "tpl-proposal-1",
            "name": "Professional Proposal",
            "content_type": WritingContentType.PROPOSAL.value,
            "structure": ["greeting", "introduction", "qualifications", "approach", "timeline", "closing"],
            "variables": ["client_name", "project_name", "skills", "rate"],
            "template_body": "Dear {client_name},\n\nI am writing to express my interest in {project_name}. With expertise in {skills}, I can deliver high-quality results.\n\nMy proposed rate is {rate}.\n\nBest regards"
        },
        {
            "id": "tpl-proposal-2",
            "name": "Concise Proposal",
            "content_type": WritingContentType.PROPOSAL.value,
            "structure": ["greeting", "value_proposition", "cta"],
            "variables": ["client_name", "key_benefit"],
            "template_body": "Hi {client_name},\n\nI can help you with {key_benefit}. Let's discuss the details!\n\nBest regards"
        },
        {
            "id": "tpl-bio-1",
            "name": "Developer Bio",
            "content_type": WritingContentType.PROFILE_BIO.value,
            "structure": ["intro", "expertise", "achievements", "cta"],
            "variables": ["name", "role", "years", "skills"],
            "template_body": "I'm {name}, a {role} with {years}+ years of experience specializing in {skills}. Let's build something great together!"
        },
        {
            "id": "tpl-desc-1",
            "name": "Project Brief",
            "content_type": WritingContentType.PROJECT_DESCRIPTION.value,
            "structure": ["overview", "requirements", "deliverables", "timeline"],
            "variables": ["project_type", "features", "budget"],
            "template_body": "# {project_type}\n\nWe need a professional to build a solution with the following features: {features}.\n\nBudget: {budget}"
        }
    ]
    
    async def get_writing_templates(
        self,
        content_type: Optional[WritingContentType] = None
    ) -> List[Dict[str, Any]]:
        """Get writing templates from DB + builtins."""
        await self._ensure_tables()
        
        # Fetch custom templates from DB
        if content_type:
            result = execute_query(
                "SELECT id, name, content_type, structure, variables, template_body FROM ai_writing_templates WHERE content_type = ?",
                [content_type.value]
            )
        else:
            result = execute_query(
                "SELECT id, name, content_type, structure, variables, template_body FROM ai_writing_templates",
                []
            )
        
        db_templates = []
        for row in parse_rows(result):
            db_templates.append({
                "id": row["id"],
                "name": row["name"],
                "content_type": row["content_type"],
                "structure": json.loads(row.get("structure") or "[]"),
                "variables": json.loads(row.get("variables") or "[]"),
                "template_body": row.get("template_body", ""),
                "source": "custom"
            })
        
        # Merge with builtins
        builtins = self.BUILTIN_TEMPLATES
        if content_type:
            builtins = [t for t in builtins if t["content_type"] == content_type.value]
        
        for t in builtins:
            t_copy = {**t, "source": "builtin"}
            db_templates.append(t_copy)
        
        return db_templates
    
    async def apply_template(
        self,
        user_id: int,
        template_id: str,
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply a template with variables."""
        await self._ensure_tables()
        
        # Check DB first
        result = execute_query(
            "SELECT template_body, name, content_type FROM ai_writing_templates WHERE id = ?",
            [template_id]
        )
        rows = parse_rows(result)
        
        template_body = None
        template_name = None
        
        if rows:
            template_body = rows[0].get("template_body", "")
            template_name = rows[0].get("name", "Custom Template")
        else:
            # Check builtins
            for t in self.BUILTIN_TEMPLATES:
                if t["id"] == template_id:
                    template_body = t.get("template_body", "")
                    template_name = t["name"]
                    break
        
        if template_body is None:
            return {"error": f"Template '{template_id}' not found"}
        
        # Apply variables
        content = template_body
        for key, value in variables.items():
            placeholder = "{" + key + "}"
            content = content.replace(placeholder, str(value))
        
        gen_id = str(uuid.uuid4())
        await self._log_generation(gen_id, user_id, "template",
                                    None, len(content.split()), content,
                                    {"template_id": template_id, "template_name": template_name})
        
        return {
            "id": gen_id,
            "template_id": template_id,
            "template_name": template_name,
            "content": content,
            "variables_used": variables,
            "word_count": len(content.split()),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Usage Tracking
    async def get_usage_stats(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get AI writing assistant usage statistics from DB."""
        await self._ensure_tables()
        
        # Total counts
        result = execute_query(
            """SELECT 
                COUNT(*) as total,
                COALESCE(SUM(word_count), 0) as total_words
               FROM ai_writing_history
               WHERE user_id = ? AND created_at >= datetime('now', '-30 days')""",
            [user_id]
        )
        rows = parse_rows(result)
        total = int(rows[0]["total"]) if rows else 0
        total_words = int(rows[0]["total_words"]) if rows else 0
        
        # Breakdown by type
        result2 = execute_query(
            """SELECT content_type, COUNT(*) as cnt
               FROM ai_writing_history
               WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
               GROUP BY content_type""",
            [user_id]
        )
        by_type = {}
        improvements_count = 0
        for row in parse_rows(result2):
            ct = row["content_type"]
            cnt = int(row["cnt"])
            by_type[ct] = cnt
            if ct.startswith("improve_") or ct in ("grammar_check", "tone_adjustment", "expand", "summarize"):
                improvements_count += cnt
        
        generations_count = total - improvements_count
        
        # Estimate time saved (avg 4 min per generation)
        time_saved = generations_count * 4
        
        return {
            "total_generations": generations_count,
            "total_improvements": improvements_count,
            "by_type": by_type,
            "words_generated": total_words,
            "time_saved_minutes": time_saved,
            "period": "last_30_days"
        }


_instance: Optional[AIWritingService] = None


def get_ai_writing_service() -> AIWritingService:
    """Factory function for AI writing service (singleton)."""
    global _instance
    if _instance is None:
        _instance = AIWritingService()
    return _instance
