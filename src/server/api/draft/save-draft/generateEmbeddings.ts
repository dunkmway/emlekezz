import { randomUUID, createHash } from 'node:crypto';
import pLimit from 'p-limit';
import ollama from '../../../services/ollama';
import { MarkdownNodeParser } from '@llamaindex/core/node-parser';
import { Document } from '@llamaindex/core/schema';

const CHUNK_SIZE = 2000; // chars (≈ 350–500 tokens depending on text)
const CHUNK_OVERLAP = 250; // 10–20% overlap
const CONCURRENCY = 6;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 250; // ms

type EmbeddedChunk = {
  id: string;
  docId: string;
  chunkIndex: number;
  section?: string;
  startChar: number;
  endChar: number;
  content: string;
  vector: number[];
};

type Chunk = {
  content: string;
  section?: string;
  start: number;
  end: number;
};

export async function generateEmbeddings(
  content: string,
  embeddingModel: string,
  docId: string = randomUUID()
) {
  // const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);

  const splitter = new MarkdownNodeParser();
  const nodes = splitter.getNodesFromDocuments([
    new Document({ text: content }),
  ]);
  const chunks = nodes.map(node => node.text);

  if (chunks.length === 0) {
    return [];
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = chunks.map((c, i) =>
    limit(() =>
      embedWithRetry(embeddingModel, c).then(vector => ({
        id: stableChunkId(docId, i),
        docId,
        chunkIndex: i,
        // section: c.section,
        // startChar: c.start,
        // endChar: c.end,
        content: c,
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

// --- Simple overlapping chunking ---
function chunkText(raw: string, size: number, overlap: number): Chunk[] {
  if (size <= 0) {
    throw new Error('Chunk size must be positive');
  }

  const safeOverlap = Math.max(0, Math.min(overlap, Math.floor(size / 2)));
  const out: Chunk[] = [];

  const text = raw.replace(/\r\n/g, '\n');
  const totalLength = text.length;

  let start = 0;
  while (start < totalLength) {
    let end = Math.min(start + size, totalLength);
    const rawChunk = text.slice(start, end);
    const trimmedStart = rawChunk.trimStart();

    if (trimmedStart) {
      const leading = rawChunk.length - trimmedStart.length;
      const trimmed = trimmedStart.trimEnd();

      if (trimmed) {
        const trailing = trimmedStart.length - trimmed.length;
        const chunkStart = start + leading;
        const chunkEnd = start + rawChunk.length - trailing;
        out.push({
          content: trimmed,
          section: undefined,
          start: chunkStart,
          end: chunkEnd,
        });
      }
    }

    if (end >= totalLength) {
      break;
    }

    const nextStart = end - safeOverlap;
    start = Math.max(nextStart, start + 1);
  }

  return out;
}
