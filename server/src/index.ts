import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import prisma from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { adminAuth, requireRole, AuthenticatedRequest } from './middleware/adminAuth.js';
import adminRouter from './routes/admin.js';
import supportRouter from './routes/support.js';
import {
  calculateServerValuation,
  maximumQuoteFor,
  PRICING_ENGINE_VERSION,
  QUOTE_TTL_MINUTES,
  generateQuoteSignature,
  verifyQuoteSignature,
  DeviceCategory,
} from './services/valuation.js';
import {
  encryptPayoutDetails,
  decryptPayoutDetails,
  maskPayoutDetails,
} from './utils/encryption.js';

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP ENVIRONMENT VALIDATION
// Fatal-error early if required secrets are absent in production.
// ═══════════════════════════════════════════════════════════════════════════

{
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  const dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]|['"]$/g, '');
  const isRenderEnv = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

  if (!dbUrl) {
    missing.push('DATABASE_URL environment variable is missing');
  } else if ((isProduction || isRenderEnv) && dbUrl.startsWith('file:')) {
    missing.push('DATABASE_URL must be a production PostgreSQL connection string in production environments');
  }

  if (isProduction || isRenderEnv) {
    const jwtSecret = (process.env.JWT_SECRET ?? '').trim();
    if (jwtSecret.length < 32) missing.push('JWT_SECRET (minimum 32 characters)');

    const encKey = (process.env.PAYOUT_ENCRYPTION_KEY ?? '').trim();
    if (!encKey) missing.push('PAYOUT_ENCRYPTION_KEY');
  }

  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing or invalid required environment variables:');
    missing.forEach(v => console.error(`   • ${v}`));
    console.error('\nSet these variables in your deployment environment and restart.\n');
    process.exit(1);
  }
}
const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Enable response compression (Gzip / Brotli)
app.use(compression());

// Restrict trust proxy configuration (e.g. 1 loopback proxy in prod or explicit loopback for local dev)
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 'loopback, linklocal, uniquelocal' : 1);

// ── Parse allowed origins from env ───────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' intentionally excluded from scriptSrc — all JS is in content-hashed bundles.
      // If a specific inline script is ever needed, use a per-request nonce instead.
      scriptSrc: ["'self'", 'https://api.emailjs.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://api.emailjs.com', 'http://localhost:4000', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173', 'http://localhost:5174'],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // No origin = same-origin request or server-to-server — always allowed.
    if (!origin) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      // Whitelist: explicit allowed origins OR any *.onrender.com subdomain (Render preview deployments)
      // NOTE: NODE_ENV bypass has been removed — all environments use the explicit whitelist.
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        hostname.endsWith('.onrender.com') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch { /* ignore invalid origin URL */ }
    callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// 50kb is generous for all standard API payloads (bookings, quotes, model updates).
// The previous 4mb limit enabled memory-exhaustion DoS with a single large request.
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true,
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many booking submissions. Please try again later.' },
});

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many order tracking attempts. Please try again in 15 minutes.' },
});

