import os
from dotenv import load_dotenv
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv()

turso_url = os.getenv("TURSO_DATABASE_URL")
turso_token = os.getenv("TURSO_AUTH_TOKEN")

print("=== TURSO DATABASE CONNECTION TEST ===\n")
print(f"Database URL: {turso_url}")
print(f"Token exists: {bool(turso_token)}")
print(f"Token length: {len(turso_token) if turso_token else 0}\n")

try:
    # Convert libsql:// to https://
    url = turso_url.replace("libsql://", "https://")
    if not url.endswith("/"):
        url += "/"
    
    print(f"HTTP URL: {url}\n")
    
    # Create session with retries (same as app uses)
    session = requests.Session()
    adapter = HTTPAdapter(
        pool_connections=10,
        pool_maxsize=10,
        max_retries=Retry(
            total=2,
            backoff_factor=0.3,
            status_forcelist=[502, 503, 504],
            allowed_methods=["POST"],
        ),
    )
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "Authorization": f"Bearer {turso_token}",
        "Content-Type": "application/json",
    })
    
    # Test 1: Connection test
    print("=== TEST 1: Connection Test ===")
    response = session.post(
        url,
        json={
            "statements": [{
                "q": "SELECT 1 as connected",
                "params": []
            }]
        },
        timeout=30
    )
    
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {data}\n")
        print("✅ Connection successful!\n")
    else:
        print(f"❌ Error: {response.text}\n")
        exit(1)
    
    # Test 2: Get table count
    print("=== TEST 2: List Database Tables ===")
    response = session.post(
        url,
        json={
            "statements": [{
                "q": "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
                "params": []
            }]
        },
        timeout=30
    )
    
    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            result = data[0].get("results", {})
            rows = result.get("rows", [])
            tables = [row[0] for row in rows]
            
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table}")
            
            print(f"\n✅ PASS: Turso connected, database has {len(tables)} tables")
        else:
            print(f"Empty response: {data}")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        exit(1)
    
except Exception as e:
    print(f"❌ FAIL: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
