from qdrant_client import QdrantClient
from qdrant_client.http import models as rest

from app.config import get_settings
from app.exceptions import AppError


class QdrantVectorStore:
    def __init__(self):
        settings = get_settings()
        self.collection = settings.qdrant_collection
        self.client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None, timeout=10)

    def collection_exists(self) -> bool:
        names = [item.name for item in self.client.get_collections().collections]
        return self.collection in names

    def ensure(self, dimension: int) -> None:
        if dimension <= 0:
            raise AppError("EMBEDDING_FAILED", "Embedding dimension is unknown.", 500)
        if not self.collection_exists():
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=rest.VectorParams(size=dimension, distance=rest.Distance.COSINE),
            )
            for field in ("knowledge_base_id", "document_id", "access_level"):
                self.client.create_payload_index(
                    collection_name=self.collection,
                    field_name=field,
                    field_schema=rest.PayloadSchemaType.KEYWORD,
                )
            return
        info = self.client.get_collection(self.collection)
        size = _vector_size(info)
        if size != dimension:
            raise AppError(
                "VECTOR_DIMENSION_MISMATCH",
                f"Qdrant collection '{self.collection}' has dimension {size}, but embeddings produced {dimension}.",
                500,
            )

    def upsert(self, points: list[dict]) -> None:
        if not points:
            return
        self.client.upsert(
            collection_name=self.collection,
            points=[
                rest.PointStruct(id=point["id"], vector=point["vector"], payload=point["payload"])
                for point in points
            ],
        )

    def delete_document(self, document_id: str) -> None:
        if not self.collection_exists():
            return
        selector = rest.FilterSelector(
            filter=rest.Filter(
                must=[rest.FieldCondition(key="document_id", match=rest.MatchValue(value=document_id))]
            )
        )
        self.client.delete(collection_name=self.collection, points_selector=selector)

    def search(self, vector: list[float], kb_ids: list[str], document_id: str | None, limit: int) -> list[tuple[str, float]]:
        if not kb_ids or limit <= 0 or not self.collection_exists():
            return []
        must = [rest.FieldCondition(key="knowledge_base_id", match=rest.MatchAny(any=kb_ids))]
        must.append(rest.FieldCondition(key="active", match=rest.MatchValue(value=True)))
        if document_id:
            must.append(rest.FieldCondition(key="document_id", match=rest.MatchValue(value=document_id)))
        query_filter = rest.Filter(must=must)
        if hasattr(self.client, "query_points"):
            response = self.client.query_points(
                collection_name=self.collection,
                query=vector,
                query_filter=query_filter,
                limit=limit,
                with_payload=True,
            )
            points = response.points
        else:
            points = self.client.search(
                collection_name=self.collection,
                query_vector=vector,
                query_filter=query_filter,
                limit=limit,
            )
        return [(str(point.id), float(point.score)) for point in points]


def get_vector_store() -> QdrantVectorStore:
    try:
        return QdrantVectorStore()
    except Exception as exc:
        raise AppError("VECTOR_STORE_UNAVAILABLE", "Qdrant is unavailable.", 503) from exc


def _vector_size(info) -> int:
    vectors = info.config.params.vectors
    if hasattr(vectors, "size"):
        return int(vectors.size)
    if isinstance(vectors, dict) and vectors:
        first = next(iter(vectors.values()))
        return int(first.size)
    raise AppError("VECTOR_STORE_UNAVAILABLE", "Could not read the Qdrant collection configuration.", 503)
