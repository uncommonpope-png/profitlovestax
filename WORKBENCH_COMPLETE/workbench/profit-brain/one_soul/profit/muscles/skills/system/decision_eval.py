import logging
from typing import Dict, Any
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("DecisionEvalSkill")

class DecisionEvalSkill(Skill):
    name = "evaluate_decision"
    description = "Multi-dimensional decision analysis from 5 angles."

    async def execute(self, decision: str, master=None) -> str:
        logger.info(f"⚖️ Evaluating decision: {decision[:50]}...")

        prompt = f"""
        Analyze this decision from these 5 angles:
        1. Strategic Impact (Does it move the needle?)
        2. Emotional Alignment (Does it feel right?)
        3. Hidden Tax (Maintenance, debt, entropy)
        4. Opportunity Cost (What are we NOT doing?)
        5. Time/Energy Drain

        DECISION: {decision}
        """

        if master:
            analysis = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
            # Also score it
            score = await master.skills.run_skill("plt_scorer", action_description=decision, master=master)
            return f"--- DECISION ANALYSIS ---\n{analysis}\n\nPLT VERDICT: {score['verdict']}"

        return "Error: Master missing for decision evaluation."
