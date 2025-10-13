import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';

describe('Get user notes', () => {
  let requestingUser: User;
  let getUserNotes: ReturnType<
    typeof appRouter.createCaller
  >['user']['getUserNotes'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: [],
      }),
    });
    getUserNotes = appRouter
      .createCaller({ userId: requestingUser.id })
      .user
      .getUserNotes;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});