import re
import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _email_address(value: str) -> str:
    email = value.strip()
    if len(email) > 320 or _EMAIL.fullmatch(email) is None:
        raise ValueError("Enter a valid email address")
    return email


EmailAddress = Annotated[str, AfterValidator(_email_address)]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailAddress
    name: str
    role: str
    status: str
    created_at: datetime


class RegisterRequest(BaseModel):
    email: EmailAddress
    password: str = Field(min_length=8, max_length=72)
    name: str = Field(min_length=1, max_length=200)


class LoginRequest(BaseModel):
    email: EmailAddress
    password: str = Field(min_length=1, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateUserRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: Literal["ADMIN", "KNOWLEDGE_MANAGER", "USER"] | None = None
    status: Literal["ACTIVE", "DISABLED"] | None = None


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    visibility: Literal["PRIVATE", "INTERNAL"] = "PRIVATE"


class KnowledgeBaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    visibility: Literal["PRIVATE", "INTERNAL"] | None = None


class MemberCreate(BaseModel):
    email: EmailAddress
    role: Literal["MANAGER", "VIEWER"] = "VIEWER"


class MemberOut(BaseModel):
    user_id: uuid.UUID
    email: EmailAddress
    name: str
    role: str
    created_at: datetime


class KnowledgeBaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    owner_id: uuid.UUID
    visibility: str
    created_at: datetime
    updated_at: datetime
    document_count: int = 0
    member_count: int = 0
    can_manage: bool = False


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    knowledge_base_id: uuid.UUID
    filename: str
    mime_type: str
    file_size: int
    checksum: str
    version: int
    status: str
    graph_status: str
    error_message: str | None
    graph_error: str | None
    is_active: bool
    replaces_document_id: uuid.UUID | None
    uploaded_by: uuid.UUID
    metadata_json: dict
    created_at: datetime
    updated_at: datetime


class CitationOut(BaseModel):
    document_id: str
    document_name: str
    page_number: int | None = None
    chunk_id: str
    knowledge_base_id: str
    snippet: str = ""
    index: int


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    knowledge_base_id: uuid.UUID | None = None
    document_id: uuid.UUID | None = None
    top_k: int = Field(default=10, ge=1, le=50)


class SearchHit(BaseModel):
    document_id: str
    document_name: str
    page_number: int | None
    section: str | None
    snippet: str
    score: float
    chunk_id: str
    knowledge_base_id: str


class SearchResponse(BaseModel):
    hits: list[SearchHit]
    retrieval: dict
    request_id: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: uuid.UUID | None = None
    knowledge_base_id: uuid.UUID | None = None
    stream: bool = False


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    answer: str
    citations: list[CitationOut]
    confidence: float | None
    retrieval: dict
    model: str | None
    request_id: str
    latency_ms: float


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    knowledge_base_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    metadata_json: dict
    latency_ms: int | None
    model: str | None
    created_at: datetime


class ConversationDetail(ConversationOut):
    messages: list[MessageOut]


class FeedbackRequest(BaseModel):
    message_id: uuid.UUID
    rating: Literal["HELPFUL", "NOT_HELPFUL"]
    comment: str | None = Field(default=None, max_length=2000)


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    message_id: uuid.UUID
    rating: str
    comment: str | None
    created_at: datetime


class GraphQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    knowledge_base_id: uuid.UUID | None = None


class DashboardOut(BaseModel):
    knowledge_bases: int
    documents: int
    indexed_documents: int
    failed_documents: int
    conversations: int


class ResearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=2000)
    knowledge_base_id: uuid.UUID | None = None
    depth: int = Field(default=2, ge=1, le=3)


class ResearchResponse(BaseModel):
    title: str
    query: str
    executive_dossier: str
    citations: list[CitationOut]
    confidence: float | None = None
    sub_queries: list[str] = []
    entities_involved: list[str] = []
    latency_ms: float

