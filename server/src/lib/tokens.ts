import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_REMEMBERED_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const REFRESH_TOKEN_TTL_SESSION_SECONDS = 7 * 24 * 60 * 60; // 7 days (JWT-internal upper bound for session-only cookies)

interface AccessTokenPayload {
  sub: string;
  tokenType: "access";
}

interface RefreshTokenPayload {
  sub: string;
  tokenType: "refresh";
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, tokenType: "access" } satisfies AccessTokenPayload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function signRefreshToken(userId: string, rememberMe: boolean): string {
  const ttl = rememberMe ? REFRESH_TOKEN_TTL_REMEMBERED_SECONDS : REFRESH_TOKEN_TTL_SESSION_SECONDS;
  return jwt.sign({ sub: userId, tokenType: "refresh" } satisfies RefreshTokenPayload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: ttl,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as jwt.JwtPayload;
  if (payload.tokenType !== "access" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token");
  }
  return { sub: payload.sub, tokenType: "access" };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
  if (payload.tokenType !== "refresh" || typeof payload.sub !== "string") {
    throw new Error("Invalid refresh token");
  }
  return { sub: payload.sub, tokenType: "refresh" };
}
