import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';
import { ROLES } from '../../../../security';
import { hash } from 'bcryptjs';
import { rethrowKnownPrismaError } from '../../../utils/prisma';

const createUserInput = z.object({
  role: z.literal(ROLES),
  username: z.string(),
  password: z.string(),
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
          roles: [opts.input.role],
          passwordHash: await hash(opts.input.password, 10),
        },
      });
    } catch (e) {
      rethrowKnownPrismaError(e);
      throw e;
    }
  });
