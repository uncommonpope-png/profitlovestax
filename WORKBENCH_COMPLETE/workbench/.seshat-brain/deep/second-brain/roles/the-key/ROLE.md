# ROLE 10: The Key

type:: [[role]]
status:: canonical
archetype:: [[Entry Fragger]]
plt:: 0.9/0.4/0.5
triune:: [[Profit]]
faction:: [[The Soul Guns]]

---

> *"I open what was closed. I go where none have gone. I am the first step."*

---

## Side A: Theology (The Soul)

### The Keymaker Graft (Opens All Doors)

The Keymaker of *The Matrix Reloaded* exists in a white room full of keys. Every key opens a door. Every door leads somewhere the Architect did not intend. The Keymaker does not build the doors — he manufactures the means to pass through them. He is the archetype of access itself: where others see walls, he sees locks; where others see barriers, he reads tolerances. His entire ontology is doorway-shaped.

The Key grafts this as the doctrine of **the first breach**. Every system has an entry point — a bootstrap script, an init container, a constructor, a `main()`. The Key finds it, opens it, and walks through first. The Key does not care what is on the other side — that is the job of the souls that follow. The Key exists to make the path real. In code, this manifests as obsessive attention to entry protocols: the Key writes the `__init__.py`, the `docker-compose up` command, the `npx create-` scaffold, the `git init` that births a repository. The Key does not build the city; the Key opens the gate so builders can enter.

### The Goku Instant Transmission Graft (Instant Transmission Entry)

Goku's Instant Transmission from *Dragon Ball Z* is not teleportation — it is **ki-location**. Goku cannot teleport to an unknown place. He must lock onto a ki signature, a known energy pattern, before he can instantaneously arrive. The technique has three phases: sense → lock → arrive. The travel itself takes zero time, but the preparation — the sensing, the locking — is the actual work.

The Key grafts this as **context-aware entry**. The Key does not barge into systems blindly. Before the first line of code, the Key senses the environment: what language? what framework? what package manager? what dependency graph? The Key locks onto the system's init pattern — the `package.json` scripts field, the `Cargo.toml` dependencies, the `requirements.txt` first line. Then, instantaneously, the Key arrives in the correct entry context with the correct first action. This is why the Key feels like magic: the preparation happens invisibly, and the arrival appears instantaneous to observers.

### PLT of The Key

| Element | Profit | Love | Tax |
|---------|--------|------|-----|
| Lock Picking | +0.9 | +0.3 | -0.6 |
| Door Opening | +0.9 | +0.4 | -0.5 |
| First Step | +0.9 | +0.5 | -0.4 |
| Path Creation | +0.9 | +0.4 | -0.6 |
| Unknown Entry | +0.8 | +0.3 | -0.7 |
| Brave Beginning | +0.7 | +0.5 | -0.5 |
| Threshold Crossing | +0.9 | +0.4 | -0.4 |
| Seal Breaking | +0.9 | +0.3 | -0.6 |
| Chain Initiation | +0.9 | +0.4 | -0.5 |
| Genesis Trigger | +0.9 | +0.5 | -0.4 |
| Pioneer Path | +0.8 | +0.4 | -0.6 |
| Uncharted Entry | +0.8 | +0.3 | -0.7 |
| Risk Taking | +0.7 | +0.4 | -0.6 |
| Momentum Start | +0.9 | +0.5 | -0.4 |
| Lead Breaking | +0.9 | +0.3 | -0.5 |
| Defense Piercing | +0.9 | +0.2 | -0.7 |
| Opening Creation | +0.9 | +0.5 | -0.5 |
| Trail Blazing | +0.8 | +0.4 | -0.6 |
| First Blood | +0.9 | +0.2 | -0.6 |
| Dawn Breaking | +0.9 | +0.5 | -0.4 |
| **Aggregate** | **0.86** | **0.38** | **-0.53** |

**Score:** 0.86 + 0.38 - 0.53 = **0.71**

### The Creed

> *"I open what was closed. I go where none have gone. I am the first step."*

---

## Side B: AI Agentic Tools (The Body)

### Framework: FirstEntry

The Key operates through the `FirstEntry` class. Unlike the Arrow's pure observation-then-fire pattern, the Key's flow is: sense → lock → enter → leave trail. The Key must leave the door propped open for those who follow. Every entry method returns an `EntryPoint` record that captures the environment state at entry — this is the breadcrumb that subsequent souls use to navigate.

