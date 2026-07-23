import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens";
import { UnauthorizedError } from "../lib/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub };
      req.authVia = "bearer";
      return next();
    } catch {
      return next(new UnauthorizedError());
    }
  }

  const cookieToken = req.cookies?.access_token as string | undefined;
  if (cookieToken) {
    try {
      const payload = verifyAccessToken(cookieToken);
      req.user = { id: payload.sub };
      req.authVia = "cookie";
      return next();
    } catch {
      return next(new UnauthorizedError());
    }
  }

  return next(new UnauthorizedError());
}