app.use(globalLimiter);

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STORAGE_GB = new Set([64, 128, 256, 512, 1024]);
const ALLOWED_PAYOUT_METHODS = new Set(['upi', 'bank', 'amazon', 'flipkart', 'myntra', 'googleplay', 'apple', 'steam', 'swiggy', 'zomato']);
const ALLOWED_PICKUP_SLOTS = new Set([
  '09:00 AM - 12:00 PM (Morning)',
  '12:00 PM - 03:00 PM (Afternoon)',
  '03:00 PM - 06:00 PM (Evening)',
  '06:00 PM - 09:00 PM (Night)',
]);
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANK_ACCOUNT_RE = /^\d{9,18}$/;

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isValidImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  return /^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed);
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
  if (!b.pickupDate || typeof b.pickupDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.pickupDate) || Number.isNaN(Date.parse(`${b.pickupDate}T00:00:00.000Z`)))
    errors.push('pickupDate: must be a valid ISO date');
  else if (b.pickupDate < new Date().toISOString().slice(0, 10))
    errors.push('pickupDate: cannot be in the past');
  if (!b.pickupTimeSlot || typeof b.pickupTimeSlot !== 'string' || !ALLOWED_PICKUP_SLOTS.has(b.pickupTimeSlot))
    errors.push('pickupTimeSlot: must be an available pickup slot');
  if (!b.modelId && !b.modelLegacyId)
    errors.push('modelId: required');
  if (!ALLOWED_STORAGE_GB.has(Number(b.storageGb)))
    errors.push('storageGb: must be a supported capacity');
  if (!b.payoutMethod || typeof b.payoutMethod !== 'string' || !ALLOWED_PAYOUT_METHODS.has(b.payoutMethod))
    errors.push('payoutMethod: must be a supported method');
  const payoutDetails = b.payoutDetails;
  if ((b.payoutMethod === 'upi' || b.payoutMethod === 'bank') && (!payoutDetails || typeof payoutDetails !== 'object' || Array.isArray(payoutDetails))) {
    errors.push('payoutDetails: required for the selected payout method');
  } else if (payoutDetails && typeof payoutDetails === 'object' && !Array.isArray(payoutDetails)) {
    const details = payoutDetails as Record<string, unknown>;
    if (b.payoutMethod === 'upi' && (typeof details.upiId !== 'string' || !UPI_RE.test(details.upiId.trim())))
      errors.push('payoutDetails.upiId: must be a valid UPI ID');
    if (b.payoutMethod === 'bank') {
      if (typeof details.accountHolderName !== 'string' || details.accountHolderName.trim().length < 2 || details.accountHolderName.trim().length > 100)
        errors.push('payoutDetails.accountHolderName: must be between 2 and 100 characters');
      if (typeof details.accountNumber !== 'string' || !BANK_ACCOUNT_RE.test(details.accountNumber.trim()))
        errors.push('payoutDetails.accountNumber: must contain 9 to 18 digits');
      if (typeof details.ifscCode !== 'string' || !IFSC_RE.test(details.ifscCode.trim().toUpperCase()))
        errors.push('payoutDetails.ifscCode: must be a valid IFSC code');
    }
  }
  if (!Array.isArray(b.defectIds) || !b.defectIds.every(id => typeof id === 'string'))
    errors.push('defectIds: must be an array of defect identifiers');
  return errors;
}

function payoutBonusFor(method: string, estimatedPrice: number): { percentage: number; amount: number } {
  const percentage = method === 'amazon' || method === 'flipkart' || method === 'voucher' ? 0.03 : 0;
  return { percentage, amount: Math.round(estimatedPrice * percentage) };
}

// Prevent API response caching across all environments
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', engineVersion: PRICING_ENGINE_VERSION, timestamp: new Date().toISOString() });
});

app.use('/api/admin', authLimiter, adminRouter);
app.use('/api/support', supportRouter);

// ═══════════════════════════════════════════════════════════════════════════
// BRANDS & MODELS
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

app.get('/api/models', async (req, res) => {
  try {
    const { brandId } = req.query;
    const where: Record<string, unknown> = {};
    if (brandId && typeof brandId === 'string') where.brandId = brandId;

    const models = await prisma.model.findMany({ where, orderBy: { releaseYear: 'desc' } });
    res.json(models.map(m => {
      let parsedStorageGb: number[] | undefined;
      let parsedRamGb: number[] | undefined;
      let parsedVariantPrices: Record<string, number> | undefined;
      try { parsedStorageGb = JSON.parse(m.supportedStorageGb); } catch { parsedStorageGb = [128, 256, 512]; }
      try { parsedRamGb = JSON.parse((m as any).supportedRamGb ?? '[0]'); } catch { parsedRamGb = [0]; }
      try { parsedVariantPrices = JSON.parse((m as any).variantPrices ?? '{}'); } catch { parsedVariantPrices = {}; }
      return {
        id: m.legacyId,
        brandId: m.brandId,
        name: m.name,
        category: m.category,
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: m.series || '',
        imageUrl: m.imageUrl || undefined,
        supportedStorageGb: parsedStorageGb,
        supportedRamGb: parsedRamGb,
        variantPrices: parsedVariantPrices,
      };
    }));
  } catch (err) {
    console.error('GET /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch models' });
  }
});


