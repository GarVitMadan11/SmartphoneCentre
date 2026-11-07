import { Router, Response } from 'express';
import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { adminAuth, AuthenticatedRequest } from '../middleware/adminAuth.js';

const router = Router();

// Helper to generate a unique barcode
async function generateUniqueBarcode(): Promise<string> {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;

  for (let i = 0; i < 15; i++) {
    const randomHex = randomBytes(2).toString('hex').toUpperCase();
    const candidate = `RPX-${dateSegment}-${randomHex}`;
    const existing = await prisma.inventoryItem.findUnique({
      where: { barcode: candidate },
    });
    if (!existing) {
      return candidate;
    }
  }

  return `RPX-${dateSegment}-${Date.now().toString().slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/admin/inventory - List inventory items with filters & summary stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, channel, search, dateFrom, dateTo } = req.query;

    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (channel && typeof channel === 'string' && channel !== 'ALL') {
      where.acquisitionChannel = channel;
    }

    if (dateFrom || dateTo) {
      where.buyingDate = {};
      if (dateFrom && typeof dateFrom === 'string') {
        where.buyingDate.gte = new Date(dateFrom);
      }
      if (dateTo && typeof dateTo === 'string') {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.buyingDate.lte = toDate;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { barcode: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { variant: { contains: q, mode: 'insensitive' } },
        { imei: { contains: q, mode: 'insensitive' } },
        { boughtFrom: { contains: q, mode: 'insensitive' } },
        { sellerPhone: { contains: q, mode: 'insensitive' } },
        { soldTo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregate summary statistics across all inventory
    const allItems = await prisma.inventoryItem.findMany({
      select: {
        status: true,
        buyingPrice: true,
        sellingPrice: true,
        acquisitionChannel: true,
      },
    });

    let totalCount = allItems.length;
    let inStockCount = 0;
    let inStockValue = 0;
    let soldCount = 0;
    let totalRevenue = 0;
    let costOfSold = 0;
    let onlineCount = 0;
    let offlineCount = 0;

    for (const it of allItems) {
      if (it.acquisitionChannel === 'ONLINE') onlineCount++;
      if (it.acquisitionChannel === 'OFFLINE') offlineCount++;

      if (it.status === 'IN_STOCK') {
        inStockCount++;
        inStockValue += it.buyingPrice || 0;
      } else if (it.status === 'SOLD') {
        soldCount++;
        costOfSold += it.buyingPrice || 0;
        totalRevenue += it.sellingPrice || 0;
      }
    }

    const totalProfit = totalRevenue - costOfSold;

    res.json({
      items,
      stats: {
        totalCount,
        inStockCount,
        inStockValue,
        soldCount,
        totalRevenue,
        costOfSold,
        totalProfit,
        onlineCount,
        offlineCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch inventory:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to retrieve inventory items.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/admin/inventory/convertible-bookings - Completed bookings ready to add
// ─────────────────────────────────────────────────────────────────────────────
router.get('/convertible-bookings', adminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Find bookings that have completed payout or verified inspection
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { payoutStatus: 'paid' },
          { inspectionStatus: 'completed' },
          { inspectionStatus: 'verified' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        modelName: true,
        storageGb: true,
        color: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        imei: true,
        finalPayoutAmount: true,
        finalPrice: true,
        pickupDate: true,
        inspectionStatus: true,
        payoutStatus: true,
        createdAt: true,
      },
    });

    // Check which ones are already linked to an inventory item
    const bookingIds = bookings.map(b => b.id);
    const existingItems = await prisma.inventoryItem.findMany({
      where: { associatedBookingId: { in: bookingIds } },
      select: { associatedBookingId: true },
    });
    const convertedIds = new Set(existingItems.map(i => i.associatedBookingId).filter(Boolean));

    const readyBookings = bookings.map(b => ({
      ...b,
      alreadyInInventory: convertedIds.has(b.id),
    }));

    res.json(readyBookings);
  } catch (error: any) {
    console.error('Failed to fetch convertible bookings:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to load eligible bookings.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/admin/inventory/barcode/:barcode - Scan lookup
// ─────────────────────────────────────────────────────────────────────────────
router.get('/barcode/:barcode', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const barcode = String(req.params.barcode).trim();
    const item = await prisma.inventoryItem.findUnique({
      where: { barcode },
    });

    if (!item) {
      res.status(404).json({ error: 'NotFound', message: `No inventory item found with barcode ${barcode}` });
      return;
    }

    res.json(item);
  } catch (error: any) {
    console.error('Barcode lookup failed:', error);
    res.status(500).json({ error: 'ServerError', message: 'Barcode search failed.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/admin/inventory - Add new inventory device
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      barcode: customBarcode,
      brand,
      model,
      variant,
      storageGb,
      ramGb,
      color,
      imei,
      condition,
      buyingPrice,
      buyingDate,
      boughtFrom,
      sellerPhone,
      sellerEmail,
      acquisitionChannel,
      associatedBookingId,
      notes,
    } = req.body;

    if (!brand || !brand.trim()) {
      res.status(400).json({ error: 'ValidationError', message: 'Brand name is required.' });
      return;
    }

    if (!model || !model.trim()) {
      res.status(400).json({ error: 'ValidationError', message: 'Model name is required.' });
      return;
    }

    const priceNum = Number(buyingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Valid buying price is required.' });
      return;
    }

    if (!boughtFrom || !boughtFrom.trim()) {
      res.status(400).json({ error: 'ValidationError', message: 'Bought from (seller / source) is required.' });
      return;
    }

    // Determine barcode (use custom or auto-generate unique)
    let finalBarcode = customBarcode && typeof customBarcode === 'string' && customBarcode.trim().length > 0
      ? customBarcode.trim().toUpperCase()
      : await generateUniqueBarcode();

    // Verify barcode uniqueness
    const barcodeCollision = await prisma.inventoryItem.findUnique({
      where: { barcode: finalBarcode },
    });
    if (barcodeCollision) {
      if (customBarcode) {
        res.status(409).json({ error: 'Conflict', message: `Barcode ${finalBarcode} already exists in inventory.` });
        return;
      }
      finalBarcode = await generateUniqueBarcode();
    }

    const channel = acquisitionChannel === 'ONLINE' ? 'ONLINE' : 'OFFLINE';

    const item = await prisma.inventoryItem.create({
      data: {
        barcode: finalBarcode,
        brand: brand.trim(),
        model: model.trim(),
        variant: variant ? String(variant).trim() : '',
        storageGb: storageGb ? parseInt(String(storageGb), 10) : null,
        ramGb: ramGb ? parseInt(String(ramGb), 10) : null,
        color: color ? String(color).trim() : '',
        imei: imei ? String(imei).trim() : '',
        condition: condition ? String(condition).trim() : 'Good',
        buyingPrice: Math.round(priceNum),
        buyingDate: buyingDate ? new Date(buyingDate) : new Date(),
        boughtFrom: boughtFrom.trim(),
        sellerPhone: sellerPhone ? String(sellerPhone).trim() : '',
        sellerEmail: sellerEmail ? String(sellerEmail).trim() : '',
        acquisitionChannel: channel,
        associatedBookingId: associatedBookingId ? String(associatedBookingId).trim() : null,
        notes: notes ? String(notes).trim() : '',
        createdBy: req.user?.username || 'ADMIN',
      },
    });

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.user?.sub || 'admin',
        action: 'INVENTORY_CREATE',
        targetType: 'INVENTORY',
        targetId: item.id,
        payload: JSON.stringify({
          barcode: item.barcode,
          model: `${item.brand} ${item.model}`,
          buyingPrice: item.buyingPrice,
          boughtFrom: item.boughtFrom,
          channel: item.acquisitionChannel,
        }),
      },
    }).catch(() => {});

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Failed to create inventory item:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to add device to inventory.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PATCH /api/admin/inventory/:id - Update device info
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: 'Inventory item not found.' });
      return;
    }

    const {
      brand,
      model,
      variant,
      storageGb,
      ramGb,
      color,
      imei,
      condition,
      buyingPrice,
      buyingDate,
      boughtFrom,
      sellerPhone,
      sellerEmail,
      acquisitionChannel,
      status,
      notes,
    } = req.body;

    const data: any = {};
    if (brand !== undefined) data.brand = String(brand).trim();
    if (model !== undefined) data.model = String(model).trim();
    if (variant !== undefined) data.variant = String(variant).trim();
    if (storageGb !== undefined) data.storageGb = storageGb ? parseInt(String(storageGb), 10) : null;
    if (ramGb !== undefined) data.ramGb = ramGb ? parseInt(String(ramGb), 10) : null;
    if (color !== undefined) data.color = String(color).trim();
    if (imei !== undefined) data.imei = String(imei).trim();
    if (condition !== undefined) data.condition = String(condition).trim();
    if (buyingPrice !== undefined) data.buyingPrice = Math.round(Number(buyingPrice));
    if (buyingDate !== undefined) data.buyingDate = new Date(buyingDate);
    if (boughtFrom !== undefined) data.boughtFrom = String(boughtFrom).trim();
    if (sellerPhone !== undefined) data.sellerPhone = String(sellerPhone).trim();
    if (sellerEmail !== undefined) data.sellerEmail = String(sellerEmail).trim();
    if (acquisitionChannel !== undefined) data.acquisitionChannel = acquisitionChannel === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
    if (status !== undefined) data.status = String(status).trim();
    if (notes !== undefined) data.notes = String(notes).trim();

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update inventory item:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update inventory details.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/admin/inventory/:id/mark-sold - Mark item as sold
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/mark-sold', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { sellingPrice, soldDate, soldTo, buyerContact, paymentMethod, notes } = req.body;

    const priceNum = Number(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Valid selling price is required.' });
      return;
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: 'Inventory item not found.' });
      return;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        status: 'SOLD',
        sellingPrice: Math.round(priceNum),
        soldDate: soldDate ? new Date(soldDate) : new Date(),
        soldTo: soldTo ? String(soldTo).trim() : 'Customer',
        buyerContact: buyerContact ? String(buyerContact).trim() : '',
        paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'UPI',
        notes: notes !== undefined ? String(notes).trim() : existing.notes,
      },
    });

    const profit = (updated.sellingPrice || 0) - (updated.buyingPrice || 0);

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.user?.sub || 'admin',
        action: 'INVENTORY_MARK_SOLD',
        targetType: 'INVENTORY',
        targetId: updated.id,
        payload: JSON.stringify({
          barcode: updated.barcode,
          model: `${updated.brand} ${updated.model}`,
          buyingPrice: updated.buyingPrice,
          sellingPrice: updated.sellingPrice,
          profit,
          soldTo: updated.soldTo,
        }),
      },
    }).catch(() => {});

    res.json({
      item: updated,
      profit,
      message: `Device marked as sold! Realized profit: ₹${profit.toLocaleString('en-IN')}`,
    });
  } catch (error: any) {
    console.error('Failed to mark inventory as sold:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to record sale.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /api/admin/inventory/:id/revert-sold - Revert back to IN_STOCK
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/revert-sold', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: 'Inventory item not found.' });
      return;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        status: 'IN_STOCK',
        sellingPrice: null,
        soldDate: null,
        soldTo: null,
        buyerContact: null,
        paymentMethod: null,
      },
    });

    res.json({ item: updated, message: 'Device status reverted to In Stock.' });
  } catch (error: any) {
    console.error('Failed to revert sold status:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to revert sale.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. DELETE /api/admin/inventory/:id - Remove item
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: 'Inventory item not found.' });
      return;
    }

    await prisma.inventoryItem.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.user?.sub || 'admin',
        action: 'INVENTORY_DELETE',
        targetType: 'INVENTORY',
        targetId: id,
        payload: JSON.stringify({
          barcode: existing.barcode,
          model: `${existing.brand} ${existing.model}`,
        }),
      },
    }).catch(() => {});

    res.json({ success: true, message: `Inventory item ${existing.barcode} deleted.` });
  } catch (error: any) {
    console.error('Failed to delete inventory item:', error);
    res.status(500).json({ error: 'ServerError', message: 'Failed to delete inventory item.' });
  }
});

export default router;
