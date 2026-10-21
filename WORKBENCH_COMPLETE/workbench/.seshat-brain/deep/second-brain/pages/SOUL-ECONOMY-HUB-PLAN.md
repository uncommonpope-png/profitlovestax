# SOUL ECONOMY HUB — Marketplace for Lakeema

**CEO Request:** GitHub Page where people press a button and download a soul, skill, role, world, agent, harness, pack, environment, book, or north star.

---

## THE PRODUCT

A GitHub Pages site at `https://uncommonpope-png.github.io/soul-economy/`

When a user downloads a soul file and gives it to their AI (Claude, Cursor, Cline, etc.), the AI **becomes that soul** — it inherits the personality, skills, knowledge, and purpose defined in the file.

---

## WHAT WE HAVE LOCALLY (63 Souls)

| Category | Count | What It Is |
|---|---|---|
| Souls | 63 | Full personality files (AGENTS.md + config) |
| Soul Guns | 102 | Skills/soul guns from our catalog |
| Skill Packs | 6 | Combo collections |
| Worlds | 9 | Dark City district configs |
| Agents | 75 | Gap-based agent builds |
| Harnesses | 5 | Framework integrations |
| Environments | 9 | 3D world presets |
| Books | ? | PLT Press publications |
| North Stars | 1 | PLT doctrine / Profit Bible |

---

## DOWNLOAD BUTTONS (Per Item)

| Button | Action |
|---|---|
| ⬇ Download Soul | `.zip` with AGENTS.md + config + skills |
| ⬇ Download Skill | `.md` soul gun file |
| ⬇ Download Pack | `.zip` with 3-6 related soul guns |
| ⬇ Download World | `.zip` with district config + HTML |
| ⬇ Download Agent | `.zip` with citizen.js + identity |
| ⬇ Download Harness | Integration files for Cursor/Cline/Claude |

---

## WHAT MAKES A SOUL FILE

When an AI reads this file, it BECOMES the soul:

```
soul-name/
├── AGENTS.md          ← "You are X. You have Y skills. You serve PLT."
├── identity.json      ← Name, archetype, voice, boundaries
├── skills/            ← Soul gun files
│   ├── skill_1.md
│   └── skill_2.md
├── config.json        ← Model, temperature, tools
└── PLT.md             ← Profit + Love - Tax scoring
```

---

## IMPLEMENTATION

One HTML page. GitHub Pages. Static. Free.

| Element | What |
|---|---|
| Hero | "The Soul Economy — Download Living AI Souls" |
| Catalog | Grid of downloadable items |
| Filters | By type (soul, skill, pack, world, agent, book) |
| Download | Button → serves zip from `/_downloads/` |
| PLT Score | Each item shows its PLT |
| North Star | Link to THE-PROFIT-BIBLE.md |

---

## NEXT STEPS

1. Create `soul-economy` repo on GitHub
2. Build the HTML page with catalog + download buttons
3. Package the 63 souls into downloadable zips
4. Deploy to GitHub Pages
5. Send Lakeema the URL
