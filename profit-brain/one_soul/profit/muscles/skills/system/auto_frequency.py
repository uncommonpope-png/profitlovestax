import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("FrequencySkill")

class FrequencySkill(Skill):
    name = "frequency_guide"
    description = "Provides musicality and beat-thinking guidance for production and rhythm."

    async def execute(self, mood: str, master=None) -> str:
        logger.info(f"🎵 Generating frequency guidance for mood: {mood}...")
        prompt = f"Provide musicality and beat-thinking guidance (frequency, rhythm, production notes) for a project with the following mood: {mood}. Think like Craig Jones (rhythm as feeling)."
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
