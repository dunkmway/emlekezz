import { z } from 'zod/v4';
import { authorizedProcedure } from '../../trpc';
import ollama from '../../../services/ollama';

const getModelsInput = z.null();

const getModelsOutput = z.array(z.string());

export const getModels = authorizedProcedure
  .meta({ requiredPermissions: ['manage-models'] })
  .input(getModelsInput)
  .output(getModelsOutput)
  .mutation(async opts => {
    return (await ollama.list()).models.map(model => model.name);
  });
