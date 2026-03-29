import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy.orm import Session
from database import SessionLocal
import models

def make_admin(email: str):
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"Error: User with email '{email}' not found.")
        db.close()
        return
    
    user.role = models.RoleEnum.admin
    db.commit()
    print(f"Success: User '{email}' has been promoted to Admin.")
    db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <user_email>")
        sys.exit(1)
    
    make_admin(sys.argv[1])
