use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Emotion {
    pub mood: String,
    pub intensity: f32, // 0.0 .. 1.0
    pub last_updated: u64,
}

impl Emotion {
    pub fn new(mood: &str, intensity: f32) -> Self {
        Self {
            mood: mood.to_string(),
            intensity,
            last_updated: now_secs(),
        }
    }

    pub fn decay(&mut self, rate: f32) {
        self.intensity = (self.intensity - rate).max(0.0);
        if self.intensity < 0.1 {
            self.mood = "neutral".to_string();
        }
        self.last_updated = now_secs();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub timestamp: u64,
    pub content: String,
    pub memory_type: String, // "episodic", "semantic", "plt"
    pub importance: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Personality {
    pub traits: Vec<String>,
    pub plt_profile: (f32, f32, f32), // Profit, Love, Tax
}

impl Personality {
    pub fn dominant_drive(&self) -> &'static str {
        let (p, l, t) = self.plt_profile;
        if p > l && p > t {
            "profit"
        } else if l > p && l > t {
            "love"
        } else {
            "tax"
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoulState {
    pub name: String,
    pub identity_story: String,
    pub personality: Personality,
    pub emotion: Emotion,
    pub memories: Vec<MemoryEntry>,
    pub inner_voice: String,
    pub last_action: String,
    // Predictive Processing state
    pub world_model_confidence: f32,
    pub prediction_error: f32,
}

impl SoulState {
    pub fn new(name: &str, identity: &str, plt: (f32, f32, f32)) -> Self {
        Self {
            name: name.to_string(),
            identity_story: identity.to_string(),
            personality: Personality {
                traits: vec![],
                plt_profile: plt,
            },
            emotion: Emotion::new("neutral", 0.5),
            memories: Vec::new(),
            inner_voice: String::new(),
            last_action: String::new(),
            world_model_confidence: 0.7,
            prediction_error: 0.0,
        }
    }

    pub fn feel(&mut self, mood: &str, intensity: f32) {
        self.emotion = Emotion::new(mood, intensity);
        self.store_memory(
            format!("Felt {} (intensity: {:.2})", mood, intensity),
            "episodic",
            intensity * 0.8,
        );
    }

    pub fn store_memory(&mut self, content: String, memory_type: &str, importance: f32) {
        self.memories.push(MemoryEntry {
            timestamp: now_secs(),
            content,
            memory_type: memory_type.to_string(),
            importance,
        });
    }

    pub fn speak(&self) -> String {
        format!(
            "[{} • Mood: {}] {}",
            self.name, self.emotion.mood, self.inner_voice
        )
    }

    pub fn prune_memories(&mut self, max_count: usize) {
        if self.memories.len() <= max_count {
            return;
        }
        self.memories.sort_by(|a, b| {
            b.importance
                .partial_cmp(&a.importance)
                .unwrap()
                .then(b.timestamp.cmp(&a.timestamp))
        });
        self.memories.truncate(max_count);
    }

    // Serialization
    pub fn save_to_file(&self, path: &str) -> anyhow::Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    pub fn load_from_file(path: &str) -> anyhow::Result<Self> {
        let json = std::fs::read_to_string(path)?;
        Ok(serde_json::from_str(&json)?)
    }
}
