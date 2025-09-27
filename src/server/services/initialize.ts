import { hash } from 'bcryptjs';
import { prisma } from '../../../prisma/client';
import { Role } from '../../security';

const defaultUsername = 'admin' as const;
const defaultPassword = 'PLEASE_CHANGE_THIS_PASSWORD' as const;
const defaultRole: Role = 'admin' as const;

export function initializeApp() {
  firstUser();
}

async function firstUser() {
  // no users exist in the db
  // create the default user
  if ((await prisma.user.count({})) > 0) return;
  console.log('[INITIALIZING] Creating the first user');

  await prisma.user.create({
    data: {
      username: defaultUsername,
      passwordHash: await hash(defaultPassword, 10),
      roles: [defaultRole],
    },
  });

  console.log('[INITIALIZING] First user created');
  console.log(`[INITIALIZING] Username: ${defaultUsername}`);
  console.log(`[INITIALIZING] Password: ${defaultPassword}`);
}
