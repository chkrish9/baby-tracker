import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { userSettingsSchema, changePasswordSchema } from "../lib/validation";
import { hashPassword, comparePassword } from "../lib/password";
import { saveFile, deleteFile } from "../lib/upload";
import { uploadUserPhoto } from "../lib/multer";
import { BadRequestError, UnauthorizedError } from "../lib/errors";

const router = Router();

router.use(requireAuth);
router.use(requireCsrf);

router.get(
  "/settings",
  asyncHandler(async (req, res) => {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, theme: true, profilePhoto: true },
    });
    if (!user) throw new UnauthorizedError();
    res.json(user);
  })
);

router.patch(
  "/settings",
  asyncHandler(async (req, res) => {
    const data = userSettingsSchema.parse(req.body);
    const user = await db.user.update({
      where: { id: req.user!.id },
      data,
      select: { name: true, email: true, theme: true, profilePhoto: true },
    });
    res.json(user);
  })
);

router.post(
  "/password",
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await db.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new UnauthorizedError();

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) throw new BadRequestError("Current password is incorrect");

    const hashed = await hashPassword(newPassword);
    await db.user.update({ where: { id: req.user!.id }, data: { password: hashed } });

    res.json({ ok: true });
  })
);

router.post(
  "/photo",
  uploadUserPhoto.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw new BadRequestError("No file provided");

    const existing = await db.user.findUnique({ where: { id: req.user!.id }, select: { profilePhoto: true } });
    if (existing?.profilePhoto) await deleteFile(existing.profilePhoto).catch(() => {});

    const relativePath = await saveFile(file, `users/${req.user!.id}/profile`);
    const user = await db.user.update({
      where: { id: req.user!.id },
      data: { profilePhoto: relativePath },
      select: { profilePhoto: true },
    });

    res.json(user);
  })
);

export default router;
