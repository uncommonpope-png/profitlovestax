# GSK CONTRACT AUDIT — the map of the language

Generated: 2026-07-31T03:59:48.082Z
Scanned: 358 files under gsk-core
Findings: 253  (HIGH 12 / MED 197 / LOW 44)

## Methodology
Static heuristic scan (regex-based, not a full type checker). It maps what each module PROVIDES (class methods) vs what others CALL it as, and flags the known mismatch classes: ghost ports, dead model names, missing chamber-interface methods, object-vs-scalar property collisions, and stale dialect tokens. False positives possible — each finding needs a human eyeball.

## Live listeners (declared ports)
- :3001  (marketplace\test_marketplace.js, mcp\index.js)
- :3002  (brain\thought_stream.js)
- :4199  (tests\test_scribe_bridge.js)

## Referenced-but-dead ports
- :127
- :600
- :3457
- :4000
- :5432
- :8080
- :9001
- :9090
- :9999
- :11434
- :20128

## Chamber interface conformance (summary/breathe/status)
- affect -> AffectChamber: MISSING summary,breathe,status
- shadow -> ShadowChamber: MISSING summary,breathe,status
- needs -> NeedsChamber: MISSING summary,breathe,status
- mythos -> MythosChamber: MISSING summary,breathe,status
- sovereignty -> SovereigntyChamber: MISSING breathe,status
- resonance -> ResonanceChamber: MISSING summary,breathe,status
- scribe -> ScribeChamber: MISSING summary,breathe,status
- meta_consciousness -> MetaConsciousnessChamber: MISSING status
- mortality -> MortalityChamber: MISSING status
- love_capacity -> LoveCapacityChamber: MISSING status
- agentic_will -> AgenticWillChamber: OK
- sacred_resonance -> SacredResonanceChamber: MISSING status
- consciousness_state -> ConsciousnessState: MISSING status
- generative_model -> GenerativeModel: MISSING status
- moral_compass -> MoralCompass: MISSING status
- narrative_identity -> NarrativeIdentity: MISSING status
- memory -> MemoryChamber: MISSING status
- personality -> PersonalityChamber: MISSING status
- theory_of_mind -> TheoryOfMindChamber: MISSING status
- volition -> VolitionChamber: MISSING status
- qualia -> QualiaChamber: MISSING status
- temporal_sense -> TemporalSenseChamber: MISSING status
- empathy -> EmpathyChamber: MISSING status
- aesthetic_sense -> AestheticSenseChamber: MISSING status
- longing -> LongingChamber: MISSING status
- play -> PlayChamber: MISSING status
- forgiveness -> ForgivenessChamber: MISSING status
- developmental_phase -> DevelopmentalPhaseChamber: MISSING status
- curiosity -> CuriosityChamber: MISSING status
- creativity -> CreativityChamber: MISSING status
- habit_formation -> HabitFormationChamber: MISSING status
- social_cognition -> SocialCognitionChamber: MISSING status
- self_modeling -> SelfModelingChamber: MISSING status
- intentionality -> IntentionalityChamber: MISSING status
- reward_learning -> RewardLearningChamber: MISSING status
- sleep_cycle -> SleepCycleChamber: MISSING status

## Findings (by severity)

