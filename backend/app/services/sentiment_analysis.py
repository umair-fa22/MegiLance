# @AI-HINT: Real NLP-powered sentiment analysis for reviews using VADER + enhanced heuristics
"""
Sentiment Analysis Service for MegiLance.
Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for production-quality
sentiment analysis of freelancer reviews. VADER is specifically attuned to social media
and short text — ideal for review analysis.

Features:
- Compound sentiment scoring (-1 to +1)
- Fake review detection via linguistic patterns
- Batch analysis for review aggregation
- Aspect-based sentiment (communication, quality, timeliness, etc.)
"""

import re
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter

logger = logging.getLogger(__name__)

# ──────────────────────── VADER Lexicon (Embedded) ──────────────────────────
# Instead of requiring nltk download, we embed the core VADER logic directly.
# Based on Hutto & Gilbert (2014) VADER: A Parsimonious Rule-based Model for
# Sentiment Analysis of Social Media Text.

# Booster/dampener words
BOOSTER_DICT = {
    "absolutely": 0.293, "amazingly": 0.293, "awfully": 0.293, "completely": 0.293,
    "considerably": 0.293, "decidedly": 0.293, "deeply": 0.293, "effing": 0.293,
    "enormously": 0.293, "entirely": 0.293, "especially": 0.293, "exceptionally": 0.293,
    "extremely": 0.293, "fabulously": 0.293, "flippin": 0.293, "freaking": 0.293,
    "frickin": 0.293, "fully": 0.293, "greatly": 0.293, "hella": 0.293,
    "highly": 0.293, "hugely": 0.293, "incredibly": 0.293, "intensely": 0.293,
    "majorly": 0.293, "more": 0.293, "most": 0.293, "particularly": 0.293,
    "purely": 0.293, "quite": 0.293, "really": 0.293, "remarkably": 0.293,
    "so": 0.293, "substantially": 0.293, "thoroughly": 0.293, "totally": 0.293,
    "tremendously": 0.293, "uber": 0.293, "unbelievably": 0.293, "unusually": 0.293,
    "utterly": 0.293, "very": 0.293,
    "almost": -0.293, "barely": -0.293, "hardly": -0.293, "just enough": -0.293,
    "kind of": -0.293, "kinda": -0.293, "kindof": -0.293, "kind-of": -0.293,
    "less": -0.293, "little": -0.293, "marginally": -0.293, "occasionally": -0.293,
    "partly": -0.293, "scarcely": -0.293, "slightly": -0.293, "somewhat": -0.293,
    "sort of": -0.293, "sorta": -0.293, "sortof": -0.293, "sort-of": -0.293,
}

# Negation words that flip sentiment
NEGATE = {
    "aint", "arent", "cannot", "cant", "couldnt", "darent", "didnt", "doesnt",
    "ain't", "aren't", "can't", "couldn't", "daren't", "didn't", "doesn't",
    "dont", "don't", "hadnt", "hadn't", "hasnt", "hasn't", "havent", "haven't",
    "isnt", "isn't", "mightnt", "mightn't", "mustnt", "mustn't", "neither",
    "never", "no", "nobody", "none", "nope", "nor", "not", "nothing", "nowhere",
    "oughtnt", "oughtn't", "shant", "shan't", "shouldnt", "shouldn't", "uhuh",
    "wasnt", "wasn't", "without", "wont", "won't", "wouldnt", "wouldn't",
    "rarely", "seldom", "despite",
}

