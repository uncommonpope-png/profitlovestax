import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("PrincipleSkill")

class PrincipleSkill(Skill):
    name = "extract_principles"
    description = "Extracts universal principles from specific examples or cases."

    async def execute(self, context: str, master=None) -> str:
        logger.info("🏺 Extracting principles...")
        prompt = f"Extract universal principles and boundary conditions from this context:\n\n{context}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
