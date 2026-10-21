export type SourceId = 'gsk' | 'cpl' | 'omniroute' | 'soul-economy' | string;

export interface Provenance {
  source: SourceId;
  sourceRecordId?: string;
  fetchedAt: string; // ISO timestamp
  confidence?: number; // 0..1
  transformSteps?: string[];
  notes?: string;
}

export function attachProvenance<T>(entity: T, prov: Provenance) {
  // Attach non-enumerable __provenance to avoid accidental serialization
  try {
    Object.defineProperty(entity, "__provenance", {
      value: prov,
      enumerable: false,
      configurable: true,
      writable: true,
    });
    return entity as T & { __provenance: Provenance };
  } catch (e) {
    // Fallback: return a shallow copy with provenance
    return { ...(entity as any), __provenance: prov } as T & { __provenance: Provenance };
  }
}
