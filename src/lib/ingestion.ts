import { getOrCreateCollection } from "./chroma";
import crypto from "crypto";

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 500,
  chunkOverlap: 50,
  separator: "\n",
};

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const { chunkSize, chunkOverlap, separator } = { ...DEFAULT_OPTIONS, ...options };

  if (text.length <= chunkSize!) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize!;

    if (end < text.length) {
      const lastSeparator = text.lastIndexOf(separator!, end);
      if (lastSeparator > start) {
        end = lastSeparator + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());

    start = end - chunkOverlap!;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

export interface Document {
  id?: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface IngestResult {
  collectionName: string;
  documentCount: number;
  chunkCount: number;
  ids: string[];
}

export async function ingestDocument(
  collectionName: string,
  document: Document,
  userId?: string,
  options?: ChunkOptions
): Promise<IngestResult> {
  const collection = await getOrCreateCollection(collectionName, userId);

  const chunks = chunkText(document.text, options);
  const ids: string[] = [];
  const documents: string[] = [];
  const metadatas: Record<string, any>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = document.id
      ? `${document.id}_chunk_${i}`
      : `doc_${crypto.randomBytes(8).toString("hex")}_chunk_${i}`;

    ids.push(chunkId);
    documents.push(chunks[i]);
    metadatas.push({
      ...document.metadata,
      chunkIndex: i,
      totalChunks: chunks.length,
      ingestedAt: new Date().toISOString(),
    });
  }

  await collection.add({
    ids,
    documents,
    metadatas,
  });

  return {
    collectionName,
    documentCount: 1,
    chunkCount: chunks.length,
    ids,
  };
}

export async function ingestText(
  collectionName: string,
  text: string,
  metadata?: Record<string, any>,
  userId?: string,
  options?: ChunkOptions
): Promise<IngestResult> {
  return ingestDocument(
    collectionName,
    { text, metadata },
    userId,
    options
  );
}

export async function ingestUrl(
  collectionName: string,
  url: string,
  metadata?: Record<string, any>,
  userId?: string,
  options?: ChunkOptions
): Promise<IngestResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const text = await response.text();

  return ingestText(
    collectionName,
    text,
    { ...metadata, sourceUrl: url },
    userId,
    options
  );
}

export async function getCollectionStats(
  collectionName: string,
  userId?: string
): Promise<{ count: number }> {
  const collection = await getOrCreateCollection(collectionName, userId);
  const count = await collection.count();
  return { count };
}
