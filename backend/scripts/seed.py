import os
import sys

# Ensure app is in Python import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.organization import Organization
from app.models.user_profile import UserProfile
<<<<<<< HEAD
=======
from app.models.rfp import RFP
from app.models.analysis import Analysis
from app.models.requirement import Requirement
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)

db = SessionLocal()

try:
<<<<<<< HEAD
    # Create Organization
=======
    # 1. Create Organization
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
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

<<<<<<< HEAD
    # Create User
=======
    # 2. Create User Profile
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
    user = db.query(UserProfile).filter(UserProfile.auth_user_id == "seed_user_pranav").first()
    if not user:
        user = UserProfile(
            organization_id=org.id,
            auth_user_id="seed_user_pranav",
<<<<<<< HEAD
            full_name="Pranav",
=======
            full_name="Kate Russell",
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
            role="Admin"
        )
        db.add(user)
        db.commit()
<<<<<<< HEAD
=======
        db.refresh(user)
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
        print("User created.")
    else:
        print("User already exists.")

<<<<<<< HEAD
    print("Seed completed successfully!")
=======
    # 3. Seed Sample RFPs & Analysis if none exist
    if db.query(RFP).count() == 0:
        rfp1 = RFP(
            organization_id=org.id,
            uploaded_by=user.id,
            title="City of Riverdale Cloud Migration",
            customer_name="Riverdale Municipal",
            file_name="sample_rfp.docx",
            file_path="sample_rfp.docx",
            document_type="docx",
            status="Completed",
        )
        db.add(rfp1)
        db.commit()
        db.refresh(rfp1)

        analysis1 = Analysis(
            rfp_id=rfp1.id,
            executive_summary="The City of Riverdale is seeking a qualified vendor to migrate its legacy on-premise core infrastructure to AWS/Azure cloud workflows.",
            opportunity_summary="Core municipal infrastructure migration.",
            submission_deadline="30/08/2026",
            budget="$500,000",
            overall_risk_score="Medium",
            confidence_score=0.95,
            analysis_status="Completed",
        )
        db.add(analysis1)
        db.commit()
        db.refresh(analysis1)

        req1 = Requirement(analysis_id=analysis1.id, category="Mandatory", priority="High", requirement_text="Vendor must hold ISO 27001 security certification.")
        req2 = Requirement(analysis_id=analysis1.id, category="Technical", priority="High", requirement_text="Migrate 3 legacy core databases with zero data loss.")
        req3 = Requirement(analysis_id=analysis1.id, category="Commercial", priority="Medium", requirement_text="24/7 dedicated support SLA with 1-hour critical response time.")
        db.add_all([req1, req2, req3])

        # RFP 2
        rfp2 = RFP(
            organization_id=org.id,
            uploaded_by=user.id,
            title="Enterprise Core ERP Upgrade",
            customer_name="Apex Global Tech",
            file_name="sample_rfp.pdf",
            file_path="sample_rfp.pdf",
            document_type="pdf",
            status="Completed",
        )
        db.add(rfp2)
        db.commit()
        db.refresh(rfp2)

        analysis2 = Analysis(
            rfp_id=rfp2.id,
            executive_summary="Apex Global Tech requires a modern cloud ERP upgrade across 12 international offices.",
            opportunity_summary="Global enterprise ERP deployment.",
            submission_deadline="15/09/2026",
            budget="$1,200,000",
            overall_risk_score="Low",
            confidence_score=0.98,
            analysis_status="Completed",
        )
        db.add(analysis2)
        db.commit()
        db.refresh(analysis2)

        req4 = Requirement(analysis_id=analysis2.id, category="Mandatory", priority="High", requirement_text="Multi-currency and multi-language support required.")
        req5 = Requirement(analysis_id=analysis2.id, category="Technical", priority="Medium", requirement_text="Real-time SAP & Salesforce integration capability.")
        db.add_all([req4, req5])

        db.commit()
        print("Sample RFPs and Requirements seeded successfully!")
    else:
        print("RFPs already exist in DB.")

    print("Seed process complete.")
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)

finally:
    db.close()