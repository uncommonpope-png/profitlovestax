# Modular Grafting Protocol

This document defines the architectural standard for creating and integrating modules within the Genesis Engine, codenamed "Project LEGO." The protocol ensures that all components are decoupled, interchangeable, and scalable, adhering to a standardized interface for inter-module communication.

## Core Principles

1.  **Kernel as Central Hub:** The `GenesisKernel` (`src/genesis/kernel.js`) is the central message bus and module registry. All modules must register with the kernel. Direct inter-module communication is strictly forbidden.
2.  **Standardized Interfaces ("Studs & Tubes"):** Modules communicate via a standardized messaging pattern. This ensures that any module can be swapped out with a new version as long as it adheres to the same message contract.
3.  **Encapsulation:** Modules should be self-contained and expose no public methods other than the standard registration and message handlers. All state should be internal.

## Protocol Specification

### 1. Module Registration

Every module must register itself with the `GenesisKernel` upon initialization. This is done by calling `GenesisKernel.register(name, record)`.

-   `name`: A unique `string` identifier for the module (e.g., `'yuka-bridge'`, `'physics-engine'`).
-   `record`: An `object` containing module metadata and its message handler.

**Example:**

```javascript
// In your-module.js

function onMessage(messageType, payload) {
  // Logic to handle incoming messages
  console.log(`[YourModule] Received: ${messageType}`, payload);
}

// Register with the kernel
if (window.Genesis && window.Genesis.GenesisKernel) {
  window.Genesis.GenesisKernel.register('your-module-name', {
    status: 'installed',
    onMessage: onMessage // Expose the message handler
  });
}
```

### 2. Inter-Module Communication

To send a message to another module, a module must ask the `GenesisKernel` to dispatch it.

-   **`GenesisKernel.sendMessage(targetModuleId, messageType, payload)`**

-   `targetModuleId`: The `string` name of the module to receive the message.
-   `messageType`: A `string` that identifies the action or event (e.g., `'ENTITY_CREATED'`, `'GET_PHYSICS_STATE'`).
-   `payload`: An `object` containing the data for the message.

**Example (from within a module):**

```javascript
// Assuming this code is inside a registered module

function createNewEntity(entityData) {
    // ... internal logic ...

    // Announce that a new entity was created
    window.Genesis.GenesisKernel.sendMessage(
        'physics-engine', 
        'REGISTER_ENTITY', 
        { entityId: entityData.id, mesh: entityData.mesh }
    );
}
```

### 3. Asynchronous by Default

The `sendMessage` function is asynchronous and non-blocking. Modules should not expect an immediate return value. If a response is needed, the receiving module must send a new message back to the original sender.

---
This protocol is the foundation of the "Final Graft" and is mandatory for all new engine components. By adhering to this standard, we build a sovereign world that is as robust and scalable as it is complex.
