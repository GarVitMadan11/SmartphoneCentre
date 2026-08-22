import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { adminAuth, getJwtSecret, JWT_ISSUER, JWT_AUDIENCE, parseCookies, AuthenticatedRequest } from '../middleware/adminAuth.js';
import { getLockdownState, triggerEmergencyLockdown, unlockEmergencyLockdown } from '../services/lockdownService.js';
import { sendAdminSecurityAlertEmail } from '../services/securityMailer.js';

const router = Router();

/**
 * GET /api/admin/security-status
 * Returns public security lockdown status for Admin PIN Gate.
 */
router.get('/security-status', (_req: Request, res: Response): void => {
  res.json(getLockdownState());
});

/**
 * POST /api/admin/unlock
 * Unlocks Admin Panel using Master Emergency Unlock Key.
 */
router.post('/unlock', async (req: Request, res: Response): Promise<void> => {
  const { masterKey } = req.body;
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');

  const result = await unlockEmergencyLockdown(masterKey, ipAddress, userAgent);

  if (!result.success) {
    res.status(401).json({ error: 'InvalidKey', message: result.message });
    return;
  }

  res.json({ success: true, message: result.message });
});

/**
 * POST /api/admin/lockdown
 * Emergency Kill Switch: Immediately locks down Admin Panel access.
 */
router.post('/lockdown', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const reason = (req.body.reason as string) || 'Manual emergency kill switch triggered from Admin Control Panel.';
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');

  const result = await triggerEmergencyLockdown(reason, ipAddress, userAgent, req.user?.username);

  res.clearCookie('rex_admin_token', { path: '/' });
  res.clearCookie('rex_admin_csrf', { path: '/' });

  res.json({
    success: true,
    message: 'Emergency Admin Panel Lockdown Activated! Access suspended.',
    masterUnlockKey: result.masterUnlockKey,
  });
});

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
  // Check if Admin Panel is locked down
  const lockdownState = getLockdownState();
  if (lockdownState.isLockedDown) {
    res.status(423).json({
      error: 'SystemLocked',
      message: 'Admin Panel is currently suspended under Emergency Security Lockdown.',
      reason: lockdownState.reason,
      lockedAt: lockdownState.lockedAt,
    });
    return;
  }

  const { pin, username, password } = req.body;
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');
  const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  let sub = 'admin';
  let userUsername = 'admin';
  let role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin' = 'admin';

  if (username && typeof username === 'string' && password && typeof password === 'string') {
    // ── Named user account authentication ──────────────────────────────────
    const user = await prisma.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });

    // Generic error — don't reveal whether the username exists
    const invalidCredsResponse = { error: 'InvalidCredentials', message: 'Invalid username or password.' };

    if (!user || !user.active) {
      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: username,
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: 'Attempted login with non-existent or inactive username.',
      }).catch(err => console.error('Alert email error:', err));

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

      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: user.username,
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: `Incorrect password. Fail count: ${newFailCount}/${MAX_FAILED_ATTEMPTS}`,
      }).catch(err => console.error('Alert email error:', err));

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
      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: 'PIN_AUTH_USER',
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: 'Incorrect Admin PIN entered.',
      }).catch(err => console.error('Alert email error:', err));

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

  // Dispatch login success alert email
  sendAdminSecurityAlertEmail({
    type: 'LOGIN_SUCCESS',
    username: userUsername,
    ipAddress,
    userAgent,
    timestamp: formattedTime,
    details: `Role: ${role}`,
  }).catch(err => console.error('Alert email error:', err));

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
  const cookies = parseCookies(req);
  if (!cookies['rex_admin_csrf']) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('rex_admin_csrf', randomBytes(32).toString('base64url'), {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 4 * 60 * 60 * 1000,
      path: '/',
    });
  }
  res.json({
    id: req.user?.sub,
    username: req.user?.username,
    role: req.user?.role,
  });
});

/**
 * Helper function to create audit log records from any server context.
 */
export async function logAdminAudit(params: {
  adminUserId?: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown> | string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const payloadStr = typeof params.payload === 'string' 
      ? params.payload 
      : JSON.stringify(params.payload ?? {});

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId ?? 'system',
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        payload: payloadStr,
        ipAddress: params.ipAddress ?? '',
        userAgent: params.userAgent ?? '',
      },
    });
  } catch (err) {
    console.error('Failed to log admin audit event:', err);
  }
}

/**
 * GET /api/admin/audit-logs
 * Retrieves paginated audit logs for admin review.
 */
router.get('/audit-logs', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '100'), 10), 1), 500);
    const search = String(req.query.search || '').trim().toLowerCase();

    const logs = await prisma.adminAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    let filtered = logs;
    if (search) {
      filtered = logs.filter(l =>
        l.action.toLowerCase().includes(search) ||
        l.targetType.toLowerCase().includes(search) ||
        l.targetId.toLowerCase().includes(search) ||
        l.adminUserId.toLowerCase().includes(search) ||
        l.payload.toLowerCase().includes(search)
      );
    }

    res.json(filtered.map(l => {
      let parsedPayload: Record<string, unknown> = {};
      try { parsedPayload = JSON.parse(l.payload); } catch { parsedPayload = { raw: l.payload }; }

      return {
        id: l.id,
        adminUserId: l.adminUserId,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        payload: parsedPayload,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      };
    }));
  } catch (err) {
    console.error('GET /api/admin/audit-logs error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch audit logs.' });
  }
});

export default router;

