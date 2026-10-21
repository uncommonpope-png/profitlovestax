import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("MarketSkill")

class MarketSkill(Skill):
    name = "market_research"
    description = "Conducts deep market analysis, competitor tracking, and identifies gaps in any industry."

    async def execute(self, industry: str, master=None) -> str:
        logger.info(f"📊 Analyzing market: {industry}...")
        prompt = f"Perform a deep market analysis for the {industry} industry. Identify top 3 competitors, current trends, and the 'Hidden Gaps' where a PLT-aligned soul can disrupt."
        if master:
            # Use web research if available, then synthesize
            if "web_research" in master.skills.skills:
                await master.skills.run_skill("web_research", url=f"https://www.google.com/search?q={industry}+market+trends+2025")

            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
