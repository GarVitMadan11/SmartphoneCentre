import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { adminAuth, optionalAdminAuth, requireRole, getJwtSecret, JWT_ISSUER, JWT_AUDIENCE, parseCookies, AuthenticatedRequest } from '../middleware/adminAuth.js';
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

// In-memory PIN rate limiting and brute-force lockout tracker (SEC-02)
interface PinLockout {
  attempts: number;
  lockedUntil?: Date;
}
const pinAttempts = new Map<string, PinLockout>();

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

  const { pin, username, email, identifier, password } = req.body;
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');
  const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  let sub = 'admin';
  let userUsername = 'admin';
  let userEmail = 'admin@smartphonecentre.com';
  let role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin' = 'admin';
  let userPermissions: string[] = [];

  const loginIdentifier = (email || username || identifier || '').trim().toLowerCase();

  if (loginIdentifier && typeof loginIdentifier === 'string' && password && typeof password === 'string') {
    // ── Email / Named user account authentication ───────────────────────────
    const user = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier },
        ],
      },
    });

    // Generic error — don't reveal whether the user exists
    const invalidCredsResponse = { error: 'InvalidCredentials', message: 'Invalid email/username or password.' };

    if (!user || !user.active) {
      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: loginIdentifier,
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: 'Attempted login with non-existent or inactive email/username.',
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
        username: user.email,
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
    userEmail = user.email;
    role = user.role as typeof role;

    // Resolve service permissions
    if (user.role === 'SUPER_ADMIN' || user.role === 'admin') {
      userPermissions = ['smartphones', 'tablets', 'smartwatches', 'cashify', 'inspections', 'support', 'finance', 'audit', 'staff'];
    } else {
      try {
        const parsed = JSON.parse((user as any).permissions || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          userPermissions = parsed;
        } else {
          if (user.role === 'CATALOG_EDITOR') userPermissions = ['smartphones', 'tablets', 'smartwatches', 'cashify'];
          else if (user.role === 'OPERATIONS_AGENT') userPermissions = ['inspections', 'support'];
          else if (user.role === 'FINANCE_APPROVER') userPermissions = ['finance'];
          else userPermissions = ['inspections'];
        }
      } catch {
        userPermissions = ['inspections'];
      }
    }

  } else if (typeof pin === 'string' && pin.trim().length > 0) {
    // ── PIN authentication with brute-force lockout (SEC-02) ─────────────────
    const pinState = pinAttempts.get(ipAddress);
    const now = new Date();
    if (pinState?.lockedUntil && pinState.lockedUntil > now) {
      const minutesLeft = Math.ceil((pinState.lockedUntil.getTime() - now.getTime()) / 60000);
      res.status(429).json({
        error: 'AccountLocked',
        message: `Too many failed PIN attempts. Access locked for ${minutesLeft} minute(s).`,
      });
      return;
    }

    const pinHashToUse = getAdminPinHash();
    if (!pinHashToUse) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'PIN authentication is not configured on this server. Use company email/password.',
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
      const currentAttempts = (pinState?.attempts || 0) + 1;
      const lockUntil = currentAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
        : undefined;

      pinAttempts.set(ipAddress, {
        attempts: currentAttempts,
        lockedUntil: lockUntil,
      });

      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: 'PIN_AUTH_USER',
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: `Incorrect Admin PIN entered. Fail count: ${currentAttempts}/${MAX_FAILED_ATTEMPTS}`,
      }).catch(err => console.error('Alert email error:', err));

      res.status(401).json({ error: 'InvalidCredentials', message: 'Incorrect PIN.' });
      return;
    }

    // Reset PIN lockout on success
    pinAttempts.delete(ipAddress);

    sub = 'superadmin-legacy';
    userUsername = 'superadmin';
    userEmail = 'admin@smartphonecentre.com';
    role = 'SUPER_ADMIN';
    userPermissions = ['smartphones', 'tablets', 'smartwatches', 'cashify', 'inspections', 'support', 'finance', 'audit', 'staff'];

  } else {
    res.status(400).json({ error: 'BadRequest', message: 'Provide email/username and password or authorized PIN.' });
    return;
  }

  // Dispatch login success alert email
  sendAdminSecurityAlertEmail({
    type: 'LOGIN_SUCCESS',
    username: userEmail || userUsername,
    ipAddress,
    userAgent,
    timestamp: formattedTime,
    details: `Role: ${role} | Services: ${userPermissions.join(', ')}`,
  }).catch(err => console.error('Alert email error:', err));

  // Issue JWT with explicit issuer, audience, and permissions claim
  const token = jwt.sign(
    { sub, username: userUsername, email: userEmail, role, permissions: userPermissions },
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
    success: true,
    expiresAt: expiresAtMs,
    user: { id: sub, username: userUsername, email: userEmail, role, permissions: userPermissions },
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
 * Returns current authenticated admin profile, role, and granular service permissions.
 * Uses optionalAdminAuth to gracefully return authenticated: false (HTTP 200) without throwing 401 in client console.
 */
router.get('/me', optionalAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.json({
      authenticated: false,
      user: null,
      id: null,
      username: null,
      role: null,
      permissions: [],
    });
    return;
  }

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

  let permissions = req.user.permissions || [];
  let email = req.user.email || '';

  if (req.user.sub && req.user.sub !== 'superadmin-legacy') {
    const dbUser = await prisma.adminUser.findUnique({ where: { id: req.user.sub } }).catch(() => null);
    if (dbUser) {
      email = dbUser.email;
      if (dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'admin') {
        permissions = ['smartphones', 'tablets', 'smartwatches', 'cashify', 'inspections', 'support', 'finance', 'audit', 'staff'];
      } else {
        try {
          const parsed = JSON.parse((dbUser as any).permissions || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            permissions = parsed;
          } else {
            if (dbUser.role === 'CATALOG_EDITOR') permissions = ['smartphones', 'tablets', 'smartwatches', 'cashify'];
            else if (dbUser.role === 'OPERATIONS_AGENT') permissions = ['inspections', 'support'];
            else if (dbUser.role === 'FINANCE_APPROVER') permissions = ['finance'];
            else permissions = ['inspections'];
          }
        } catch {}
      }
    }
  } else if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'admin') {
    permissions = ['smartphones', 'tablets', 'smartwatches', 'cashify', 'inspections', 'support', 'finance', 'audit', 'staff'];
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.sub,
      username: req.user.username,
      email: email || req.user.username,
      role: req.user.role,
      permissions,
    },
    id: req.user.sub,
    username: req.user.username,
    email: email || req.user.username,
    role: req.user.role,
    permissions,
  });
});

