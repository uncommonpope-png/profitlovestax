import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("InventorySkill")

class SkillInventorySkill(Skill):
    name = "skill_inventory"
    description = "Lists all available muscles (skills), their descriptions, and health status."

    async def execute(self, master=None) -> str:
        if not master: return "Error: Master missing."

        logger.info("🎒 Inventorying available muscles...")

        report = ["=== 🎒 SOUL SKILL INVENTORY ==="]
        skills = master.skills.skills

        for name, s_obj in skills.items():
            status = "✅ ONLINE"
            # Simple health check
            if not s_obj.description:
                status = "⚠️ ANEMIC"

            report.append(f"{status} | {name}: {s_obj.description}")

        report.append(f"\nTotal Muscles: {len(skills)}")
        report.append("=== INVENTORY COMPLETE ===")

        return "\n".join(report)
