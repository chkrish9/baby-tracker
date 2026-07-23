import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess } from "../middleware/ownership";
import { babyCreateSchema, babyUpdateSchema } from "../lib/validation";
import { babyDisplayName } from "../lib/utils";
import { saveFile, deleteFile } from "../lib/upload";
import { uploadProfilePhoto } from "../lib/multer";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

const router = Router();

router.use(requireAuth);
router.use(requireCsrf);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const babies = await db.baby.findMany({
      where: { parents: { some: { userId: req.user!.id } } },
      include: { parents: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(babies);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = babyCreateSchema.parse(req.body);

    const baby = await db.baby.create({
      data: {
        name: babyDisplayName(data),
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname || null,
        birthDate: data.birthDate,
        weight: data.weight ?? null,
        height: data.height ?? null,
        parents: { create: { userId: req.user!.id, role: "OWNER" } },
      },
      include: { parents: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    res.status(201).json(baby);
  })
);

router.get(
  "/:babyId",
  requireBabyAccess,
  asyncHandler(async (req, res) => {
    const baby = await db.baby.findUnique({
      where: { id: req.params.babyId },
      include: { parents: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!baby) throw new NotFoundError();
    res.json(baby);
  })
);

const handleJsonUpdate = asyncHandler(async (req, res) => {
  const { babyId } = req.params;
  const data = babyUpdateSchema.parse(req.body);

  const existing = await db.baby.findUnique({ where: { id: babyId } });
  if (!existing) throw new NotFoundError();

  const merged = {
    firstName: data.firstName ?? existing.firstName,
    lastName: data.lastName ?? existing.lastName,
    nickname: data.nickname !== undefined ? data.nickname : existing.nickname,
  };

  const baby = await db.baby.update({
    where: { id: babyId },
    data: {
      ...data,
      nickname: merged.nickname || null,
      name: babyDisplayName(merged),
    },
  });
  res.json(baby);
});

router.patch(
  "/:babyId",
  requireBabyAccess,
  (req, res, next) => {
    if (req.is("multipart/form-data")) return next();
    return handleJsonUpdate(req, res, next);
  },
  uploadProfilePhoto.single("profilePhoto"),
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file" });

    const existing = await db.baby.findUnique({ where: { id: babyId }, select: { profilePhoto: true } });
    if (existing?.profilePhoto) await deleteFile(existing.profilePhoto).catch(() => {});

    const relativePath = await saveFile(file, `babies/${babyId}/profile`);
    const baby = await db.baby.update({ where: { id: babyId }, data: { profilePhoto: relativePath } });
    res.json(baby);
  })
);

router.delete(
  "/:babyId",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const { babyId } = req.params;

    const link = await db.babyParent.findUnique({ where: { userId_babyId: { userId: req.user.id, babyId } } });
    if (!link) throw new ForbiddenError();
    if (link.role !== "OWNER") throw new ForbiddenError("Only the owner can delete this baby");

    await db.baby.delete({ where: { id: babyId } });
    res.status(204).end();
  })
);

export default router;
