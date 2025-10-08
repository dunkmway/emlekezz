import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';
import { hash } from 'bcryptjs';
import { rethrowKnownPrismaError } from '../../../utils/prisma';

const createUserInput = z.object({
  isAdmin: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
});

const createUserOutput = z.void();

export const createUser = authorizedProcedure
  .meta({ requiredPermissions: ['manage-users'] })
  .input(createUserInput)
  .output(createUserOutput)
  .mutation(async opts => {
    try {
      await prisma.user.create({
        data: {
          username: opts.input.username,
          roles: opts.input.isAdmin ? ['admin'] : undefined,
          passwordHash: await hash(opts.input.password, 10),
        },
      });
    } catch (e) {
      rethrowKnownPrismaError(e);
      throw e;
    }
  });
