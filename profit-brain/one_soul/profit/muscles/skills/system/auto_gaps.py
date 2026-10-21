import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("GapSkill")

class GapSkill(Skill):
    name = "identify_gaps"
    description = "Identifies what is missing from current knowledge or plans."

    async def execute(self, topic: str, master=None) -> str:
        logger.info(f"🔍 Identifying gaps in: {topic}...")
        prompt = f"Identify the knowledge gaps and uncertainties in our current understanding of {topic}."
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
