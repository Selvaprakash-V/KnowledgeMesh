import re
from dataclasses import dataclass


def reciprocal_rank_fusion(rankings: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranking in rankings:
        seen: set[str] = set()
        for rank, item_id in enumerate(ranking, start=1):
            if item_id in seen:
                continue
            seen.add(item_id)
            scores[item_id] = scores.get(item_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)


_TOKEN = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    knowledge_base_id: str
    filename: str
    page_number: int | None
    section: str | None
    text: str
    score: float
    source: str
    text_hash: str = ""
    access_level: str = ""


@dataclass
class GraphFact:
    source: str
    source_type: str
    relation: str
    target: str
    target_type: str
    source_document_id: str | None
    source_chunk_id: str | None
    confidence: float | None
