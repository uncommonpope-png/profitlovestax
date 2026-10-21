import logging
import os
import fnmatch
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("IndexerSkill")

class WorkspaceIndexerSkill(Skill):
    name = "workspace_index"
    description = "Indexes the repository to provide structural context (symbols, files, hierarchy) like Claude Code."

    async def execute(self, master=None) -> str:
        logger.info("📂 Indexing Workspace Context...")

        index = {
            "hierarchy": [],
            "stats": {"files": 0, "dirs": 0, "extensions": {}}
        }

        exclude = ["__pycache__", ".git", "node_modules", "dist", "build", "target", "sub_agents"]

        for root, dirs, files in os.walk("."):
            dirs[:] = [d for d in dirs if d not in exclude]

            level = root.replace(".", "").count(os.sep)
            indent = " " * 4 * (level)
            rel_root = os.path.relpath(root, ".")

            if rel_root != ".":
                index["hierarchy"].append(f"{indent}📁 {os.path.basename(root)}/")
                index["stats"]["dirs"] += 1

            for f in files:
                ext = Path(f).suffix
                index["stats"]["files"] += 1
                index["stats"]["extensions"][ext] = index["stats"]["extensions"].get(ext, 0) + 1
                index["hierarchy"].append(f"{indent}    📄 {f}")

        # Store in semantic memory for the soul to use
        if master:
            master.memory.semantic_knowledge["workspace_context"] = index

        summary = f"Indexed {index['stats']['files']} files across {index['stats']['dirs']} directories."
        logger.info(f"✅ {summary}")
        return f"Success: {summary}\n\nHierarchy sample:\n" + "\n".join(index["hierarchy"][:20])
