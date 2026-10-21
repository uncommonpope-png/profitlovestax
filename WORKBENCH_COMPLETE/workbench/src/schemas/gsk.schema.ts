import { z } from "zod";

export const GskMemorySchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.string(),
  timestamp: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional()
});

export const GskMemoriesArray = z.array(GskMemorySchema);

export function validateGskMemories(payload: unknown) {
  return GskMemoriesArray.safeParse(payload);
}
