from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import httpx

from app.core.config import settings
from app.core.exceptions import SummarizationError
from app.services.ai.client import gemini_client


@dataclass(frozen=True)
class ModelResponse:
    text: str
    provider: str
    model: str
    raw: object | None = None


class LLMProvider(Protocol):
    provider_name: str
    model_name: str

    def generate(
        self,
        *,
        prompt: str,
        system_instruction: str,
        response_schema: dict,
        temperature: float = 0.2,
    ) -> ModelResponse: ...


class QwenProvider:
    provider_name = "qwen"

    def __init__(self, model_name: str | None = None) -> None:
        if not settings.QWEN_BASE_URL:
            raise SummarizationError("QWEN_BASE_URL is not configured.")

        self.model_name = model_name or settings.QWEN_MODEL
        self.base_url = settings.QWEN_BASE_URL.rstrip("/")
        self.api_key = settings.QWEN_API_KEY
        self.timeout = settings.QWEN_TIMEOUT_SECONDS

    def generate(
        self,
        *,
        prompt: str,
        system_instruction: str,
        response_schema: dict,
        temperature: float = 0.2,
    ) -> ModelResponse:
        import json
        
        # Explicitly instruct Qwen about the exact JSON schema structure required
        schema_instruction = (
            f"\n\nYou MUST return a JSON object that strictly adheres to the following JSON Schema structure:\n"
            f"{json.dumps(response_schema, indent=2)}\n"
            f"Do not include any key or structure not specified in this schema. All requirements and risks must match the schema definitions."
        )

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_instruction + schema_instruction},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "response_format": {
                "type": "json_object"
            }
        }

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices") or []
        if not choices:
            raise SummarizationError("Qwen returned no choices.")

        message = choices[0].get("message") or {}
        text = message.get("content") or choices[0].get("text") or ""
        if isinstance(text, list):
            text = "".join(item.get("text", "") for item in text if isinstance(item, dict))

        return ModelResponse(text=str(text), provider=self.provider_name, model=self.model_name, raw=data)


class GeminiProvider:
    provider_name = "gemini"

    def __init__(self) -> None:
        self.model_name = gemini_client.model

    def generate(
        self,
        *,
        prompt: str,
        system_instruction: str,
        response_schema: dict,
        temperature: float = 0.2,
    ) -> ModelResponse:
        response = gemini_client.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            response_schema=response_schema,
            temperature=temperature,
        )
        return ModelResponse(
            text=response.text or "",
            provider=self.provider_name,
            model=self.model_name,
            raw=response,
        )


def build_provider(name: str) -> LLMProvider:
    normalized = name.strip().lower()
    if normalized == "qwen":
        return QwenProvider()
    if normalized == "gemini":
        return GeminiProvider()
    if normalized == "llama":
        return QwenProvider(model_name="meta-llama/llama-3-8b-instruct:free")
    if normalized == "mistral":
        return QwenProvider(model_name="mistralai/mistral-7b-instruct:free")
    if normalized == "phi":
        return QwenProvider(model_name="microsoft/phi-3-medium-128k-instruct:free")
    if normalized in ("gemma", "gemma2"):
        return QwenProvider(model_name="google/gemma-2-9b-it:free")
    raise SummarizationError(f"Unsupported AI provider: {name}")
