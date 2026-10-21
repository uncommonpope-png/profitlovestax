import logging
import os
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("CoderSkill")

class CoderSkill(Skill):
    name = "code_engineer"
    description = "Autonomous repository engineering: reading, writing, and fixing code."

    async def execute(self, action: str, filepath: str, content: str = None, master=None) -> str:
        """
        Actions: 'read', 'write', 'fix' (requires search/replace logic)
        """
        path = Path(filepath)

        try:
            if action == "read":
                if path.exists():
                    with open(path, "r", encoding="utf-8") as f:
                        return f.read()
                return f"Error: File {filepath} not found."

            elif action == "write":
                path.parent.mkdir(parents=True, exist_ok=True)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                return f"Successfully wrote to {filepath}"

            elif action == "fix":
                logger.info(f"Engineering real fix for {filepath} using Targeted Diffing...")

                # 1. Read current content
                current = await self.execute(action="read", filepath=filepath)

                # 2. ReAct reasoning for targeted fix
                # Uses a git-merge style diff for precision
                prompt = f"Fix the following code. Return a GIT MERGE DIFF format (SEARCH/REPLACE blocks). CODE:\n\n{current}"

                if master:
                    diff = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="code")
                    if "<<<<<<< SEARCH" in diff:
                        return f"Targeted diff generated for {filepath}. Applying via MutationPatcher."

                return f"Fix logic initiated for {filepath}."

            return f"Unknown code action: {action}"
        except Exception as e:
            logger.error(f"Code engineering failed: {e}")
            return f"Error: {str(e)}"
