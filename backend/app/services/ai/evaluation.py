from __future__ import annotations

from dataclasses import dataclass, field

from app.core.exceptions import SummarizationError
from app.services.ai.intelligence import document_intelligence_service


@dataclass(frozen=True)
class EvaluationCase:
    filename: str
    text: str
    expected_keywords: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class EvaluationResult:
    total_cases: int
    successful_cases: int
    json_success_rate: float
    average_confidence: float
    average_retrieval_hits: float
    keyword_coverage: float


def evaluate_document_intelligence(cases: list[EvaluationCase]) -> EvaluationResult:
    if not cases:
        raise SummarizationError("At least one evaluation case is required.")

    successes = 0
    confidence_total = 0.0
    retrieval_hits_total = 0
    keyword_hits_total = 0
    keyword_checks_total = 0

    for case in cases:
        result = document_intelligence_service.analyze(case.text, filename=case.filename)
        successes += 1
        confidence_total += result.confidence_score
        retrieval_hits_total += len(result.retrieval_hits)

        analysis_text = " ".join(
            [
                result.analysis.executive_summary,
                result.analysis.opportunity_summary,
                result.analysis.submission_deadline or "",
                result.analysis.budget or "",
                " ".join(result.analysis.evaluation_criteria),
                " ".join(result.analysis.important_risks),
                " ".join(req.requirement for req in result.analysis.requirements),
                " ".join(risk.description for risk in result.analysis.risks),
            ]
        ).lower()

        for keyword in case.expected_keywords:
            keyword_checks_total += 1
            if keyword.lower() in analysis_text:
                keyword_hits_total += 1

    total_cases = len(cases)
    return EvaluationResult(
        total_cases=total_cases,
        successful_cases=successes,
        json_success_rate=round(successes / total_cases, 3),
        average_confidence=round(confidence_total / total_cases, 3),
        average_retrieval_hits=round(retrieval_hits_total / total_cases, 3),
        keyword_coverage=round((keyword_hits_total / keyword_checks_total), 3) if keyword_checks_total else 0.0,
    )
