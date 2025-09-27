import { RouteHandlerMethod } from 'fastify';
import { authService } from '../services/auth';
import { prisma } from '../../../prisma/client';

/**
 * Factory function that creates a route handler for the "Who Am I" endpoint.
 * This handler authenticates the user using tokens from the request, retrieves the user's information,
 * and returns a subset of user properties if authentication and lookup are successful.
 *
 * @returns A route handler method that responds with user identity information or null if authentication fails.
 */
export const whoAmIHandler: RouteHandlerMethod = async (req, res) => {
  const userId = await authService.handleTokens(req, res);
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    permissions: user.permissions,
  };
};
