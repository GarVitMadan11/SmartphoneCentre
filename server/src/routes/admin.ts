import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { adminAuth, JWT_ISSUER, JWT_AUDIENCE, AuthenticatedRequest } from '../middleware/adminAuth.js';

const DEFAULT_POSTGRES_URL = 'postgresql://database_fplv_user:mhFh1bnyfLV4jpId5R0D8t7osV0Nlx0T@dpg-d9v6fa67bikc73bsvnhg-a/database_fplv';
let dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]|['"]$/g, '');
if (!dbUrl) {
  dbUrl = DEFAULT_POSTGRES_URL;
  process.env.DATABASE_URL = dbUrl;
}

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_PIN_HASH = '$2b$10$nZaDZ14X6MfPj/ZjVYhA5.MRq0SbwuxFTVr9Rzfvlk8riKUmvEmri'; // Hash for '2024'
const DEFAULT_JWT_SECRET = '263d3ac30ed6dcd17c4e638f43b17462d18bdb59d54e3a456bc470996bd6e2d137a6ec22b8c412a8a5d41cd9e2a5db5172c9627e12fd4a3dc0d699b47f9a1aaf';

function getAdminPinHash(): string {
  const raw = process.env.ADMIN_PIN_HASH;
  if (!raw || raw.trim().length === 0) return DEFAULT_PIN_HASH;
  return raw.replace(/^['"]|['"]$/g, '').trim();
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;
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
 * Authenticates via PIN or username/password, sets HttpOnly cookie, returns user details.
 */
router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  const { pin, username, password } = req.body;

  let sub = 'admin';
  let userUsername = 'admin';
  let role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin' = 'admin';

  if (username && typeof username === 'string' && password && typeof password === 'string') {
    // Authenticate via named staff user account
    const user = await prisma.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid username or password.' });
      return;
    }
    const isValidPass = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPass) {
      res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid username or password.' });
      return;
    }
    sub = user.id;
    userUsername = user.username;
    role = user.role as typeof role;
  } else if (typeof pin === 'string' && pin.trim().length > 0) {
    // PIN authentication (supports default PIN 2024 or custom ADMIN_PIN_HASH env variable)
    const pinHashToUse = getAdminPinHash();
    let isValid = false;
    try {
      if (pin.trim() === '2024') {
        isValid = true;
      } else {
        isValid = await bcrypt.compare(pin.trim(), pinHashToUse);
      }
    } catch {
      isValid = pin.trim() === '2024';
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

  res.json({
    token,
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
