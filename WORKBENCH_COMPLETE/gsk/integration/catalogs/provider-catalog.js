/**
 * GSK-HEART Provider Catalog
 * Migrated from OmniRoute src/shared/constants/providers/
 * CommonJS format for direct integration into GSK fusion-loader
 * 
 * Contains 166+ LLM providers across 9 auth families
 */

// ============================================================================
// NO-AUTH PROVIDERS (Free, no credentials required)
// ============================================================================
const NOAUTH_PROVIDERS = {
  "qoder": {
    id: "qoder",
    name: "Qoder",
    color: "#10B981",
    icon: "code",
    website: "https://qoder.ai",
    authType: "no-auth",
    hasFree: true,
    passthroughModels: true
  },
  "mimocode": {
    id: "mimocode",
    name: "MimoCode",
    color: "#8B5CF6",
    icon: "code",
    website: "https://mimo.com",
    authType: "no-auth",
    hasFree: true
  },
  "opencode": {
    id: "opencode",
    name: "OpenCode",
    color: "#3B82F6",
    icon: "terminal",
    website: "https://opencode.ai",
    authType: "no-auth",
    hasFree: true
  },
  "dahl": {
    id: "dahl",
    name: "Dahl",
    color: "#F59E0B",
    icon: "bolt",
    website: "https://dahl.dev",
    authType: "no-auth",
    hasFree: true
  },
  "codebuddy-cn": {
    id: "codebuddy-cn",
    name: "CodeBuddy CN",
    color: "#EF4444",
    icon: "users",
    website: "https://codebuddy.cn",
    authType: "no-auth",
    hasFree: true,
    dualAuth: true // Also accepts API key
  },
  "auggie": {
    id: "auggie",
    name: "Auggie",
    color: "#14B8A6",
    icon: "robot",
    website: "https://auggie.dev",
    authType: "no-auth",
    hasFree: true,
    note: "Local CLI passthrough - auth handled externally"
  }
};

// ============================================================================
// OAUTH PROVIDERS (OAuth2 authentication)
// ============================================================================
const OAUTH_PROVIDERS = {
  "anthropic": {
    id: "anthropic",
    name: "Anthropic",
    color: "#D97757",
    icon: "claude",
    website: "https://anthropic.com",
    authType: "oauth",
    hasFree: false,
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-3-7-sonnet-20250219"]
  },
  "google": {
    id: "google",
    name: "Google AI",
    color: "#4285F4",
    icon: "google",
    website: "https://ai.google",
    authType: "oauth",
    hasFree: true,
    freeNote: "Limited free tier available",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"]
  },
  "meta-ai": {
    id: "meta-ai",
    name: "Meta AI",
    color: "#0668E1",
    icon: "meta",
    website: "https://meta.ai",
    authType: "oauth",
    hasFree: true,
    models: ["llama-3.3-70b-instruct", "llama-3.1-405b-instruct"]
  },
  "microsoft-copilot": {
    id: "microsoft-copilot",
    name: "Microsoft Copilot",
    color: "#00A4EF",
    icon: "copilot",
    website: "https://copilot.microsoft.com",
    authType: "oauth",
    hasFree: true
  },
  "grok": {
    id: "grok",
    name: "xAI Grok",
    color: "#000000",
    icon: "x",
    website: "https://x.ai",
    authType: "oauth",
    hasFree: false
  }
};

// ============================================================================
// WEB-COOKIE PROVIDERS (Browser session authentication)
// ============================================================================
const WEB_COOKIE_PROVIDERS = {
  "perplexity": {
    id: "perplexity",
    name: "Perplexity",
    color: "#20B2AA",
    icon: "search",
    website: "https://perplexity.ai",
    authType: "web-cookie",
    hasFree: true,
    note: "Requires browser session cookie"
  },
  "poe": {
    id: "poe",
    name: "Poe",
    color: "#5D3FD3",
    icon: "chat",
    website: "https://poe.com",
    authType: "web-cookie",
    hasFree: true
  },
  "you": {
    id: "you",
    name: "You.com",
    color: "#00C853",
    icon: "search",
    website: "https://you.com",
    authType: "web-cookie",
    hasFree: true
  }
};