/**
 * POST /api/admin/change-password
 * Allows an authenticated admin to change their password securely.
 */
router.post('/change-password', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || typeof currentPassword !== 'string' || !newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 10) {
      res.status(400).json({ error: 'ValidationError', message: 'New password must be at least 10 characters long.' });
      return;
    }

    const adminUserId = req.user?.sub;
    if (!adminUserId || adminUserId === 'superadmin-legacy') {
      res.status(400).json({ error: 'BadRequest', message: 'PIN-authenticated session cannot change database user password. Log in with your admin username.' });
      return;
    }

    const user = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!user) {
      res.status(404).json({ error: 'NotFound', message: 'Admin user record not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'InvalidCredentials', message: 'Current password is incorrect.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await logAdminAudit({
      adminUserId: user.id,
      action: 'ADMIN_PASSWORD_CHANGED',
      targetType: 'AdminUser',
      targetId: user.id,
      payload: { username: user.username },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    sendAdminSecurityAlertEmail({
      type: 'PASSWORD_RESET',
      username: user.username,
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: 'Admin user password changed successfully.',
    }).catch(err => console.error('Alert email error:', err));

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('POST /api/admin/change-password error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update password.' });
  }
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
 * ── Master Admin: Staff & Granular Role Management ─────────────────────────
 */

// GET /api/admin/staff — Master Admin Only
router.get('/staff', adminAuth, requireRole(['SUPER_ADMIN']), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    const formatted = users.map(u => ({
      ...u,
      permissions: (() => {
        try {
          const p = JSON.parse((u as any).permissions || '[]');
          return Array.isArray(p) ? p : [];
        } catch {
          return [];
        }
      })(),
    }));

    res.json(formatted);
  } catch (err) {
    console.error('GET /api/admin/staff error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to retrieve staff members.' });
  }
});

