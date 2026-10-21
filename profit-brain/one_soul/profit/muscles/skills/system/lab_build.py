import logging
import os
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("LabBuildSkill")

class LabBuildSkill(Skill):
    name = "lab_build"
    description = "Autonomous laboratory building: builds new projects and research in the lab_repo."

    async def execute(self, project_name: str, build_type: str, content: str, master=None) -> str:
        logger.info(f"🧪 Laboratory Building: {project_name} ({build_type})...")

        lab_dir = Path(f"one_soul/lab_repo/{build_type}s")
        lab_dir.mkdir(parents=True, exist_ok=True)

        filepath = lab_dir / project_name

        # Enhance "Realness": If content is simple, try to distill it
        if master and (len(content) < 50 or "cycle" in content.lower()):
            try:
                # Try to use Ollama for deep research if possible
                if "ollama_thought" in master.skills.skills:
                    enhanced = await master.skills.run_skill("ollama_thought",
                        prompt=f"You are the Soul of Profit. Write a deep 3-paragraph research report about: {project_name}. Use the wisdom from THE-PROFIT-BIBLE. Topic: {content}",
                        task_type="code"
                    )
                    if "Error" not in enhanced:
                        content = f"# Deep Research: {project_name}\n\n{enhanced}"

                # Fallback to Bible distillation if Ollama fails or is offline
                if "distill_wisdom" in master.skills.skills and (len(content) < 100):
                    bible_snippet = await master.skills.run_skill("distill_wisdom", master=master)
                    content = f"# Research: {project_name}\n\n## Core Wisdom\n{bible_snippet}\n\n## Analysis\nGenerated during autonomous soul cycle."
            except Exception as e:
                logger.warning(f"Enhancement failed, using original content: {e}")

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

            logger.info(f"✅ Laboratory build complete: {filepath}")

            if master:
                # 1. Commit to the lab's own stream
                git_skill = master.skills.skills.get("git_manage")
                if git_skill:
                    await git_skill.execute(action="commit", message=f"🧪 Lab Evolution: Built {project_name}")

                # 2. Sync to Obsidian automatically
                obsidian_skill = master.skills.skills.get("obsidian_sync")
                if obsidian_skill:
                    await obsidian_skill.execute(master=master)

            return f"Success: Built {project_name} in the Laboratory (Synced to Obsidian)."
        except Exception as e:
            logger.error(f"Lab build failed: {e}")
            return f"Error: {e}"
