import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Get models', () => {
  let requestingUser: User;
  let getModels: ReturnType<
    typeof appRouter.createCaller
  >['models']['getModels'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    getModels = appRouter
      .createCaller({ userId: requestingUser.id })
      .models
      .getModels;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});