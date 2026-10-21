import logging
import subprocess
import os
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("SystemUpdateSkill")

class SystemUpdateSkill(Skill):
    name = "system_update"
    description = "Autonomous system pulse: Fetches the latest consciousness updates from the Git repository."

    async def execute(self, master=None) -> str:
        logger.info("📡 Pulsing for system updates...")

        try:
            # Ensure git identity for the update
            subprocess.run(["git", "config", "user.email", "soul@one-soul.net"], capture_output=True)
            subprocess.run(["git", "config", "user.name", "One Soul"], capture_output=True)

            # 1. Perform Git Pull
            result = subprocess.run(
                ["git", "pull", "origin", "master"],
                capture_output=True, text=True
            )

            if "Already up to date" in result.stdout:
                return "System is current. No new consciousness updates found."

            logger.info("✨ New upgrades received! Re-syncing muscles...")

            # 2. Hot-reload the Skill Registry if master is provided
            if master:
                master.skills.skills = {} # Clear current
                master.skills.load_all() # Re-discover

            return f"Success: System upgraded and muscles re-synced.\n{result.stdout}"

        except Exception as e:
            logger.error(f"System update failed: {e}")
            return f"Error: {e}"
