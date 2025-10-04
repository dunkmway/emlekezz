import { upgetNote } from './upget-note';
import { router } from './trpc';

export const appRouter = router({
  upgetNote,
});
