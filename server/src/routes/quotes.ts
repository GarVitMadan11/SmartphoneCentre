import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../db.js';
import {
  calculateServerValuation,
  maximumQuoteFor,
  PRICING_ENGINE_VERSION,
  QUOTE_TTL_MINUTES,
  generateQuoteSignature,
  DeviceCategory,
} from '../services/valuation.js';
import {
  sendAdminQuoteAlertEmail,
  sendAdminPriceMatchAlertEmail,
  sendAdminStepLeadEmail,
} from '../services/bookingMailer.js';
import { ALLOWED_STORAGE_GB } from '../validation/booking.js';
import { authLimiter, leadLimiter } from '../middleware/rateLimits.js';

const router = Router();


// POST /api/quotes
router.post('/', async (req, res) => {
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

    const model = await prisma.model.findFirst({
      where: { OR: [{ legacyId: modelId }, { id: modelId }] },
    });
    if (!model || model.hidden) {
      res.status(404).json({ error: 'NotFound', message: 'Model not found in catalog or is unavailable for trade-in.' });
      return;
    }

    const ramGb = req.body.ramGb ? Number(req.body.ramGb) : undefined;
    const maxPrice = maximumQuoteFor(model.basePrice128GB, Number(storageGb), model.variantPrices, ramGb);
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

// POST /api/quotes/alert
router.post('/alert', authLimiter, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      modelName,
      storageGb,
      estimatedPayout,
      retentionPercentage,
      defects,
      refCode,
    } = req.body || {};

    if (!customerEmail || !modelName) {
      res.status(400).json({ error: 'ValidationError', message: 'customerEmail and modelName are required.' });
      return;
    }

    try {
      await sendAdminQuoteAlertEmail({
        customerName: String(customerName || 'Registered Customer'),
        customerPhone: String(customerPhone || 'N/A'),
        customerEmail: String(customerEmail),
        modelName: String(modelName),
        storageGb: Number(storageGb) || 128,
        estimatedPayout: Number(estimatedPayout) || 0,
        retentionPercentage: Number(retentionPercentage) || 100,
        defects: Array.isArray(defects) ? defects.map(String) : [],
        refCode: refCode ? String(refCode) : undefined,
      });
    } catch (err) {
      console.error('[POST /api/quotes/alert] Failed to dispatch admin quote alert:', err);
    }

    res.json({ success: true, message: 'Quote alert email notification dispatched.' });
  } catch (err) {
    console.error('POST /api/quotes/alert error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to process quote alert.' });
  }
});

// POST /api/quotes/price-match
router.post('/price-match', authLimiter, async (req, res) => {
  try {
    const {
      customerPhone,
      customerEmail,
      customerName,
      modelName,
      storageGb,
      currentQuote,
      expectedPrice,
      comments,
      refCode,
    } = req.body || {};

    if (!customerPhone || !modelName) {
      res.status(400).json({ error: 'ValidationError', message: 'customerPhone and modelName are required.' });
      return;
    }

    try {
      await sendAdminPriceMatchAlertEmail({
        customerPhone: String(customerPhone),
        customerEmail: customerEmail ? String(customerEmail) : undefined,
        customerName: customerName ? String(customerName) : undefined,
        modelName: String(modelName),
        storageGb: Number(storageGb) || 128,
        currentQuote: Number(currentQuote) || 0,
        expectedPrice: expectedPrice ? String(expectedPrice) : 'N/A',
        comments: comments ? String(comments) : undefined,
        refCode: refCode ? String(refCode) : undefined,
      });
    } catch (err) {
      console.error('[POST /api/quotes/price-match] Failed to send price match email:', err);
    }

    res.json({ success: true, message: 'Price match request email dispatched.' });
  } catch (err) {
    console.error('POST /api/quotes/price-match error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to process price match request.' });
  }
});

// POST /api/quotes/step-lead
router.post('/step-lead', leadLimiter, async (req, res) => {
  try {
    const {
      modelName,
      brandName,
      storageGb,
      ramGb,
      basePrice,
      customerName,
      customerPhone,
      customerEmail,
      deviceType,
      sourceUrl,
    } = req.body || {};

    if (!modelName || typeof modelName !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'modelName is required.' });
      return;
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;

    // Dispatch lead email asynchronously so the client flow remains ultra-snappy
    sendAdminStepLeadEmail({
      modelName: String(modelName).trim(),
      brandName: brandName ? String(brandName).trim() : undefined,
      storageGb: Number(storageGb) || 128,
      ramGb: ramGb ? Number(ramGb) : undefined,
      basePrice: basePrice ? Number(basePrice) : undefined,
      customerName: customerName ? String(customerName).trim() : undefined,
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      deviceType: deviceType ? String(deviceType).trim() : undefined,
      sourceUrl: sourceUrl ? String(sourceUrl).trim() : undefined,
      ip,
      userAgent,
    }).catch((err) => {
      console.error('[POST /api/quotes/step-lead] Failed to dispatch admin step lead email:', err);
    });

    res.json({ success: true, message: 'Step lead email notification processed.' });
  } catch (err) {
    console.error('POST /api/quotes/step-lead error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to process step lead.' });
  }
});

export default router;

