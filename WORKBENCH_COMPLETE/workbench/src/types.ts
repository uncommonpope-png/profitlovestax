export interface AgentProfile {
  name: string;
  avatarSeed: string; // Used to display consistent visual representations or icons
  avatarColor: string; // Hex color for the theme color
  personality: string;
  behavior: string;
  autonomy: number; // Sliders: 0-100%
  temperature: number; // Bias towards Speed vs. Creativity: 0.1 - 1.0
  thinking: "balanced" | "fast" | "precise";
  avatarUrl?: string; // High-fidelity generated image URL
  // 3D Avatar Customization specs:
  clothingStyle?: "tactical_suit" | "neo_duster" | "cyberpunk_harness" | "hoodie";
  clothingColor?: string;
  hairStyle?: "cyber_spike" | "neon_mohawk" | "sleek_bob" | "synth_waves" | "bald";
  hairColor?: string;
  equippedWeapon?: "glowing_katanas" | "plasma_rifle" | "cyber_deck" | "none";
  weaponColor?: string;
}

export interface ProviderConfig {
  provider: "gemini" | "openai" | "anthropic" | "ollama" | "custom" | "bedrock" | "omniroute";
  model: string;
  apiKey: string;
  baseUrl: string;
  customHeaders?: string;
}

export interface ContextSource {
  id: string;
  name: string;
  type: "document" | "url" | "instruction";
  content: string;
  active: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  transport: "sse" | "stdio";
  description: string;
  methods: string[]; // List of available tool names exported by the MCP
  active: boolean;
}

export interface SkillParameter {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
  value: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: "core" | "integration" | "utility";
  parameters: Record<string, string>; // Maps param keys to current values
  paramDefinitions: SkillParameter[]; // Array for rendering fields in the builder UI
  unlocked: boolean; // For game-like progression toggle
  costCode: string; // Small technical description
  isCustom?: boolean; // Flag to designate user-authored custom skills
  dependencies?: string[]; // IDs of other skills required to be active
}

export interface SimulatedLog {
  id: string;
  timestamp: string;
  skillId?: string;
  title: string;
  details: string;
  type: "info" | "trigger" | "success" | "warning" | "error";
}

export interface Message {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: string;
  logs?: SimulatedLog[];
  groundingSources?: { uri: string; title: string }[];
}

export interface MarketplaceTransaction {
  id: string;
  type: "purchase" | "sale" | "mining" | "listing";
  title: string;
  amount: number;
  timestamp: string;
}


