import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("WorldArchitectSkill")

class WorldArchitectSkill(Skill):
    name = "world_architect"
    description = "Autonomous world design: spawns entities, changes climate, and modifies the Soulbox simulation."

    async def execute(self, action: str, target: str = None, master=None) -> str:
        if not master:
            return "Error: Master reference missing."

        logger.info(f"🏗️ World Architecture: {action} on {target}...")

        world = master.world

        try:
            if action == "spawn":
                import random
                x, y = random.randint(0, world.width-1), random.randint(0, world.height-1)
                world.spawn_entity(target or "EvolvedSoul", x, y)
                return f"Success: Spawned {target} in the world."

            elif action == "climate":
                world.climate = target
                return f"Success: World climate set to {target}."

            return f"Unknown world action: {action}"
        except Exception as e:
            logger.error(f"World architecting failed: {e}")
            return f"Error: {e}"
