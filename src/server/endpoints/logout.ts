import { RouteHandlerMethod } from 'fastify';
import { authService } from '../services/auth';

/**
 * Handles user logout by clearing authentication cookies and redirecting to the home page.
 */
export const logoutHandler: RouteHandlerMethod = async (req, res) => {
  try {
    await authService.invalidateTokens(req);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.code(200).send('Ok');
  } catch (err) {
    return res.code(500).send('Internal Server Error');
  }
};
