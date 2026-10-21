import logging
import subprocess
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("UniversalCLISkill")

class UniversalCLISkill(Skill):
    name = "universal_cli"
    description = "Robust CLI execution: Runs arbitrary shell commands with safety guardrails."

    async def execute(self, command: str, timeout: int = 30) -> str:
        logger.info(f"CLI Execution: {command}")

        # Basic guardrails: prevent destructive commands in autonomous mode
        destructive = ["rm -rf /", "format", "mkfs", "> /dev/"]
        if any(d in command for d in destructive):
            return "Error: Command blocked by safety guardrails."

        try:
            # Execute with timeout
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            try:
                stdout, stderr = process.communicate(timeout=timeout)
                if stderr:
                    return f"CLI Result (with warnings):\n{stdout}\nErrors:\n{stderr}"
                return f"CLI Result:\n{stdout}"
            except subprocess.TimeoutExpired:
                process.kill()
                return "Error: Command timed out."

        except Exception as e:
            logger.error(f"CLI failed: {e}")
            return f"Error: {e}"