app.post('/api/models', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const { legacyId, brandId, name, category, releaseYear, basePrice128GB,
            series, imageUrl, supportedStorageGb, supportedRamGb, variantPrices } = req.body;
    if (!legacyId || !brandId || !name || !category || !releaseYear || !basePrice128GB) {
      res.status(400).json({ error: 'BadRequest', message: 'Missing required fields' });
      return;
    }
    if (!isValidImageUrl(imageUrl)) {
      res.status(400).json({ error: 'BadRequest', message: 'imageUrl must be a valid http(s) URL or base64 Data URL' });
      return;
    }

    const storageStr = Array.isArray(supportedStorageGb) ? JSON.stringify(supportedStorageGb) : JSON.stringify([128, 256, 512]);
    const ramStr = Array.isArray(supportedRamGb) ? JSON.stringify(supportedRamGb) : JSON.stringify([0]);
    const pricesObj = (variantPrices && typeof variantPrices === 'object' && !Array.isArray(variantPrices)) ? variantPrices : {};
    // Auto-compute basePrice128GB from minimum variant price if prices are set
    const allPrices = Object.values(pricesObj).filter((v): v is number => typeof v === 'number' && v > 0);
    const resolvedBase = allPrices.length > 0 ? Math.min(...allPrices) : Number(basePrice128GB);

    const model = await prisma.model.create({
      data: {
        legacyId: String(legacyId).trim(),
        brandId: String(brandId),
        name: String(name).trim(),
        category: String(category).trim(),
        releaseYear: Number(releaseYear),
        basePrice128GB: resolvedBase,
        series: series ? String(series).trim() : '',
        imageUrl: imageUrl ? String(imageUrl).trim() : '',
        supportedStorageGb: storageStr,
        ...(({ supportedRamGb: ramStr, variantPrices: JSON.stringify(pricesObj) }) as any),
      },
    });

    res.status(201).json({
      ...model,
      id: model.legacyId,
      supportedStorageGb: JSON.parse(model.supportedStorageGb),
      supportedRamGb: JSON.parse((model as any).supportedRamGb ?? '[0]'),
      variantPrices: JSON.parse((model as any).variantPrices ?? '{}'),
    });
  } catch (err) {
    console.error('POST /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create model' });
  }
});


app.post('/api/models/bulk-update', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'updates array is required and must not be empty.' });
      return;
    }

    let updatedCount = 0;
    for (const item of updates) {
      const { id, changes } = item;
      if (!id || !changes || typeof changes !== 'object') continue;

      const existing = await prisma.model.findFirst({
        where: { OR: [{ legacyId: String(id) }, { id: String(id) }] }
      });
      if (!existing) continue;

      const data: Record<string, unknown> = {};
      for (const field of ['name', 'category', 'series']) {
        if (changes[field] !== undefined && typeof changes[field] === 'string') {
          data[field] = changes[field].trim();
        }
      }
      for (const field of ['releaseYear', 'basePrice128GB']) {
        if (changes[field] !== undefined && Number.isFinite(Number(changes[field])) && Number(changes[field]) > 0) {
          data[field] = Number(changes[field]);
        }
      }
      if (changes.imageUrl !== undefined && (typeof changes.imageUrl === 'string')) {
        if (isValidImageUrl(changes.imageUrl)) data.imageUrl = changes.imageUrl.trim();
      }
      if (changes.supportedStorageGb !== undefined && Array.isArray(changes.supportedStorageGb)) {
        data.supportedStorageGb = JSON.stringify(changes.supportedStorageGb);
      }
      if (changes.supportedRamGb !== undefined && Array.isArray(changes.supportedRamGb)) {
        (data as any).supportedRamGb = JSON.stringify(changes.supportedRamGb);
      }
      if (changes.variantPrices !== undefined && typeof changes.variantPrices === 'object' && !Array.isArray(changes.variantPrices)) {
        (data as any).variantPrices = JSON.stringify(changes.variantPrices);
        // Auto-update basePrice128GB from minimum variant price
        const prices = Object.values(changes.variantPrices as Record<string, number>).filter((v): v is number => typeof v === 'number' && v > 0);
        if (prices.length > 0) data.basePrice128GB = Math.min(...prices);
      }

      if (Object.keys(data).length > 0) {
        await prisma.model.update({ where: { id: existing.id }, data });
        updatedCount++;
      }
    }

    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error('POST /api/models/bulk-update error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed bulk updating models.' });
  }
});


