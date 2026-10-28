import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import prisma from './db.js';
import { PRICING_ENGINE_VERSION } from './services/valuation.js';
import { startPeriodicMaintenance, stopPeriodicMaintenance } from './services/maintenance.js';

// Route handlers
import adminRouter from './routes/admin.js';
import supportRouter from './routes/support.js';
import authRouter from './routes/auth.js';
import brandsRouter from './routes/brands.js';
import modelsRouter from './routes/models.js';
import quotesRouter from './routes/quotes.js';
import bookingsRouter from './routes/bookings.js';

// Middleware & Validation
import { globalLimiter, authLimiter } from './middleware/rateLimits.js';
export { validateBookingBody, isValidImageUrl, formatImageUrl } from './validation/booking.js';
export { encryptImei, decryptImei, mapBooking } from './routes/bookings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP ENVIRONMENT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

{
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  const secret = (process.env.JWT_SECRET ?? '').trim();
  if (!secret) {
    missing.push('JWT_SECRET (must be set)');
  } else if (secret.length < 32) {
    missing.push('JWT_SECRET (must be at least 32 characters)');
  }

  if (isProduction) {
    const encKey = (process.env.PAYOUT_ENCRYPTION_KEY ?? '').trim();
    if (!encKey) missing.push('PAYOUT_ENCRYPTION_KEY');
    if (!(process.env.GOOGLE_CLIENT_ID ?? '').trim()) missing.push('GOOGLE_CLIENT_ID');
    if (!(process.env.SMTP_PASS ?? '').trim()) missing.push('SMTP_PASS');
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

// Restrict trust proxy configuration
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 'loopback, linklocal, uniquelocal' : 1);

// ── Allowed Origins ────────────────────────────────────────────────────────
const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const ALLOWED_ORIGINS = Array.from(new Set([
  ...configuredOrigins,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://smartphonecentre.onrender.com',
  'https://rephonix.in',
  'https://www.rephonix.in',
]));

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY & BASE MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      scriptSrc: [
        "'self'",
        'blob:',
        'https://api.emailjs.com',
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://www.google.com',
        'https://*.firebaseapp.com',
        'https://*.googleapis.com',
      ],
      scriptSrcElem: [
        "'self'",
        'blob:',
        'https://api.emailjs.com',
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://www.gstatic.com',
        'https://*.firebaseapp.com',
        'https://*.googleapis.com',
      ],
      connectSrc: [
        "'self'",
        'https://rephonix.in',
        'https://www.rephonix.in',
        'http://localhost:*',
        'https://api.emailjs.com',
        'https://accounts.google.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://*.firebaseio.com',
        'https://*.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https:',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ── Serve frontend static assets in production ────────────────────────────────
const distPath = path.resolve(__dirname, '../../dist');
const distExists = fs.existsSync(path.join(distPath, 'index.html'));

if (distExists) {
  if (isDev) {
    console.log(`📁 Serving frontend static build from: ${distPath}`);
  }
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  }));
} else if (isDev) {
  console.warn(`⚠️ Frontend static build not found at: ${distPath}`);
}

app.use(globalLimiter);

// Prevent API response caching across all environments
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', engineVersion: PRICING_ENGINE_VERSION, timestamp: new Date().toISOString() });
});

app.use('/api/admin', authLimiter, adminRouter);
app.use('/api/support', supportRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/models', modelsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/bookings', bookingsRouter);

// 404 Handler for all unhandled /api/* routes
app.all(/^\/api(\/|$)/, (_req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'API endpoint not found.' });
});

// ═══════════════════════════════════════════════════════════════════════════
// SPA FALLBACK FOR FRONTEND NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════

if (distExists) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/assets')) return next();
    if (path.extname(req.path)) return next();

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  if (isDev) {
    console.log(`\n🚀 SmartphoneCentre API server running at http://0.0.0.0:${PORT}`);
    console.log(`   Health:       http://localhost:${PORT}/api/health`);
    console.log(`   Admin auth:   POST http://localhost:${PORT}/api/admin/auth`);
    console.log(`   Environment:  ${process.env.NODE_ENV ?? 'development'}\n`);
  }

  prisma.$connect()
    .then(() => {
      if (isDev) console.log('✅ Database connected');
      startPeriodicMaintenance();
    })
    .catch((err) => console.error('⚠️  Database connection failed:', err));
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down Express & Prisma database connections...`);
  stopPeriodicMaintenance();
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connections closed cleanly. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
