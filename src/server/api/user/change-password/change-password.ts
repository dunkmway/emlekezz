import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authenticatedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { compare, hash } from 'bcryptjs';

const changePasswordInput = z.object({
  old: z.string().trim().min(1),
  new: z.string().trim().min(1),
});

const changePasswordOutput = z.void();

export const changePassword = authenticatedProcedure
  .input(changePasswordInput)
  .output(changePasswordOutput)
  .mutation(async opts => {
    if (await compare(opts.input.old, opts.ctx.user.passwordHash)) {
      await prisma.user.update({
        where: {
          id: opts.ctx.userId,
        },
        data: {
          passwordHash: await hash(opts.input.new, 10),
        },
      });
    } else {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Current Password is incorrect',
      });
    }
  });
