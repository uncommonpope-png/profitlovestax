import { getOrCreateCollection } from "./chroma";

export interface RetrieveOptions {
  nResults?: number;
  where?: Record<string, any>;
  whereDocument?: Record<string, any>;
}

export interface RetrieveResult {
  ids: string[][];
  documents: string[][];
  metadatas: Record<string, any>[][];
  distances: number[][];
}

export async function retrieve(
  collectionName: string,
  query: string,
  userId?: string,
  options: RetrieveOptions = {}
): Promise<RetrieveResult> {
  const collection = await getOrCreateCollection(collectionName, userId);

  const { nResults = 5, where, whereDocument } = options;

  const results = await collection.query({
    queryTexts: [query],
    nResults,
    where,
    whereDocument,
  });

  return {
    ids: results.ids as string[][],
    documents: results.documents as string[][],
    metadatas: results.metadatas as Record<string, any>[][],
    distances: results.distances as number[][],
  };
}

export interface ContextResult {
  context: string;
  sources: Array<{
    id: string;
    text: string;
    score: number;
    metadata: Record<string, any>;
  }>;
}

export async function getContext(
  collectionName: string,
  query: string,
  userId?: string,
  maxContextLength: number = 2000
): Promise<ContextResult> {
  const results = await retrieve(collectionName, query, userId, {
    nResults: 5,
  });

  const sources: ContextResult["sources"] = [];
  let context = "";

  if (results.documents[0]) {
    for (let i = 0; i < results.documents[0].length; i++) {
      const doc = results.documents[0][i];
      const id = results.ids[0][i];
      const metadata = results.metadatas[0][i] || {};
      const distance = results.distances[0]?.[i] || 0;
      const score = 1 - distance;

      if (context.length + doc.length <= maxContextLength) {
        context += doc + "\n\n";
      }

      sources.push({ id, text: doc, score, metadata });
    }
  }

  return {
    context: context.trim(),
    sources,
  };
}

export async function deleteDocument(
  collectionName: string,
  documentId: string,
  userId?: string
): Promise<boolean> {
  try {
    const collection = await getOrCreateCollection(collectionName, userId);

    const results = await collection.get({
      where: { docId: documentId },
    });

    if (results.ids.length > 0) {
      await collection.delete({ ids: results.ids });
    }

    return true;
  } catch {
    return false;
  }
}
