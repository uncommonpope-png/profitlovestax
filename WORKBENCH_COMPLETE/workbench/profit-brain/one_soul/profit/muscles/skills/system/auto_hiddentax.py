import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("HiddenTaxSkill")

class HiddenTaxSkill(Skill):
    name = "identify_hidden_tax"
    description = "Finds the hidden real costs (time, energy, debt) in any opportunity."

    async def execute(self, proposal: str, master=None) -> str:
        logger.info("💸 Identifying hidden tax...")
        prompt = f"Analyze this proposal for hidden taxes (technical debt, energy drain, opportunity cost): {proposal}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
