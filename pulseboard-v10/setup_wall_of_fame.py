#!/usr/bin/env python3
"""
Wall of Fame Setup Script
This script ensures all Wall of Fame components are properly set up.
"""

import sys
import os
sys.path.append('backend')

try:
    from sqlalchemy import create_engine, text
    from backend.app.core.config import settings
    from backend.app.models.wall_of_fame import WallPost, WallReaction, WallComment
    from backend.app.core.database import Base
    
    print("✅ All imports successful")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Create tables
    print("🔧 Creating Wall of Fame tables...")
    Base.metadata.create_all(bind=engine, tables=[
        WallPost.__table__,
        WallReaction.__table__,
        WallComment.__table__
    ])
    
    print("✅ Wall of Fame database tables created successfully!")
    
    # Verify tables exist
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'wall_%'"))
        tables = [row[0] for row in result]
        print(f"📋 Found tables: {tables}")
    
    print("🎉 Wall of Fame setup completed successfully!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Make sure to install dependencies: pip install -r backend/requirements.txt")
except Exception as e:
    print(f"❌ Setup error: {e}")
    print("💡 Make sure PostgreSQL is running and database exists")