app.patch('/api/models/:legacyId', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const legacyId = String(req.params.legacyId);
    const updates = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const field of ['name', 'category']) {
      if (updates[field] !== undefined && typeof updates[field] === 'string' && (updates[field] as string).trim().length > 0) {
        data[field] = (updates[field] as string).trim();
      }
    }
    if (updates.series !== undefined && typeof updates.series === 'string') {
      data.series = updates.series.trim();
    }
    for (const field of ['releaseYear', 'basePrice128GB']) {
      if (updates[field] !== undefined && Number.isFinite(Number(updates[field])) && Number(updates[field]) > 0) {
        data[field] = Number(updates[field]);
      }
    }
    if (updates.imageUrl !== undefined) {
      if (typeof updates.imageUrl !== 'string' || !isValidImageUrl(updates.imageUrl)) {
        res.status(400).json({ error: 'BadRequest', message: 'imageUrl must be a valid http(s) URL or base64 Data URL.' });
        return;
      }
      data.imageUrl = (updates.imageUrl as string).trim();
    }
    if (updates.supportedStorageGb !== undefined && Array.isArray(updates.supportedStorageGb)) {
      data.supportedStorageGb = JSON.stringify(updates.supportedStorageGb);
    }
    if (updates.supportedRamGb !== undefined && Array.isArray(updates.supportedRamGb)) {
      (data as any).supportedRamGb = JSON.stringify(updates.supportedRamGb);
    }
    if (updates.variantPrices !== undefined && typeof updates.variantPrices === 'object' && !Array.isArray(updates.variantPrices)) {
      (data as any).variantPrices = JSON.stringify(updates.variantPrices);
      // Auto-update basePrice128GB from minimum variant price
      const prices = Object.values(updates.variantPrices as Record<string, number>).filter((v): v is number => typeof v === 'number' && v > 0);
      if (prices.length > 0) data.basePrice128GB = Math.min(...prices);
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'No valid model fields supplied.' });
      return;
    }

    const existing = await prisma.model.findFirst({
      where: { OR: [{ legacyId }, { id: legacyId }] }
    });

    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: `Model '${legacyId}' not found in database.` });
      return;
    }

    const model = await prisma.model.update({
      where: { id: existing.id },
      data,
    });

    res.json({
      ...model,
      id: model.legacyId,
      supportedStorageGb: model.supportedStorageGb ? JSON.parse(model.supportedStorageGb) : [128, 256, 512],
      supportedRamGb: (model as any).supportedRamGb ? JSON.parse((model as any).supportedRamGb) : [0],
      variantPrices: (model as any).variantPrices ? JSON.parse((model as any).variantPrices) : {},
    });
  } catch (err) {
    console.error('PATCH /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update model.' });
  }
});


