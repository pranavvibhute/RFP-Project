from __future__ import annotations

from functools import lru_cache
from typing import Sequence

from app.core.config import settings
from app.core.exceptions import SummarizationError


@lru_cache(maxsize=1)
def _load_sentence_transformer():
    try:
        from sentence_transformers import SentenceTransformer
    except Exception as exc:  # pragma: no cover - dependency/import failure is environment-specific
        raise SummarizationError(
            "sentence-transformers is not available. Install backend requirements to enable embeddings."
        ) from exc

    return SentenceTransformer(settings.EMBEDDING_MODEL)


class EmbeddingService:
    """Produces dense embeddings for retrieval."""

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        model = _load_sentence_transformer()
        vectors = model.encode(
            list(texts),
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [vector.tolist() for vector in vectors]

    def embed_query(self, text: str) -> list[float]:
        vectors = self.embed_texts([text])
        if not vectors:
            raise SummarizationError("Failed to embed the retrieval query.")
        return vectors[0]


embedding_service = EmbeddingService()