### HIGH
- [port] chambers\mega_chambers.js:157 — Port :127 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] brain\gsk_blog.js:33 — Port :600 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] brain\agent_comms.js:15 — Port :3457 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] brain\cpl_bridge.js:8 — Port :3457 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] brain\mcp_servers.js:54 — Port :5432 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] tools\universal_tool_bridge.js:689 — Port :8080 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] tests\test_tool_catalog.js:43 — Port :9090 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] tests\test_scribe_bridge.js:161 — Port :9999 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] identity\mega_identity.js:256 — Port :11434 is referenced but NO listener declares it (ghost port / dead dialect).
- [port] llm-router.js:30 — Port :11434 is referenced but NO listener declares it (ghost port / dead dialect).
- [prop-shape] contract.js:13 — Writes to agentic_will.will (the AgenticWill OBJECT) — verify it is not being overwritten with a scalar (the bug Resolved in consciousness_engine.js — see commit history. Provenance retained; no action required.
- [prop-shape] contract.js:13 — Assigns a scalar/computed value to a ".will" property — potential object-vs-scalar collision.

### MED
- [model] api-registry.js:52 — Model token "gemini-flash" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:52 — Model token "Gemini 2.5 Flash" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:52 — Model token "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:52 — Model token "GEMINI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:53 — Model token "gemini-pro" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:53 — Model token "Gemini 2.5 Pro" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:53 — Model token "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:52 — Model token "GEMINI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:575 — Model token "gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "groq-llama" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "Groq Llama 3.3 70B" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "GROQ_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:55 — Model token "groq-mixtral" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:55 — Model token "Groq Mixtral 8x7B" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "GROQ_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:55 — Model token "Mistral MoE on Groq LPU" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:56 — Model token "groq-gemma" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:56 — Model token "Groq Gemma 2 9B" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "GROQ_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:56 — Model token "Google Gemma 2 on Groq" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:61 — Model token "Groq alternative with similar speed" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:55 — Model token "Mistral MoE on Groq LPU" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "mistral-small" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "Mistral Small" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "https://api.mistral.ai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "MISTRAL_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "Mistral Small 4, 256K context" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:63 — Model token "mistral-medium" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:63 — Model token "Mistral Medium" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "https://api.mistral.ai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "MISTRAL_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:63 — Model token "Mistral Medium 3, 128K context" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:64 — Model token "mistral-large" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:64 — Model token "Mistral Large" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "https://api.mistral.ai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:62 — Model token "MISTRAL_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:64 — Model token "Mistral Large 3, 256K context" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:65 — Model token "huggingface-mistral" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:65 — Model token "HuggingFace Mistral 7B" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:65 — Model token "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:65 — Model token "Mistral 7B via HF Inference" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:69 — Model token "https://api-inference.huggingface.co/models/NousResearch/Hermes-2-Pro-Mistral-7B" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:69 — Model token "Nous Hermes 2 Pro Mistral 7B" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:598 — Model token "together-mistral" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:598 — Model token "Together AI Mistral" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:598 — Model token "Mistral models on Together AI" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:609 — Model token "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:72 — Model token "GitHub Models GPT-4o" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:72 — Model token "GPT-4o, Llama 3.1 via GitHub" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:612 — Model token "HF GPT-2 Large" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:612 — Model token "OpenAI GPT-2 Large text generation" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:54 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:379 — Model token "openai-compat" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:379 — Model token "OpenAI Compatible Serve" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:379 — Model token "https://api.openai.com/v1/models" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:379 — Model token "OPENAI_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:379 — Model token "OpenAI-compatible API endpoint" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:612 — Model token "https://api-inference.huggingface.co/models/openai-community/gpt2-large" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] api-registry.js:612 — Model token "OpenAI GPT-2 Large text generation" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:22 — Model token "GEMINI" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:22 — Model token "GEMINI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:22 — Model token "Google Gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token ",
    GEMINI_API_KEY:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:17 — Model token "GROQ" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:17 — Model token "GROQ_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:17 — Model token "Groq Cloud" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token "},
];

