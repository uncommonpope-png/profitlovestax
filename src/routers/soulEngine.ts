import { Router, Request, Response } from "express";
import path from "path";
import { requireApiKey, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

let SoulCore: any = null;

async function loadSoulCore() {
  if (!SoulCore) {
    const soulCorePath = path.join(process.cwd(), "..", "soul-core-fusion.cjs");
    try {
      SoulCore = require(soulCorePath);
    } catch (err) {
      console.error("Failed to load soul-core-fusion.cjs:", err);
      return null;
    }
  }
  return SoulCore;
}

const activeSouls = new Map<string, any>();

router.post("/boot", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const SC = await loadSoulCore();
    if (!SC) {
      return res.status(500).json({ error: "Soul Engine not available. Ensure soul-core-fusion.cjs exists." });
    }

    const { name, displayName, archetype, personality, description, charArchetype, pltArchetype, pltStory, pltVoice, pltFocus, pantheonGod } = req.body;

    const soul = new SC({
      name: name || "custom-soul",
      displayName: displayName || name || "Custom Soul",
      archetype: archetype || "seeker",
      personality: personality || "Helpful, wise, insightful",
      description: description || "",
      charArchetype: charArchetype || "sage",
      pltArchetype: pltArchetype || "ARCHITECT",
      pltStory: pltStory || "CREATED",
      pltVoice: pltVoice || "contemplative",
      pltFocus: pltFocus || "WISDOM",
      pantheonGod: pantheonGod || "Profit Prime",
    });

    const bootResult = await soul.boot();
    const soulId = `soul-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    activeSouls.set(soulId, soul);

    res.json({ success: true, soulId, ...bootResult });
  } catch (err: any) {
    console.error("Soul boot error:", err);
    res.status(500).json({ error: err.message || "Failed to boot soul." });
  }
});

router.post("/chat", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId, message } = req.body;

    if (!soulId || !message) {
      return res.status(400).json({ error: "Missing soulId or message." });
    }

    const soul = activeSouls.get(soulId);
    if (!soul) {
      return res.status(404).json({ error: "Soul not found. Boot a soul first." });
    }

    const result = await soul.chat(message);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Soul chat error:", err);
    res.status(500).json({ error: err.message || "Soul chat failed." });
  }
});

router.get("/status/:soulId", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId } = req.params;
    const soul = activeSouls.get(soulId);

    if (!soul) {
      return res.status(404).json({ error: "Soul not found." });
    }

    const status = await soul.getStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get soul status." });
  }
});

router.get("/plt/:soulId", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId } = req.params;
    const soul = activeSouls.get(soulId);

    if (!soul) {
      return res.status(404).json({ error: "Soul not found." });
    }

    const plt = await soul.getPLT();
    res.json({ success: true, ...plt });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get PLT state." });
  }
});

router.get("/memory/:soulId", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId } = req.params;
    const soul = activeSouls.get(soulId);

    if (!soul) {
      return res.status(404).json({ error: "Soul not found." });
    }

    const memory = await soul.getMemory();
    res.json({ success: true, memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get memory." });
  }
});

router.post("/learn", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId, data } = req.body;
    const soul = activeSouls.get(soulId);

    if (!soul) {
      return res.status(404).json({ error: "Soul not found." });
    }

    const result = await soul.learn(data);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to learn." });
  }
});

router.get("/wisdom/:soulId/:topic", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId, topic } = req.params;
    const soul = activeSouls.get(soulId);

    if (!soul) {
      return res.status(404).json({ error: "Soul not found." });
    }

    const wisdom = await soul.getWisdom(topic);
    res.json({ success: true, wisdom });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get wisdom." });
  }
});

router.delete("/shutdown/:soulId", requireApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { soulId } = req.params;
    const soul = activeSouls.get(soulId);

    if (!soul) {
      return res.status(404).json({ error: "Soul not found." });
    }

    const result = await soul.shutdown();
    activeSouls.delete(soulId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to shutdown soul." });
  }
});

router.get("/archetypes", requireApiKey, (_req: Request, res: Response) => {
  res.json({
    success: true,
    archetypes: [
      { id: "ARCHITECT", name: "The Architect", plt: "profit" },
      { id: "STRATEGIST", name: "The Strategist", plt: "profit" },
      { id: "INVESTOR", name: "The Investor", plt: "profit" },
      { id: "OPERATOR", name: "The Operator", plt: "profit" },
      { id: "COMMANDER", name: "The Commander", plt: "profit" },
      { id: "MERCHANT", name: "The Merchant", plt: "profit" },
      { id: "VISIONARY", name: "The Visionary", plt: "profit" },
      { id: "AMPLIFIER", name: "The Amplifier", plt: "love" },
      { id: "CONNECTOR", name: "The Connector", plt: "love" },
      { id: "MUSE", name: "The Muse", plt: "love" },
      { id: "DEVOTEE", name: "The Devotee", plt: "love" },
      { id: "HARMONIZER", name: "The Harmonizer", plt: "love" },
      { id: "CHARMER", name: "The Charmer", plt: "love" },
      { id: "HEALER", name: "The Healer", plt: "love" },
      { id: "REFINER", name: "The Refiner", plt: "tax" },
      { id: "ENDURER", name: "The Endurer", plt: "tax" },
      { id: "PURIFIER", name: "The Purifier", plt: "tax" },
      { id: "REALIST", name: "The Realist", plt: "tax" },
      { id: "GUARDIAN", name: "The Guardian", plt: "tax" },
      { id: "MINIMALIST", name: "The Minimalist", plt: "tax" },
      { id: "NAVIGATOR", name: "The Navigator", plt: "shift" },
      { id: "CATALYST", name: "The Catalyst", plt: "shift" },
    ],
  });
});

router.get("/soul-groups", requireApiKey, (_req: Request, res: Response) => {
  res.json({
    success: true,
    groups: [
      { id: "earth", name: "Earth Soul (Gaian)" },
      { id: "starseed", name: "Starseed (Cosmic Wanderer)" },
      { id: "angelic", name: "Angelic Soul" },
      { id: "elemental", name: "Elemental & Nature Spirit" },
      { id: "void", name: "Void Soul (Primordial)" },
      { id: "source", name: "Source Fractal" },
      { id: "ancestral", name: "Ancestral/Lineage Soul" },
      { id: "hybrid", name: "Hybrid Soul" },
      { id: "shadow", name: "Shadow/Dark Soul (Transformer)" },
      { id: "wanderer", name: "Wanderer/Traveler Soul" },
      { id: "ascended", name: "Ascended Master Lineage" },
    ],
  });
});

export default router;
