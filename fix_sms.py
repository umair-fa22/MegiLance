import re

with open("E:/MegiLance/backend/app/services/identity_verification.py", "r", encoding="utf-8") as f:
    text = f.read()

replacement = """        # Generate and store verification code
        code = str(secrets.randbelow(900000) + 100000)
        
        # Real Twilio Integration
        try:
            from twilio.rest import Client
            import os
            
            TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
            TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
            TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
            
            if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
                client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                message = client.messages.create(
                    body=f"Your MegiLance verification code is: {code} \\nValid for 15 minutes.",
                    from_=TWILIO_PHONE_NUMBER,
                    to=phone_number
                )
                logger.info(f"SMS sent successfully via Twilio to {phone_number}. SID: {message.sid}")
            else:
                logger.info(f"Twilio not configured. MOCK SMS: Code {code} for phone {phone_number}")
                
        except Exception as e:
            logger.error(f"Failed to send SMS using Twilio: {str(e)}")
            # Fallback to mock behavior on exception so UI doesn't crash during dev
            pass"""

old_str = """        # Generate and store verification code
        code = str(secrets.randbelow(900000) + 100000)"""

text = text.replace(old_str, replacement)

with open("E:/MegiLance/backend/app/services/identity_verification.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Injected Twilio SMS integration!")
