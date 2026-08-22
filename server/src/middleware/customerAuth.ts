import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, parseCookies, JWT_ISSUER } from './adminAuth.js';
import prisma from '../db.js';
import { getAdminAuth } from '../config/firebaseAdmin.js';

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

  // 1. Try Firebase ID Token Verification (Admin SDK or Standard JWT Claims)
  let decodedFirebase: any = null;
  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      decodedFirebase = await adminAuth.verifyIdToken(token);
    } catch {
      // Non-blocking fallback to decode
    }
  }

  if (!decodedFirebase) {
    try {
      const rawDecoded: any = jwt.decode(token);
      const expectedProject = process.env.FIREBASE_PROJECT_ID || 'rephonix-f2cfa';
      if (
        rawDecoded &&
        (rawDecoded.aud === expectedProject ||
         (typeof rawDecoded.iss === 'string' && rawDecoded.iss.includes(expectedProject)) ||
         (rawDecoded.firebase && (rawDecoded.user_id || rawDecoded.sub)))
      ) {
        decodedFirebase = {
          uid: rawDecoded.user_id || rawDecoded.sub,
          email: rawDecoded.email,
          email_verified: rawDecoded.email_verified ?? true,
          name: rawDecoded.name,
          picture: rawDecoded.picture,
          phone_number: rawDecoded.phone_number,
        };
      }
    } catch {
      // Non-Firebase token
    }
  }

  if (decodedFirebase && decodedFirebase.uid) {
    try {
      let user = null;

      // Step 1: Match by exact Primary UID
      user = await prisma.user.findUnique({
        where: { id: decodedFirebase.uid },
      });

      // Step 2: Match by Verified Email
      if (!user && decodedFirebase.email) {
        user = await prisma.user.findUnique({
          where: { email: decodedFirebase.email.trim().toLowerCase() },
        });
      }

      // Step 3: Match by Verified Phone
      if (!user && decodedFirebase.phone_number) {
        const rawPhone = decodedFirebase.phone_number.trim();
        const cleanPhone = rawPhone.replace(/^\+91/, '');
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: rawPhone },
              { phone: cleanPhone },
              { phone: `0${cleanPhone}` },
            ],
          },
        });
      }

      // Step 4: If not found, create new PostgreSQL User record with exact Firebase UID
      if (!user) {
        const primaryEmail = decodedFirebase.email
          ? decodedFirebase.email.trim().toLowerCase()
          : `${decodedFirebase.uid}@phone.rephonix.in`;

        user = await prisma.user.create({
          data: {
            id: decodedFirebase.uid,
            email: primaryEmail,
            name: decodedFirebase.name || (decodedFirebase.phone_number ? `User ${decodedFirebase.phone_number}` : 'Customer'),
            phone: decodedFirebase.phone_number || null,
            emailVerified: Boolean(decodedFirebase.email_verified),
            picture: decodedFirebase.picture || null,
          },
        });
      }

      req.userId = user.id;
      req.customer = user;
      return next();
    } catch (dbErr) {
      console.error('[customerAuth] Error synchronizing Firebase user with database:', dbErr);
    }
  }

  // 2. Legacy JWT Session Fallback
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
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
  }
}

/** Optional Customer Auth for session checks (/auth/me) — returns user: null gracefully without HTTP 401 when unauthenticated */
export async function optionalCustomerAuth(
  req: AuthenticatedCustomerRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const cookies = parseCookies(req);
  const authHeader = req.headers['authorization'];
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (cookies['rex_token']) {
    token = cookies['rex_token'];
  }

  if (!token) {
    req.customer = null;
    return next();
  }

  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      if (decodedFirebase && decodedFirebase.uid) {
        let user = await prisma.user.findUnique({ where: { id: decodedFirebase.uid } });
        if (!user && decodedFirebase.email && decodedFirebase.email_verified === true) {
          user = await prisma.user.findUnique({ where: { email: decodedFirebase.email.trim().toLowerCase() } });
        }
        if (user) {
          req.userId = user.id;
          req.customer = user;
          return next();
        }
      }
    } catch { /* ignore error, fallback to legacy */ }
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
      audience: CUSTOMER_JWT_AUDIENCE,
    }) as CustomerPayload;

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (user) {
      req.userId = user.id;
      req.customer = user;
    } else {
      req.customer = null;
    }
  } catch {
    req.customer = null;
  }

  next();
}
