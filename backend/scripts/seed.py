import os
import sys

# Ensure app is in Python import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.organization import Organization
from app.models.user_profile import UserProfile

db = SessionLocal()

try:
    # Create Organization
    org = db.query(Organization).filter(Organization.name == "BidWise AI").first()
    if not org:
        org = Organization(
            name="BidWise AI",
            industry="Software",
            website="https://bidwise.ai"
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        print("Organization created.")
    else:
        print("Organization already exists.")

    # Create User
    user = db.query(UserProfile).filter(UserProfile.auth_user_id == "seed_user_pranav").first()
    if not user:
        user = UserProfile(
            organization_id=org.id,
            auth_user_id="seed_user_pranav",
            full_name="Pranav",
            role="Admin"
        )
        db.add(user)
        db.commit()
        print("User created.")
    else:
        print("User already exists.")

    print("Seed completed successfully!")

finally:
    db.close()