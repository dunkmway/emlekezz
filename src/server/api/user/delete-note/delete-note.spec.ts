import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Delete note', () => {
  let requestingUser: User;
  let deleteNote: ReturnType<
    typeof appRouter.createCaller
  >['user']['deleteNote'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    deleteNote = appRouter
      .createCaller({ userId: requestingUser.id })
      .user
      .deleteNote;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});