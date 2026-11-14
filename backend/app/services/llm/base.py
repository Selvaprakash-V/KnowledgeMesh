from dataclasses import dataclass
from typing import Iterator, Protocol


@dataclass
class LLMResult:
    content: str
    model: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


class LLMProvider(Protocol):
    def complete(self, messages: list[dict], temperature: float = 0.0) -> LLMResult: ...

    def stream(self, messages: list[dict], temperature: float = 0.0) -> Iterator[str]: ...
