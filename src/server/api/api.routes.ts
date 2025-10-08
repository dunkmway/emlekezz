import { getUserModels } from './user/get-user-models/get-user-models';
import { setModel } from './user/set-model/set-model';
import { adminRole } from './users/admin-role/admin-role';
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
    getUserModels,
    setModel,
    changePassword,
  },
  models: {
    removeModel,
    pullModel,
    getModels,
  },
  users: {
    adminRole,
    deleteUser,
    createUser,
    getUsers,
  },
  upgetNote,
});
