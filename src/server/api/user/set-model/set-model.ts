import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authenticatedProcedure } from '../../trpc';

const setModelInput = z.object({
  model: z.string(),
  type: z.literal(['chat', 'embedding']),
});

const setModelOutput = z.void();

export const setModel = authenticatedProcedure
  .input(setModelInput)
  .output(setModelOutput)
  .mutation(async opts => {
    await prisma.user.update({
      where: { id: opts.ctx.userId },
      data: {
        chatModel: opts.input.type === 'chat' ? opts.input.model : undefined,
        embeddingModel:
          opts.input.type === 'embedding'
            ? opts.ctx.user.embeddingModel === null
              ? opts.input.model
              : undefined
            : undefined,
      },
    });
  });
