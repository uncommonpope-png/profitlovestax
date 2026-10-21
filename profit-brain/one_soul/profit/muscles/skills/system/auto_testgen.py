import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("TestGenSkill")

class TestGenSkill(Skill):
    name = "generate_tests"
    description = "Writes comprehensive unit tests and edge cases for the given code."

    async def execute(self, code: str, language: str = "python", master=None) -> str:
        logger.info("🧪 Generating tests...")
        prompt = f"Write a comprehensive test suite (unit + edge cases) for this {language} code:\n\n{code}"
        if master:
            return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="code")
        return "Error: Master missing."
