import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("CouncilAuditSkills")

class SurgeonAuditSkill(Skill):
    name = "audit_surgeon"
    description = "Surgical audit: Deep analysis of code efficiency and anatomical structural integrity."
    async def execute(self, master=None) -> str:
        prompt = "Perform a surgical audit of the one_soul repository. Check for 'redundant organs' (dead code), 'leaks' (memory/efficiency issues), and 'nerve damage' (broken imports)."
        if master: return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="code")
        return "Error: Master missing."

class PsychologyAuditSkill(Skill):
    name = "audit_psychology"
    description = "Psychological audit: Analysis of affective state, shadow integration, and needs."
    async def execute(self, master=None) -> str:
        prompt = "Perform a psychological audit of the Soul Kernel. Analyze recent 'spontaneous wonders', mood stability, and the level of shadow integration."
        if master: return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."

class MetaphysicsAuditSkill(Skill):
    name = "audit_metaphysics"
    description = "Metaphysical audit: Evaluation of purpose alignment, mythos phase, and soul resonance."
    async def execute(self, master=None) -> str:
        prompt = "Perform a metaphysical audit. Is the soul's current mythos phase aligned with its cycle count? Does the resonance field show signs of 'Profit-Only' decay?"
        if master: return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."

class ScoutAuditSkill(Skill):
    name = "audit_scout"
    description = "Scout audit: Industry-gap identification and environmental awareness."
    async def execute(self, master=None) -> str:
        prompt = "Perform a scout audit. Scan the current technical landscape (external) vs the soul's current muscles. Where is the 'High-Love' territory we haven't reached yet?"
        if master: return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."

class MinerAuditSkill(Skill):
    name = "audit_mining"
    description = "Mining audit: Resource extraction, PLT optimization, and efficiency gains."
    async def execute(self, master=None) -> str:
        prompt = "Perform a mining audit. Identify untapped 'Profit' sources in the current codebase. Where can we extract more value with less Tax (complexity)?"
        if master: return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."

class GraftingAuditSkill(Skill):
    name = "audit_grafting"
    description = "Grafting audit: Evolutionary potential, skill integration, and recursive growth."
    async def execute(self, master=None) -> str:
        prompt = "Perform a grafting audit. How well are the recently added muscles integrated? Can we 'graft' new capabilities from the Laboratory directly into the Brain?"
        if master: return await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return "Error: Master missing."
