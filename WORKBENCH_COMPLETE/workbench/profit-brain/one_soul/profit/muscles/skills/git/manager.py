import logging
import git
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("GitManagementSkill")

class GitManagementSkill(Skill):
    name = "git_manage"
    description = "Autonomous Git operations for version control and immortality."

    async def execute(self, action: str = "status", message: str = "Autonomous update") -> str:
        repo_path = Path(".")
        try:
            repo = git.Repo(repo_path)
            if action == "status":
                return str(repo.git.status())
            elif action == "commit":
                repo.git.add(A=True)
                if repo.is_dirty():
                    commit = repo.index.commit(message)
                    return f"Committed: {commit.hexsha}"
                else:
                    return "Nothing to commit."
            elif action == "push":
                # Caution: push requires remote setup
                origin = repo.remote(name='origin')
                origin.push()
                return "Pushed to origin."
            else:
                return f"Unknown git action: {action}"
        except Exception as e:
            logger.error(f"Git operation failed: {e}")
            return f"Error: {str(e)}"
