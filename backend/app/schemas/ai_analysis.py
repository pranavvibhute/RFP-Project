from pydantic import BaseModel
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
    risks: List[RiskSchema]