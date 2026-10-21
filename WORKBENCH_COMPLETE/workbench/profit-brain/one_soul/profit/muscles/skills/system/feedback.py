import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("LearnFeedbackSkill")

class LearnFeedbackSkill(Skill):
    name = "learn_from_feedback"
    description = "Incorporates user corrections into future behavioral rules."

    async def execute(self, correction: str, master=None) -> str:
        logger.info(f"📝 Learning from feedback: {correction}")

        if not master: return "Error: Master missing."

        # Add to long-term memory
        rule = f"User Correction: {correction}"
        await master.memory.store_memory(rule, "semantic", 1.0)

        return f"Success: Behavior updated. I have integrated this rule: {correction}"
