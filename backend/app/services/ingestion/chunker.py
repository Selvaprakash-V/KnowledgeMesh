from app.config import get_settings
from app.services.ingestion.dlp import mask_pii
from app.services.ingestion.tokens import count_tokens, normalize_text, split_text, tail_tokens
from app.services.ingestion.types import ChunkDraft, TextBlock


def chunk_blocks(blocks: list[TextBlock], chunk_size: int | None = None, overlap: int | None = None) -> list[ChunkDraft]:
    settings = get_settings()
    size = chunk_size or settings.chunk_size_tokens
    overlap_tokens = settings.chunk_overlap_tokens if overlap is None else overlap
    if overlap_tokens >= size:
        overlap_tokens = max(0, size // 5)

    units = _units(blocks, size, overlap_tokens)
    drafts: list[ChunkDraft] = []
    bucket: list[TextBlock] = []
    bucket_tokens = 0

    def emit(final: bool) -> None:
        nonlocal bucket, bucket_tokens
        if not bucket:
            return
        raw_text = normalize_text("\n\n".join(part.text for part in bucket))
        text = mask_pii(raw_text)
        if text:
            pages = [part.page_number for part in bucket if part.page_number]
            sections = [part.section for part in bucket if part.section]
            drafts.append(
                ChunkDraft(
                    text=text,
                    page_number=pages[0] if pages else None,
                    section=sections[-1] if sections else None,
                    chunk_index=len(drafts),
                    token_count=count_tokens(text),
                    metadata={"page_end": pages[-1] if pages else None},
                )
            )
        if final or overlap_tokens <= 0:
            bucket = []
            bucket_tokens = 0
            return
        tail = tail_tokens(text, overlap_tokens)
        if tail and tail != text:
            page = bucket[-1].page_number
            section = bucket[-1].section
            bucket = [TextBlock(tail, page, section)]
            bucket_tokens = count_tokens(tail)
        else:
            bucket = []
            bucket_tokens = 0

    for unit in units:
        unit_tokens = count_tokens(unit.text)
        section_changed = bool(bucket and unit.section and bucket[-1].section and unit.section != bucket[-1].section)
        if section_changed:
            emit(final=False)
        if bucket and bucket_tokens + unit_tokens > size:
            emit(final=False)
            if bucket and bucket_tokens + unit_tokens > size:
                bucket = []
                bucket_tokens = 0
        bucket.append(unit)
        bucket_tokens += unit_tokens
    emit(final=True)
    for index, draft in enumerate(drafts):
        draft.chunk_index = index
    return drafts


def _units(blocks: list[TextBlock], size: int, overlap: int) -> list[TextBlock]:
    units: list[TextBlock] = []
    for block in blocks:
        text = normalize_text(block.text)
        if not text:
            continue
        if count_tokens(text) <= size:
            units.append(TextBlock(text, block.page_number, block.section))
            continue
        for part in split_text(text, size, overlap):
            cleaned = normalize_text(part)
            if cleaned:
                units.append(TextBlock(cleaned, block.page_number, block.section))
    return units
