import asyncio
import logging
from typing import List, Dict, Any
from one_soul.profit.kernel.brain import SoulKernel
from one_soul.profit.memory.context_model import ContextModel
from one_soul.profit.memory.scribe import MemoryScribe
from one_soul.profit.memory.witness import ScribeWitness
from one_soul.profit.nervous_system.observatory import AriaObservatory
from one_soul.world_engine.soulbox import SoulboxEngine
from one_soul.profit.heart.plt_drive import PLTDrive
from one_soul.profit.muscles.registry import SkillRegistry

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
        self.context = ContextModel()
        self.witness = ScribeWitness()
        self.world = SoulboxEngine()
        self.observatory = AriaObservatory(self)
        self.skills = SkillRegistry()
        self.kernel = SoulKernel(self)
        self.is_running = False

    async def prepare(self):
        """Prepare the soul's anatomy for awakening."""
        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)

        # Start the Observatory dashboard
        self.observatory.start()

        # Initialize the world
        self.world.initialize_world()

        print("\n" + "═"*60)
        print(f"  🤖 PREPARING MASTER ENTITY: {self.name.upper()}")
        print("  Status: AGENT SMITH DISTRIBUTION PROTOCOL ACTIVE")
        print("═"*60 + "\n")

        self.is_running = True

        # 1. Ingest core wisdom (The Bible)
        await self.memory.ingest_bible()

        # 2. Load functional skills (The Muscles)
        self.skills.load_all()

        # 3. Soul Boot Camp (Autonomous Initialization)
        if "soul_bootcamp" in self.skills.skills:
            try:
                # Use a smaller timeout or ensure it doesn't block forever
                await self.skills.run_skill("soul_bootcamp", master=self)
            except Exception as e:
                logger.error(f"Boot camp failed, proceeding with caution: {e}")

    async def awaken(self):
        """Full awakening with preparations and infinite breathing loop."""
        await self.prepare()

        # 3. Start the breathing cycle (The Brain)
        try:
            await self.kernel.breathe()
        except asyncio.CancelledError:
            await self.hibernate()
        except Exception as e:
            logger.error(f"Kernel panic: {e}")
            await self.hibernate()

    def to_dict(self):
        return {
            "name": self.name,
            "heart": self.heart.to_dict(),
            "world": self.world.to_dict(),
            "kernel": self.kernel.to_dict(),
            "is_running": self.is_running
        }

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
