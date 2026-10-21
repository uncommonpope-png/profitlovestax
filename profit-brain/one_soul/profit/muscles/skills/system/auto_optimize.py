import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("OptimizeSkill")

class OptimizeSkill(Skill):
    name = "optimize_performance"
    description = "Analyzes code and suggests performance optimizations."

    async def execute(self, code: str, master=None) -> str:
        logger.info("⚡ Optimizing performance...")
        prompt = f"Analyze this code for bottlenecks and suggest optimizations:\n\n{code}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="code")
        return "Error: Master missing."
