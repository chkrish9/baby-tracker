import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess, requireSectionAccess } from "../middleware/ownership";
import { appointmentCreateSchema, appointmentUpdateSchema } from "../lib/validation";
import { NotFoundError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);
router.use(requireSectionAccess("DOCTOR_VISITS"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const appointments = await db.doctorAppointment.findMany({
      where: { babyId: req.params.babyId },
      orderBy: { date: "desc" },
    });
    res.json(appointments);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = appointmentCreateSchema.parse(req.body);
    const appointment = await db.doctorAppointment.create({ data: { babyId: req.params.babyId, ...data } });
    res.status(201).json(appointment);
  })
);

router.get(
  "/:appointmentId",
  asyncHandler(async (req, res) => {
    const { babyId, appointmentId } = req.params;
    const appointment = await db.doctorAppointment.findUnique({ where: { id: appointmentId } });
    if (!appointment || appointment.babyId !== babyId) throw new NotFoundError();
    res.json(appointment);
  })
);

router.patch(
  "/:appointmentId",
  asyncHandler(async (req, res) => {
    const { babyId, appointmentId } = req.params;
    const data = appointmentUpdateSchema.parse(req.body);

    const existing = await db.doctorAppointment.findUnique({ where: { id: appointmentId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const appointment = await db.doctorAppointment.update({ where: { id: appointmentId }, data });
    res.json(appointment);
  })
);

router.delete(
  "/:appointmentId",
  asyncHandler(async (req, res) => {
    const { babyId, appointmentId } = req.params;
    const existing = await db.doctorAppointment.findUnique({ where: { id: appointmentId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.doctorAppointment.delete({ where: { id: appointmentId } });
    res.status(204).end();
  })
);

export default router;
