SYSTEM_INSTRUCTION = """You are an expert bid/proposal analyst for BidWise AI.
You read RFPs, RFQs, and Tenders and extract accurate, decision-useful information for a Bid Manager
who has NOT read the full document and needs to decide whether to pursue it.

Rules:
- Only state what is actually in the document. Do not invent requirements, dates, or criteria.
- If a field has no information in the document, return an empty list (for lists) or null (for issuing_organization).
- Be concise and specific. Prefer exact figures, dates, and named certifications over vague language.
- "Important Risks" means things that could hurt a bid decision: unrealistic deadlines, ambiguous scope,
  unusual penalty clauses, mandatory certifications, single-bidder suspicion, incomplete information, etc.
- Output must be valid JSON matching the provided schema. No prose outside the JSON.
"""

EXECUTIVE_SUMMARY_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "project_overview": {
            "type": "STRING",
            "description": "2-4 sentence summary of what the RFP is asking for"
        },
        "key_requirements": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Bullet list of the most important requirements"
        },
        "deadlines": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "label": {
                        "type": "STRING",
                        "description": "What the deadline is for, e.g. 'Submission Deadline'"
                    },
                    "date_or_detail": {
                        "type": "STRING",
                        "description": "The date or detail as stated in the document"
                    }
                },
                "required": ["label", "date_or_detail"]
            },
            "description": "All deadlines mentioned (submission, Q&A, site visit, etc.)"
        },
        "evaluation_criteria": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "How the issuer says they will evaluate bids"
        },
        "important_risks": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Notable risks: ambiguity, tight timelines, unusual terms, etc."
        },
        "issuing_organization": {
            "type": "STRING",
            "description": "Name of the customer/organization issuing this RFP, if identifiable",
        }
    },
    "required": [
        "project_overview",
        "key_requirements",
        "deadlines",
        "evaluation_criteria",
        "important_risks"
    ]
}


def build_user_prompt(filename: str, rfp_text: str, truncated: bool = False) -> str:
    """Build the final analysis prompt for the model."""
    trunc_msg = "(NOTE: document was truncated due to length — analyze what is provided)" if truncated else ""
    return f"""Document: {filename}
{trunc_msg}

--- RFP TEXT START ---
{rfp_text}
--- RFP TEXT END ---

Produce the executive summary now, as JSON matching the schema."""


ANALYSIS_SYSTEM_INSTRUCTION = """You are an expert bid/proposal analyst for BidWise AI.
You read RFPs, RFQs, and Tenders and extract accurate, decision-useful information for a Bid Manager.

Rules:
- Only state what is actually in the document. Do not invent requirements, dates, or criteria.
- If a field has no information in the document, return empty list or null.
- Extract all key requirements and categorize them.
- Assess risks and assign severity levels.
- Output must be valid JSON matching the schema. No prose outside the JSON.
"""

ANALYSIS_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "executive_summary": {
            "type": "STRING",
            "description": "2-4 sentence summary of what the RFP is asking for"
        },
        "submission_deadline": {
            "type": "STRING",
            "description": "The submission deadline date or detail"
        },
        "budget": {
            "type": "STRING",
            "description": "The project budget if mentioned"
        },
        "opportunity_summary": {
            "type": "STRING",
            "description": "Summary of the business opportunity"
        },
        "overall_risk": {
            "type": "STRING",
            "description": "Overall risk level (e.g. Low, Medium, High)"
        },
        "requirements": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "category": {"type": "STRING", "description": "e.g. Technical, Financial, Legal, Mandatory"},
                    "priority": {"type": "STRING", "description": "e.g. High, Medium, Low"},
                    "requirement": {"type": "STRING", "description": "Specific requirement text"}
                },
                "required": ["category", "priority", "requirement"]
            }
        },
        "risks": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "severity": {"type": "STRING", "description": "e.g. High, Medium, Low"},
                    "description": {"type": "STRING", "description": "Description of the risk"}
                },
                "required": ["severity", "description"]
            }
        }
    },
    "required": [
        "executive_summary",
        "opportunity_summary",
        "overall_risk",
        "requirements",
        "risks"
    ]
}

ANALYSIS_PROMPT = """Analyze the following RFP document. Extract the executive summary, submission deadline, budget, opportunity summary, overall risk level, key requirements, and risks.

--- DOCUMENT START ---
{{document}}
--- DOCUMENT END ---

Produce the analysis now, as JSON matching the schema."""
