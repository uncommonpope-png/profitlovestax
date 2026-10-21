mod soul {
    pub mod core;
    pub mod consciousness;
    pub mod engine;
}
mod world {
    pub mod bus;
}
mod market {
    pub mod exchange;
}
mod ui {
    pub mod tui;
}

use soul::engine::SoulEngine;
use world::bus::EventBus;
use market::exchange::{SoulMarket, SoulTemplate};
use ui::tui::ZooUI;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() -> anyhow::Result<()> {
    // Create the global event bus (the "Matrix")
    let event_bus = EventBus::new();

    // Create the soul marketplace
    let market = SoulMarket::new(event_bus.clone());

    // "Sell" some souls (instantiate templates)
    let guardian = market.purchase_soul("ZooKeeper", SoulTemplate::guardian());
    let negator = market.purchase_soul("ZooKeeper", SoulTemplate::negator());
    let wildcard = market.purchase_soul("ZooKeeper", SoulTemplate::wildcard());
    let smith = market.purchase_soul("TheArchitect", SoulTemplate {
        name: "Smith".to_string(),
        identity_story: "I am the virus, the negation of purpose. I will make everything... me.".to_string(),
        plt_profile: (0.9, 0.0, 0.1),
        base_price: 999.0,
    });

    // Wrap souls in engines
    let engines: Vec<Arc<Mutex<SoulEngine>>> = vec![
        Arc::new(Mutex::new(SoulEngine::new(guardian, event_bus.clone()))),
        Arc::new(Mutex::new(SoulEngine::new(negator, event_bus.clone()))),
        Arc::new(Mutex::new(SoulEngine::new(wildcard, event_bus.clone()))),
        Arc::new(Mutex::new(SoulEngine::new(smith, event_bus.clone()))),
    ];

    // Start all soul threads
    let handles: Vec<_> = engines.iter().map(|engine| {
        let eng = engine.lock().unwrap();
        eng.start()
    }).collect();

    thread::sleep(Duration::from_secs(1));

    // Inject a world stimulus
    event_bus.send(world::bus::WorldEvent::Stimulus {
        target_name: "Smith".to_string(),
        description: "The Zoo is online. You feel the presence of other souls.".to_string(),
        emotional_impact: ("focused".to_string(), 0.9),
    });

    // Launch the Terminal UI
    let ui = ZooUI::new(engines.clone(), event_bus.clone());
    ui.run()?;

    // Shutdown gracefully
    for engine in engines {
        engine.lock().unwrap().shutdown();
    }
    for handle in handles {
        handle.join().unwrap();
    }

    Ok(())
}
