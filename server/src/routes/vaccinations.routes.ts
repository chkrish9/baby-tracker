import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess } from "../middleware/ownership";
import { vaccinationCreateSchema, vaccinationUpdateSchema } from "../lib/validation";
import { NotFoundError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const vaccinations = await db.vaccination.findMany({ where: { babyId: req.params.babyId }, orderBy: { date: "desc" } });
    res.json(vaccinations);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = vaccinationCreateSchema.parse(req.body);
    const vaccination = await db.vaccination.create({ data: { babyId: req.params.babyId, ...data } });
    res.status(201).json(vaccination);
  })
);

router.get(
  "/:vaccinationId",
  asyncHandler(async (req, res) => {
    const { babyId, vaccinationId } = req.params;
    const vaccination = await db.vaccination.findUnique({ where: { id: vaccinationId } });
    if (!vaccination || vaccination.babyId !== babyId) throw new NotFoundError();
    res.json(vaccination);
  })
);

router.patch(
  "/:vaccinationId",
  asyncHandler(async (req, res) => {
    const { babyId, vaccinationId } = req.params;
    const data = vaccinationUpdateSchema.parse(req.body);

    const existing = await db.vaccination.findUnique({ where: { id: vaccinationId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    const vaccination = await db.vaccination.update({ where: { id: vaccinationId }, data });
    res.json(vaccination);
  })
);

router.delete(
  "/:vaccinationId",
  asyncHandler(async (req, res) => {
    const { babyId, vaccinationId } = req.params;
    const existing = await db.vaccination.findUnique({ where: { id: vaccinationId } });
    if (!existing || existing.babyId !== babyId) throw new NotFoundError();

    await db.vaccination.delete({ where: { id: vaccinationId } });
    res.status(204).end();
  })
);

export default router;
