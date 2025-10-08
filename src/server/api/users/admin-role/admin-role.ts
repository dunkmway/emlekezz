import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';

const adminRoleInput = z.object({
  userId: z.string(),
  makeAdmin: z.boolean(),
});

const adminRoleOutput = z.void();

export const adminRole = authorizedProcedure
  .meta({ requiredPermissions: ['manage-users'] })
  .input(adminRoleInput)
  .output(adminRoleOutput)
  .mutation(async opts => {
    await prisma.user.update({
      where: { id: opts.input.userId },
      data: {
        roles: {
          set: opts.input.makeAdmin ? ['admin'] : [],
        },
      },
    });
  });
