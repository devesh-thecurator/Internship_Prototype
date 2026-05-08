import os
from pathlib import Path
import json

import chromadb

from .embeddings import build_embedding


def _get_client():
    configured_path = Path(os.getenv('CHROMA_DB_DIR', 'chromadb'))
    path = configured_path if configured_path.is_absolute() else Path(__file__).resolve().parents[2] / configured_path
    path.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(path))


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
    for key in ('clauses',):
        value = expanded.get(key)
        if isinstance(value, str):
            try:
                expanded[key] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return expanded


def store_document_vector(document_id: int, metadata: dict, vector: list):
    client = _get_client()
    collection = client.get_or_create_collection(name='term_sheet_documents')
    collection.upsert(
        documents=[metadata.get('summary', '')],
        metadatas=[_flatten_metadata(metadata)],
        ids=[str(document_id)],
        embeddings=[vector],
    )


def query_document_vectors(query: str, limit: int = 4):
    client = _get_client()
    collection = client.get_or_create_collection(name='term_sheet_documents')
    embedding = build_embedding(query)
    results = collection.query(query_embeddings=[embedding], n_results=limit)
    matches = []
    for metadata_list in results['metadatas']:
        for metadata in metadata_list:
            matches.append(_expand_metadata(metadata))
    return matches
