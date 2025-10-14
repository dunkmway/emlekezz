import { z } from 'zod/v4';
import { authenticatedProcedure } from '../../trpc';
import { prisma } from '../../../../../prisma/client';

const deleteNoteInput = z.object({
  id: z.string(),
});

const deleteNoteOutput = z.void();

export const deleteNote = authenticatedProcedure
  .input(deleteNoteInput)
  .output(deleteNoteOutput)
  .mutation(async opts => {
    await prisma.note.delete({
      where: {
        id: opts.input.id,
        userId: opts.ctx.userId,
      },
    });
  });
