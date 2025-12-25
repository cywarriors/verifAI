#!/usr/bin/env python
"""Create a default admin user for SecureAI"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal, engine
from app.db.models import Base, User, UserRole
from app.core.security import get_password_hash

def create_default_user():
    """Create default admin user"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin user already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Default admin user already exists!")
            print(f"Username: admin")
            print("You can reset the password by deleting the user and running this script again.")
            return
        
        # Create default admin user
        default_password = "admin123"  # Change this in production!
        hashed_password = get_password_hash(default_password)
        
        admin_user = User(
            username="admin",
            email="admin@secureai.local",
            hashed_password=hashed_password,
            full_name="Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print("=" * 50)
        print("Default admin user created successfully!")
        print("=" * 50)
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Email: admin@secureai.local")
        print()
        print("⚠️  WARNING: Change this password immediately in production!")
        print("=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"Error creating default user: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_default_user()

