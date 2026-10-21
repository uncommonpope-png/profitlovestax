# Research: Production-Ready Agent Distribution

**type:: [[research]]**  
**date::** May 26, 2026  
**method::** GitHub mining + web research  
**scope::** How to make CLI souls accessible to non-technical users (including phones)  
**status::** complete

---

## THE PROBLEM

Vikki, Commander, Architect = CLI tools. They require:
- Node.js >=14
- npm
- Command line knowledge
- Windows/Mac/Linux OS

**Phone users cannot run CLI tools.** A zip file with `.cjs` files is useless on iOS/Android.

**Question:** How do we distribute these souls to "everyone, even phone users"?

---

## FINDINGS: 7 PATHS FORWARD

### Path 1: StackBlitz WebContainer — Browser-Based Node.js ⭐ BEST

**Repo:** `stackblitz/webcontainer-core` (4.6k★)  
**What it does:** Runs Node.js entirely in the browser via WebAssembly. No server needed.  
**Customer experience:**
1. Go to `buyasoul.com/vikki` on phone
2. Full Node.js terminal opens in browser
3. Type `vikki ship express-api my-api`
4. Code generates, `npm install` runs, project downloads as zip

**Why it's best:**
- Works on ANY device with a browser (iPhone, Android, iPad, Chromebook)
- No installation
- No server costs (runs client-side)
- Vikki's code barely changes

**Limitations:**
- WebContainer can't access all npm packages (some native modules fail)
- `execSync` calls (npm install, git init) may be restricted
- Best for code generation, not full server deployment

**Time to build:** 1 session (wrap Vikki in WebContainer API)

---

### Path 2: Telegram Bot — Zero-Install Messaging ⭐ SIMPLEST

**Repo:** `telegraf/telegraf` (9.1k★)  
**What it does:** Node.js framework for Telegram bots.  
**Customer experience:**
1. Message @VikkiBot: "build express api my-api"
2. Bot replies: "⚡ Building... 30 seconds"
3. Bot sends: "Done! Download: https://buyasoul.com/dl/abc123"

**Why it's great:**
- 1 billion+ Telegram users
- Works on any phone (iOS, Android, Web)
- No app installation (uses existing Telegram)
- Natural language interface

**Architecture:**
```
User (phone) → Telegram → Your server (Railway/Vercel) → Vikki runs → Zip URL returned
```

**Time to build:** 1 session (API wrapper + bot logic)

---

### Path 3: SaaS Wrapper — Web Frontend + Backend API

**Deployment repos researched:**
- `vercel/vercel` (15.5k★) — Serverless functions, $0 to start
- `railwayapp/cli` (548★) — Easy Node.js hosting, $5/month

**Customer experience:**
1. Go to `buyasoul.com` on phone
2. Form: "What do you want to build?" [express-api]
3. "Name?" [my-api]
4. Click "Ship It"
5. Progress bar. Download zip.

**Architecture:**
```
Frontend (React/Vue) → API Route (Vercel/Railway) → Vikki runs on server → Zip generated → User downloads
```

**Business model:** Subscription ($9-29/month for N generations)

**Time to build:** 2 sessions (frontend + backend)

---

### Path 4: n8n Integration — Workflow Automation

**Repo:** `n8n-io/n8n` (190k★)  
**What it does:** Workflow automation with 400+ integrations. Visual builder.  
**Customer experience:**
- Technical users add "Vikki" node to their n8n workflow
- "When I get a webhook, run Vikki to generate an API"
- n8n handles the orchestration

**Why it matters:**
- n8n is HUGE (190k stars)
- Self-hosted or cloud
- BUYaSOUL becomes a "node" in enterprise workflows
- B2B play, not B2C

**Time to build:** 1 session (n8n custom node)

---

### Path 5: Electron Desktop App — Developer Market

**What it does:** Wrap Vikki in a desktop app with UI. Auto-installs Node.js.  
**Works on:** Windows, Mac, Linux. **NOT phones.**  
**Time to build:** 1-2 sessions  
**Verdict:** Skip if goal is "everyone including phones."

---

### Path 6: Replit / Codespaces — Cloud IDE

**Repos:**
- `replit/replit-py` (187★) — Cloud IDE platform
- GitHub Codespaces (built into GitHub)

**What it does:** Host a "template repl" where Vikki is pre-installed.  
**Customer experience:** "Fork this repl, run vikki ship express-api my-api"

**Verdict:** Too technical. Requires Replit account. Skip for mass market.

---

### Path 7: Builder.io / No-Code Frontend

**Repo:** `BuilderIO/builder` (8.7k★)  
**What it does:** Visual drag-and-drop builder. Generates React/Vue code.  
**Verdict:** Overkill. We're not building a website builder. We're building a code generator. Skip.

---

## RECOMMENDATION

### For "Everyone, Including Phone Users":

**Phase 1 (Fastest): Telegram Bot**
- 1 session to build
- Zero user friction
- Works on every phone instantly
- Can start charging today

**Phase 2 (Best experience): StackBlitz WebContainer**
- 1 session to build
- Runs in browser = no server costs
- Feels like a native app
- Can embed in website

**Phase 3 (Revenue): SaaS Wrapper on Vercel**
- 2 sessions to build
- Subscription model
- Full control over branding
- Analytics, payments, user accounts

### Business Model Comparison

| Path | Build Time | Server Cost | User Friction | Revenue Model |
|------|------------|-------------|---------------|---------------|
| Telegram Bot | 1 session | $5-20/mo | Zero | Pay-per-generation |
| StackBlitz | 1 session | $0 (client-side) | Low | Freemium |
| SaaS (Vercel) | 2 sessions | $0-20/mo | Low | Subscription |
| n8n Node | 1 session | Self-hosted | Medium | B2B license |

---

## THE SURGICAL STRIKE

**If I had to pick ONE to build in the next session:**

**Telegram Bot.**

Why:
- Fastest to build (1 session)
- Zero user friction (they already have Telegram)
- Can charge immediately (Stripe payment links)
- Works on every phone on earth
- Vikki's code barely changes (just an API wrapper)

**Next session after that:** StackBlitz WebContainer for the browser experience.

---

*"The best distribution channel is the one your customer already uses every day."*
