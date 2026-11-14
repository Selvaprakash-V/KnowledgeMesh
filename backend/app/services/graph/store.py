import logging
import uuid
from datetime import datetime, timezone

from neo4j import GraphDatabase

from app.config import get_settings
from app.exceptions import AppError
from app.services.retrieval.types import GraphFact

logger = logging.getLogger(__name__)

LABELS = {
    "PERSON": "Person",
    "ORGANIZATION": "Organization",
    "DEPARTMENT": "Department",
    "PROJECT": "Project",
    "PRODUCT": "Product",
    "SYSTEM": "System",
    "POLICY": "Policy",
    "PROCESS": "Process",
    "LOCATION": "Location",
    "TECHNOLOGY": "Technology",
    "DOCUMENT": "Document",
    "CONCEPT": "Concept",
}
RELATIONS = {
    "WORKS_IN",
    "OWNS",
    "USES",
    "MANAGES",
    "DEPENDS_ON",
    "GOVERNS",
    "RELATED_TO",
    "PART_OF",
    "LOCATED_IN",
    "MENTIONS",
    "APPLIES_TO",
    "REQUIRES",
}

_store = None


class GraphStore:
    def __init__(self):
        settings = get_settings()
        self.driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
            connection_timeout=5,
        )
        self._ready = False

    def close(self) -> None:
        self.driver.close()

    def ping(self) -> None:
        with self.driver.session() as session:
            session.run("RETURN 1").consume()

    def ensure_constraints(self) -> None:
        if self._ready:
            return
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE")
            session.run("CREATE CONSTRAINT document_node_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE")
        self._ready = True

    def replace_document_graph(self, document_id: str, knowledge_base_id: str, filename: str, payload: dict) -> None:
        self.ensure_constraints()
        now = datetime.now(timezone.utc).isoformat()
        entities = payload.get("entities") or []
        relationships = payload.get("relationships") or []
        for entity in entities:
            if entity["label"] not in LABELS.values():
                raise AppError("GRAPH_WRITE_FAILED", "Refusing to write an unsupported entity type.", 500)
        for relation in relationships:
            if relation["relation"] not in RELATIONS:
                raise AppError("GRAPH_WRITE_FAILED", "Refusing to write an unsupported relationship.", 500)

        def work(tx):
            tx.run("MATCH ()-[r]->() WHERE r.source_document_id = $doc_id DELETE r", doc_id=document_id)
            tx.run("MATCH (d:Document {id: $doc_id}) DETACH DELETE d", doc_id=document_id)
            tx.run(
                "MERGE (d:Document {id: $doc_id}) SET d.filename = $filename, d.knowledge_base_id = $kb",
                doc_id=document_id,
                filename=filename,
                kb=knowledge_base_id,
            )
            for entity in entities:
                tx.run(
                    f"MERGE (e:{entity['label']}:Entity {{id: $id}}) "
                    "SET e.name = $name, e.type = $type, e.knowledge_base_id = $kb, "
                    "e.created_at = coalesce(e.created_at, $now)",
                    id=entity["id"],
                    name=entity["name"],
                    type=entity["type"],
                    kb=knowledge_base_id,
                    now=now,
                )
                tx.run(
                    "MATCH (d:Document {id: $doc_id}) MATCH (e:Entity {id: $id}) "
                    "CREATE (d)-[:MENTIONS {source_document_id: $doc_id, source_chunk_id: $chunk_id, "
                    "knowledge_base_id: $kb, created_at: $now}]->(e)",
                    doc_id=document_id,
                    id=entity["id"],
                    chunk_id=entity["chunk_id"],
                    kb=knowledge_base_id,
                    now=now,
                )
            for relation in relationships:
                tx.run(
                    f"MATCH (a:Entity {{id: $source_id}}) MATCH (b:Entity {{id: $target_id}}) "
                    f"CREATE (a)-[:{relation['relation']} {{source_document_id: $doc_id, source_chunk_id: $chunk_id, "
                    "confidence: $confidence, knowledge_base_id: $kb, created_at: $now}]->(b)",
                    source_id=relation["source_id"],
                    target_id=relation["target_id"],
                    doc_id=document_id,
                    chunk_id=relation["chunk_id"],
                    confidence=relation.get("confidence"),
                    kb=knowledge_base_id,
                    now=now,
                )
            tx.run(
                "MATCH (e:Entity) WHERE e.knowledge_base_id = $kb AND NOT (e)--() DELETE e",
                kb=knowledge_base_id,
            )

        with self.driver.session() as session:
            session.execute_write(work)

    def delete_document(self, document_id: str, knowledge_base_id: str) -> None:
        self.ensure_constraints()

        def work(tx):
            tx.run("MATCH ()-[r]->() WHERE r.source_document_id = $doc_id DELETE r", doc_id=document_id)
            tx.run("MATCH (d:Document {id: $doc_id}) DETACH DELETE d", doc_id=document_id)
            tx.run("MATCH (e:Entity) WHERE e.knowledge_base_id = $kb AND NOT (e)--() DELETE e", kb=knowledge_base_id)

        with self.driver.session() as session:
            session.execute_write(work)

    def search(self, terms: list[str], kb_ids: list[str], depth: int = 1) -> list[GraphFact]:
        if not terms or not kb_ids:
            return []
        self.ensure_constraints()
        facts = self._hop(terms, kb_ids)
        if depth >= 2:
            facts.extend(self._two_hop(terms, kb_ids))
        return _dedupe(facts)

    def list_entities(self, kb_ids: list[str], query: str, limit: int = 50) -> list[dict]:
        if not kb_ids:
            return []
        self.ensure_constraints()
        with self.driver.session() as session:
            records = session.run(
                "MATCH (e:Entity) WHERE e.knowledge_base_id IN $kbs "
                "AND ($q = '' OR toLower(e.name) CONTAINS $q) "
                "RETURN e.id AS id, e.name AS name, e.type AS type, e.knowledge_base_id AS knowledge_base_id "
                "ORDER BY e.name LIMIT $limit",
                kbs=kb_ids,
                q=query.lower().strip(),
                limit=limit,
            )
            return [record.data() for record in records]

    def get_entity(self, entity_id: str) -> dict | None:
        self.ensure_constraints()
        with self.driver.session() as session:
            record = session.run(
                "MATCH (e:Entity {id: $id}) "
                "OPTIONAL MATCH (e)-[r]->(b:Entity) "
                "OPTIONAL MATCH (a:Entity)-[r2]->(e) "
                "OPTIONAL MATCH (d:Document)-[m:MENTIONS]->(e) "
                "RETURN e.id AS id, e.name AS name, e.type AS type, e.knowledge_base_id AS knowledge_base_id, "
                "collect(DISTINCT {source: e.name, source_type: e.type, relation: type(r), target: b.name, target_type: b.type, "
                "source_document_id: r.source_document_id, source_chunk_id: r.source_chunk_id, confidence: r.confidence}) AS outgoing, "
                "collect(DISTINCT {source: a.name, source_type: a.type, relation: type(r2), target: e.name, target_type: e.type, "
                "source_document_id: r2.source_document_id, source_chunk_id: r2.source_chunk_id, confidence: r2.confidence}) AS incoming, "
                "collect(DISTINCT {document_id: d.id, filename: d.filename, chunk_id: m.source_chunk_id}) AS sources",
                id=entity_id,
            ).single()
        if record is None or record["id"] is None:
            return None
        data = record.data()
        data["outgoing"] = [item for item in data["outgoing"] if item.get("target")]
        data["incoming"] = [item for item in data["incoming"] if item.get("source")]
        data["sources"] = [item for item in data["sources"] if item.get("document_id")]
        return data

    def get_subgraph(self, kb_ids: list[str], limit: int = 100) -> dict:
        if not kb_ids:
            return {"nodes": [], "links": []}
        self.ensure_constraints()
        with self.driver.session() as session:
            records = session.run(
                "MATCH (a:Entity)-[r]->(b:Entity) "
                "WHERE a.knowledge_base_id IN $kbs AND b.knowledge_base_id IN $kbs AND type(r) <> 'MENTIONS' "
                "RETURN a.id AS source_id, a.name AS source_name, a.type AS source_type, "
                "b.id AS target_id, b.name AS target_name, b.type AS target_type, "
                "type(r) AS relation, r.confidence AS confidence "
                "LIMIT $limit",
                kbs=kb_ids,
                limit=limit,
            )
            nodes = {}
            links = []
            for record in records:
                s_id = record["source_id"]
                t_id = record["target_id"]
                if s_id not in nodes:
                    nodes[s_id] = {"id": s_id, "name": record["source_name"], "type": record["source_type"]}
                if t_id not in nodes:
                    nodes[t_id] = {"id": t_id, "name": record["target_name"], "type": record["target_type"]}
                links.append({
                    "source": s_id,
                    "target": t_id,
                    "relation": record["relation"],
                    "confidence": record.get("confidence"),
                })
            if len(nodes) < limit:
                rem = limit - len(nodes)
                single_records = session.run(
                    "MATCH (e:Entity) WHERE e.knowledge_base_id IN $kbs "
                    "RETURN e.id AS id, e.name AS name, e.type AS type LIMIT $limit",
                    kbs=kb_ids,
                    limit=rem,
                )
                for s in single_records:
                    e_id = s["id"]
                    if e_id not in nodes:
                        nodes[e_id] = {"id": e_id, "name": s["name"], "type": s["type"]}
            return {"nodes": list(nodes.values()), "links": links}

    def _hop(self, terms: list[str], kb_ids: list[str]) -> list[GraphFact]:
        query = (
            "MATCH (a:Entity)-[r]->(b:Entity) "
            "WHERE a.knowledge_base_id IN $kbs AND type(r) <> 'MENTIONS' "
            "AND any(term IN $terms WHERE toLower(a.name) CONTAINS term OR toLower(b.name) CONTAINS term) "
            "RETURN a.name AS source, a.type AS source_type, type(r) AS relation, b.name AS target, b.type AS target_type, "
            "r.source_document_id AS source_document_id, r.source_chunk_id AS source_chunk_id, r.confidence AS confidence "
            "LIMIT 30"
        )
        return [_fact(row) for row in self._rows(query, terms, kb_ids)]

    def _two_hop(self, terms: list[str], kb_ids: list[str]) -> list[GraphFact]:
        query = (
            "MATCH (a:Entity)-[r1]->(m:Entity)-[r2]->(b:Entity) "
            "WHERE a.knowledge_base_id IN $kbs AND type(r1) <> 'MENTIONS' AND type(r2) <> 'MENTIONS' "
            "AND any(term IN $terms WHERE toLower(a.name) CONTAINS term OR toLower(m.name) CONTAINS term OR toLower(b.name) CONTAINS term) "
            "RETURN a.name AS source, a.type AS source_type, type(r1) AS relation, m.name AS target, m.type AS target_type, "
            "r1.source_document_id AS source_document_id, r1.source_chunk_id AS source_chunk_id, r1.confidence AS confidence "
            "LIMIT 20"
        )
        first = [_fact(row) for row in self._rows(query, terms, kb_ids)]
        query2 = (
            "MATCH (a:Entity)-[r1]->(m:Entity)-[r2]->(b:Entity) "
            "WHERE a.knowledge_base_id IN $kbs AND type(r1) <> 'MENTIONS' AND type(r2) <> 'MENTIONS' "
            "AND any(term IN $terms WHERE toLower(a.name) CONTAINS term OR toLower(m.name) CONTAINS term OR toLower(b.name) CONTAINS term) "
            "RETURN m.name AS source, m.type AS source_type, type(r2) AS relation, b.name AS target, b.type AS target_type, "
            "r2.source_document_id AS source_document_id, r2.source_chunk_id AS source_chunk_id, r2.confidence AS confidence "
            "LIMIT 20"
        )
        return first + [_fact(row) for row in self._rows(query2, terms, kb_ids)]

    def _rows(self, query: str, terms: list[str], kb_ids: list[str]) -> list[dict]:
        with self.driver.session() as session:
            return [record.data() for record in session.run(query, terms=terms, kbs=kb_ids)]


def get_graph_store() -> GraphStore:
    global _store
    if _store is None:
        try:
            _store = GraphStore()
        except Exception as exc:
            raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503) from exc
    return _store


def close_graph_store() -> None:
    global _store
    if _store is not None:
        _store.close()
        _store = None


def entity_id(knowledge_base_id: str, entity_type: str, name: str) -> str:
    key = f"{knowledge_base_id}|{entity_type}|{name.strip().lower()}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def _fact(row: dict) -> GraphFact:
    confidence = row.get("confidence")
    if not isinstance(confidence, (int, float)):
        confidence = None
    return GraphFact(
        source=row.get("source") or "",
        source_type=row.get("source_type") or "",
        relation=row.get("relation") or "",
        target=row.get("target") or "",
        target_type=row.get("target_type") or "",
        source_document_id=row.get("source_document_id"),
        source_chunk_id=row.get("source_chunk_id"),
        confidence=confidence,
    )


def _dedupe(facts: list[GraphFact]) -> list[GraphFact]:
    seen = set()
    unique = []
    for fact in facts:
        key = (fact.source, fact.relation, fact.target, fact.source_chunk_id)
        if key in seen or not fact.source or not fact.target:
            continue
        seen.add(key)
        unique.append(fact)
    return unique
