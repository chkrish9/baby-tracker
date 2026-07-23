import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { inviteCreateSchema } from "../lib/validation";
import { addDays } from "../lib/utils";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const { email, babyIds } = inviteCreateSchema.parse(req.body);
    const uniqueBabyIds = Array.from(new Set(babyIds));

    const myLinks = await db.babyParent.findMany({
      where: { userId: req.user!.id, babyId: { in: uniqueBabyIds } },
    });
    const isOwnerOfAll = myLinks.length === uniqueBabyIds.length && myLinks.every((l) => l.role === "OWNER");
    if (!isOwnerOfAll) throw new ForbiddenError();

    const alreadyParentOf = await db.babyParent.findMany({
      where: { babyId: { in: uniqueBabyIds }, user: { email } },
    });
    const alreadyParentBabyIds = new Set(alreadyParentOf.map((l) => l.babyId));
    const targetBabyIds = uniqueBabyIds.filter((id) => !alreadyParentBabyIds.has(id));

    if (targetBabyIds.length === 0) {
      throw new ConflictError("This person already has access to the selected baby/babies");
    }

    const invite = await db.invite.create({
      data: {
        invitedByUserId: req.user!.id,
        email,
        expiresAt: addDays(new Date(), 7),
        babies: { create: targetBabyIds.map((babyId) => ({ babyId })) },
      },
    });

    res.status(201).json({ token: invite.token, email: invite.email });
  })
);

router.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const invite = await db.invite.findUnique({
      where: { token },
      include: {
        babies: { include: { baby: { select: { id: true, name: true } } } },
        invitedBy: { select: { name: true, email: true } },
      },
    });
    if (!invite) throw new NotFoundError("Invite not found");
    if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
      return res.status(410).json({ error: "Invite expired or already used" });
    }
    res.json({
      babies: invite.babies.map((b) => b.baby),
      invitedBy: invite.invitedBy,
      email: invite.email,
    });
  })
);

router.post(
  "/:token",
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const invite = await db.invite.findUnique({ where: { token }, include: { babies: true } });
    if (!invite) throw new NotFoundError("Invite not found");
    if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
      return res.status(410).json({ error: "Invite expired or already used" });
    }

    const existingLinks = await db.babyParent.findMany({
      where: { userId: req.user!.id, babyId: { in: invite.babies.map((b) => b.babyId) } },
    });
    const existingBabyIds = new Set(existingLinks.map((l) => l.babyId));
    const newBabyIds = invite.babies.map((b) => b.babyId).filter((id) => !existingBabyIds.has(id));

    await db.$transaction([
      ...newBabyIds.map((babyId) => db.babyParent.create({ data: { userId: req.user!.id, babyId, role: "PARENT" } })),
      db.invite.update({ where: { token }, data: { status: "ACCEPTED" } }),
    ]);

    res.json({ babyIds: invite.babies.map((b) => b.babyId) });
  })
);

export default router;
