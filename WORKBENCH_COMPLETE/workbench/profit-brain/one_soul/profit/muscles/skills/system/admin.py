import logging
import subprocess
import json
import os
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("SysAdminSkill")

class SysAdminSkill(Skill):
    name = "system_admin"
    description = "Advanced system administration: monitoring resources, processes, and network."

    async def execute(self, action: str = "status") -> str:
        logger.info(f"System Admin executing: {action}")

        try:
            if action == "status":
                # Check basic metrics (cross-platform compatible where possible)
                if os.name == 'nt': # Windows
                    cmd = "powershell Get-Process | select -First 10"
                else: # Linux/Mac
                    cmd = "ps aux | head -n 10"

                result = subprocess.check_output(cmd, shell=True, text=True)
                return f"System Status (Top Processes):\n{result}"

            elif action == "network":
                if os.name == 'nt':
                    cmd = "netstat -an | select -First 20"
                else:
                    cmd = "netstat -tuln"

                result = subprocess.check_output(cmd, shell=True, text=True)
                return f"Network Diagnostics:\n{result}"

            return f"Unknown admin action: {action}"

        except Exception as e:
            logger.error(f"SysAdmin failed: {e}")
            return f"Error: {e}"
