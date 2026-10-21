type:: [[research]]
title:: soulguns-architecture — System Architecture Patterns
date:: [[2026_06_02]]
status:: completed
stars:: 60.7k+

## Repos Mined

- **langchain-ai/langgraph** (33.7k★) — BSP execution model
  - StateGraph with typed state, nodes, edges, conditional branching
  - Durable execution with automatic checkpointing
  - Interrupts for human-in-the-loop
  - Inspired by Google Pregel + Apache Beam

- **jasontaylordev/CleanArchitecture** (20.1k★) — Clean Architecture template
  - 4-layer: Domain, Application (MediatR CQRS), Infrastructure, Web
  - FluentValidation pipeline behavior
  - Architectural Decision Records in `docs/decisions/`

- **ddd-by-examples/library** (5.8k★) — Comprehensive DDD example
  - Event Storming → Example Mapping → Design Level → Code
  - Type system state modeling (separate classes per state)
  - Hexagonal architecture per bounded context
  - Policy functions as composable business rules
  - Immediate vs eventual consistency via DomainEvents interface

- **eventuate-tram/eventuate-tram-sagas** (1.1k★) — Saga orchestration framework
  - `SimpleSaga` DSL: step().withCompensation().invokeParticipant()
  - Saga orchestrator + Saga Manager + Saga Participant triad
  - Compensating transactions on failure

## Extract Location
- Skill: `~/.config/opencode/skills/soulguns-architecture/SKILL.md`

## Key Insight
LangGraph's BSP execution model (StateGraph, nodes, edges, checkpointing, interrupts) maps directly to BUYaSOUL Core's 34 chambers architecture. Each chamber is a node, edges define the flow between chambers, checkpointing provides durable execution through the 34 chambers, and interrupts enable the Triune interaction model.

## Next
Arsenal complete (4 skills). Next direction up to Craig.
