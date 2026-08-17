import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../db.js';
import { getJwtSecret, JWT_ISSUER, parseCookies } from '../middleware/adminAuth.js';
import { customerAuth, AuthenticatedCustomerRequest, CUSTOMER_JWT_AUDIENCE } from '../middleware/customerAuth.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSecurityEmail,
} from '../services/email.js';

const router = Router();

// Public auth configuration (e.g. Google Client ID)
router.get('/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
  });
});

const signupAttemptsStore = new Map<string, number>();

interface EmailOtpSession {
  email: string;
  otp: string;
  expiresAt: Date;
  lastSentAt: Date;
  attempts: number;
}
const emailOtpStore = new Map<string, EmailOtpSession>();

interface ForgotPasswordSession {
  email: string;
  otp: string;
  expiresAt: Date;
  lastSentAt: Date;
  attempts: number;
}
const forgotPasswordOtpStore = new Map<string, ForgotPasswordSession>();

// -- Google OAuth2 client (singleton) --
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// -- Helpers --

function setCustomerCookie(res: Response, token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSiteMode = isProd ? 'none' : 'lax';
  const csrfToken = randomBytes(32).toString('base64url');

  res.cookie('rex_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteMode,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });

  res.cookie('rex_csrf', csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: sameSiteMode,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return csrfToken;
}

function sanitizeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    picture: user.picture ?? null,
    emailVerified: user.emailVerified ?? false,
    hasGoogleLinked: Boolean(user.googleId),
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function issueJwt(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email },
    getJwtSecret(),
    {
      expiresIn: '30d',
      issuer: JWT_ISSUER,
      audience: CUSTOMER_JWT_AUDIENCE,
    }
  );
}

/** Generate a cryptographically secure random token and its SHA-256 hash */
function generateToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

// EMAIL_RE - basic email format check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// EXISTING ROUTES (preserved for backward compatibility)
// ============================================================================

// Email OTP Signup (Step 1)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'ValidationError', message: 'All fields are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!EMAIL_RE.test(cleanEmail)) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid email format.' });
      return;
    }

    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'ValidationError', message: 'Phone number must be at least 10 digits.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 8 characters long.' });
      return;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this email already exists.' });
      return;
    }

    const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
    if (existingPhone) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this mobile number already exists.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.upsert({
      where: { phone: cleanPhone },
      create: { phone: cleanPhone, otp, expiresAt },
      update: { otp, expiresAt },
    });

    signupAttemptsStore.set(cleanPhone, 0);

    console.log(`🔑 [Email OTP - Signup] Verification code for ${cleanEmail} is: ${otp}`);

    res.status(200).json({
      status: 'otp_sent',
      phone: cleanPhone,
      ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to initiate registration.' });
  }
});

// Email OTP Verify (Step 2)
router.post('/verify-otp', async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !phone || !password || !otp) {
      res.status(400).json({ error: 'ValidationError', message: 'All fields are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this email already exists.' });
      return;
    }

    const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
    if (existingPhone) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this mobile number already exists.' });
      return;
    }

    const otpRecord = await prisma.otpVerification.findUnique({ where: { phone: cleanPhone } });

    if (!otpRecord) {
      res.status(400).json({ error: 'ValidationError', message: 'No verification session found for this phone number.' });
      return;
    }

    // Max attempts check (3 attempts)
    const currentAttempts = signupAttemptsStore.get(cleanPhone) || 0;
    if (currentAttempts >= 3) {
      await prisma.otpVerification.delete({ where: { phone: cleanPhone } }).catch(() => {});
      signupAttemptsStore.delete(cleanPhone);
      res.status(400).json({ error: 'ValidationError', message: 'Maximum verification attempts exceeded. Please request a new code.' });
      return;
    }

    // Expiry check
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otpVerification.delete({ where: { phone: cleanPhone } }).catch(() => {});
      signupAttemptsStore.delete(cleanPhone);
      res.status(400).json({ error: 'ValidationError', message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    // OTP match check
    if (otpRecord.otp !== otp.trim()) {
      const newAttempts = currentAttempts + 1;
      signupAttemptsStore.set(cleanPhone, newAttempts);
      if (newAttempts >= 3) {
        await prisma.otpVerification.delete({ where: { phone: cleanPhone } }).catch(() => {});
        signupAttemptsStore.delete(cleanPhone);
        res.status(400).json({ error: 'ValidationError', message: 'Maximum verification attempts exceeded. Please request a new code.' });
        return;
      }
      const remaining = 3 - newAttempts;
      res.status(400).json({ error: 'ValidationError', message: `Invalid verification code. ${remaining} attempts remaining.` });
      return;
    }

    await prisma.otpVerification.delete({ where: { phone: cleanPhone } }).catch(() => {});
    signupAttemptsStore.delete(cleanPhone);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        emailVerified: true, // Marked verified upon successful signup OTP verification
      },
    });

    const token = issueJwt(user.id, user.email);
    const csrf = setCustomerCookie(res, token);
    res.status(201).json({ user: sanitizeUser(user), csrfToken: csrf });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to verify OTP.' });
  }
});

