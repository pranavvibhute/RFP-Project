import os
import sys

# Ensure backend folder is in Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.document.extractor import extract_text
from app.services.ai.evaluation import EvaluationCase, evaluate_document_intelligence

def main():
    print("Preparing evaluation cases...")
    cases = []

    # Case 1: Read sample_rfp.docx from disk
    sample_docx_path = "sample_rfp.docx"
    if os.path.exists(sample_docx_path):
        with open(sample_docx_path, "rb") as f:
            extraction = extract_text(f.read(), sample_docx_path)
            cases.append(
                EvaluationCase(
                    filename=sample_docx_path,
                    text=extraction.full_text,
                    expected_keywords=["Riverdale", "cloud", "migration", "ISO 27001", "support"]
                )
            )
        print(f"Added {sample_docx_path} to evaluation.")
    else:
        print(f"Warning: {sample_docx_path} not found.")

    # Case 2: Inline mock SOC RFP
    case2_text = """
    Request for Proposal: Security Operations Center (SOC) Services
    Issuing Organization: Global Finance Corp

    1. Objectives
    Global Finance Corp is soliciting proposals from Managed Security Service Providers (MSSPs) to deliver 
    24/7/365 Security Operations Center (SOC) monitoring and incident response services.

    2. Mandatory Scope
    - Integration with Microsoft Sentinel SIEM.
    - Under 15-minute response SLA for critical incidents.
    - Data residency must be in the EU.
    - Budget: $250,000 annually.
    """
    cases.append(
        EvaluationCase(
            filename="soc_services_rfp.txt",
            text=case2_text,
            expected_keywords=["Sentinel", "Global Finance", "EU", "incident", "250,000"]
        )
    )
    print("Added inline SOC RFP case to evaluation.")

    if not cases:
        print("No evaluation cases to run.")
        return

    print(f"\nRunning evaluation on {len(cases)} cases...")
    result = evaluate_document_intelligence(cases)

    print("\n" + "="*50)
    print("               EVALUATION RESULTS               ")
    print("="*50)
    print(f"Total Cases Checked:      {result.total_cases}")
    print(f"Successful Runs:          {result.successful_cases}")
    print(f"JSON Validity Rate:       {result.json_success_rate * 100:.1f}%")
    print(f"Average Confidence:       {result.average_confidence * 100:.1f}%")
    print(f"Average Retrieval Hits:   {result.average_retrieval_hits:.1f}")
    print(f"Keyword Coverage:         {result.keyword_coverage * 100:.1f}%")
    print("="*50)

if __name__ == "__main__":
    main()
