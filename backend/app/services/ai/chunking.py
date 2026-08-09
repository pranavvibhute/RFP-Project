from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class TextChunk:
    index: int
    text: str


def chunk_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[TextChunk]:
    """Split document text into overlapping chunks for retrieval."""
    normalized = "\n\n".join(part.strip() for part in text.strip().splitlines() if part.strip())
    if not normalized:
        return []

    effective_chunk_size = chunk_size or settings.RAG_CHUNK_SIZE
    effective_overlap = overlap if overlap is not None else settings.RAG_CHUNK_OVERLAP

    if len(normalized) <= effective_chunk_size:
        return [TextChunk(index=0, text=normalized)]

    chunks: list[TextChunk] = []
    start = 0

    while start < len(normalized):
        end = min(start + effective_chunk_size, len(normalized))

        if end < len(normalized):
            breakpoint = normalized.rfind("\n\n", start, end)
            if breakpoint > start + max(200, effective_chunk_size // 2):
                end = breakpoint

        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(TextChunk(index=len(chunks), text=chunk))

        if end >= len(normalized):
            break

        start = max(end - effective_overlap, start + 1)

    return chunks


def truncate_text(text: str, max_chars: int) -> str:
    """Keep prompt text within a safe upper bound."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars]
