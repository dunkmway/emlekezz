import { randomUUID } from 'node:crypto';
import ollama from '../../../services/ollama';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;

export async function generateEmbeddings(
  content: string,
  embeddingModel: string
) {
  const chunks = chunkMarkdown(content, CHUNK_SIZE, CHUNK_OVERLAP);
  const chunkSources = chunks.length ? chunks : [content];

  type EmbeddedChunk = {
    id: string;
    content: string;
    vectorLiteral: string;
  };

  const embeddedChunks: EmbeddedChunk[] = [];
  for (const chunk of chunkSources) {
    const embeddingResponse = await ollama.embeddings({
      model: embeddingModel,
      prompt: chunk,
    });

    const chunkEmbedding = embeddingResponse.embedding;

    if (!Array.isArray(chunkEmbedding) || chunkEmbedding.length === 0) {
      throw new Error('Failed to embed a chunk of the note.');
    }

    embeddedChunks.push({
      id: randomUUID(),
      content: chunk,
      vectorLiteral: `[${chunkEmbedding.join(',')}]`,
    });
  }

  return embeddedChunks;
}

function chunkMarkdown(content: string, chunkSize: number, overlap: number) {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const sections = extractSections(normalized);
  const toChunk = sections.length ? sections : [normalized];

  return toChunk.flatMap(section =>
    splitText(section, chunkSize, overlap).filter(Boolean)
  );
}

function extractSections(content: string) {
  const lines = content.split('\n');
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#{1,6}\s/.test(line) && current.length) {
      sections.push(current.join('\n').trim());
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length) {
    sections.push(current.join('\n').trim());
  }

  return sections;
}

function splitText(content: string, chunkSize: number, overlap: number) {
  const text = content.trim();
  if (!text) return [];

  const safeOverlap = Math.max(0, Math.min(overlap, Math.floor(chunkSize / 2)));
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const window = text.slice(start, end);
      const breakPoints = [
        window.lastIndexOf('\n\n'),
        window.lastIndexOf('\n'),
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
      ]
        .filter(idx => idx !== -1)
        .map(idx => start + idx + 1);

      const candidate = breakPoints
        .filter(point => point > start + chunkSize * 0.5)
        .sort((a, b) => b - a)[0];

      if (candidate && candidate < end) {
        end = candidate;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    const nextStart = end - safeOverlap;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}
