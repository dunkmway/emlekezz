import { z } from 'zod/v4';
import { authorizedProcedure } from '../../trpc';
import ollama from '../../../services/ollama';
import { sleep } from '@trpc/server/unstable-core-do-not-import';

const pullModelInput = z.string();

export const pullModel = authorizedProcedure
  .meta({ requiredPermissions: ['manage-models'] })
  .input(pullModelInput)
  .query(async opts => {
    return await ollama.pull({
      model: opts.input,
      stream: true,
    });
  });
