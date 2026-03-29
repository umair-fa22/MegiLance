import os
import shutil
import re

source_dir = 'backend/app/api/v1'
domains = {
    'identity': ['auth.py', 'users.py', 'two_factor.py', 'social_login.py', 'api_keys.py', 'verification.py', 'admin.py'],
    'projects_domain': ['projects.py', 'proposals.py', 'categories.py', 'skills.py', 'favorites.py', 'contracts.py', 'milestones.py', 'portfolio.py', 'gigs.py'],
    'payments_domain': ['payments.py', 'escrow.py', 'invoices.py', 'stripe.py', 'multicurrency.py', 'wallet.py', 'pakistan_payments.py', 'refunds.py', 'subscription_billing.py'],
    'chat': ['messages.py', 'websocket.py', 'team_collaboration.py', 'video_communication.py', 'comments.py'],
    'ai': ['ai_advanced.py', 'ai_matching.py', 'ai_services.py', 'ai_writing.py', 'chatbot.py', 'fraud_detection.py', 'skill_analyzer.py'],
    'reviews_domain': ['reviews.py', 'user_feedback.py', 'disputes.py']
}

domain_map = {}
for domain, files in domains.items():
    for f in files:
        domain_map[f] = domain

for file in os.listdir(source_dir):
    if file.endswith('.py') and file != '__init__.py':
        target_domain = domain_map.get(file, 'core_domain')
        
        target_path = os.path.join(source_dir, target_domain)
        os.makedirs(target_path, exist_ok=True)
        
        src = os.path.join(source_dir, file)
        dst = os.path.join(target_path, file)
        
        if os.path.isfile(src):
            shutil.move(src, dst)

print('Moved routes to domains.')
