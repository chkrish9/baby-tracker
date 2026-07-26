import { Router } from "express";
import { db } from "../lib/db";
import { asyncHandler } from "../lib/asyncHandler";
import { registerSchema, loginSchema } from "../lib/validation";
import { hashPassword, comparePassword } from "../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/tokens";
import { setAuthCookies, setAccessCookie, clearAuthCookies } from "../lib/cookies";
import { ConflictError, UnauthorizedError } from "../lib/errors";
import { isAccountLocked, recordFailedLogin, resetFailedLogins, authLimiter } from "../middleware/rateLimit";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError("An account with this email already exists");

    const hashed = await hashPassword(password);
    const user = await db.user.create({ data: { email, password: hashed, name } });

    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  })
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = loginSchema.parse(req.body);

    if (isAccountLocked(email)) {
      throw new UnauthorizedError("Too many failed attempts, try again later");
    }

    const user = await db.user.findUnique({ where: { email } });
    const valid = user ? await comparePassword(password, user.password) : false;

    if (!user || !valid) {
      recordFailedLogin(email);
      throw new UnauthorizedError("Invalid email or password");
    }

    resetFailedLogins(email);

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id, rememberMe);
    setAuthCookies(res, { accessToken, refreshToken, rememberMe });

    // accessToken/refreshToken are also returned in the body (in addition to
    // the httpOnly cookies) so native clients without a cookie jar can store
    // them and authenticate via `Authorization: Bearer`.
    res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken });
  })
);

router.post(
  "/refresh",
  // A cookie-based (web) refresh carries an ambient credential and needs CSRF
  // protection; a bearer-style (mobile) refresh sends its own refresh token
  // and has nothing ambient to forge, so it's exempt.
  (req, res, next) => {
    if (!req.cookies?.refresh_token) return next();
    return requireCsrf(req, res, next);
  },
  asyncHandler(async (req, res) => {
    const refreshToken = (req.cookies?.refresh_token as string | undefined) ?? (req.body?.refreshToken as string | undefined);
    if (!refreshToken) throw new UnauthorizedError();

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError();
    }

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedError();

    const accessToken = signAccessToken(user.id);
    if (req.cookies?.refresh_token) setAccessCookie(res, accessToken);

    res.json({ ok: true, accessToken });
  })
);

router.post("/logout", requireCsrf, (_req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

export default router;
