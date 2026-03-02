"""Comprehensive API endpoint test - validates all routes return proper responses."""
import requests
import json
import sys
import time

BASE = 'http://localhost:8000'

def test():
    # Login as freelancer
    r = requests.post(f'{BASE}/api/auth/login', json={
        'email': 'test_audit_1772431209@example.com', 'password': 'TestPass123!'
    })
    if r.status_code != 200:
        print("Login failed, registering new user...")
        r = requests.post(f'{BASE}/api/auth/register', json={
            'email': f'sysaudit_{int(time.time())}@test.com',
            'password': 'TestPass123!', 'full_name': 'System Audit', 'role': 'freelancer'
        })
        email = r.json().get('email')
        r = requests.post(f'{BASE}/api/auth/login', json={'email': email, 'password': 'TestPass123!'})
    
    token = r.json().get('access_token', '')
    H = {'Authorization': f'Bearer {token}'}
    
    endpoints = [
        # === AUTH ===
        ("GET", "/api/auth/me", H),
        
        # === PORTAL - FREELANCER ===
        ("GET", "/api/portal/freelancer/dashboard", H),
        ("GET", "/api/portal/freelancer/stats", H),
        ("GET", "/api/portal/freelancer/projects", H),
        ("GET", "/api/portal/freelancer/proposals", H),
        ("GET", "/api/portal/freelancer/wallet", H),
        ("GET", "/api/portal/freelancer/earnings", H),
        ("GET", "/api/portal/freelancer/reviews", H),
        ("GET", "/api/portal/freelancer/notifications", H),
        
        # === PORTAL - CLIENT ===
        ("GET", "/api/portal/client/dashboard/stats", H),
        ("GET", "/api/portal/client/projects", H),
        ("GET", "/api/portal/client/proposals", H),
        ("GET", "/api/portal/client/payments", H),
        ("GET", "/api/portal/client/wallet", H),
        ("GET", "/api/portal/client/spending/monthly", H),
        
        # === PROJECTS ===
        ("GET", "/api/projects/browse", H),
        ("GET", "/api/projects/recommended", H),
        ("GET", "/api/projects/my-projects", H),
        
        # === PROPOSALS ===
        ("GET", "/api/proposals/my-proposals", H),
        
        # === CONTRACTS ===
        ("GET", "/api/contracts/", H),
        
        # === MILESTONES ===
        ("GET", "/api/milestones", H),
        
        # === MESSAGES ===
        ("GET", "/api/messages", H),
        ("GET", "/api/messages/conversations", H),
        
        # === NOTIFICATIONS ===
        ("GET", "/api/notifications", H),
        ("GET", "/api/notifications/unread-count", H),
        
        # === REVIEWS ===
        ("GET", "/api/reviews", H),
        ("GET", "/api/reviews/received", H),
        ("GET", "/api/reviews/given", H),
        
        # === DISPUTES ===
        ("GET", "/api/disputes", H),
        
        # === PAYMENTS ===
        ("GET", "/api/payments/", H),
        
        # === WALLET ===
        ("GET", "/api/wallet/balance", H),
        ("GET", "/api/wallet/transactions", H),
        
        # === ESCROW ===
        ("GET", "/api/escrow/", H),
        
        # === INVOICES ===
        ("GET", "/api/invoices/", H),
        
        # === REFUNDS ===
        ("GET", "/api/refunds/", H),
        
        # === GIGS ===
        ("GET", "/api/gigs", H),
        ("GET", "/api/gigs/seller/my-gigs", H),
        
        # === FREELANCERS (PUBLIC) ===
        ("GET", "/api/freelancers/featured", None),
        ("GET", "/api/freelancers/search", None),
        
        # === CATEGORIES ===
        ("GET", "/api/categories/", None),
        
        # === SKILLS ===
        ("GET", "/api/skills/", None),
        
        # === TAGS ===
        ("GET", "/api/tags/", None),
        
        # === BLOG ===
        ("GET", "/api/blog/", None),
        
        # === SEARCH ===
        ("GET", "/api/search/projects", H),
        ("GET", "/api/search/freelancers", H),
        
        # === COMMUNITY ===
        ("GET", "/api/community/questions", H),
        ("GET", "/api/community/playbooks", H),
        ("GET", "/api/community/office-hours", H),
        
        # === EXTERNAL PROJECTS ===
        ("GET", "/api/external-projects", None),
        ("GET", "/api/external-projects-categories", None),
        
        # === SELLER STATS ===
        ("GET", "/api/seller-stats/me", H),
        ("GET", "/api/seller-stats/levels", None),
        ("GET", "/api/seller-stats/leaderboard", None),
        
        # === AI ===
        ("GET", "/api/ai/recommend-jobs/66", H),
        
        # === AI ADVANCED ===
        ("GET", "/api/ai-advanced/model-stats", H),
        
        # === ACTIVITY FEED ===
        ("GET", "/api/activity/feed", H),
        ("GET", "/api/activity/stats", H),
        
        # === ANALYTICS ===
        ("GET", "/api/analytics/dashboard/freelancer", H),
        ("GET", "/api/analytics/dashboard/summary", H),
        ("GET", "/api/analytics/platform/health", H),
        
        # === TEAMS ===
        ("GET", "/api/teams/teams/my-teams", H),
        
        # === WORKROOM ===
        ("GET", "/api/workroom/my-workrooms", H),
        
        # === SUPPORT TICKETS ===
        ("GET", "/api/support-tickets/", H),
        
        # === SAVED SEARCHES === 
        ("GET", "/api/saved-searches", H),
        
        # === JOB ALERTS ===
        ("GET", "/api/job-alerts/", H),
        
        # === AVAILABILITY ===
        ("GET", "/api/availability/schedule", H),
        ("GET", "/api/availability/settings", H),
        
        # === RATE CARDS ===
        ("GET", "/api/rate-cards/my-cards", H),
        
        # === PROPOSAL TEMPLATES ===
        ("GET", "/api/proposal-templates/", H),
        
        # === TIME ENTRIES ===
        ("GET", "/api/time-entries/", H),
        
        # === FAVORITES ===
        ("GET", "/api/favorites/", H),
        
        # === PORTFOLIO ===
        ("GET", "/api/portfolio/", H),
        
        # === REFERRALS ===
        ("GET", "/api/referrals/", H),
        
        # === VERIFICATION ===
        ("GET", "/api/verification/status", H),
        
        # === KNOWLEDGE BASE ===
        ("GET", "/api/knowledge-base/categories", None),
        ("GET", "/api/knowledge-base/articles", None),
        
        # === LEARNING CENTER ===
        ("GET", "/api/learning/courses", None),
        
        # === ADMIN ===
        ("GET", "/api/admin/dashboard/stats", H),
        ("GET", "/api/admin/users", H),
        
        # === AI WRITING ===
        ("GET", "/api/ai-writing/ai-writing/templates", H),
        ("GET", "/api/ai-writing/ai-writing/usage", H),
        
        # === NOTIFICATION PREFERENCES ===
        ("GET", "/api/notification-preferences", H),
        
        # === TWO FACTOR ===
        ("GET", "/api/2fa/status", H),
        
        # === COMPLIANCE ===
        ("GET", "/api/compliance/data-request/status", H),
        
        # === FEATURE FLAGS ===
        ("GET", "/api/feature-flags/flags", H),
        
        # === HEALTH ===
        ("GET", "/api/health/live", None),
        ("GET", "/api/health/ready", None),
    ]
    
    ok = 0
    fail = 0
    errors = []
    
    for method, path, headers in endpoints:
        try:
            if method == "GET":
                r = requests.get(f'{BASE}{path}', headers=headers or {}, timeout=10)
            else:
                r = requests.post(f'{BASE}{path}', json={}, headers=headers or {}, timeout=10)
            
            status = r.status_code
            if status < 400:
                ok += 1
                tag = "OK"
            elif status == 422:
                ok += 1  # Validation error = endpoint exists and works
                tag = "VALID"
            elif status == 401:
                fail += 1
                tag = "NOAUTH"
                errors.append((path, status, r.text[:100]))
            elif status == 403:
                ok += 1  # Forbidden = endpoint works, just wrong role
                tag = "FORBID"
            elif status == 404:
                fail += 1
                tag = "404"
                errors.append((path, status, r.text[:100]))
            elif status >= 500:
                fail += 1
                tag = "ERROR"
                errors.append((path, status, r.text[:200]))
            else:
                fail += 1
                tag = str(status)
                errors.append((path, status, r.text[:100]))
            
            body_preview = r.text[:60].replace('\n', ' ')
            print(f"[{tag:>6}] {method:4} {path:<55} {body_preview}")
        except Exception as e:
            fail += 1
            print(f"[EXCEP] {method:4} {path:<55} {str(e)[:60]}")
            errors.append((path, "EXCEPT", str(e)[:100]))
    
    print(f"\n{'='*70}")
    print(f"RESULTS: {ok} OK, {fail} FAILED out of {len(endpoints)} endpoints")
    print(f"{'='*70}")
    
    if errors:
        print(f"\nFAILED ENDPOINTS ({len(errors)}):")
        for path, status, msg in errors:
            print(f"  [{status}] {path}: {msg}")
    
    return fail == 0

if __name__ == "__main__":
    success = test()
    sys.exit(0 if success else 1)
