import { z } from 'zod/v4';
import { authorizedProcedure } from '../../trpc';
import ollama from '../../../services/ollama';

const removeModelInput = z.string();

const removeModelOutput = z.string();

export const removeModel = authorizedProcedure
  .meta({ requiredPermissions: ['manage-models'] })
  .input(removeModelInput)
  .output(removeModelOutput)
  .mutation(async opts => {
    return (
      await ollama.delete({
        model: opts.input,
      })
    ).status;
  });
