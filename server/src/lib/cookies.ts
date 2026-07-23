import { randomBytes } from "crypto";
import type { Response } from "express";
import { env } from "../config/env";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_REMEMBERED_SECONDS,
  REFRESH_TOKEN_TTL_SESSION_SECONDS,
} from "./tokens";

const isProd = env.NODE_ENV === "production";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function setAuthCookies(
  res: Response,
  { accessToken, refreshToken, rememberMe }: { accessToken: string; refreshToken: string; rememberMe: boolean }
) {
  const csrfToken = generateCsrfToken();

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/auth",
    // Session cookie (no maxAge) when not remembered; otherwise persists 30 days.
    ...(rememberMe ? { maxAge: REFRESH_TOKEN_TTL_REMEMBERED_SECONDS * 1000 } : {}),
  });

  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(rememberMe
      ? { maxAge: REFRESH_TOKEN_TTL_REMEMBERED_SECONDS * 1000 }
      : { maxAge: REFRESH_TOKEN_TTL_SESSION_SECONDS * 1000 }),
  });
}

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/auth" });
  res.clearCookie("csrf_token", { path: "/" });
}
