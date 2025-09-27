import { FastifyReply, FastifyRequest } from 'fastify';
import { jwt } from './jwt';
import type _ from '@fastify/cookie';

type TokenType = 'access' | 'refresh';

class AuthService {
  /**
   * Handles authentication tokens by verifying and refreshing access and refresh tokens from cookies.
   *
   * - If the access token is missing or invalid, attempts to verify and refresh the refresh token.
   * - If the refresh token is valid, issues new access and refresh tokens and sets them as cookies.
   * - Returns the subject (`sub`) from the valid token payload, or `null` if authentication fails.
   *
   * @param req - The request object containing cookies.
   * @param res - The response object used to set cookies.
   * @returns A promise that resolves to the authenticated user's ID or `null` if authentication fails.
   */
  async handleTokens(req: FastifyRequest, res: FastifyReply) {
    const accessToken = req.cookies['access_token'];
    const refreshToken = req.cookies['refresh_token'];

    const checkRefreshToken = async () => {
      if (!refreshToken) {
        return null;
      }
      const refreshPayload = await jwt.verify(refreshToken);
      if (!refreshPayload || !refreshPayload.sub) {
        return null;
      }
      await jwt.invalidate(refreshToken);
      await this.createAndSetTokens(refreshPayload.sub, res);
      return refreshPayload.sub;
    };

    if (!accessToken) {
      return await checkRefreshToken();
    }
    const accessPayload = await jwt.verify(accessToken);
    if (!accessPayload || !accessPayload.sub) {
      return await checkRefreshToken();
    }

    return accessPayload.sub;
  }

  /**
   * Generates access and refresh JWT tokens for the specified user and sets them as HTTP-only cookies in the response.
   *
   * @param userId - The unique identifier of the user for whom the tokens are being created.
   * @param res - The Fastify response object used to set cookies.
   *
   * @remarks
   * - The access token is set as the 'access_token' cookie.
   * - The refresh token is set as the 'refresh_token' cookie.
   * - Both cookies are HTTP-only, have their respective expiration times, and are set for the root path.
   */
  async createAndSetTokens(userId: string, res: FastifyReply) {
    const access = await jwt.createAccessToken(userId);
    this.setToken('access', access.token, access.timeSpan, res);
    const refresh = await jwt.createRefreshToken(userId);
    this.setToken('refresh', refresh.token, refresh.timeSpan, res);
  }

  /**
   * Sets a cookie for the specified token type ('refresh' or 'access') on the response object.
   */
  private setToken(
    type: TokenType,
    token: string,
    maxAge: number,
    res: FastifyReply
  ) {
    res.cookie(`${type}_token`, token, {
      httpOnly: true,
      maxAge,
      secure: 'auto',
      path: '/',
      sameSite: 'strict',
    });
  }

  /**
   * Invalidates the access and refresh tokens found in the request cookies.
   *
   * This method retrieves the `access_token` and `refresh_token` from the incoming
   * request's cookies and calls the `jwt.invalidate` function for each token if present.
   * This is typically used to log out a user or revoke their authentication tokens.
   */
  async invalidateTokens(req: FastifyRequest) {
    const accessToken = req.cookies['access_token'];
    const refreshToken = req.cookies['refresh_token'];

    if (accessToken) {
      await jwt.invalidate(accessToken);
    }
    if (refreshToken) {
      await jwt.invalidate(refreshToken);
    }
  }
}

/**
 * Service for handling authentication tokens using JWT in a Fastify application.
 *
 * The `AuthService` class provides methods to:
 * - Verify and refresh access and refresh tokens from HTTP cookies.
 * - Issue new tokens and set them as HTTP-only cookies.
 * - Invalidate tokens for logout or revocation purposes.
 *
 * @remarks
 * - Tokens are stored as HTTP-only cookies named `access_token` and `refresh_token`.
 * - Token cookies are set with secure, strict, and root path options for security.
 * - The service supports automatic token refresh if the access token is expired but the refresh token is valid.
 *
 * @example
 * ```typescript
 * const userId = await authService.handleTokens(request, reply);
 * if (userId) {
 *   // Authenticated
 * } else {
 *   // Not authenticated
 * }
 * ```
 */
export const authService = new AuthService();
