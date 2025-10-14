import { z } from 'zod/v4';
import { authenticatedProcedure } from '../../trpc';
import ollama from '../../../services/ollama';

const getUserModelsInput = z.null();

const getUserModelsOutput = z.array(
  z.object({
    name: z.string(),
    size: z.number(),
    isChat: z.boolean(),
    isEmbedding: z.boolean(),
  })
);

export const getUserModels = authenticatedProcedure
  .input(getUserModelsInput)
  .output(getUserModelsOutput)
  .mutation(async opts => {
    const models = (await ollama.list()).models;

    const { chatModel, embeddingModel } = opts.ctx.user;

    return models.map(model => ({
      ...model,
      isChat: model.name === chatModel,
      isEmbedding: model.name === embeddingModel,
    }));
  });
