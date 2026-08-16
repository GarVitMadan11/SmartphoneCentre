import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, parseCookies, JWT_ISSUER } from './adminAuth.js';
import prisma from '../db.js';

export interface CustomerPayload {
  sub: string; // userId
  email: string;
  iss: string;
  aud: string;
}

export interface AuthenticatedCustomerRequest extends Request {
  userId?: string;
  customer?: any;
}

export const CUSTOMER_JWT_AUDIENCE = 'smartphone-centre-customer';

export async function customerAuth(
  req: AuthenticatedCustomerRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cookies = parseCookies(req);
  const authHeader = req.headers['authorization'];
  let token: string | undefined;
  let isCookieSession = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
    isCookieSession = false;
  } else if (cookies['rex_token']) {
    token = cookies['rex_token'];
    isCookieSession = true;
  }

  // SameSite cookies are the first CSRF defense; cookie-only sessions require matching CSRF token.
  if (isCookieSession && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'];
    if (typeof csrfToken !== 'string' || !cookies['rex_csrf'] || csrfToken !== cookies['rex_csrf']) {
      res.status(403).json({ error: 'CsrfValidationFailed', message: 'A valid CSRF token is required for cookie session requests.' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
      audience: CUSTOMER_JWT_AUDIENCE,
    }) as CustomerPayload;

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found.' });
      return;
    }

    req.userId = user.id;
    req.customer = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
  }
}
