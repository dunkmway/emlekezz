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
          .map((chunk, index) => `Note Chunk ${index + 1}:\n${chunk.content}`)
          .join('\n\n')
      : 'No related notes were found for this question.';

    return await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: `
            You are an AI assistant designed to answer questions using the user's personal notes as your primary knowledge source.
            Sometimes the context will be "No related notes were found for this question", in this case you should decide if the question for the user can be answered in general without any specific notes,
            essentially acting like a general purpose LLM. Other times you should tell the user that there are not any relevant notes on the topic.`,
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
