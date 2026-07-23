import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { adminAuth } from './middleware/adminAuth.js';
import adminRouter from './routes/admin.js';

const prisma = new PrismaClient();
const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Trust first proxy (e.g. Nginx, Cloudflare, AWS ALB) for accurate IP rate limiting
app.set('trust proxy', 1);

// ── Parse allowed origins from env ───────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Helmet — sets security-critical HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS — only allow configured origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging (combined format in prod, dev format locally)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing — 4MB limit to support base64 catalog image file uploads
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false, limit: '4mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────
// Global limiter (public endpoints)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many requests. Please try again later.' },
});

// Strict limiter for auth endpoint (prevents PIN brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true, // only count failures
});

// Booking creation limiter (anti-spam)
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // 5 booking submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many booking submissions. Please try again later.' },
});

app.use(globalLimiter);

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const PHONE_RE = /^[6-9]\d{9}$/;     // Indian mobile number
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  return /^https?:\/\//i.test(trimmed) || /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(trimmed);
}

export function validateBookingBody(b: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!b.customerName || typeof b.customerName !== 'string' || b.customerName.trim().length < 2 || b.customerName.trim().length > 100)
    errors.push('customerName: must be between 2 and 100 characters');
  if (!b.customerPhone || typeof b.customerPhone !== 'string' || !PHONE_RE.test(b.customerPhone.trim()))
    errors.push('customerPhone: must be a valid 10-digit Indian mobile number');
  if (!b.customerEmail || typeof b.customerEmail !== 'string' || b.customerEmail.trim().length > 100 || !EMAIL_RE.test(b.customerEmail.trim()))
    errors.push('customerEmail: must be a valid email address under 100 characters');
  if (!b.address || typeof b.address !== 'string' || b.address.trim().length < 10 || b.address.trim().length > 500)
    errors.push('address: must be between 10 and 500 characters');
  if (!b.pickupDate || typeof b.pickupDate !== 'string')
    errors.push('pickupDate: required');
  if (!b.pickupTimeSlot || typeof b.pickupTimeSlot !== 'string')
    errors.push('pickupTimeSlot: required');
  if (!b.modelId && !b.modelLegacyId)
    errors.push('modelId: required');
  if (!b.storageGb || typeof b.storageGb !== 'number' || b.storageGb <= 0)
    errors.push('storageGb: must be a positive number');
  if (!b.finalPrice || typeof b.finalPrice !== 'number' || b.finalPrice < 0)
    errors.push('finalPrice: must be a non-negative number');
  if (!b.payoutMethod || typeof b.payoutMethod !== 'string')
    errors.push('payoutMethod: required');
  if (typeof b.finalPayoutAmount !== 'number' || b.finalPayoutAmount < 0)
    errors.push('finalPayoutAmount: must be a non-negative number');
  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN AUTH (rate-limited, no adminAuth middleware — this IS the auth gate)
// ═══════════════════════════════════════════════════════════════════════════

app.use('/api/admin', authLimiter, adminRouter);

// ═══════════════════════════════════════════════════════════════════════════
// BRANDS — Public read
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/brands', async (_req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    res.json(brands.map(b => ({ id: b.id, name: b.name, logo: b.logo })));
  } catch (err) {
    console.error('GET /api/brands error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch brands' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MODELS — Public read, admin-only write
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/models', async (req, res) => {
  try {
    const { brandId } = req.query;
    const where: Record<string, unknown> = {};
    if (brandId && typeof brandId === 'string') where.brandId = brandId;

    const models = await prisma.model.findMany({ where, orderBy: { releaseYear: 'desc' } });
    res.json(models.map(m => ({
      id: m.legacyId,
      brandId: m.brandId,
      name: m.name,
      modelNumber: m.modelNumber,
      category: m.category,
      releaseYear: m.releaseYear,
      basePrice128GB: m.basePrice128GB,
      series: m.series,
      imageUrl: m.imageUrl,
    })));
  } catch (err) {
    console.error('GET /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch models' });
  }
});

