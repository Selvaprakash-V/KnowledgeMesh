import json
from collections.abc import Iterator

import httpx

from app.config import get_settings
from app.exceptions import AppError
from app.services.llm.base import LLMResult

MAX_OUTPUT_TOKENS = 1200


class OpenAICompatibleProvider:
    def __init__(self, base_url: str, api_key: str, model: str, provider_name: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.provider_name = provider_name

    def complete(self, messages: list[dict], temperature: float = 0.0) -> LLMResult:
        payload = self._request({**self._body(messages, temperature), "stream": False})
        choice = payload["choices"][0]["message"]["content"] or ""
        usage = payload.get("usage") or {}
        return LLMResult(
            content=choice,
            model=payload.get("model") or self.model,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
        )

    def stream(self, messages: list[dict], temperature: float = 0.0) -> Iterator[str]:
        body = {**self._body(messages, temperature), "stream": True}
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        try:
            with httpx.Client(timeout=120) as client:
                with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=body) as response:
                    response.raise_for_status()
                    for line in response.iter_lines():
                        if not line or not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            break
                        payload = json.loads(data)
                        delta = payload["choices"][0].get("delta") or {}
                        text = delta.get("content")
                        if text:
                            yield text
        except httpx.HTTPStatusError as exc:
            raise AppError("LLM_REQUEST_FAILED", f"{self.provider_name} returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("LLM_UNAVAILABLE", f"{self.provider_name} is unavailable.", 503) from exc

    def _body(self, messages: list[dict], temperature: float) -> dict:
        return {"model": self.model, "messages": messages, "temperature": temperature, "max_tokens": MAX_OUTPUT_TOKENS}

    def _request(self, body: dict) -> dict:
        try:
            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json=body,
                timeout=120,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise AppError("LLM_REQUEST_FAILED", f"{self.provider_name} returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("LLM_UNAVAILABLE", f"{self.provider_name} is unavailable.", 503) from exc
        return response.json()


class AnthropicProvider:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def complete(self, messages: list[dict], temperature: float = 0.0) -> LLMResult:
        system, converted = _split_system(messages)
        payload = self._post({**self._body(system, converted, temperature), "stream": False}, stream=False)
        text = "".join(block.get("text", "") for block in payload.get("content", []) if block.get("type") == "text")
        usage = payload.get("usage") or {}
        return LLMResult(text, payload.get("model") or self.model, usage.get("input_tokens"), usage.get("output_tokens"))

    def stream(self, messages: list[dict], temperature: float = 0.0) -> Iterator[str]:
        system, converted = _split_system(messages)
        body = {**self._body(system, converted, temperature), "stream": True}
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        try:
            with httpx.Client(timeout=120) as client:
                with client.stream("POST", "https://api.anthropic.com/v1/messages", headers=headers, json=body) as response:
                    response.raise_for_status()
                    for line in response.iter_lines():
                        if not line.startswith("data:"):
                            continue
                        payload = json.loads(line[5:].strip())
                        if payload.get("type") == "content_block_delta":
                            text = (payload.get("delta") or {}).get("text")
                            if text:
                                yield text
        except httpx.HTTPStatusError as exc:
            raise AppError("LLM_REQUEST_FAILED", f"Anthropic returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("LLM_UNAVAILABLE", "Anthropic is unavailable.", 503) from exc

    def _body(self, system: str, messages: list[dict], temperature: float) -> dict:
        return {
            "model": self.model,
            "max_tokens": MAX_OUTPUT_TOKENS,
            "temperature": temperature,
            "system": system,
            "messages": messages,
        }

    def _post(self, body: dict, stream: bool):
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        try:
            response = httpx.post("https://api.anthropic.com/v1/messages", headers=headers, json=body, timeout=120)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise AppError("LLM_REQUEST_FAILED", f"Anthropic returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("LLM_UNAVAILABLE", "Anthropic is unavailable.", 503) from exc


def _split_system(messages: list[dict]) -> tuple[str, list[dict]]:
    system = []
    converted = []
    for message in messages:
        if message["role"] == "system":
            system.append(message["content"])
        else:
            converted.append({"role": message["role"], "content": message["content"]})
    return "\n\n".join(system), converted


def get_llm_provider():
    settings = get_settings()
    provider = settings.llm_provider.strip().lower()
    model = settings.llm_model.strip()
    if not provider or not model:
        raise AppError("LLM_NOT_CONFIGURED", "Set LLM_PROVIDER and LLM_MODEL before asking questions.", 503)
    if provider == "openai":
        _require(settings.openai_api_key, "OPENAI_API_KEY")
        return OpenAICompatibleProvider(settings.openai_base_url, settings.openai_api_key, model, "OpenAI")
    if provider == "groq":
        _require(settings.groq_api_key, "GROQ_API_KEY")
        return OpenAICompatibleProvider(settings.groq_base_url, settings.groq_api_key, model, "Groq")
    if provider == "gemini":
        _require(settings.gemini_api_key, "GEMINI_API_KEY")
        return OpenAICompatibleProvider(settings.gemini_base_url, settings.gemini_api_key, model, "Gemini")
    if provider == "ollama":
        return OpenAICompatibleProvider(f"{settings.ollama_base_url.rstrip('/')}/v1", "ollama", model, "Ollama")
    if provider == "anthropic":
        _require(settings.anthropic_api_key, "ANTHROPIC_API_KEY")
        return AnthropicProvider(settings.anthropic_api_key, model)
    raise AppError("LLM_NOT_CONFIGURED", f"Unsupported LLM provider '{provider}'.", 400)


def _require(value: str, name: str) -> None:
    if not value:
        raise AppError("LLM_NOT_CONFIGURED", f"{name} is required for the selected LLM provider.", 503)
