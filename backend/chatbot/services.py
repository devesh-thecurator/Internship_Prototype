import os
from typing import Any

from .models import ChatHistory
from ai_engine.chroma_store import query_document_vectors


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

    summaries = [match.get('summary', '') for match in context_matches if match.get('summary')]
    clauses = []
    for match in context_matches:
        clauses.extend(match.get('clauses', [])[:3] if isinstance(match.get('clauses'), list) else [])
    clause_names = ', '.join([clause.get('clause', 'clause') for clause in clauses[:5]]) or 'the extracted clauses'
    summary_text = summaries[0] if summaries else 'The validated document has available clause and risk context.'
    return (
        f'{summary_text} Based on your question "{query}", focus on {clause_names}. '
        'Review missing required clauses, short clause text, risk score, and compliance recommendations before approval.'
    )


def answer_question(user: Any, query: str) -> dict:
    context_matches = query_document_vectors(query)
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
