import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

export interface AuthenticatedRequest extends Request {
  adminId?: string;
}

/**
 * Middleware that validates the Authorization: Bearer <jwt> header.
 * Protects admin-only routes from unauthenticated access.
 */
export function adminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required. Provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as { sub: string; role: string };

    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'Insufficient privileges.' });
      return;
    }

    req.adminId = payload.sub;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TokenExpired', message: 'Admin session has expired. Please re-authenticate.' });
    } else {
      res.status(401).json({ error: 'InvalidToken', message: 'Invalid admin token.' });
    }
  }
}
