import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';

const deleteUserInput = z.object({
  id: z.string(),
});

const deleteUserOutput = z.void();

export const deleteUser = authorizedProcedure
  .meta({ requiredPermissions: ['manage-users'] })
  .input(deleteUserInput)
  .output(deleteUserOutput)
  .mutation(async opts => {
    try {
      await prisma.user.delete({
        where: {
          id: opts.input.id,
        },
      });
    } catch (_) {}
  });
