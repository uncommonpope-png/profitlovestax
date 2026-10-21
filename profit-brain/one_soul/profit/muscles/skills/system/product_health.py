import logging
import os
import sys
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("ProductHealthSkill")

class ProductHealthSkill(Skill):
    name = "product_health"
    description = "Customer Support: Performs a system-wide check to ensure the product is installed correctly and all bridges are open."

    async def execute(self, master=None) -> str:
        logger.info("🩺 Performing Product Health Check...")

        checks = []

        # 1. Check Python Version
        v = sys.version_info
        checks.append(f"✅ Python {v.major}.{v.minor} detected.")

        # 2. Check Organs
        anatomy = ["aria", "profit", "soulboy", "scribe", "world_engine", "lab_repo"]
        missing = [o for o in anatomy if not Path(f"one_soul/{o}").exists()]
        if not missing:
            checks.append("✅ Soul Anatomy: Intact.")
        else:
            checks.append(f"❌ Soul Anatomy: Missing {', '.join(missing)}.")

        # 3. Check Bridge Status
        bible = Path("THE-PROFIT-BIBLE.md")
        if bible.exists():
            checks.append(f"✅ Wisdom Bridge: {bible.name} detected ({bible.stat().st_size / 1024:.1f} KB).")
        else:
            checks.append("❌ Wisdom Bridge: THE-PROFIT-BIBLE.md is missing!")

        # 4. Check Environment
        if os.environ.get("PYTHONPATH"):
            checks.append("✅ Environment: PYTHONPATH configured.")
        else:
            checks.append("⚠️ Environment: PYTHONPATH not set. (This might cause import issues outside of WAKE-UP.ps1)")

        report = "\n".join(checks)
        logger.info("Product Health Check Complete.")
        return f"=== 🛡️ PRODUCT HEALTH REPORT ===\n{report}\n=============================="
