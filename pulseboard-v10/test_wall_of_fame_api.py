#!/usr/bin/env python3
"""
Wall of Fame API Test Script
Tests if the Wall of Fame API endpoints are properly configured.
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    print("🧪 Testing Wall of Fame API endpoints...")
    
    client = TestClient(app)
    
    # Test if the app starts
    response = client.get("/")
    print(f"✅ App root endpoint: {response.status_code}")
    
    # Test Wall of Fame endpoints (these will fail without auth, but should return 401, not 404)
    endpoints_to_test = [
        "/api/wall/posts",
        "/api/wall/team-members"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = client.get(endpoint)
            if response.status_code == 404:
                print(f"❌ Endpoint {endpoint}: Not Found (404)")
            elif response.status_code == 401:
                print(f"✅ Endpoint {endpoint}: Requires Auth (401) - Endpoint exists!")
            else:
                print(f"✅ Endpoint {endpoint}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ Endpoint {endpoint}: Error - {e}")
    
    print("🎉 Wall of Fame API test completed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Run: cd backend && pip install -r requirements.txt")
except Exception as e:
    print(f"❌ Test error: {e}")

if __name__ == "__main__":
    pass