// Login (email or phone)
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      res.status(400).json({ error: 'ValidationError', message: 'Email/phone and password are required.' });
      return;
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { phone: emailOrPhone.trim() },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
      return;
    }

    const token = issueJwt(user.id, user.email);
    const csrf = setCustomerCookie(res, token);
    res.json({ user: sanitizeUser(user), csrfToken: csrf });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to login.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('rex_token', { path: '/' });
  res.clearCookie('rex_csrf', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User
router.get('/me', async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const cookies = parseCookies(req);
    const authHeader = req.headers['authorization'];
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (cookies['rex_token']) {
      token = cookies['rex_token'];
    }

    if (!token) {
      res.json({ user: null });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
      audience: CUSTOMER_JWT_AUDIENCE,
    }) as any;

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      res.json({ user: null });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.json({ user: null });
  }
});

// Update Profile
router.patch('/profile', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.userId!;

    if (!name) {
      res.status(400).json({ error: 'ValidationError', message: 'Name is required.' });
      return;
    }

    const updateData: any = { name: name.trim() };

    if (phone !== undefined) {
      const cleanPhone = phone ? phone.trim() : '';
      if (cleanPhone && cleanPhone.length < 10) {
        res.status(400).json({ error: 'ValidationError', message: 'Phone number must be at least 10 digits.' });
        return;
      }

      if (cleanPhone) {
        const existingPhone = await prisma.user.findFirst({
          where: { phone: cleanPhone, NOT: { id: userId } },
        });
        if (existingPhone) {
          res.status(400).json({ error: 'ValidationError', message: 'An account with this mobile number already exists.' });
          return;
        }
        updateData.phone = cleanPhone;
      }
    }

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });
    res.json({ user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update profile.' });
  }
});

// ============================================================================
// NEW ROUTES
// ============================================================================