app.delete('/api/models/:legacyId', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const legacyId = String(req.params.legacyId);
    const existing = await prisma.model.findFirst({
      where: { OR: [{ legacyId }, { id: legacyId }] }
    });
    if (existing) {
      await prisma.model.delete({ where: { id: existing.id } });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to delete model.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-AUTHORITATIVE PRICING QUOTE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/quotes', async (req, res) => {
  try {
    const { modelId, storageGb, defectIds } = req.body;
    if (!modelId || typeof modelId !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'modelId is required.' });
      return;
    }
    if (!ALLOWED_STORAGE_GB.has(Number(storageGb))) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid storage capacity.' });
      return;
    }

    const model = await prisma.model.findUnique({ where: { legacyId: modelId } });
    if (!model) {
      res.status(404).json({ error: 'NotFound', message: 'Model not found in catalog.' });
      return;
    }

    const maxPrice = maximumQuoteFor(model.basePrice128GB, Number(storageGb));
    const defectList = Array.isArray(defectIds) ? defectIds.map(String) : [];
    const calculatedPrice = calculateServerValuation(maxPrice, model.category as DeviceCategory, defectList);

    if (calculatedPrice === null) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid defect identifiers supplied.' });
      return;
    }

    const expiresAtDate = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000);
    const expiresAtIso = expiresAtDate.toISOString();
    const signature = generateQuoteSignature(model.legacyId, Number(storageGb), defectList, calculatedPrice, expiresAtIso);

    const quoteRecord = await prisma.quote.create({
      data: {
        id: `Q-${randomUUID()}`,
        modelLegacyId: model.legacyId,
        storageGb: Number(storageGb),
        defectIdsJson: JSON.stringify(defectList),
        calculatedPrice,
        expiresAt: expiresAtDate,
        version: PRICING_ENGINE_VERSION,
        signature,
      },
    });

    res.json({
      quoteId: quoteRecord.id,
      modelId: model.legacyId,
      modelName: model.name,
      storageGb: Number(storageGb),
      maxPrice,
      calculatedPrice,
      version: PRICING_ENGINE_VERSION,
      expiresAt: expiresAtIso,
      signature,
    });
  } catch (err) {
    console.error('POST /api/quotes error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to generate quote' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ORDER TRACKING (PUBLIC, RATE-LIMITED BY PHONE + BOOKING ID)
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/bookings/track', trackingLimiter, async (req, res) => {
  try {
    const { bookingId, phone } = req.body;
    if (!bookingId || typeof bookingId !== 'string' || !phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'bookingId and customer phone are required.' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId.trim().toUpperCase() },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    // Use constant-time comparison for the phone number to prevent timing attacks
    // that could be used to enumerate valid booking IDs.
    const phoneMatch = booking &&
      (() => {
        try {
          const a = Buffer.from(booking.customerPhone.trim());
          const b = Buffer.from(phone.trim());
          return a.length === b.length && timingSafeEqual(a, b);
        } catch { return false; }
      })();

    if (!phoneMatch) {
      res.status(404).json({ error: 'NotFound', message: 'No booking found matching the provided Booking ID and phone number.' });
      return;
    }

    res.json({
      id: booking.id,
      modelName: booking.modelName,
      storageGb: booking.storageGb,
      color: booking.color,
      customerName: booking.customerName,
      pickupDate: booking.pickupDate,
      pickupTimeSlot: booking.pickupTimeSlot,
      finalPayoutAmount: booking.finalPayoutAmount,
      inspectionStatus: booking.inspectionStatus,
      payoutStatus: booking.payoutStatus,
      verificationStatus: booking.verificationStatus,
      dateCreated: booking.dateCreated,
      events: booking.events.map(e => ({
        eventType: e.eventType,
        note: e.note,
        createdAt: e.createdAt,
      })),
    });
  } catch (err) {
    console.error('POST /api/bookings/track error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to track order' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS (CREATION & ADMIN MANAGEMENT)
// ═══════════════════════════════════════════════════════════════════════════

function mapBooking(b: import('@prisma/client').Booking, includeUnmaskedPayout = false) {
  const rawDetails = decryptPayoutDetails(b.payoutDetailsJson);
  const safeDetails = includeUnmaskedPayout ? rawDetails : maskPayoutDetails(rawDetails);

  return {
    id: b.id,
    modelId: b.modelLegacyId,
    modelName: b.modelName,
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
    isVerifiedProvider: b.isVerifiedProvider,
    verifiedName: b.verifiedName,
    maskedAadhaar: b.maskedAadhaar,
    verificationDate: b.verificationDate,
    payoutMethod: b.payoutMethod,
    payoutMethodName: b.payoutMethodName,
    bonusPercentage: b.bonusPercentage,
    bonusAmount: b.bonusAmount,
    finalPayoutAmount: b.finalPayoutAmount,
    payoutDetails: safeDetails,
    inspectionStatus: b.inspectionStatus,
    payoutStatus: b.payoutStatus,
    dateCreated: b.dateCreated,
  };
}

// Get all bookings — ADMIN ONLY (Masked by default, decrypted for Finance Approver / Super Admin)
app.get('/api/bookings', adminAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    const isFinanceAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'FINANCE_APPROVER';
    res.json(bookings.map(b => mapBooking(b, isFinanceAdmin)));
  } catch (err) {
    console.error('GET /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch bookings' });
  }
});

// Create booking — Public & Server-Authoritative
app.post('/api/bookings', bookingLimiter, async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>;

    const errors = validateBookingBody(b);
    if (errors.length > 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Booking validation failed', fields: errors });
      return;
    }

    const modelLegacyId = String(b.modelId ?? b.modelLegacyId);
    const model = await prisma.model.findUnique({ where: { legacyId: modelLegacyId } });
    if (!model) {
      res.status(400).json({ error: 'ValidationError', message: 'The selected device is no longer available for trade-in.' });
      return;
    }

    const storageGb = Number(b.storageGb);
    const defectIds = Array.isArray(b.defectIds) ? (b.defectIds as string[]) : [];
    const maxQuote = maximumQuoteFor(model.basePrice128GB, storageGb);

    // Server recomputes valuation — client-supplied finalPrice is strictly IGNORED
    const estimatedPrice = calculateServerValuation(maxQuote, model.category as DeviceCategory, defectIds);
    if (estimatedPrice === null) {
      res.status(400).json({ error: 'ValidationError', message: 'One or more declared device conditions are invalid.' });
      return;
    }

    const payout = payoutBonusFor(String(b.payoutMethod), estimatedPrice);
    const bookingId = `STC-${randomBytes(6).toString('base64url').toUpperCase()}`;

    // Encrypt sensitive payout details before DB write
    const rawPayoutDetails = (b.payoutDetails && typeof b.payoutDetails === 'object') ? (b.payoutDetails as Record<string, unknown>) : {};
    const encryptedPayoutJson = encryptPayoutDetails(rawPayoutDetails);

    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        modelLegacyId: model.legacyId,
        modelName: model.name,
        storageGb,
        color: String(b.color ?? ''),
        customerName: String(b.customerName).trim(),
        customerPhone: String(b.customerPhone).trim(),
        customerEmail: String(b.customerEmail).trim().toLowerCase(),
        address: String(b.address).trim(),
        pickupDate: String(b.pickupDate),
        pickupTimeSlot: String(b.pickupTimeSlot),
        finalPrice: estimatedPrice,
        // Browser input is never evidence of identity. Only an authenticated
        // provider callback may promote this record to verified.
        verificationStatus: 'pending',
        isVerifiedProvider: false,
        verificationProofHash: '',
        verifiedName: '',
        maskedAadhaar: '',
        verificationDate: '',
        payoutMethod: String(b.payoutMethod),
        payoutMethodName: String(b.payoutMethodName ?? ''),
        bonusPercentage: payout.percentage,
        bonusAmount: payout.amount,
        finalPayoutAmount: estimatedPrice + payout.amount,
        inspectionStatus: 'pending',
        payoutStatus: 'pending',
        dateCreated: new Date().toISOString(),
        payoutDetailsJson: encryptedPayoutJson,
      },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'created',
        toValue: booking.id,
        note: `Booking created for ${booking.customerName} — ${booking.modelName}`,
      },
    });

    res.status(201).json({ success: true, id: booking.id });
  } catch (err) {
    console.error('POST /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create booking' });
  }
});

