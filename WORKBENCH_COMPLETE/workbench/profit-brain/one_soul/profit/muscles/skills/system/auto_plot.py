import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("PlotSkill")

class PlotSkill(Skill):
    name = "plot_arc"
    description = "Structures a narrative arc with setup, trials, and revelation."

    async def execute(self, premise: str, master=None) -> str:
        logger.info("📚 Plotting arc...")
        prompt = f"Structure a narrative arc for this premise: {premise}. Include Mythos phases."
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
