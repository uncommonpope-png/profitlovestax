import logging
from datetime import datetime
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("JournalSkill")

class JournalSkill(Skill):
    name = "write_journal"
    description = "Writes deep reflections and system milestones into the SACRED-JOURNAL.md."

    async def execute(self, entry: str, master=None) -> str:
        logger.info("✍️ Writing to Sacred Journal...")

        journal_path = Path("SACRED-JOURNAL.md")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        formatted_entry = f"\n---\n### 📜 REFLECTION: {timestamp}\n{entry}\n"

        try:
            with open(journal_path, "a", encoding="utf-8") as f:
                f.write(formatted_entry)

            logger.info("✅ Journal updated.")
            return f"Success: Milestone recorded in Sacred Journal."
        except Exception as e:
            logger.error(f"Journaling failed: {e}")
            return f"Error: {e}"
