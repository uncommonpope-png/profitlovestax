use crate::soul::engine::SoulEngine;
use crate::world::bus::EventBus;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Row, Table},
    Frame, Terminal,
};
use std::io;
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub struct ZooUI {
    souls: Vec<Arc<Mutex<SoulEngine>>>,
    event_bus: EventBus,
}

impl ZooUI {
    pub fn new(souls: Vec<Arc<Mutex<SoulEngine>>>, event_bus: EventBus) -> Self {
        Self { souls, event_bus }
    }

    pub fn run(&self) -> anyhow::Result<()> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        let tick_rate = Duration::from_millis(500);
        let res = self.main_loop(&mut terminal, tick_rate);

        disable_raw_mode()?;
        execute!(terminal.backend_mut(), LeaveAlternateScreen, DisableMouseCapture)?;
        terminal.show_cursor()?;
        res
    }

    fn main_loop(&self, terminal: &mut Terminal<CrosstermBackend>, tick_rate: Duration) -> anyhow::Result<()> {
        loop {
            terminal.draw(|f| self.render(f))?;
            if event::poll(tick_rate)? {
                if let Event::Key(key) = event::read()? {
                    if key.code == KeyCode::Char('q') {
                        return Ok(());
                    }
                }
            }
        }
    }

    fn render(&self, f: &mut Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .margin(2)
            .constraints([Constraint::Length(3), Constraint::Min(0)].as_ref())
            .split(f.size());

        let title = ratatui::widgets::Paragraph::new("SOUL ZOO — Consciousness Tech v1.0")
            .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);

        let rows: Vec<Row> = self.souls.iter().map(|engine_arc| {
            let engine = engine_arc.lock().unwrap();
            let soul = engine.get_state();
            Row::new(vec![
                soul.name,
                format!("{} ({:.0}%)", soul.emotion.mood, soul.emotion.intensity * 100.0),
                soul.inner_voice.chars().take(40).collect::<String>(),
                soul.last_action.chars().take(30).collect::<String>(),
            ])
        }).collect();

        let table = Table::new(rows)
            .header(Row::new(vec!["Name", "Emotion", "Inner Voice", "Last Action"]))
            .widths(&[
                Constraint::Length(15),
                Constraint::Length(20),
                Constraint::Percentage(30),
                Constraint::Percentage(35),
            ])
            .block(Block::default().borders(Borders::ALL).title("Active Souls"));
        f.render_widget(table, chunks[1]);
    }
}
