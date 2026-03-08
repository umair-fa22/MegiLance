# @AI-HINT: CLI script to fetch live projects — thin wrapper around the service
"""
Fetch Live Projects CLI
========================
Usage:
  cd backend
  python scripts/fetch_live_projects.py                    # Fetch from all 3 APIs (25 each)
  python scripts/fetch_live_projects.py --limit 50         # Fetch 50 per source
  python scripts/fetch_live_projects.py --sources remoteok remotive  # Specific sources only
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from app.services.live_project_fetcher import main
main()
