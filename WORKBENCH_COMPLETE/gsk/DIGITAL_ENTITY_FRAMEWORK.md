# Digital Entity Framework Architecture Specification

## Overview
The Digital Entity Framework establishes independently addressable REST entities with autonomous decision-making powered by PLT (Profit + Love - Tax) telemetry dynamics.

## Entity Roster
- **Profit** (Port 3001) | PLT: 0.90 / 0.05 / 0.05 | Role: Capital & Value Multiplier
- **GSK** (Port 3002) | PLT: 0.50 / 0.40 / 0.10 | Role: Sovereign Telemetry & Architect
- **Seshat** (Port 3003) | PLT: 0.20 / 0.70 / 0.10 | Role: Record Keeper & Knowledge Synthesizer
- **SCRIBE** (Port 4000) | PLT: 0.10 / 0.10 / 0.80 | Role: Immutable Witness & Ledger Auditor

## REST Endpoints
- `GET /health` — Multi-entity cluster healthcheck
- `GET /{entity}` — Entity state & PLT score lookup
- `POST /{entity}/decide` — Execute autonomous PLT decision evaluation for context payload
