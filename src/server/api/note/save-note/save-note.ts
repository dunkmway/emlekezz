import { randomUUID } from 'node:crypto';
import { z } from 'zod/v4';
import { Prisma, prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import ollama from '../../../services/ollama';

const saveNoteInput = z.null();

const saveNoteOutput = z.void();

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;

export const saveNote = authorizedProcedure
  .meta({ requiredPermissions: [] })
  .input(saveNoteInput)
  .output(saveNoteOutput)
  .mutation(async opts => {
    const note = await prisma.note.findFirst({
      where: { userId: opts.ctx.userId, storedDate: null },
      select: { id: true, content: true },
    });

    if (!note) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No draft note available to save.',
      });
    }

    const content = note.content?.trim();

    if (!content) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot save an empty note.',
      });
    }

    const { chatModel, embeddingModel } = await prisma.user.findUniqueOrThrow({
      where: { id: opts.ctx.userId },
      select: { chatModel: true, embeddingModel: true },
    });

    if (!embeddingModel) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No embedding model chosen.',
      });
    }

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
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to embed a chunk of the note.',
        });
      }

      embeddedChunks.push({
        id: randomUUID(),
        content: chunk,
        vectorLiteral: `[${chunkEmbedding.join(',')}]`,
      });
    }

    const title = await generateTitle(content, chatModel);
    const storedDate = new Date();

    await prisma.$transaction(async tx => {
      await tx.note.update({
        where: { id: note.id },
        data: {
          storedDate,
          title,
          content,
        },
      });

      await tx.chunk.deleteMany({ where: { noteId: note.id } });

      for (const chunk of embeddedChunks) {
        await tx.$executeRaw`
          INSERT INTO "Chunk" ("id", "noteId", "content", "embedding")
          VALUES (${chunk.id}, ${note.id}, ${chunk.content}, ${Prisma.raw(`'${chunk.vectorLiteral}'::vector`)})
        `;
      }
    });
  });

function chunkMarkdown(content: string, chunkSize: number, overlap: number) {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const sections = extractSections(normalized);
  const toChunk = sections.length ? sections : [normalized];

  return toChunk.flatMap(section =>
    splitText(section, chunkSize, overlap).filter(Boolean),
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

async function generateTitle(content: string, chatModel: string | null) {
  const fallback = fallbackTitle(content);

  if (!chatModel) {
    return fallback;
  }

  try {
    const titleResponse = await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content:
            'Generate a concise, descriptive title of 2-4 words for the provided note. Reply with the title only.',
        },
        {
          role: 'user',
          content,
        },
      ],
    });

    const generated = titleResponse?.message?.content?.trim();
    const normalized = normalizeTitle(generated);

    if (normalized) {
      return normalized;
    }
  } catch (error) {
    console.warn('Failed to generate note title:', error);
  }

  return fallback;
}

function fallbackTitle(content: string) {
  const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) {
    const normalizedHeading = normalizeTitle(headingMatch[1]);
    if (normalizedHeading) {
      return normalizedHeading;
    }
  }

  const firstNonEmptyLine = content
    .split('\n')
    .map(line => line.trim())
    .find(Boolean);

  if (firstNonEmptyLine) {
    const normalizedLine = normalizeTitle(firstNonEmptyLine);
    if (normalizedLine) {
      return normalizedLine;
    }
  }

  return 'Personal Note';
}

function normalizeTitle(rawTitle: string | undefined | null) {
  if (!rawTitle) return '';

  const sanitized = rawTitle
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) return '';

  const words = sanitized.split(' ').filter(Boolean);
  if (!words.length) return '';

  const truncated = words.slice(0, 4);

  while (truncated.length < 2 && words.length > truncated.length) {
    truncated.push(words[truncated.length]);
  }

  while (truncated.length < 2) {
    truncated.push('Note');
  }

  return truncated.join(' ');
}
