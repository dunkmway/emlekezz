import { RouteHandlerMethod } from 'fastify';
import { prisma } from '../../../prisma/client';
import { compare } from 'bcryptjs';
import { authService } from '../services/auth';

/**
 * Handles user login requests by redirecting to the appropriate authentication endpoint.
 */
export const loginHandler: RouteHandlerMethod = async (req, res) => {
  try {
    const { username, password } = req.body as Partial<Record<string, string>>;

    if (!username || !password) {
      return res.code(400).send('Bad Request');
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (user === null) {
      return res.code(401).send('Unauthorized');
    }

    if (await compare(password, user.passwordHash)) {
      await authService.createAndSetTokens(user.id, res);
      return res.code(200).send('Ok');
    } else {
      return res.code(401).send('Unauthorized');
    }
  } catch (err) {
    return res.code(500).send('Internal Server Error');
  }
};
