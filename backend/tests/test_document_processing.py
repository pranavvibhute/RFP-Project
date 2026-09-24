import os
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.models.organization import Organization
from app.models.user_profile import UserProfile
from app.models.rfp import RFP
from app.models.analysis import Analysis
from app.models.requirement import Requirement
# 3. Build a typed mock DocumentAnalysisResult — bypasses provider selection,
        #    embeddings, and Qdrant so the test runs fully offline.
        mock_analysis_schema = AIAnalysisSchema(
            executive_summary="The City of Riverdale is migrating its legacy core banking to secure cloud workflows.",
            submission_deadline="August 30, 2026",
            budget="$500,000",
            opportunity_summary="Core government infrastructure migration.",
            overall_risk="Medium",
            requirements=[
                RequirementSchema(category="Mandatory", priority="High", requirement="ISO 27001 certification required."),
                RequirementSchema(category="Technical", priority="Medium", requirement="Migrate 3 core databases to AWS."),
            ],
            risks=[RiskSchema(severity="High", description="Unreasonable project delivery timeline.")],
        )
        mock_analysis_result = DocumentAnalysisResult(
            analysis=mock_analysis_schema,
            provider="gemini",
            model="gemini-2.5-flash",
            used_fallback=False,
            confidence_score=0.95,
            retrieval_hits=[],
            raw_response={},
        )

        # 4. Patch extract_text and the entire AI analysis call
        mock_extraction = MagicMock()
        mock_extraction.filename = "test_rfp_doc.docx"
        mock_extraction.file_type = "docx"
        mock_extraction.page_count = 0
        mock_extraction.full_text = "This is a dummy RFP document for BidWise AI testing."

with patch("app.services.document.document_processing_service.extract_text", return_value=mock_extraction), \
             patch("app.services.document.document_processing_service.document_intelligence_service.analyze",
                   return_value=mock_analysis_result):
            # Run the process service
            document_processing_service.process(db, rfp.id)
            
        # 5. Verify Database updates
        db.refresh(rfp)
        assert rfp.status == "Completed"
        assert rfp.extracted_text is not None
        assert "dummy" in rfp.extracted_text
        assert rfp.error_message is None
        
        # Check analysis database record
        analysis = db.query(Analysis).filter(Analysis.rfp_id == rfp.id).first()
        assert analysis is not None
        assert analysis.overall_risk_score == "Medium"
        assert analysis.submission_deadline == "August 30, 2026"
        assert "Riverdale" in analysis.executive_summary
        
        # Check requirements database records
        requirements = db.query(Requirement).filter(Requirement.analysis_id == analysis.id).all()
        assert len(requirements) == 2
        assert requirements[0].category == "Mandatory"
        assert requirements[0].priority == "High"
        assert "ISO" in requirements[0].requirement_text
        
        assert requirements[1].category == "Technical"
        assert "AWS" in requirements[1].requirement_text

    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("test_rfp_doc.docx"):
            os.remove("test_rfp_doc.docx")
