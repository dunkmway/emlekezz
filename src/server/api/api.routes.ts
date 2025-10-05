import { deleteUser } from './users/delete-user/delete-user';
import { createUser } from './users/create-user/create-user';
import { getUsers } from './users/get-users/get-users';
import { upgetNote } from './upget-note';
import { router } from './trpc';

export const appRouter = router({
  users: {
    deleteUser,
    createUser,
    getUsers,
  },
  upgetNote,
});