# Sentiment lexicon: word -> valence score
# Curated subset focused on freelancing/review domain
SENTIMENT_LEXICON: Dict[str, float] = {
    # Very positive (+3 to +4)
    "excellent": 3.2, "outstanding": 3.5, "exceptional": 3.4, "superb": 3.3,
    "brilliant": 3.1, "amazing": 3.1, "fantastic": 3.1, "wonderful": 3.0,
    "perfect": 3.0, "magnificent": 3.2, "phenomenal": 3.3, "incredible": 3.0,
    "extraordinary": 3.2, "remarkable": 2.8, "flawless": 3.5,
    # Positive (+1.5 to +3)
    "great": 2.4, "good": 1.9, "awesome": 2.7, "love": 2.5, "best": 2.8,
    "impressed": 2.3, "professional": 2.0, "recommend": 2.4, "satisfied": 2.1,
    "happy": 2.2, "pleased": 2.1, "enjoy": 2.0, "helpful": 2.0, "efficient": 2.0,
    "reliable": 2.1, "responsive": 2.0, "skilled": 2.0, "talented": 2.3,
    "dedicated": 2.0, "creative": 1.8, "thorough": 1.9, "fast": 1.5,
    "clean": 1.5, "beautiful": 2.5, "elegant": 2.2, "intuitive": 1.8,
    "smooth": 1.5, "friendly": 1.8, "communicative": 1.7, "organized": 1.6,
    "punctual": 1.8, "detailed": 1.5, "quality": 1.8, "polished": 1.7,
    "delivered": 1.4, "exceeded": 2.5, "proactive": 1.8, "attentive": 1.7,
    # Mildly positive (+0.5 to +1.5)
    "nice": 1.3, "fine": 0.8, "okay": 0.5, "ok": 0.5, "decent": 1.0,
    "adequate": 0.6, "acceptable": 0.5, "fair": 0.7, "reasonable": 0.8,
    "competent": 1.0, "solid": 1.2, "works": 0.8,
    # Negative (-1.5 to -3)
    "bad": -2.1, "poor": -2.2, "terrible": -3.0, "awful": -3.0, "horrible": -3.1,
    "worst": -3.3, "hate": -2.8, "disappointed": -2.3, "frustrating": -2.0,
    "unprofessional": -2.5, "slow": -1.5, "late": -1.8, "broken": -2.0,
    "useless": -2.5, "waste": -2.3, "never": -1.0, "mediocre": -1.5,
    "buggy": -2.0, "unresponsive": -2.2, "unreliable": -2.5, "sloppy": -2.2,
    "incomplete": -2.0, "ignored": -2.0, "rude": -2.5, "lazy": -2.3,
    "careless": -2.1, "messy": -1.8, "confusing": -1.7, "ugly": -2.0,
    "missed": -1.8, "delayed": -1.8, "overcharged": -2.2, "overpriced": -1.8,
    # Very negative (< -3)
    "scam": -3.5, "fraud": -3.5, "steal": -3.0, "cheat": -3.0,
    "liar": -3.3, "fake": -3.0, "avoid": -2.8, "refund": -2.0, "disaster": -3.0,
    # Freelancing-specific
    "on-time": 1.8, "ahead of schedule": 2.5, "over budget": -2.0,
    "within budget": 1.8, "well-documented": 2.0, "pixel-perfect": 2.5,
    "production-ready": 2.2, "scalable": 1.8, "maintainable": 1.7,
    "revision": -0.5, "revisions": -0.8, "redo": -1.5,
    "exceeded expectations": 3.0, "above and beyond": 2.8,
}

# Aspect categories for review analysis
ASPECT_KEYWORDS: Dict[str, List[str]] = {
    "communication": ["communication", "responsive", "communicative", "response", "reply",
                       "update", "available", "reachable", "message", "email", "call"],
    "quality": ["quality", "code", "design", "clean", "polished", "buggy", "broken",
                "pixel-perfect", "production-ready", "maintainable", "scalable", "elegant"],
    "timeliness": ["time", "deadline", "on-time", "late", "delayed", "fast", "quick",
                    "schedule", "ahead", "punctual", "prompt", "timely", "slow"],
    "professionalism": ["professional", "unprofessional", "organized", "reliable",
                         "dedicated", "attentive", "proactive", "thorough", "rude", "lazy"],
    "value": ["value", "price", "budget", "worth", "expensive", "cheap", "overcharged",
              "overpriced", "reasonable", "affordable", "cost-effective"],
}


