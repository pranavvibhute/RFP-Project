from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models

from app.core.config import settings
from app.core.exceptions import SummarizationError
from app.services.ai.chunking import TextChunk


@dataclass(frozen=True)
class RetrievalHit:
    score: float
    text: str
    chunk_index: int
    payload: dict[str, Any]


class QdrantDocumentStore:
    """Persists and retrieves document chunks for RAG."""

    def __init__(self) -> None:
        if settings.QDRANT_URL:
            self.client = QdrantClient(
                url=settings.QDRANT_URL, 
                api_key=settings.QDRANT_API_KEY, 
                check_compatibility=False
            )
        else:
            self.client = QdrantClient(
                location=settings.QDRANT_LOCATION, 
                api_key=settings.QDRANT_API_KEY, 
                check_compatibility=False
            )

    @property
    def collection_name(self) -> str:
        return settings.QDRANT_COLLECTION

    def ensure_collection(self, vector_size: int) -> None:
        if self.client.collection_exists(self.collection_name):
            return

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=qdrant_models.VectorParams(
                size=vector_size,
                distance=qdrant_models.Distance.COSINE,
            ),
        )

    def upsert_document(
        self,
        *,
        document_id: str,
        filename: str,
        chunks: list[TextChunk],
        embeddings: list[list[float]],
    ) -> None:
        if len(chunks) != len(embeddings):
            raise SummarizationError("Chunk and embedding counts do not match.")

        if not chunks:
            return

        self.ensure_collection(vector_size=len(embeddings[0]))

        points = []
        for chunk, vector in zip(chunks, embeddings, strict=True):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{document_id}:{chunk.index}"))
            payload = {
                "document_id": document_id,
                "filename": filename,
                "chunk_index": chunk.index,
                "text": chunk.text,
                "text_length": len(chunk.text),
            }
            points.append(
                qdrant_models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )

        self.client.upsert(collection_name=self.collection_name, points=points)

    def search(
        self,
        *,
        document_id: str,
        query_vector: list[float],
        limit: int,
    ) -> list[RetrievalHit]:
        search_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit,
            with_payload=True,
            query_filter=qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="document_id",
                        match=qdrant_models.MatchValue(value=document_id),
                    )
                ]
            ),
        )

        hits: list[RetrievalHit] = []
        for result in search_results:
            payload = result.payload or {}
            hits.append(
                RetrievalHit(
                    score=float(result.score or 0.0),
                    text=str(payload.get("text", "")),
                    chunk_index=int(payload.get("chunk_index", 0)),
                    payload=dict(payload),
                )
            )

        return hits


document_store = QdrantDocumentStore()
