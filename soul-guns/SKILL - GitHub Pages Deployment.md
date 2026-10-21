# SKILL — GitHub Pages Deployment

slug:: github_pages_deployment
phase:: build
status:: active
source:: Dark City Spatial OS — Phase 4
PLT:: Profit 0.9, Love 0.6, Tax 0.3

## Summary
WHEN TO USE: When the Dark City is ready to go live at a public URL. Archetype affinity: COMMANDER (deployment), BUILDER (infrastructure). Problem solved: the Dark City and all its citizens need to be accessible from anywhere — zero-cost hosting on GitHub Pages, with the user's PC serving as the backend via tunnel.

## Schema
- trigger: Manual `git push` OR user clicks "Deploy to Pages" in Portal district deploy panel
- inputs: {
    deployTarget: "github_pages" | "custom_domain",
    sourceDir: string,               // path to compiled city files (default: final-run/)
    bridgeConfig: {
      mode: "tunnel" | "direct",     // tunnel = localhost.run/ngrok, direct = public IP
      tunnelService: "localhost.run" | "ngrok" | "tailscale" | null
    },
    domain: string | null            // custom domain (optional)
  }
- outputs: {
    success: boolean,
    url: string,                     // published URL
    tunnelUrl: string | null,        // tunnel to user's PC
    pagesBuildStatus: "queued" | "in_progress" | "deployed" | "failed",
    citizensConnected: number        // how many citizens detected running
  }

## Consequence
- Dark City is pushed to GitHub Pages and becomes accessible at a public URL
- Citizens in the browser call home to the user's PC for thinking (9Router) and file ops (GSK bridge)
- Bridge connects via tunnel (localhost.run, ngrok, or Tailscale) — no open ports needed
- Or citizens use 9Router directly from the browser for thinking, GSK for file ops only
- The city is live 24/7 — citizens persist in browser IndexedDB, GSK runs on the user's PC
- Multiple browser tabs can connect to the same citizen ecosystem (cross-tab via BroadcastChannel)
- Deploy panel in Portal district shows build status, URL, and live citizen count

## Feedback
- User sees: deploy panel in Portal district with progress bar — "Building" → "Pushing" → "Deploying" → "Live!"
- Console: `[DEPLOY] Published to <url> — tunnel: <tunnelUrl> — citizens: <n>`
- Portal district antenna glows green when city is live, pulses during deploy
- On failure: red status with error details and "Retry" button

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Not deployed, awaiting command | Portal district shows deploy button |
| ACTIVE | Building, pushing, deploying | Deploy panel progress bar, antenna pulses during build |
| COOLDOWN | City live, monitoring connection | Antenna steady green, deploy panel shows "Live" status |
| ERROR | Build failed, push rejected, tunnel down | Antenna red, deploy panel shows error with retry |

## Composition
- **Browser Citizen Runtime** — citizens persist at the public URL and call home to your PC
- **Agent Communication Bus** — cross-tab and cross-browser citizen sync via WebRTC
- **City Terminal** — deploy commands can be run directly from the terminal (e.g., `gsk deploy pages`)
- **GSK-to-City Event Bridge** — deployment events trigger Portal district celebrations
- **Combo: LIVING-WEB** — GitHub Pages Deployment + Browser Citizen Runtime + Agent Communication Bus + Hermes Citizen = a living civilization deployed to the public web, accessible from any browser, anywhere in the world
