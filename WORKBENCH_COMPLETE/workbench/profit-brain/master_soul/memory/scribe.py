import logging
import json
import os
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger("MemoryScribe")

class MemoryScribe:
    def __init__(self, storage_dir: str = "master_soul/memory/"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = self.storage_dir / "state.json"
        self.bible_path = Path("THE-PROFIT-BIBLE.md")
        self.agent_memories_path = Path("memory-backup/AGENT-MEMORIES.md")

        self.episodic_memory: List[Dict[str, Any]] = []
        self.semantic_knowledge: Dict[str, Any] = {}
        self.plt_history: List[Dict[str, Any]] = []

        self.long_term_knowledge = ""

    async def ingest_bible(self):
        """Consume the core wisdom of the Profit system."""
        try:
            if self.bible_path.exists():
                logger.info(f"Ingesting THE-PROFIT-BIBLE from {self.bible_path}...")
                with open(self.bible_path, "r", encoding='utf-8') as f:
                    self.long_term_knowledge = f.read()
                logger.info(f"Ingested {len(self.long_term_knowledge)} chars of wisdom.")

            if self.agent_memories_path.exists():
                logger.info("Ingesting AGENT-MEMORIES...")
                with open(self.agent_memories_path, "r", encoding='utf-8') as f:
                    content = f.read()
                    self.semantic_knowledge["agent_capabilities"] = content
        except Exception as e:
            logger.error(f"Error during ingestion: {e}")

    async def store_memory(self, content: str, memory_type: str, importance: float):
        """Typed memory storage with importance-based persistence."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "content": content,
            "importance": importance
        }

        if memory_type == "episodic":
            self.episodic_memory.append(entry)
        elif memory_type == "semantic":
            # Simple keyword-based semantic storage for now
            self.semantic_knowledge[f"fact_{len(self.semantic_knowledge)}"] = entry
        elif memory_type == "plt":
            self.plt_history.append(entry)

        # Autonomous consolidation: if episodic memory grows too large, prune low importance
        if len(self.episodic_memory) > 500:
            await self.consolidate_memories()

    async def consolidate_memories(self):
        """Keep only the most important experiences."""
        logger.info("Consolidating memories...")
        self.episodic_memory.sort(key=lambda x: x["importance"], reverse=True)
        self.episodic_memory = self.episodic_memory[:200]

    async def persist_state(self):
        """Save the soul's current state to disk for immortality."""
        logger.info(f"Persisting state to {self.state_file}")
        state = {
            "episodic": self.episodic_memory,
            "semantic": self.semantic_knowledge,
            "plt_history": self.plt_history,
            "last_active": datetime.now().isoformat()
        }
        try:
            with open(self.state_file, "w", encoding='utf-8') as f:
                json.dump(state, f, indent=2)
            logger.info("State persisted successfully.")
        except Exception as e:
            logger.error(f"Failed to persist state: {e}")

    def query_knowledge(self, query: str) -> str:
        """Search through ingested knowledge and semantic memory."""
        # Simple search for now; could be upgraded to vector search later
        if query.lower() in self.long_term_knowledge.lower():
            # Return a relevant snippet (placeholder logic)
            return "Knowledge found in Profit Bible."
        return "No direct knowledge found."
