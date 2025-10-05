import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';

const getUsersInput = z.null();

const getUsersOutput = z.array(
  z.object({
    id: z.string(),
    username: z.string(),
    roles: z.array(z.string()),
  })
);

export const getUsers = authorizedProcedure
  .meta({ requiredPermissions: ['manage-users'] })
  .input(getUsersInput)
  .output(getUsersOutput)
  .mutation(async opts => {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        roles: true,
      },
    });
  });
