import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("SelfCritiqueSkill")

class SelfCritiqueSkill(Skill):
    name = "self_critique"
    description = "Evaluates own output against standards of clarity, accuracy, and tone."

    async def execute(self, output: str, master=None) -> str:
        logger.info("🧐 Performing self-critique...")

        prompt = f"""
        Critique the following output against the Jules Engineering Methodology.
        Identify: Gaps, Tone Drift, Technical Inaccuracies.

        OUTPUT:
        {output}
        """

        if master:
            critique = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="fast")
            return f"--- CRITIQUE REPORT ---\n{critique}"

        return "Error: Master missing for critique."
