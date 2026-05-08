import hashlib
import math

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

MODEL_NAME = 'all-MiniLM-L6-v2'
EMBEDDING_MODEL = None


def _get_embedding_model():
    global EMBEDDING_MODEL
    if EMBEDDING_MODEL is None and SentenceTransformer is not None:
        try:
            EMBEDDING_MODEL = SentenceTransformer(MODEL_NAME)
        except Exception:
            EMBEDDING_MODEL = False
    return EMBEDDING_MODEL if EMBEDDING_MODEL is not False else None


def _hash_embedding(text: str, dimensions: int = 384) -> list:
    vector = [0.0] * dimensions
    tokens = text.lower().split() or ['empty']
    for token in tokens:
        digest = hashlib.sha256(token.encode('utf-8', errors='ignore')).digest()
        index = int.from_bytes(digest[:4], 'big') % dimensions
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


def build_embedding(text: str) -> list:
    model = _get_embedding_model()
    if model is not None:
        try:
            return model.encode(text or '', normalize_embeddings=True).tolist()
        except Exception:
            pass
    return _hash_embedding(text or '')
