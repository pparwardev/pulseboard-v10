#!/usr/bin/env python3
"""
Wall of Fame Verification Script
Checks if all Wall of Fame files are in place without requiring dependencies.
"""

import os
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and print status."""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - MISSING")
        return False

def check_content_in_file(filepath, content, description):
    """Check if specific content exists in a file."""
    try:
        with open(filepath, 'r') as f:
            file_content = f.read()
            if content in file_content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - NOT FOUND")
                return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False

def main():
    print("🔍 Wall of Fame Verification Report")
    print("=" * 50)
    
    base_path = "/home/pparwar/pulseboard-v10"
    
    # Backend files
    print("\n📁 Backend Files:")
    backend_files = [
        (f"{base_path}/backend/app/models/wall_of_fame.py", "Wall of Fame Models"),
        (f"{base_path}/backend/app/api/wall_of_fame.py", "Wall of Fame API"),
    ]
    
    backend_ok = all(check_file_exists(filepath, desc) for filepath, desc in backend_files)
    
    # Frontend files
    print("\n📁 Frontend Files:")
    frontend_files = [
        (f"{base_path}/frontend/src/pages/WallOfFamePage.tsx", "Wall of Fame Page Component"),
    ]
    
    frontend_ok = all(check_file_exists(filepath, desc) for filepath, desc in frontend_files)
    
    # Configuration checks
    print("\n⚙️ Configuration Checks:")
    
    # Check if API is registered in main.py
    main_py_path = f"{base_path}/backend/app/main.py"
    api_registered = check_content_in_file(
        main_py_path, 
        "wall_of_fame_router", 
        "Wall of Fame API registered in main.py"
    )
    
    # Check if models are imported
    models_init_path = f"{base_path}/backend/app/models/__init__.py"
    models_imported = check_content_in_file(
        models_init_path,
        "wall_of_fame",
        "Wall of Fame models imported"
    )
    
    # Check if route exists in App.tsx
    app_tsx_path = f"{base_path}/frontend/src/App.tsx"
    route_exists = check_content_in_file(
        app_tsx_path,
        "/wall-of-fame",
        "Wall of Fame route in App.tsx"
    )
    
    # Check if navigation exists in DashboardLayout.tsx
    layout_path = f"{base_path}/frontend/src/layouts/DashboardLayout.tsx"
    nav_exists = check_content_in_file(
        layout_path,
        "Wall of Fame",
        "Wall of Fame in navigation menu"
    )
    
    print("\n📊 Summary:")
    print(f"Backend Files: {'✅ OK' if backend_ok else '❌ Issues'}")
    print(f"Frontend Files: {'✅ OK' if frontend_ok else '❌ Issues'}")
    print(f"API Registration: {'✅ OK' if api_registered else '❌ Issues'}")
    print(f"Models Import: {'✅ OK' if models_imported else '❌ Issues'}")
    print(f"Frontend Route: {'✅ OK' if route_exists else '❌ Issues'}")
    print(f"Navigation Menu: {'✅ OK' if nav_exists else '❌ Issues'}")
    
    all_ok = all([backend_ok, frontend_ok, api_registered, models_imported, route_exists, nav_exists])
    
    print(f"\n🎯 Overall Status: {'✅ Wall of Fame is properly configured!' if all_ok else '❌ Some issues found'}")
    
    if all_ok:
        print("\n🚀 Next Steps:")
        print("1. Install backend dependencies: cd backend && pip install -r requirements.txt")
        print("2. Run database migration: python3 migrate_wall_of_fame.py")
        print("3. Start backend: cd backend && python3 main.py")
        print("4. Start frontend: cd frontend && npm run dev")
        print("5. Access Wall of Fame at: http://localhost:3001/wall-of-fame")

if __name__ == "__main__":
    main()