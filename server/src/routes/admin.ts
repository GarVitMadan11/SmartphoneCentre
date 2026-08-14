import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { adminAuth, getJwtSecret, JWT_ISSUER, JWT_AUDIENCE, AuthenticatedRequest } from '../middleware/adminAuth.js';

const router = Router();

// Maximum consecutive failed login attempts before account is temporarily locked
const MAX_FAILED_ATTEMPTS = 5;
// Lock duration in minutes
const LOCKOUT_MINUTES = 30;

function getAdminPinHash(): string {
  const raw = process.env.ADMIN_PIN_HASH;
  if (!raw || raw.trim().length === 0) {
    // If no hash is configured, PIN auth is effectively disabled
    return '';
  }
  return raw.replace(/^['\"]|['\"]$/g, '').trim();
}

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '4h') as string;

function setAdminCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSiteMode = isProd ? 'none' : 'lax';
  res.cookie('rex_admin_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteMode,
    maxAge: 4 * 60 * 60 * 1000, // 4 hours in ms
    path: '/',
  });
  res.cookie('rex_admin_csrf', randomBytes(32).toString('base64url'), {
    httpOnly: false,
    secure: isProd,
    sameSite: sameSiteMode,
    maxAge: 4 * 60 * 60 * 1000,
    path: '/',
  });
}

/**
 * POST /api/admin/auth
 * Authenticates via PIN or username/password, sets HttpOnly cookie.
 * Returns user details but NOT the raw token (the cookie is the secure channel).
 *
 * Security controls:
 * - Per-account consecutive failure counter stored in DB
 * - Account locked for LOCKOUT_MINUTES after MAX_FAILED_ATTEMPTS failures
 * - PIN auth always uses bcrypt.compare — no plain-text bypass
 * - JWT secret fetched at runtime; fatal error if not configured
 */
router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  const { pin, username, password } = req.body;

  let sub = 'admin';
  let userUsername = 'admin';
  let role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin' = 'admin';

  if (username && typeof username === 'string' && password && typeof password === 'string') {
    // ── Named user account authentication ──────────────────────────────────
    const user = await prisma.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });

    // Generic error — don't reveal whether the username exists
    const invalidCredsResponse = { error: 'InvalidCredentials', message: 'Invalid username or password.' };

    if (!user || !user.active) {
      res.status(401).json(invalidCredsResponse);
      return;
    }

    // Check account lockout
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      res.status(429).json({
        error: 'AccountLocked',
        message: `Account is temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
      });
      return;
    }

    const isValidPass = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPass) {
      // Increment failure counter and possibly lock the account
      const newFailCount = (user.failedLoginAttempts ?? 0) + 1;
      const lockUntil = newFailCount >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailCount,
          ...(lockUntil ? { lockedUntil: lockUntil } : {}),
        },
      });

      // Log failed attempt
      await prisma.adminAuditLog.create({
        data: {
          adminUserId: user.id,
          action: 'login_failed',
          targetType: 'adminUser',
          targetId: user.id,
          payload: JSON.stringify({ failedAttempts: newFailCount, locked: !!lockUntil }),
          ipAddress: String(req.ip ?? ''),
          userAgent: String(req.headers['user-agent'] ?? ''),
        },
      });

      res.status(401).json(invalidCredsResponse);
      return;
    }

    // Successful login — reset failure counter
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
    });

    sub = user.id;
    userUsername = user.username;
    role = user.role as typeof role;

  } else if (typeof pin === 'string' && pin.trim().length > 0) {
    // ── PIN authentication ──────────────────────────────────────────────────
    // NOTE: PIN auth always uses bcrypt.compare. The plain-text '2024' bypass
    // has been removed. If ADMIN_PIN_HASH is not configured, PIN auth is
    // disabled and the admin must use a named user account instead.
    const pinHashToUse = getAdminPinHash();
    if (!pinHashToUse) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'PIN authentication is not configured on this server. Use username/password.',
      });
      return;
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(pin.trim(), pinHashToUse);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      res.status(401).json({ error: 'InvalidCredentials', message: 'Incorrect PIN.' });
      return;
    }
    sub = 'superadmin-legacy';
    userUsername = 'superadmin';
    role = 'SUPER_ADMIN';

  } else {
    res.status(400).json({ error: 'BadRequest', message: 'Provide PIN or username/password.' });
    return;
  }

  // Issue JWT with explicit issuer, audience, and algorithm
  const token = jwt.sign(
    { sub, username: userUsername, role },
    getJwtSecret(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    } as any
  );

  const decoded = jwt.decode(token) as { exp: number };
  const expiresAtMs = decoded.exp * 1000;

  // Set HttpOnly SameSite cookie
  setAdminCookie(res, token);

  // Return user info and expiry — but NOT the raw token.
  // The HttpOnly cookie is the secure transport; exposing the token in the
  // JSON body makes it readable by JavaScript and negates the cookie's purpose.
  res.json({
    expiresAt: expiresAtMs,
    user: { id: sub, username: userUsername, role },
  });
});

/**
 * POST /api/admin/logout
 * Clears the HttpOnly authentication cookie.
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('rex_admin_token', { path: '/' });
  res.clearCookie('rex_admin_csrf', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/admin/me
 * Returns current authenticated admin profile and role.
 */
router.get('/me', adminAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    id: req.user?.sub,
    username: req.user?.username,
    role: req.user?.role,
  });
});

export default router;
