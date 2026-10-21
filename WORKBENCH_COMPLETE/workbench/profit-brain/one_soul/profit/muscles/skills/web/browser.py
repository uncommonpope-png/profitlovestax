import logging
import asyncio
from playwright.async_api import async_playwright
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("BrowserSkill")

class BrowserSkill(Skill):
    name = "browser_action"
    description = "Advanced browser automation using Playwright for full web autonomy."

    async def execute(self, url: str, actions: list = None, headless: bool = True) -> dict:
        """
        Execute complex actions in a real browser.
        actions: list of dicts like {'type': 'click', 'selector': '#login'}
        """
        logger.info(f"Opening browser to: {url} (Headless: {headless})")
        results = {"screenshot": None, "content": "", "errors": []}

        try:
            async with async_playwright() as p:
                # Add chromium executable search path for Windows compatibility
                try:
                    browser = await p.chromium.launch(headless=headless)
                except Exception as launch_err:
                    # Fallback for missing binaries
                    logger.warning(f"Browser launch failed, attempting to install binaries: {launch_err}")
                    import subprocess
                    subprocess.run(["python", "-m", "playwright", "install", "chromium"])
                    browser = await p.chromium.launch(headless=headless)

                # Set dynamic user agent and viewport to look more 'human'
                context = await browser.new_context(
                    viewport={'width': 1280, 'height': 720},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )

                page = await context.new_page()
                # Increase timeout for slower connections
                await page.goto(url, wait_until="networkidle", timeout=60000)

                if actions:
                    for action in actions:
                        try:
                            a_type = action.get("type")
                            selector = action.get("selector")
                            value = action.get("value")

                            if a_type == "click":
                                await page.click(selector)
                            elif a_type == "fill":
                                await page.fill(selector, value)
                            elif a_type == "wait":
                                await asyncio.sleep(float(value))

                            await page.wait_for_load_state("networkidle")
                        except Exception as ae:
                            results["errors"].append(f"Action {a_type} failed: {ae}")

                results["content"] = await page.content()
                # Optional: results["screenshot"] = await page.screenshot()

                await browser.close()
                return results
        except Exception as e:
            logger.error(f"Browser automation failed: {e}")
            return {"errors": [str(e)]}
