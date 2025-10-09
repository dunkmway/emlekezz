import { z } from 'zod/v4';
import { authenticatedProcedure } from '../../trpc';
import { Prisma, prisma } from '../../../../../prisma/client';
import ollama from '../../../services/ollama';
import { TRPCError } from '@trpc/server';

const searchNotesInput = z.string();
const chunkLimit = 8;

export const searchNotes = authenticatedProcedure
  .input(searchNotesInput)
  .query(async opts => {
    const { chatModel, embeddingModel } = await prisma.user.findUniqueOrThrow({
      where: { id: opts.ctx.userId },
      select: {
        chatModel: true,
        embeddingModel: true,
      },
    });

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

    const promptEmbedding =
      embeddedPrompt.embedding ?? embeddedPrompt.embedding ?? null;

    if (!Array.isArray(promptEmbedding) || promptEmbedding.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to embed prompt.',
      });
    }

    const promptVectorLiteral = `[${promptEmbedding.join(',')}]`;
    const vector = Prisma.raw(`'${promptVectorLiteral}'::vector`);

    const chunks = await prisma.$queryRaw<
      Array<{ id: string; noteId: string; content: string }>
    >(Prisma.sql`
      SELECT
        c."id",
        c."noteId",
        c."content"
      FROM "Chunk" AS c
      INNER JOIN "Note" AS n ON n."id" = c."noteId"
      WHERE n."userId" = ${opts.ctx.userId}
      ORDER BY c.embedding <-> ${vector}
      LIMIT ${Prisma.raw(chunkLimit.toString())}
    `);

    const context = chunks.length
      ? chunks
          .map(
            (chunk, index) =>
              `Chunk ${index + 1} (Note ${chunk.noteId}):\n${chunk.content}`
          )
          .join('\n\n')
      : 'No related note chunks were found for this question.';

    return await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content:
            'Use the provided note chunks to answer the user question. If they are irrelevant, say you do not know.',
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
  });