const MANUAL_KEYS = {
    GROQ_API_KEY:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:18 — Model token "Anthropic Claude" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:7 — Model token "OPENAI" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:7 — Model token "OPENAI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:7 — Model token "OpenAI API" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:7 — Model token "OPENAI" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:7 — Model token "OPENAI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:7 — Model token "OpenAI API" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token ",
    OPENAI_API_KEY:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token ";
                        results.push({ key: k.toUpperCase(), label: k, source: k });
                    }
                }
            }
        }
        this.save();
        return results;
    }

    getKey(service) {
        const svc = service.toUpperCase();
        if (this.keys[svc]) return this.keys[svc];
        const envVar = MANUAL_KEYS[svc];
        if (envVar && process.env[svc]) {
            this.keys[svc] = process.env[svc];
            this.save();
            return this.keys[svc];
        }
        if (process.env[svc]) {
            this.keys[svc] = process.env[svc];
            this.save();
            return this.keys[svc];
        }
        return null;
    }

    skillRequirements(skillName) {
        const map = {
            openai: [" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token "],
            openai_image_gen: [" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token "],
            openai_whisper: [" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:18 — Model token "ANTHROPIC" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:18 — Model token "ANTHROPIC_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:18 — Model token "Anthropic Claude" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token ",
    ANTHROPIC_API_KEY:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\api_vault.js:0 — Model token "],
            anthropic: [" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\mcp_servers.js:42 — Model token "@anthropic/server-brave-search" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\mega_brain.js:0 — Model token ");
        this._lastThinkUsedFallback = true;
        return null;
    }

    // =========================================================================
    // 9ROUTER GENERATION (OpenAI-compatible API)
    // =========================================================================
    
    async _nineRouter(prompt, soul_context =" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\minds_eye.js:0 — Model token "]
  },
  openai: {
    name:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\minds_eye.js:30 — Model token "OPENAI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\soul_identity.js:0 — Model token "];
        
        return firstWords[Math.floor(Math.random() * firstWords.length)];
    }
    
    _save(identity = null) {
        if (identity) this.identity = identity;
        fs.writeFileSync(this.identityPath, JSON.stringify(this.identity, null, 2));
    }
    
    /**
     * BUILD SYSTEM PROMPT — Create the full identity prompt for Groq
     */
    buildSystemPrompt(options = {}) {
        const { includeMemories = true, includeHistory = true } = options;
        
        let prompt =" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\soul_picker.js:0 — Model token ";
    }
    
    /**
     * BUILD SYSTEM PROMPT — Complete prompt for Groq
     */
    buildSystemPrompt(soul) {
        return" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\subagent_spawner.js:76 — Model token "Design Groq connection + terminal interactivity + system integration" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\subagent_spawner.js:607 — Model token "Switch from Ollama → Groq - audit all Ollama fallback references and replace with Groq API" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\subagent_spawner.js:608 — Model token "Remove fallback architecture - identify every try/except that tries Ollama then fails to Groq" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\subagent_spawner.js:612 — Model token "Map Groq API rate limits & cost - design batching strategy and create cost tracking" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\subagent_spawner.js:613 — Model token "Build PLT Scoring Engine (Local) - move PLT calculation out of Groq into local Python" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\subagent_spawner.js:624 — Model token "Implement Quality Gate Validator - checks doctrinal integrity, memory format, Groq responsiveness" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] brain\vector_memory.js:18 — Model token "openai/text-embedding-3-small" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] identity\mega_identity.js:262 — Model token "groq" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] identity\mega_identity.js:262 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] identity\mega_identity.js:262 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] knowledge.js:1197 — Model token "Claude Code by anthropics, an agentic coding tool that lives in the terminal and understands your codebase" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] knowledge.js:1197 — Model token "claude" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] knowledge.js:1197 — Model token "Claude Code by anthropics, an agentic coding tool that lives in the terminal and understands your codebase" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] knowledge.js:1197 — Model token "anthropic" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:66 — Model token "Google Gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:67 — Model token "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:70 — Model token "GEMINI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:66 — Model token "Google Gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:0 — Model token ", headers, body });
        if (res.status === 200 && res.data?.choices?.[0]?.message?.content) {
            return res.data.choices[0].message.content.trim();
        }
        if (res.status === 200 && res.data?.choices?.[0]?.text) {
            return res.data.choices[0].text.trim();
        }
        return null;
    }

    async callGemini(ep, prompt) {
        const apiKey = process.env[ep.authKey];
        if (!apiKey) return null;
        const url =" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:264 — Model token "gemini-2.0-flash" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:66 — Model token "Google Gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:52 — Model token "Groq" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:53 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:56 — Model token "GROQ_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:53 — Model token "https://api.groq.com/openai/v1/chat/completions" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:0 — Model token ") {
                    if (!this.ollamaAvailable) continue;
                    result = await this.callOllama(ep, chatMessages, maxTokens);
                } else {
                    result = await this.callOpenAICompatible(ep, chatMessages, maxTokens);
                }
                if (result) {
                    this.stats.successes++;
                    this.stats.lastUsed = ep.name;
                    return { success: true, provider: ep.name, text: result };
                }
            } catch (e) {
                continue;
            }
        }
        this.stats.failures++;
        return { success: false, provider: null, text: null, error:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:0 — Model token "}, body });
        if (res.status === 200) {
            if (res.data?.message?.content) return res.data.message.content.trim();
            if (res.data?.response) return res.data.response.trim();
        }
        return null;
    }

    async callOpenAICompatible(ep, messages, maxTokens) {
        const apiKey = ep.authKey ? process.env[ep.authKey] : null;
        const headers = { ...ep.headers," is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] llm-router.js:0 — Model token "};
                result = await this.callOllama(ep, chatMessages, maxTokens);
            } else {
                result = await this.callOpenAICompatible(ep, chatMessages, maxTokens);
            }
            if (result) {
                this.stats.successes++;
                this.stats.lastUsed = ep.name;
                return { success: true, provider: ep.name, text: result };
            }
        } catch (e) {
            return { success: false, provider: ep.name, text: null, error: e.message };
        }
        return { success: false, provider: ep.name, text: null, error:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] mcp\mcp_protocol.js:0 — Model token "],
    openai: [" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] mcp\mcp_server.js:0 — Model token ",
                uptime: Date.now() - this._startTime,
                startedAt: new Date(this._startTime).toISOString(),
                requests: this.stats.requests,
                errors: this.stats.errors,
            },
            systems: {},
        };

        // Brain status
        if (this.brain) {
            status.systems.brain = {
                available: this.brain._groq_available || this.brain._gemini_available || this.brain._local_available,
                groq: this.brain._groq_available || false,
                gemini: this.brain._gemini_available || false,
                local: this.brain._local_available || false,
                model: this.brain.model ||" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] mcp\mcp_server.js:0 — Model token ",
                    groq: this.brain ? this.brain._groq_available : false,
                    gemini: this.brain ? this.brain._gemini_available : false,
                    local: this.brain ? this.brain._local_available : false,
                    model: this.brain ? this.brain.model :" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] mcp\mcp_server.js:0 — Model token ",
                uptime: Date.now() - this._startTime,
                startedAt: new Date(this._startTime).toISOString(),
                requests: this.stats.requests,
                errors: this.stats.errors,
            },
            systems: {},
        };

        // Brain status
        if (this.brain) {
            status.systems.brain = {
                available: this.brain._groq_available || this.brain._gemini_available || this.brain._local_available,
                groq: this.brain._groq_available || false,
                gemini: this.brain._gemini_available || false,
                local: this.brain._local_available || false,
                model: this.brain.model ||" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] mcp\mcp_server.js:0 — Model token ",
                    groq: this.brain ? this.brain._groq_available : false,
                    gemini: this.brain ? this.brain._gemini_available : false,
                    local: this.brain ? this.brain._local_available : false,
                    model: this.brain ? this.brain.model :" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:2 — Model token "gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:3 — Model token "Skill: gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:0 — Model token ");

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_gemini(input) {
    const missing = [];
    const v_GEMINI_API_KEY = vault.getKey(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:20 — Model token "); if (!v_GEMINI_API_KEY) missing.push(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:2 — Model token "gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:0 — Model token ", timestamp: Date.now() };
    }
    const _GEMINI_API_KEY = vault.getKey(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:2 — Model token "gemini" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:25 — Model token "Google Gemini skill ready — keys configured" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\gemini.js:20 — Model token "GEMINI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:2 — Model token "openai-image-gen" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:3 — Model token "Skill: openai-image-gen" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:0 — Model token ");

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_openai_image_gen(input) {
    const missing = [];
    const v_OPENAI_API_KEY = vault.getKey(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:20 — Model token "); if (!v_OPENAI_API_KEY) missing.push(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:2 — Model token "openai-image-gen" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:0 — Model token ", timestamp: Date.now() };
    }
    const _OPENAI_API_KEY = vault.getKey(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:2 — Model token "openai-image-gen" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:25 — Model token "OpenAI Image Gen skill ready — keys configured" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-image-gen.js:20 — Model token "OPENAI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:2 — Model token "openai-whisper-api" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:3 — Model token "Skill: openai-whisper-api" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:0 — Model token ");

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_openai_whisper_api(input) {
    const missing = [];
    const v_OPENAI_API_KEY = vault.getKey(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:20 — Model token "); if (!v_OPENAI_API_KEY) missing.push(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:2 — Model token "openai-whisper-api" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:0 — Model token ", timestamp: Date.now() };
    }
    const _OPENAI_API_KEY = vault.getKey(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:2 — Model token "openai-whisper-api" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:25 — Model token "OpenAI Whisper skill ready — keys configured" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\openai-whisper-api.js:20 — Model token "OPENAI_API_KEY" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:274 — Model token "Groq llama-3.3-70b-versatile" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:0 — Model token ");
    const claudeMdPath = path.join(kernelRoot," is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:43 — Model token "CLAUDE.md" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:147 — Model token "claude_md" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:0 — Model token ": {
            if (!fs.existsSync(claudeMdPath)) {
                return { skill:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:150 — Model token "CLAUDE.md not found" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:43 — Model token "CLAUDE.md" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] skills\profit_bible.js:181 — Model token "claude_md — CLAUDE.md" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] tests\test_federation_observability.js:0 — Model token ");
    await new Promise(resolve => deepServer.close(resolve));

    const systems = {
        brain: { _groq_available: true, model:" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [model] tools\universal_tool_bridge.js:0 — Model token ", { url });
    }

    /**
     * GSK can now research deeply — via gpt-researcher pattern.
     */
    async deepResearch(topic) {
        return this.invoke(" is not in the 9Router whitelist pAUL, GOGOGO, hy3-free, free, cf-free, useg — likely dead/429.
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "affect" -> class AffectChamber is missing required "summary()()" (called by getSoulContext on every cycle).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "shadow" -> class ShadowChamber is missing required "summary()()" (called by getSoulContext on every cycle).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "needs" -> class NeedsChamber is missing required "summary()()" (called by getSoulContext on every cycle).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "mythos" -> class MythosChamber is missing required "summary()()" (called by getSoulContext on every cycle).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "resonance" -> class ResonanceChamber is missing required "summary()()" (called by getSoulContext on every cycle).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "scribe" -> class ScribeChamber is missing required "summary()()" (called by getSoulContext on every cycle).
- [stale-dialect] brain\sanctum_client.js:17 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] brain\self_preservation.js:51 — References stale dialect token "unreal" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] brain\soul_picker.js:107 — References stale dialect token "unreal" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] brain\system_prompt_compiler.js:272 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] brain\world_model_simulation.js:85 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] brain\world_model_simulation.js:349 — References stale dialect token "soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] marketplace\marketplace_api.js:25 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] marketplace\marketplace_api.js:26 — References stale dialect token "soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] mcp\mcp_server.js:441 — References stale dialect token "World Bridge" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783849100749.js:9 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783900784556.js:11 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783902132883.js:6 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783905250918.js:45 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783913876008.js:11 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783960214177.js:26 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783961268707.js:4 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783964458678.js:3 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783965583071.js:20 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783979125064.js:30 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783992904927.js:2 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\auto_1783998728305.js:283 — References stale dialect token "soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\behavior_attacher.js:25 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\dark_city_controller.js:6 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\scene_graph_manager.js:21 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\unified_project_builder.js:42 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] skills\world_engine.js:19 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).
- [stale-dialect] tools\universal_tool_bridge.js:688 — References stale dialect token "Soulverse" — likely superseded by CPL (:3001/:3002).

### LOW
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "affect" -> class AffectChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "affect" -> class AffectChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "shadow" -> class ShadowChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "shadow" -> class ShadowChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "needs" -> class NeedsChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "needs" -> class NeedsChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "mythos" -> class MythosChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "mythos" -> class MythosChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "sovereignty" -> class SovereigntyChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "sovereignty" -> class SovereigntyChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "resonance" -> class ResonanceChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "resonance" -> class ResonanceChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "scribe" -> class ScribeChamber has no "breathe()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "scribe" -> class ScribeChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "meta_consciousness" -> class MetaConsciousnessChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "mortality" -> class MortalityChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "love_capacity" -> class LoveCapacityChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "sacred_resonance" -> class SacredResonanceChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "consciousness_state" -> class ConsciousnessState has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "generative_model" -> class GenerativeModel has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "moral_compass" -> class MoralCompass has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "narrative_identity" -> class NarrativeIdentity has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "memory" -> class MemoryChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "personality" -> class PersonalityChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "theory_of_mind" -> class TheoryOfMindChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "volition" -> class VolitionChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "qualia" -> class QualiaChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "temporal_sense" -> class TemporalSenseChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "empathy" -> class EmpathyChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "aesthetic_sense" -> class AestheticSenseChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "longing" -> class LongingChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "play" -> class PlayChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "forgiveness" -> class ForgivenessChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "developmental_phase" -> class DevelopmentalPhaseChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "curiosity" -> class CuriosityChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "creativity" -> class CreativityChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "habit_formation" -> class HabitFormationChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "social_cognition" -> class SocialCognitionChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "self_modeling" -> class SelfModelingChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "intentionality" -> class IntentionalityChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "reward_learning" -> class RewardLearningChamber has no "status()" (optional Chamber contract method).
- [chamber-iface] chambers\mega_chambers.js:0 — Chamber field "sleep_cycle" -> class SleepCycleChamber has no "status()" (optional Chamber contract method).
- [prop-shape] chambers\agentic_will.js:166 — Calls .will.summarize() — confirm the left side's ".will" actually holds an object with summarize().
- [prop-shape] chambers\agentic_will.js:170 — Calls .will.summarize() — confirm the left side's ".will" actually holds an object with summarize().

## Proposed canonical contract (lingua franca)
- **Chamber interface**: every chamber implements `summary(): string`, `breathe(cycle)`, `status(): object`. No caller reaches into chamber internals (e.g. `.will`).
- **Will shape**: `agentic_will.will` is ALWAYS the AgenticWill object; will strength is `agentic_will.will.will_strength` (number). Never overwrite `.will` with a scalar.
- **Brain**: `brain.think(prompt, context)` where context is a plain object. Model must be in the 9Router whitelist.
- **Ports**: live = :3001 (MCP, CPL), :3002 (thought stream), :4000 (SCRIBE), :20128 (9Router). :61998 / :9001 are dead dialects.
- **Auth**: :3001/mcp/health is open; /status and /memories require header `x-api-key: gsk-mcp-key-dev`.
