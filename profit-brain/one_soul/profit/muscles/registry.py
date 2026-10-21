import logging
import importlib.util
import os
import inspect
from typing import Dict, Any, List
from pathlib import Path

logger = logging.getLogger("SkillRegistry")

class Skill:
    name: str
    description: str

    async def execute(self, **kwargs) -> Any:
        raise NotImplementedError

class SkillRegistry:
    def __init__(self):
        self.skills: Dict[str, Skill] = {}
        self.categories: Dict[str, List[str]] = {
            "ai": [],
            "web": [],
            "system": [],
            "git": [],
            "content": [],
            "automation": []
        }
        # Base path for skills
        self.skills_base_path = Path(__file__).parent / "skills"

    def load_all(self):
        """Autonomously discover and load all skills from the skills/ directory."""
        logger.info(f"🧠 [Discovery] Scanning for muscles in {self.skills_base_path}...")

        # 1. Walk through all skill categories
        for category_dir in self.skills_base_path.iterdir():
            if category_dir.is_dir():
                category = category_dir.name

                # 2. Find all .py files in category
                for skill_file in category_dir.glob("*.py"):
                    if skill_file.name == "__init__.py":
                        continue

                    self.load_skill_file(category, skill_file)

        logger.info(f"✅ [Discovery] Completed. {len(self.skills)} muscles online.")

    def load_skill_file(self, category: str, file_path: Path):
        """Dynamically imports and registers skills from a file."""
        try:
            module_name = f"one_soul.profit.muscles.skills.{category}.{file_path.stem}"
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                # Find classes that inherit from Skill
                for name, obj in inspect.getmembers(module):
                    if inspect.isclass(obj) and issubclass(obj, Skill) and obj is not Skill:
                        skill_instance = obj()
                        self.register_skill(category, skill_instance)
        except Exception as e:
            logger.error(f"❌ Failed to load skill from {file_path}: {e}")

    def register_skill(self, category: str, skill: Skill):
        self.skills[skill.name] = skill
        if category not in self.categories:
            self.categories[category] = []
        if skill.name not in self.categories[category]:
            self.categories[category].append(skill.name)
        logger.info(f"💪 Muscle active: {skill.name} ({category})")

    async def run_skill(self, name: str, **kwargs) -> Any:
        # Standardize search to lowercase
        name = name.lower()
        if name in self.skills:
            logger.info(f"🚀 Executing muscle: {name}")
            return await self.skills[name].execute(**kwargs)
        else:
            logger.error(f"❌ Muscle not found: {name}")
            return f"Error: Skill {name} not found."
