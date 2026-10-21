# SKILL — City Terminal

slug:: city_terminal
phase:: build
status:: active
source:: Dark City Spatial OS — Phase 5
PLT:: Profit 0.7, Love 0.4, Tax 0.5

## Summary
WHEN TO USE: When a user needs to run shell commands, install packages, or manage GSK from inside the 3D world. Archetype affinity: COMMANDER (direct control), BUILDER (dev ops). Problem solved: the Portal district needs a real terminal — xterm.js in the browser, WebSocket to a shell on the PC — so the user can control the system without leaving the Dark City.

## Schema
- trigger: User opens Portal district terminal panel OR citizen PAL loop needs shell access
- inputs: {
    command: string,                   // shell command to execute
    cwd: string | null,                // working directory (default: GSK root)
    sandboxLevel: "restricted" | "full" | "readonly",
    tty: boolean                       // true = interactive, false = single command
  }
- outputs: {
    success: boolean,
    stdout: string,
    stderr: string,
    exitCode: number,
    durationMs: number
  }

## Consequence
- xterm.js terminal renders in the Portal district UI panel
- WebSocket connects to `ws://127.0.0.1:4490/terminal` for a real shell session
- Keystrokes go to shell, output streams back to terminal in real-time
- Commands are sandboxed via SecureShellSandbox risk classification — destructive commands require confirmation
- Command history is saved to IndexedDB and survives page refresh
- Citizens can request shell access through the bridge (with user approval)
- Terminal output can be piped to citizens as perception input

## Feedback
- User sees: xterm.js terminal with green-on-black theme, cursor blinks, text streams in real-time
- Console: `[TERMINAL] <exitCode> — "<command>" — <duration>ms`
- On restricted command: yellow warning overlay "This command is classified as <risk> — confirm?"
- Visual: Portal district antenna glows during active terminal sessions

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Terminal closed, no active session | Portal district terminal panel collapsed |
| ACTIVE | Terminal open, command running | Cursor blinks, text streams, antenna glows |
| COOLDOWN | Command completed, awaiting next input | Output displayed, cursor idle, antenna dims |
| ERROR | WebSocket disconnected, command failed, sandbox block | Red terminal border, error text in red, reconnect button |

## Composition
- **Spatial World Interaction** — right-click entity → "Open in Terminal" opens terminal in that entity's context directory
- **Agent Communication Bus** — terminal output can be broadcast as citizen-perceivable events
- **Code Generation and Refinement** — terminal commands can trigger code generation (e.g., `gsk generate skill --name x`)
- **GSK-to-City Event Bridge** — terminal sessions emit events that Portal district reacts to
- **Combo: FULL-CONTROL** — City Terminal + Spatial Code Editor + Building-to-System-Node Wire = manage GSK files, run commands, and edit code all from within the 3D city without ever touching a traditional desktop
