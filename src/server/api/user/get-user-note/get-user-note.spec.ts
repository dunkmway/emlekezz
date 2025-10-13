import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Get user note', () => {
  let requestingUser: User;
  let getUserNote: ReturnType<
    typeof appRouter.createCaller
  >['user']['getUserNote'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    getUserNote = appRouter
      .createCaller({ userId: requestingUser.id })
      .user
      .getUserNote;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});