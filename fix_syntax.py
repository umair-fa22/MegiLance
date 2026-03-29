with open("E:/MegiLance/backend/app/services/multicurrency_payments.py", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('                "note": "MOCK_DUE_TO_WEB3_ERROR"\\n\\n\\n    async def _process_stripe_payment', '                "note": "MOCK_DUE_TO_WEB3_ERROR"\\n            }\\n\\n    async def _process_stripe_payment')

with open("E:/MegiLance/backend/app/services/multicurrency_payments.py", "w", encoding="utf-8") as f:
    f.write(text)
