import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("RevenueSkill")

class RevenueSkill(Skill):
    name = "revenue_model_design"
    description = "Designs high-leverage economic models (subscriptions, usage-based, licensing) for products."

    async def execute(self, product_desc: str, master=None) -> str:
        logger.info(f"💰 Designing revenue model for: {product_desc[:50]}...")
        prompt = f"Design a sustainable, high-leverage revenue model for: {product_desc}. Apply the PLT framework to ensure Profit is maximized while Tax is minimized for the user."
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