/**
 * POST /auth/register
 * Email + password registration with email verification flow.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'ValidationError', message: 'Name must be at least 2 characters.' });
      return;
    }
    if (!email || !EMAIL_RE.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid email format.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 8 characters.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        emailVerified: false,
      },
    });

    // Generate and store email verification token
    const { rawToken, tokenHash } = generateToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email (non-blocking - don't fail registration if email fails)
    sendVerificationEmail(cleanEmail, user.name, rawToken).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    res.status(201).json({
      status: 'registered',
      message: 'Account created. Please check your email to verify your address.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create account.' });
  }
});

/**
 * POST /auth/google
 * Verify Google ID token server-side, then sign in or create a Rephonix account.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'Google credential is required.' });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: 'ServerError', message: 'Google authentication is not configured.' });
      return;
    }

    // Verify the token server-side — never trust client-provided user info
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    } catch {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid Google credential.' });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid Google token payload.' });
      return;
    }

    const googleSub = payload.sub;
    const googleEmail = payload.email.toLowerCase();
    const googleName = payload.name || 'Rephonix User';
    const googlePicture = payload.picture || null;
    const googleEmailVerified = payload.email_verified ?? false;

    // 1. Check if a user already has this googleId
    let user = await prisma.user.findUnique({ where: { googleId: googleSub } });

    if (user) {
      // Existing Google user — update picture if changed
      if (googlePicture && user.picture !== googlePicture) {
        user = await prisma.user.update({ where: { id: user.id }, data: { picture: googlePicture } });
      }
      const token = issueJwt(user.id, user.email);
      const csrf = setCustomerCookie(res, token);
      return res.json({ user: sanitizeUser(user), csrfToken: csrf });
    }

    // 2. Check if an account exists with this email (password account)
    const existingByEmail = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (existingByEmail) {
      if (!existingByEmail.googleId) {
        // Email account exists but Google not linked — require explicit linking
        return res.status(409).json({
          error: 'AccountExists',
          message: 'An account with this email already exists with a password. Please log in with your password and then link Google in your account settings.',
          requiresLinking: true,
          email: googleEmail,
        });
      }
      // (googleId mismatch for same email — should not happen, but guard it)
      return res.status(409).json({ error: 'AccountConflict', message: 'Account conflict. Please contact support.' });
    }

    // 3. Create new Rephonix user from Google
    user = await prisma.user.create({
      data: {
        name: googleName,
        email: googleEmail,
        googleId: googleSub,
        picture: googlePicture,
        // Google has verified the email — trust it
        emailVerified: googleEmailVerified,
        emailVerifiedAt: googleEmailVerified ? new Date() : null,
      },
    });

    // Send welcome email non-blocking
    sendWelcomeEmail(googleEmail, googleName).catch(err =>
      console.error('Failed to send welcome email:', err)
    );

    const token = issueJwt(user.id, user.email);
    const csrf = setCustomerCookie(res, token);
    return res.status(201).json({ user: sanitizeUser(user), csrfToken: csrf, isNewUser: true });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Google authentication failed.' });
  }
});

/**
 * POST /auth/verify-email
 * Verify a user's email address using the token sent in the verification email.
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'Verification token is required.' });
      return;
    }

    const tokenHash = createHash('sha256').update(token.trim()).digest('hex');

    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record) {
      res.status(400).json({ error: 'InvalidToken', message: 'Invalid or already used verification link.' });
      return;
    }

    if (new Date() > record.expiresAt) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({ where: { tokenHash } }).catch(() => {});
      res.status(400).json({ error: 'TokenExpired', message: 'Verification link has expired. Please request a new one.' });
      return;
    }

    // Mark email as verified and clean up token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { tokenHash } }),
    ]);

    res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to verify email.' });
  }
});

/**
 * POST /auth/resend-verification
 * Resend the email verification link. Generic response to avoid email enumeration.
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_RE.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: 'ValidationError', message: 'A valid email address is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Always respond 200 (no email enumeration)
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (user && !user.emailVerified) {
      // Delete old tokens for this user
      await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

      const { rawToken, tokenHash } = generateToken();
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      sendVerificationEmail(cleanEmail, user.name, rawToken).catch(err =>
        console.error('Failed to resend verification email:', err)
      );
    }

    res.json({ message: 'If an unverified account exists for this email, a new verification link has been sent.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to resend verification email.' });
  }
});

/**
 * POST /auth/forgot-password
 * Request a password reset email. Always returns 200 (no email enumeration).
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_RE.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: 'ValidationError', message: 'A valid email address is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Only send reset if user has a password (Google-only users cannot reset a non-existent password)
    if (user && user.passwordHash) {
      // Invalidate old reset tokens for this user
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const { rawToken, tokenHash } = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      sendPasswordResetEmail(cleanEmail, user.name, rawToken).catch(err =>
        console.error('Failed to send password reset email:', err)
      );
    }

    // Generic success to avoid revealing whether an email exists
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to process request.' });
  }
});

/**
 * POST /auth/reset-password
 * Reset password using the secure token from the reset email.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'Reset token is required.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 8 characters.' });
      return;
    }

    const tokenHash = createHash('sha256').update(token.trim()).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.used) {
      res.status(400).json({ error: 'InvalidToken', message: 'Invalid or already used reset link.' });
      return;
    }

    if (new Date() > record.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { tokenHash } }).catch(() => {});
      res.status(400).json({ error: 'TokenExpired', message: 'Reset link has expired. Please request a new one.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { tokenHash }, data: { used: true } }),
    ]);

    // Fetch user for security notification
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (user) {
      sendSecurityEmail(user.email, user.name, 'password_reset').catch(() => {});
    }

    res.json({ success: true, message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to reset password.' });
  }
});

/**
 * POST /auth/link-google
 * Link a Google account to an existing authenticated Rephonix account.
 * The user must be logged in via password first.
 */
router.post('/link-google', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const { credential } = req.body;
    const userId = req.userId!;

    if (!credential || typeof credential !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'Google credential is required.' });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: 'ServerError', message: 'Google authentication is not configured.' });
      return;
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    } catch {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid Google credential.' });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid Google token payload.' });
      return;
    }

    const googleSub = payload.sub;

    // Check if this Google account is already linked to another user
    const existingGoogle = await prisma.user.findUnique({ where: { googleId: googleSub } });
    if (existingGoogle && existingGoogle.id !== userId) {
      res.status(409).json({ error: 'Conflict', message: 'This Google account is already linked to another Rephonix account.' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: googleSub,
        picture: payload.picture ?? undefined,
      },
    });

    sendSecurityEmail(user.email, user.name, 'google_linked').catch(() => {});

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Link Google error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to link Google account.' });
  }
});

/**
 * POST /auth/unlink-google
 * Unlink the Google account from the authenticated user.
 * Only allowed if the user also has a password set.
 */
router.post('/unlink-google', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'NotFound', message: 'User not found.' });
      return;
    }

    if (!user.googleId) {
      res.status(400).json({ error: 'BadRequest', message: 'No Google account is linked.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ error: 'BadRequest', message: 'You must set a password before unlinking Google, otherwise you would lose access to your account.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { googleId: null, picture: null },
    });

    sendSecurityEmail(user.email, user.name, 'google_unlinked').catch(() => {});

    res.json({ success: true, user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error('Unlink Google error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to unlink Google account.' });
  }
});

