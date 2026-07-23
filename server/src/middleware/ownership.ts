import type { NextFunction, Request, Response } from "express";
import type { ParentSection } from "@prisma/client";
import { db } from "../lib/db";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export async function requireBabyAccess(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  const { babyId } = req.params;

  const link = await db.babyParent.findUnique({
    where: { userId_babyId: { userId: req.user.id, babyId } },
  });
  if (!link) return next(new ForbiddenError());

  req.babyParentLink = link;
  next();
}

export function requireOwnerRole(req: Request, _res: Response, next: NextFunction) {
  if (!req.babyParentLink || req.babyParentLink.role !== "OWNER") {
    return next(new ForbiddenError("Only the owner can perform this action"));
  }
  next();
}

export function requireSectionAccess(section: ParentSection) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const link = req.babyParentLink;
    if (!link) return next(new ForbiddenError());
    if (link.role === "OWNER" || link.sections.includes(section)) return next();
    next(new ForbiddenError());
  };
}