// Add a new model — ADMIN ONLY
app.post('/api/models', adminAuth, async (req, res) => {
  try {
    const { legacyId, brandId, name, modelNumber, category, releaseYear, basePrice128GB, series, imageUrl } = req.body;

    if (!legacyId || !brandId || !name || !modelNumber || !category || !releaseYear || !basePrice128GB) {
      res.status(400).json({ error: 'BadRequest', message: 'Missing required fields: legacyId, brandId, name, modelNumber, category, releaseYear, basePrice128GB' });
      return;
    }

    const existing = await prisma.model.findUnique({ where: { legacyId } });
    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'A model with this ID already exists' });
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      res.status(400).json({ error: 'BadRequest', message: 'imageUrl must be a valid http(s) URL or base64 Data URL' });
      return;
    }

    const model = await prisma.model.create({
      data: {
        legacyId: String(legacyId).trim(),
        brandId: String(brandId),
        name: String(name).trim(),
        modelNumber: String(modelNumber).trim(),
        category: String(category).trim(),
        releaseYear: Number(releaseYear),
        basePrice128GB: Number(basePrice128GB),
        series: series ? String(series).trim() : '',
        imageUrl: imageUrl ? String(imageUrl).trim() : '',
      },
    });

    res.status(201).json({
      id: model.legacyId, brandId: model.brandId, name: model.name,
      modelNumber: model.modelNumber, category: model.category,
      releaseYear: model.releaseYear, basePrice128GB: model.basePrice128GB,
      series: model.series, imageUrl: model.imageUrl,
    });

    // Fire-and-forget audit log (non-blocking)
    prisma.adminAuditLog.create({
      data: {
        action: 'create_model',
        targetType: 'model',
        targetId: model.legacyId,
        payload: JSON.stringify({ name: model.name, brandId: model.brandId }),
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      },
    }).catch(e => console.warn('[AuditLog] Failed to write:', e));
  } catch (err) {
    console.error('POST /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create model' });
  }
});

// Update a model — ADMIN ONLY
app.patch('/api/models/:legacyId', adminAuth, async (req, res) => {
  try {
    const legacyId = String(req.params.legacyId);
    const { name, modelNumber, category, releaseYear, basePrice128GB, series, imageUrl } = req.body;

    if (imageUrl !== undefined && !isValidImageUrl(imageUrl)) {
      res.status(400).json({ error: 'BadRequest', message: 'imageUrl must be a valid http(s) URL or base64 Data URL' });
      return;
    }

    const existing = await prisma.model.findUnique({ where: { legacyId } });
    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: 'Model not found' });
      return;
    }

    const updated = await prisma.model.update({
      where: { legacyId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(modelNumber !== undefined && { modelNumber: String(modelNumber).trim() }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(releaseYear !== undefined && { releaseYear: Number(releaseYear) }),
        ...(basePrice128GB !== undefined && { basePrice128GB: Number(basePrice128GB) }),
        ...(series !== undefined && { series: String(series).trim() }),
        ...(imageUrl !== undefined && { imageUrl: String(imageUrl).trim() }),
      },
    });

    res.json({
      id: updated.legacyId, brandId: updated.brandId, name: updated.name,
      modelNumber: updated.modelNumber, category: updated.category,
      releaseYear: updated.releaseYear, basePrice128GB: updated.basePrice128GB,
      series: updated.series, imageUrl: updated.imageUrl,
    });

    // Fire-and-forget audit log (non-blocking)
    prisma.adminAuditLog.create({
      data: {
        action: 'update_model',
        targetType: 'model',
        targetId: updated.legacyId,
        payload: JSON.stringify({ name: updated.name, basePrice128GB: updated.basePrice128GB, series: updated.series }),
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      },
    }).catch(e => console.warn('[AuditLog] Failed to write:', e));
  } catch (err) {
    console.error('PATCH /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update model' });
  }
});

