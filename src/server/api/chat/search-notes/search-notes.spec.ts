import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Search notes', () => {
  let requestingUser: User;
  let searchNotes: ReturnType<
    typeof appRouter.createCaller
  >['chat']['searchNotes'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    searchNotes = appRouter
      .createCaller({ userId: requestingUser.id })
      .chat
      .searchNotes;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});