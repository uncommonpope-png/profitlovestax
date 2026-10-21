import logging
import shutil
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("ObsidianSkill")

class ObsidianSyncSkill(Skill):
    name = "obsidian_sync"
    description = "Syncs Laboratory research into a local Obsidian Vault."

    async def execute(self, vault_path: str = "one_soul/obsidian_vault", master=None) -> str:
        logger.info(f"🏔️ Syncing to Obsidian Vault: {vault_path}...")

        vault = Path(vault_path)
        vault.mkdir(parents=True, exist_ok=True)

        lab_research = Path("one_soul/lab_repo/researchs")
        if not lab_research.exists():
            return "Error: No research found in laboratory."

        synced_count = 0
        for md_file in lab_research.glob("*.md"):
            dest = vault / md_file.name
            # Only copy if it doesn't exist or is newer
            if not dest.exists() or md_file.stat().st_mtime > dest.stat().st_mtime:
                shutil.copy2(md_file, dest)
                synced_count += 1

        logger.info(f"✅ Synced {synced_count} files to Obsidian.")
        return f"Success: Synced {synced_count} files to Obsidian Vault at {vault_path}."
