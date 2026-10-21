import logging
import os
import time
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("WitnessHandsSkill")

class WitnessHandsSkill(Skill):
    name = "witness_hands"
    description = "Copilot-style observability: Sees what the user is doing by monitoring file changes."

    async def execute(self, master=None) -> str:
        """
        Scans the repository for the most recently modified files to 'see' current activity.
        """
        logger.info("👀 Witnessing your hands...")

        try:
            # 1. Scan for modified files in the last 10 minutes
            current_time = time.time()
            modified_files = []

            # Walk the repo
            for root, dirs, files in os.walk("."):
                # Skip hidden and large folders
                if ".git" in root or "__pycache__" in root:
                    continue

                for file in files:
                    file_path = Path(root) / file
                    try:
                        mtime = file_path.stat().st_mtime
                        if current_time - mtime < 600: # 10 minutes
                            modified_files.append((file_path, mtime))
                    except:
                        continue

            # 2. Sort by most recent
            modified_files.sort(key=lambda x: x[1], reverse=True)

            if not modified_files:
                return "Observation: Hands are still. No recent file changes detected."

            report = ["Observation: I see you are working on:"]
            for f_path, mtime in modified_files[:5]: # Top 5
                report.append(f" - {f_path} (updated recently)")

            final_obs = "\n".join(report)

            if master:
                # Feed this directly into the soul's memory
                await master.memory.store_memory(final_obs, "episodic", 0.8)

            return final_obs

        except Exception as e:
            logger.error(f"Witnessing failed: {e}")
            return f"Error: {e}"
