import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { inviteCreateSchema } from "../lib/validation";
import { addDays } from "../lib/utils";
import { env } from "../config/env";
import { sendInviteEmail } from "../lib/mailer";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const { email, babies } = inviteCreateSchema.parse(req.body);
    const uniqueBabies = Array.from(new Map(babies.map((b) => [b.babyId, b])).values());
    const uniqueBabyIds = uniqueBabies.map((b) => b.babyId);

    const myLinks = await db.babyParent.findMany({
      where: { userId: req.user!.id, babyId: { in: uniqueBabyIds } },
    });
    const isOwnerOfAll = myLinks.length === uniqueBabyIds.length && myLinks.every((l) => l.role === "OWNER");
    if (!isOwnerOfAll) throw new ForbiddenError();

    const alreadyParentOf = await db.babyParent.findMany({
      where: { babyId: { in: uniqueBabyIds }, user: { email } },
    });
    const alreadyParentBabyIds = new Set(alreadyParentOf.map((l) => l.babyId));
    const targetBabies = uniqueBabies.filter((b) => !alreadyParentBabyIds.has(b.babyId));

    if (targetBabies.length === 0) {
      throw new ConflictError("This person already has access to the selected baby/babies");
    }

    const [inviter, invitedUser, targetBabyRows] = await Promise.all([
      db.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } }),
      db.user.findUnique({ where: { email }, select: { id: true } }),
      db.baby.findMany({ where: { id: { in: targetBabies.map((b) => b.babyId) } }, select: { id: true, name: true } }),
    ]);

    const invite = await db.invite.create({
      data: {
        invitedByUserId: req.user!.id,
        email,
        expiresAt: addDays(new Date(), 7),
        babies: { create: targetBabies.map((b) => ({ babyId: b.babyId, sections: b.sections })) },
      },
    });

    try {
      await sendInviteEmail({
        to: email,
        inviterName: inviter!.name ?? inviter!.email,
        babyNames: targetBabyRows.map((b) => b.name),
        inviteUrl: `${env.APP_URL}/invite/${invite.token}`,
        hasAccount: !!invitedUser,
      });
    } catch {
      await db.invite.delete({ where: { id: invite.id } });
      throw new AppError(502, "Failed to send the invite email. Please try again.");
    }

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
    const invitedUser = await db.user.findUnique({ where: { email: invite.email }, select: { id: true } });
    res.json({
      babies: invite.babies.map((b) => ({ ...b.baby, sections: b.sections })),
      invitedBy: invite.invitedBy,
      email: invite.email,
      hasAccount: !!invitedUser,
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

    const acceptingUser = await db.user.findUnique({ where: { id: req.user!.id }, select: { email: true } });
    if (acceptingUser!.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenError("This invite was sent to a different email address");
    }

    const existingLinks = await db.babyParent.findMany({
      where: { userId: req.user!.id, babyId: { in: invite.babies.map((b) => b.babyId) } },
    });
    const existingBabyIds = new Set(existingLinks.map((l) => l.babyId));
    const newBabyIds = invite.babies.map((b) => b.babyId).filter((id) => !existingBabyIds.has(id));

    await db.$transaction([
      ...newBabyIds.map((babyId) =>
        db.babyParent.create({
          data: {
            userId: req.user!.id,
            babyId,
            role: "PARENT",
            sections: invite.babies.find((b) => b.babyId === babyId)!.sections,
          },
        })
      ),
      db.invite.update({ where: { token }, data: { status: "ACCEPTED" } }),
    ]);

    res.json({ babyIds: invite.babies.map((b) => b.babyId) });
  })
);

export default router;
