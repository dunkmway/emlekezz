import { randomUUID, createHash } from 'node:crypto';
import pLimit from 'p-limit';
import ollama from '../../../services/ollama';
import { SentenceSplitter } from '@llamaindex/core/node-parser';
import { Document } from '@llamaindex/core/schema';

const CHUNK_SIZE = 300;
const CHUNK_OVERLAP = 30;
const CONCURRENCY = 6;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 250; // ms

export async function generateEmbeddings(
  content: string,
  embeddingModel: string,
  docId: string = randomUUID()
) {
  const splitter = new SentenceSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  const chunks = splitter.getNodesFromDocuments([
    new Document({ text: content }),
  ]);

  if (chunks.length === 0) {
    return [];
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = chunks.map((c, i) =>
    limit(() =>
      embedWithRetry(embeddingModel, c.text).then(vector => ({
        id: stableChunkId(docId, i),
        docId,
        chunkIndex: i,
        startChar: c.startCharIdx,
        endChar: c.endCharIdx,
        content: c.text,
        vector,
      }))
    )
  );

  return Promise.all(tasks);
}

function stableChunkId(docId: string, index: number): string {
  return createHash('sha1').update(`${docId}#${index}`).digest('hex');
}

// --- Embedding with exponential backoff ---
async function embedWithRetry(
  model: string,
  text: string,
  tries: number = MAX_RETRIES
): Promise<number[]> {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  let delay = INITIAL_RETRY_DELAY;
  let lastError: Error | null = null;

  for (let t = 0; t < tries; t++) {
    try {
      const res = await ollama.embeddings({ model, prompt: text });

      if (!res?.embedding || !Array.isArray(res.embedding)) {
        throw new Error(
          'Invalid embedding response: missing or non-array embedding'
        );
      }

      if (res.embedding.length === 0) {
        throw new Error('Empty embedding returned by model');
      }

      return res.embedding;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (t === tries - 1) {
        throw new Error(
          `Failed to generate embedding after ${tries} attempts: ${lastError.message}`
        );
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 * delay;
      await new Promise(r => setTimeout(r, delay + jitter));
      delay *= 2;
    }
  }

  throw new Error('Unreachable');
}
