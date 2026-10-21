# Pattern Reference

## Complete Pattern Catalog

### Structural Patterns

#### Hexagonal Architecture
```
Dependency Rule: Infrastructure -> Application -> Domain
```
- **Port:** Interface defining what the application needs
- **Adapter:** Implementation of a port for a specific technology
- **Primary Adapter:** Drives the application (HTTP, CLI)
- **Secondary Adapter:** Driven by the application (DB, external API)

#### Layered Architecture
```
Presentation -> Business -> Data Access
```
- **Presentation:** UI, API controllers
- **Business:** Use cases, domain logic
- **Data Access:** Repositories, ORM

#### Modular Monolith
```
App -> Module A | Module B | Module C
```
- **Module:** Self-contained bounded context
- **Internal API:** Module-to-module communication
- **Shared Kernel:** Common utilities (minimal)

---

### Behavioral Patterns

#### CQRS
- **Command:** Modifies state, returns void/success
- **Query:** Reads state, returns data
- **Event Store:** Append-only log of all changes
- **Projection:** Builds read model from events

#### Event Sourcing
- **Event:** Immutable record of something that happened
- **Aggregate:** Rehydrates from event stream
- **Snapshot:** Periodic state capture for performance
- **Event Bus:** Distributes events to subscribers

#### Saga Pattern
- **Orchestration:** Central coordinator manages steps
- **Choreography:** Services react to each other's events
- **Compensation:** Rollback actions for failures

---

### Creational Patterns

#### Factory
- **Simple Factory:** Creates objects based on input
- **Factory Method:** Subclasses decide which class to instantiate
- **Abstract Factory:** Creates families of related objects

#### Builder
- **Fluent Interface:** chain methods for readability
- **Step Builder:** Enforce construction order
- **Immutable Builder:** Build immutable objects

---

### Concurrency Patterns

#### Actor Model (from XState)
- **Actor:** Independent unit of computation
- **Mailbox:** Message queue per actor
- **No shared state:** Communication via messages only

#### Event Loop
- **Single Thread:** One thread, many async operations
- **Callback Queue:** Deferred execution
- **Microtasks:** Higher priority than macrotasks

---

### Integration Patterns

#### API Gateway
- **Routing:** Direct requests to appropriate service
- **Aggregation:** Combine multiple service responses
- **Rate Limiting:** Protect backends
- **Authentication:** Centralized auth checks

#### Message Queue
- **Producer:** Publishes messages
- **Consumer:** Processes messages
- **Topic:** Named channel for messages
- **Dead Letter Queue:** Failed message storage

#### Circuit Breaker
- **Closed:** Normal operation
- **Open:** Failing fast, not calling service
- **Half-Open:** Testing if service recovered

---

## Glossary

| Term | Definition |
|------|------------|
| Aggregate | Cluster of domain objects treated as a single unit |
| Bounded Context | Explicit boundary within which a domain model applies |
| Dependency Inversion | High-level modules should not depend on low-level modules |
| Domain Event | Something that happened in the business domain |
| Entity | Object with unique identity that persists over time |
| Repository | Mediates between domain and data mapping layers |
| Ubiquitous Language | Common language shared by domain experts and developers |
| Value Object | Immutable object defined by its attributes, not identity |

---

*For examples of each pattern in action, see the `/examples` directory.*
