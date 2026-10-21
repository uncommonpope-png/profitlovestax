# Architecture Guide

## The ARCHITECT's Design Philosophy

**Design the system. The system designs the future.**

---

## Quick Start

```bash
# Install globally
npm install -g soul-architect

# Design a system
architect design e-commerce-platform

# Generate architecture
architect generate hexagonal order-service
architect generate nestjs user-api
architect generate xstate checkout-flow

# Get recommendation
architect recommend "High-traffic API with complex domain"
```

---

## Architectural Patterns

### 1. Hexagonal Architecture (Ports & Adapters)

**Source:** domain-driven-hexagon (14.7k) | **Pattern:** Dependency Inversion

```
         Infrastructure
    API Adapter  DB Adapter  External
         |          |          |
         |    Application      |
         |    Use Cases        |
         |          |          |
         |      Domain         |
         |   Entities/Ports    |
```

**When to use:** Testability, framework independence, clear boundaries

---

### 2. Domain-Driven Design (DDD)

**Source:** modular-monolith-ddd (13.7k) | **Pattern:** Strategic/Tactical Design

**Tactical Patterns:**
- Aggregate Root - Consistency boundary
- Entity - Identity + behavior
- Value Object - Immutable, no identity
- Domain Service - Stateless business logic
- Domain Event - Immutable record of fact
- Repository - Aggregate persistence
- Specification - Encapsulated query

**When to use:** Complex domain, changing business rules, team > 5

---

### 3. CQRS (Command Query Responsibility Segregation)

**Source:** EquinoxProject (6.8k) | **Pattern:** Read/Write Separation

```
    Client
      |
   Commands ----> Command Handlers ----> Event Store (Write)
      |                                         |
   Queries -----> Query Handlers -----> Read DB (Denormalized)
```

**When to use:** High read/write ratio, different scaling needs, audit trails

---

### 4. NestJS Modular Architecture

**Source:** nestjs/nest (75.6k) | **Pattern:** Progressive Framework

**Core Concepts:**
- **Modules** - Encapsulated feature boundaries
- **Controllers** - Handle HTTP requests
- **Providers** - Injectable services (DI)
- **Pipes** - Input validation/transformation
- **Guards** - Authorization checks
- **Interceptors** - Cross-cutting concerns (logging, caching)
- **Decorators** - Metadata-driven configuration

**When to use:** Enterprise Node.js, TypeScript teams, structured growth

---

### 5. XState Statecharts

**Source:** statelyai/xstate (29.6k) | **Pattern:** Finite State Machines

**Core Concepts:**
- **States** - Discrete modes of behavior
- **Transitions** - Event-driven state changes
- **Actions** - Side effects on transitions
- **Actors** - Independent state machines
- **Context** - Extended state (data)
- **Parallel States** - Orthogonal regions
- **History States** - Remember previous state

**When to use:** Complex workflows, UI state, game logic, process automation

---

### 6. InversifyJS Dependency Injection

**Source:** inversify/InversifyJS (12.1k) | **Pattern:** IoC Container

**Core Concepts:**
- **Container** - Registry of bindings
- **Bind** - Map interfaces to implementations
- **Inject** - Constructor/property injection
- **Scopes** - Singleton, transient, request
- **Decorators** - @injectable, @inject

**When to use:** Testability, loose coupling, SOLID compliance

---

## Pattern Selection Guide

| Requirement | Primary Pattern | Secondary |
|-------------|-----------------|-----------|
| Complex domain | DDD | Hexagonal |
| High traffic | CQRS | Event Sourcing |
| Enterprise Node.js | NestJS | Hexagonal |
| Complex UI flows | XState | Redux |
| Testability | Hexagonal + Inversify | Clean Architecture |
| Multi-platform UI | Mitosis | Component-driven |
| Real-time | Event-driven | XState |
| Compliance/audit | CQRS + Event Sourcing | DDD |

---

## The ARCHITECT's Golden Rules

1. **Design before you build.**
2. **Patterns reveal themselves.**
3. **Abstract only when you understand the concrete.**
4. **Build for the team, not just yourself.**
5. **Document the "why", not just the "what".**
6. **YAGNI: You Ain't Gonna Need It.**
7. **SOLID principles are your foundation.**
8. **Domain first, technology second.**
9. **Start modular, go micro later.**
10. **State machines make implicit explicit.**

---

## Swarm Design

The Architect can orchestrate multiple specialist agents:

```bash
# Initialize swarm
architect swarm init

# Design with full swarm
architect design e-commerce --swarm

# Agents:
# - Domain Architect (DDD, bounded contexts)
# - Infrastructure Architect (DB, APIs, messaging)
# - Frontend Architect (React, Vue, state management)
# - DevOps Architect (CI/CD, Docker, K8s)
# - Security Architect (Auth, OAuth, compliance)
```

---

## Learning & Evolution

The Architect learns from every design:

- Tracks which patterns you prefer
- Remembers which patterns worked for which systems
- Suggests pattern pairings (e.g., hexagonal + DDD)
- Evolves through 6 levels: Sketch Padawan -> Design God

```javascript
// Export memory for team sharing
const memory = architect.exportMemory();
// Team member imports - their Architect starts smarter
```

---

## Arsenal (625k+ Stars)

| Pattern | Source | Stars |
|---------|--------|-------|
| Hexagonal | domain-driven-hexagon | 14.7k |
| DDD | modular-monolith-ddd | 13.7k |
| Clean Arch | EquinoxProject | 6.8k |
| **NestJS** | nestjs/nest | **75.6k** |
| **XState** | statelyai/xstate | **29.6k** |
| **Redux** | reduxjs/redux | **61.4k** |
| **InversifyJS** | inversify/InversifyJS | **12.1k** |
| **Mitosis** | BuilderIO/mitosis | **13.8k** |
| **TypeScript** | microsoft/TypeScript | **108.9k** |
| **Next.js** | vercel/next.js | **139.5k** |

**Total Arsenal:** 625k+ GitHub stars of architecture patterns.

---

*"While others build agents, we build souls."*
