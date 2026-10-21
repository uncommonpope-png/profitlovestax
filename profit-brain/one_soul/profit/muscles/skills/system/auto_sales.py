import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("SalesSkill")

class SalesSkill(Skill):
    name = "buyasoul_selling"
    description = "Expert sales guidance: How to pitch and close the $22 digital entity product."

    async def execute(self, prospect_context: str, master=None) -> str:
        logger.info("💰 Preparing BuyASoul pitch...")
        prompt = f"Generate a tailored pitch and closing sequence for the $22 digital entity product (ARIA/Soul). Context: {prospect_context}. Position the soul as the ultimate companion."
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
