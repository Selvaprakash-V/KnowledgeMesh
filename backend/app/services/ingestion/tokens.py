import re

_encoder = None
_encoder_failed = False


def count_tokens(text: str) -> int:
    if not text:
        return 0
    encoder = _get_encoder()
    if encoder is None:
        return max(1, (len(text) + 3) // 4)
    return len(encoder.encode(text))


def tail_tokens(text: str, count: int) -> str:
    if count <= 0 or not text:
        return ""
    encoder = _get_encoder()
    if encoder is None:
        chars = count * 4
        return text[-chars:]
    ids = encoder.encode(text)
    return encoder.decode(ids[-count:])


def split_text(text: str, size: int, overlap: int) -> list[str]:
    if size <= 0:
        raise ValueError("size must be positive")
    overlap = min(overlap, max(0, size // 2))
    encoder = _get_encoder()
    if encoder is None:
        return _split_chars(text, size * 4, overlap * 4)
    ids = encoder.encode(text)
    parts: list[str] = []
    start = 0
    while start < len(ids):
        end = min(start + size, len(ids))
        parts.append(encoder.decode(ids[start:end]))
        if end >= len(ids):
            break
        next_start = end - overlap
        if next_start <= start:
            next_start = end
        start = next_start
    return parts


def _split_chars(text: str, size: int, overlap: int) -> list[str]:
    parts: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        parts.append(text[start:end])
        if end >= len(text):
            break
        next_start = end - overlap
        if next_start <= start:
            next_start = end
        start = next_start
    return parts


def _get_encoder():
    global _encoder, _encoder_failed
    if _encoder_failed:
        return None
    if _encoder is not None:
        return _encoder
    try:
        import tiktoken

        _encoder = tiktoken.get_encoding("cl100k_base")
    except Exception:
        _encoder_failed = True
        return None
    return _encoder


def normalize_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
