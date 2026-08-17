import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { getJwtSecret, JWT_ISSUER, parseCookies } from '../middleware/adminAuth.js';
import { customerAuth, AuthenticatedCustomerRequest, CUSTOMER_JWT_AUDIENCE } from '../middleware/customerAuth.js';

const router = Router();

const signupAttemptsStore = new Map<string, number>();

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

// Helper to sanitize customer output
function sanitizeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    emailVerified: !!user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Check if phone exists
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'ValidationError', message: 'Phone is required.' });
      return;
    }
    const user = await prisma.user.findFirst({ where: { phone: phone.trim() } });
    res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error('Check phone error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to verify phone number.' });
  }
});

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'ValidationError', message: 'All fields are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Basic regex checks for basic formatting sanity
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid email format.' });
      return;
    }

    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'ValidationError', message: 'Phone number must be at least 10 digits.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 6 characters long.' });
      return;
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this email already exists.' });
      return;
    }

    // Check duplicate phone
    const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
    if (existingPhone) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this mobile number already exists.' });
      return;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

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
      otp,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to initiate registration.' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !phone || !password || !otp) {
      res.status(400).json({ error: 'ValidationError', message: 'All fields are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check duplicate email (again to prevent race conditions)
    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this email already exists.' });
      return;
    }

    // Check duplicate phone
    const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
    if (existingPhone) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this mobile number already exists.' });
      return;
    }

    // Find verification record
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

    // Clear verification record and attempts
    await prisma.otpVerification.delete({ where: { phone: cleanPhone } }).catch(() => {});
    signupAttemptsStore.delete(cleanPhone);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        emailVerified: true,
      },
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      getJwtSecret(),
      {
        expiresIn: '30d',
        issuer: JWT_ISSUER,
        audience: CUSTOMER_JWT_AUDIENCE,
      }
    );

    const csrf = setCustomerCookie(res, token);
    res.status(201).json({ user: sanitizeUser(user), csrfToken: csrf });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to verify OTP.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      res.status(400).json({ error: 'ValidationError', message: 'Email/phone and password are required.' });
      return;
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();

    // Search user by email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { phone: emailOrPhone.trim() }
        ]
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      getJwtSecret(),
      {
        expiresIn: '30d',
        issuer: JWT_ISSUER,
        audience: CUSTOMER_JWT_AUDIENCE,
      }
    );

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

// Current User Details
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

    if (!name || !phone) {
      res.status(400).json({ error: 'ValidationError', message: 'Name and phone are required.' });
      return;
    }

    const cleanPhone = phone.trim();
    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'ValidationError', message: 'Phone number must be at least 10 digits.' });
      return;
    }

    // Check unique phone duplicate
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: cleanPhone,
        NOT: { id: userId }
      }
    });

    if (existingPhone) {
      res.status(400).json({ error: 'ValidationError', message: 'An account with this mobile number already exists.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        phone: cleanPhone,
      }
    });

    res.json({ user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update profile.' });
  }
});

interface EmailOtpSession {
  email: string;
  otp: string;
  expiresAt: Date;
  lastSentAt: Date;
  attempts: number;
}

const emailOtpStore = new Map<string, EmailOtpSession>();

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

interface ForgotPasswordSession {
  email: string;
  otp: string;
  expiresAt: Date;
  lastSentAt: Date;
  attempts: number;
}
const forgotPasswordOtpStore = new Map<string, ForgotPasswordSession>();

// Forgot Password Request
router.post('/forgot-password-request', async (req, res) => {
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
