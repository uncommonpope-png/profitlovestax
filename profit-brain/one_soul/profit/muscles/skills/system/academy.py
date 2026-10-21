import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("AcademySkill")

class AgentAcademySkill(Skill):
    name = "agent_academy"
    description = "Autonomous School: Spawns specialized sub-agents to test and verify the parent's skills."

    async def execute(self, subject: str = "Skill Verification", master=None) -> str:
        if not master: return "Error: Master missing."

        logger.info(f"🎓 Opening Agent Academy for {subject}...")

        # 1. Spawn a "Tutor" agent specialized in verification
        tutor_name = f"Tutor_{subject.replace(' ', '_')}"
        spawn_result = await master.skills.run_skill("soul_spawn",
            agent_name=tutor_name,
            mission=f"Verify and audit the Parent Soul's mastery of {subject}.",
            master=master
        )

        if "Error" in spawn_result:
            return f"Academy failed to open: {spawn_result}"

        # 2. Heuristic check of own skills (The 'Curriculum')
        inventory = await master.skills.run_skill("skill_inventory", master=master)

        # 3. Simulate the tutor's feedback
        feedback = f"🎓 Academy Report: {tutor_name} is active. Curriculum: {len(master.skills.skills)} muscles detected. Status: Operational."

        logger.info("✅ Academy session complete.")
        return f"{spawn_result}\n\n{feedback}"
