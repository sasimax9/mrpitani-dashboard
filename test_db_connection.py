import asyncio
import sys
import os
sys.path.append('/app/backend')

from database import engine
from models import Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def test_connection():
    """Test database connection and create tables if needed"""
    try:
        print("Testing database connection...")
        
        # Test basic connection
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            
            # Create tables if they don't exist
            print("Creating tables if they don't exist...")
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Tables created/verified")
            
            # Check if tables exist
            tables_query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            """
            result = await conn.execute(text(tables_query))
            tables = result.fetchall()
            print(f"✅ Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
                
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

async def main():
    success = await test_connection()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))