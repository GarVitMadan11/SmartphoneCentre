import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_ISSUER = 'smartphone-centre-api';
export const JWT_AUDIENCE = 'smartphone-centre-admin';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

export interface AdminPayload {
  sub: string;       // adminUserId
  username: string;
  role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin';
  iss: string;
  aud: string;
}

export interface AuthenticatedRequest extends Request {
  adminId?: string;
  user?: AdminPayload;
}

/**
 * Parses cookies from raw Cookie header if cookie-parser is not used.
 */
function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    const value = parts.join('=').trim();
    if (name) list[name] = decodeURIComponent(value);
  });
  return list;
}

/**
 * Middleware that extracts and validates the JWT from:
 * 1. HttpOnly cookie `rex_admin_token`
 * 2. Authorization: Bearer <jwt> header fallback
 */
export function adminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const cookies = parseCookies(req);
  let token = cookies['rex_admin_token'];

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required. Session cookie or Bearer token missing.',
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET as string, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    }) as AdminPayload;

    const allowedRoles: AdminPayload['role'][] = ['SUPER_ADMIN', 'FINANCE_APPROVER', 'OPERATIONS_AGENT', 'CATALOG_EDITOR', 'admin'];
    if (!allowedRoles.includes(payload.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Admin role required.' });
      return;
    }

    req.adminId = payload.sub;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TokenExpired', message: 'Admin session has expired. Please re-authenticate.' });
    } else {
      res.status(401).json({ error: 'InvalidToken', message: 'Invalid admin token or invalid token signature.' });
    }
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 */
export function requireRole(allowedRoles: Array<AdminPayload['role']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    // Legacy 'admin' role maps to full permissions
    const userRole = req.user.role;
    if (userRole === 'SUPER_ADMIN' || userRole === 'admin' || allowedRoles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({
      error: 'Forbidden',
      message: `Role '${userRole}' is not authorized to perform this operation. Allowed: ${allowedRoles.join(', ')}`,
    });
  };
}
