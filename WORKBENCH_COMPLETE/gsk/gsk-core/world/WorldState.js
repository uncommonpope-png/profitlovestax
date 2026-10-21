'use strict';

class WorldState {
    constructor() {
        this.resources = [];
        this.width = 100;
        this.height = 100;
    }

    addResource(id, type, position, amount) {
        this.resources.push({ id, type, position, amount });
    }

    findNearestResource(position, type) {
        let nearest = null;
        let minDistance = Infinity;

        for (const resource of this.resources) {
            if (resource.type === type && resource.amount > 0) {
                const distance = Math.sqrt(
                    Math.pow(resource.position.x - position.x, 2) +
                    Math.pow(resource.position.y - position.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = resource;
                }
            }
        }
        return nearest;
    }

    consumeResource(id) {
        const resource = this.resources.find(r => r.id === id);
        if (resource && resource.amount > 0) {
            const amountToConsume = Math.min(resource.amount, 20); // Consume up to 20 units
            resource.amount -= amountToConsume;
            return amountToConsume;
        }
        return 0;
    }

    updateWorld() {
        // Simple resource regeneration
        for (const resource of this.resources) {
            if (resource.amount < 50) {
                resource.amount += 1;
            }
        }
    }
}

module.exports = { WorldState };
