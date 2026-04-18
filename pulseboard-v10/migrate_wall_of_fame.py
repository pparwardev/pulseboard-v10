#!/usr/bin/env python3
"""
Wall of Fame Database Migration
Run this script to create Wall of Fame tables in the database.
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from sqlalchemy import create_engine, text, inspect
    from app.core.config import settings
    from app.core.database import Base
    from app.models.wall_of_fame import WallPost, WallReaction, WallComment
    
    print("🚀 Starting Wall of Fame migration...")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Check if tables already exist
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    wall_tables = ['wall_posts', 'wall_reactions', 'wall_comments']
    missing_tables = [table for table in wall_tables if table not in existing_tables]
    
    if not missing_tables:
        print("✅ All Wall of Fame tables already exist!")
    else:
        print(f"🔧 Creating missing tables: {missing_tables}")
        
        # Create only Wall of Fame tables
        Base.metadata.create_all(bind=engine, tables=[
            WallPost.__table__,
            WallReaction.__table__,
            WallComment.__table__
        ])
        
        print("✅ Wall of Fame tables created successfully!")
    
    # Verify tables exist and show structure
    with engine.connect() as conn:
        for table in wall_tables:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"📋 Table '{table}': {count} records")
            except Exception as e:
                print(f"❌ Error checking table '{table}': {e}")
    
    print("🎉 Wall of Fame migration completed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Run: cd backend && pip install -r requirements.txt")
except Exception as e:
    print(f"❌ Migration error: {e}")
    print("💡 Make sure PostgreSQL is running and credentials are correct")

if __name__ == "__main__":
    pass