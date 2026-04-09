import asyncio
from sqlalchemy import text
from database import engine
from models import Base
import bcrypt

async def init_db():
    """Initialize database tables and create admin user"""
    try:
        async with engine.begin() as conn:
            # Create crm_users table
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS crm_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    role VARCHAR(50) NOT NULL DEFAULT 'supervisor',
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                )
            """))
            
            # Create index
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_email ON crm_users(email)
            """))
            
            # Check if admin user exists
            result = await conn.execute(text("SELECT COUNT(*) FROM crm_users WHERE email = 'admin@mrpitani.com'"))
            count = result.scalar()
            
            if count == 0:
                # Create admin user
                password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                await conn.execute(text("""
                    INSERT INTO crm_users (email, password_hash, full_name, role)
                    VALUES ('admin@mrpitani.com', :password_hash, 'Admin User', 'admin')
                """), {"password_hash": password_hash})
                print("✓ Admin user created: admin@mrpitani.com / admin123")
            else:
                print("✓ Admin user already exists")
            
            print("✓ Database initialized successfully")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db())
