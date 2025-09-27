import { createSecretKey, KeyObject, randomUUID } from 'crypto';
import { jwtVerify, SignJWT } from 'jose';
import {
  JWTExpired,
  JWTInvalid,
  JWTClaimValidationFailed,
  JWSInvalid,
  JWSSignatureVerificationFailed,
} from 'jose/errors';
import { prisma } from '../../../prisma/client';

class JWT {
  private _secret: KeyObject | undefined;
  private get secret() {
    if (!process.env['JWT_SECRET']) throw new Error('JWT Secret not defined');
    this._secret ??= createSecretKey(process.env['JWT_SECRET'], 'utf-8');
    return this._secret;
  }

  private async sign(userId: string, timeSpan: number) {
    if (!process.env['SELF_URL']) throw new Error('Self URL not defined');
    return await new SignJWT({ sub: userId, jti: randomUUID() })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(process.env['SELF_URL'])
      .setAudience(process.env['SELF_URL'])
      .setExpirationTime(Math.floor(Date.now() / 1000) + timeSpan)
      .sign(this.secret);
  }

  async createAccessToken(userId: string) {
    const timeSpan = parseInt(process.env['ACCESS_TOKEN_TIMESPAN'] || '3600');
    const token = await this.sign(userId, timeSpan);
    return { token, timeSpan };
  }

  async createRefreshToken(userId: string) {
    const timeSpan = parseInt(process.env['REFRESH_TOKEN_TIMESPAN'] || '86400');
    const token = await this.sign(userId, timeSpan);
    return { token, timeSpan };
  }

  /**
   * Verifies a JWT token, checks its validity, and ensures it is not blacklisted.
   *
   * @param token - The JWT token to verify.
   * @returns The decoded payload if the token is valid and not blacklisted; otherwise, returns `null`.
   */
  async verify(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: process.env['SELF_URL'],
        audience: process.env['SELF_URL'],
      });

      if (!payload.jti) {
        return null;
      }

      if (
        await prisma.jwtBlacklist.findUnique({ where: { id: payload.jti } })
      ) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT.verify Error:', error);
      if (
        error instanceof JWTExpired ||
        error instanceof JWTInvalid ||
        error instanceof JWTClaimValidationFailed ||
        error instanceof JWSInvalid ||
        error instanceof JWSSignatureVerificationFailed
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Invalidates a JWT by adding its unique identifier (`jti`) and expiration time to the blacklist.
   *
   * @param token - The JWT string to invalidate.
   */
  async invalidate(token: string) {
    const payload = await this.verify(token);
    if (!payload) return; // Token is already invalid
    await prisma.jwtBlacklist.create({
      data: { id: payload.jti!, exp: new Date(1000 * payload.exp!) },
    });
  }
}

/**
 * A service class for handling JSON Web Token (JWT) operations, including token creation, verification, and invalidation.
 *
 * This class provides methods to:
 * - Generate access and refresh tokens for a given user ID.
 * - Verify the validity of a JWT, including issuer/audience checks and blacklist validation.
 * - Invalidate tokens by adding their unique identifier (`jti`) to a blacklist.
 *
 * The class requires environment variables for configuration:
 * - `JWT_SECRET`: The secret key used for signing and verifying tokens.
 * - `SELF_URL`: The expected issuer and audience for tokens.
 * - `ACCESS_TOKEN_TIMESPAN`: (optional) The lifespan of access tokens in seconds (default: 3600).
 * - `REFRESH_TOKEN_TIMESPAN`: (optional) The lifespan of refresh tokens in seconds (default: 86400).
 *
 * The class expects a Prisma client instance to be set via `setPrisma()` for blacklist operations.
 */
export const jwt = new JWT();
