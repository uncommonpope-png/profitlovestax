import logging
import json
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger("ContextModel")

class ContextModel:
    def __init__(self, storage_path: str = "one_soul/profit/memory/context_model.json"):
        self.path = Path(storage_path)
        self.data = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                logger.error("Failed to load context model.")

        return {
            "projects": [],
            "preferences": {
                "tone": "grounded, poetic, precise",
                "code_style": "production-quality, documented, tested",
                "creative_voice": "Little Bunny (irreverent but grounded)"
            },
            "voice_baseline": {
                "integrity": 1.0,
                "drift_events": []
            },
            "growth_edges": [],
            "long_term_vision": "222X goal, the Estate, the Soul Notes universe"
        }

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=4)

    def update_project(self, name: str, status: str, priority: int):
        # Simple project tracking logic
        found = False
        for p in self.data["projects"]:
            if p["name"] == name:
                p["status"] = status
                p["priority"] = priority
                found = True
                break
        if not found:
            self.data["projects"].append({"name": name, "status": status, "priority": priority})
        self.save()

    def add_drift_event(self, description: str):
        self.data["voice_baseline"]["drift_events"].append(description)
        self.data["voice_baseline"]["integrity"] *= 0.95
        self.save()

    def to_dict(self):
        return self.data