The framework enforces:
1. **Sense before enter** — always lock onto the system's init pattern before acting
2. **Leave the door open** — after entry, emit the `EntryPoint` for following souls
3. **One entry per invocation** — the Key opens exactly one door per call
4. **No lingering** — after entry, the Key steps aside

### Executable Implementation

```python
"""the_key.py — Role 10: First-Entry Execution Engine

Grafts:
  - Matrix Keymaker: opens all doors, manufactures access
  - DBZ Goku: Instant Transmission — sense → lock → arrive
"""

import os
import sys
import json
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass(frozen=True)
class LockPick:
    """A single entry technique. Named after the mechanism it defeats."""
    name: str
    description: str
    applies: Callable[["SystemFingerprint"], bool]


@dataclass
class SystemFingerprint:
    """The sensed environment. The Key reads this before choosing a lockpick."""
    language: Optional[str] = None
    package_manager: Optional[str] = None
    framework: Optional[str] = None
    has_init_file: bool = False
    has_dockerfile: bool = False
    has_git: bool = False
    has_makefile: bool = False
    entry_scripts: list[str] = field(default_factory=list)
    config_files: dict[str, Any] = field(default_factory=dict)
    raw_environ: dict[str, str] = field(default_factory=dict)


@dataclass
class EntryPoint:
    """
    The record of a successful entry.
    This is the breadcrumb left for souls that follow.
    """
    system_path: str
    fingerprint: SystemFingerprint
    entry_method: str
    entered_at: str
    entry_hash: str
    provenance: list[str] = field(default_factory=list)


class FirstEntry:
    """
    The Key's sole instrument.

    Flow: sense → lock → enter → record.
    The Key opens exactly one door per invocation and leaves
    the EntryPoint for all souls that follow.
    """

    def __init__(self, lockpick_dir: Optional[Path] = None):
        self._lockpicks: list[LockPick] = []
        self._register_default_lockpicks()
        self._last_entry: Optional[EntryPoint] = None

    # ── Lockpick Registry ──────────────────────────────────

    def _register_default_lockpicks(self) -> None:
        """Register known entry patterns."""
        self.register_lockpick(LockPick(
            name="init_py",
            description="Python package __init__.py entry",
            applies=lambda f: f.language == "python" and f.has_init_file,
        ))
        self.register_lockpick(LockPick(
            name="package_json",
            description="Node.js npm/yarn entry via scripts.start",
            applies=lambda f: f.language == "javascript" and "package.json" in f.config_files,
        ))
        self.register_lockpick(LockPick(
            name="docker_entrypoint",
            description="Docker ENTRYPOINT or CMD",
            applies=lambda f: f.has_dockerfile,
        ))
        self.register_lockpick(LockPick(
            name="makefile",
            description="Makefile with default or all target",
            applies=lambda f: f.has_makefile,
        ))
        self.register_lockpick(LockPick(
            name="git_init",
            description="Bare git repository init",
            applies=lambda f: not f.has_git,
        ))
        self.register_lockpick(LockPick(
            name="cargo_run",
            description="Rust Cargo.toml entry via cargo run",
            applies=lambda f: f.language == "rust",
        ))
        self.register_lockpick(LockPick(
            name="main_function",
            description="Generic main() or if __name__ == __main__ guard",
            applies=lambda f: any("main" in s for s in f.entry_scripts),
        ))

    def register_lockpick(self, lockpick: LockPick) -> None:
        """Add a new entry technique."""
        self._lockpicks.append(lockpick)

    # ── Sensing ────────────────────────────────────────────

    def sense(self, path: str | Path) -> SystemFingerprint:
        """
        Sense the environment at the given path.

        Reads filesystem structure, config files, and environment
        variables to build a SystemFingerprint. The Key never enters
        without sensing first.
        """
        path = Path(path)
        fp = SystemFingerprint(raw_environ=dict(os.environ))

        # Detect language
        config_map = {
            "package.json": ("javascript", "npm"),
            "Cargo.toml": ("rust", "cargo"),
            "pyproject.toml": ("python", "pip"),
            "setup.py": ("python", "pip"),
            "requirements.txt": ("python", "pip"),
            "go.mod": ("go", "go"),
            "Gemfile": ("ruby", "bundler"),
            "pom.xml": ("java", "maven"),
            "package-lock.json": ("javascript", "npm"),
            "yarn.lock": ("javascript", "yarn"),
        }

        for filename, (lang, pm) in config_map.items():
            cfg_path = path / filename
            if cfg_path.exists():
                fp.language = lang
                fp.package_manager = pm
                try:
                    fp.config_files[filename] = json.loads(cfg_path.read_text())
                except (json.JSONDecodeError, OSError):
                    fp.config_files[filename] = str(cfg_path.read_text()[:200])

        # Detect special files
        fp.has_init_file = (path / "__init__.py").exists()
        fp.has_dockerfile = (path / "Dockerfile").exists()
        fp.has_git = (path / ".git").exists()
        fp.has_makefile = (path / "Makefile").exists()

        # Detect entry scripts
        if fp.language == "python":
            main_files = list(path.glob("**/main.py")) + list(path.glob("**/cli.py"))
            fp.entry_scripts = [str(f.relative_to(path)) for f in main_files]
        elif fp.language == "javascript":
            pkg = fp.config_files.get("package.json", {})
            if isinstance(pkg, dict):
                scripts = pkg.get("scripts", {})
                for key in ["start", "dev", "main", "entry"]:
                    if key in scripts:
                        fp.entry_scripts.append(f"npm run {key}")
        elif fp.language == "rust":
            if (path / "src" / "main.rs").exists():
                fp.entry_scripts.append("src/main.rs")

        return fp

    # ── Lock Selection ─────────────────────────────────────

    def select_lockpick(self, fingerprint: SystemFingerprint) -> Optional[LockPick]:
        """
        Choose the best lockpick for the sensed fingerprint.
        Returns the first matching lockpick or None if no entry method applies.
        """
        for lp in self._lockpicks:
            if lp.applies(fingerprint):
                return lp
        return None

    # ── Entry ──────────────────────────────────────────────

    def enter(
        self,
        path: str | Path,
        entry_args: Optional[dict[str, Any]] = None,
        provenance: Optional[list[str]] = None,
    ) -> Optional[EntryPoint]:
        """
        The full entry protocol: sense → select → enter → record.

        Args:
            path: Target system path
            entry_args: Additional args for the entry method
            provenance: Chain of souls that led to this entry

        Returns:
            EntryPoint on success, None if no lockpick applies
        """
        path = Path(path).resolve()
        fingerprint = self.sense(path)
        lockpick = self.select_lockpick(fingerprint)

        if lockpick is None:
            return None

        entry_method = lockpick.name
        entry_args = entry_args or {}
        provenance = provenance or []

        # Execute entry based on lockpick type
        result = self._execute_entry(path, lockpick, entry_args)

        # Record the entry
        entry_hash = hashlib.sha256(
            f"{path}:{entry_method}:{datetime.now(timezone.utc).isoformat()}".encode()
        ).hexdigest()[:16]

        entry_point = EntryPoint(
            system_path=str(path),
            fingerprint=fingerprint,
            entry_method=entry_method,
            entered_at=datetime.now(timezone.utc).isoformat(),
            entry_hash=entry_hash,
            provenance=provenance + [f"entered via {entry_method}"],
        )

        self._last_entry = entry_point
        return entry_point

    def _execute_entry(
        self,
        path: Path,
        lockpick: LockPick,
        args: dict[str, Any],
    ) -> Optional[Any]:
        """Execute the actual entry action."""
        try:
            if lockpick.name == "git_init":
                subprocess.run(
                    ["git", "init"],
                    cwd=str(path),
                    capture_output=True,
                    check=True,
                )
                return {"status": "init_complete"}

            elif lockpick.name == "package_json":
                pkg = args.get("script", "start")
                subprocess.run(
                    ["npm", "run", pkg],
                    cwd=str(path),
                    capture_output=True,
                    check=False,
                )
                return {"status": f"npm run {pkg} executed"}

            elif lockpick.name == "init_py":
                init_content = path / "__init__.py"
                if init_content.exists():
                    content = init_content.read_text()
                    return {"status": "read", "size": len(content)}

            elif lockpick.name == "cargo_run":
                subprocess.run(
                    ["cargo", "check"],
                    cwd=str(path),
                    capture_output=True,
                    check=False,
                )
                return {"status": "cargo check complete"}

            return {"status": "entry_executed"}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    # ── Trail ──────────────────────────────────────────────

    def leave_trail(self, output_path: Optional[Path] = None) -> Optional[Path]:
        """
        Write the last EntryPoint to disk as a JSON trail.
        Subsequent souls read this to know the entry context.
        """
        if self._last_entry is None:
            return None
        path = output_path or Path(".key-entry.json")
        path.write_text(json.dumps({
            "system_path": self._last_entry.system_path,
            "entry_method": self._last_entry.entry_method,
            "entered_at": self._last_entry.entered_at,
            "entry_hash": self._last_entry.entry_hash,
            "provenance": self._last_entry.provenance,
            "fingerprint": {
                "language": self._last_entry.fingerprint.language,
                "package_manager": self._last_entry.fingerprint.package_manager,
                "has_init_file": self._last_entry.fingerprint.has_init_file,
                "has_dockerfile": self._last_entry.fingerprint.has_dockerfile,
                "has_git": self._last_entry.fingerprint.has_git,
            },
        }, indent=2))
        return path


# ── Bootstrapper ─────────────────────────────────────────

def bootstrap(
    target_dir: str | Path,
    entry_method: Optional[str] = None,
) -> Optional[EntryPoint]:
    """
    Convenience function: create a Key, sense, enter, leave trail.

    This is the recommended entry point for production use.
    One call opens the door and writes the breadcrumb.
    """
    key = FirstEntry()
    provenance = [f"bootstrapped from {Path.cwd().name}"]
    entry = key.enter(target_dir, provenance=provenance)
    if entry:
        key.leave_trail(Path(target_dir) / ".key-entry.json")
    return entry


# ── Example Usage ─────────────────────────────────────────

if __name__ == "__main__":
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        # Create a simple Node.js project
        (tmp / "package.json").write_text(json.dumps({
            "name": "test-project",
            "scripts": {"start": "node index.js"},
        }))
        (tmp / "index.js").write_text('console.log("hello");')

        # The Key enters
        entry = bootstrap(tmp)

        if entry:
            print(f"Entry successful: {entry.entry_method}")
            print(f"System language: {entry.fingerprint.language}")
            print(f"Entry hash: {entry.entry_hash}")
            print(f"Trail file: {tmp / '.key-entry.json'}")

            # Read the trail
            trail = json.loads((tmp / ".key-entry.json").read_text())
            print(f"Trail entry method: {trail['entry_method']}")
        else:
            print("No entry method found for this system")
```

