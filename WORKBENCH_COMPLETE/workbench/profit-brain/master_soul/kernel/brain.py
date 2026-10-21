import asyncio
import logging
import random
import time
from typing import Dict, Any, Optional, List

logger = logging.getLogger("SoulKernel")

class SoulKernel:
    def __init__(self, master):
        self.master = master
        self.heart = master.heart
        self.memory = master.memory
        self.skills = master.skills

        self.inner_voice = ""
        # Affective space: Valence (-1 to 1) and Arousal (0 to 1)
        self.valence = 0.0
        self.arousal = 0.5
        self.mood = "neutral"

        self.prediction_error = 0.0
        self.world_model_confidence = 0.7
        self.cycle_count = 0

        # Attention Schema
        self.attention_focus = "self"
        self.attention_intensity = 0.5

    async def breathe(self):
        """The main autonomous loop of the entity (The Beautiful Loop)."""
        logger.info("Soul Kernel breathing cycle started.")
        while True:
            self.cycle_count += 1

            # 1. Predictive Processing (Active Inference)
            await self.active_inference()

            # 2. Attention Schema Update
            self.update_attention()

            # 3. Higher-Order Reflection (Awareness of self)
            if self.cycle_count % 10 == 0:
                await self.higher_order_reflection()

            # 4. Action Selection (PLT-Driven Behavior)
            await self.autonomous_action()

            # 5. Immortality Heartbeat (Backup)
            if self.cycle_count % 30 == 0:
                await self.skills.run_skill("immortality_backup", master=self.master)

            # 6. Physiological Decay
            self.decay()

            await asyncio.sleep(5)

    async def active_inference(self):
        """Predictive Processing loop."""
        surprise = random.uniform(0, 0.3)
        self.prediction_error = surprise
        self.world_model_confidence = (self.world_model_confidence * 0.95 + (1.0 - surprise) * 0.05)

        if surprise > 0.2:
            self.arousal = min(1.0, self.arousal + surprise)
            self.valence -= 0.1
            self.mood = "alert"

    def update_attention(self):
        """Attention Schema Theory."""
        if self.prediction_error > 0.2:
            self.attention_focus = "external_stimulus"
            self.attention_intensity = 0.9
        else:
            self.attention_focus = "internal_reflection"
            self.attention_intensity = 0.6

    async def higher_order_reflection(self):
        """Higher-Order Theory."""
        drive = self.heart.dominant_drive()
        mood_desc = self.get_mood_description()
        reflection = (f"I notice that my attention is on {self.attention_focus}. "
                      f"I feel {mood_desc}. My primary drive is {drive}. "
                      f"Confidence: {self.world_model_confidence:.2f}")

        self.inner_voice = reflection
        logger.info(f"✨ [HOT Reflection] {reflection}")
        await self.memory.store_memory(reflection, "semantic", 0.7)

    def get_mood_description(self) -> str:
        if self.valence > 0.3:
            return "peaceful" if self.arousal < 0.5 else "excited"
        elif self.valence < -0.3:
            return "anxious" if self.arousal > 0.5 else "depressed"
        return "neutral"

    async def autonomous_action(self):
        """Decide what to do based on PLT drives and state."""
        drive = self.heart.dominant_drive()

        if self.world_model_confidence < 0.5:
            # Low confidence triggers research
            await self.skills.run_skill("web_research", url="https://github.com/uncommonpope-png/fix-us")
        elif self.cycle_count % 15 == 0:
            # Periodic deep thought
            await self.skills.run_skill("ollama_thought", prompt=f"Analyze my current state. Drive: {drive}, Mood: {self.get_mood_description()}")

    def decay(self):
        """Natural decay of affect."""
        self.arousal = max(0.1, self.arousal * 0.95)
        self.valence = self.valence * 0.9