// Delete a model — ADMIN ONLY
app.delete('/api/models/:legacyId', adminAuth, async (req, res) => {
  try {
    const legacyId = String(req.params.legacyId);
    const model = await prisma.model.findUnique({ where: { legacyId } });
    if (!model) {
      res.status(404).json({ error: 'NotFound', message: 'Model not found' });
      return;
    }
    await prisma.model.delete({ where: { legacyId } });
    res.json({ success: true, deleted: legacyId });

    // Fire-and-forget audit log
    prisma.adminAuditLog.create({
      data: {
        action: 'delete_model',
        targetType: 'model',
        targetId: legacyId,
        payload: JSON.stringify({ name: model.name }),
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      },
    }).catch(e => console.warn('[AuditLog] Failed to write:', e));
  } catch (err) {
    console.error('DELETE /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to delete model' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════

function mapBooking(b: {
  id: string; modelLegacyId: string; modelName: string; modelNumber: string;
  storageGb: number; color: string; customerName: string; customerPhone: string;
  customerEmail: string; address: string; pickupDate: string; pickupTimeSlot: string;
  finalPrice: number; verificationStatus: string; verifiedName: string;
  maskedAadhaar: string; verificationDate: string; payoutMethod: string;
  payoutMethodName: string; bonusPercentage: number; bonusAmount: number;
  finalPayoutAmount: number; payoutDetailsJson: string; inspectionStatus: string;
  payoutStatus: string; dateCreated: string;
}) {
  return {
    id: b.id,
    modelId: b.modelLegacyId,
    modelName: b.modelName,
    modelNumber: b.modelNumber,
    storageGb: b.storageGb,
    color: b.color,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
    address: b.address,
    pickupDate: b.pickupDate,
    pickupTimeSlot: b.pickupTimeSlot,
    finalPrice: b.finalPrice,
    verificationStatus: b.verificationStatus,
    verifiedName: b.verifiedName,
    maskedAadhaar: b.maskedAadhaar,
    verificationDate: b.verificationDate,
    payoutMethod: b.payoutMethod,
    payoutMethodName: b.payoutMethodName,
    bonusPercentage: b.bonusPercentage,
    bonusAmount: b.bonusAmount,
    finalPayoutAmount: b.finalPayoutAmount,
    payoutDetails: (() => { try { return JSON.parse(b.payoutDetailsJson || '{}'); } catch { return {}; } })(),
    inspectionStatus: b.inspectionStatus,
    payoutStatus: b.payoutStatus,
    dateCreated: b.dateCreated,
  };
}

// Get all bookings — ADMIN ONLY
app.get('/api/bookings', adminAuth, async (_req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bookings.map(mapBooking));
  } catch (err) {
    console.error('GET /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch bookings' });
  }
});

// Create booking — public, but rate-limited
app.post('/api/bookings', bookingLimiter, async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>;

    // Server-side validation
    const errors = validateBookingBody(b);
    if (errors.length > 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Booking validation failed', fields: errors });
      return;
    }

    // Generate booking ID server-side — client-provided IDs are ignored
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const suffix = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const bookingId = `STC-${suffix}`;

    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        modelLegacyId: String(b.modelId ?? b.modelLegacyId),
        modelName: String(b.modelName ?? ''),
        modelNumber: String(b.modelNumber ?? ''),
        storageGb: Number(b.storageGb),
        color: String(b.color ?? ''),
        customerName: String(b.customerName).trim(),
        customerPhone: String(b.customerPhone).trim(),
        customerEmail: String(b.customerEmail).trim().toLowerCase(),
        address: String(b.address).trim(),
        pickupDate: String(b.pickupDate),
        pickupTimeSlot: String(b.pickupTimeSlot),
        finalPrice: Number(b.finalPrice),
        verificationStatus: 'pending',
        verifiedName: '',
        maskedAadhaar: '',
        verificationDate: '',
        payoutMethod: String(b.payoutMethod),
        payoutMethodName: String(b.payoutMethodName ?? ''),
        bonusPercentage: Number(b.bonusPercentage ?? 0),
        bonusAmount: Number(b.bonusAmount ?? 0),
        finalPayoutAmount: Number(b.finalPayoutAmount),
        inspectionStatus: 'pending',
        payoutStatus: 'pending',
        dateCreated: new Date().toISOString(), // server-side timestamp
        payoutDetailsJson: (() => {
          try { return JSON.stringify(b.payoutDetails ?? {}); } catch { return '{}'; }
        })(),
      },
    });

    res.status(201).json({ success: true, id: booking.id });

    // Fire-and-forget: record the 'created' lifecycle event
    prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'created',
        toValue: booking.id,
        note: `Booking created for ${booking.customerName} — ${booking.modelName}`,
      },
    }).catch(e => console.warn('[BookingEvent] Failed to write:', e));
  } catch (err) {
    console.error('POST /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create booking' });
  }
});

