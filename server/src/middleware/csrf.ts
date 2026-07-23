import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit cookie CSRF check. Only meaningful for cookie-authenticated
 * requests — a Bearer-token request carries no ambient credential, so it
 * can't be forged cross-site and is exempt.
 */
export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.authVia === "bearer") return next();

  const cookieToken = req.cookies?.csrf_token as string | undefined;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || typeof headerToken !== "string" || headerToken !== cookieToken) {
    return next(new ForbiddenError("Invalid CSRF token"));
  }

  next();
}