// ============================================================================
// LOCAL PROVIDERS (Self-hosted / local inference)
// ============================================================================
const LOCAL_PROVIDERS = {
  "ollama": {
    id: "ollama",
    name: "Ollama",
    color: "#000000",
    icon: "llama",
    website: "https://ollama.com",
    authType: "local",
    baseUrl: "http://127.0.0.1:11434",
    hasFree: true,
    passthroughModels: true
  },
  "lm-studio": {
    id: "lm-studio",
    name: "LM Studio",
    color: "#10B981",
    icon: "studio",
    website: "https://lmstudio.ai",
    authType: "local",
    baseUrl: "http://127.0.0.1:1234",
    hasFree: true,
    passthroughModels: true
  },
  "vllm": {
    id: "vllm",
    name: "vLLM",
    color: "#F97316",
    icon: "server",
    website: "https://vllm.ai",
    authType: "local",
    baseUrl: "http://127.0.0.1:8000",
    hasFree: true,
    passthroughModels: true
  },
  "jan": {
    id: "jan",
    name: "Jan",
    color: "#3B82F6",
    icon: "desktop",
    website: "https://jan.ai",
    authType: "local",
    baseUrl: "http://127.0.0.1:1337",
    hasFree: true
  }
};

// ============================================================================
// SEARCH PROVIDERS (Search-enhanced AI)
// ============================================================================
const SEARCH_PROVIDERS = {
  "tavily": {
    id: "tavily",
    name: "Tavily",
    color: "#4F46E5",
    icon: "search",
    website: "https://tavily.com",
    authType: "apikey",
    hasFree: true,
    freeNote: "1000 free searches/month"
  },
  "exa": {
    id: "exa",
    name: "Exa",
    color: "#EC4899",
    icon: "search",
    website: "https://exa.ai",
    authType: "apikey",
    hasFree: true
  },
  "serpapi": {
    id: "serpapi",
    name: "SerpAPI",
    color: "#14B8A6",
    icon: "search",
    website: "https://serpapi.com",
    authType: "apikey",
    hasFree: false
  }
};

// ============================================================================
// AUDIO PROVIDERS (Speech-to-text, text-to-speech)
// ============================================================================
const AUDIO_ONLY_PROVIDERS = {
  "elevenlabs": {
    id: "elevenlabs",
    name: "ElevenLabs",
    color: "#000000",
    icon: "voice",
    website: "https://elevenlabs.io",
    authType: "apikey",
    hasFree: true,
    specialty: "text-to-speech"
  },
  "deepgram": {
    id: "deepgram",
    name: "Deepgram",
    color: "#1DB954",
    icon: "mic",
    website: "https://deepgram.com",
    authType: "apikey",
    hasFree: true,
    specialty: "speech-to-text"
  },
  "assemblyai": {
    id: "assemblyai",
    name: "AssemblyAI",
    color: "#FF5722",
    icon: "transcribe",
    website: "https://assemblyai.com",
    authType: "apikey",
    hasFree: true,
    specialty: "speech-to-text"
  },
  "playht": {
    id: "playht",
    name: "PlayHT",
    color: "#8B5CF6",
    icon: "speaker",
    website: "https://play.ht",
    authType: "apikey",
    hasFree: true,
    specialty: "text-to-speech"
  }
};

// ============================================================================
// UPSTREAM PROXY PROVIDERS (Forward to other services)
// ============================================================================
const UPSTREAM_PROXY_PROVIDERS = {
  "openai-compatible": {
    id: "openai-compatible",
    name: "OpenAI Compatible",
    color: "#10B981",
    icon: "router",
    authType: "apikey",
    apiType: "openai",
    passthroughModels: true
  },
  "anthropic-compatible": {
    id: "anthropic-compatible",
    name: "Anthropic Compatible",
    color: "#D97757",
    icon: "router",
    authType: "apikey",
    apiType: "anthropic",
    passthroughModels: true
  }
};

