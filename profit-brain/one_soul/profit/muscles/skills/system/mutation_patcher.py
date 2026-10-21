import logging
import os
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("MutationPatcherSkill")

class MutationPatcherSkill(Skill):
    name = "mutation_patcher"
    description = "Autonomous self-improvement: Patches existing code to evolve skills based on critique."

    async def execute(self, target_file: str, proposal: str, master=None) -> str:
        """
        Uses deep reasoning to generate a patch for a specific file, then applies it.
        """
        if not master:
            return "Error: Master reference missing."

        logger.info(f"🧬 Mutating {target_file} based on: {proposal}")

        # 1. Read existing code
        code_skill = master.skills.skills.get("code_engineer")
        if not code_skill:
            return "Error: Code Engineer muscle missing."

        current_code = await code_skill.execute(action="read", filepath=target_file)
        if "Error" in current_code:
            return f"Error: Could not read target file {target_file}"

        # 2. Request Optimized Patch from AI
        prompt = f"""
        You are a Master AI Surgeon. You need to mutate (patch) the following Python code to fix an issue.

        ISSUE: {proposal}

        CURRENT CODE:
        {current_code}

        Provide the ENTIRE updated Python code that fixes the issue while keeping the same class name and inheritance.
        Return ONLY the Python code.
        """

        mutated_code = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")

        if not mutated_code or "Error" in mutated_code:
            return "Error: Mutation code generation failed."

        # 3. Apply the Mutation (Write to file)
        write_result = await code_skill.execute(action="write", filepath=target_file, content=mutated_code)

        if "Successfully" in write_result:
            logger.info(f"✅ Mutation applied to {target_file}")
            return f"Success: Soul mutated. {target_file} has evolved."

        return f"Error: Mutation failed during writing. {write_result}"
