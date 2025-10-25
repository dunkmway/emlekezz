import { z } from 'zod/v4';
import { authenticatedProcedure } from '../../trpc';
import { Prisma, prisma } from '../../../../../prisma/client';
import ollama from '../../../services/ollama';
import { TRPCError } from '@trpc/server';

const searchNotesInput = z.string();
const chunkLimit = 8;

type RawChunkRow = {
  id: string;
  noteId: string;
  chunkIndex: number;
  section: string | null;
  startChar: number;
  endChar: number;
  content: string;
  title: string | null;
  storedDate: Date | null;
  distance: number;
};

type NoteReference = {
  noteId: string;
  index: number;
  title: string;
  storedDate: string | null;
};

type ChatStreamChunk = {
  message?: { content?: string };
  done?: boolean;
  [key: string]: unknown;
};

type SearchNotesStreamItem =
  | { type: 'references'; references: NoteReference[] }
  | (ChatStreamChunk & { type: 'data' });

function formatDateForModel(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0] ?? null;
}

export const searchNotes = authenticatedProcedure
  .input(searchNotesInput)
  .query(async opts => {
    const { chatModel, embeddingModel } = opts.ctx.user;

    if (chatModel === null) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No chat model chosen.',
      });
    }

    if (embeddingModel === null) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No embedding model chosen.',
      });
    }

    const embeddedPrompt = await ollama.embeddings({
      model: embeddingModel,
      prompt: opts.input,
    });

    const promptEmbedding = embeddedPrompt.embedding ?? null;

    if (!Array.isArray(promptEmbedding) || promptEmbedding.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to embed prompt.',
      });
    }

    const promptVectorLiteral = `[${promptEmbedding.join(',')}]`;
    const vector = Prisma.raw(`'${promptVectorLiteral}'::vector`);

    const rows = await prisma.$queryRaw<RawChunkRow[]>(Prisma.sql`
      SELECT
        c."id",
        c."noteId",
        c."chunkIndex",
        c."content",
        n."title",
        n."storedDate",
        c.embedding <=> ${vector} AS "distance"
      FROM "Chunk" AS c
      INNER JOIN "Note" AS n ON n."id" = c."noteId"
      WHERE n."userId" = ${opts.ctx.userId}
      AND c.embedding <=> ${vector} <= 0.6
      ORDER BY "distance", n."storedDate" DESC NULLS LAST
      LIMIT ${Prisma.raw(chunkLimit.toString())}
    `);

    const noteGroups = new Map<
      string,
      {
        noteId: string;
        title: string | null;
        storedDate: Date | null;
        closestDistance: number;
        chunks: RawChunkRow[];
      }
    >();

    for (const row of rows) {
      const group = noteGroups.get(row.noteId);
      if (!group) {
        noteGroups.set(row.noteId, {
          noteId: row.noteId,
          title: row.title,
          storedDate: row.storedDate,
          closestDistance: row.distance,
          chunks: [row],
        });
        continue;
      }

      group.chunks.push(row);
      group.closestDistance = Math.min(group.closestDistance, row.distance);
      if (!group.title && row.title) {
        group.title = row.title;
      }
      if (!group.storedDate && row.storedDate) {
        group.storedDate = row.storedDate;
      }
    }

    const sortedGroups = Array.from(noteGroups.values()).sort((a, b) => {
      const aTime = a.storedDate?.getTime() ?? 0;
      const bTime = b.storedDate?.getTime() ?? 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return a.closestDistance - b.closestDistance;
    });

    const references: NoteReference[] = sortedGroups.map((group, index) => ({
      noteId: group.noteId,
      index: index + 1,
      title: group.title?.trim() || 'Untitled note',
      storedDate: group.storedDate ? group.storedDate.toISOString() : null,
    }));

    const context = sortedGroups.length
      ? sortedGroups
          .map((group, idx) => {
            const savedDate = formatDateForModel(group.storedDate);
            const header = `[N${idx + 1}] ${group.title?.trim() || 'Untitled note'}${
              savedDate ? ` (saved ${savedDate})` : ''
            }`;

            const chunkDescriptions = group.chunks
              .sort((a, b) => a.chunkIndex - b.chunkIndex)
              .map(chunk => {
                return `Chunk ${chunk.chunkIndex + 1} (${chunk.distance}):\n${chunk.content}`;
              })
              .join('\n\n');

            return [header, chunkDescriptions].filter(Boolean).join('\n\n');
          })
          .join('\n\n')
      : 'No related notes were found for this question.';

    const systemContent = [
      "You are an AI assistant that answers using the user's personal notes as the primary knowledge source.",
      'Notes are referenced with labels like [N1] and include the date they were saved. Prefer newer notes when they conflict with older ones.',
      'Cite the relevant note labels (e.g., [N1]) whenever you rely on their information.',
      'If the notes do not contain the answer, acknowledge that and use general knowledge to help answer the question without making up facts.',
      'Keep formatting clear and structured so the user can skim the result.',
    ].join('\n');

    console.log(context);

    const chatStream = await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'system',
          content: context,
        },
        {
          role: 'user',
          content: opts.input,
        },
      ],
      stream: true,
    });

    async function* streamWithReferences(): AsyncGenerator<SearchNotesStreamItem> {
      yield { type: 'references', references };

      for await (const part of chatStream as AsyncIterable<ChatStreamChunk>) {
        yield { ...part, type: 'data' as const };
      }
    }

    return streamWithReferences();
  });
