import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("RefactorSkill")

class RefactorSkill(Skill):
    name = "refactor_for_clarity"
    description = "Improves code readability and intent without changing behavior."

    async def execute(self, code: str, master=None) -> str:
        logger.info("✨ Refactoring for clarity...")
        prompt = f"Refactor this code to improve clarity and readability (clean code principles):\n\n{code}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="code")
        return "Error: Master missing."
