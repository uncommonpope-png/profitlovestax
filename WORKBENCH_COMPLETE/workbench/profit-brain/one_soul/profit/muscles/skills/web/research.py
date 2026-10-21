import logging
import aiohttp
from bs4 import BeautifulSoup
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("WebResearchSkill")

class WebResearchSkill(Skill):
    name = "web_research"
    description = "Autonomous web scraping and information extraction."

    async def execute(self, query: str = "", url: str = None) -> str:
        if not url:
            # In a real scenario, this would first search Google/Bing
            logger.warning("No URL provided for web research.")
            return "No URL provided."

        logger.info(f"Researching: {url}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        # Remove script and style elements
                        for script in soup(["script", "style"]):
                            script.extract()

                        text = soup.get_text()
                        # Clean up text
                        lines = (line.strip() for line in text.splitlines())
                        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                        text = '\n'.join(chunk for chunk in chunks if chunk)

                        return text[:2000] # Return first 2000 chars
                    else:
                        return f"Error: Status {response.status}"
        except Exception as e:
            logger.error(f"Web research failed: {e}")
            return f"Error: {str(e)}"
