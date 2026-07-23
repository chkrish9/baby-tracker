import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess, requireSectionAccess } from "../middleware/ownership";
import { doctorNoteCreateSchema, doctorNoteUpdateSchema } from "../lib/validation";
import { findNextAppointmentId } from "../lib/appointments";
import { NotFoundError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);
router.use(requireSectionAccess("DOCTOR_VISITS"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const where: Prisma.DoctorNoteWhereInput = { babyId };
    const appointmentId = req.query.appointmentId as string | undefined;
    if (appointmentId === "unassigned") where.appointmentId = null;
    else if (appointmentId) where.appointmentId = appointmentId;

    const notes = await db.doctorNote.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json(notes);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const data = doctorNoteCreateSchema.parse(req.body);

    const payload = { ...data };
    if (payload.appointmentId === undefined) {
      payload.appointmentId = await findNextAppointmentId(babyId);
    }

    const note = await db.doctorNote.create({ data: { babyId, ...payload } });
    res.status(201).json(note);
  })
);

router.patch(
  "/:noteId",
  asyncHandler(async (req, res) => {
    const { babyId, noteId } = req.params;
    const data = doctorNoteUpdateSchema.parse(req.body);

    const existing = await db.doctorNote.findUnique({ where: { id: noteId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const note = await db.doctorNote.update({ where: { id: noteId }, data });
    res.json(note);
  })
);

router.delete(
  "/:noteId",
  asyncHandler(async (req, res) => {
    const { babyId, noteId } = req.params;
    const existing = await db.doctorNote.findUnique({ where: { id: noteId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.doctorNote.delete({ where: { id: noteId } });
    res.status(204).end();
  })
);

export default router;
