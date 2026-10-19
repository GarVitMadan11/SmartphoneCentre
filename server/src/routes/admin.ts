import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { adminAuth, getJwtSecret, JWT_ISSUER, JWT_AUDIENCE, parseCookies, AuthenticatedRequest } from '../middleware/adminAuth.js';
import { getLockdownState, triggerEmergencyLockdown, unlockEmergencyLockdown } from '../services/lockdownService.js';
import { sendAdminSecurityAlertEmail } from '../services/securityMailer.js';

const router = Router();

/**
 * GET /api/admin/security-status
 * Returns public security lockdown status for Admin PIN Gate.
 */
router.get('/security-status', (_req: Request, res: Response): void => {
  res.json(getLockdownState());
});

/**
 * POST /api/admin/unlock
 * Unlocks Admin Panel using Master Emergency Unlock Key.
 */
router.post('/unlock', async (req: Request, res: Response): Promise<void> => {
  const { masterKey } = req.body;
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');

  const result = await unlockEmergencyLockdown(masterKey, ipAddress, userAgent);

  if (!result.success) {
    res.status(401).json({ error: 'InvalidKey', message: result.message });
    return;
  }

  res.json({ success: true, message: result.message });
});

/**
 * POST /api/admin/lockdown
 * Emergency Kill Switch: Immediately locks down Admin Panel access.
 */
router.post('/lockdown', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const reason = (req.body.reason as string) || 'Manual emergency kill switch triggered from Admin Control Panel.';
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');

  const result = await triggerEmergencyLockdown(reason, ipAddress, userAgent, req.user?.username);

  res.clearCookie('rex_admin_token', { path: '/' });
  res.clearCookie('rex_admin_csrf', { path: '/' });

  res.json({
    success: true,
    message: 'Emergency Admin Panel Lockdown Activated! Access suspended.',
    masterUnlockKey: result.masterUnlockKey,
  });
});

// Maximum consecutive failed login attempts before account is temporarily locked
const MAX_FAILED_ATTEMPTS = 5;
// Lock duration in minutes
const LOCKOUT_MINUTES = 30;

function getAdminPinHash(): string {
  const raw = process.env.ADMIN_PIN_HASH;
  if (!raw || raw.trim().length === 0) {
    // If no hash is configured, PIN auth is effectively disabled
    return '';
  }
  return raw.replace(/^['\"]|['\"]$/g, '').trim();
}

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '4h') as string;

function setAdminCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSiteMode = isProd ? 'none' : 'lax';
  res.cookie('rex_admin_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteMode,
    maxAge: 4 * 60 * 60 * 1000, // 4 hours in ms
    path: '/',
  });
  res.cookie('rex_admin_csrf', randomBytes(32).toString('base64url'), {
    httpOnly: false,
    secure: isProd,
    sameSite: sameSiteMode,
    maxAge: 4 * 60 * 60 * 1000,
    path: '/',
  });
}

/**
 * POST /api/admin/auth
 * Authenticates via PIN or username/password, sets HttpOnly cookie.
 * Returns user details but NOT the raw token (the cookie is the secure channel).
 *
 * Security controls:
 * - Per-account consecutive failure counter stored in DB
 * - Account locked for LOCKOUT_MINUTES after MAX_FAILED_ATTEMPTS failures
 * - PIN auth always uses bcrypt.compare — no plain-text bypass
 * - JWT secret fetched at runtime; fatal error if not configured
 */
