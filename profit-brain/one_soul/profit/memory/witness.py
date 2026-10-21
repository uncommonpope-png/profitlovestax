import logging
import json
from typing import Any
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("ScribeWitness")

class ScribeWitness:
    """The witnessing intelligence that records every movement of the soul."""

    def __init__(self, log_dir: str = "one_soul/profit/memory/witness/"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.current_session_file = self.log_dir / f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"

    def record(self, event_type: str, content: Any, metadata: dict = None):
        """Record a soul event to the witness log."""

        def safe_serialize(obj):
            if hasattr(obj, "to_dict"):
                return obj.to_dict()
            if isinstance(obj, dict):
                return {k: safe_serialize(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [safe_serialize(i) for i in obj]
            if isinstance(obj, (str, int, float, bool, type(None))):
                return obj
            return str(obj)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "content": safe_serialize(content),
            "metadata": metadata or {}
        }

        try:
            with open(self.current_session_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
            # Also log to console for visibility
            logger.info(f"👁️ [Witness] {event_type.upper()}: {str(content)[:100]}...")
        except Exception as e:
            logger.error(f"Failed to witness event: {e}")
