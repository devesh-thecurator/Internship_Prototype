import os
from typing import Any

from .models import ChatHistory
from ai_engine.chroma_store import query_document_vectors
from validation_engine.models import ValidationReport


def _generate_response(prompt: str) -> str:
    if os.getenv('ENABLE_LOCAL_LLM', 'false').lower() not in ('1', 'true', 'yes'):
        return ''

    try:
        from transformers import pipeline
        generator = pipeline('text-generation', model='distilgpt2', max_length=180, temperature=0.7)
        result = generator(prompt, max_new_tokens=150, num_return_sequences=1)
        return result[0].get('generated_text', '').strip()
    except Exception:
        return ''


def _fallback_response(query: str, context_matches: list[dict]) -> str:
    if not context_matches:
        return (
            'I do not have validated document context yet. Upload and validate a term sheet, then ask about clauses, '
            'risk, compliance gaps, or recommendations.'
        )

    primary = context_matches[0]
    summaries = [match.get('summary', '') for match in context_matches if match.get('summary')]
    clauses = []
    for match in context_matches:
        clauses.extend(match.get('clauses', [])[:3] if isinstance(match.get('clauses'), list) else [])
    clause_names = ', '.join([clause.get('clause', 'clause') for clause in clauses[:5]]) or 'the extracted clauses'
    summary_text = summaries[0] if summaries else 'The validated document has available clause and risk context.'
    fields = primary.get('automotive_fields') if isinstance(primary.get('automotive_fields'), dict) else {}
    field_text = ', '.join(f'{key.replace("_", " ")}: {value}' for key, value in list(fields.items())[:4])
    recommendations = primary.get('recommendations') if isinstance(primary.get('recommendations'), list) else []
    anomalies = primary.get('anomalies') if isinstance(primary.get('anomalies'), list) else []
    risk_score = primary.get('risk_score')
    risk_level = primary.get('risk_level', 'not classified')

    answer_parts = [
        summary_text,
        f'For "{query}", I checked {clause_names}.',
    ]
    if field_text:
        answer_parts.append(f'Detected automotive master data includes {field_text}.')
    if risk_score is not None:
        answer_parts.append(f'Supplier risk is {risk_score}% and classified as {risk_level}.')
    if anomalies:
        answer_parts.append(f'Key anomaly: {anomalies[0]}')
    if recommendations:
        answer_parts.append(f'Recommended action: {recommendations[0]}')
    else:
        answer_parts.append('Review missing required clauses, short clause text, risk score, and compliance recommendations before approval.')

    return (
        ' '.join(answer_parts)
    )


def _database_context(user: Any, limit: int = 4) -> list[dict]:
    reports = (
        ValidationReport.objects.filter(document__owner=user)
        .select_related('document')
        .order_by('-created_at')[:limit]
    )
    matches = []
    for report in reports:
        metadata = report.document.metadata or {}
        matches.append(
            {
                'document_id': report.document_id,
                'owner_id': user.id,
                'name': report.document.name,
                'summary': report.summary,
                'profile': metadata.get('document_profile'),
                'automotive_fields': metadata.get('automotive_fields', {}),
                'compliance_breakdown': metadata.get('compliance_breakdown', []),
                'recommendations': getattr(report.document, 'compliance_result', None).recommendations
                if hasattr(report.document, 'compliance_result')
                else metadata.get('recommendations', []),
                'risk_score': metadata.get('risk_score'),
                'risk_level': metadata.get('risk_level'),
                'risk_drivers': metadata.get('risk_drivers', []),
                'anomalies': metadata.get('anomalies', []),
                'mismatches': metadata.get('mismatches', []),
                'clauses': report.clause_matches,
            }
        )
    return matches


def answer_question(user: Any, query: str) -> dict:
    context_matches = query_document_vectors(query, where={'owner_id': user.id})
    if not context_matches:
        context_matches = query_document_vectors(query)
    if not context_matches:
        context_matches = _database_context(user)
    context_text = '\n\n'.join([m.get('summary', '') for m in context_matches if m.get('summary')])
    prompt = (
        f"Use the following term sheet context to answer the user query.\n\n"
        f"Context:\n{context_text}\n\nQuestion: {query}\nAnswer:"
    )
    answer_text = _generate_response(prompt) or _fallback_response(query, context_matches)

    chat = ChatHistory.objects.create(
        user=user,
        query=query,
        response=answer_text,
        context=context_matches,
    )
    return {
        'query': query,
        'answer': answer_text,
        'context': context_matches,
        'chat_id': chat.id,
    }
