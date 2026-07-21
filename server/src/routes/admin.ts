import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '4h') as string;

if (!ADMIN_PIN_HASH) {
  throw new Error('ADMIN_PIN_HASH is not set in environment variables');
}
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

/**
 * POST /api/admin/auth
 * Accepts a PIN, validates against the bcrypt hash, returns a signed JWT.
 * The JWT is short-lived (4h) and carries role: 'admin'.
 *
 * Rate limited by the parent router (applied in index.ts).
 */
router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  const { pin } = req.body;

  if (typeof pin !== 'string' || pin.trim().length === 0) {
    res.status(400).json({ error: 'BadRequest', message: 'PIN is required.' });
    return;
  }

  // Always do the compare (even on blank input) to prevent timing attacks
  let isValid = false;
  try {
    isValid = await bcrypt.compare(pin, ADMIN_PIN_HASH as string);
  } catch {
    res.status(500).json({ error: 'ServerError', message: 'Authentication failed.' });
    return;
  }

  if (!isValid) {
    // Generic message — never reveal whether the PIN format or value was wrong
    res.status(401).json({ error: 'InvalidCredentials', message: 'Incorrect PIN.' });
    return;
  }

  // jsonwebtoken accepts string durations like '4h' but the TS overloads need help
  const token = jwt.sign(
    { sub: 'admin', role: 'admin', iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: JWT_EXPIRES_IN } as any
  );

  // Compute expiry timestamp for the frontend to know when to prompt re-auth
  const decoded = jwt.decode(token) as { exp: number };

  res.json({ token, expiresAt: decoded.exp * 1000 }); // expiresAt in ms
});

export default router;
