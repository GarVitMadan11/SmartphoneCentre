import { Router } from 'express';
import prisma from '../db.js';
import { adminAuth, requireRole, AuthenticatedRequest } from '../middleware/adminAuth.js';
import { logAdminAudit } from './admin.js';
import { isValidImageUrl, formatImageUrl } from '../validation/booking.js';

const router = Router();

export function inferBrandId(legacyId: string, explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.trim();
  if (legacyId.startsWith('apple-') || legacyId.startsWith('iphone-')) return 'brand-apple';
  if (legacyId.startsWith('sam-') || legacyId.startsWith('samsung-')) return 'brand-samsung';
  if (legacyId.startsWith('op-') || legacyId.startsWith('oneplus-')) return 'brand-oneplus';
  if (legacyId.startsWith('vi-') || legacyId.startsWith('vivo-')) return 'brand-vivo';
  if (legacyId.startsWith('xi-') || legacyId.startsWith('xiaomi-') || legacyId.startsWith('redmi-') || legacyId.startsWith('poco-')) return 'brand-xiaomi';
  return 'brand-apple';
}

// GET /api/models
router.get('/', async (req, res) => {
  try {
    const { brandId, deviceType } = req.query;
    const where: Record<string, unknown> = {};
    if (brandId && typeof brandId === 'string') where.brandId = brandId;
    if (deviceType && typeof deviceType === 'string') where.deviceType = deviceType;

    let models: any[] = [];
    try {
      models = await prisma.model.findMany({
        where,
        orderBy: [
          { releaseYear: 'desc' },
          { basePrice128GB: 'desc' },
          { name: 'asc' },
        ],
      });
    } catch (dbErr) {
      console.warn('GET /api/models DB query warning (falling back to simple query):', dbErr);
      try {
        models = await prisma.model.findMany({ where });
      } catch (innerErr) {
        console.error('GET /api/models DB connection error:', innerErr);
        models = [];
      }
    }

    res.json(models.map(m => {
      let parsedStorageGb: number[] | undefined;
      let parsedRamGb: number[] | undefined;
      let parsedVariantPrices: Record<string, number> | undefined;
      try { parsedStorageGb = JSON.parse(m.supportedStorageGb); } catch { parsedStorageGb = [128, 256, 512]; }
      try { parsedRamGb = JSON.parse((m as any).supportedRamGb ?? '[0]'); } catch { parsedRamGb = [0]; }
      try { parsedVariantPrices = JSON.parse((m as any).variantPrices ?? '{}'); } catch { parsedVariantPrices = {}; }

      let resolvedSeries = m.series || '';
      if (m.brandId === 'brand-xiaomi') {
        const lower = m.name.toLowerCase();
        if (lower.includes('poco f')) resolvedSeries = 'POCO F Series';
        else if (lower.includes('poco x')) resolvedSeries = 'POCO X Series';
        else if (lower.includes('poco m')) resolvedSeries = 'POCO M Series';
        else if (lower.includes('poco c')) resolvedSeries = 'POCO C Series';
        else if (lower.includes('redmi note')) resolvedSeries = 'Redmi Note Series';
        else if (lower.includes('redmi')) resolvedSeries = 'Redmi Series';
        else if (lower.includes('xiaomi') || lower.includes('mi')) resolvedSeries = 'Xiaomi Series';
      }

      const supportsWarrantyQuestion = (parsedVariantPrices as any)?._supportsWarrantyQuestion !== undefined
        ? Boolean((parsedVariantPrices as any)._supportsWarrantyQuestion)
        : (m.releaseYear >= 2023);

      return {
        id: m.legacyId,
        legacyId: m.legacyId,
        dbId: m.id,
        brandId: m.brandId,
        name: m.name,
        category: m.category,
        deviceType: (m as any).deviceType || 'smartphones',
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: resolvedSeries,
        imageUrl: (m.imageUrl && !m.imageUrl.toLowerCase().startsWith('file:') && !m.imageUrl.startsWith('/opt/render')) ? m.imageUrl : undefined,
        supportedStorageGb: parsedStorageGb,
        supportedRamGb: parsedRamGb,
        variantPrices: parsedVariantPrices,
        hidden: Boolean((m as any).hidden ?? false),
        supportsWarrantyQuestion,
      };
    }));
  } catch (err) {
    console.error('GET /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch models' });
  }
});

