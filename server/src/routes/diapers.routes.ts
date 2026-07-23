import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess, requireSectionAccess } from "../middleware/ownership";
import { diaperCreateSchema, diaperUpdateSchema, appointmentLinksSchema } from "../lib/validation";
import { NotFoundError, BadRequestError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);
router.use(requireSectionAccess("LOGS"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const where: Prisma.DiaperLogWhereInput = { babyId };
    const appointmentId = req.query.appointmentId as string | undefined;
    if (appointmentId === "unassigned") where.appointmentLinks = { none: {} };
    else if (appointmentId) where.appointmentLinks = { some: { appointmentId } };
    else if (req.query.flagged === "true") where.appointmentLinks = { some: {} };

    const logs = await db.diaperLog.findMany({
      where,
      orderBy: { loggedAt: "desc" },
      take: 500,
      include: { appointmentLinks: { select: { appointmentId: true } } },
    });
    const result = logs.map(({ appointmentLinks, ...log }) => ({
      ...log,
      appointmentIds: appointmentLinks.map((l) => l.appointmentId),
    }));
    res.json(result);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = diaperCreateSchema.parse(req.body);
    const log = await db.diaperLog.create({ data: { babyId: req.params.babyId, ...data } });
    res.status(201).json(log);
  })
);

router.patch(
  "/:logId",
  asyncHandler(async (req, res) => {
    const { babyId, logId } = req.params;
    const data = diaperUpdateSchema.parse(req.body);

    const existing = await db.diaperLog.findUnique({ where: { id: logId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const log = await db.diaperLog.update({ where: { id: logId }, data });
    res.json(log);
  })
);

router.delete(
  "/:logId",
  asyncHandler(async (req, res) => {
    const { babyId, logId } = req.params;
    const existing = await db.diaperLog.findUnique({ where: { id: logId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.diaperLog.delete({ where: { id: logId } });
    res.status(204).end();
  })
);

router.put(
  "/:logId/appointments",
  asyncHandler(async (req, res) => {
    const { babyId, logId } = req.params;
    const { appointmentIds } = appointmentLinksSchema.parse(req.body);

    const log = await db.diaperLog.findUnique({ where: { id: logId } });
    if (!log || log.babyId !== babyId) throw new NotFoundError();

    const uniqueIds = Array.from(new Set(appointmentIds));
    if (uniqueIds.length > 0) {
      const validCount = await db.doctorAppointment.count({ where: { id: { in: uniqueIds }, babyId } });
      if (validCount !== uniqueIds.length) throw new BadRequestError("Invalid appointment selection");
    }

    await db.$transaction([
      db.diaperAppointment.deleteMany({ where: { diaperLogId: logId } }),
      ...(uniqueIds.length > 0
        ? [db.diaperAppointment.createMany({ data: uniqueIds.map((appointmentId) => ({ diaperLogId: logId, appointmentId })) })]
        : []),
    ]);

    res.json({ appointmentIds: uniqueIds });
  })
);

router.delete(
  "/:logId/appointments/:appointmentId",
  asyncHandler(async (req, res) => {
    const { babyId, logId, appointmentId } = req.params;
    const log = await db.diaperLog.findUnique({ where: { id: logId } });
    if (!log || log.babyId !== babyId) throw new NotFoundError();

    await db.diaperAppointment.deleteMany({ where: { diaperLogId: logId, appointmentId } });
    res.status(204).end();
  })
);

export default router;
