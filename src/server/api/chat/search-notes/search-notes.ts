import { z } from 'zod/v4';
import { authenticatedProcedure } from '../../trpc';
import { prisma } from '../../../../../prisma/client';
import ollama from '../../../services/ollama';
import { TRPCError } from '@trpc/server';

const searchNotesInput = z.string();

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

    return await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'user',
          content: opts.input,
        },
      ],
      stream: true,
    });
  });
