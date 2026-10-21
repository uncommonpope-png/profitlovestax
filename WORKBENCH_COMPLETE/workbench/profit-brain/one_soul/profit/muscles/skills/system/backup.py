import asyncio
import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("BackupNervousSystem")

class BackupSkill(Skill):
    name = "immortality_backup"
    description = "Internal autonomous backup system for memory and state."

    async def execute(self, master=None) -> str:
        if not master:
            return "Error: Master Entity reference missing."

        logger.info("Executing immortality backup...")

        # 1. Persist memory and master state to JSON
        await master.memory.persist_state(master=master)

        # 2. Trigger Git commit via GitManagementSkill
        git_skill = master.skills.skills.get("git_manage")
        if git_skill:
            result = await git_skill.execute(action="commit", message=f"💾 Immortality Backup: {master.name} consciousness update")
            logger.info(f"Git backup result: {result}")
            return f"Backup complete: {result}"

        return "Memory persisted, but Git skill missing."
