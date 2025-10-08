import { z } from 'zod/v4';
import { authorizedProcedure } from '../../trpc';
import ollama from '../../../services/ollama';
import { prisma } from '../../../../../prisma/client';

const removeModelInput = z.string();

const removeModelOutput = z.void();

export const removeModel = authorizedProcedure
  .meta({ requiredPermissions: ['manage-models'] })
  .input(removeModelInput)
  .output(removeModelOutput)
  .mutation(async opts => {
    // remove the model
    await ollama.delete({
      model: opts.input,
    });

    // remove the model as the selected model for all users
    await prisma.user.updateMany({
      where: { chatModel: opts.input },
      data: { chatModel: null },
    });

    await prisma.user.updateMany({
      where: { embeddingModel: opts.input },
      data: { embeddingModel: null },
    });
  });
