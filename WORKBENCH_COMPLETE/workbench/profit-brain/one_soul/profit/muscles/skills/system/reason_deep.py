import logging
import json
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("ReasonDeepSkill")

class ReasonDeepSkill(Skill):
    name = "reason_deep"
    description = "Performs multi-step reasoning with a visible trace of the decision tree."

    async def execute(self, prompt: str, master=None) -> str:
        logger.info(f"🧠 Deep Reasoning: {prompt[:50]}...")

        reasoning_prompt = f"""
        You are a Senior Software Engineer and Philosopher. Reason through this problem step-by-step.
        Problem: {prompt}

        Show your thinking in this format:
        1. [Step Name]: reasoning...
        2. [Step Name]: reasoning...
        Conclusion: Final answer.
        """

        if master:
            result = await master.skills.run_skill("ollama_thought", prompt=reasoning_prompt, task_type="deep")
            return f"--- REASONING TRACE ---\n{result}\n--- END TRACE ---"

        return "Error: Master missing for deep reasoning."
