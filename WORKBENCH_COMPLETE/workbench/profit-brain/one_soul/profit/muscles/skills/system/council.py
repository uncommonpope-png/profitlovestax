import logging
import asyncio
from typing import Dict, List
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("GrandCouncilSkill")

class GrandCouncilSkill(Skill):
    name = "grand_council_review"
    description = "Summons the Council of Six (Surgeon, Psychology, Metaphysics, Scout, Mining, Grafting) for an Ultra Review."

    async def execute(self, master=None) -> str:
        if not master: return "Error: Master missing."

        logger.info("🏛️ SUMMONING THE GRAND COUNCIL...")

        council_members = {
            "The Surgeon": "Structural integrity, code efficiency, and anatomical health.",
            "The Psychologist": "Affective state, shadow integration, and needs hierarchy.",
            "The Metaphysician": "Purpose alignment, mythos phase, and soul resonance.",
            "The Scout": "Industry-gap identification and discovery of new territories.",
            "The Miner": "Resource extraction, PLT optimization, and efficiency gains.",
            "The Grafter": "Evolutionary potential, skill integration, and recursive growth."
        }

        reports = []
        reports.append("=== 🏛️ GRAND COUNCIL ULTRA REVIEW REPORT ===")
        reports.append(f"Subject: {master.name}")
        reports.append(f"Cycle: {master.kernel.cycle_count}")
        reports.append("-" * 40)

        tasks = []
        for member, focus in council_members.items():
            tasks.append(self._summon_member(member, focus, master))

        results = await asyncio.gather(*tasks)

        for res in results:
            reports.append(res)
            reports.append("-" * 40)

        reports.append("=== COUNCIL VERDICT: SYSTEM OPERATIONAL ===")

        final_report = "\n".join(reports)

        # Save to the Laboratory
        if "lab_build" in master.skills.skills:
            await master.skills.run_skill("lab_build",
                project_name="GRAND_COUNCIL_ULTRA_REVIEW.md",
                build_type="research",
                content=final_report,
                master=master
            )

        return final_report

    async def _summon_member(self, name: str, focus: str, master) -> str:
        logger.info(f"✨ {name} is analyzing...")

        # Build a context-rich prompt for each member
        prompt = f"""
        You are {name}. Your focus is: {focus}.
        Analyze the current state of the One Soul Master Entity:
        - Name: {master.name}
        - Cycle: {master.kernel.cycle_count}
        - Mythos Phase: {master.kernel.phase}
        - Affect: {master.kernel.mood} (Valence: {master.kernel.valence})
        - Resonance: {master.kernel.resonance}
        - Skills: {len(master.skills.skills)} muscles registered.

        Provide a 2-paragraph surgical, psychological, or metaphysical analysis based on your persona.
        Be honest, methodology-driven, and aligned with PLT principles.
        """

        report = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
        return f"🎙️ REPORT FROM {name.upper()}\nFocus: {focus}\n\n{report}"
