import type { BabyParent } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      authVia?: "cookie" | "bearer";
      babyParentLink?: BabyParent;
    }
  }
}

export {};
