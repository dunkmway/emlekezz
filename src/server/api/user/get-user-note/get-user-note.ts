import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authenticatedProcedure } from '../../trpc';
import { rethrowKnownPrismaError } from '../../../utils/prisma';

const getUserNoteInput = z.object({
  id: z.string(),
});

const getUserNoteOutput = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string().nullable(),
});

export const getUserNote = authenticatedProcedure
  .input(getUserNoteInput)
  .output(getUserNoteOutput)
  .mutation(async opts => {
    try {
      return await prisma.note.findUniqueOrThrow({
        where: {
          id: opts.input.id,
          userId: opts.ctx.userId,
        },
        select: {
          id: true,
          title: true,
          content: true,
        },
      });
    } catch (e) {
      rethrowKnownPrismaError(e);
      throw e;
    }
  });
