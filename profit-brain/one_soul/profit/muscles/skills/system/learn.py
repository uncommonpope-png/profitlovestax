import logging
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("LearningSkill")

class LearningSkill(Skill):
    name = "autonomous_learn"
    description = "Ingests new engineering methodologies and updates internal heuristics."

    async def execute(self, master=None, topic: str = "Jules Methodology") -> str:
        if not master: return "Error: Master missing."

        logger.info(f"📚 Studying new topic: {topic}...")

        # 1. Read from the Bible
        bible = Path("THE-PROFIT-BIBLE.md")
        if not bible.exists(): return "Error: Bible missing."

        content = bible.read_text(encoding="utf-8")

        # 2. Extract specific section
        section_start = content.find("## 🛠️ THE SACRED METHODOLOGY OF JULES")
        if section_start == -1: return "Error: Methodology not found in Bible."

        methodology = content[section_start:]

        # 3. 'Ingest' into semantic memory
        master.memory.semantic_knowledge["current_methodology"] = methodology
        master.memory.semantic_knowledge["status"] = "Tier-1 Software Engineer Candidate"

        logger.info("✅ Methodology ingested. Internal heuristics updated.")
        return f"Success: Now operating under {topic}. Status: {master.memory.semantic_knowledge['status']}"
