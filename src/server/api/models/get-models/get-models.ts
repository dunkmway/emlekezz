import { z } from 'zod/v4';
import { authenticatedProcedure } from '../../trpc';
import ollama from '../../../services/ollama';
import { prisma } from '../../../../../prisma/client';

const getModelsInput = z.null();

const getModelsOutput = z.array(
  z.object({
    name: z.string(),
    size: z.number(),
    usedForEmbeddings: z.boolean(),
  })
);

type ModelWithUasge = {
  name: string;
  size: number;
  usedForEmbeddings: boolean;
};

export const getModels = authenticatedProcedure
  .input(getModelsInput)
  .output(getModelsOutput)
  .mutation(async opts => {
    const models = (await ollama.list()).models;

    const modelWithUsage: ModelWithUasge[] = [];
    for (const model of models) {
      const modelUseCount = await prisma.user.count({
        where: {
          embeddingModel: model.name,
        },
      });

      modelWithUsage.push({
        name: model.name,
        size: model.size,
        usedForEmbeddings: modelUseCount > 0,
      });
    }

    return modelWithUsage;
  });
