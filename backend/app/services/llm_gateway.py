import os
import logging
import asyncio
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Attempt to load litellm
try:
    import litellm
    # Prevent extensive litellm logging in dev
    litellm.suppress_debug_info = True
    LITELLM_AVAILABLE = True
except Exception as e:
    LITELLM_AVAILABLE = False

try:
    from gradient import Gradient
    GRADIENT_AVAILABLE = True
except Exception as e:
    GRADIENT_AVAILABLE = False


class LLMGateway:
    """Advanced Central AI Gateway for all AI interactions."""

    def __init__(self):
        # High-performance DigitalOcean AI configuration as primary
        self.do_api_key = os.getenv("DO_AI_API_KEY")
        self.do_api_base = os.getenv("DO_AI_API_BASE", "https://inference.do-ai.run/v1")
        self.do_model = os.getenv("DO_AI_MODEL", "llama3.3-70b-instruct")

        if not self.do_api_key:
            logger.warning("DO_AI_API_KEY not set. DigitalOcean AI will not be available.")

        # Fallback configurations
        self.default_model = os.getenv("LLM_MODEL", "gemini/gemini-pro")
        self.is_active = LITELLM_AVAILABLE and (
            self.do_api_key or any(k in os.environ for k in ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"])
        )
        if not self.is_active:
            logger.warning("LLM APIs not fully configured. Using fallback local templates.")

        self.gradient_client = None
        if GRADIENT_AVAILABLE and os.getenv("GRADIENT_ACCESS_TOKEN"):
            self.gradient_client = Gradient()

    async def get_available_models(self) -> List[str]:
        """Fetch available models intelligently based on active provider."""
        models = []
        if self.gradient_client:
            try:
                models_list = self.gradient_client.models.list()
                models.extend([m.name for m in models_list])
            except Exception as e:
                logger.error(f"Failed to fetch Gradient models: {e}")

        # If no custom gradient client, we inject our predefined advanced model
        if not models and self.do_api_key:
            models.append(self.do_model)

        return list(set(models))

    async def generate_text(self, prompt: str, system_message: Optional[str] = None, max_tokens: int = 1500, temperature: float = 0.7, retries: int = 2) -> str:
        """Robust, production-ready async LLM text generation."""
        if not self.is_active:
            return "AI service is currently not configured."

        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        for attempt in range(retries + 1):
            try:
                kwargs = {
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }

                # Prioritize DigitalOcean AI Configuration for highest quality results
                if self.do_api_key:
                    kwargs["model"] = self.do_model
                    kwargs["api_base"] = self.do_api_base
                    kwargs["api_key"] = self.do_api_key
                    kwargs["custom_llm_provider"] = "openai"
                else:
                    kwargs["model"] = self.default_model

                response = await litellm.acompletion(**kwargs)
                if response and response.choices:
                    return response.choices[0].message.content.strip()
                return ""
            except Exception as e:
                logger.error(f"LLM Generation Error on attempt {attempt+1}: {e}")
                if attempt == retries:
                    return "Error generating response from AI."
                await asyncio.sleep(1 * (attempt + 1))

        return ""


llm_gateway = LLMGateway()
