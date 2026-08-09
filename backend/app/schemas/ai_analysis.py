<<<<<<< HEAD
from pydantic import BaseModel
=======
from pydantic import BaseModel, Field
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
from typing import List, Optional


class RequirementSchema(BaseModel):
    category: str
    priority: str
    requirement: str


class RiskSchema(BaseModel):
    severity: str
    description: str


class AIAnalysisSchema(BaseModel):
    executive_summary: str
    submission_deadline: Optional[str] = None
    budget: Optional[str] = None
    opportunity_summary: str
    overall_risk: str

    requirements: List[RequirementSchema]
<<<<<<< HEAD
    risks: List[RiskSchema]
=======
    evaluation_criteria: List[str] = Field(default_factory=list)
    important_risks: List[str] = Field(default_factory=list)
    risks: List[RiskSchema]
    issuing_organization: Optional[str] = None
    bid_recommendation: str = Field(default="Go", description="Must be one of: 'Go' (Bid), 'No-Go' (No-bid), or 'Review Required'")
    recommendation_rationale: str = Field(default="This opportunity aligns well with our technical capabilities and the budget fits our standard margins.")
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
