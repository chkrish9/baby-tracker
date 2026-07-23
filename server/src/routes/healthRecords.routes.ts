import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess } from "../middleware/ownership";
import { healthRecordCreateSchema, healthRecordUpdateSchema } from "../lib/validation";
import { NotFoundError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const records = await db.healthRecord.findMany({ where: { babyId: req.params.babyId }, orderBy: { date: "desc" } });
    res.json(records);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = healthRecordCreateSchema.parse(req.body);
    const record = await db.healthRecord.create({ data: { babyId: req.params.babyId, ...data } });
    res.status(201).json(record);
  })
);

router.get(
  "/:healthRecordId",
  asyncHandler(async (req, res) => {
    const { babyId, healthRecordId } = req.params;
    const record = await db.healthRecord.findUnique({ where: { id: healthRecordId } });
    if (!record || record.babyId !== babyId) throw new NotFoundError();
    res.json(record);
  })
);

router.patch(
  "/:healthRecordId",
  asyncHandler(async (req, res) => {
    const { babyId, healthRecordId } = req.params;
    const data = healthRecordUpdateSchema.parse(req.body);

    const existing = await db.healthRecord.findUnique({ where: { id: healthRecordId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const record = await db.healthRecord.update({ where: { id: healthRecordId }, data });
    res.json(record);
  })
);

router.delete(
  "/:healthRecordId",
  asyncHandler(async (req, res) => {
    const { babyId, healthRecordId } = req.params;
    const existing = await db.healthRecord.findUnique({ where: { id: healthRecordId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.healthRecord.delete({ where: { id: healthRecordId } });
    res.status(204).end();
  })
);

export default router;