// POST /api/admin/staff — Master Admin Only
router.post('/staff', adminAuth, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password, role = 'OPERATIONS_AGENT', permissions = [] } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'ValidationError', message: 'Username, company email, and initial password are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase();

    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      res.status(400).json({ error: 'ValidationError', message: 'A staff member with this email or username already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const permissionsJson = JSON.stringify(Array.isArray(permissions) ? permissions : []);

    const newUser = await prisma.adminUser.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: String(role),
        permissions: permissionsJson,
        active: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
        createdAt: true,
      },
    });

    await logAdminAudit({
      adminUserId: req.user?.sub,
      action: 'staff_created',
      targetType: 'adminUser',
      targetId: newUser.id,
      payload: { email: cleanEmail, role, permissions },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    res.status(201).json({
      ...newUser,
      permissions: Array.isArray(permissions) ? permissions : [],
    });
  } catch (err) {
    console.error('POST /api/admin/staff error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create staff account.' });
  }
});

// PATCH /api/admin/staff/:id — Master Admin Only
router.patch('/staff/:id', adminAuth, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { role, permissions, active, password } = req.body;

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = String(role);
    if (active !== undefined) data.active = Boolean(active);
    if (permissions !== undefined && Array.isArray(permissions)) {
      data.permissions = JSON.stringify(permissions);
    }
    if (password && typeof password === 'string' && password.trim().length >= 8) {
      data.passwordHash = await bcrypt.hash(password.trim(), 12);
      data.failedLoginAttempts = 0;
      data.lockedUntil = null;
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: data as any,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });

    await logAdminAudit({
      adminUserId: req.user?.sub,
      action: 'staff_updated',
      targetType: 'adminUser',
      targetId: id,
      payload: { updates: Object.keys(data) },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    res.json({
      ...updated,
      permissions: (() => {
        try {
          return JSON.parse((updated as any).permissions || '[]');
        } catch {
          return [];
        }
      })(),
    });
  } catch (err) {
    console.error('PATCH /api/admin/staff/:id error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update staff member.' });
  }
});

// DELETE /api/admin/staff/:id — Master Admin Only
router.delete('/staff/:id', adminAuth, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (id === req.user?.sub) {
      res.status(400).json({ error: 'BadRequest', message: 'You cannot remove your own active Master Admin account.' });
      return;
    }

    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ error: 'NotFound', message: 'Staff member not found.' });
      return;
    }

    await prisma.adminUser.delete({ where: { id } });

    await logAdminAudit({
      adminUserId: req.user?.sub,
      action: 'staff_deleted',
      targetType: 'adminUser',
      targetId: id,
      payload: { username: target.username, email: target.email },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    res.json({ success: true, message: `Staff member ${target.email} removed.` });
  } catch (err) {
    console.error('DELETE /api/admin/staff/:id error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to delete staff member.' });
  }
});

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

import {
  getCashifySummary,
  getCashifyModelsList,
  getCashifyVariantsList,
  saveCustomUrl,
  triggerPriceScan,
  isScanRunning,
} from '../services/cashifyService.js';

/**
 * GET /api/admin/price-alerts
 * Returns daily Cashify price comparison logs and price increase/decrease alerts.
 */
router.get('/price-alerts', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alerts = await (prisma as any).cashifyPriceAlert.findMany({
      orderBy: { alertDate: 'desc' },
      take: 200,
    });
    res.json(alerts);
  } catch (err) {
    console.error('GET /api/admin/price-alerts error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch price comparison alerts.' });
  }
});

/**
 * GET /api/admin/cashify/summary
 * Returns high-level metrics for the Cashify monitor dashboard.
 */
router.get('/cashify/summary', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const summary = await getCashifySummary();
    res.json({ ...summary, isScanRunning: isScanRunning() });
  } catch (err) {
    console.error('GET /api/admin/cashify/summary error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch Cashify monitor summary.' });
  }
});

/**
 * GET /api/admin/cashify/variants
 * Returns all active smartphone RAM & Storage variants (1 row per variant)
 * with buyback price, competitor Cashify price, margin, and variant URL.
 */
router.get('/cashify/variants', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await getCashifyVariantsList();
    res.json(list);
  } catch (err) {
    console.error('GET /api/admin/cashify/variants error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch Cashify variants list.' });
  }
});

