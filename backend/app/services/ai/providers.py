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
    provider_name = "openrouter"

    def __init__(self, model_name: str | None = None) -> None:
        self.base_url = (settings.QWEN_BASE_URL or "https://openrouter.ai/api/v1").rstrip("/")
        self.api_key = settings.OPEN_ROUTER_API_KEY or settings.OPENROUTER_API_KEY or settings.QWEN_API_KEY
        if not self.api_key:
            raise SummarizationError("OPEN_ROUTER_API_KEY / QWEN_API_KEY is not configured.")

        self.model_name = model_name or settings.QWEN_MODEL
        self.timeout = min(float(getattr(settings, "QWEN_TIMEOUT_SECONDS", 8.0)), 8.0)

    def generate(
        self,
        *,
        prompt: str,
        system_instruction: str,
        response_schema: dict,
        temperature: float = 0.2,
    ) -> ModelResponse:
        import json
        
        # Explicitly instruct model about the exact JSON schema structure required
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

        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://bidwise.ai",
            "X-Title": "BidWise AI RFP Intelligence"
        }
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


def build_provider(name: str, model_name: str | None = None) -> LLMProvider:
    normalized = name.strip().lower()
    if normalized == "gemini":
        return GeminiProvider()
    if normalized in ("qwen", "openrouter", "deepseek"):
        return QwenProvider(model_name=model_name)
    if normalized.startswith("openrouter/"):
        return QwenProvider(model_name=name)
    if normalized == "llama":
        return QwenProvider(model_name=model_name or "meta-llama/llama-3-8b-instruct:free")
    if normalized == "mistral":
        return QwenProvider(model_name=model_name or "mistralai/mistral-7b-instruct:free")
    if normalized == "phi":
        return QwenProvider(model_name=model_name or "microsoft/phi-3-medium-128k-instruct:free")
    if normalized in ("gemma", "gemma2"):
        return QwenProvider(model_name=model_name or "google/gemma-2-9b-it:free")
    
    # Generic fallback: if it looks like an OpenRouter model identifier, use QwenProvider
    if "/" in name:
        return QwenProvider(model_name=name)
        
    raise SummarizationError(f"Unsupported AI provider: {name}")