// Send Email OTP
router.post('/send-email-otp', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'ValidationError', message: 'Email address is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid email format.' });
      return;
    }

    // Check if the email is already registered by another customer
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        NOT: { id: req.userId },
      },
    });

    if (existingEmail) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this email already exists.' });
      return;
    }

    // Cooldown check (60 seconds)
    const existingSession = emailOtpStore.get(cleanEmail);
    if (existingSession) {
      const secondsSinceLastSent = (Date.now() - existingSession.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const remaining = Math.ceil(60 - secondsSinceLastSent);
        res.status(429).json({
          error: 'RateLimitError',
          message: `Please wait ${remaining} seconds before requesting a new code.`
        });
        return;
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    emailOtpStore.set(cleanEmail, {
      email: cleanEmail,
      otp,
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0
    });

    console.log(`🔑 [Email OTP] Verification code for ${cleanEmail} is: ${otp}`);

    res.status(200).json({
      success: true,
      email: cleanEmail,
      otp
    });
  } catch (err) {
    console.error('Send email OTP error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to generate verification code.' });
  }
});

// Verify Email OTP
router.post('/verify-email-otp', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'ValidationError', message: 'Email and verification code are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const session = emailOtpStore.get(cleanEmail);
    if (!session) {
      res.status(400).json({ error: 'ValidationError', message: 'No verification session found for this email.' });
      return;
    }

    // Expiry check
    if (new Date() > session.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      res.status(400).json({ error: 'ValidationError', message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    // Max attempts check (3 attempts)
    session.attempts += 1;
    if (session.attempts > 3) {
      emailOtpStore.delete(cleanEmail);
      res.status(400).json({ error: 'ValidationError', message: 'Maximum verification attempts exceeded. Please request a new code.' });
      return;
    }

    // OTP Match check
    if (session.otp !== cleanOtp) {
      const remainingAttempts = 3 - session.attempts;
      emailOtpStore.set(cleanEmail, session); // update attempts count
      res.status(400).json({
        error: 'ValidationError',
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`
      });
      return;
    }

    // Success! Update user's email and set emailVerified to true
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        email: cleanEmail,
        emailVerified: true
      }
    });

    // Invalidate the session
    emailOtpStore.delete(cleanEmail);

    res.status(200).json({
      success: true,
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error('Verify email OTP error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to verify email.' });
  }
});

// Forgot Password Request
router.post('/forgot-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'ValidationError', message: 'Email address is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid email format.' });
      return;
    }

    // Verify if user exists
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      res.status(400).json({ error: 'ValidationError', message: 'No account found with this email address.' });
      return;
    }

    // Cooldown check (60 seconds)
    const existingSession = forgotPasswordOtpStore.get(cleanEmail);
    if (existingSession) {
      const secondsSinceLastSent = (Date.now() - existingSession.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const remaining = Math.ceil(60 - secondsSinceLastSent);
        res.status(429).json({
          error: 'RateLimitError',
          message: `Please wait ${remaining} seconds before requesting a new code.`
        });
        return;
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    forgotPasswordOtpStore.set(cleanEmail, {
      email: cleanEmail,
      otp,
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0
    });

    console.log(`🔑 [Forgot Password OTP] Verification code for ${cleanEmail} is: ${otp}`);

    res.status(200).json({
      success: true,
      email: cleanEmail,
      otp
    });
  } catch (err) {
    console.error('Forgot password request error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to request reset code.' });
  }
});

// Forgot Password Reset
router.post('/forgot-password-reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: 'ValidationError', message: 'All fields are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const session = forgotPasswordOtpStore.get(cleanEmail);
    if (!session) {
      res.status(400).json({ error: 'ValidationError', message: 'No reset session found for this email.' });
      return;
    }

    // Expiry check
    if (new Date() > session.expiresAt) {
      forgotPasswordOtpStore.delete(cleanEmail);
      res.status(400).json({ error: 'ValidationError', message: 'Reset code has expired. Please request a new one.' });
      return;
    }

    // Max attempts check (3 attempts)
    session.attempts += 1;
    if (session.attempts > 3) {
      forgotPasswordOtpStore.delete(cleanEmail);
      res.status(400).json({ error: 'ValidationError', message: 'Maximum reset attempts exceeded. Please request a new code.' });
      return;
    }

    // OTP match check
    if (session.otp !== cleanOtp) {
      const remainingAttempts = 3 - session.attempts;
      forgotPasswordOtpStore.set(cleanEmail, session); // update attempts count
      res.status(400).json({
        error: 'ValidationError',
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`
      });
      return;
    }

    // Success! Hash new password and update database
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash }
    });

    // Invalidate the session
    forgotPasswordOtpStore.delete(cleanEmail);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (err) {
    console.error('Forgot password reset error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to reset password.' });
  }
});

export default router;
