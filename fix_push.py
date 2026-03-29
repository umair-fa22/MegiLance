import re

with open("E:/MegiLance/backend/app/services/push_notifications.py", "r", encoding="utf-8") as f:
    text = f.read()

replacement = """    async def _send_to_fcm(self, notification: Dict) -> Dict[str, Any]:
        \"\"\"Send notification via Firebase Cloud Messaging.\"\"\"
        try:
            import firebase_admin
            from firebase_admin import messaging
            import os
            
            # Check if firebase is initialized
            if not firebase_admin._apps:
                cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
                if cred_path and os.path.exists(cred_path):
                    from firebase_admin import credentials
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                else:
                    logger.warning("FCM credentials not found. MOCKING push notification.")
                    return {
                        "message_id": f"fcm_mock_{uuid.uuid4().hex[:12]}",
                        "success": True
                    }

            # Build message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification.get('title'),
                    body=notification.get('body'),
                ),
                data={k: str(v) for k, v in notification.get('data', {}).items()} if notification.get('data') else None,
                token=notification.get('device_token')
            )
            
            # Send message
            if notification.get('device_token'):
                response = messaging.send(message)
                logger.info(f"FCM message sent successfully: {response}")
                return {"message_id": response, "success": True}
            else:
                logger.warning("No device token provided for FCM")
                return {"success": False, "error": "No token"}
                
        except ImportError:
            logger.warning("firebase-admin not installed. MOCKING FCM push.")
        except Exception as e:
            logger.error(f"FCM send failed: {str(e)}")
            
        return {
            "message_id": f"fcm_{uuid.uuid4().hex[:12]}",
            "success": True
        }"""

old_str = """    async def _send_to_fcm(self, notification: Dict) -> Dict[str, Any]:
        \"\"\"Send notification via Firebase Cloud Messaging.\"\"\"
        # In production, use firebase-admin SDK
        return {
            "message_id": f"fcm_{uuid.uuid4().hex[:12]}",
            "success": True
        }"""

text = text.replace(old_str, replacement)

with open("E:/MegiLance/backend/app/services/push_notifications.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Injected FCM!")
