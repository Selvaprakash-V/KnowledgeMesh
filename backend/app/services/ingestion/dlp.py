import re
from typing import TypedDict


class PIIFinding(TypedDict):
    entity_type: str
    start: int
    end: int
    match: str


SSN_PATTERN = re.compile(r"\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b")
CREDIT_CARD_PATTERN = re.compile(
    r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b"
)
CARD_FORMATTED_PATTERN = re.compile(r"\b(?:\d{4}[ -]){3}\d{4}\b")
API_KEY_PATTERN = re.compile(
    r"(?i)\b(?:sk_live_[0-9a-zA-Z]{24,}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[0-9a-zA-Z]{10,48}|AIza[0-9A-Za-z-_]{35}|(?:api[_-]?key[\w\-]{8,}|bearer\s+[a-z0-9_\-\.]{20,}))\b"
)
PRIVATE_KEY_PATTERN = re.compile(
    r"-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)? PRIVATE KEY-----[\s\S]+?-----END (?:RSA|EC|DSA|OPENSSH|PGP)? PRIVATE KEY-----"
)
PHONE_PATTERN = re.compile(
    r"\b(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
)


def mask_pii(text: str) -> str:
    """Mask sensitive PII and secrets in document text before indexing."""
    if not text:
        return text

    # Mask private keys
    text = PRIVATE_KEY_PATTERN.sub("[REDACTED-PRIVATE-KEY]", text)

    # Mask API tokens and secrets
    text = API_KEY_PATTERN.sub("[REDACTED-SECRET]", text)

    # Mask credit cards
    text = CARD_FORMATTED_PATTERN.sub("[REDACTED-CARD]", text)
    text = CREDIT_CARD_PATTERN.sub("[REDACTED-CARD]", text)

    # Mask SSNs
    text = SSN_PATTERN.sub("[REDACTED-SSN]", text)

    # Mask phone numbers
    text = PHONE_PATTERN.sub("[REDACTED-PHONE]", text)

    return text


def detect_pii(text: str) -> list[PIIFinding]:
    """Identify PII occurrences for compliance and audit logging."""
    findings: list[PIIFinding] = []
    if not text:
        return findings

    patterns = [
        ("PRIVATE_KEY", PRIVATE_KEY_PATTERN),
        ("SECRET_KEY", API_KEY_PATTERN),
        ("CREDIT_CARD", CARD_FORMATTED_PATTERN),
        ("CREDIT_CARD", CREDIT_CARD_PATTERN),
        ("SSN", SSN_PATTERN),
        ("PHONE", PHONE_PATTERN),
    ]

    for entity_type, pattern in patterns:
        for match in pattern.finditer(text):
            findings.append(
                PIIFinding(
                    entity_type=entity_type,
                    start=match.start(),
                    end=match.end(),
                    match=match.group(0),
                )
            )

    return findings
