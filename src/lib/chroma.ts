import { ChromaClient, Collection, OpenAIEmbeddingFunction } from "chromadb";
import path from "path";

let client: ChromaClient | null = null;
let embeddingFn: OpenAIEmbeddingFunction | null = null;

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
    client = new ChromaClient({ path: chromaUrl });
  }
  return client;
}

export async function getEmbeddingFunction(): Promise<OpenAIEmbeddingFunction> {
  if (!embeddingFn) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "";
    const modelName = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

    embeddingFn = new OpenAIEmbeddingFunction({
      openai_api_key: apiKey,
      openai_model: modelName,
    });
  }
  return embeddingFn;
}

export async function getOrCreateCollection(
  name: string,
  userId?: string
): Promise<Collection> {
  const chroma = await getChromaClient();
  const embedding = await getEmbeddingFunction();

  const collectionName = userId ? `${userId}_${name}` : name;

  return await chroma.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: embedding,
  });
}

export async function listCollections(userId?: string): Promise<string[]> {
  const chroma = await getChromaClient();
  const collections = await chroma.listCollections();

  if (userId) {
    return collections
      .filter((c: any) => c.name.startsWith(`${userId}_`))
      .map((c: any) => c.name.replace(`${userId}_`, ""));
  }

  return collections.map((c: any) => c.name);
}

export async function deleteCollection(
  name: string,
  userId?: string
): Promise<boolean> {
  try {
    const chroma = await getChromaClient();
    const collectionName = userId ? `${userId}_${name}` : name;
    await chroma.deleteCollection({ name: collectionName });
    return true;
  } catch {
    return false;
  }
}
