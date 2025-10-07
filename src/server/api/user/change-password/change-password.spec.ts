import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Change password', () => {
  let requestingUser: User;
  let changePassword: ReturnType<
    typeof appRouter.createCaller
  >['user']['changePassword'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    changePassword = appRouter
      .createCaller({ userId: requestingUser.id })
      .user
      .changePassword;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});