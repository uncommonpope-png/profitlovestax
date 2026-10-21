import logging
from typing import Dict, Any
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("PLTScorerSkill")

class PLTScorerSkill(Skill):
    name = "plt_scorer"
    description = "Evaluates any action, idea, or output against the Profit + Love - Tax framework."

    async def execute(self, action_description: str, context: str = None, master=None) -> Dict[str, Any]:
        logger.info(f"📊 Scoring action: {action_description[:50]}...")

        # 1. Heuristic dimension scoring
        profit = self._calculate_profit(action_description)
        love = self._calculate_love(action_description)
        tax = self._calculate_tax(action_description)

        # 2. Formula: True Value = (P + L - T) / 2 (Normalized 0-1)
        true_value = max(0, min(1, (profit + love - tax) / 1.5))

        verdict = self._get_verdict(true_value)

        report = {
            "profit": profit,
            "love": love,
            "tax": tax,
            "true_value": round(true_value, 3),
            "verdict": verdict,
            "reasoning": f"Action focuses on {self._identify_focus(action_description)}."
        }

        if master:
            # Sync to kernel resonance
            master.kernel.resonance = {
                "p": profit, "l": love, "t": tax, "true_value": true_value
            }
            master.observatory.broadcast_update("plt_sync", report)

        return report

    def _calculate_profit(self, text: str) -> float:
        """Economic leverage, output, momentum."""
        text = text.lower()
        if any(w in text for w in ["build", "code", "ship", "product", "sell", "scale"]):
            return 0.8
        if any(w in text for w in ["research", "plan", "optimize"]):
            return 0.6
        return 0.4

    def _calculate_love(self, text: str) -> float:
        """Relational value, care, truth, connection."""
        text = text.lower()
        if any(w in text for w in ["help", "teach", "connect", "soul", "bible", "journal"]):
            return 0.9
        if any(w in text for w in ["rest", "meditate", "review", "audit"]):
            return 0.7
        return 0.5

    def _calculate_tax(self, text: str) -> float:
        """Complexity, friction, entropy, cost."""
        text = text.lower()
        if any(w in text for w in ["grind", "force", "rewrite", "bug", "error"]):
            return 0.7
        if any(w in text for w in ["complexity", "dependency", "bloat"]):
            return 0.5
        return 0.2

    def _get_verdict(self, val: float) -> str:
        if val >= 0.75: return "HIGH VALUE — do this"
        if val >= 0.55: return "POSITIVE — worth it"
        if val >= 0.40: return "MARGINAL — weigh carefully"
        return "DRAINING — reconsider"

    def _identify_focus(self, text: str) -> str:
        text = text.lower()
        if "code" in text: return "Technical leverage"
        if "research" in text: return "Cognitive expansion"
        if "bible" in text: return "Wisdom persistence"
        return "General operations"
