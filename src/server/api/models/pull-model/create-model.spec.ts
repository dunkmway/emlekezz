import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Create model', () => {
  let requestingUser: User;
  let createModel: ReturnType<
    typeof appRouter.createCaller
  >['models']['createModel'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    createModel = appRouter
      .createCaller({ userId: requestingUser.id })
      .models
      .createModel;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});