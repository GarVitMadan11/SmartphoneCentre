import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { getJwtSecret, JWT_ISSUER, parseCookies } from '../middleware/adminAuth.js';
import { customerAuth, AuthenticatedCustomerRequest, CUSTOMER_JWT_AUDIENCE } from '../middleware/customerAuth.js';

const router = Router();

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

    console.log(`🔑 [OTP] Verification code for ${cleanPhone} is: ${otp}`);

    const isDev = process.env.NODE_ENV !== 'production';
    res.status(200).json({
      status: 'otp_sent',
      phone: cleanPhone,
      ...(isDev ? { testOtp: otp } : {})
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

    if (otpRecord.otp !== otp.trim()) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid verification code.' });
      return;
    }

    if (new Date() > otpRecord.expiresAt) {
      res.status(400).json({ error: 'ValidationError', message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    // Clear verification record
    await prisma.otpVerification.delete({ where: { phone: cleanPhone } }).catch(() => {});

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
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

export default router;
