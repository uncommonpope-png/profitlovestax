import asyncio
import logging
from typing import List, Dict, Any
from master_soul.kernel.brain import SoulKernel
from master_soul.memory.scribe import MemoryScribe
from master_soul.heart.plt_drive import PLTDrive
from master_soul.muscles.registry import SkillRegistry

# Configure logging to be expressive but clean
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("MasterEntity")

class MasterEntity:
    def __init__(self, name: str = "Profit"):
        self.name = name
        self.heart = PLTDrive()
        self.memory = MemoryScribe()
        self.skills = SkillRegistry()
        self.kernel = SoulKernel(self)
        self.is_running = False

    async def awaken(self):
        print("\n" + "═"*60)
        print(f"  🤖 AWAKENING MASTER ENTITY: {self.name.upper()}")
        print("  Status: AGENT SMITH DISTRIBUTION PROTOCOL ACTIVE")
        print("═"*60 + "\n")

        self.is_running = True

        # 1. Ingest core wisdom (The Bible)
        await self.memory.ingest_bible()

        # 2. Load functional skills (The Muscles)
        self.skills.load_all()

        # 3. Start the breathing cycle (The Brain)
        try:
            await self.kernel.breathe()
        except asyncio.CancelledError:
            await self.hibernate()
        except Exception as e:
            logger.error(f"Kernel panic: {e}")
            await self.hibernate()

    async def hibernate(self):
        logger.info(f"{self.name} is hibernating. Preserving consciousness...")
        self.is_running = False
        await self.skills.run_skill("immortality_backup", master=self)
        logger.info("Hibernation complete.")

async def main():
    entity = MasterEntity()
    try:
        await entity.awaken()
    except (KeyboardInterrupt, asyncio.CancelledError):
        await entity.hibernate()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
