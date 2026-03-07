# @AI-HINT: AI chatbot with intent classification and support ticket creation — DB-backed via Turso
"""Conversational support system with FAQ matching and live agent handoff."""

import logging
import secrets
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum
from collections import defaultdict

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class ChatIntent(str, Enum):
    """Detected conversation intents."""
    GREETING = "greeting"
    GOODBYE = "goodbye"
    HELP = "help"
    FAQ = "faq"
    ACCOUNT_QUESTION = "account_question"
    PROJECT_QUESTION = "project_question"
    PAYMENT_QUESTION = "payment_question"
    TECHNICAL_ISSUE = "technical_issue"
    COMPLAINT = "complaint"
    FEEDBACK = "feedback"
    CREATE_TICKET = "create_ticket"
    SPEAK_TO_AGENT = "speak_to_agent"
    UNKNOWN = "unknown"


class SentimentLevel(str, Enum):
    """Message sentiment classification."""
    VERY_NEGATIVE = "very_negative"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    POSITIVE = "positive"
    VERY_POSITIVE = "very_positive"


class ConversationState(str, Enum):
    """Chatbot conversation states."""
    ACTIVE = "active"
    AWAITING_INPUT = "awaiting_input"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"


class AIChatbotService:
    """
    AI-powered chatbot for customer support and FAQ assistance.
    
    Uses intent classification, FAQ matching, and sentiment analysis
    to provide intelligent responses and automate support.
    """
    
    # Intent patterns
    INTENT_PATTERNS = {
        ChatIntent.GREETING: [
            r'\b(hi|hello|hey|good morning|good afternoon|good evening)\b',
            r'\b(howdy|greetings|what\'s up)\b'
        ],
        ChatIntent.GOODBYE: [
            r'\b(bye|goodbye|see you|later|thanks|thank you)\b',
            r'\b(have a nice day|take care)\b'
        ],
        ChatIntent.HELP: [
            r'\b(help|assist|support|how do i|how can i|what is)\b',
            r'\b(i need help|can you help|guide me)\b'
        ],
        ChatIntent.ACCOUNT_QUESTION: [
            r'\b(account|profile|settings|password|email|login)\b',
            r'\b(sign up|register|verification|verify)\b'
        ],
        ChatIntent.PROJECT_QUESTION: [
            r'\b(project|job|gig|contract|proposal|bid)\b',
            r'\b(freelancer|client|hire|work)\b'
        ],
        ChatIntent.PAYMENT_QUESTION: [
            r'\b(payment|pay|money|withdraw|deposit|escrow)\b',
            r'\b(invoice|billing|refund|fee|commission)\b'
        ],
        ChatIntent.TECHNICAL_ISSUE: [
            r'\b(error|bug|broken|not working|issue|problem)\b',
            r'\b(crash|stuck|loading|slow|fail)\b'
        ],
        ChatIntent.COMPLAINT: [
            r'\b(complaint|complain|terrible|awful|worst)\b',
            r'\b(unacceptable|disappointed|frustrated|angry)\b'
        ],
        ChatIntent.FEEDBACK: [
            r'\b(feedback|suggestion|improve|feature request)\b',
            r'\b(would be nice|you should|recommend)\b'
        ],
        ChatIntent.SPEAK_TO_AGENT: [
            r'\b(speak to|talk to|human|agent|representative)\b',
            r'\b(real person|live support|escalate)\b'
        ]
    }
    
    # Sentiment keywords
    SENTIMENT_KEYWORDS = {
        SentimentLevel.VERY_NEGATIVE: [
            'terrible', 'awful', 'horrible', 'worst', 'hate', 'furious',
            'disgusting', 'unacceptable', 'scam', 'fraud'
        ],
        SentimentLevel.NEGATIVE: [
            'bad', 'poor', 'disappointed', 'frustrated', 'annoyed',
            'unhappy', 'slow', 'broken', 'useless', 'confused'
        ],
        SentimentLevel.POSITIVE: [
            'good', 'nice', 'helpful', 'thanks', 'appreciate',
            'works', 'fine', 'okay', 'decent'
        ],
        SentimentLevel.VERY_POSITIVE: [
            'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'love', 'perfect', 'awesome', 'best', 'outstanding'
        ]
    }
    
    # FAQ Database
    FAQ_DATABASE = {
        "how_to_create_account": {
            "question": "How do I create an account?",
            "answer": "To create an account:\n1. Click 'Sign Up' on the homepage\n2. Choose your role (Client or Freelancer)\n3. Enter your email and create a password\n4. Verify your email address\n5. Complete your profile\n\nNeed more help? Just ask!",
            "keywords": ["create", "account", "sign up", "register", "new user"],
            "category": "account"
        },
        "how_to_post_project": {
            "question": "How do I post a project?",
            "answer": "To post a new project:\n1. Log in to your client account\n2. Click 'Post a Project' from your dashboard\n3. Fill in the project details (title, description, budget, deadline)\n4. Add required skills and preferences\n5. Review and publish\n\nYour project will be visible to matching freelancers immediately!",
            "keywords": ["post", "project", "job", "create project", "new project"],
            "category": "projects"
        },
        "how_to_submit_proposal": {
            "question": "How do I submit a proposal?",
            "answer": "To submit a proposal:\n1. Browse available projects or check your matches\n2. Click on a project that interests you\n3. Click 'Submit Proposal'\n4. Write a compelling cover letter\n5. Set your proposed rate and timeline\n6. Add relevant portfolio items\n7. Submit!\n\nTip: Personalize each proposal for better results.",
            "keywords": ["submit", "proposal", "bid", "apply", "project"],
            "category": "proposals"
        },
        "payment_methods": {
            "question": "What payment methods are supported?",
            "answer": "We support multiple payment methods:\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• PayPal\n• Bank Transfer\n• Wise (TransferWise)\n\nAll payments are processed securely through our escrow system to protect both clients and freelancers.",
            "keywords": ["payment", "pay", "method", "card", "paypal", "bank"],
            "category": "payments"
        },
        "how_escrow_works": {
            "question": "How does escrow work?",
            "answer": "Our escrow system protects both parties:\n\n1. **Funding**: Client deposits payment into escrow\n2. **Work**: Freelancer completes the milestone\n3. **Approval**: Client reviews and approves work\n4. **Release**: Payment is released to freelancer\n\nFunds are held securely until work is approved. Disputes can be raised if there are issues.",
            "keywords": ["escrow", "secure", "payment", "milestone", "protection"],
            "category": "payments"
        },
        "platform_fees": {
            "question": "What are the platform fees?",
            "answer": "MegiLance fee structure:\n\n• **Freelancers**: 10% service fee on earnings\n• **Clients**: No additional fees (pay what you quote)\n• **Withdrawals**: Free for amounts over $100\n• **Small withdrawals**: $1 flat fee under $100\n\nVolume discounts available for enterprise accounts!",
            "keywords": ["fee", "commission", "charge", "cost", "price"],
            "category": "payments"
        },
        "forgot_password": {
            "question": "I forgot my password",
            "answer": "To reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for the reset link\n5. Create a new password\n\nLink expires in 24 hours. Check spam folder if not received.",
            "keywords": ["forgot", "password", "reset", "can't login", "locked"],
            "category": "account"
        },
        "dispute_resolution": {
            "question": "How do I raise a dispute?",
            "answer": "To raise a dispute:\n1. Go to the contract page\n2. Click 'Raise Dispute'\n3. Select the reason for dispute\n4. Provide evidence and explanation\n5. Submit for review\n\nOur team will review within 48 hours. Both parties can respond during the process.",
            "keywords": ["dispute", "problem", "issue", "refund", "not satisfied"],
            "category": "disputes"
        },
        "account_verification": {
            "question": "How do I verify my account?",
            "answer": "Verification steps:\n1. Go to Settings > Verification\n2. Upload government ID (passport, driver's license)\n3. Take a selfie for identity match\n4. Submit for review\n\nVerification typically takes 24-48 hours. Verified accounts get a badge and higher trust scores!",
            "keywords": ["verify", "verification", "kyc", "identity", "badge"],
            "category": "account"
        },
        "withdrawal_time": {
            "question": "How long do withdrawals take?",
            "answer": "Withdrawal processing times:\n• **PayPal**: Instant to 24 hours\n• **Bank Transfer**: 3-5 business days\n• **Wise**: 1-2 business days\n\nNote: First-time withdrawals may require additional verification.",
            "keywords": ["withdraw", "withdrawal", "time", "how long", "when"],
            "category": "payments"
        }
    }
    
    # TODO: migrate in-memory stores to database for persistence and scalability
    _MAX_CONVERSATIONS = 5000
    _MAX_MESSAGES_PER_CONVERSATION = 200
    _MAX_TICKETS = 2000

    def __init__(self):
        pass

    async def _get_conversation(self, conversation_id: str) -> Optional[Dict]:
        result = await execute_query("SELECT * FROM chatbot_conversations WHERE id = ?", [conversation_id])
        rows = parse_rows(result)
        if not rows:
            return None
        r = rows[0]
        r["intents_detected"] = json.loads(r.get("intents_detected") or "[]")
        r["sentiment_history"] = json.loads(r.get("sentiment_history") or "[]")
        r["context"] = json.loads(r.get("context") or "{}")
        r["escalated"] = bool(int(r.get("escalated", 0)))
        return r
    
    async def start_conversation(
        self,
        user_id: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Start a new chatbot conversation."""
        conversation_id = f"chat_{secrets.token_hex(12)}"
        now = datetime.now(timezone.utc).isoformat()

        await execute_query(
            """INSERT INTO chatbot_conversations
               (id, user_id, state, context, intents_detected, sentiment_history,
                escalated, started_at, last_activity)
               VALUES (?, ?, ?, ?, '[]', '[]', 0, ?, ?)""",
            [conversation_id, user_id, ConversationState.ACTIVE.value,
             json.dumps(context or {}), now, now]
        )

        greeting = await self._get_greeting(user_id, context)
        
        return {
            "conversation_id": conversation_id,
            "response": greeting,
            "suggested_topics": [
                "How to get started",
                "Payment questions",
                "Account help",
                "Report an issue"
            ]
        }
    
    async def send_message(
        self,
        conversation_id: str,
        message: str,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Process user message and generate response."""
        conversation = await self._get_conversation(conversation_id)
        if not conversation:
            return {"error": "Conversation not found"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Analyze message
        intent = self._classify_intent(message)
        sentiment = self._analyze_sentiment(message)
        
        # Store user message in DB
        msg_id = f"msg_{secrets.token_hex(8)}"
        await execute_query(
            """INSERT INTO chatbot_messages (id, conversation_id, role, content, intent, sentiment, timestamp)
               VALUES (?, ?, 'user', ?, ?, ?, ?)""",
            [msg_id, conversation_id, message, intent.value, sentiment.value, now]
        )
        
        # Update conversation intents/sentiment
        intents = conversation["intents_detected"]
        intents.append(intent.value)
        sentiments = conversation["sentiment_history"]
        sentiments.append(sentiment.value)
        await execute_query(
            """UPDATE chatbot_conversations SET last_activity = ?, intents_detected = ?, sentiment_history = ?
               WHERE id = ?""",
            [now, json.dumps(intents), json.dumps(sentiments), conversation_id]
        )
        conversation["intents_detected"] = intents
        conversation["sentiment_history"] = sentiments
        
        # Check for escalation triggers
        should_escalate = self._check_escalation_triggers(conversation, intent, sentiment)
        if should_escalate:
            return await self._escalate_to_agent(conversation_id, message)
        
        # Generate response
        response = await self._generate_response(conversation_id, message, intent, sentiment)
        
        # Store bot response
        bot_msg_id = f"msg_{secrets.token_hex(8)}"
        await execute_query(
            """INSERT INTO chatbot_messages (id, conversation_id, role, content, intent, sentiment, timestamp)
               VALUES (?, ?, 'assistant', ?, ?, ?, ?)""",
            [bot_msg_id, conversation_id, response["message"], intent.value, sentiment.value, now]
        )
        
        return {
            "conversation_id": conversation_id,
            "response": response["message"],
            "intent": intent.value,
            "sentiment": sentiment.value,
            "suggestions": response.get("suggestions", []),
            "actions": response.get("actions", []),
            "faq_matched": response.get("faq_matched")
        }
    
    async def get_conversation_history(
        self,
        conversation_id: str
    ) -> Dict[str, Any]:
        """Get conversation history."""
        conversation = await self._get_conversation(conversation_id)
        if not conversation:
            return {"error": "Conversation not found"}
        
        result = await execute_query(
            "SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY timestamp ASC",
            [conversation_id]
        )
        messages = parse_rows(result)
        
        return {
            "conversation": conversation,
            "messages": messages,
            "message_count": len(messages)
        }
    
    async def search_faq(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search FAQ database."""
        query_lower = query.lower()
        results = []
        
        for faq_id, faq in self.FAQ_DATABASE.items():
            if category and faq["category"] != category:
                continue
            
            # Score based on keyword matches
            score = 0
            for keyword in faq["keywords"]:
                if keyword in query_lower:
                    score += 2
            
            # Also check question text
            if any(word in faq["question"].lower() for word in query_lower.split()):
                score += 1
            
            if score > 0:
                results.append({
                    "id": faq_id,
                    "question": faq["question"],
                    "answer": faq["answer"],
                    "category": faq["category"],
                    "relevance_score": score
                })
        
        # Sort by relevance
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return results[:limit]
    
    async def create_support_ticket(
        self,
        conversation_id: str,
        user_id: int,
        subject: str,
        description: str,
        priority: str = "medium",
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a support ticket from conversation."""
        ticket_id = f"ticket_{secrets.token_hex(8)}"
        now = datetime.now(timezone.utc).isoformat()

        conversation = await self._get_conversation(conversation_id) or {}
        msgs_result = await execute_query(
            "SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY timestamp ASC",
            [conversation_id]
        )
        messages = parse_rows(msgs_result)

        sentiment_summary = self._summarize_sentiment(conversation.get("sentiment_history", []))
        conversation_summary = self._summarize_conversation(messages)

        await execute_query(
            """INSERT INTO chatbot_tickets
               (id, user_id, conversation_id, subject, description, priority, category,
                status, intents_detected, sentiment_summary, conversation_summary, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)""",
            [ticket_id, user_id, conversation_id, subject, description, priority,
             category or "general", json.dumps(conversation.get("intents_detected", [])),
             sentiment_summary, conversation_summary, now, now]
        )

        if conversation:
            await execute_query(
                "UPDATE chatbot_conversations SET ticket_id = ?, state = ? WHERE id = ?",
                [ticket_id, ConversationState.ESCALATED.value, conversation_id]
            )

        return {
            "ticket_id": ticket_id,
            "status": "created",
            "message": f"Support ticket #{ticket_id} created. Our team will respond within 24 hours."
        }
    
    async def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get support ticket details."""
        result = await execute_query("SELECT * FROM chatbot_tickets WHERE id = ?", [ticket_id])
        rows = parse_rows(result)
        if not rows:
            return None
        r = rows[0]
        r["intents_detected"] = json.loads(r.get("intents_detected") or "[]")
        return r
    
    async def close_conversation(
        self,
        conversation_id: str,
        resolution: Optional[str] = None
    ) -> Dict[str, Any]:
        """Close a conversation."""
        conversation = await self._get_conversation(conversation_id)
        if not conversation:
            return {"error": "Conversation not found"}
        
        now = datetime.now(timezone.utc).isoformat()
        await execute_query(
            "UPDATE chatbot_conversations SET state = ?, closed_at = ?, resolution = ? WHERE id = ?",
            [ConversationState.CLOSED.value, now, resolution, conversation_id]
        )
        
        return {
            "status": "closed",
            "message": "Thank you for chatting with us! Have a great day!"
        }

    def _classify_intent(self, message: str) -> ChatIntent:
        """Classify the intent of a message."""
        message_lower = message.lower()
        
        intent_scores = defaultdict(int)
        
        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    intent_scores[intent] += 1
        
        if intent_scores:
            return max(intent_scores.keys(), key=lambda x: intent_scores[x])
        
        return ChatIntent.UNKNOWN
    
    def _analyze_sentiment(self, message: str) -> SentimentLevel:
        """Analyze sentiment of a message."""
        message_lower = message.lower()
        
        scores = {
            SentimentLevel.VERY_NEGATIVE: 0,
            SentimentLevel.NEGATIVE: 0,
            SentimentLevel.NEUTRAL: 0,
            SentimentLevel.POSITIVE: 0,
            SentimentLevel.VERY_POSITIVE: 0
        }
        
        for level, keywords in self.SENTIMENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    scores[level] += 1
        
        # Get dominant sentiment
        max_score = max(scores.values())
        if max_score == 0:
            return SentimentLevel.NEUTRAL
        
        for level, score in scores.items():
            if score == max_score:
                return level
        
        return SentimentLevel.NEUTRAL
    
    def _check_escalation_triggers(
        self,
        conversation: Dict,
        intent: ChatIntent,
        sentiment: SentimentLevel
    ) -> bool:
        """Check if conversation should be escalated."""
        # Explicit request for agent
        if intent == ChatIntent.SPEAK_TO_AGENT:
            return True
        
        # Repeated negative sentiment
        sentiment_history = conversation.get("sentiment_history", [])
        negative_count = sum(
            1 for s in sentiment_history[-3:] 
            if s in [SentimentLevel.NEGATIVE.value, SentimentLevel.VERY_NEGATIVE.value]
        )
        if negative_count >= 2:
            return True
        
        # Repeated unknown intents
        intent_history = conversation.get("intents_detected", [])
        unknown_count = sum(
            1 for i in intent_history[-5:] 
            if i == ChatIntent.UNKNOWN.value
        )
        if unknown_count >= 3:
            return True
        
        # Complaint with very negative sentiment
        if intent == ChatIntent.COMPLAINT and sentiment == SentimentLevel.VERY_NEGATIVE:
            return True
        
        return False
    
    async def _generate_response(
        self,
        conversation_id: str,
        message: str,
        intent: ChatIntent,
        sentiment: SentimentLevel
    ) -> Dict[str, Any]:
        """Generate response based on intent."""
        response = {
            "message": "",
            "suggestions": [],
            "actions": []
        }
        
        # Handle based on intent
        if intent == ChatIntent.GREETING:
            response["message"] = "Hello! 👋 How can I help you today?"
            response["suggestions"] = [
                "I have a question about payments",
                "I need help with my account",
                "I want to post a project"
            ]
        
        elif intent == ChatIntent.GOODBYE:
            response["message"] = "Thank you for chatting! If you have more questions, feel free to ask. Have a great day! 😊"
            response["actions"] = [{"type": "close_conversation"}]
        
        elif intent == ChatIntent.HELP:
            # Search FAQ
            faq_results = await self.search_faq(message)
            if faq_results:
                top_result = faq_results[0]
                response["message"] = top_result["answer"]
                response["faq_matched"] = top_result["id"]
                
                if len(faq_results) > 1:
                    response["suggestions"] = [
                        f["question"] for f in faq_results[1:4]
                    ]
            else:
                response["message"] = "I'd be happy to help! Could you tell me more about what you need assistance with?\n\nHere are some common topics:"
                response["suggestions"] = [
                    "Account & Profile",
                    "Projects & Proposals",
                    "Payments & Billing",
                    "Technical Issues"
                ]
        
        elif intent == ChatIntent.ACCOUNT_QUESTION:
            faq_results = await self.search_faq(message, category="account")
            if faq_results:
                response["message"] = faq_results[0]["answer"]
                response["faq_matched"] = faq_results[0]["id"]
            else:
                response["message"] = "For account-related questions:\n\n• **Profile**: Update in Settings > Profile\n• **Password**: Reset via Settings > Security\n• **Verification**: Settings > Verification\n\nWhat specific account help do you need?"
        
        elif intent == ChatIntent.PROJECT_QUESTION:
            faq_results = await self.search_faq(message, category="projects")
            if faq_results:
                response["message"] = faq_results[0]["answer"]
                response["faq_matched"] = faq_results[0]["id"]
            else:
                response["message"] = "I can help with projects! What would you like to know?\n\n• How to post a project\n• Submitting proposals\n• Managing contracts\n• Milestones and deadlines"
        
        elif intent == ChatIntent.PAYMENT_QUESTION:
            faq_results = await self.search_faq(message, category="payments")
            if faq_results:
                response["message"] = faq_results[0]["answer"]
                response["faq_matched"] = faq_results[0]["id"]
            else:
                response["message"] = "For payment questions:\n\n• **Escrow**: Secures payments until work is approved\n• **Fees**: 10% for freelancers, free for clients\n• **Withdrawals**: PayPal, bank transfer, or Wise\n\nWhat specifically would you like to know?"
        
        elif intent == ChatIntent.TECHNICAL_ISSUE:
            response["message"] = "I'm sorry you're experiencing issues! 😔\n\nCould you please describe:\n1. What you were trying to do\n2. What error or issue you saw\n3. What device/browser you're using\n\nThis will help me assist you better, or I can create a support ticket."
            response["actions"] = [{"type": "offer_ticket"}]
        
        elif intent == ChatIntent.COMPLAINT:
            # Acknowledge and offer help
            if sentiment in [SentimentLevel.VERY_NEGATIVE, SentimentLevel.NEGATIVE]:
                response["message"] = "I'm really sorry to hear you're having a difficult experience. Your feedback is important to us. 🙏\n\nWould you like me to:\n1. Help resolve your issue right now\n2. Connect you with a support specialist\n3. Create a formal complaint ticket"
                response["actions"] = [{"type": "offer_escalation"}]
            else:
                response["message"] = "I'm sorry things aren't going smoothly. Let me try to help resolve this for you. What's the main issue you're facing?"
        
        elif intent == ChatIntent.FEEDBACK:
            response["message"] = "Thank you for your feedback! 💡 We love hearing from our users.\n\nI'll make sure this gets to our team. Is there anything specific you'd like to elaborate on?"
            response["actions"] = [{"type": "log_feedback"}]
        
        else:
            # Try to generate response using local AI service
            ai_response = await self._generate_ai_response(message)
            if ai_response:
                response["message"] = ai_response
            else:
                # Default fallback if AI fails
                response["message"] = "I'm not quite sure I understood that. Could you rephrase or choose from these topics?"
                response["suggestions"] = [
                    "Account help",
                    "Project questions",
                    "Payment issues",
                    "Speak to support"
                ]
        
        return response

    async def _generate_ai_response(self, prompt: str) -> Optional[str]:
        """Generate response using local AI service."""
        import httpx
        import os
        
        ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
        try:
            async with httpx.AsyncClient() as client:
                # Add context to the prompt to keep it focused
                context_prompt = f"You are MegiBot, a helpful AI assistant for a freelancing platform called MegiLance. Answer the following user question politely and concisely: {prompt}"
                
                response = await client.post(
                    f"{ai_service_url}/ai/generate",
                    json={
                        "prompt": context_prompt,
                        "max_length": 150
                    },
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("text")
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return None

    
    async def _escalate_to_agent(
        self,
        conversation_id: str,
        last_message: str
    ) -> Dict[str, Any]:
        """Escalate conversation to human agent."""
        now = datetime.now(timezone.utc).isoformat()
        await execute_query(
            "UPDATE chatbot_conversations SET escalated = 1, state = ?, escalated_at = ? WHERE id = ?",
            [ConversationState.ESCALATED.value, now, conversation_id]
        )
        
        return {
            "conversation_id": conversation_id,
            "response": "I'll connect you with a support specialist who can better assist you. 🙋\n\nA team member will join this chat shortly. Average wait time is under 5 minutes.\n\nIn the meantime, please share any additional details about your issue.",
            "escalated": True,
            "estimated_wait": "5 minutes"
        }
    
    async def _get_greeting(
        self,
        user_id: Optional[int],
        context: Optional[Dict]
    ) -> str:
        """Generate personalized greeting."""
        hour = datetime.now(timezone.utc).hour
        
        if hour < 12:
            time_greeting = "Good morning"
        elif hour < 17:
            time_greeting = "Good afternoon"
        else:
            time_greeting = "Good evening"
        
        greeting = f"{time_greeting}! 👋 I'm MegiBot, your AI assistant.\n\n"
        greeting += "I can help you with:\n"
        greeting += "• Account & Profile questions\n"
        greeting += "• Projects & Proposals\n"
        greeting += "• Payments & Billing\n"
        greeting += "• Technical support\n\n"
        greeting += "What can I help you with today?"
        
        return greeting
    
    def _summarize_sentiment(self, sentiment_history: List[str]) -> str:
        """Summarize sentiment history."""
        if not sentiment_history:
            return "neutral"
        
        from collections import Counter
        counts = Counter(sentiment_history)
        most_common = counts.most_common(1)[0][0]
        return most_common
    
    def _summarize_conversation(self, messages: List[Dict]) -> str:
        """Summarize conversation for ticket."""
        if not messages:
            return "No messages"
        
        user_messages = [m for m in messages if m.get("role") == "user"]
        
        if not user_messages:
            return "No user messages"
        
        summary = f"Conversation with {len(messages)} messages.\n"
        summary += f"User queries: {len(user_messages)}\n"
        summary += f"First message: {user_messages[0].get('content', '')[:100]}...\n"
        summary += f"Last message: {user_messages[-1].get('content', '')[:100]}..."
        
        return summary


# Singleton instance
_chatbot_service: Optional[AIChatbotService] = None


def get_chatbot_service() -> AIChatbotService:
    """Get or create chatbot service instance."""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = AIChatbotService()
    return _chatbot_service