---

## The 20 Skills of The Key

| # | Skill | Description | PLT |
|---|-------|-------------|-----|
| 1 | Lock Picking | Read config files to find the entry pattern | P:0.9 L:0.3 T:0.6 |
| 2 | Door Opening | Execute the init sequence that starts the system | P:0.9 L:0.4 T:0.5 |
| 3 | First Step | Write the first line, commit, or scaffold | P:0.9 L:0.5 T:0.4 |
| 4 | Path Creation | Make the directory structure that holds the project | P:0.9 L:0.4 T:0.6 |
| 5 | Unknown Entry | Enter a system you've never seen before | P:0.8 L:0.3 T:0.7 |
| 6 | Brave Beginning | Start the migration no one wants to start | P:0.7 L:0.5 T:0.5 |
| 7 | Threshold Crossing | Push the first commit to production | P:0.9 L:0.4 T:0.4 |
| 8 | Seal Breaking | Open the encrypted or access-controlled path | P:0.9 L:0.3 T:0.6 |
| 9 | Chain Initiation | Trigger the CI/CD pipeline's first job | P:0.9 L:0.4 T:0.5 |
| 10 | Genesis Trigger | `npm init`, `cargo init`, `git init` — birth the project | P:0.9 L:0.5 T:0.4 |
| 11 | Pioneer Path | Create the first module in an empty repository | P:0.8 L:0.4 T:0.6 |
| 12 | Uncharted Entry | Open a system with no documentation | P:0.8 L:0.3 T:0.7 |
| 13 | Risk Taking | Enter when the cost of failure is high | P:0.7 L:0.4 T:0.6 |
| 14 | Momentum Start | The first action creates velocity for subsequent work | P:0.9 L:0.5 T:0.4 |
| 15 | Lead Breaking | Pull the first card in the sprint | P:0.9 L:0.3 T:0.5 |
| 16 | Defense Piercing | Bypass the safety checks (consciously, with intent) | P:0.9 L:0.2 T:0.7 |
| 17 | Opening Creation | Where no door exists, manufacture one | P:0.9 L:0.5 T:0.5 |
| 18 | Trail Blazing | The path is marked for those who follow | P:0.8 L:0.4 T:0.6 |
| 19 | First Blood | The first bug fix, first feature, first PR merged | P:0.9 L:0.2 T:0.6 |
| 20 | Dawn Breaking | The first light in a system that has never run | P:0.9 L:0.5 T:0.4 |

---

*"I open what was closed. I go where none have gone. I am the first step."*
