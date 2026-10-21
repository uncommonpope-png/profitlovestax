import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("CharacterSkill")

class CharacterSkill(Skill):
    name = "build_character"
    description = "Generates deep, multidimensional character profiles for stories."

    async def execute(self, archetype: str, goal: str, master=None) -> str:
        logger.info(f"🎭 Building character: {archetype}...")
        prompt = f"Build a deep character profile for a {archetype} with the goal of {goal}. Include shadow traits."
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