// POST /api/models
router.post('/', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const { legacyId, brandId, name, category, deviceType, releaseYear, basePrice128GB,
            series, imageUrl, supportedStorageGb, supportedRamGb, variantPrices, hidden, supportsWarrantyQuestion } = req.body;
    if (!legacyId || !brandId || !name || !category || !releaseYear || !basePrice128GB) {
      res.status(400).json({ error: 'BadRequest', message: 'Missing required fields' });
      return;
    }
    if (!Number.isFinite(Number(releaseYear)) || !Number.isFinite(Number(basePrice128GB)) || Number(basePrice128GB) <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'releaseYear and basePrice128GB must be valid positive numbers.' });
      return;
    }
    if (!isValidImageUrl(imageUrl)) {
      res.status(400).json({ error: 'BadRequest', message: 'imageUrl must be a valid http(s) URL or base64 Data URL' });
      return;
    }

    const storageStr = Array.isArray(supportedStorageGb) ? JSON.stringify(supportedStorageGb) : JSON.stringify([128, 256, 512]);
    const ramStr = Array.isArray(supportedRamGb) ? JSON.stringify(supportedRamGb) : JSON.stringify([0]);
    const pricesObj = (variantPrices && typeof variantPrices === 'object' && !Array.isArray(variantPrices)) ? { ...variantPrices } : {};
    if (supportsWarrantyQuestion !== undefined) {
      (pricesObj as any)._supportsWarrantyQuestion = Boolean(supportsWarrantyQuestion);
    }
    // Auto-compute basePrice128GB from minimum variant price if prices are set
    const allPrices = Object.values(pricesObj).filter((v): v is number => typeof v === 'number' && v > 0);
    const resolvedBase = allPrices.length > 0 ? Math.min(...allPrices) : Number(basePrice128GB);

    const model = await prisma.model.create({
      data: {
        legacyId: String(legacyId).trim(),
        brandId: String(brandId),
        name: String(name).trim(),
        category: String(category).trim(),
        deviceType: deviceType ? String(deviceType).trim() : 'smartphones',
        releaseYear: Number(releaseYear),
        basePrice128GB: resolvedBase,
        series: series ? String(series).trim() : '',
        imageUrl: imageUrl ? String(imageUrl).trim() : '',
        supportedStorageGb: storageStr,
        hidden: Boolean(hidden),
        ...(({ supportedRamGb: ramStr, variantPrices: JSON.stringify(pricesObj) }) as any),
      },
    });

    logAdminAudit({
      adminUserId: (req as AuthenticatedRequest).user?.sub,
      action: 'create_model',
      targetType: 'model',
      targetId: model.legacyId,
      payload: { name: model.name, category: model.category, basePrice128GB: model.basePrice128GB },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    const createdVP = JSON.parse((model as any).variantPrices ?? '{}');
    const resSupportsWarrantyQuestion = createdVP._supportsWarrantyQuestion !== undefined
      ? Boolean(createdVP._supportsWarrantyQuestion)
      : (model.releaseYear >= 2023);

    res.status(201).json({
      ...model,
      id: model.legacyId,
      supportedStorageGb: JSON.parse(model.supportedStorageGb),
      supportedRamGb: JSON.parse((model as any).supportedRamGb ?? '[0]'),
      variantPrices: createdVP,
      supportsWarrantyQuestion: resSupportsWarrantyQuestion,
    });
  } catch (err) {
    console.error('POST /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to create model' });
  }
});

