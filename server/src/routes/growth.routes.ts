import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess, requireSectionAccess } from "../middleware/ownership";
import { growthRecordCreateSchema, growthRecordUpdateSchema } from "../lib/validation";
import { NotFoundError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);
router.use(requireSectionAccess("HEALTH"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { babyId } = req.params;
    const typeParam = req.query.type as string | undefined;
    const type = typeParam === "WEIGHT" || typeParam === "HEIGHT" ? typeParam : undefined;

    const records = await db.growthRecord.findMany({ where: { babyId, type }, orderBy: { recordedAt: "desc" } });
    res.json(records);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = growthRecordCreateSchema.parse(req.body);
    const record = await db.growthRecord.create({ data: { babyId: req.params.babyId, ...data } });
    res.status(201).json(record);
  })
);

router.get(
  "/:growthId",
  asyncHandler(async (req, res) => {
    const { babyId, growthId } = req.params;
    const record = await db.growthRecord.findUnique({ where: { id: growthId } });
    if (!record || record.babyId !== babyId) throw new NotFoundError();
    res.json(record);
  })
);

router.patch(
  "/:growthId",
  asyncHandler(async (req, res) => {
    const { babyId, growthId } = req.params;
    const data = growthRecordUpdateSchema.parse(req.body);

    const existing = await db.growthRecord.findUnique({ where: { id: growthId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const record = await db.growthRecord.update({ where: { id: growthId }, data });
    res.json(record);
  })
);

router.delete(
  "/:growthId",
  asyncHandler(async (req, res) => {
    const { babyId, growthId } = req.params;
    const existing = await db.growthRecord.findUnique({ where: { id: growthId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.growthRecord.delete({ where: { id: growthId } });
    res.status(204).end();
  })
);

export default router;