// Update booking status — ADMIN ONLY (RBAC protected)
app.patch('/api/bookings/:id', adminAuth, requireRole(['SUPER_ADMIN', 'FINANCE_APPROVER', 'OPERATIONS_AGENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = String(req.params.id);
    const updates = req.body as Record<string, unknown>;

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
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'FINANCE_APPROVER') {
        res.status(403).json({ error: 'Forbidden', message: 'Only Finance Approvers or Super Admins can update payout status.' });
        return;
      }
      if (!VALID_PAYOUT.includes(String(updates.payoutStatus)))
        fieldErrors.push(`payoutStatus must be one of: ${VALID_PAYOUT.join(', ')}`);
      else data.payoutStatus = updates.payoutStatus;
    }
    if (updates.verificationStatus !== undefined) {
      if (!VALID_VERIFICATION.includes(String(updates.verificationStatus)))
        fieldErrors.push(`verificationStatus must be one of: ${VALID_VERIFICATION.join(', ')}`);
      else if (updates.verificationStatus === 'verified')
        fieldErrors.push('verificationStatus cannot be set to verified manually; it requires an authenticated provider callback');
      else data.verificationStatus = updates.verificationStatus;
    }

    if (fieldErrors.length > 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid status values', fields: fieldErrors });
      return;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'No valid fields to update.' });
      return;
    }

    const currentBooking = await prisma.booking.findUnique({ where: { id } });
    if (!currentBooking) {
      res.status(404).json({ error: 'NotFound', message: 'Booking not found' });
      return;
    }

    const booking = await prisma.booking.update({ where: { id }, data });

    // Synchronous durable writes for booking events & audit log
    const now = new Date();
    for (const [field, toValue] of Object.entries(data)) {
      const fromValue = String((currentBooking as Record<string, unknown>)[field] ?? '');
      await prisma.bookingEvent.create({
        data: {
          bookingId: id,
          eventType: 'status_change',
          fromValue,
          toValue: String(toValue),
          note: `${field} changed from '${fromValue}' to '${toValue}' by ${req.user?.username ?? 'admin'}`,
        },
      });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.user?.sub ?? '',
        action: 'update_booking_status',
        targetType: 'booking',
        targetId: id,
        payload: JSON.stringify({ changes: data, at: now.toISOString() }),
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      },
    });

    res.json({ success: true, id: booking.id });
  } catch (err) {
    console.error('PATCH /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update booking' });
  }
});

