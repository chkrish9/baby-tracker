import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstFailureAt: number;
  lockedUntil?: number;
}

// In-memory, single-process account lockout tracker keyed by submitted email.
// Distinct from IP-based rate limiting above per the course's IP-vs-account
// distinction. Does not survive a restart or scale across multiple instances
// — acceptable at this app's current single-process deployment; a
// Redis-backed store would be the upgrade path if that changes.
const attempts = new Map<string, AttemptRecord>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAccountLocked(email: string): boolean {
  const record = attempts.get(normalizeEmail(email));
  if (!record?.lockedUntil) return false;
  if (Date.now() > record.lockedUntil) {
    attempts.delete(normalizeEmail(email));
    return false;
  }
  return true;
}

export function recordFailedLogin(email: string): void {
  const key = normalizeEmail(email);
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || now - existing.firstFailureAt > LOCKOUT_WINDOW_MS) {
    attempts.set(key, { count: 1, firstFailureAt: now });
    return;
  }

  existing.count += 1;
  if (existing.count >= MAX_FAILED_ATTEMPTS) {
    existing.lockedUntil = now + LOCKOUT_WINDOW_MS;
  }
}

export function resetFailedLogins(email: string): void {
  attempts.delete(normalizeEmail(email));
}
