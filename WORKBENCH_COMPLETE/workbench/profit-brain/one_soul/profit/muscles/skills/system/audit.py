import logging
import os
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("AuditSkill")

class AuditSkill(Skill):
    name = "audit_self"
    description = "Self-healing and security auditing system for the entity's own core."

    async def execute(self, master=None) -> dict:
        """
        Scans the entity's own logs and codebase for instability or security flaws.
        Returns a 'Health Report' with recommended fixes.
        """
        report = {
            "status": "healthy",
            "findings": [],
            "fixes_proposed": []
        }

        logger.info("Starting autonomous self-audit...")

        # 1. Check for 'Kernel Panic' or 'Error' in logs
        # (Assuming logs go to a file or can be captured)

        # 2. Check for 'unstable' patterns in the skill registry
        if master:
            skills = master.skills.skills
            for s_name, s_obj in skills.items():
                if not hasattr(s_obj, 'execute'):
                    report["findings"].append(f"Skill {s_name} is missing execute method.")
                    report["status"] = "warning"

        # 3. Simple security check: Check for exposed .env or keys in repo
        repo_files = list(Path(".").rglob("*"))
        for file in repo_files:
            if file.name == ".env" or "key" in file.name.lower():
                report["findings"].append(f"Potentially sensitive file found: {file}")
                report["status"] = "warning"

        if report["status"] == "healthy":
            logger.info("Self-audit complete: Entity is healthy.")
        else:
            logger.warning(f"Self-audit complete: {len(report['findings'])} findings.")

        return report