// POST /api/models/bulk-update
router.post('/bulk-update', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
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

      const legacyId = String(id);
      const existing = await prisma.model.findFirst({
        where: { OR: [{ legacyId }, { id: legacyId }] }
      });

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
      if (changes.hidden !== undefined) {
        data.hidden = Boolean(changes.hidden);
      }
      if (changes.supportedRamGb !== undefined && Array.isArray(changes.supportedRamGb)) {
        (data as any).supportedRamGb = JSON.stringify(changes.supportedRamGb);
      }
      if (changes.variantPrices !== undefined && typeof changes.variantPrices === 'object' && !Array.isArray(changes.variantPrices)) {
        (data as any).variantPrices = JSON.stringify(changes.variantPrices);
        const prices = Object.values(changes.variantPrices as Record<string, number>).filter((v): v is number => typeof v === 'number' && v > 0);
        if (prices.length > 0) data.basePrice128GB = Math.min(...prices);
      }

      if (!existing) {
        const brandId = inferBrandId(legacyId, changes.brandId as string);

        const brandExists = await prisma.brand.findUnique({ where: { id: brandId } });
        if (!brandExists) {
          await prisma.brand.create({
            data: { id: brandId, name: brandId.replace('brand-', '').toUpperCase(), logo: '/logo.svg' }
          });
        }

        await prisma.model.create({
          data: {
            legacyId,
            brandId,
            name: (data.name as string) || (changes.name as string) || legacyId,
            category: (data.category as string) || (changes.category as string) || 'midrange',
            releaseYear: Number(data.releaseYear) || Number(changes.releaseYear) || new Date().getFullYear(),
            basePrice128GB: Number(data.basePrice128GB) || Number(changes.basePrice128GB) || 10000,
            series: (data.series as string) || (changes.series as string) || '',
            imageUrl: (data.imageUrl as string) || '',
            supportedStorageGb: data.supportedStorageGb ? String(data.supportedStorageGb) : '[128,256,512]',
            hidden: Boolean(data.hidden ?? changes.hidden ?? false),
            ...(({
              supportedRamGb: (data as any).supportedRamGb ? String((data as any).supportedRamGb) : '[0]',
              variantPrices: (data as any).variantPrices ? String((data as any).variantPrices) : '{}',
            }) as any),
          }
        });
        updatedCount++;
      } else if (Object.keys(data).length > 0) {
        await prisma.model.update({ where: { id: existing.id }, data });
        updatedCount++;
      }
    }

    logAdminAudit({
      adminUserId: (req as AuthenticatedRequest).user?.sub,
      action: 'bulk_update_models',
      targetType: 'catalog',
      targetId: 'multiple',
      payload: { count: updatedCount, totalInBatch: updates.length },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error('POST /api/models/bulk-update error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed bulk updating models.' });
  }
});

