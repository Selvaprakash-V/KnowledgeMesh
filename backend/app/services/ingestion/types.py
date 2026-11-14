from dataclasses import dataclass


@dataclass
class TextBlock:
    text: str
    page_number: int | None = None
    section: str | None = None


@dataclass
class ChunkDraft:
    text: str
    page_number: int | None
    section: str | None
    chunk_index: int
    token_count: int
    metadata: dict