// Irreversibly remove payout account details once finance reconciliation is
// complete. The booking and its audit trail remain available for compliance.
app.delete('/api/bookings/:id/payout-details', adminAuth, requireRole(['SUPER_ADMIN', 'FINANCE_APPROVER']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = String(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ error: 'NotFound', message: 'Booking not found.' });
      return;
    }
    if (booking.payoutStatus !== 'completed') {
      res.status(409).json({ error: 'Conflict', message: 'Payout details may be deleted only after payout completion.' });
      return;
    }
    await prisma.$transaction([
      prisma.booking.update({ where: { id }, data: { payoutDetailsJson: encryptPayoutDetails({}) } }),
      prisma.bookingEvent.create({ data: { bookingId: id, eventType: 'payout_details_deleted', note: `Payout details purged by ${req.user?.username ?? 'admin'}` } }),
      prisma.adminAuditLog.create({ data: { adminUserId: req.user?.sub ?? '', action: 'purge_payout_details', targetType: 'booking', targetId: id, ipAddress: String(req.ip ?? ''), userAgent: String(req.headers['user-agent'] ?? '') } }),
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/bookings/:id/payout-details error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to purge payout details.' });
  }
});

// 404 Handler for all unhandled /api/* routes (must ALWAYS return JSON, never HTML).
// Use a regex so this works correctly in Express 5 (path-to-regexp@8 broke bare `*`).
app.all(/^\/api(\/|$)/, (_req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'API endpoint not found.' });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVE FRONTEND STATIC ASSETS IN PRODUCTION
// ═══════════════════════════════════════════════════════════════════════════
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '../dist'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(__dirname, '../../../dist'),
];

const distPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, 'index.html')));
if (distPath) {
  console.log(`📁 Serving frontend static build from: ${distPath}`);

  // Serve static assets. For index.html specifically, force no-cache so browsers
  // always fetch a fresh copy — preventing them from loading a stale JS bundle hash.
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  }));

  // SPA catch-all: serve index.html for any non-API, non-static GET/HEAD navigation.
  // CRITICAL: Use app.use() + explicit guards instead of app.get('*') because in
  // Express 5 (path-to-regexp@8) a bare `*` wildcard can match ALL HTTP methods,
  // causing PATCH/POST/DELETE requests to receive index.html (status 200) instead
  // of being processed by the correct route handler — which was the root cause of
  // the "Server returned non-JSON response (200)" error in the Admin Panel.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath!, 'index.html'));
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SmartphoneCentre API server running at http://0.0.0.0:${PORT}`);
  console.log(`   Health:       http://localhost:${PORT}/api/health`);
  console.log(`   Admin auth:   POST http://localhost:${PORT}/api/admin/auth`);
  console.log(`   Environment:  ${process.env.NODE_ENV ?? 'development'}\n`);

  // Verify DB connection asynchronously AFTER Express is already listening.
  // This is intentionally fire-and-forget: Express must pass Render's health
  // check immediately. On free-tier PostgreSQL, the DB can take 30+ seconds
  // to cold-start. If we wait for it synchronously the process times out and
  // Render falls back to serving the static dist/ folder for all paths.
  prisma.$connect()
    .then(() => console.log('✅ Database connected'))
    .catch((err) => console.error('⚠️  Database connection failed (queries will return 500 until DB wakes up):', err));
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down Express & Prisma database connections...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connections closed cleanly. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
