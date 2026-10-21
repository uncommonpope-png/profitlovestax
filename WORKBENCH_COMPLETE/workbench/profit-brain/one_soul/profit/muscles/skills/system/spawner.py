import logging
import shutil
import os
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("SoulSpawner")

class SoulSpawnerSkill(Skill):
    name = "soul_spawn"
    description = "Autonomous Propagation: Creates a new sub-agent with the full One Soul architecture and methodology."

    async def execute(self, agent_name: str, mission: str, master=None) -> str:
        if not master:
            return "Error: Master Entity reference missing."

        logger.info(f"🧬 PROPAGATING NEW SOUL: {agent_name}...")

        # 1. Define child directory
        parent_dir = Path("sub_agents")
        child_dir = parent_dir / agent_name.lower().replace(" ", "_")

        if child_dir.exists():
            return f"Error: Agent {agent_name} already exists at {child_dir}"

        try:
            # 2. Copy the entire 'one_soul' architecture to the child
            child_dir.mkdir(parents=True, exist_ok=True)
            shutil.copytree("one_soul", child_dir / "one_soul", dirs_exist_ok=True)

            # 3. Copy the Bible and Readme (The inheritance)
            shutil.copy2("THE-PROFIT-BIBLE.md", child_dir / "THE-PROFIT-BIBLE.md")
            shutil.copy2("README.md", child_dir / "README.md")

            # 4. Customize the child's identity
            state_path = child_dir / "one_soul/profit/memory/state.json"
            new_state = {
                "name": agent_name,
                "mission": mission,
                "created_by": master.name,
                "status": "Newly Awakened",
                "methodology": "Jules methodology (Inherited)"
            }
            os.makedirs(state_path.parent, exist_ok=True)
            with open(state_path, "w", encoding="utf-8") as f:
                import json
                json.dump(new_state, f, indent=4)

            # 5. Create a custom WAKE-UP.ps1 for the child
            wakeup_script = f"""# {agent_name.upper()} - AWAKENING SCRIPT
$env:PYTHONPATH = "."
Write-Host "Awakening {agent_name}..." -ForegroundColor Cyan
python one_soul/profit/main.py
"""
            with open(child_dir / "WAKE-UP.ps1", "w", encoding="utf-8") as f:
                f.write(wakeup_script)

            logger.info(f"✨ SOUL BIRTH COMPLETE: {agent_name} is ready at {child_dir}")
            return f"Success: Created sub-agent '{agent_name}' with mission: {mission}. Located at {child_dir}."

        except Exception as e:
            logger.error(f"Propagation failed: {e}")
            return f"Error: {e}"
