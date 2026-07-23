import { Router } from "express";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { db } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { NotFoundError, ForbiddenError } from "../lib/errors";
import { UPLOADS_ROOT } from "../lib/upload";

const router = Router();

router.use(requireAuth);

router.get(
  "/*",
  asyncHandler(async (req, res) => {
    const joined = (req.params[0] as string) ?? "";

    // Block path traversal.
    if (joined.includes("..") || joined.includes("\0")) {
      throw new ForbiddenError();
    }

    const abs = path.join(UPLOADS_ROOT, joined);
    if (!abs.startsWith(UPLOADS_ROOT)) {
      throw new ForbiddenError();
    }

    const segments = joined.split("/");

    if (segments[0] === "babies" && segments[1]) {
      const babyId = segments[1];
      const link = await db.babyParent.findUnique({
        where: { userId_babyId: { userId: req.user!.id, babyId } },
      });
      if (!link) throw new NotFoundError();
    } else if (segments[0] === "users" && segments[1]) {
      if (segments[1] !== req.user!.id) throw new NotFoundError();
    } else {
      throw new NotFoundError();
    }

    if (!fs.existsSync(abs)) throw new NotFoundError();

    const contentType = mime.lookup(abs) || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    fs.createReadStream(abs).pipe(res);
  })
);

export default router;