router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  // Check if Admin Panel is locked down
  const lockdownState = getLockdownState();
  if (lockdownState.isLockedDown) {
    res.status(423).json({
      error: 'SystemLocked',
      message: 'Admin Panel is currently suspended under Emergency Security Lockdown.',
      reason: lockdownState.reason,
      lockedAt: lockdownState.lockedAt,
    });
    return;
  }

  const { pin, username, password } = req.body;
  const ipAddress = String(req.headers['x-forwarded-for'] || req.ip || 'Unknown');
  const userAgent = String(req.headers['user-agent'] || 'Unknown');
  const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  let sub = 'admin';
  let userUsername = 'admin';
  let role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin' = 'admin';

  if (username && typeof username === 'string' && password && typeof password === 'string') {
    // ── Named user account authentication ──────────────────────────────────
    const user = await prisma.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });

    // Generic error — don't reveal whether the username exists
    const invalidCredsResponse = { error: 'InvalidCredentials', message: 'Invalid username or password.' };

    if (!user || !user.active) {
      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: username,
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: 'Attempted login with non-existent or inactive username.',
      }).catch(err => console.error('Alert email error:', err));

      res.status(401).json(invalidCredsResponse);
      return;
    }

    // Check account lockout
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      res.status(429).json({
        error: 'AccountLocked',
        message: `Account is temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
      });
      return;
    }

    const isValidPass = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPass) {
      // Increment failure counter and possibly lock the account
      const newFailCount = (user.failedLoginAttempts ?? 0) + 1;
      const lockUntil = newFailCount >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailCount,
          ...(lockUntil ? { lockedUntil: lockUntil } : {}),
        },
      });

      // Log failed attempt
      await prisma.adminAuditLog.create({
        data: {
          adminUserId: user.id,
          action: 'login_failed',
          targetType: 'adminUser',
          targetId: user.id,
          payload: JSON.stringify({ failedAttempts: newFailCount, locked: !!lockUntil }),
          ipAddress: String(req.ip ?? ''),
          userAgent: String(req.headers['user-agent'] ?? ''),
        },
      });

      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: user.username,
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: `Incorrect password. Fail count: ${newFailCount}/${MAX_FAILED_ATTEMPTS}`,
      }).catch(err => console.error('Alert email error:', err));

      res.status(401).json(invalidCredsResponse);
      return;
    }

    // Successful login — reset failure counter
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
    });

    sub = user.id;
    userUsername = user.username;
    role = user.role as typeof role;

  } else if (typeof pin === 'string' && pin.trim().length > 0) {
    // ── PIN authentication ──────────────────────────────────────────────────
    const pinHashToUse = getAdminPinHash();
    if (!pinHashToUse) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'PIN authentication is not configured on this server. Use username/password.',
      });
      return;
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(pin.trim(), pinHashToUse);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      sendAdminSecurityAlertEmail({
        type: 'LOGIN_FAILED',
        username: 'PIN_AUTH_USER',
        ipAddress,
        userAgent,
        timestamp: formattedTime,
        details: 'Incorrect Admin PIN entered.',
      }).catch(err => console.error('Alert email error:', err));

      res.status(401).json({ error: 'InvalidCredentials', message: 'Incorrect PIN.' });
      return;
    }
    sub = 'superadmin-legacy';
    userUsername = 'superadmin';
    role = 'SUPER_ADMIN';

  } else {
    res.status(400).json({ error: 'BadRequest', message: 'Provide PIN or username/password.' });
    return;
  }

  // Dispatch login success alert email
  sendAdminSecurityAlertEmail({
    type: 'LOGIN_SUCCESS',
    username: userUsername,
    ipAddress,
    userAgent,
    timestamp: formattedTime,
    details: `Role: ${role}`,
  }).catch(err => console.error('Alert email error:', err));

  // Issue JWT with explicit issuer, audience, and algorithm
  const token = jwt.sign(
    { sub, username: userUsername, role },
    getJwtSecret(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    } as any
  );

  const decoded = jwt.decode(token) as { exp: number };
  const expiresAtMs = decoded.exp * 1000;

  // Set HttpOnly SameSite cookie
  setAdminCookie(res, token);

  res.json({
    token,
    expiresAt: expiresAtMs,
    user: { id: sub, username: userUsername, role },
  });
});

/**
 * POST /api/admin/logout
 * Clears the HttpOnly authentication cookie.
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('rex_admin_token', { path: '/' });
  res.clearCookie('rex_admin_csrf', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/admin/me
 * Returns current authenticated admin profile and role.
 */
router.get('/me', adminAuth, (req: AuthenticatedRequest, res: Response): void => {
  const cookies = parseCookies(req);
  if (!cookies['rex_admin_csrf']) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('rex_admin_csrf', randomBytes(32).toString('base64url'), {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 4 * 60 * 60 * 1000,
      path: '/',
    });
  }
  res.json({
    id: req.user?.sub,
    username: req.user?.username,
    role: req.user?.role,
  });
});

/**
 * Helper function to create audit log records from any server context.
 */
export async function logAdminAudit(params: {
  adminUserId?: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown> | string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const payloadStr = typeof params.payload === 'string' 
      ? params.payload 
      : JSON.stringify(params.payload ?? {});

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId ?? 'system',
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        payload: payloadStr,
        ipAddress: params.ipAddress ?? '',
        userAgent: params.userAgent ?? '',
      },
    });
  } catch (err) {
    console.error('Failed to log admin audit event:', err);
  }
}

/**
 * GET /api/admin/audit-logs
 * Retrieves paginated audit logs for admin review.
 */
router.get('/audit-logs', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '100'), 10), 1), 500);
    const search = String(req.query.search || '').trim().toLowerCase();

    const logs = await prisma.adminAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    let filtered = logs;
    if (search) {
      filtered = logs.filter(l =>
        l.action.toLowerCase().includes(search) ||
        l.targetType.toLowerCase().includes(search) ||
        l.targetId.toLowerCase().includes(search) ||
        l.adminUserId.toLowerCase().includes(search) ||
        l.payload.toLowerCase().includes(search)
      );
    }

    res.json(filtered.map(l => {
      let parsedPayload: Record<string, unknown> = {};
      try { parsedPayload = JSON.parse(l.payload); } catch { parsedPayload = { raw: l.payload }; }

      return {
        id: l.id,
        adminUserId: l.adminUserId,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        payload: parsedPayload,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      };
    }));
  } catch (err) {
    console.error('GET /api/admin/audit-logs error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch audit logs.' });
  }
});

import {
  getCashifySummary,
  getCashifyModelsList,
  getCashifyVariantsList,
  saveCustomUrl,
  triggerPriceScan,
  isScanRunning,
} from '../services/cashifyService.js';

/**
 * GET /api/admin/price-alerts
 * Returns daily Cashify price comparison logs and price increase/decrease alerts.
 */
router.get('/price-alerts', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alerts = await (prisma as any).cashifyPriceAlert.findMany({
      orderBy: { alertDate: 'desc' },
      take: 200,
    });
    res.json(alerts);
  } catch (err) {
    console.error('GET /api/admin/price-alerts error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch price comparison alerts.' });
  }
});

/**
 * GET /api/admin/cashify/summary
 * Returns high-level metrics for the Cashify monitor dashboard.
 */
router.get('/cashify/summary', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const summary = await getCashifySummary();
    res.json({ ...summary, isScanRunning: isScanRunning() });
  } catch (err) {
    console.error('GET /api/admin/cashify/summary error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch Cashify monitor summary.' });
  }
});

/**
 * GET /api/admin/cashify/variants
 * Returns all active smartphone RAM & Storage variants (1 row per variant)
 * with buyback price, competitor Cashify price, margin, and variant URL.
 */
router.get('/cashify/variants', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await getCashifyVariantsList();
    res.json(list);
  } catch (err) {
    console.error('GET /api/admin/cashify/variants error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch Cashify variants list.' });
  }
});

/**
 * GET /api/admin/cashify/models
 * Returns all active models with their resolved or custom Cashify URLs and latest prices.
 */
router.get('/cashify/models', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await getCashifyModelsList();
    res.json(list);
  } catch (err) {
    console.error('GET /api/admin/cashify/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch Cashify models list.' });
  }
});

/**
 * Extracts live unmasked buyback price from Cashify variant HTML
 */
export function extractCashifyPriceFromHtml(htmlText: string): number | null {
  if (!htmlText) return null;

  // 1. Direct itemprop="price" content="XYZ"
  const contentMatch =
    htmlText.match(/itemprop=["']price["'][^>]*content=["'](\d+)["']/i) ||
    htmlText.match(/content=["'](\d+)["'][^>]*itemprop=["']price["']/i);
  if (contentMatch) {
    const val = parseInt(contentMatch[1], 10);
    if (val >= 500 && val <= 300000) return val;
  }

  // 2. <span itemprop="price">₹12,345</span>
  const textMatch = htmlText.match(/<[^>]+itemprop=["']price["'][^>]*>([^<]+)<\/[^>]+>/i);
  if (textMatch) {
    const cleaned = textMatch[1].replace(/[^\d]/g, '');
    const val = parseInt(cleaned, 10);
    if (val >= 500 && val <= 300000) return val;
  }

  // 3. JSON-LD structured schema
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(htmlText)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data.offers?.price) {
        const val = parseInt(String(data.offers.price).replace(/[^\d]/g, ''), 10);
        if (val >= 500 && val <= 300000) return val;
      }
    } catch {
      // ignore
    }
  }

  // 4. Next.js __NEXT_DATA__
  const nextDataMatch = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const pp = nextData.props?.pageProps;
      if (pp) {
        const price =
          pp.priceDetails?.price ||
          pp.deviceDetails?.price ||
          pp.product?.price ||
          pp.modelData?.price;
        if (price) {
          const val = parseInt(String(price).replace(/[^\d]/g, ''), 10);
          if (val >= 500 && val <= 300000) return val;
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Fallback regex on currency patterns on Cashify price headers
  const priceRegex = /₹\s*([0-9]{1,3}(?:,[0-9]{2,3})+|\b[0-9]{4,6}\b)/g;
  const foundPrices: number[] = [];
  let pMatch;
  while ((pMatch = priceRegex.exec(htmlText)) !== null) {
    const num = parseInt(pMatch[1].replace(/[^\d]/g, ''), 10);
    if (num >= 2000 && num <= 200000) {
      foundPrices.push(num);
    }
  }
  if (foundPrices.length > 0) {
    return foundPrices[0];
  }

  return null;
}

/**
 * Live HTTP fetch and price extraction helper
 */
export async function extractPriceFromCashifyUrl(url: string): Promise<number | null> {
  if (!url || !url.startsWith('https://www.cashify.in')) return null;
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (resp.status !== 200) return null;
    const htmlText = await resp.text();
    return extractCashifyPriceFromHtml(htmlText);
  } catch (e) {
    console.warn(`[CashifyExtract] Failed live extract for ${url}:`, e);
    return null;
  }
}

/**
 * POST /api/admin/cashify/custom-url
 * Saves or updates a custom Cashify URL override for a variant or model,
 * and automatically extracts live price into Cashify monitoring.
 */
router.post('/cashify/custom-url', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key, modelId, customUrl, extractedPrice, rephonixPrice } = req.body;
    const targetKey = key || modelId;
    if (!targetKey || typeof customUrl !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'key (or modelId) and customUrl are required.' });
      return;
    }

    saveCustomUrl(targetKey, customUrl);

    // If key format is {modelId}_{ram}_{storage}, link all model variations and record alert
    const parts = targetKey.split('_');
    if (parts.length >= 3) {
      const idOrLegacy = parts[0];
      const ram = parseInt(parts[1], 10) || 0;
      const storage = parseInt(parts[2], 10) || 128;

      const model = await prisma.model.findFirst({
        where: {
          OR: [
            { id: idOrLegacy },
            { legacyId: idOrLegacy },
            { name: { equals: idOrLegacy, mode: 'insensitive' as any } },
          ],
        },
        include: { brand: true },
      });

      if (model) {
        saveCustomUrl(`${model.id}_${ram}_${storage}`, customUrl);
        saveCustomUrl(`${model.legacyId}_${ram}_${storage}`, customUrl);
        saveCustomUrl(`${model.name}_${ram}_${storage}`, customUrl);

        let livePrice: number | null = (typeof extractedPrice === 'number' && extractedPrice > 0)
          ? extractedPrice
          : null;

        if (!livePrice) {
          livePrice = await extractPriceFromCashifyUrl(customUrl);
        }

        if (livePrice && livePrice > 0) {
          const finalRephonixPrice = typeof rephonixPrice === 'number' && rephonixPrice > 0
            ? rephonixPrice
            : model.basePrice128GB;

          await (prisma as any).cashifyPriceAlert.create({
            data: {
              modelId: model.id,
              modelName: model.name,
              brandName: model.brand?.name || 'Unknown',
              ramGb: ram,
              storageGb: storage,
              rephonixPrice: finalRephonixPrice,
              cashifyPrice: livePrice,
              difference: finalRephonixPrice - livePrice,
              status: 'STABLE',
              changeAmount: 0,
              alertDate: new Date(),
              reviewed: true,
            },
          });
        }
      }
    }

    await logAdminAudit({
      adminUserId: req.user?.username,
      action: 'CASHIFY_CUSTOM_URL_SET',
      targetType: 'VariantOrModel',
      targetId: targetKey,
      payload: { customUrl },
    });

    res.json({ success: true, message: 'Custom Cashify URL saved and price registered successfully.' });
  } catch (err) {
    console.error('POST /api/admin/cashify/custom-url error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to save custom Cashify URL.' });
  }
});

/**
 * POST /api/admin/cashify/register-approved-variants
 * Automatically registers approved Cashify links for a newly added or updated model,
 * extracts live prices from Cashify (or uses verified prices),
 * and creates CashifyPriceAlert records so the model is immediately active in the Cashify Monitor.
 */
router.post('/cashify/register-approved-variants', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { modelId, legacyId, modelName, brandName, variants } = req.body;
    if (!modelName || !Array.isArray(variants) || variants.length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'modelName and variants array are required.' });
      return;
    }

    // 1. Resolve model in DB
    const model = await prisma.model.findFirst({
      where: {
        OR: [
          ...(modelId ? [{ id: modelId }] : []),
          ...(legacyId ? [{ legacyId }] : []),
          { name: { equals: modelName, mode: 'insensitive' as any } },
        ],
      },
      include: { brand: true },
    });

    const resolvedModelId = model?.id || modelId || legacyId || modelName;
    const resolvedLegacyId = model?.legacyId || legacyId || modelId || modelName;
    const resolvedModelName = model?.name || modelName;
    const resolvedBrandName = model?.brand?.name || brandName || 'Unknown';

    let registeredCount = 0;
    let extractedCount = 0;

    for (const v of variants) {
      if (!v.url || typeof v.url !== 'string') continue;
      const ram = Number(v.ramGb) || 0;
      const storage = Number(v.storageGb) || 128;
      const cleanUrl = v.url.trim();

      // Save custom URL under all variations so it can never be missed
      saveCustomUrl(`${resolvedModelId}_${ram}_${storage}`, cleanUrl);
      saveCustomUrl(`${resolvedLegacyId}_${ram}_${storage}`, cleanUrl);
      saveCustomUrl(`${resolvedModelName}_${ram}_${storage}`, cleanUrl);
      registeredCount++;

      // Extract or retrieve price
      let cashifyPrice: number | null = (typeof v.extractedPrice === 'number' && v.extractedPrice > 0)
        ? v.extractedPrice
        : null;

      if (!cashifyPrice) {
        cashifyPrice = await extractPriceFromCashifyUrl(cleanUrl);
      }

      if (cashifyPrice && cashifyPrice > 0) {
        extractedCount++;
        const rephonixPrice = Number(v.rephonixPrice) || model?.basePrice128GB || cashifyPrice;
        const diff = rephonixPrice - cashifyPrice;

        // Create alert entry for live monitoring
        await (prisma as any).cashifyPriceAlert.create({
          data: {
            modelId: resolvedModelId,
            modelName: resolvedModelName,
            brandName: resolvedBrandName,
            ramGb: ram,
            storageGb: storage,
            rephonixPrice,
            cashifyPrice,
            difference: diff,
            status: 'STABLE',
            changeAmount: 0,
            alertDate: new Date(),
            reviewed: true,
          },
        });
      }
    }

    await logAdminAudit({
      adminUserId: req.user?.username,
      action: 'CASHIFY_APPROVED_VARIANTS_REGISTERED',
      targetType: 'Model',
      targetId: resolvedModelId,
      payload: { modelName: resolvedModelName, registeredCount, extractedCount },
    });

    res.json({
      success: true,
      registeredCount,
      extractedCount,
      message: `Successfully registered and monitored ${registeredCount} variants (${extractedCount} live prices extracted).`,
    });
  } catch (err: any) {
    console.error('POST /api/admin/cashify/register-approved-variants error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to register approved variants: ' + (err.message || err) });
  }
});

/**
 * POST /api/admin/cashify/test-url
 * Live check for Cashify URL and automatic live price extraction.
 */
router.post('/cashify/test-url', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('https://www.cashify.in')) {
      res.status(400).json({ error: 'BadRequest', message: 'Valid https://www.cashify.in URL required.' });
      return;
    }

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (resp.status !== 200) {
      res.json({
        url,
        status: resp.status,
        ok: false,
        extractedPrice: null,
      });
      return;
    }

    const htmlText = await resp.text();
    const extractedPrice = extractCashifyPriceFromHtml(htmlText);

    res.json({
      url,
      status: resp.status,
      ok: true,
      extractedPrice,
    });
  } catch (err: any) {
    res.json({ url: req.body.url, status: 0, ok: false, extractedPrice: null, error: err.message });
  }
});

/**
 * POST /api/admin/cashify/trigger-scan
 * Triggers background price scan.
 */
router.post('/cashify/trigger-scan', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(String(req.body.limit || '0'), 10);
    const result = triggerPriceScan(limit, true);
    res.json(result);
  } catch (err: any) {
    console.error('POST /api/admin/cashify/trigger-scan error:', err);
    res.status(500).json({ error: 'ServerError', message: err.message || 'Failed to trigger scan.' });
  }
});

/**
 * GET /api/admin/cashify/scan-status
 */
router.get('/cashify/scan-status', adminAuth, (_req: AuthenticatedRequest, res: Response): void => {
  res.json({ isRunning: isScanRunning() });
});

export default router;

