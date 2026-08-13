import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { adminAuth, JWT_ISSUER, JWT_AUDIENCE, AuthenticatedRequest } from '../middleware/adminAuth.js';

const router = Router();
const prisma = new PrismaClient();

const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '4h') as string;

if (!ADMIN_PIN_HASH) {
  throw new Error('ADMIN_PIN_HASH is not set in environment variables');
}
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

function setAdminCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('rex_admin_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 4 * 60 * 60 * 1000, // 4 hours in ms
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
    // Legacy PIN authentication
    const currentPinHash = process.env.ADMIN_PIN_HASH ?? ADMIN_PIN_HASH;
    let isValid = false;
    try {
      isValid = await bcrypt.compare(pin.trim(), currentPinHash);
    } catch {
      res.status(500).json({ error: 'ServerError', message: 'Authentication failed.' });
      return;
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
    JWT_SECRET as string,
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
