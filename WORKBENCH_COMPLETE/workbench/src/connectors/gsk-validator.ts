import { validateGskMemories } from "../schemas/gsk.schema.js";

export async function validateGskResponse(raw: unknown) {
  const candidate = (raw && (raw as any).result?.memories) || raw;
  const parsed = validateGskMemories(candidate);
  return {
    valid: parsed.success,
    errors: parsed.success ? null : parsed.error.format(),
    value: parsed.success ? parsed.data : candidate
  };
}
