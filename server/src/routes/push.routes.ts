import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { env } from "../config/env";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "../lib/validation";

const router = Router();

router.use(requireAuth);
router.use(requireCsrf);

router.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY });
});

router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const data = pushSubscribeSchema.parse(req.body);
    await db.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: req.user!.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
      update: {
        userId: req.user!.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
    });
    res.status(201).json({ ok: true });
  })
);

router.post(
  "/unsubscribe",
  asyncHandler(async (req, res) => {
    const data = pushUnsubscribeSchema.parse(req.body);
    await db.pushSubscription
      .delete({ where: { endpoint: data.endpoint, userId: req.user!.id } })
      .catch(() => {});
    res.json({ ok: true });
  })
);

export default router;
