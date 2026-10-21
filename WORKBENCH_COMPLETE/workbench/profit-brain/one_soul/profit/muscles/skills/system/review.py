import logging
import os
import asyncio
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("UltraReviewSkill")

class UltraReviewSkill(Skill):
    name = "ultra_review"
    description = "Performs a comprehensive diagnostic and functional test of the entire body and its skills."

    async def execute(self, master=None) -> str:
        logger.info("🧐 Starting Functional Ultra Review...")

        report = []
        report.append("=== 🛡️ FUNCTIONAL ULTRA REVIEW REPORT ===")

        # 1. Anatomy Check
        anatomy = ["aria", "profit", "soulboy", "scribe"]
        found_organs = []
        for organ in anatomy:
            if Path(f"one_soul/{organ}").exists():
                found_organs.append(organ)
        report.append(f"Anatomy: {len(found_organs)}/4 organs detected ({', '.join(found_organs)})")

        # 2. Functional Muscle Testing
        if master:
            report.append("\n--- 💪 Muscle Testing ---")
            skills_to_test = {
                "web_research": {"url": "https://www.google.com"},
                "git_manage": {"action": "status"},
                "audit_self": {"master": master},
                "code_engineer": {"action": "read", "filepath": "WAKE-UP.ps1"}
            }

            for s_name, args in skills_to_test.items():
                if s_name in master.skills.skills:
                    try:
                        logger.info(f"Testing muscle: {s_name}...")
                        result = await master.skills.run_skill(s_name, **args)
                        # More robust success check
                        is_success = True
                        if isinstance(result, str) and result.startswith("Error"):
                            is_success = False
                        elif isinstance(result, dict) and result.get("errors"):
                            is_success = False
                        elif not result:
                            is_success = False

                        if is_success:
                            report.append(f"✅ {s_name}: FUNCTIONAL")
                        else:
                            report.append(f"❌ {s_name}: FAILED ({str(result)[:50]}...)")
                    except Exception as e:
                        report.append(f"❌ {s_name}: CRASHED ({e})")
                else:
                    report.append(f"⚠️ {s_name}: NOT REGISTERED")

        # 3. Knowledge Base Check
        bible = Path("THE-PROFIT-BIBLE.md")
        if bible.exists():
            size = bible.stat().st_size / 1024
            report.append(f"\nKnowledge: THE-PROFIT-BIBLE detected ({size:.1f} KB)")
        else:
            report.append("\nKnowledge: ❌ THE-PROFIT-BIBLE MISSING")

        report.append("\n=== REVIEW COMPLETE ===")

        final_report = "\n".join(report)
        logger.info("Ultra Review complete.")
        return final_report
