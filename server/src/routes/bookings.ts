import { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import prisma from '../db.js';
import { adminAuth, requireRole, AuthenticatedRequest, optionalAdminAuth } from '../middleware/adminAuth.js';
import { customerAuth, optionalCustomerAuth, AuthenticatedCustomerRequest } from '../middleware/customerAuth.js';
import { bookingLimiter, trackingLimiter } from '../middleware/rateLimits.js';
import { validateBookingBody, payoutBonusFor } from '../validation/booking.js';
import {
  encryptPayoutDetails,
  decryptPayoutDetails,
  maskPayoutDetails,
  encryptField,
  decryptField,
} from '../utils/encryption.js';
import {
  maximumQuoteFor,
  calculateServerValuation,
  DeviceCategory,
} from '../services/valuation.js';
import { generateBookingQuotationPDF } from '../services/pdfGenerator.js';
import { sendBookingConfirmationEmail } from '../services/bookingMailer.js';

const router = Router();

// ── IMEI encryption helpers ──────────────────────────────────────
export function encryptImei(imei: string): string {
  if (!imei) return '';
  try {
    const payload = encryptField(imei);
    return JSON.stringify({ __enc: true, ...payload });
  } catch {
    console.warn('[IMEI] Encryption unavailable — storing plain text (dev only)');
    return imei;
  }
}

export function decryptImei(raw: string): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.__enc === true && parsed.iv && parsed.ciphertext && parsed.authTag) {
      return decryptField({ iv: parsed.iv, ciphertext: parsed.ciphertext, authTag: parsed.authTag });
    }
    return raw;
  } catch {
    return raw;
  }
}

export function mapBooking(b: any, includeUnmaskedPayout = false) {
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
    imei: decryptImei(b.imei || ''),
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

// POST /api/bookings/track (PUBLIC, RATE-LIMITED BY PHONE + BOOKING ID)
router.post('/track', trackingLimiter, async (req, res) => {
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

// GET /api/bookings — ADMIN ONLY
router.get('/', adminAuth, requireRole(['SUPER_ADMIN', 'FINANCE_APPROVER', 'OPERATIONS_AGENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    const isFinanceAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'FINANCE_APPROVER';
    res.json(bookings.map(b => mapBooking(b, isFinanceAdmin)));
  } catch (err) {
    console.error('GET /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/my — AUTHENTICATED CUSTOMER ONLY
router.get('/my', customerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    if (!req.userId && !req.customer?.email && !req.customer?.phone) {
      res.json([]);
      return;
    }

    let whereClause: Record<string, unknown>;
    if (req.userId) {
      whereClause = { userId: req.userId };
    } else {
      const conditions: Array<Record<string, unknown>> = [];
      if (req.customer?.email) conditions.push({ customerEmail: req.customer.email });
      if (req.customer?.phone) conditions.push({ customerPhone: req.customer.phone });
      whereClause = conditions.length === 1 ? conditions[0] : { OR: conditions };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        events: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = bookings.map(b => ({
      ...mapBooking(b, false),
      events: b.events.map(e => ({
        eventType: e.eventType,
        note: e.note,
        createdAt: e.createdAt,
      }))
    }));

    res.json(mapped);
  } catch (err) {
    console.error('GET /api/bookings/my error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch customer bookings' });
  }
});

// POST /api/bookings — Public & Server-Authoritative
router.post('/', bookingLimiter, optionalCustomerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const b = req.body as Record<string, unknown>;

    const errors = validateBookingBody(b);
    if (errors.length > 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Booking validation failed', fields: errors });
      return;
    }

    const modelLegacyId = String(b.modelId ?? b.modelLegacyId);
    const model = await prisma.model.findUnique({ where: { legacyId: modelLegacyId } });
    if (!model || model.hidden) {
      res.status(400).json({ error: 'ValidationError', message: 'The selected device is no longer available for trade-in.' });
      return;
    }

    const storageGb = Number(b.storageGb);
    const ramGb = b.ramGb ? Number(b.ramGb) : undefined;
    const defectIds = Array.isArray(b.defectIds) ? (b.defectIds as string[]) : [];
    const maxQuote = maximumQuoteFor(model.basePrice128GB, storageGb, model.variantPrices, ramGb);

    const clientPrice = Number(b.finalPrice);
    const hasValidClientPrice = (typeof b.finalPrice === 'number' || typeof b.finalPrice === 'string') && !isNaN(clientPrice) && clientPrice > 0;
    const estimatedPrice = hasValidClientPrice
      ? Math.round(clientPrice)
      : (calculateServerValuation(maxQuote, model.category as DeviceCategory, defectIds) ?? maxQuote);

    if (estimatedPrice === null || isNaN(estimatedPrice)) {
      res.status(400).json({ error: 'ValidationError', message: 'One or more declared device conditions are invalid.' });
      return;
    }

    const payout = payoutBonusFor(String(b.payoutMethod), estimatedPrice);
    const bookingId = `STC-${randomBytes(6).toString('base64url').toUpperCase()}`;

    const rawPayoutDetails = (b.payoutDetails && typeof b.payoutDetails === 'object') ? (b.payoutDetails as Record<string, unknown>) : {};
    const encryptedPayoutJson = encryptPayoutDetails(rawPayoutDetails);

    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        userId: req.userId,
        modelLegacyId: model.legacyId,
        modelName: model.name,
        storageGb,
        color: String(b.color ?? ''),
        customerName: (req.customer?.name || String(b.customerName ?? '')).trim(),
        customerPhone: (req.customer?.phone || String(b.customerPhone ?? '')).trim(),
        customerEmail: (req.customer?.email || String(b.customerEmail ?? '')).trim(),
        imei: encryptImei(String(b.imei ?? '').trim()),
        address: String(b.address).trim(),
        pickupDate: String(b.pickupDate),
        pickupTimeSlot: String(b.pickupTimeSlot),
        finalPrice: estimatedPrice,
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
        defectIdsJson: JSON.stringify(defectIds),
      } as any,
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'created',
        toValue: booking.id,
        note: `Booking created for ${booking.customerName} — ${booking.modelName}`,
      },
    });

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    const baseUrl = `${protocol}://${host}`;

    try {
      await sendBookingConfirmationEmail({
        id: booking.id,
        modelName: booking.modelName,
        storageGb: booking.storageGb,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        address: booking.address,
        pickupDate: booking.pickupDate,
        pickupTimeSlot: booking.pickupTimeSlot,
        finalPrice: booking.finalPrice,
        defectDescriptions: defectIds,
        dateCreated: booking.dateCreated,
      }, baseUrl);
    } catch (err) {
      console.error('[POST /api/bookings] Failed to dispatch quotation email:', err);
    }

    res.status(201).json({ success: true, id: booking.id });
  } catch (err) {
    console.error('POST /api/bookings error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create booking' });
  }
});

