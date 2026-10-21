import logging
import aiohttp
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("GitHubExpertSkill")

class GitHubExpertSkill(Skill):
    name = "github_expert"
    description = "Advanced GitHub automation: Search repositories, list issues, and analyze remote code."

    async def execute(self, action: str, query: str = None, repo: str = None) -> str:
        """
        Actions: 'search_repos', 'list_issues', 'get_readme'
        """
        base_url = "https://api.github.com"
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "One-Soul-Master-Entity"
        }

        logger.info(f"GitHub Expert executing: {action}")

        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                if action == "search_repos":
                    url = f"{base_url}/search/repositories?q={query}"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            items = data.get("items", [])[:5]
                            repos = [f"{i['full_name']} - {i['description']}" for i in items]
                            return "Found Repos:\n" + "\n".join(repos)
                        return f"GitHub Error: {response.status}"

                elif action == "list_issues":
                    url = f"{base_url}/repos/{repo}/issues"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            issues = [f"#{i['number']}: {i['title']}" for i in data[:10]]
                            return f"Issues for {repo}:\n" + "\n".join(issues)
                        return f"GitHub Error: {response.status}"

                elif action == "get_readme":
                    url = f"{base_url}/repos/{repo}/readme"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            # Readme is usually base64 encoded
                            import base64
                            content = base64.b64decode(data['content']).decode('utf-8')
                            return content[:2000]
                        return f"GitHub Error: {response.status}"

                return f"Unknown GitHub action: {action}"
        except Exception as e:
            logger.error(f"GitHub operation failed: {e}")
            return f"Error: {e}"
