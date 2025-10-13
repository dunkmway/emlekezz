import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authenticatedProcedure } from '../../trpc';

const getUserNotesInput = z.object({
  page: z.number(),
});

const getUserNotesOutput = z.array(
  z.object({
    id: z.string(),
    title: z.string().nullable(),
  })
);

export const getUserNotes = authenticatedProcedure
  .input(getUserNotesInput)
  .output(getUserNotesOutput)
  .mutation(async opts => {
    const PAGE_SIZE = 20;

    return await prisma.note.findMany({
      where: {
        userId: opts.ctx.userId,
        storedDate: {
          not: null,
        },
      },
      skip: opts.input.page * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: {
        storedDate: 'desc',
      },
      select: {
        id: true,
        title: true,
      },
    });
  });
