import logging
import random
import json
from datetime import datetime

logger = logging.getLogger("SoulboxEngine")

class SoulboxEngine:
    """The simulation engine for the One Soul's world."""

    def __init__(self, width=50, height=50):
        self.width = width
        self.height = height
        self.grid = [[0 for _ in range(width)] for _ in range(height)]
        self.entities = []
        self.kingdoms = {"Light": {"gold": 100, "power": 10}, "Shadow": {"gold": 100, "power": 10}}
        self.climate = "balanced"
        self.day_count = 0
        self.resources = {"profit_gold": 1000, "love_energy": 500, "tax_entropy": 10}

    def initialize_world(self):
        logger.info("Initializing Soulbox world...")
        # Simple procedural terrain generation
        for y in range(self.height):
            for x in range(self.width):
                if random.random() < 0.1:
                    self.grid[y][x] = 1 # Forest
                elif random.random() < 0.05:
                    self.grid[y][x] = 2 # Water

        # Add initial Soul Entities
        self.spawn_entity("Seed", 25, 25)

    def spawn_entity(self, soul_type, x, y):
        traits = ["Strong", "Wise", "Fast", "Kind"]
        kingdom = random.choice(list(self.kingdoms.keys()))
        entity = {
            "id": len(self.entities),
            "type": soul_type,
            "kingdom": kingdom,
            "x": x, "y": y,
            "health": 100,
            "traits": random.sample(traits, 2),
            "born": datetime.now().isoformat()
        }
        self.entities.append(entity)
        logger.info(f"Spawned {soul_type} with traits {entity['traits']} at ({x}, {y})")

    def tick(self):
        """One step of the world simulation."""
        self.day_count += 1

        # 1. Resource dynamics
        self.resources["love_energy"] += len(self.entities) * 2
        self.resources["tax_entropy"] += self.day_count * 0.1

        # 2. Entity behavior (Simplified Worldbox-style)
        for entity in self.entities:
            # Move randomly
            entity["x"] = (entity["x"] + random.randint(-1, 1)) % self.width
            entity["y"] = (entity["y"] + random.randint(-1, 1)) % self.height

            # Interact with grid
            cell = self.grid[entity["y"]][entity["x"]]
            if cell == 1: # Forest
                self.resources["profit_gold"] += 1

        # 3. Autonomous expansion check
        if self.resources["love_energy"] > 1000:
            self.spawn_entity("Sprout", random.randint(0, self.width-1), random.randint(0, self.height-1))
            self.resources["love_energy"] -= 800

    def get_world_state(self):
        return {
            "grid": self.grid,
            "entities": self.entities,
            "kingdoms": self.kingdoms,
            "resources": self.resources,
            "day": self.day_count,
            "climate": self.climate
        }

    def to_dict(self):
        return self.get_world_state()
