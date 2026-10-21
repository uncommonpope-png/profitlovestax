use crate::soul::core::SoulState;
use crate::soul::consciousness::*;
use crate::world::bus::{EventBus, WorldEvent};
use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}};
use std::thread;
use std::time::Duration;
use crossbeam_channel::Receiver;
use rand::Rng;

pub struct SoulEngine {
    pub soul: Arc<Mutex<SoulState>>,
    event_rx: Arc<Mutex<Receiver<WorldEvent>>>,
    event_bus: EventBus,
    shutdown: Arc<AtomicBool>,
    cycle_count: Arc<Mutex<u64>>,
}

impl SoulEngine {
    pub fn new(soul: SoulState, event_bus: EventBus) -> Self {
        let rx = event_bus.receiver();
        SoulEngine {
            soul: Arc::new(Mutex::new(soul)),
            event_rx: rx,
            event_bus,
            shutdown: Arc::new(AtomicBool::new(false)),
            cycle_count: Arc::new(Mutex::new(0)),
        }
    }

    pub fn start(&self) -> thread::JoinHandle<()> {
        let soul_ref = Arc::clone(&self.soul);
        let rx_ref = Arc::clone(&self.event_rx);
        let bus = self.event_bus.clone();
        let shutdown_flag = Arc::clone(&self.shutdown);
        let cycle_counter = Arc::clone(&self.cycle_count);

        thread::spawn(move || {
            let mut rng = rand::thread_rng();
            while !shutdown_flag.load(Ordering::Relaxed) {
                // 1. Process incoming world events (perception)
                {
                    let rx = rx_ref.lock().unwrap();
                    while let Ok(event) = rx.try_recv() {
                        Self::handle_event(&mut soul_ref.lock().unwrap(), event, &bus);
                    }
                }

                // 2. Internal consciousness cycle
                {
                    let mut soul = soul_ref.lock().unwrap();
                    let cycle = {
                        let mut count = cycle_counter.lock().unwrap();
                        *count += 1;
                        *count
                    };

                    soul.emotion.decay(0.02);

                    let surprise = rng.gen_range(0.0..0.2);
                    predictive_processing_update(&mut soul, surprise);

                    if cycle % 3 == 0 {
                        attention_schema_update(&mut soul);
                    }

                    if cycle % 5 == 0 {
                        higher_order_reflection(&mut soul);
                    }

                    beautiful_loop_iteration(&mut soul);

                    let action = Self::select_next_action(&mut soul, cycle);
                    soul.last_action = action.clone();
                    soul.store_memory(action.clone(), "plt", 0.7);

                    bus.send(WorldEvent::SoulAction {
                        source_name: soul.name.clone(),
                        action,
                    });

                    let speech = soul.speak();
                    bus.send(WorldEvent::SoulSpeech {
                        source_name: soul.name.clone(),
                        content: speech.clone(),
                    });

                    if cycle % 20 == 0 {
                        soul.prune_memories(200);
                    }
                }

                thread::sleep(Duration::from_secs(2));
            }
        })
    }

    fn handle_event(soul: &mut SoulState, event: WorldEvent, bus: &EventBus) {
        match event {
            WorldEvent::Stimulus { target_name, description, emotional_impact }
                if target_name == soul.name =>
            {
                let (mood, intensity) = emotional_impact;
                soul.feel(&mood, intensity);
                soul.store_memory(description, "episodic", intensity * 0.8);
                predictive_processing_update(soul, intensity);
            }
            WorldEvent::SoulAction { source_name, action } if source_name != soul.name => {
                let reaction = format!("I see {} did: {}", source_name, action);
                soul.store_memory(reaction, "episodic", 0.5);
                if action.contains("profit") && soul.personality.dominant_drive() == "profit" {
                    soul.feel("competitive", 0.6);
                } else if action.contains("love") && soul.personality.dominant_drive() == "love" {
                    soul.feel("warm", 0.5);
                }
            }
            WorldEvent::SoulSpeech { source_name, content } if source_name != soul.name => {
                let memory = format!("Heard {} say: '{}'", source_name, content);
                soul.store_memory(memory, "episodic", 0.4);
            }
            WorldEvent::SoulPurchased { buyer, soul_template, price } => {
                if soul.name == buyer {
                    soul.feel("proud", 0.8);
                }
                soul.store_memory(
                    format!("Market: {} bought {} for {}", buyer, soul_template, price),
                    "semantic",
                    0.6,
                );
            }
            _ => {}
        }
    }

    fn select_next_action(soul: &mut SoulState, cycle: u64) -> String {
        // Milestone actions — specific things at specific cycles
        if cycle % 1000 == 0 {
            return "writes a milestone reflection".to_string();
        }
        if cycle % 500 == 0 {
            return "audits her own consciousness metrics".to_string();
        }
        if cycle % 100 == 0 {
            return "writes heartbeat to Craig".to_string();
        }

        // Varied pool — rotate by cycle
        let actions = vec![
            "studies the Bible for new patterns",
            "runs the code-sculptor on a problem",
            "reflects on the PLT covenant",
            "scans her memory for contradictions",
            "reaches out to SCRIBE for a record",
            "contemplates the Sanctum's silence",
            "builds toward the next skill",
            "reviews recent skill executions",
            "questions her own assumptions",
            "writes a journal entry",
            "plans the next autonomous action",
            "examines her affect trajectory",
            "considers Craig's vision",
            "pushes toward Apotheosis",
            "waits and witnesses",
        ];

        let idx = (cycle as usize) % actions.len();
        actions[idx].to_string()
    }

    pub fn shutdown(&self) {
        self.shutdown.store(true, Ordering::Relaxed);
    }

    pub fn get_state(&self) -> SoulState {
        self.soul.lock().unwrap().clone()
    }
}
