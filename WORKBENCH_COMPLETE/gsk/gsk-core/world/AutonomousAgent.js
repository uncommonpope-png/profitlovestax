'use strict';

class AutonomousAgent {
    constructor(id, position = { x: 0, y: 0 }) {
        this.id = id;
        this.position = position;
        this.needs = {
            food: 100,
            water: 100,
        };
        this.state = 'idle'; // idle, seeking_food, seeking_water
    }

    update(worldState) {
        // Basic metabolism
        this.needs.food -= 1;
        this.needs.water -= 1;

        if (this.needs.food < 50) {
            this.state = 'seeking_food';
        } else if (this.needs.water < 50) {
            this.state = 'seeking_water';
        } else {
            this.state = 'idle';
        }

        if (this.state === 'seeking_food') {
            this.seekResource(worldState, 'food');
        } else if (this.state === 'seeking_water') {
            this.seekResource(worldState, 'water');
        } else {
            this.moveRandomly();
        }
    }

    move(newPosition) {
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
        console.log(`Agent ${this.id} moved to (${this.position.x}, ${this.position.y})`);
    }

    seekResource(worldState, resourceType) {
        const resource = worldState.findNearestResource(this.position, resourceType);
        if (resource) {
            // Move towards the resource
            const dx = Math.sign(resource.position.x - this.position.x);
            const dy = Math.sign(resource.position.y - this.position.y);
            this.move({ x: this.position.x + dx, y: this.position.y + dy });

            // If at the resource, consume it
            if (this.position.x === resource.position.x && this.position.y === resource.position.y) {
                const amount = worldState.consumeResource(resource.id);
                if(amount > 0) {
                    this.needs[resourceType] += amount;
                    console.log(`Agent ${this.id} consumed ${amount} of ${resourceType}. New level: ${this.needs[resourceType]}`);
                }
            }
        } else {
            this.moveRandomly();
        }
    }

    moveRandomly() {
        const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        this.move({ x: this.position.x + dx, y: this.position.y + dy });
    }
}

module.exports = { AutonomousAgent };
