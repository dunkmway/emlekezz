import { deleteNote } from './user/delete-note/delete-note';
import { getUserNote } from './user/get-user-note/get-user-note';
import { getUserNotes } from './user/get-user-notes/get-user-notes';
import { saveDraft } from './draft/save-draft/save-draft';
import { searchNotes } from './chat/search-notes/search-notes';
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
import { upgetDraft } from './draft/upget-draft/upget-draft';
import { router } from './trpc';

export const appRouter = router({
  draft: {
    saveDraft,
    upgetDraft,
  },
  chat: {
    searchNotes,
  },
  user: {
    deleteNote,
    getUserNote,
    getUserNotes,
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
});
