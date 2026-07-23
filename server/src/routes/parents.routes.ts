import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { requireBabyAccess, requireOwnerRole } from "../middleware/ownership";
import { parentSectionsUpdateSchema } from "../lib/validation";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireCsrf);
router.use(requireBabyAccess);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parents = await db.babyParent.findMany({
      where: { babyId: req.params.babyId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(parents);
  })
);

router.patch(
  "/:parentId",
  requireOwnerRole,
  asyncHandler(async (req, res) => {
    const { babyId, parentId } = req.params;
    const { sections } = parentSectionsUpdateSchema.parse(req.body);

    const targetLink = await db.babyParent.findUnique({ where: { id: parentId } });
    if (!targetLink || targetLink.babyId !== babyId) throw new NotFoundError();
    if (targetLink.role === "OWNER") throw new ForbiddenError("Cannot edit the owner's access");

    const updated = await db.babyParent.update({ where: { id: parentId }, data: { sections } });
    res.json(updated);
  })
);

router.delete(
  "/:parentId",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const { babyId, parentId } = req.params;

    const targetLink = await db.babyParent.findUnique({ where: { id: parentId } });
    if (!targetLink || targetLink.babyId !== babyId) throw new NotFoundError();

    if (targetLink.role === "OWNER") throw new ForbiddenError("Cannot remove the owner");
    if (req.babyParentLink!.role !== "OWNER" && targetLink.userId !== req.user.id) throw new ForbiddenError();

    await db.babyParent.delete({ where: { id: parentId } });
    res.status(204).end();
  })
);

export default router;
