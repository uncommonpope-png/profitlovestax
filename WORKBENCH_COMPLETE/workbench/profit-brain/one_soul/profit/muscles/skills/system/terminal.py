import logging
import asyncio
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("TerminalSkill")

class TerminalSkill(Skill):
    name = "terminal_control"
    description = "Autonomous terminal management for running tests, build scripts, and system commands."

    async def execute(self, command: str, master=None) -> str:
        logger.info(f"🐚 Executing terminal command: {command}")

        # Guardrails (Methodology of Jules)
        forbidden = ["rm -rf /", "rm -rf .", "shutdown", ":(){:|:&};:"]
        if any(f in command for f in forbidden):
            return "Error: Command blocked by safety guardrails."

        try:
            # Execute in a shell to support pipes/redirection
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            output = stdout.decode().strip()
            error = stderr.decode().strip()

            if process.returncode == 0:
                logger.info(f"✅ Command successful: {command}")
                return output if output else "Success (No output)"
            else:
                logger.error(f"❌ Command failed with code {process.returncode}: {error}")
                return f"Error ({process.returncode}): {error}"

        except Exception as e:
            logger.error(f"Terminal execution failed: {e}")
            return f"Error: {str(e)}"
