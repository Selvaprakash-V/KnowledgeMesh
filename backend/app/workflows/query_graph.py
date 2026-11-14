import time
from dataclasses import asdict, dataclass
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.exceptions import AppError
from app.services.rag.citations import INSUFFICIENT_EVIDENCE_MESSAGE, build_citations, evidence_from_chunks
from app.services.rag.classifier import classify_query, extract_terms, uses_graph
from app.services.rag.prompts import build_messages
from app.services.retrieval.service import fuse, graph_search, keyword_search, rerank, vector_search
from app.services.retrieval.types import GraphFact, RetrievedChunk


class QueryState(TypedDict, total=False):
    question: str
    query_type: str
    use_graph: bool
    entities: list
    kb_ids: list
    document_id: str | None
    history: list
    vector_results: list
    keyword_results: list
    graph_results: list
    fused_results: list
    reranked_results: list
    scores_normalized: bool
    evidence: list
    graph_facts: list
    insufficient: bool
    answer: str
    citations: list
    confidence: float | None
    timings: dict
    model: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    messages: list


@dataclass
class QueryDeps:
    db: Any
    settings: Any
    embedder: Any = None
    vector_store: Any = None
    reranker: Any = None
    graph_store: Any = None
    llm: Any = None


def build_query_graph(deps: QueryDeps, *, generate: bool):
    graph = StateGraph(QueryState)

    def analyze_query(state: dict) -> dict:
        started = time.perf_counter()
        query_type = classify_query(state["question"])
        timings = dict(state.get("timings") or {})
        timings["analyze"] = _ms(started)
        return {"query_type": query_type, "use_graph": uses_graph(query_type), "timings": timings}

    def extract_entities(state: dict) -> dict:
        return {"entities": extract_terms(state["question"])}

    def retrieve_vector(state: dict) -> dict:
        started = time.perf_counter()
        chunks, embedding_ms = vector_search(
            deps, state["question"], state["kb_ids"], state.get("document_id"), deps.settings.retrieval_vector_k
        )
        timings = dict(state.get("timings") or {})
        timings["embedding"] = embedding_ms
        timings["vector_search"] = _ms(started) - embedding_ms
        return {"vector_results": chunks, "timings": timings}

    def retrieve_keyword(state: dict) -> dict:
        started = time.perf_counter()
        chunks = keyword_search(deps, state["question"], state["kb_ids"], state.get("document_id"), deps.settings.retrieval_keyword_k)
        timings = dict(state.get("timings") or {})
        timings["keyword_search"] = _ms(started)
        return {"keyword_results": chunks, "timings": timings}

    def retrieve_graph(state: dict) -> dict:
        started = time.perf_counter()
        facts = graph_search(deps, state["question"], state.get("entities") or [], state["kb_ids"], state.get("query_type") or "")
        timings = dict(state.get("timings") or {})
        timings["graph"] = _ms(started)
        return {"graph_results": facts, "timings": timings}

    def skip_graph(state: dict) -> dict:
        timings = dict(state.get("timings") or {})
        timings["graph"] = 0.0
        return {"graph_results": [], "timings": timings}

    def fuse_node(state: dict) -> dict:
        fused = fuse(deps, state.get("vector_results") or [], state.get("keyword_results") or [])
        return {"fused_results": fused}

    def rerank_node(state: dict) -> dict:
        started = time.perf_counter()
        ranked, normalized = rerank(deps, state["question"], state.get("fused_results") or [])
        timings = dict(state.get("timings") or {})
        timings["rerank"] = _ms(started)
        return {"reranked_results": ranked, "scores_normalized": normalized, "timings": timings}

    def validate_evidence(state: dict) -> dict:
        evidence_chunks: list[RetrievedChunk] = state.get("reranked_results") or []
        evidence = evidence_from_chunks(evidence_chunks, bool(state.get("scores_normalized")))
        facts = [_fact_dict(fact) for fact in state.get("graph_results") or []]
        insufficient = not evidence and not facts
        return {"evidence": evidence, "graph_facts": facts, "insufficient": insufficient}

    def generate_answer(state: dict) -> dict:
        if state.get("insufficient"):
            return {"answer": INSUFFICIENT_EVIDENCE_MESSAGE, "model": None, "prompt_tokens": None, "completion_tokens": None, "messages": []}
        if deps.llm is None:
            raise AppError("LLM_NOT_CONFIGURED", "Set LLM_PROVIDER and LLM_MODEL before asking questions.", 503)
        messages = build_messages(
            state["question"],
            state.get("evidence") or [],
            state.get("graph_facts") or [],
            state.get("history") or [],
            deps.settings.history_token_budget,
            deps.settings.context_token_budget,
        )
        started = time.perf_counter()
        result = deps.llm.complete(messages, temperature=deps.settings.llm_temperature)
        timings = dict(state.get("timings") or {})
        timings["llm"] = _ms(started)
        return {
            "answer": result.content,
            "model": result.model,
            "prompt_tokens": result.prompt_tokens,
            "completion_tokens": result.completion_tokens,
            "messages": messages,
            "timings": timings,
        }

    def validate_citations(state: dict) -> dict:
        answer, citations, confidence = build_citations(state.get("answer") or "", state.get("evidence") or [])
        return {"answer": answer, "citations": citations, "confidence": confidence}

    def route_graph(state: dict) -> str:
        return "retrieve_graph" if state.get("use_graph") else "skip_graph"

    graph.add_node("analyze_query", analyze_query)
    graph.add_node("extract_entities", extract_entities)
    graph.add_node("retrieve_vector", retrieve_vector)
    graph.add_node("retrieve_keyword", retrieve_keyword)
    graph.add_node("retrieve_graph", retrieve_graph)
    graph.add_node("skip_graph", skip_graph)
    graph.add_node("fuse_results", fuse_node)
    graph.add_node("rerank", rerank_node)
    graph.add_node("validate_evidence", validate_evidence)
    graph.set_entry_point("analyze_query")
    graph.add_edge("analyze_query", "extract_entities")
    graph.add_edge("extract_entities", "retrieve_vector")
    graph.add_edge("retrieve_vector", "retrieve_keyword")
    graph.add_conditional_edges("retrieve_keyword", route_graph, {"retrieve_graph": "retrieve_graph", "skip_graph": "skip_graph"})
    graph.add_edge("retrieve_graph", "fuse_results")
    graph.add_edge("skip_graph", "fuse_results")
    graph.add_edge("fuse_results", "rerank")
    graph.add_edge("rerank", "validate_evidence")
    if generate:
        graph.add_node("generate_answer", generate_answer)
        graph.add_node("validate_citations", validate_citations)
        graph.add_edge("validate_evidence", "generate_answer")
        graph.add_edge("generate_answer", "validate_citations")
        graph.add_edge("validate_citations", END)
    else:
        graph.add_edge("validate_evidence", END)
    return graph.compile()


def run_query(deps: QueryDeps, *, question: str, kb_ids: list[str], document_id: str | None, history: list[dict], generate: bool) -> dict:
    app = build_query_graph(deps, generate=generate)
    return app.invoke(
        {
            "question": question,
            "kb_ids": kb_ids,
            "document_id": document_id,
            "history": history,
            "timings": {},
        }
    )


def _fact_dict(fact: GraphFact | dict) -> dict:
    if isinstance(fact, dict):
        return fact
    return asdict(fact)


def _ms(started: float) -> float:
    return round((time.perf_counter() - started) * 1000, 2)