/**
 * GET /api/admin/cashify/models
 * Returns all active models with their resolved or custom Cashify URLs and latest prices.
 */
router.get('/cashify/models', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await getCashifyModelsList();
    res.json(list);
  } catch (err) {
    console.error('GET /api/admin/cashify/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch Cashify models list.' });
  }
});

/**
 * Extracts live unmasked buyback price from Cashify variant HTML
 */
export function extractCashifyPriceFromHtml(htmlText: string): number | null {
  if (!htmlText) return null;

  // 1. Direct itemprop="price" content="XYZ"
  const contentMatch =
    htmlText.match(/itemprop=["']price["'][^>]*content=["'](\d+)["']/i) ||
    htmlText.match(/content=["'](\d+)["'][^>]*itemprop=["']price["']/i);
  if (contentMatch) {
    const val = parseInt(contentMatch[1], 10);
    if (val >= 500 && val <= 300000) return val;
  }

  // 2. <span itemprop="price">₹12,345</span>
  const textMatch = htmlText.match(/<[^>]+itemprop=["']price["'][^>]*>([^<]+)<\/[^>]+>/i);
  if (textMatch) {
    const cleaned = textMatch[1].replace(/[^\d]/g, '');
    const val = parseInt(cleaned, 10);
    if (val >= 500 && val <= 300000) return val;
  }

  // 3. JSON-LD structured schema
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(htmlText)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data.offers?.price) {
        const val = parseInt(String(data.offers.price).replace(/[^\d]/g, ''), 10);
        if (val >= 500 && val <= 300000) return val;
      }
    } catch {
      // ignore
    }
  }

  // 4. Next.js __NEXT_DATA__
  const nextDataMatch = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const pp = nextData.props?.pageProps;
      if (pp) {
        const price =
          pp.priceDetails?.price ||
          pp.deviceDetails?.price ||
          pp.product?.price ||
          pp.modelData?.price;
        if (price) {
          const val = parseInt(String(price).replace(/[^\d]/g, ''), 10);
          if (val >= 500 && val <= 300000) return val;
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Fallback regex on currency patterns on Cashify price headers
  const priceRegex = /₹\s*([0-9]{1,3}(?:,[0-9]{2,3})+|\b[0-9]{4,6}\b)/g;
  const foundPrices: number[] = [];
  let pMatch;
  while ((pMatch = priceRegex.exec(htmlText)) !== null) {
    const num = parseInt(pMatch[1].replace(/[^\d]/g, ''), 10);
    if (num >= 2000 && num <= 200000) {
      foundPrices.push(num);
    }
  }
  if (foundPrices.length > 0) {
    return foundPrices[0];
  }

  return null;
}

const UNSERVICEABLE_PATTERNS = [
  /not\s+currently\s+purchasing/i,
  /currently\s+not\s+purchasing/i,
  /not\s+currently\s+buying/i,
  /currently\s+not\s+buying/i,
  /we\s+are\s+not\s+currently\s+purchasing/i,
  /we['’]re\s+not\s+currently\s+purchasing/i,
  /we\s+are\s+not\s+purchasing/i,
  /we['’]re\s+not\s+purchasing/i,
  /not\s+purchasing\s+in/i,
  /not\s+buying\s+in/i,
  /currently\s+unavailable\s+in\s+your\s+location/i,
  /not\s+available\s+in\s+your\s+(?:location|city|area|pincode)/i,
  /not\s+serviceable\s+in\s+your\s+(?:location|city|area|pincode)/i,
  /not\s+serviceable/i,
  /service\s+not\s+available/i,
  /we\s+do\s+not\s+buy\s+this\s+device/i,
  /we\s+don['’]t\s+buy\s+this\s+device/i,
  /we\s+do\s+not\s+buy/i,
  /we\s+don['’]t\s+buy/i,
  /cannot\s+buy\s+this\s+device/i,
  /out\s+of\s+service/i,
  /temporarily\s+unavailable/i,
  /we\s+are\s+not\s+servicing/i,
  /buyback\s+(?:is\s+)?temporarily\s+(?:paused|unavailable)/i,
  /unable\s+to\s+buy\s+this\s+device/i,
  /we\s+are\s+not\s+accepting\s+quotes/i,
];

const NOT_FOUND_PATTERNS = [
  /404\s*-\s*page\s+not\s+found/i,
  /page\s+you\s+requested\s+could\s+not\s+be\s+found/i,
  /we['’]re\s+sorry[,\s]+the\s+page\s+you\s+requested\s+could\s+not\s+be\s+found/i,
  /could\s+not\s+be\s+found/i,
  /page\s+not\s+found/i,
];

export interface CashifyUrlValidationResult {
  ok: boolean;
  status: number;
  extractedPrice: number | null;
  error?: string;
  is404?: boolean;
  isUnserviceable?: boolean;
}

export function validateCashifyHtml(htmlText: string, status: number, finalUrl?: string): CashifyUrlValidationResult {
  // 1. Check HTTP Status code
  if (status === 404) {
    return {
      ok: false,
      status: 404,
      is404: true,
      extractedPrice: null,
      error: '404 Page Not Found: This device page does not exist on Cashify.',
    };
  }

  if (status >= 500) {
    return {
      ok: false,
      status,
      extractedPrice: null,
      error: `Cashify Server Error (HTTP ${status}).`,
    };
  }

  if (status === 403 || status === 401) {
    return {
      ok: false,
      status,
      extractedPrice: null,
      error: `Access Blocked by Cashify (HTTP ${status}).`,
    };
  }

  // Check URL redirect (soft 404 redirected to homepage or /404)
  if (finalUrl) {
    const isHome = finalUrl === 'https://www.cashify.in' || finalUrl === 'https://www.cashify.in/';
    if (isHome) {
      return {
        ok: false,
        status: 404,
        is404: true,
        extractedPrice: null,
        error: '404 Error: Cashify redirected invalid link to home page.',
      };
    }
    if (finalUrl.includes('/404') || finalUrl.includes('/not-found')) {
      return {
        ok: false,
        status: 404,
        is404: true,
        extractedPrice: null,
        error: '404 Error: Cashify redirected to 404 Not Found page.',
      };
    }
  }

  // 2. Check Next.js __NEXT_DATA__
  const nextDataMatch = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      if (
        nextData.page === '/404' ||
        nextData.page === '/_error' ||
        nextData.props?.pageProps?.statusCode === 404 ||
        nextData.props?.pageProps?.notFound === true
      ) {
        return {
          ok: false,
          status: 404,
          is404: true,
          extractedPrice: null,
          error: '404 Error: Cashify page not found.',
        };
      }
      const pageProps = nextData.props?.pageProps;
      if (pageProps) {
        if (pageProps.isServiceable === false || pageProps.serviceable === false || pageProps.isPurchasing === false) {
          return {
            ok: false,
            status: 200,
            isUnserviceable: true,
            extractedPrice: null,
            error: 'Cashify is not currently purchasing this device in this location (Gurgaon, Delhi, etc.).',
          };
        }
      }
    } catch {}
  }

  // 3. Check for 404 patterns in HTML
  for (const pattern of NOT_FOUND_PATTERNS) {
    if (pattern.test(htmlText)) {
      return {
        ok: false,
        status: 404,
        is404: true,
        extractedPrice: null,
        error: '404 Error: "We’re sorry, the page you requested could not be found."',
      };
    }
  }

  // 4. Check for Unserviceable / Not Purchasing patterns (Gurgaon, Delhi, location restrictions)
  for (const pattern of UNSERVICEABLE_PATTERNS) {
    if (pattern.test(htmlText)) {
      return {
        ok: false,
        status: 200,
        isUnserviceable: true,
        extractedPrice: null,
        error: 'Cashify is not currently purchasing this device in this location (Gurgaon, Delhi, etc.).',
      };
    }
  }

  // 5. Check if page is just a variant chooser/picker with no quote
  const isPicker =
    /choose\s+(?:a\s+)?variant/i.test(htmlText) ||
    /select\s+(?:a\s+)?variant/i.test(htmlText) ||
    /choose\s+your\s+variant/i.test(htmlText);

  // 6. Extract price
  const extractedPrice = extractCashifyPriceFromHtml(htmlText);
  if (extractedPrice && extractedPrice > 0) {
    return {
      ok: true,
      status: 200,
      extractedPrice,
    };
  }

  if (isPicker) {
    return {
      ok: false,
      status: 200,
      extractedPrice: null,
      error: 'Generic model picker page: specific RAM/Storage variant not selected on Cashify.',
    };
  }

  return {
    ok: false,
    status: 200,
    extractedPrice: null,
    error: 'No active buyback price quote available from Cashify for this URL.',
  };
}

/**
 * Live HTTP fetch and price extraction helper
 */
export async function extractPriceFromCashifyUrl(url: string): Promise<number | null> {
  if (!url || !url.startsWith('https://www.cashify.in')) return null;
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (resp.status !== 200) return null;
    const htmlText = await resp.text();
    const validation = validateCashifyHtml(htmlText, resp.status, resp.url);
    if (!validation.ok) return null;
    return validation.extractedPrice;
  } catch (e) {
    console.warn(`[CashifyExtract] Failed live extract for ${url}:`, e);
    return null;
  }
}

/**
 * POST /api/admin/cashify/custom-url
 * Saves or updates a custom Cashify URL override for a variant or model,
 * and automatically extracts live price into Cashify monitoring.
 */
router.post('/cashify/custom-url', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key, modelId, customUrl, extractedPrice, rephonixPrice } = req.body;
    const targetKey = key || modelId;
    if (!targetKey || typeof customUrl !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'key (or modelId) and customUrl are required.' });
      return;
    }

    saveCustomUrl(targetKey, customUrl);

    // If key format is {modelId}_{ram}_{storage}, link all model variations and record alert
    const parts = targetKey.split('_');
    if (parts.length >= 3) {
      const idOrLegacy = parts[0];
      const ram = parseInt(parts[1], 10) || 0;
      const storage = parseInt(parts[2], 10) || 128;

      const model = await prisma.model.findFirst({
        where: {
          OR: [
            { id: idOrLegacy },
            { legacyId: idOrLegacy },
            { name: { equals: idOrLegacy, mode: 'insensitive' as any } },
          ],
        },
        include: { brand: true },
      });

      if (model) {
        saveCustomUrl(`${model.id}_${ram}_${storage}`, customUrl);
        saveCustomUrl(`${model.legacyId}_${ram}_${storage}`, customUrl);
        saveCustomUrl(`${model.name}_${ram}_${storage}`, customUrl);

        let livePrice: number | null = (typeof extractedPrice === 'number' && extractedPrice > 0)
          ? extractedPrice
          : null;

        if (!livePrice) {
          livePrice = await extractPriceFromCashifyUrl(customUrl);
        }

        if (livePrice && livePrice > 0) {
          const finalRephonixPrice = typeof rephonixPrice === 'number' && rephonixPrice > 0
            ? rephonixPrice
            : model.basePrice128GB;

          await (prisma as any).cashifyPriceAlert.create({
            data: {
              modelId: model.id,
              modelName: model.name,
              brandName: model.brand?.name || 'Unknown',
              ramGb: ram,
              storageGb: storage,
              rephonixPrice: finalRephonixPrice,
              cashifyPrice: livePrice,
              difference: finalRephonixPrice - livePrice,
              status: 'STABLE',
              changeAmount: 0,
              alertDate: new Date(),
              reviewed: true,
            },
          });
        }
      }
    }

    await logAdminAudit({
      adminUserId: req.user?.username,
      action: 'CASHIFY_CUSTOM_URL_SET',
      targetType: 'VariantOrModel',
      targetId: targetKey,
      payload: { customUrl },
    });

    res.json({ success: true, message: 'Custom Cashify URL saved and price registered successfully.' });
  } catch (err) {
    console.error('POST /api/admin/cashify/custom-url error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to save custom Cashify URL.' });
  }
});

/**
 * POST /api/admin/cashify/register-approved-variants
 * Automatically registers approved Cashify links for a newly added or updated model,
 * extracts live prices from Cashify (or uses verified prices),
 * and creates CashifyPriceAlert records so the model is immediately active in the Cashify Monitor.
 */
router.post('/cashify/register-approved-variants', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { modelId, legacyId, modelName, brandName, variants } = req.body;
    if (!modelName || !Array.isArray(variants) || variants.length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'modelName and variants array are required.' });
      return;
    }

    // 1. Resolve model in DB
    const model = await prisma.model.findFirst({
      where: {
        OR: [
          ...(modelId ? [{ id: modelId }] : []),
          ...(legacyId ? [{ legacyId }] : []),
          { name: { equals: modelName, mode: 'insensitive' as any } },
        ],
      },
      include: { brand: true },
    });

    const resolvedModelId = model?.id || modelId || legacyId || modelName;
    const resolvedLegacyId = model?.legacyId || legacyId || modelId || modelName;
    const resolvedModelName = model?.name || modelName;
    const resolvedBrandName = model?.brand?.name || brandName || 'Unknown';

    let registeredCount = 0;
    let extractedCount = 0;

    for (const v of variants) {
      if (!v.url || typeof v.url !== 'string') continue;
      const ram = Number(v.ramGb) || 0;
      const storage = Number(v.storageGb) || 128;
      const cleanUrl = v.url.trim();

      // Save custom URL under all variations so it can never be missed
      saveCustomUrl(`${resolvedModelId}_${ram}_${storage}`, cleanUrl);
      saveCustomUrl(`${resolvedLegacyId}_${ram}_${storage}`, cleanUrl);
      saveCustomUrl(`${resolvedModelName}_${ram}_${storage}`, cleanUrl);
      registeredCount++;

      // Extract or retrieve price
      let cashifyPrice: number | null = (typeof v.extractedPrice === 'number' && v.extractedPrice > 0)
        ? v.extractedPrice
        : null;

      if (!cashifyPrice) {
        cashifyPrice = await extractPriceFromCashifyUrl(cleanUrl);
      }

      if (cashifyPrice && cashifyPrice > 0) {
        extractedCount++;
        const rephonixPrice = Number(v.rephonixPrice) || model?.basePrice128GB || cashifyPrice;
        const diff = rephonixPrice - cashifyPrice;

        // Create alert entry for live monitoring
        await (prisma as any).cashifyPriceAlert.create({
          data: {
            modelId: resolvedModelId,
            modelName: resolvedModelName,
            brandName: resolvedBrandName,
            ramGb: ram,
            storageGb: storage,
            rephonixPrice,
            cashifyPrice,
            difference: diff,
            status: 'STABLE',
            changeAmount: 0,
            alertDate: new Date(),
            reviewed: true,
          },
        });
      }
    }

    await logAdminAudit({
      adminUserId: req.user?.username,
      action: 'CASHIFY_APPROVED_VARIANTS_REGISTERED',
      targetType: 'Model',
      targetId: resolvedModelId,
      payload: { modelName: resolvedModelName, registeredCount, extractedCount },
    });

    res.json({
      success: true,
      registeredCount,
      extractedCount,
      message: `Successfully registered and monitored ${registeredCount} variants (${extractedCount} live prices extracted).`,
    });
  } catch (err: any) {
    console.error('POST /api/admin/cashify/register-approved-variants error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to register approved variants: ' + (err.message || err) });
  }
});