// PATCH /api/models/:legacyId
router.patch('/:legacyId', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const legacyId = String(req.params.legacyId);
    const updates = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const field of ['name', 'category', 'deviceType']) {
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
      data.imageUrl = formatImageUrl(updates.imageUrl);
    }
    if (updates.supportedStorageGb !== undefined && Array.isArray(updates.supportedStorageGb)) {
      data.supportedStorageGb = JSON.stringify(updates.supportedStorageGb);
    }
    if (updates.hidden !== undefined) {
      data.hidden = Boolean(updates.hidden);
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
    const existing = await prisma.model.findFirst({
      where: { OR: [{ legacyId }, { id: legacyId }] }
    });

    if (updates.supportsWarrantyQuestion !== undefined) {
      let vp: Record<string, any> = {};
      try {
        const rawVP = (data as any).variantPrices || existing?.variantPrices || '{}';
        vp = typeof rawVP === 'string' ? JSON.parse(rawVP) : { ...rawVP };
      } catch { vp = {}; }
      vp._supportsWarrantyQuestion = Boolean(updates.supportsWarrantyQuestion);
      (data as any).variantPrices = JSON.stringify(vp);
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'No valid model fields supplied.' });
      return;
    }

    if (!existing) {
      const brandId = inferBrandId(legacyId, updates.brandId as string);

      const brandExists = await prisma.brand.findUnique({ where: { id: brandId } });
      if (!brandExists) {
        await prisma.brand.create({
          data: { id: brandId, name: brandId.replace('brand-', '').toUpperCase(), logo: '/logo.svg' }
        });
      }

      const created = await prisma.model.create({
        data: {
          legacyId,
          brandId,
          name: (data.name as string) || (updates.name as string) || legacyId,
          category: (data.category as string) || (updates.category as string) || 'midrange',
          releaseYear: Number(data.releaseYear) || Number(updates.releaseYear) || new Date().getFullYear(),
          basePrice128GB: Number(data.basePrice128GB) || Number(updates.basePrice128GB) || 10000,
          series: (data.series as string) || (updates.series as string) || '',
          imageUrl: (data.imageUrl as string) || '',
          supportedStorageGb: data.supportedStorageGb ? String(data.supportedStorageGb) : '[128,256,512]',
          hidden: Boolean(data.hidden ?? updates.hidden ?? false),
          ...(({
            supportedRamGb: (data as any).supportedRamGb ? String((data as any).supportedRamGb) : '[0]',
            variantPrices: (data as any).variantPrices ? String((data as any).variantPrices) : '{}',
          }) as any),
        }
      });

      logAdminAudit({
        adminUserId: (req as AuthenticatedRequest).user?.sub,
        action: 'create_model',
        targetType: 'model',
        targetId: created.legacyId,
        payload: { name: created.name },
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      });

      const createdVP = (created as any).variantPrices ? JSON.parse((created as any).variantPrices) : {};
      res.json({
        ...created,
        id: created.legacyId,
        supportedStorageGb: created.supportedStorageGb ? JSON.parse(created.supportedStorageGb) : [128, 256, 512],
        supportedRamGb: (created as any).supportedRamGb ? JSON.parse((created as any).supportedRamGb) : [0],
        variantPrices: createdVP,
        supportsWarrantyQuestion: createdVP._supportsWarrantyQuestion !== undefined
          ? Boolean(createdVP._supportsWarrantyQuestion)
          : (created.releaseYear >= 2023),
      });
      return;
    }

    const model = await prisma.model.update({
      where: { id: existing.id },
      data,
    });

    logAdminAudit({
      adminUserId: (req as AuthenticatedRequest).user?.sub,
      action: 'update_model',
      targetType: 'model',
      targetId: model.legacyId,
      payload: { name: model.name, updatedFields: Object.keys(data) },
      ipAddress: String(req.ip ?? ''),
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    const updatedVP = (model as any).variantPrices ? JSON.parse((model as any).variantPrices) : {};
    res.json({
      ...model,
      id: model.legacyId,
      supportedStorageGb: model.supportedStorageGb ? JSON.parse(model.supportedStorageGb) : [128, 256, 512],
      supportedRamGb: (model as any).supportedRamGb ? JSON.parse((model as any).supportedRamGb) : [0],
      variantPrices: updatedVP,
      supportsWarrantyQuestion: updatedVP._supportsWarrantyQuestion !== undefined
        ? Boolean(updatedVP._supportsWarrantyQuestion)
        : (model.releaseYear >= 2023),
    });
  } catch (err) {
    console.error('PATCH /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to update model.' });
  }
});

// DELETE /api/models/:legacyId
router.delete('/:legacyId', adminAuth, requireRole(['SUPER_ADMIN', 'CATALOG_EDITOR']), async (req, res) => {
  try {
    const legacyId = String(req.params.legacyId);
    const existing = await prisma.model.findFirst({
      where: { OR: [{ legacyId }, { id: legacyId }] }
    });
    if (existing) {
      await prisma.model.delete({ where: { id: existing.id } });
      logAdminAudit({
        adminUserId: (req as AuthenticatedRequest).user?.sub,
        action: 'delete_model',
        targetType: 'model',
        targetId: existing.legacyId,
        payload: { name: existing.name },
        ipAddress: String(req.ip ?? ''),
        userAgent: String(req.headers['user-agent'] ?? ''),
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/models error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to delete model.' });
  }
});

export default router;
