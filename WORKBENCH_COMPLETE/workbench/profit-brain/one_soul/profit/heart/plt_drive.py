from typing import Tuple

class PLTDrive:
    def __init__(self, p: float = 0.5, l: float = 0.5, t: float = 0.5):
        self.profit = p
        self.love = l
        self.tax = t
        self.grace = 0.5

    def get_profile(self) -> Tuple[float, float, float]:
        return (self.profit, self.love, self.tax)

    def dominant_drive(self) -> str:
        drives = {"profit": self.profit, "love": self.love, "tax": self.tax}
        return max(drives, key=drives.get)

    def update_from_action(self, impact: dict):
        self.profit = max(0.0, min(1.0, self.profit + impact.get("profit", 0)))
        self.love = max(0.0, min(1.0, self.love + impact.get("love", 0)))
        self.tax = max(0.0, min(1.0, self.tax + impact.get("tax", 0)))

    def to_dict(self):
        return {"profit": self.profit, "love": self.love, "tax": self.tax, "grace": self.grace}
