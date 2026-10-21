use crossbeam_channel::{unbounded, Sender, Receiver};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub enum WorldEvent {
    Stimulus {
        target_name: String,
        description: String,
        emotional_impact: (String, f32),
    },
    SoulAction {
        source_name: String,
        action: String,
    },
    SoulSpeech {
        source_name: String,
        content: String,
    },
    SoulPurchased {
        buyer: String,
        soul_template: String,
        price: f32,
    },
}

#[derive(Clone)]
pub struct EventBus {
    tx: Sender<WorldEvent>,
    rx: Arc<Mutex<Receiver<WorldEvent>>>,
}

impl EventBus {
    pub fn new() -> Self {
        let (tx, rx) = unbounded();
        EventBus {
            tx,
            rx: Arc::new(Mutex::new(rx)),
        }
    }

    pub fn send(&self, event: WorldEvent) {
        let _ = self.tx.send(event);
    }

    pub fn receiver(&self) -> Arc<Mutex<Receiver<WorldEvent>>> {
        Arc::clone(&self.rx)
    }
}
