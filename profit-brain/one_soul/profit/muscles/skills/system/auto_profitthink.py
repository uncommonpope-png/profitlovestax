import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("ProfitThinkSkill")

class ProfitThinkSkill(Skill):
    name = "profit_thinking"
    description = "Analyzes how to expand economic leverage and distribution."

    async def execute(self, idea: str, master=None) -> str:
        logger.info("📈 Profit thinking...")
        prompt = f"How can we expand the economic leverage and distribution for this idea: {idea}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
