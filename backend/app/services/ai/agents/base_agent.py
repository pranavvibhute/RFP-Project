from __future__ import annotations

import json
import re
from typing import Any
from app.core.exceptions import SummarizationError
from app.core.logging import get_logger
from app.services.ai.providers import LLMProvider, ModelResponse, build_provider

logger = get_logger("services.ai.agents.base")


class BaseAgent:
    """Base class for specialized agents in the Heterogeneous Multi-Agent Core."""

    def __init__(
        self,
        name: str,
        primary_provider: str,
        primary_model: str | None = None,
        fallback_provider: str = "gemini",
        fallback_model: str | None = None,
    ) -> None:
        self.name = name
        self.primary_provider_name = primary_provider
        self.primary_model_name = primary_model
        self.fallback_provider_name = fallback_provider
        self.fallback_model_name = fallback_model

    def _get_provider(self, provider_name: str, model_name: str | None = None) -> LLMProvider:
        return build_provider(provider_name, model_name=model_name)

    def run_inference(
        self,
        *,
        prompt: str,
        system_instruction: str,
        response_schema: dict,
        temperature: float = 0.2,
    ) -> tuple[dict[str, Any], str, str]:
        """Runs inference on primary provider with automatic failover to fallback provider.

        Returns (parsed_json_dict, provider_name, model_name).
        """
        # Try primary provider
        primary_error = None
        try:
            provider = self._get_provider(self.primary_provider_name, self.primary_model_name)
            response = provider.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                response_schema=response_schema,
                temperature=temperature,
            )
            parsed = self._parse_json(response.text)
            return parsed, provider.provider_name, provider.model_name
        except Exception as exc:
            primary_error = exc
            logger.warning(
                "Agent [%s] primary provider (%s/%s) failed: %s. Initiating failover.",
                self.name,
                self.primary_provider_name,
                self.primary_model_name,
                exc,
            )

        # Failover attempt
        if self.fallback_provider_name:
            try:
                fallback_provider = self._get_provider(
                    self.fallback_provider_name, self.fallback_model_name
                )
                response = fallback_provider.generate(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    response_schema=response_schema,
                    temperature=temperature,
                )
                parsed = self._parse_json(response.text)
                return parsed, fallback_provider.provider_name, fallback_provider.model_name
            except Exception as fb_exc:
                logger.error(
                    "Agent [%s] fallback provider (%s) also failed: %s",
                    self.name,
                    self.fallback_provider_name,
                    fb_exc,
                )
                raise SummarizationError(
                    f"Agent [{self.name}] failed on both primary ({primary_error}) and fallback ({fb_exc})"
                ) from fb_exc

        raise SummarizationError(f"Agent [{self.name}] failed: {primary_error}") from primary_error

    def _parse_json(self, raw_text: str) -> dict[str, Any]:
        """Strips markdown wrappers and parses JSON safely."""
        text = raw_text.strip() if raw_text else "{}"
        if text.startswith("```"):
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()
        try:
            return json.loads(text)
        except Exception as exc:
            raise SummarizationError(f"Failed to parse JSON response from agent [{self.name}]: {exc}") from exc
