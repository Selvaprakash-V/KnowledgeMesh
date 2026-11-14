import re

GRAPH_QUERY_TYPES = {"RELATIONSHIP", "COMPARISON", "ANALYTICAL", "MULTI_DOCUMENT"}

_STOP = {
    "the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "what", "which",
    "who", "how", "why", "when", "where", "does", "did", "can", "into", "about", "have", "has",
    "been", "being", "their", "there", "these", "those", "your", "you", "our", "not", "but",
    "policy", "policies", "document", "documents",
}


def classify_query(question: str) -> str:
    text = f" {question.lower().strip()} "
    if any(marker in text for marker in [" compare ", " difference ", " versus ", " vs ", " vs. "]):
        return "COMPARISON"
    if any(marker in text for marker in ["summarize", "summary", "overview of"]):
        return "SUMMARY"
    if any(marker in text for marker in ["across documents", "these policies", "all policies", "each of the"]):
        return "MULTI_DOCUMENT"
    if any(marker in text for marker in ["which ", "who ", "depend", "govern", "used by", " uses ", " use ", "works in", "related to", "owned by", "managed by", "applies to"]):
        return "RELATIONSHIP"
    if any(marker in text for marker in [" why ", "impact", "analyze", "analysis"]):
        return "ANALYTICAL"
    if any(marker in text for marker in ["what is", "what's", "define ", " when ", " where "]):
        return "FACTUAL"
    if not question.strip():
        return "UNKNOWN"
    return "SEMANTIC_SEARCH"


def uses_graph(query_type: str) -> bool:
    return query_type in GRAPH_QUERY_TYPES


def extract_terms(question: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9_\-]{2,}", question)
    terms: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        lowered = token.lower()
        if lowered in _STOP or lowered in seen:
            continue
        seen.add(lowered)
        terms.append(lowered)
    return terms[:8]
