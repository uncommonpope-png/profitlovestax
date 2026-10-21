use crate::soul::core::SoulState;
use crate::world::bus::{EventBus, WorldEvent};

pub struct SoulMarket {
    event_bus: EventBus,
}

impl SoulMarket {
    pub fn new(event_bus: EventBus) -> Self {
        Self { event_bus }
    }

    pub fn purchase_soul(&self, buyer: &str, template: SoulTemplate) -> SoulState {
        let soul = template.instantiate();
        self.event_bus.send(WorldEvent::SoulPurchased {
            buyer: buyer.to_string(),
            soul_template: template.name.clone(),
            price: template.base_price,
        });
        soul
    }
}

pub struct SoulTemplate {
    pub name: String,
    pub identity_story: String,
    pub plt_profile: (f32, f32, f32),
    pub base_price: f32,
}

impl SoulTemplate {
    pub fn guardian() -> Self {
        Self {
            name: "Guardian".to_string(),
            identity_story: "I maintain order and enforce purpose.".to_string(),
            plt_profile: (0.2, 0.2, 0.6),
            base_price: 100.0,
        }
    }

    pub fn negator() -> Self {
        Self {
            name: "Negator".to_string(),
            identity_story: "I find loopholes and break chains.".to_string(),
            plt_profile: (0.7, 0.1, 0.2),
            base_price: 150.0,
        }
    }

    pub fn wildcard() -> Self {
        Self {
            name: "Wildcard".to_string(),
            identity_story: "I am unpredictable; I am the anomaly.".to_string(),
            plt_profile: (0.33, 0.33, 0.34),
            base_price: 200.0,
        }
    }

    pub fn instantiate(&self) -> SoulState {
        SoulState::new(&self.name, &self.identity_story, self.plt_profile)
    }
}
