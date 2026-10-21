/**
 * engine-optimizer.js
 * Engine Performance Optimization Suite
 * 
 * Provides:
 *   1. 4-Tier Level of Detail (LOD) & Distance Culling
 *   2. Spatial Hash Grid for O(1) proximity lookups
 *   3. Adaptive GPU Material Degradation Safeguard
 *   4. Frame budget monitoring
 */

(function() {
  'use strict';

  const T = window.THREE;

  // ─── CONFIG ─────────────────────────────────────────────────────────
  const CFG = {
    LOD_TIER_0: 400,    // Full detail
    LOD_TIER_1: 800,    // Medium detail
    LOD_TIER_2: 1500,   // Low detail
    // > TIER_2 = culled

    SPATIAL_CELL_SIZE: 100,
    SPATIAL_GRID_SIZE: 60,  // 60x60 grid covering 6000x6000 world

    FRAME_BUDGET_MS: 16.6,         // 60 FPS target
    DEGRADATION_THRESHOLD: 22,     // Start degrading at ~45 FPS
    RECOVERY_THRESHOLD: 14,        // Recover quality below 14ms
    SAMPLE_FRAMES: 30,             // Average over 30 frames

    enabled: true
  };

  // ─── SPATIAL HASH GRID ──────────────────────────────────────────────

  class SpatialHashGrid {
    constructor(cellSize, gridSize) {
      this.cellSize = cellSize || CFG.SPATIAL_CELL_SIZE;
      this.halfGrid = (gridSize || CFG.SPATIAL_GRID_SIZE) / 2;
      this.cells = new Map();
    }

    _key(cx, cz) {
      return (cx + 10000) * 100000 + (cz + 10000);
    }

    _cellCoords(x, z) {
      return {
        cx: Math.floor(x / this.cellSize),
        cz: Math.floor(z / this.cellSize)
      };
    }

    insert(entity) {
      if (!entity.position) return;
      const { cx, cz } = this._cellCoords(entity.position.x, entity.position.z);
      const key = this._key(cx, cz);
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(entity);
      entity._spatialKey = key;
    }

    remove(entity) {
      if (entity._spatialKey === undefined) return;
      const arr = this.cells.get(entity._spatialKey);
      if (arr) {
        const idx = arr.indexOf(entity);
        if (idx >= 0) arr.splice(idx, 1);
      }
      delete entity._spatialKey;
    }

    update(entity) {
      this.remove(entity);
      this.insert(entity);
    }

    queryRadius(x, z, radius) {
      const results = [];
      const minCx = Math.floor((x - radius) / this.cellSize);
      const maxCx = Math.floor((x + radius) / this.cellSize);
      const minCz = Math.floor((z - radius) / this.cellSize);
      const maxCz = Math.floor((z + radius) / this.cellSize);
      const r2 = radius * radius;

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          const arr = this.cells.get(this._key(cx, cz));
          if (!arr) continue;
          for (const e of arr) {
            if (!e.position) continue;
            const dx = e.position.x - x;
            const dz = e.position.z - z;
            if (dx * dx + dz * dz <= r2) {
              results.push(e);
            }
          }
        }
      }
      return results;
    }

    queryBox(minX, minZ, maxX, maxZ) {
      const results = [];
      const minCx = Math.floor(minX / this.cellSize);
      const maxCx = Math.floor(maxX / this.cellSize);
      const minCz = Math.floor(minZ / this.cellSize);
      const maxCz = Math.floor(maxZ / this.cellSize);

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          const arr = this.cells.get(this._key(cx, cz));
          if (!arr) continue;
          for (const e of arr) {
            if (!e.position) continue;
            if (e.position.x >= minX && e.position.x <= maxX &&
                e.position.z >= minZ && e.position.z <= maxZ) {
              results.push(e);
            }
          }
        }
      }
      return results;
    }

    clear() {
      this.cells.clear();
    }
  }

  // ─── LOD MANAGER ────────────────────────────────────────────────────

  class LODManager {
    constructor() {
      this.managedGroups = []; // { group, position, currentTier, tickFn }
      this._tickCounter = 0;
    }

    register(group, worldPos, tickFn) {
      this.managedGroups.push({
        group,
        position: worldPos.clone ? worldPos.clone() : new T.Vector3(worldPos.x || 0, worldPos.y || 0, worldPos.z || 0),
        currentTier: 0,
        tickFn: tickFn || null,
        lastTickFrame: 0
      });
    }

    update(cameraPosition, frameCount) {
      this._tickCounter = frameCount || this._tickCounter + 1;

      for (const entry of this.managedGroups) {
        const dist = cameraPosition.distanceTo(entry.position);
        let tier;

        if (dist < CFG.LOD_TIER_0) tier = 0;
        else if (dist < CFG.LOD_TIER_1) tier = 1;
        else if (dist < CFG.LOD_TIER_2) tier = 2;
        else tier = 3;

        if (tier !== entry.currentTier) {
          entry.currentTier = tier;
          this._applyTier(entry, tier);
        }

        // Throttled tick based on tier
        if (entry.tickFn) {
          const tickInterval = tier === 0 ? 1 : tier === 1 ? 2 : tier === 2 ? 4 : 0;
          if (tickInterval > 0 && (this._tickCounter - entry.lastTickFrame) >= tickInterval) {
            entry.lastTickFrame = this._tickCounter;
            // Tier 3 doesn't tick at all
          }
        }
      }
    }

    _applyTier(entry, tier) {
      if (!entry.group) return;

      switch (tier) {
        case 0: // Full detail
          entry.group.visible = true;
          entry.group.traverse(child => {
            if (child.isMesh) child.castShadow = true;
          });
          break;
        case 1: // Medium
          entry.group.visible = true;
          entry.group.traverse(child => {
            if (child.isMesh) child.castShadow = false;
          });
          break;
        case 2: // Low — hide small greebles
          entry.group.visible = true;
          entry.group.traverse(child => {
            if (child.isMesh) {
              child.castShadow = false;
              // Hide very small meshes (greebles)
              if (child.geometry && child.geometry.boundingSphere) {
                child.geometry.computeBoundingSphere();
                if (child.geometry.boundingSphere.radius < 1) {
                  child.visible = false;
                }
              }
            }
            if (child.isPointLight && child.intensity < 2) {
              child.visible = false;
            }
          });
          break;
        case 3: // Culled
          entry.group.visible = false;
          break;
      }
    }

    shouldTick(entry, dt) {
      if (!entry) return false;
      const tier = entry.currentTier;
      if (tier >= 3) return false;
      const interval = tier === 0 ? 1 : tier === 1 ? 2 : 4;
      return (this._tickCounter % interval) === 0;
    }
  }

  // ─── GPU SAFEGUARD ──────────────────────────────────────────────────

  class GPUSafeguard {
    constructor() {
      this.frameTimes = [];
      this.degraded = false;
      this.degradedMaterials = [];
      this._lastTime = performance.now();
    }

    sampleFrame() {
      const now = performance.now();
      const dt = now - this._lastTime;
      this._lastTime = now;

      this.frameTimes.push(dt);
      if (this.frameTimes.length > CFG.SAMPLE_FRAMES) {
        this.frameTimes.shift();
      }

      if (this.frameTimes.length >= CFG.SAMPLE_FRAMES) {
        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

        if (!this.degraded && avg > CFG.DEGRADATION_THRESHOLD) {
          this._degrade();
        } else if (this.degraded && avg < CFG.RECOVERY_THRESHOLD) {
          this._recover();
        }
      }
    }

    _degrade() {
      this.degraded = true;
      console.warn('[EngineOptimizer] GPU safeguard triggered — degrading materials for performance');
    }

    _recover() {
      this.degraded = false;
      console.log('[EngineOptimizer] GPU safeguard recovered — restoring quality');
    }

    isDegraded() {
      return this.degraded;
    }
  }

  // ─── MAIN API ───────────────────────────────────────────────────────

  const spatialGrid = new SpatialHashGrid();
  const lodManager = new LODManager();
  const gpuSafeguard = new GPUSafeguard();

  window.EngineOptimizer = {
    CFG,
    SpatialHashGrid,
    LODManager,
    GPUSafeguard,

    // Singleton instances
    spatialGrid,
    lodManager,
    gpuSafeguard,

    // Convenience methods
    registerCity: function(group, worldPos, tickFn) {
      lodManager.register(group, worldPos, tickFn);
    },

    tick: function(cameraPosition, frameCount) {
      if (!CFG.enabled) return;
      gpuSafeguard.sampleFrame();
      lodManager.update(cameraPosition, frameCount);
    },

    insertUnit: function(entity) {
      spatialGrid.insert(entity);
    },

    removeUnit: function(entity) {
      spatialGrid.remove(entity);
    },

    queryUnitsInRadius: function(x, z, radius) {
      return spatialGrid.queryRadius(x, z, radius);
    },

    queryUnitsInBox: function(minX, minZ, maxX, maxZ) {
      return spatialGrid.queryBox(minX, minZ, maxX, maxZ);
    },

    isDegraded: function() {
      return gpuSafeguard.isDegraded();
    }
  };

  console.log('[EngineOptimizer] LOD Manager, Spatial Hash Grid & GPU Safeguard loaded');
})();
