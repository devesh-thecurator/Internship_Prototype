import re

from .models import ComplianceResult, RiskAssessment, ValidationReport
from ai_engine.chroma_store import store_document_vector
from ai_engine.embeddings import build_embedding
from ai_engine.ocr import extract_text_from_file

REQUIRED_CLAUSES = [
    'governing law',
    'termination',
    'payment',
    'confidentiality',
    'liability',
]


def normalize_text(text: str) -> str:
    return ' '.join(text.replace('\r', '\n').split()).strip()


def parse_clauses(raw_text: str) -> list:
    text = normalize_text(raw_text)
    segments = [segment.strip() for segment in re.split(r'\n{2,}|\.\s+', raw_text) if segment.strip()]
    matches = []
    for segment in segments:
        heading_search = re.match(r'^(?P<heading>[A-Za-z0-9 \-]{3,80})[\.:]\s*(?P<body>.+)$', segment, re.S)
        if heading_search:
            matches.append(
                {
                    'clause': heading_search.group('heading').strip(),
                    'text': heading_search.group('body').strip(),
                }
            )
    if not matches:
        matches = [{'clause': 'full_text', 'text': text[:2000]}]
    return matches


def score_document(clauses: list) -> tuple[float, list[str]]:
    lowered = ' '.join([f"{c['clause'].lower()} {c['text'].lower()}" for c in clauses])
    missing = [clause for clause in REQUIRED_CLAUSES if clause not in lowered]
    base_score = 100.0
    penalty = len(missing) * 12.5
    score = max(0.0, base_score - penalty)
    return score, missing


def calculate_compliance(clauses: list, missing: list[str]) -> tuple[float, float, list[str], list[str]]:
    match_pct = max(0.0, 100.0 - len(missing) * 15.0)
    compliance_score = max(0.0, match_pct - len([c for c in clauses if len(c['text']) < 20]) * 3.0)
    mismatches = [clause for clause in missing]
    recommendations = [f'Add or clarify the {clause} clause.' for clause in missing]
    if compliance_score < 50:
        recommendations.append('Review the entire term sheet for missing obligations and compliance items.')
    return match_pct, compliance_score, mismatches, recommendations


def assess_risk(score: float, clauses: list) -> tuple[float, str, list[str]]:
    anomalies = []
    low_detail_count = [c for c in clauses if len(c['text']) < 120]
    if low_detail_count:
        anomalies.append('Several clauses are shorter than expected and may lack detail.')
    if score < 60:
        level = 'high'
    elif score < 80:
        level = 'medium'
    else:
        level = 'low'
    risk_score = min(100.0, max(0.0, 100.0 - score + len(anomalies) * 5.0))
    return risk_score, level, anomalies


def validate_document(document):
    raw_text = extract_text_from_file(document.file.path)
    clauses = parse_clauses(raw_text)
    score, missing = score_document(clauses)
    match_percentage, compliance_score, mismatches, recommendations = calculate_compliance(clauses, missing)
    risk_score, risk_level, anomalies = assess_risk(score, clauses)
    issues = []

    if missing:
        issues.append({'type': 'missing_clauses', 'details': missing})
    if anomalies:
        issues.append({'type': 'anomalies', 'details': anomalies})
    if score < 70:
        issues.append({'type': 'low_confidence', 'message': 'The document may lack key term sheet clauses or sufficient detail.'})

    summary = (
        f"Document '{document.name}' contains {len(clauses)} clause groups with an overall compliance score of {compliance_score:.1f}. "
        f"Risk level is {risk_level}."
    )

    report, _ = ValidationReport.objects.update_or_create(
        document=document,
        defaults={
            'summary': summary,
            'issues': issues,
            'score': score,
            'clause_matches': clauses,
            'completed': True,
        },
    )

    ComplianceResult.objects.update_or_create(
        document=document,
        defaults={
            'match_percentage': match_percentage,
            'compliance_score': compliance_score,
            'mismatches': mismatches,
            'recommendations': recommendations,
        },
    )

    RiskAssessment.objects.create(
        document=document,
        risk_score=risk_score,
        risk_level=risk_level,
        anomalies=anomalies,
    )

    vector_data = {
        'document_id': document.id,
        'name': document.name,
        'summary': summary,
        'clauses': clauses,
    }
    embedding = build_embedding(raw_text)
    store_document_vector(document.id, vector_data, embedding)

    document.processed = True
    document.metadata = {
        'clause_count': len(clauses),
        'missing_required_clauses': missing,
        'risk_score': risk_score,
        'compliance_score': compliance_score,
    }
    document.save(update_fields=['processed', 'metadata'])

    return report
