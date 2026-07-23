import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess } from "../middleware/ownership";
import { photoUpdateSchema, appointmentLinksSchema } from "../lib/validation";
import { saveFile, deleteFile } from "../lib/upload";
import { uploadGalleryPhotos } from "../lib/multer";
import { NotFoundError, BadRequestError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const where: Prisma.BabyPhotoWhereInput = { babyId };
    const appointmentId = req.query.appointmentId as string | undefined;
    if (appointmentId === "unassigned") where.appointmentLinks = { none: {} };
    else if (appointmentId) where.appointmentLinks = { some: { appointmentId } };
    else if (req.query.flagged === "true") where.appointmentLinks = { some: {} };

    const photos = await db.babyPhoto.findMany({
      where,
      orderBy: { takenAt: "desc" },
      include: { appointmentLinks: { select: { appointmentId: true } } },
    });
    const result = photos.map(({ appointmentLinks, ...photo }) => ({
      ...photo,
      appointmentIds: appointmentLinks.map((l) => l.appointmentId),
    }));
    res.json(result);
  })
);

router.post(
  "/",
  uploadGalleryPhotos.array("files"),
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (!files.length) throw new BadRequestError("No files");

    // Validate the whole batch up front so a failure partway through never
    // leaves a partial write (multer's fileFilter/limits already reject
    // non-images and oversized files before this handler runs).
    const results = [];
    for (const file of files) {
      const relativePath = await saveFile(file, `babies/${babyId}/photos`);
      const photo = await db.babyPhoto.create({
        data: { babyId, path: relativePath, filename: file.originalname, size: file.size, mimeType: file.mimetype },
      });
      results.push(photo);
    }

    res.status(201).json(results);
  })
);

router.patch(
  "/:photoId",
  asyncHandler(async (req, res) => {
    const { babyId, photoId } = req.params;
    const data = photoUpdateSchema.parse(req.body);

    const existing = await db.babyPhoto.findUnique({ where: { id: photoId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const photo = await db.babyPhoto.update({ where: { id: photoId }, data });
    res.json(photo);
  })
);

router.delete(
  "/:photoId",
  asyncHandler(async (req, res) => {
    const { babyId, photoId } = req.params;
    const existing = await db.babyPhoto.findUnique({ where: { id: photoId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await deleteFile(existing.path).catch(() => {});
    await db.babyPhoto.delete({ where: { id: photoId } });
    res.status(204).end();
  })
);

router.put(
  "/:photoId/appointments",
  asyncHandler(async (req, res) => {
    const { babyId, photoId } = req.params;
    const { appointmentIds } = appointmentLinksSchema.parse(req.body);

    const photo = await db.babyPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.babyId !== babyId) throw new NotFoundError();

    const uniqueIds = Array.from(new Set(appointmentIds));
    if (uniqueIds.length > 0) {
      const validCount = await db.doctorAppointment.count({ where: { id: { in: uniqueIds }, babyId } });
      if (validCount !== uniqueIds.length) throw new BadRequestError("Invalid appointment selection");
    }

    await db.$transaction([
      db.photoAppointment.deleteMany({ where: { photoId } }),
      ...(uniqueIds.length > 0
        ? [db.photoAppointment.createMany({ data: uniqueIds.map((appointmentId) => ({ photoId, appointmentId })) })]
        : []),
    ]);

    res.json({ appointmentIds: uniqueIds });
  })
);

router.delete(
  "/:photoId/appointments/:appointmentId",
  asyncHandler(async (req, res) => {
    const { babyId, photoId, appointmentId } = req.params;
    const photo = await db.babyPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.babyId !== babyId) throw new NotFoundError();

    await db.photoAppointment.deleteMany({ where: { photoId, appointmentId } });
    res.status(204).end();
  })
);

export default router;
