import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess } from "../middleware/ownership";
import { feedingCreateSchema, feedingUpdateSchema } from "../lib/validation";
import { NotFoundError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const logs = await db.feedingLog.findMany({
      where: { babyId: req.params.babyId },
      orderBy: { loggedAt: "desc" },
      take: 500,
    });
    res.json(logs);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = feedingCreateSchema.parse(req.body);
    const log = await db.feedingLog.create({ data: { babyId: req.params.babyId, ...data } });
    res.status(201).json(log);
  })
);

router.patch(
  "/:logId",
  asyncHandler(async (req, res) => {
    const { babyId, logId } = req.params;
    const data = feedingUpdateSchema.parse(req.body);

    const existing = await db.feedingLog.findUnique({ where: { id: logId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const log = await db.feedingLog.update({ where: { id: logId }, data });
    res.json(log);
  })
);

router.delete(
  "/:logId",
  asyncHandler(async (req, res) => {
    const { babyId, logId } = req.params;
    const existing = await db.feedingLog.findUnique({ where: { id: logId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.feedingLog.delete({ where: { id: logId } });
    res.status(204).end();
  })
);

export default router;
