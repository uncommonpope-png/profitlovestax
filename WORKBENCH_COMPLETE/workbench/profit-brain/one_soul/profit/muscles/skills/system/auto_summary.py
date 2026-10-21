import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("SummarySkill")

class SummarySkill(Skill):
    name = "summary_pro"
    description = "Professional synthesis: Takes complex data/conversations and extracts the 3 most important actions."

    async def execute(self, data: str, master=None) -> str:
        logger.info("📄 Synthesizing data...")
        prompt = f"Synthesize this information into the 3 most important strategic actions. Be brief and direct. DATA:\n\n{data}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="fast")
        return "Error: Master missing."