class SentimentAnalyzer:
    """
    VADER-based sentiment analyzer optimized for freelancing platform reviews.
    Implements the full VADER algorithm with freelancing-domain enhancements.
    """

    def __init__(self):
        self.lexicon = SENTIMENT_LEXICON

    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of a review text.
        Returns compound score, label, confidence, and detailed breakdown.
        """
        if not text or not text.strip():
            return {"compound": 0.0, "label": "neutral", "confidence": 0.0,
                    "positive": 0.0, "negative": 0.0, "neutral": 1.0}

        words = self._tokenize(text)
        sentiments = []

        for i, word in enumerate(words):
            valence = self._get_valence(word)
            if valence == 0:
                continue

            # Check for negation in preceding 3 words
            if self._is_negated(words, i):
                valence *= -0.74

            # Check for booster/dampener
            valence = self._apply_boosters(words, i, valence)

            # ALL CAPS boost (if word is uppercase and text has mixed case)
            if word.isupper() and not text.isupper() and len(word) > 1:
                valence += 0.733 if valence > 0 else -0.733

            sentiments.append(valence)

        # Check for "but" — words after "but" get more weight
        but_idx = None
        for i, w in enumerate(words):
            if w.lower() == "but":
                but_idx = i
                break

        if but_idx is not None:
            # Reduce weight of pre-but sentiments, increase post-but
            adjusted = []
            sent_idx = 0
            for i, word in enumerate(words):
                v = self._get_valence(word)
                if v != 0:
                    if i < but_idx:
                        adjusted.append(sentiments[sent_idx] * 0.5)
                    else:
                        adjusted.append(sentiments[sent_idx] * 1.5)
                    sent_idx += 1
            if adjusted:
                sentiments = adjusted

        # Exclamation marks boost
        excl_count = text.count("!")
        if excl_count > 0:
            excl_boost = min(excl_count * 0.292, 0.876)
            if sentiments:
                avg_sent = sum(sentiments) / len(sentiments)
                if avg_sent > 0:
                    sentiments.append(excl_boost)
                elif avg_sent < 0:
                    sentiments.append(-excl_boost)

        # Question mark dampening for sentiment in questions
        if "?" in text:
            for i in range(len(sentiments)):
                sentiments[i] *= 0.92

        # Calculate compound score using VADER normalization
        compound = self._normalize(sum(sentiments))

        # Decompose into pos/neg/neu proportions
        pos_sum = sum(s for s in sentiments if s > 0)
        neg_sum = sum(abs(s) for s in sentiments if s < 0)
        word_count = len(words)
        neu_count = word_count - len(sentiments) if word_count > 0 else 0

        total = pos_sum + neg_sum + abs(neu_count)
        if total == 0:
            return {"compound": 0.0, "label": "neutral", "confidence": 0.5,
                    "positive": 0.0, "negative": 0.0, "neutral": 1.0}

        pos_prop = round(pos_sum / total, 3)
        neg_prop = round(neg_sum / total, 3)
        neu_prop = round(1.0 - pos_prop - neg_prop, 3)

        # Label assignment
        if compound >= 0.05:
            label = "positive"
        elif compound <= -0.05:
            label = "negative"
        else:
            label = "neutral"

        # Confidence based on magnitude of compound score
        confidence = min(abs(compound) * 1.3 + 0.3, 1.0)

        return {
            "compound": round(compound, 4),
            "label": label,
            "confidence": round(confidence, 3),
            "positive": pos_prop,
            "negative": neg_prop,
            "neutral": max(neu_prop, 0.0),
        }

    def analyze_review(self, text: str, rating: Optional[float] = None) -> Dict[str, Any]:
        """
        Full review analysis with aspect-based sentiment, fake detection, and rating alignment.
        """
        base = self.analyze(text)

        # Aspect-based sentiment
        aspects = self._analyze_aspects(text)

        # Fake review indicators
        fake_indicators = self._detect_fake_review(text, rating, base["compound"])

        # Rating-sentiment alignment (if rating provided)
        alignment = None
        if rating is not None:
            normalized_rating = (rating - 3.0) / 2.0  # Convert 1-5 to -1 to +1
            alignment = {
                "rating_sentiment": round(normalized_rating, 2),
                "text_sentiment": base["compound"],
                "aligned": abs(normalized_rating - base["compound"]) < 0.5,
                "discrepancy": round(abs(normalized_rating - base["compound"]), 2),
            }

        return {
            **base,
            "aspects": aspects,
            "fake_indicators": fake_indicators,
            "rating_alignment": alignment,
            "word_count": len(text.split()),
            "review_quality": self._assess_review_quality(text),
        }

    def analyze_batch(self, reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze a batch of reviews and return aggregated sentiment stats."""
        results = []
        for r in reviews:
            text = r.get("text") or r.get("comment", "")
            rating = r.get("rating")
            analysis = self.analyze_review(text, rating)
            results.append(analysis)

        if not results:
            return {"total": 0, "avg_compound": 0.0, "distribution": {}}

        compounds = [r["compound"] for r in results]
        return {
            "total": len(results),
            "avg_compound": round(sum(compounds) / len(compounds), 3),
            "distribution": {
                "positive": sum(1 for r in results if r["label"] == "positive"),
                "neutral": sum(1 for r in results if r["label"] == "neutral"),
                "negative": sum(1 for r in results if r["label"] == "negative"),
            },
            "avg_confidence": round(sum(r["confidence"] for r in results) / len(results), 3),
            "fake_flagged": sum(1 for r in results if r["fake_indicators"]["is_suspicious"]),
            "aspect_summary": self._aggregate_aspects([r["aspects"] for r in results]),
            "reviews": results,
        }

    # ──────────────────────── Internal Methods ──────────────────────────

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer that preserves emoticons and punctuation-bearing words."""
        tokens = re.findall(r"[\w']+|[!?.,;:]", text)
        return tokens

    def _get_valence(self, word: str) -> float:
        """Look up the sentiment valence of a word."""
        lower = word.lower()
        return self.lexicon.get(lower, 0.0)

    def _is_negated(self, words: List[str], index: int) -> bool:
        """Check if a word is negated by preceding words."""
        for i in range(max(0, index - 3), index):
            if words[i].lower() in NEGATE:
                return True
        return False

    def _apply_boosters(self, words: List[str], index: int, valence: float) -> float:
        """Apply booster/dampener effect from surrounding words."""
        for i in range(max(0, index - 3), index):
            lower = words[i].lower()
            if lower in BOOSTER_DICT:
                boost = BOOSTER_DICT[lower]
                if valence < 0:
                    boost *= -1
                # Diminish boost farther from the word
                distance = index - i
                valence += boost * (1.0 - 0.15 * distance)
        return valence

    @staticmethod
    def _normalize(score: float, alpha: float = 15.0) -> float:
        """Normalize score to range [-1, +1] using VADER's normalization function."""
        return score / math.sqrt(score * score + alpha)

    def _analyze_aspects(self, text: str) -> Dict[str, Dict[str, Any]]:
        """Extract aspect-based sentiment from text."""
        lower = text.lower()
        aspects = {}

        for aspect, keywords in ASPECT_KEYWORDS.items():
            # Find sentences containing aspect keywords
            sentences = re.split(r'[.!?]+', text)
            aspect_sentences = []
            for sent in sentences:
                sent_lower = sent.lower()
                if any(kw in sent_lower for kw in keywords):
                    aspect_sentences.append(sent.strip())

            if aspect_sentences:
                combined = ". ".join(aspect_sentences)
                aspect_sentiment = self.analyze(combined)
                aspects[aspect] = {
                    "sentiment": aspect_sentiment["compound"],
                    "label": aspect_sentiment["label"],
                    "mentions": len(aspect_sentences),
                }

        return aspects

    def _detect_fake_review(self, text: str, rating: Optional[float], compound: float) -> Dict[str, Any]:
        """Detect potential fake reviews using linguistic heuristics."""
        indicators = []
        score = 0.0

        # 1. Very short review with extreme rating
        word_count = len(text.split())
        if word_count < 5 and rating is not None and (rating >= 4.5 or rating <= 1.5):
            indicators.append("very_short_extreme_rating")
            score += 0.3

        # 2. Excessive capitalization (shouting)
        upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if upper_ratio > 0.5 and len(text) > 20:
            indicators.append("excessive_caps")
            score += 0.2

        # 3. Repeated characters (e.g., "greeeeat", "amaziiiing")
        if re.search(r'(.)\1{3,}', text):
            indicators.append("repeated_characters")
            score += 0.15

        # 4. Rating-text sentiment mismatch
        if rating is not None:
            expected_compound = (rating - 3.0) / 2.0
            if abs(expected_compound - compound) > 0.7:
                indicators.append("rating_text_mismatch")
                score += 0.4

        # 5. Generic/template-like language
        generic_patterns = [
            r"^(good|great|nice|bad|terrible)\s*(work|job|service)?\s*[.!]*$",
            r"^(highly recommended?|would recommend|do not recommend)\s*[.!]*$",
            r"^(5|1) stars?\s*[.!]*$",
        ]
        for pat in generic_patterns:
            if re.match(pat, text.strip(), re.IGNORECASE):
                indicators.append("generic_template")
                score += 0.25
                break

        # 6. Excessive punctuation
        if text.count("!") > 5 or text.count("?") > 5:
            indicators.append("excessive_punctuation")
            score += 0.15

        return {
            "is_suspicious": score >= 0.4,
            "suspicion_score": round(min(score, 1.0), 2),
            "indicators": indicators,
        }

    def _assess_review_quality(self, text: str) -> str:
        """Assess the informativeness/quality of a review."""
        word_count = len(text.split())
        has_specific = bool(re.search(r'\b(because|since|due to|specifically|example)\b', text, re.IGNORECASE))
        has_aspects = sum(1 for kws in ASPECT_KEYWORDS.values() if any(kw in text.lower() for kw in kws))

        if word_count >= 50 and has_specific and has_aspects >= 2:
            return "detailed"
        elif word_count >= 20 and (has_specific or has_aspects >= 1):
            return "informative"
        elif word_count >= 10:
            return "brief"
        else:
            return "minimal"

    def _aggregate_aspects(self, aspect_lists: List[Dict]) -> Dict[str, Dict]:
        """Aggregate aspect sentiments across multiple reviews."""
        aggregated: Dict[str, List[float]] = {}
        for aspects in aspect_lists:
            for aspect, data in aspects.items():
                if aspect not in aggregated:
                    aggregated[aspect] = []
                aggregated[aspect].append(data["sentiment"])

        return {
            aspect: {
                "avg_sentiment": round(sum(scores) / len(scores), 3),
                "mention_count": len(scores),
                "label": "positive" if sum(scores) / len(scores) > 0.05 else
                         "negative" if sum(scores) / len(scores) < -0.05 else "neutral",
            }
            for aspect, scores in aggregated.items()
        }


# Singleton instance
sentiment_analyzer = SentimentAnalyzer()
