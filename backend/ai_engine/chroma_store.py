import os
from pathlib import Path
import json
import logging

import chromadb

from .embeddings import build_embedding

logger = logging.getLogger(__name__)
EPHEMERAL_CLIENT = None
USE_EPHEMERAL = os.getenv('CHROMA_STORAGE', '').lower() in ('memory', 'ephemeral')


def _get_client():
    if USE_EPHEMERAL:
        return _get_ephemeral_client()

    configured_path = Path(os.getenv('CHROMA_DB_DIR', 'chromadb'))
    path = configured_path if configured_path.is_absolute() else Path(__file__).resolve().parents[2] / configured_path
    path.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(path))


def _get_ephemeral_client():
    global EPHEMERAL_CLIENT
    if EPHEMERAL_CLIENT is None:
        EPHEMERAL_CLIENT = chromadb.EphemeralClient()
    return EPHEMERAL_CLIENT


def _get_collection(client):
    return client.get_or_create_collection(name='term_sheet_documents')


def _flatten_metadata(metadata: dict) -> dict:
    flattened = {}
    for key, value in metadata.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            flattened[key] = value
        else:
            flattened[key] = json.dumps(value, default=str)
    return flattened


def _expand_metadata(metadata: dict) -> dict:
    expanded = dict(metadata)
    for key in (
        'clauses',
        'automotive_fields',
        'compliance_breakdown',
        'recommendations',
        'risk_drivers',
        'anomalies',
        'mismatches',
    ):
        value = expanded.get(key)
        if isinstance(value, str):
            try:
                expanded[key] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return expanded


def store_document_vector(document_id: int, metadata: dict, vector: list):
    global USE_EPHEMERAL
    payload = {
        'documents': [metadata.get('summary', '')],
        'metadatas': [_flatten_metadata(metadata)],
        'ids': [str(document_id)],
        'embeddings': [vector],
    }
    try:
        collection = _get_collection(_get_client())
        collection.upsert(**payload)
    except Exception as exc:
        logger.warning('Persistent ChromaDB unavailable, switching to in-memory ChromaDB: %s', exc)
        USE_EPHEMERAL = True
        collection = _get_collection(_get_ephemeral_client())
        collection.upsert(**payload)


def query_document_vectors(query: str, limit: int = 4, where: dict | None = None):
    embedding = build_embedding(query)
    query_kwargs = {'query_embeddings': [embedding], 'n_results': limit}
    if where:
        query_kwargs['where'] = where
    try:
        collection = _get_collection(_get_client())
        results = collection.query(**query_kwargs)
    except Exception as exc:
        logger.warning('Persistent ChromaDB query unavailable: %s', exc)
        if not USE_EPHEMERAL:
            return []
        try:
            collection = _get_collection(_get_ephemeral_client())
            results = collection.query(**query_kwargs)
        except Exception:
            return []
    matches = []
    for metadata_list in results.get('metadatas') or []:
        for metadata in metadata_list:
            matches.append(_expand_metadata(metadata))
    return matches
