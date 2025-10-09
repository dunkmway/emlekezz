import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authenticatedProcedure } from './../../trpc';

const upgetNoteInput = z.object({
  content: z.string().nullish(),
});

const upgetNoteOutput = z.object({
  content: z.string().nullable(),
});

export const upgetNote = authenticatedProcedure
  .input(upgetNoteInput)
  .output(upgetNoteOutput)
  .mutation(async opts => {
    const possible = await prisma.note.findFirst({
      where: { storedDate: null, userId: opts.ctx.userId },
    });

    if (possible) {
      return prisma.note.update({
        where: { id: possible.id },
        data: {
          content: opts.input.content,
        },
      });
    } else {
      return prisma.note.create({
        data: {
          content: opts.input.content,
          userId: opts.ctx.userId,
        },
      });
    }
  });