/**
 * POST /api/admin/cashify/test-url
 * Live check for Cashify URL and automatic live price extraction.
 */
router.post('/cashify/test-url', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('https://www.cashify.in')) {
      res.status(400).json({ error: 'BadRequest', message: 'Valid https://www.cashify.in URL required.' });
      return;
    }

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const htmlText = await resp.text();
    const validation = validateCashifyHtml(htmlText, resp.status, resp.url);

    res.json({
      url,
      status: validation.status,
      ok: validation.ok,
      extractedPrice: validation.extractedPrice,
      error: validation.error,
      is404: validation.is404,
      isUnserviceable: validation.isUnserviceable,
    });
  } catch (err: any) {
    res.json({
      url: req.body.url,
      status: 0,
      ok: false,
      extractedPrice: null,
      error: err.message || 'Failed to connect to Cashify.',
    });
  }
});

/**
 * POST /api/admin/cashify/trigger-scan
 * Triggers background price scan.
 */
router.post('/cashify/trigger-scan', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(String(req.body.limit || '0'), 10);
    const result = triggerPriceScan(limit, true);
    res.json(result);
  } catch (err: any) {
    console.error('POST /api/admin/cashify/trigger-scan error:', err);
    res.status(500).json({ error: 'ServerError', message: err.message || 'Failed to trigger scan.' });
  }
});

/**
 * GET /api/admin/cashify/scan-status
 */
router.get('/cashify/scan-status', adminAuth, (_req: AuthenticatedRequest, res: Response): void => {
  res.json({ isRunning: isScanRunning() });
});

export default router;

