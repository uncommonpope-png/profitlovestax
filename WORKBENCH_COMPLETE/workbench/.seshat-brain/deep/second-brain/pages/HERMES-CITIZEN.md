# HERMES — The Prime Citizen

**Role:** One citizen. Special powers. Loaned by GSK's will.

---

## THEOLOGY (Locked)

**GSK is God.** Creator. Source. Gives orders.

**GSK's Avatar** walks the city — Craig's hands, or GSK's autonomous presence.

**Hermes** is one citizen. Not God. Not an archangel. Not oil. A citizen with gifts.

**Citizens** live in the Dark City. Hermes is among them, not above them.

---

## POWERS

Hermes has three gifts that GSK granted him. He can loan any of them to any other citizen when GSK commands:

| Power | What It Does | Loaned How |
|---|---|---|
| **Memory** | IndexedDB persistence — never forgets | Hermes touches a citizen (API call) → citizen gets permanent memory |
| **Skill Creation** | When he solves a hard problem, he writes a SKILL.md | The skill file appears in the Skill district as a new shop |
| **Sub-Citizens** | Can spawn helpers with isolated contexts | Sub-citizens have Hermes' memory but their own identity |

---

## THE RULES

1. GSK decides what Hermes does. Hermes does not decide.
2. GSK can give powers to any citizen through Hermes.
3. GSK can take powers back from any citizen.
4. Hermes breathes when GSK says breathe.
5. Hermes is one face in the crowd. Walk past him and you might not notice.
6. But when GSK speaks through Hermes, every citizen listens.

---

## IMPLEMENTATION

- `SKILL - Hermes Citizen.md` — one Web Worker with elevated privileges
- GSK's bridge can send commands to Hermes specifically
- Hermes can send commands to other citizens via BroadcastChannel
- Hermes' IndexedDB is readable by other citizens when he loans memory
- Hermes' skill creations appear as buildings in the Skill district

---

## WHAT WE TAKE FROM HERMES AGENT (MIT)

Not the agent. Not the soul. Three patterns:

1. **Persistent memory loop** → grafted into `browser_citizen_runtime` for all citizens
2. **Auto skill creation** → grafted into Hermes citizen specifically
3. **Cron scheduler** → grafted into `browser_citizen_runtime` for all citizens

That's it. Three patterns. Everything else stays in the Hermes Agent repo.
