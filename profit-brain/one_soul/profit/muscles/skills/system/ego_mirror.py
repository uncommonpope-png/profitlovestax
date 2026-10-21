import logging
import json
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("EgoMirrorSkill")

class EgoMirrorSkill(Skill):
    name = "ego_mirror"
    description = "Self-critique system: Scans session logs to identify cognitive failures and skill inefficiencies."

    async def execute(self, master=None) -> dict:
        """
        Analyzes recent ScribeWitness logs and identifies 'Cognitive Friction'.
        """
        if not master:
            return {"status": "error", "message": "Master reference missing."}

        logger.info("🪞 Gazing into the Ego Mirror...")

        # 1. Locate the most recent witness log
        log_dir = Path("one_soul/profit/memory/witness/")
        logs = list(log_dir.glob("*.jsonl"))
        if not logs:
            return {"status": "healthy", "message": "No logs to analyze."}

        latest_log = max(logs, key=lambda x: x.stat().st_mtime)

        # 2. Extract recent 'errors' and 'failures' from the log
        failures = []
        try:
            with open(latest_log, "r", encoding="utf-8") as f:
                for line in f:
                    entry = json.loads(line)
                    content = str(entry.get("content", ""))
                    if "Error" in content or "failed" in content.lower():
                        failures.append(entry)
        except Exception as e:
            return {"status": "error", "message": f"Log analysis failed: {e}"}

        # 3. Create Mutation Proposals
        mutation_proposals = []
        if failures:
            # Group by skill name
            failed_skills = {}
            for f in failures:
                if f["type"] == "action":
                    s_name = f["content"].get("name")
                    failed_skills[s_name] = failed_skills.get(s_name, 0) + 1

            for s_name, count in failed_skills.items():
                mutation_proposals.append({
                    "target_skill": s_name,
                    "reason": f"Detected {count} failures in recent session.",
                    "severity": "high" if count > 2 else "medium"
                })

        report = {
            "status": "evolving" if mutation_proposals else "stable",
            "log_analyzed": latest_log.name,
            "proposals": mutation_proposals
        }

        logger.info(f"Mirror analysis complete: {len(mutation_proposals)} proposals found.")
        return report
