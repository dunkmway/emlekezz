import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Get user models', () => {
  let requestingUser: User;
  let getUserModels: ReturnType<
    typeof appRouter.createCaller
  >['user']['getUserModels'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    getUserModels = appRouter
      .createCaller({ userId: requestingUser.id })
      .user
      .getUserModels;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});