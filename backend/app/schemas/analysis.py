from pydantic import BaseModel, Field

class Deadline(BaseModel):
    label: str = Field(description="What the deadline is for, e.g. 'Submission Deadline'")
    date_or_detail: str = Field(description="The date or detail as stated in the document")


class ExecutiveSummary(BaseModel):
    project_overview: str = Field(description="2-4 sentence summary of what the RFP is asking for")
    key_requirements: list[str] = Field(description="Bullet list of the most important requirements")
    deadlines: list[Deadline] = Field(description="All deadlines mentioned (submission, Q&A, site visit, etc.)")
    evaluation_criteria: list[str] = Field(description="How the issuer says they will evaluate bids")
    important_risks: list[str] = Field(description="Notable risks: ambiguity, tight timelines, unusual terms, etc.")
    issuing_organization: str | None = Field(
        default=None, description="Name of the customer/organization issuing this RFP, if identifiable"
    )


class AnalyzeResponse(BaseModel):
    filename: str
    file_type: str
    page_count: int
    char_count: int
    processing_time_seconds: float
    executive_summary: ExecutiveSummary
