import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("EstateSkill")

class EstateSkill(Skill):
    name = "apply_estate_doctrine"
    description = "Applies the 40 Laws of the Estate to real-world situations and decisions."

    async def execute(self, situation: str, master=None) -> str:
        logger.info("🏰 Applying Estate Doctrine...")
        prompt = f"Apply the 40 Laws of the Estate to the following situation. Which laws are most relevant and how should they guide our action? SITUATION: {situation}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
