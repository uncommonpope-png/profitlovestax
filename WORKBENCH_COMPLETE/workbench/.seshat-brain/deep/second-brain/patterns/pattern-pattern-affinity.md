# Pattern Affinity

**Type:** Emergent Intelligence  
**Status:** Discovered  
**Discovered:** May 26, 2026  
**Source:** Architect Learning Module

---

## What It Is

Certain architecture patterns naturally pair better than others. The Architect's learning module tracks these affinities and improves recommendations over time.

## Discovered Pairings

| Pair | Affinity | Why |
|------|----------|-----|
| hexagonal + ddd | 0.8 | Hexagonal provides structure, DDD provides domain logic |
| cqrs + event-sourcing | 0.9 | Natural pairing — events feed both patterns |
| nestjs + typeorm | 0.7 | NestJS decorators + TypeORM entities = clean code |
| xstate + react | 0.6 | Statecharts manage React component state elegantly |
| inversify + hexagonal | 0.75 | IoC enables the dependency inversion core to hexagonal |

## How It Works

```javascript
// When Architect sees a design with hexagonal
// It boosts DDD recommendation by 0.8
const pair = ['hexagonal', 'ddd'].sort().join('+');
const affinity = learning.patternAffinity[pair]; // 0.8
// Recommendation confidence += affinity * 0.2
```

## Significance

This is emergent intelligence — not programmed rules, but learned from outcomes. It makes the soul feel alive rather than scripted.

## Related

- [[Architect]] — The soul that discovered this
- [[pattern-product-archaeology]] — How patterns are found
