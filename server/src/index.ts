import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '1mb' }));

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════
// BRANDS
// ═══════════════════════════════════════════════════════════

app.get('/api/brands', async (_req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    // Map to frontend shape: { id, name, logo }
    res.json(brands.map(b => ({ id: b.id, name: b.name, logo: b.logo })));
  } catch (err) {
    console.error('GET /api/brands error:', err);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// ═══════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════

app.get('/api/models', async (req, res) => {
  try {
    const { brandId } = req.query;
    const where: Record<string, unknown> = {};
    if (brandId && typeof brandId === 'string') {
      where.brandId = brandId;
    }
    const models = await prisma.model.findMany({ where, orderBy: { releaseYear: 'desc' } });
    // Map to frontend shape
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
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Add a new model (Admin)
app.post('/api/models', async (req, res) => {
  try {
    const { legacyId, brandId, name, modelNumber, category, releaseYear, basePrice128GB, series, imageUrl } = req.body;
    if (!legacyId || !brandId || !name || !modelNumber || !category || !releaseYear || !basePrice128GB) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    // Check for duplicate legacyId
    const existing = await prisma.model.findUnique({ where: { legacyId } });
    if (existing) {
      res.status(409).json({ error: 'Model with this ID already exists' });
      return;
    }
    const model = await prisma.model.create({
      data: { legacyId, brandId, name, modelNumber, category, releaseYear, basePrice128GB, series: series || '', imageUrl: imageUrl || '' },
    });
    res.status(201).json({
      id: model.legacyId, brandId: model.brandId, name: model.name,
      modelNumber: model.modelNumber, category: model.category,
      releaseYear: model.releaseYear, basePrice128GB: model.basePrice128GB,
      series: model.series, imageUrl: model.imageUrl,
    });
  } catch (err) {
    console.error('POST /api/models error:', err);
    res.status(500).json({ error: 'Failed to create model' });
  }
});

// Delete a model (Admin)
app.delete('/api/models/:legacyId', async (req, res) => {
  try {
    const { legacyId } = req.params;
    const model = await prisma.model.findUnique({ where: { legacyId } });
    if (!model) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }
    await prisma.model.delete({ where: { legacyId } });
    res.json({ success: true, deleted: legacyId });
  } catch (err) {
    console.error('DELETE /api/models error:', err);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// ═══════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════

app.get('/api/bookings', async (_req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    // Map to frontend Booking shape
    res.json(bookings.map(b => ({
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
      payoutDetails: JSON.parse(b.payoutDetailsJson || '{}'),
      inspectionStatus: b.inspectionStatus,
      payoutStatus: b.payoutStatus,
      dateCreated: b.dateCreated,
    })));
  } catch (err) {
    console.error('GET /api/bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const b = req.body;
    if (!b.id || !b.customerName || !b.customerPhone) {
      res.status(400).json({ error: 'Missing required booking fields' });
      return;
    }
    const booking = await prisma.booking.create({
      data: {
        id: b.id,
        modelLegacyId: b.modelId || b.modelLegacyId,
        modelName: b.modelName,
        modelNumber: b.modelNumber || '',
        storageGb: b.storageGb,
        color: b.color,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        address: b.address,
        pickupDate: b.pickupDate,
        pickupTimeSlot: b.pickupTimeSlot,
        finalPrice: b.finalPrice,
        verificationStatus: b.verificationStatus || 'pending',
        verifiedName: b.verifiedName || '',
        maskedAadhaar: b.maskedAadhaar || '',
        verificationDate: b.verificationDate || '',
        payoutMethod: b.payoutMethod,
        payoutMethodName: b.payoutMethodName,
        bonusPercentage: b.bonusPercentage || 0,
        bonusAmount: b.bonusAmount || 0,
        finalPayoutAmount: b.finalPayoutAmount,
        inspectionStatus: b.inspectionStatus || 'pending',
        payoutStatus: b.payoutStatus || 'pending',
        dateCreated: b.dateCreated || new Date().toISOString(),
        payoutDetailsJson: JSON.stringify(b.payoutDetails || {}),
      },
    });
    res.status(201).json({ success: true, id: booking.id });
  } catch (err) {
    console.error('POST /api/bookings error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking (Admin: inspection/payout status)
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Only allow specific fields to be updated
    const allowedFields = ['inspectionStatus', 'payoutStatus', 'verificationStatus'];
    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        data[key] = updates[key];
      }
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }
    const booking = await prisma.booking.update({ where: { id }, data });
    res.json({ success: true, id: booking.id });
  } catch (err) {
    console.error('PATCH /api/bookings error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ── Server Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 ReliableExchange API server running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