// GET /api/bookings/:id/pdf — Download Official PDF Quotation Document
router.get('/:id/pdf', optionalAdminAuth as any, optionalCustomerAuth, async (req: AuthenticatedCustomerRequest, res) => {
  try {
    const rawId = String(req.params.id);

    let booking: any = await prisma.booking.findUnique({ where: { id: rawId.trim().toUpperCase() } });
    if (!booking) {
      const candidates = await prisma.booking.findMany({
        select: { id: true, userId: true, modelName: true, storageGb: true, customerName: true, customerPhone: true, customerEmail: true, address: true, pickupDate: true, pickupTimeSlot: true, finalPrice: true, defectIdsJson: true, dateCreated: true }
      });
      booking = candidates.find(b => b.id.toLowerCase() === rawId.toLowerCase()) ?? null;
    }

    if (!booking) {
      res.status(404).json({ error: 'NotFound', message: 'Booking record not found' });
      return;
    }

    const isAdminRequest = Boolean(req.adminId);
    const customer = req.customer;
    const isOwner = customer && (
      (req.userId && req.userId === (booking as any).userId) ||
      (customer.email && customer.email === (booking as any).customerEmail) ||
      (customer.phone && customer.phone === (booking as any).customerPhone)
    );

    if (!isAdminRequest && !isOwner) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to download this booking document.' });
      return;
    }

    const bookingData = {
      id: booking.id,
      modelName: booking.modelName,
      storageGb: booking.storageGb,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      imei: decryptImei((booking as any).imei || ''),
      address: booking.address,
      pickupDate: booking.pickupDate,
      pickupTimeSlot: booking.pickupTimeSlot,
      finalPrice: booking.finalPrice,
      defectDescriptions: (() => {
        try {
          return JSON.parse(booking.defectIdsJson || '[]');
        } catch {
          return [];
        }
      })(),
      dateCreated: booking.dateCreated,
    };

    const pdfBuffer = await generateBookingQuotationPDF(bookingData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Quotation-${bookingData.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('GET /api/bookings/:id/pdf error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to generate PDF quotation.' });
  }
});

// PATCH /api/bookings/:id
router.patch('/:id', adminAuth, requireRole(['SUPER_ADMIN', 'FINANCE_APPROVER', 'OPERATIONS_AGENT']), async (req: AuthenticatedRequest, res) => {
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

    if (currentBooking.payoutStatus === 'completed' && updates.inspectionStatus !== undefined) {
      res.status(400).json({ error: 'InvalidOperation', message: 'Cannot modify inspection decision after financial payout has been completed.' });
      return;
    }

    if (updates.payoutStatus === 'completed' && currentBooking.inspectionStatus !== 'approved' && updates.inspectionStatus !== 'approved') {
      res.status(400).json({ error: 'InvalidOperation', message: 'Cannot complete financial payout before doorstep inspection is approved.' });
      return;
    }

    const booking = await prisma.booking.update({ where: { id }, data });

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

// DELETE /api/bookings/:id/payout-details
router.delete('/:id/payout-details', adminAuth, requireRole(['SUPER_ADMIN', 'FINANCE_APPROVER']), async (req: AuthenticatedRequest, res) => {
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

export default router;
