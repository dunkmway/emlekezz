import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Set model', () => {
  let requestingUser: User;
  let setModel: ReturnType<
    typeof appRouter.createCaller
  >['user']['setModel'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    setModel = appRouter
      .createCaller({ userId: requestingUser.id })
      .user
      .setModel;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});