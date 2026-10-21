import logging
import aiohttp
import json
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("OllamaThoughtSkill")

class OllamaThoughtSkill(Skill):
    name = "ollama_thought"
    description = "Use local Ollama for deep reasoning and content generation with multi-model routing."

    # Model Routing Map (2026 standards)
    ROUTING = {
        "fast": "qwen2.5:0.5b",    # Small, fast for simple thoughts
        "code": "qwen2.5-coder:0.5b", # Specialized for code
        "deep": "gemma:2b",        # Larger for complex reasoning
        "legacy": "qwen:0.5b"
    }

    async def execute(self, prompt: str, task_type: str = "fast") -> str:
        model = self.ROUTING.get(task_type, self.ROUTING["fast"])
        url = "http://127.0.0.1:11434/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }

        logger.info(f"Ollama routing to model: {model} (Task: {task_type})")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=60) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "")
                    else:
                        return f"Ollama error: Status {response.status}"
        except Exception as e:
            logger.error(f"Ollama connection failed: {e}")
            return f"Error: Could not connect to Ollama. Ensure 'ollama serve' is running. {str(e)}"
