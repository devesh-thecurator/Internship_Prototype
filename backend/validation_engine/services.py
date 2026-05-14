import logging
import re
from typing import Callable

from .models import ComplianceResult, RiskAssessment, ValidationReport
from ai_engine.chroma_store import store_document_vector
from ai_engine.embeddings import build_embedding
from ai_engine.ocr import extract_text_from_file

logger = logging.getLogger(__name__)

AUTOMOTIVE_FIELD_PATTERNS = {
    'oem_manufacturer': [
        r'(?:OEM Manufacturer|OEM|Manufacturer)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'supplier_name': [
        r'(?:Supplier Name|Supplier|Vendor)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'vehicle_program': [
        r'(?:Vehicle Program|Program Name|Vehicle Line|Model Program)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'ev_platform': [
        r'(?:EV Platform|Electric Vehicle Platform|Platform)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'battery_management_system': [
        r'(?:Battery Management System|BMS)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'ecu_specifications': [
        r'(?:ECU Specifications|ECU|Domain Controller)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'manufacturing_plant': [
        r'(?:Manufacturing Plant|Plant|Assembly Plant|Production Plant)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'procurement_volume': [
        r'(?:Procurement Volume|Annual Volume|Volume|Units)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'delivery_mode': [
        r'(?:Delivery Mode|Delivery|Logistics Mode|Shipment Mode)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'contract_value': [
        r'(?:Contract Value|Commercial Value|Total Value|Value)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
    'logistics_clauses': [
        r'(?:Logistics Clauses|Logistics|JIT|ASN|Cross[- ]dock)\s*[:\-]\s*(?P<value>[^\n\r;]+)',
    ],
}

COMPLIANCE_RULES = {
    'Bharat Stage VI': {
        'required': 86,
        'terms': ['bharat stage vi', 'bs vi', 'bs6', 'emission compliance'],
        'recommendation': 'Add Bharat Stage VI / BS VI emissions applicability and derivative coverage.',
    },
    'ISO 26262': {
        'required': 88,
        'terms': ['iso 26262', 'asil', 'functional safety', 'safety case'],
        'recommendation': 'Define ISO 26262 responsibilities, ASIL level, safety evidence, and traceability.',
    },
    'PPAP approvals': {
        'required': 90,
        'terms': ['ppap', 'production part approval', 'level 3', 'dimensional report'],
        'recommendation': 'Attach PPAP approval package and define production part approval gate ownership.',
    },
    'ESG compliance': {
        'required': 80,
        'terms': ['esg', 'sustainability', 'cobalt', 'carbon', 'responsible sourcing', 'audit'],
        'recommendation': 'Add ESG audit currency, responsible sourcing proof, and sustainability reporting terms.',
    },
    'Automotive cybersecurity': {
        'required': 84,
        'terms': ['cybersecurity', 'unece r155', 'r155', 'ota', 'incident notification', 'patch'],
        'recommendation': 'Add automotive cybersecurity obligations, UNECE R155 incident SLA, and OTA patch ownership.',
    },
    'Manufacturing safety standards': {
        'required': 82,
        'terms': ['manufacturing safety', 'plant safety', 'iso 45001', 'safety standard', 'line safety'],
        'recommendation': 'Clarify manufacturing safety standards, plant audit cadence, and escalation ownership.',
    },
}

PROFILE_KEYWORDS = {
    'ev': ['battery', 'bms', 'ev', '800v', 'cell', 'thermal', 'charging', 'module'],
    'manufacturing': ['manufacturing', 'plant', 'ppap', 'assembly', 'biw', 'welding', 'paint', 'line'],
    'logistics': ['logistics', 'jit', 'asn', 'cross-dock', 'delivery', 'shipment', 'lane', 'eta'],
    'supplier': ['supplier', 'ecu', 'cybersecurity', 'r155', 'domain controller', 'counterfeit', 'ota'],
}

RISK_SIGNALS = {
    'counterfeit component risk': ['counterfeit', 'unapproved component', 'grey market', 'non genuine'],
    'logistics delay risk': ['delay', 'late delivery', 'port congestion', 'lane congestion', 'missed eta'],
    'production bottleneck': ['bottleneck', 'capacity constraint', 'line stoppage', 'single source'],
    'compliance violation': ['non-compliant', 'violation', 'missing certification', 'expired audit'],
    'supplier anomaly': ['vendor mismatch', 'supplier mismatch', 'duns mismatch', 'unapproved supplier'],
}


def emit_progress(progress_callback: Callable | None, **payload) -> None:
    if progress_callback is None:
        return
    try:
        progress_callback(payload)
    except Exception:
        logger.exception('Validation progress callback failed.')


def normalize_text(text: str) -> str:
    return ' '.join((text or '').replace('\r', '\n').split()).strip()


def parse_clauses(raw_text: str) -> list:
    text = raw_text or ''
    segments = [segment.strip() for segment in re.split(r'\n{2,}|\.\s+', text) if segment.strip()]
    matches = []

    for index, segment in enumerate(segments):
        heading_search = re.match(r'^(?P<heading>[A-Za-z0-9 /&+\-]{3,90})[\.:]\s*(?P<body>.+)$', segment, re.S)
        if heading_search:
            heading = heading_search.group('heading').strip()
            body = heading_search.group('body').strip()
        else:
            heading = f'clause_{index + 1}'
            body = segment

        matches.append(
            {
                'clause': heading,
                'text': body[:1800],
                'confidence': score_clause_confidence(f'{heading} {body}'),
                'status': classify_clause_status(f'{heading} {body}'),
            }
        )

    if not matches:
        matches = [{'clause': 'full_text', 'text': normalize_text(text)[:2000], 'confidence': 0, 'status': 'mismatch'}]

    return matches[:36]


def score_clause_confidence(text: str) -> int:
    lowered = text.lower()
    hits = sum(1 for rule in COMPLIANCE_RULES.values() for term in rule['terms'] if term in lowered)
    automotive_hits = sum(1 for terms in PROFILE_KEYWORDS.values() for term in terms if term in lowered)
    length_bonus = min(20, len(lowered) // 80)
    return min(99, 48 + hits * 9 + automotive_hits * 5 + length_bonus)


def classify_clause_status(text: str) -> str:
    lowered = text.lower()
    if any(signal in lowered for signal in ['missing', 'non-compliant', 'violation', 'unapproved', 'counterfeit']):
        return 'mismatch'
    if any(signal in lowered for signal in ['delay', 'variance', 'exception', 'pending', 'thermal']):
        return 'warning'
    return 'match'


def extract_automotive_fields(raw_text: str) -> dict:
    fields = {}
    for field, patterns in AUTOMOTIVE_FIELD_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, raw_text or '', re.I)
            if match:
                value = re.sub(r'\s+', ' ', match.group('value')).strip(' .')
                if value:
                    fields[field] = value[:140]
                    break

    lowered = (raw_text or '').lower()
    inferred = {
        'battery_management_system': ('BMS / battery diagnostics referenced', ['bms', 'battery management system']),
        'ev_platform': ('EV platform referenced', ['ev platform', '800v', 'electric vehicle']),
        'delivery_mode': ('JIT / sequenced logistics referenced', ['jit', 'sequenced delivery', 'asn']),
        'ecu_specifications': ('ECU / domain controller referenced', ['ecu', 'domain controller', 'ota']),
        'logistics_clauses': ('Automotive logistics clauses detected', ['logistics', 'cross-dock', 'line-side']),
    }
    for field, (value, terms) in inferred.items():
        if field not in fields and any(term in lowered for term in terms):
            fields[field] = value

    return fields


def detect_document_profile(raw_text: str, fields: dict) -> str:
    lowered = f"{raw_text or ''} {' '.join(str(value) for value in fields.values())}".lower()
    scores = {
        profile: sum(1 for keyword in keywords if keyword in lowered)
        for profile, keywords in PROFILE_KEYWORDS.items()
    }
    profile, score = max(scores.items(), key=lambda item: item[1])
    return profile if score else 'generic'


def calculate_compliance(raw_text: str, fields: dict) -> tuple[float, float, list[str], list[str], list[dict]]:
    lowered = (raw_text or '').lower()
    breakdown = []
    mismatches = []
    recommendations = []

    for subject, rule in COMPLIANCE_RULES.items():
        hits = [term for term in rule['terms'] if term in lowered]
        current = min(100, 48 + len(hits) * 18)
        if subject == 'PPAP approvals' and fields.get('manufacturing_plant'):
            current += 4
        if subject == 'Automotive cybersecurity' and fields.get('ecu_specifications'):
            current += 4
        current = min(100, current)
        status = 'match' if current >= rule['required'] else 'warning' if current >= rule['required'] - 14 else 'mismatch'
        breakdown.append(
            {
                'subject': subject,
                'current': current,
                'required': rule['required'],
                'status': status,
                'evidence_terms': hits,
            }
        )
        if current < rule['required']:
            mismatches.append(subject)
            recommendations.append(rule['recommendation'])

    field_coverage = min(100, (len(fields) / len(AUTOMOTIVE_FIELD_PATTERNS)) * 100)
    rule_average = sum(item['current'] for item in breakdown) / len(breakdown)
    match_percentage = round((field_coverage * 0.36) + (rule_average * 0.64), 1)
    compliance_score = round(max(0, rule_average - len(mismatches) * 2.5), 1)

    if field_coverage < 45:
        recommendations.append('Add structured OEM, supplier, vehicle program, plant, volume, value, and logistics fields.')

    return match_percentage, compliance_score, mismatches, recommendations[:8], breakdown


def score_document(fields: dict, compliance_score: float, match_percentage: float) -> float:
    field_score = min(100, (len(fields) / len(AUTOMOTIVE_FIELD_PATTERNS)) * 100)
    return round((field_score * 0.28) + (compliance_score * 0.42) + (match_percentage * 0.3), 1)


def assess_risk(raw_text: str, score: float, compliance_mismatches: list[str], fields: dict) -> tuple[float, str, list[str], list[str]]:
    lowered = (raw_text or '').lower()
    anomalies = []
    drivers = []
    risk_score = max(0.0, 100.0 - score)

    for label, signals in RISK_SIGNALS.items():
        if any(signal in lowered for signal in signals):
            drivers.append(label)
            risk_score += 8
            anomalies.append(label.replace(' risk', '').capitalize())

    missing_operational_fields = [
        label for label in ('supplier_name', 'manufacturing_plant', 'delivery_mode', 'contract_value')
        if not fields.get(label)
    ]
    if missing_operational_fields:
        drivers.append('missing operational master data')
        risk_score += len(missing_operational_fields) * 2.5
        anomalies.append(f"Missing structured fields: {', '.join(missing_operational_fields)}")

    if 'Automotive cybersecurity' in compliance_mismatches:
        risk_score += 12
        anomalies.append('Automotive cybersecurity obligations are incomplete.')
    if 'PPAP approvals' in compliance_mismatches:
        risk_score += 9
        anomalies.append('PPAP approval evidence is incomplete.')

    thermal_match = re.search(r'(\d{2,3})\s*(?:c|\\u00b0c|degree)', lowered)
    if thermal_match and int(thermal_match.group(1)) >= 50:
        risk_score += 8
        drivers.append('thermal threshold variance')
        anomalies.append('Battery thermal threshold appears above normal platform policy.')

    risk_score = round(min(100.0, max(0.0, risk_score)), 1)
    if risk_score >= 62:
        level = 'high'
    elif risk_score >= 32:
        level = 'medium'
    else:
        level = 'low'

    return risk_score, level, anomalies[:8], drivers[:8]


def calculate_operational_metrics(profile: str, compliance_score: float, risk_score: float, mismatches: list[str]) -> dict:
    logistics_penalty = 10 if 'Bharat Stage VI' in mismatches else 0
    manufacturing_penalty = 12 if 'PPAP approvals' in mismatches else 0
    battery_penalty = 12 if 'Automotive cybersecurity' in mismatches else 0

    return {
        'manufacturing_risk': round(min(100, max(0, risk_score * 0.72 + manufacturing_penalty + (8 if profile == 'manufacturing' else 0))), 1),
        'logistics_risk': round(min(100, max(0, risk_score * 0.58 + logistics_penalty + (10 if profile == 'logistics' else 0))), 1),
        'logistics_performance': round(max(0, 100 - (risk_score * 0.58 + logistics_penalty)), 1),
        'battery_health': round(max(45, compliance_score - battery_penalty + (5 if profile == 'ev' else -4)), 1),
    }


def validate_document(document, progress_callback: Callable | None = None):
    emit_progress(
        progress_callback,
        type='stage',
        stage='ocr',
        progress=24,
        message='OCR extraction started for the uploaded automobile term sheet.',
        document_id=document.id,
        document_name=document.name,
    )
    raw_text = extract_text_from_file(document.file.path)
    normalized_text = normalize_text(raw_text)

    emit_progress(
        progress_callback,
        type='stage',
        stage='ocr',
        progress=34,
        message=f'OCR extraction complete with {len(normalized_text)} readable characters.',
        document_id=document.id,
        ocr_character_count=len(normalized_text),
    )

    clauses = parse_clauses(raw_text)

    emit_progress(
        progress_callback,
        type='stage',
        stage='fields',
        progress=45,
        message=f'Parsed {len(clauses)} candidate automotive clauses.',
        document_id=document.id,
        clause_count=len(clauses),
    )

    fields = extract_automotive_fields(raw_text)
    profile = detect_document_profile(raw_text, fields)

    emit_progress(
        progress_callback,
        type='stage',
        stage='fields',
        progress=55,
        message=f'Detected {len(fields)} structured automotive fields and selected the {profile} cockpit profile.',
        document_id=document.id,
        profile=profile,
        automotive_fields=fields,
    )

    match_percentage, compliance_score, mismatches, recommendations, compliance_breakdown = calculate_compliance(raw_text, fields)

    emit_progress(
        progress_callback,
        type='stage',
        stage='semantic',
        progress=70,
        message='Semantic compliance comparison completed for BS VI, ISO 26262, PPAP, ESG, and cybersecurity.',
        document_id=document.id,
        semantic_match=match_percentage,
        compliance_score=compliance_score,
        mismatches=mismatches,
        recommendations=recommendations,
        compliance_breakdown=compliance_breakdown,
    )

    score = score_document(fields, compliance_score, match_percentage)
    risk_score, risk_level, anomalies, risk_drivers = assess_risk(raw_text, score, mismatches, fields)
    operational_metrics = calculate_operational_metrics(profile, compliance_score, risk_score, mismatches)
    issues = []

    emit_progress(
        progress_callback,
        type='stage',
        stage='risk',
        progress=84,
        message=f'Supplier and operational risk scoring completed with {risk_level} risk.',
        document_id=document.id,
        ai_confidence=score,
        risk_score=risk_score,
        risk_level=risk_level,
        anomalies=anomalies,
        risk_drivers=risk_drivers,
        **operational_metrics,
    )

    if mismatches:
        issues.append({'type': 'automotive_compliance_mismatches', 'details': mismatches})
    if anomalies:
        issues.append({'type': 'automotive_anomalies', 'details': anomalies})
    if len(fields) < 5:
        issues.append({'type': 'low_field_coverage', 'message': 'Automotive master data coverage is below expected threshold.'})
    if score < 70:
        issues.append({'type': 'low_confidence', 'message': 'The document lacks key automotive procurement, compliance, or risk clauses.'})

    summary = (
        f"Automotive validation for '{document.name}' identified profile '{profile}' with {len(fields)} structured fields, "
        f"{match_percentage:.1f}% semantic match, {compliance_score:.1f}% compliance, and {risk_level} supplier risk."
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

    document.processed = True
    document.metadata = {
        'document_profile': profile,
        'automotive_fields': fields,
        'compliance_breakdown': compliance_breakdown,
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_drivers': risk_drivers,
        'anomalies': anomalies,
        'mismatches': mismatches,
        'semantic_match': match_percentage,
        'compliance_score': compliance_score,
        'ai_confidence': score,
        **operational_metrics,
        'clause_count': len(clauses),
        'ocr_character_count': len(normalized_text),
    }
    document.save(update_fields=['processed', 'metadata'])

    vector_data = {
        'document_id': document.id,
        'owner_id': document.owner_id,
        'name': document.name,
        'summary': summary,
        'profile': profile,
        'automotive_fields': fields,
        'compliance_breakdown': compliance_breakdown,
        'recommendations': recommendations,
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_drivers': risk_drivers,
        'anomalies': anomalies,
        'mismatches': mismatches,
        'clauses': clauses,
    }
    try:
        emit_progress(
            progress_callback,
            type='stage',
            stage='chroma',
            progress=92,
            message='Indexing validation context in ChromaDB for document-aware AI assistant retrieval.',
            document_id=document.id,
        )
        embedding = build_embedding(raw_text)
        store_document_vector(document.id, vector_data, embedding)
    except Exception as exc:
        logger.warning('Unable to store validation vector for document %s: %s', document.id, exc)

    emit_progress(
        progress_callback,
        type='stage',
        stage='complete',
        progress=100,
        message='Automobile AI validation report generated and cockpit telemetry published.',
        document_id=document.id,
        report_id=report.id,
        ai_confidence=score,
        semantic_match=match_percentage,
        compliance_score=compliance_score,
        risk_score=risk_score,
    )

    return report
