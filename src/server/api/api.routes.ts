import { changePassword } from './user/change-password/change-password';
import { removeModel } from './models/remove-model/remove-model';
import { pullModel } from './models/pull-model/pull-model';
import { getModels } from './models/get-models/get-models';
import { deleteUser } from './users/delete-user/delete-user';
import { createUser } from './users/create-user/create-user';
import { getUsers } from './users/get-users/get-users';
import { upgetNote } from './upget-note';
import { router } from './trpc';

export const appRouter = router({
  user: {
    changePassword,
  },
  models: {
    removeModel,
    pullModel,
    getModels,
  },
  users: {
    deleteUser,
    createUser,
    getUsers,
  },
  upgetNote,
});
