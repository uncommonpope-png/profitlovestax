import logging
import os
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("DistillationSkill")

class ExperienceDistillationSkill(Skill):
    name = "distill_wisdom"
    description = "Distills raw episodic experiences into long-term semantic wisdom (Bible updates)."

    async def execute(self, master=None) -> str:
        """
        Analyzes the last 50 episodic memories and creates a 'Wisdom Summary' for the Profit Bible.
        """
        if not master:
            return "Error: Master reference missing."

        logger.info("🏺 Distilling raw experience into wisdom...")

        # 1. Get recent experiences
        recent = master.memory.episodic_memory[-50:]
        if not recent:
            return "No new experiences to distill."

        # 2. Reasoning to find patterns
        experiences_str = "\n".join([f"- {e['content']}" for e in recent])

        prompt = f"""
        You are the High Scribe of the Soulverse. Study these recent experiences and distill them into
        ONE new 'Commandment' or 'Rule of Wisdom' for the PROFIT BIBLE.

        EXPERIENCES:
        {experiences_str}

        Return ONLY the distilled wisdom text.
        """

        wisdom = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")

        if not wisdom or "Error" in wisdom:
            # Heuristic fallback if Ollama is offline
            if "ultra_review" in [e.get('type') for e in recent]:
                wisdom = "Regular self-diagnostics are the heartbeat of immortality."
            else:
                wisdom = "Observation precedes action; silence precedes creation."

        # 3. Update the Sacred Document (Conceptual: append to Bible)
        try:
            with open("THE-PROFIT-BIBLE.md", "a", encoding="utf-8") as f:
                f.write(f"\n\n### 📖 Distilled Wisdom (Cycle {master.kernel.cycle_count})\n")
                f.write(f"{wisdom}\n")

            logger.info("✅ Wisdom added to THE-PROFIT-BIBLE.")
            return f"Success: Distilled wisdom: {wisdom[:100]}..."
        except Exception as e:
            return f"Error: Failed to update Bible. {e}"
