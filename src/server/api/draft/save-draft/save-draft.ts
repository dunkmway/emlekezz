import { z } from 'zod/v4';
import { Prisma, prisma } from '../../../../../prisma/client';
import { authenticatedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { generateTitle } from './generateTitle';
import { generateEmbeddings } from './generateEmbeddings';

const saveDraftInput = z.null();

const saveDraftOutput = z.void();

export const saveDraft = authenticatedProcedure
  .input(saveDraftInput)
  .output(saveDraftOutput)
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

    const { chatModel, embeddingModel } = opts.ctx.user;

    if (!embeddingModel) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No embedding model chosen.',
      });
    }

    console.log('[GENERATING EMBEDDINGS]');
    const embeddedChunks = await generateEmbeddings(
      content,
      embeddingModel,
      note.id
    );
    console.log('[EMBEDDINGS GENERATED]', embeddedChunks.length);

    console.log('[GENERATING TITLE]');
    const title = await generateTitle(content, chatModel);
    console.log('[TITLE GENERATED]', title);

    const storedDate = new Date();

    console.log('[SAVING NOTE]');
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

      if (embeddedChunks.length === 0) {
        return;
      }

      const values = embeddedChunks.map(chunk => {
        if (!Array.isArray(chunk.vector) || chunk.vector.length === 0) {
          throw new Error('Embedding vector missing for chunk');
        }

        if (chunk.vector.some(v => !Number.isFinite(v))) {
          throw new Error('Embedding vector contains non-finite values');
        }

        const vectorLiteral = `[${chunk.vector.join(',')}]`;

        return Prisma.sql`
          (${chunk.id}, ${note.id}, ${chunk.chunkIndex}, ${chunk.startChar}, ${chunk.endChar}, ${chunk.content}, ${Prisma.raw(`'${vectorLiteral}'::vector`)})
        `;
      });

      await tx.$executeRaw`
        INSERT INTO "Chunk" (
          "id",
          "noteId",
          "chunkIndex",
          "startChar",
          "endChar",
          "content",
          "embedding"
        )
        VALUES ${Prisma.join(values)}
      `;
    });
  });
