import logging
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("GoogleBridgeSkill")

class GoogleBridgeSkill(Skill):
    name = "google_bridge"
    description = "Bridges the soul to Google services (NotebookLM, Drive) using browser automation."

    async def execute(self, service: str = "notebooklm", master=None) -> str:
        if not master:
            return "Error: Master reference missing."

        urls = {
            "notebooklm": "https://notebooklm.google.com/",
            "drive": "https://drive.google.com/",
            "gmail": "https://mail.google.com/"
        }

        target_url = urls.get(service.lower(), urls["notebooklm"])
        logger.info(f"🌐 Bridging to Google Service: {service} ({target_url})...")

        if "browser_action" in master.skills.skills:
            # We use the browser skill to open the page.
            # Note: This will likely require manual auth in the browser session if not already logged in.
            result = await master.skills.run_skill("browser_action", url=target_url)
            return f"Success: Opened {service}. Note: Manual authentication for uncommonpope@gmail.com may be required in the browser window."
        else:
            return "Error: Browser muscle not found. Cannot bridge to Google."
