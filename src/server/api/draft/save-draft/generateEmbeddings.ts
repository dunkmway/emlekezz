import { randomUUID, createHash } from 'node:crypto';
import pLimit from 'p-limit';
import ollama from '../../../services/ollama';

const CHUNK_SIZE = 2000; // chars (≈ 350–500 tokens depending on text)
const CHUNK_OVERLAP = 250; // 10–20% overlap
const CONCURRENCY = 6;

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

export async function generateEmbeddings(
  content: string,
  embeddingModel: string,
  docId: string = randomUUID()
): Promise<EmbeddedChunk[]> {
  const blocks = markdownBlocks(content);
  const chunks = chunkBlocks(blocks, CHUNK_SIZE, CHUNK_OVERLAP);

  const limit = pLimit(CONCURRENCY);
  const tasks = chunks.map((c, i) =>
    limit(() =>
      embedWithRetry(embeddingModel, c.content).then(vector => ({
        id: stableChunkId(docId, i),
        docId,
        chunkIndex: i,
        section: c.section,
        startChar: c.start,
        endChar: c.end,
        content: c.content,
        vector,
      }))
    )
  );

  return Promise.all(tasks);
}

function stableChunkId(docId: string, index: number) {
  return createHash('sha1').update(`${docId}#${index}`).digest('hex');
}

// --- Embedding with backoff ---
async function embedWithRetry(
  model: string,
  text: string,
  tries = 3
): Promise<number[]> {
  let delay = 250;
  for (let t = 0; t < tries; t++) {
    try {
      const res = await ollama.embeddings({ model, prompt: text }); // adjust if API supports batching
      if (!Array.isArray(res?.embedding) || res.embedding.length === 0) {
        throw new Error('Empty embedding');
      }
      return res.embedding;
    } catch (err) {
      if (t === tries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error('Unreachable');
}

// --- Markdown-aware block extraction & chunking ---
type Block = {
  text: string;
  section?: string;
  start: number;
  end: number;
  fenced: boolean;
};

function markdownBlocks(raw: string): Block[] {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  const blocks: Block[] = [];
  const fenceRe = /```[\s\S]*?```/g;
  let last = 0;
  let m: RegExpExecArray | null;

  // Extract fenced code blocks as atomic units
  while ((m = fenceRe.exec(text))) {
    if (m.index > last)
      pushHeadingBlocks(text.slice(last, m.index), last, blocks);
    blocks.push({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length,
      fenced: true,
    });
    last = m.index + m[0].length;
  }
  if (last < text.length) pushHeadingBlocks(text.slice(last), last, blocks);
  return blocks;
}

function pushHeadingBlocks(segment: string, offset: number, out: Block[]) {
  const lines = segment.split('\n');
  let buf: string[] = [];
  let section = undefined as string | undefined;
  let pos = offset;

  const flush = () => {
    if (!buf.length) return;
    const joined = buf.join('\n').trim();
    if (joined)
      out.push({
        text: joined,
        section,
        start: pos,
        end: pos + joined.length,
        fenced: false,
      });
    pos += joined.length + 1; // rough advance; good enough for refs
    buf = [];
  };

  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      flush();
      section = line.replace(/^#{1,6}\s/, '').trim();
      buf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
}

function chunkBlocks(blocks: Block[], size: number, overlap: number) {
  const safeOverlap = Math.max(0, Math.min(overlap, Math.floor(size / 2)));
  const out: {
    content: string;
    section?: string;
    start: number;
    end: number;
  }[] = [];

  for (const b of blocks) {
    if (b.text.length <= size) {
      out.push({
        content: b.text,
        section: b.section,
        start: b.start,
        end: b.end,
      });
      continue;
    }
    let start = 0;
    while (start < b.text.length) {
      let end = Math.min(start + size, b.text.length);
      if (end < b.text.length) {
        const win = b.text.slice(start, end);
        const bp = bestBreakpoint(win);
        if (bp !== -1) end = start + bp + 1;
      }
      const chunk = b.text.slice(start, end).trim();
      if (chunk) {
        out.push({
          content: chunk,
          section: b.section,
          start: b.start + start,
          end: b.start + end,
        });
      }
      if (end >= b.text.length) break;
      start = Math.max(end - safeOverlap, end); // ensures progress
    }
  }
  return out;
}

function bestBreakpoint(win: string) {
  const idxs = [
    win.lastIndexOf('\n\n'),
    win.lastIndexOf('\n'),
    win.lastIndexOf('```'),
    win.lastIndexOf('### '),
    win.lastIndexOf('. '),
    win.lastIndexOf('! '),
    win.lastIndexOf('? '),
  ].filter(i => i !== -1);
  const min = Math.floor(win.length * 0.5);
  return idxs.filter(i => i >= min).sort((a, b) => b - a)[0] ?? -1;
}
