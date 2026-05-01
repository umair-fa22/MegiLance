import os

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# generate_message
old_func = '''    async def generate_message(
        self,
        user_id: int,
        context: str,
        intent: str,
        recipient_name: Optional[str] = None,
        tone: ToneStyle = ToneStyle.FRIENDLY
    ) -> Dict[str, Any]:
        \"\"\"Generate a professional message.\"\"\"
        await self._ensure_tables()
        
        name_greeting = f' {recipient_name}' if recipient_name else ''
        
        messages = {
            "inquiry": f\"\"\"Hi{name_greeting},

I came across your project and I'm very interested in learning more about it. {context}

Could you please share more details about:
1. The specific requirements
2. Your expected timeline
3. Any preferences for collaboration

Looking forward to hearing from you!

Best regards\"\"\",
            "follow_up": f\"\"\"Hi{name_greeting},

I wanted to follow up on our previous conversation about {context}.

Have you had a chance to review the details we discussed? I'm eager to move forward and would be happy to address any questions or concerns you might have.

Please let me know how you'd like to proceed.

Best regards\"\"\",
            "introduction": f\"\"\"Hi{name_greeting},

I'm reaching out to introduce myself. {context}

I believe my skills and experience would be a great fit for your needs. I'd love the opportunity to discuss how I can help you achieve your goals.

Would you be available for a brief chat this week?

Best regards\"\"\",
            "negotiation": f\"\"\"Hi{name_greeting},

Thank you for considering me for this opportunity. {context}

After reviewing the project scope, I'd like to discuss the terms to ensure we're aligned on expectations. I'm confident we can find an arrangement that works well for both of us.

Looking forward to your thoughts.

Best regards\"\"\"
        }
        
        message = messages.get(intent, messages["inquiry"])
        gen_id = str(uuid.uuid4())'''

new_func = '''    async def generate_message(
        self,
        user_id: int,
        context: str,
        intent: str,
        recipient_name: Optional[str] = None,
        tone: ToneStyle = ToneStyle.FRIENDLY
    ) -> Dict[str, Any]:
        \"\"\"Generate a professional message.\"\"\"
        await self._ensure_tables()
        
        prompt = f\"Write a professional message focused on {intent}.\\nContext: {context}\\nRecipient: {recipient_name or 'the client'}\\nTone: {tone.value}. Keep it concise and natural.\"
        message = await llm_gateway.generate_text(prompt, system_message=\"You are an expert communicator crafting the perfect message.\")
        
        if not message:
            message = f\"Hi {recipient_name or ''}, let's discuss your project further. {context}\"
            
        gen_id = str(uuid.uuid4())'''

content = content.replace(old_func, new_func)

# Save
with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated generate_message")
