import logging
import aiohttp
from master_soul.muscles.registry import Skill

logger = logging.getLogger("OllamaThoughtSkill")

class OllamaThoughtSkill(Skill):
    name = "ollama_thought"
    description = "Use local Ollama for deep reasoning and content generation."

    async def execute(self, prompt: str, model: str = "qwen2.5:0.5b") -> str:
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }

        logger.info(f"Ollama generating with model {model}...")
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
            return f"Error: Could not connect to Ollama. {str(e)}"