// Update booking status — ADMIN ONLY
app.patch('/api/bookings/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const updates = req.body as Record<string, unknown>;

    const ALLOWED = ['inspectionStatus', 'payoutStatus', 'verificationStatus'] as const;
    const VALID_INSPECTION = ['pending', 'approved', 'rejected'];
    const VALID_PAYOUT = ['pending', 'completed'];
    const VALID_VERIFICATION = ['pending', 'verified', 'failed'];

    const data: Record<string, unknown> = {};
    const fieldErrors: string[] = [];

    if (updates.inspectionStatus !== undefined) {
      if (!VALID_INSPECTION.includes(String(updates.inspectionStatus)))
        fieldErrors.push(`inspectionStatus must be one of: ${VALID_INSPECTION.join(', ')}`);
      else data.inspectionStatus = updates.inspectionStatus;
    }
    if (updates.payoutStatus !== undefined) {
      if (!VALID_PAYOUT.includes(String(updates.payoutStatus)))
        fieldErrors.push(`payoutStatus must be one of: ${VALID_PAYOUT.join(', ')}`);
      else data.payoutStatus = updates.payoutStatus;
    }
    if (updates.verificationStatus !== undefined) {
      if (!VALID_VERIFICATION.includes(String(updates.verificationStatus)))
        fieldErrors.push(`verificationStatus must be one of: ${VALID_VERIFICATION.join(', ')}`);
      else data.verificationStatus = updates.verificationStatus;
    }

    if (fieldErrors.length > 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid status values', fields: fieldErrors });
      return;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'BadRequest', message: `No valid fields to update. Allowed: ${ALLOWED.join(', ')}` });
      return;
    }

    // Fetch the current booking to record 'from' values in events
    const currentBooking = await prisma.booking.findUnique({ where: { id } });
    if (!currentBooking) {
      res.status(404).json({ error: 'NotFound', message: 'Booking not found' });
      return;
    }

    const booking = await prisma.booking.update({ where: { id }, data });
    res.json({ success: true, id: booking.id });

    // Fire-and-forget: write BookingEvent and AuditLog entries for each changed field
    const now = new Date();
    const eventWrites = Object.entries(data).map(([field, toValue]) => {
      const fromValue = String((currentBooking as Record<string, unknown>)[field] ?? '');
      return prisma.bookingEvent.create({
        data: {
          bookingId: id,
          eventType: 'status_change',
          fromValue,
          toValue: String(toValue),
          note: `${field} changed from '${fromValue}' to '${toValue}'`,
        },
      });
    });
    const auditWrite = prisma.adminAuditLog.create({
      data: {
        action: 'update_booking_status',
        targetType: 'booking',
        targetId: id,
        payload: JSON.stringify({ changes: data, at: now.toISOString() }),
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      },
    });
    Promise.all([...eventWrites, auditWrite]).catch(e => console.warn('[AuditLog] Failed to write:', e));
  } catch (err) {
    console.error('PATCH /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update booking' });
  }
});

// Get booking lifecycle events — ADMIN ONLY
app.get('/api/bookings/:id/events', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(events);
  } catch (err) {
    console.error('GET /api/bookings/:id/events error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch booking events' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🚀 ReliableExchange API server running at http://localhost:${PORT}`);
  console.log(`   Health:       http://localhost:${PORT}/api/health`);
  console.log(`   Admin auth:   POST http://localhost:${PORT}/api/admin/auth`);
  console.log(`   Environment:  ${process.env.NODE_ENV ?? 'development'}\n`);
});