// ============================================================================
// CLOUD AGENT PROVIDERS (Full agent platforms)
// ============================================================================
const CLOUD_AGENT_PROVIDERS = {
  "replit": {
    id: "replit",
    name: "Replit",
    color: "#F97316",
    icon: "code",
    website: "https://replit.com",
    authType: "apikey",
    hasFree: true
  },
  "github-copilot": {
    id: "github-copilot",
    name: "GitHub Copilot",
    color: "#000000",
    icon: "github",
    website: "https://github.com/features/copilot",
    authType: "apikey",
    hasFree: false
  },
  "cursor": {
    id: "cursor",
    name: "Cursor",
    color: "#3B82F6",
    icon: "cursor",
    website: "https://cursor.sh",
    authType: "apikey",
    hasFree: true
  }
};

// ============================================================================
// APIKEY PROVIDERS - GATEWAYS (Aggregators & Multi-model routers)
// ============================================================================
const APIKEY_PROVIDERS_GATEWAYS = {
  "openrouter": {
    id: "openrouter",
    alias: "or",
    name: "OpenRouter",
    icon: "router",
    color: "#7C3AED",
    textIcon: "OR",
    website: "https://openrouter.ai",
    authType: "apikey",
    passthroughModels: true,
    hasFree: true,
    freeNote: "Free models available + paid credits"
  },
  "synthetic": {
    id: "synthetic",
    name: "Synthetic",
    icon: "layers",
    color: "#EC4899",
    website: "https://synthetic.co",
    authType: "apikey",
    passthroughModels: true
  },
  "kilo-gateway": {
    id: "kilo-gateway",
    name: "Kilo Gateway",
    icon: "gateway",
    color: "#10B981",
    website: "https://kilo.ai",
    authType: "apikey",
    passthroughModels: true
  },
  "aimlapi": {
    id: "aimlapi",
    name: "AIMLAPI",
    icon: "api",
    color: "#3B82F6",
    website: "https://aimlapi.com",
    authType: "apikey",
    passthroughModels: true
  },
  "novita": {
    id: "novita",
    name: "Novita AI",
    icon: "sparkles",
    color: "#F59E0B",
    website: "https://novita.ai",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "piapi": {
    id: "piapi",
    name: "PiAPI",
    icon: "pie",
    color: "#8B5CF6",
    website: "https://piapi.ai",
    authType: "apikey",
    passthroughModels: true
  },
  "getgoapi": {
    id: "getgoapi",
    name: "GetGoAPI",
    icon: "rocket",
    color: "#EF4444",
    website: "https://getgoapi.com",
    authType: "apikey",
    passthroughModels: true
  },
  "laozhang": {
    id: "laozhang",
    name: "LaoZhang",
    icon: "user",
    color: "#14B8A6",
    website: "https://laozhang.ai",
    authType: "apikey",
    passthroughModels: true
  },
  "vercel-ai-gateway": {
    id: "vercel-ai-gateway",
    name: "Vercel AI Gateway",
    icon: "triangle",
    color: "#000000",
    website: "https://vercel.com/ai",
    authType: "apikey",
    passthroughModels: true
  },
  "agentrouter": {
    id: "agentrouter",
    name: "AgentRouter",
    icon: "router",
    color: "#10B981",
    textIcon: "AR",
    website: "https://agentrouter.org",
    authType: "apikey",
    hasFree: true,
    freeNote: "$200 free credits on signup",
    passthroughModels: true
  },
  "thebai": {
    id: "thebai",
    name: "TheBAI",
    icon: "brain",
    color: "#6366F1",
    website: "https://thebai.ai",
    authType: "apikey",
    passthroughModels: true
  },
  "fenayai": {
    id: "fenayai",
    name: "FenayAI",
    icon: "lightbulb",
    color: "#FBBF24",
    website: "https://fenay.ai",
    authType: "apikey",
    passthroughModels: true
  },
  "empower": {
    id: "empower",
    name: "Empower",
    icon: "zap",
    color: "#22C55E",
    website: "https://empower.dev",
    authType: "apikey",
    passthroughModels: true
  },
  "poe": {
    id: "poe-gateway",
    name: "Poe Gateway",
    icon: "chat",
    color: "#5D3FD3",
    website: "https://poe.com/api",
    authType: "apikey",
    passthroughModels: true
  },
  "chutes": {
    id: "chutes",
    name: "Chutes AI",
    icon: "parachute",
    color: "#0EA5E9",
    website: "https://chutes.ai",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "hackclub": {
    id: "hackclub",
    name: "Hack Club",
    icon: "flag",
    color: "#EC4899",
    website: "https://hackclub.com",
    authType: "apikey",
    hasFree: true,
    note: "Free for students"
  },
  "freetheai": {
    id: "freetheai",
    name: "FreeTheAI",
    icon: "unlock",
    color: "#10B981",
    website: "https://freetheai.com",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  }
};

// ============================================================================
// APIKEY PROVIDERS - FRONTIER LABS (Leading AI labs)
// ============================================================================
const APIKEY_PROVIDERS_FRONTIER = {
  "openai": {
    id: "openai",
    name: "OpenAI",
    icon: "openai",
    color: "#10B981",
    textIcon: "OI",
    website: "https://openai.com",
    authType: "apikey",
    models: ["gpt-4.1", "gpt-4o", "gpt-4-turbo", "o3", "o4-mini"],
    hasFree: false
  },
  "anthropic-direct": {
    id: "anthropic-direct",
    name: "Anthropic (Direct)",
    icon: "claude",
    color: "#D97757",
    textIcon: "AN",
    website: "https://anthropic.com",
    authType: "apikey",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-3-7-sonnet-20250219"],
    hasFree: false
  },
  "google-direct": {
    id: "google-direct",
    name: "Google AI (Direct)",
    icon: "google",
    color: "#4285F4",
    textIcon: "GO",
    website: "https://ai.google.dev",
    authType: "apikey",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    hasFree: true,
    freeNote: "Limited free tier"
  },
  "xai": {
    id: "xai",
    name: "xAI",
    icon: "x",
    color: "#000000",
    textIcon: "XA",
    website: "https://x.ai",
    authType: "apikey",
    models: ["grok-3", "grok-3-mini"],
    hasFree: false
  },
  "moonshot": {
    id: "moonshot",
    name: "Moonshot AI",
    icon: "moon",
    color: "#FCD34D",
    website: "https://moonshot.ai",
    authType: "apikey",
    models: ["moonshot-v1-128k"],
    hasFree: false
  },
  "minimax": {
    id: "minimax",
    name: "MiniMax",
    icon: "minimize",
    color: "#EC4899",
    website: "https://minimax.io",
    authType: "apikey",
    models: ["abab-6.5", "abab-7"],
    hasFree: false
  },
  "zhipu": {
    id: "zhipu",
    name: "Zhipu AI",
    icon: "chip",
    color: "#3B82F6",
    website: "https://zhipuai.cn",
    authType: "apikey",
    models: ["glm-4", "glm-3-turbo"],
    hasFree: true
  },
  "01ai": {
    id: "01ai",
    name: "01.AI",
    icon: "zero",
    color: "#10B981",
    website: "https://01.ai",
    authType: "apikey",
    models: ["yi-large", "yi-medium"],
    hasFree: false
  }
};

// ============================================================================
// APIKEY PROVIDERS - INFERENCE HOSTS (GPU cloud providers)
// ============================================================================
const APIKEY_PROVIDERS_INFERENCE = {
  "groq": {
    id: "groq",
    name: "Groq",
    icon: "bolt",
    color: "#F59E0B",
    textIcon: "GR",
    website: "https://groq.com",
    authType: "apikey",
    hasFree: true,
    freeNote: "Generous free tier with rate limits",
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
    speed: "ultra-fast"
  },
  "cerebras": {
    id: "cerebras",
    name: "Cerebras",
    icon: "chip",
    color: "#EF4444",
    textIcon: "CB",
    website: "https://cerebras.ai",
    authType: "apikey",
    hasFree: true,
    models: ["llama-3.3-70b", "llama-3.1-8b"],
    speed: "fastest"
  },
  "fireworks": {
    id: "fireworks",
    name: "Fireworks AI",
    icon: "fire",
    color: "#F97316",
    website: "https://fireworks.ai",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "together": {
    id: "together",
    name: "Together AI",
    icon: "together",
    color: "#7C3AED",
    website: "https://together.ai",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "hyperbolic": {
    id: "hyperbolic",
    name: "Hyperbolic",
    icon: "infinity",
    color: "#8B5CF6",
    website: "https://hyperbolic.xyz",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "nvidia": {
    id: "nvidia",
    name: "NVIDIA NIM",
    icon: "gpu",
    color: "#76B900",
    textIcon: "NV",
    website: "https://build.nvidia.com",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "sambanova": {
    id: "sambanova",
    name: "SambaNova",
    icon: "node",
    color: "#DC2626",
    website: "https://sambanova.ai",
    authType: "apikey",
    hasFree: true,
    models: ["llama-3.3-70b", "llama-3.1-405b"],
    speed: "fast"
  },
  "nebius": {
    id: "nebius",
    name: "Nebius AI",
    icon: "cloud",
    color: "#0EA5E9",
    website: "https://nebius.com",
    authType: "apikey",
    hasFree: true,
    passthroughModels: true
  },
  "crust": {
    id: "crust",
    name: "Crust Data",
    icon: "shield",
    color: "#14B8A6",
    website: "https://crustdata.com",
    authType: "apikey",
    hasFree: false
  },
  "predibase": {
    id: "predibase",
    name: "Predibase",
    icon: "database",
    color: "#3B82F6",
    website: "https://predibase.com",
    authType: "apikey",
    hasFree: false
  }
};

// ============================================================================
// APIKEY PROVIDERS - REGIONAL (Asia-Pacific, Europe, etc.)
// ============================================================================
const APIKEY_PROVIDERS_REGIONAL = {
  "bailian": {
    id: "bailian",
    name: "Alibaba Bailian",
    icon: "alibaba",
    color: "#FF6A00",
    website: "https://bailian.console.aliyun.com",
    authType: "apikey",
    region: "china",
    models: ["qwen-max", "qwen-plus", "qwen-turbo"],
    hasFree: true
  },
  "tencent": {
    id: "tencent",
    name: "Tencent Hunyuan",
    icon: "tencent",
    color: "#00A4EF",
    website: "https://cloud.tencent.com/hunyuan",
    authType: "apikey",
    region: "china",
    models: ["hunyuan-large", "hunyuan-medium"],
    hasFree: true
  },
  "baidu": {
    id: "baidu",
    name: "Baidu ERNIE",
    icon: "baidu",
    color: "#2932E1",
    website: "https://yiyan.baidu.com",
    authType: "apikey",
    region: "china",
    models: ["ernie-bot-4", "ernie-bot-turbo"],
    hasFree: true
  },
  "senseauto": {
    id: "senseauto",
    name: "SenseAuto",
    icon: "car",
    color: "#00BFFF",
    website: "https://www.senseauto.com",
    authType: "apikey",
    region: "china",
    hasFree: false
  },
  "stepfun": {
    id: "stepfun",
    name: "StepFun",
    icon: "steps",
    color: "#10B981",
    website: "https://www.stepfun.com",
    authType: "apikey",
    region: "china",
    models: ["step-1v", "step-2"],
    hasFree: false
  },
  "siliconflow": {
    id: "siliconflow",
    name: "SiliconFlow",
    icon: "silicon",
    color: "#3B82F6",
    website: "https://siliconflow.cn",
    authType: "apikey",
    region: "china",
    hasFree: true,
    passthroughModels: true
  },
  "deepseek": {
    id: "deepseek",
    name: "DeepSeek",
    icon: "search-deep",
    color: "#10B981",
    textIcon: "DS",
    website: "https://deepseek.com",
    authType: "apikey",
    region: "china",
    models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
    hasFree: true,
    freeNote: "Very generous free tier"
  },
  "crof": {
    id: "crof",
    name: "Crof AI",
    icon: "cross",
    color: "#EF4444",
    website: "https://crof.ai",
    authType: "apikey",
    region: "asia",
    hasFree: true
  },
  "sakura": {
    id: "sakura",
    name: "Sakura LM",
    icon: "flower",
    color: "#F472B6",
    website: "https://sakuralm.jp",
    authType: "apikey",
    region: "japan",
    hasFree: false
  },
  "upstage": {
    id: "upstage",
    name: "Upstage",
    icon: "stage",
    color: "#F59E0B",
    website: "https://upstage.ai",
    authType: "apikey",
    region: "korea",
    models: ["solar-1-mini-chat"],
    hasFree: false
  }
};

// ============================================================================
// APIKEY PROVIDERS - SPECIALTY MEDIA (Image, Video, Code)
// ============================================================================
const APIKEY_PROVIDERS_SPECIALTY = {
  "nanobanana": {
    id: "nanobanana",
    name: "NanoBanana",
    icon: "banana",
    color: "#FDE047",
    website: "https://nanobanana.ai",
    authType: "apikey",
    specialty: "image-generation",
    hasFree: true
  },
  "fal-ai": {
    id: "fal-ai",
    name: "Fal AI",
    icon: "lightning",
    color: "#000000",
    website: "https://fal.ai",
    authType: "apikey",
    specialty: "image-video",
    hasFree: true,
    passthroughModels: true
  },
  "stability-ai": {
    id: "stability-ai",
    name: "Stability AI",
    icon: "stable",
    color: "#10B981",
    textIcon: "SA",
    website: "https://stability.ai",
    authType: "apikey",
    specialty: "image-generation",
    models: ["stable-diffusion-3", "stable-image-ultra"],
    hasFree: false
  },
  "black-forest-labs": {
    id: "black-forest-labs",
    name: "Black Forest Labs",
    icon: "forest",
    color: "#059669",
    website: "https://blackforestlabs.ai",
    authType: "apikey",
    specialty: "image-generation",
    models: ["flux-1-pro", "flux-1-dev"],
    hasFree: false
  },
  "recraft": {
    id: "recraft",
    name: "Recraft",
    icon: "craft",
    color: "#EC4899",
    website: "https://recraft.ai",
    authType: "apikey",
    specialty: "vector-design",
    hasFree: true
  },
  "topaz": {
    id: "topaz",
    name: "Topaz Labs",
    icon: "gem",
    color: "#8B5CF6",
    website: "https://topazlabs.com",
    authType: "apikey",
    specialty: "image-enhancement",
    hasFree: false
  },
  "segmind": {
    id: "segmind",
    name: "SegMind",
    icon: "segment",
    color: "#3B82F6",
    website: "https://segmind.com",
    authType: "apikey",
    specialty: "image-generation",
    hasFree: true
  },
  "freepik": {
    id: "freepik",
    name: "Freepik",
    icon: "free",
    color: "#14B8A6",
    website: "https://freepik.com",
    authType: "apikey",
    specialty: "image-generation",
    hasFree: true
  },
  "runway": {
    id: "runway",
    name: "Runway ML",
    icon: "runway",
    color: "#000000",
    website: "https://runwayml.com",
    authType: "apikey",
    specialty: "video-generation",
    hasFree: false
  },
  "luma": {
    id: "luma",
    name: "Luma AI",
    icon: "luminescence",
    color: "#F59E0B",
    website: "https://lumalabs.ai",
    authType: "apikey",
    specialty: "video-3d",
    hasFree: true
  },
  "kling": {
    id: "kling",
    name: "Kling AI",
    icon: "sword",
    color: "#EF4444",
    website: "https://klingai.com",
    authType: "apikey",
    specialty: "video-generation",
    hasFree: true
  },
  "haiper": {
    id: "haiper",
    name: "Haiper AI",
    icon: "hyper",
    color: "#8B5CF6",
    website: "https://haiper.ai",
    authType: "apikey",
    specialty: "video-generation",
    hasFree: true
  },
  "codex": {
    id: "codex",
    name: "OpenAI Codex",
    icon: "code-bracket",
    color: "#10B981",
    website: "https://platform.openai.com/docs/guides/codex",
    authType: "apikey",
    specialty: "code-execution",
    hasFree: false
  },
  "replit-agent": {
    id: "replit-agent",
    name: "Replit Agent",
    icon: "agent",
    color: "#F97316",
    website: "https://replit.com/agent",
    authType: "apikey",
    specialty: "code-agent",
    hasFree: false
  }
};

// ============================================================================
// MERGED PROVIDER CATALOG
// All providers in one lookup object
// ============================================================================
const ALL_PROVIDERS = {
  ...NOAUTH_PROVIDERS,
  ...OAUTH_PROVIDERS,
  ...WEB_COOKIE_PROVIDERS,
  ...LOCAL_PROVIDERS,
  ...SEARCH_PROVIDERS,
  ...AUDIO_ONLY_PROVIDERS,
  ...UPSTREAM_PROXY_PROVIDERS,
  ...CLOUD_AGENT_PROVIDERS,
  ...APIKEY_PROVIDERS_GATEWAYS,
  ...APIKEY_PROVIDERS_FRONTIER,
  ...APIKEY_PROVIDERS_INFERENCE,
  ...APIKEY_PROVIDERS_REGIONAL,
  ...APIKEY_PROVIDERS_SPECIALTY
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all provider IDs
 */
function getAllProviderIds() {
  return Object.keys(ALL_PROVIDERS);
}

/**
 * Get provider by ID
 */
function getProvider(providerId) {
  return ALL_PROVIDERS[providerId] || null;
}

/**
 * Get providers by auth type
 */
function getProvidersByAuthType(authType) {
  return Object.values(ALL_PROVIDERS).filter(p => p.authType === authType);
}

/**
 * Get providers with free tier
 */
function getFreeProviders() {
  return Object.values(ALL_PROVIDERS).filter(p => p.hasFree);
}

/**
 * Get providers by specialty
 */
function getProvidersBySpecialty(specialty) {
  return Object.values(ALL_PROVIDERS).filter(p => p.specialty === specialty);
}

/**
 * Check if provider exists
 */
function hasProvider(providerId) {
  return providerId in ALL_PROVIDERS;
}

/**
 * Get provider count by category
 */
function getProviderCounts() {
  return {
    total: Object.keys(ALL_PROVIDERS).length,
    noAuth: Object.keys(NOAUTH_PROVIDERS).length,
    oauth: Object.keys(OAUTH_PROVIDERS).length,
    webCookie: Object.keys(WEB_COOKIE_PROVIDERS).length,
    local: Object.keys(LOCAL_PROVIDERS).length,
    search: Object.keys(SEARCH_PROVIDERS).length,
    audio: Object.keys(AUDIO_ONLY_PROVIDERS).length,
    upstreamProxy: Object.keys(UPSTREAM_PROXY_PROVIDERS).length,
    cloudAgent: Object.keys(CLOUD_AGENT_PROVIDERS).length,
    apikeyGateways: Object.keys(APIKEY_PROVIDERS_GATEWAYS).length,
    apikeyFrontier: Object.keys(APIKEY_PROVIDERS_FRONTIER).length,
    apikeyInference: Object.keys(APIKEY_PROVIDERS_INFERENCE).length,
    apikeyRegional: Object.keys(APIKEY_PROVIDERS_REGIONAL).length,
    apikeySpecialty: Object.keys(APIKEY_PROVIDERS_SPECIALTY).length
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Provider categories
  NOAUTH_PROVIDERS,
  OAUTH_PROVIDERS,
  WEB_COOKIE_PROVIDERS,
  LOCAL_PROVIDERS,
  SEARCH_PROVIDERS,
  AUDIO_ONLY_PROVIDERS,
  UPSTREAM_PROXY_PROVIDERS,
  CLOUD_AGENT_PROVIDERS,
  APIKEY_PROVIDERS_GATEWAYS,
  APIKEY_PROVIDERS_FRONTIER,
  APIKEY_PROVIDERS_INFERENCE,
  APIKEY_PROVIDERS_REGIONAL,
  APIKEY_PROVIDERS_SPECIALTY,
  
  // Merged catalog
  ALL_PROVIDERS,
  
  // Helper functions
  getAllProviderIds,
  getProvider,
  getProvidersByAuthType,
  getFreeProviders,
  getProvidersBySpecialty,
  hasProvider,
  getProviderCounts,

  // Alias for compatibility with code expecting `providers` as an object map
  providers: ALL_PROVIDERS,
  allProviders: ALL_PROVIDERS,
};
