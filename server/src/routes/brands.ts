import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// In-memory brands cache (5-minute TTL)
let cachedBrands: Array<{ id: string; name: string; logo: string }> | null = null;
let lastBrandsFetch = 0;
const BRANDS_TTL_MS = 5 * 60 * 1000;

export function invalidateBrandsCache(): void {
  cachedBrands = null;
  lastBrandsFetch = 0;
}

// GET /api/brands
router.get('/', async (_req, res) => {
  try {
    if (cachedBrands && (Date.now() - lastBrandsFetch < BRANDS_TTL_MS)) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cachedBrands);
      return;
    }

    const brands = await prisma.brand.findMany({
      where: { active: true },
    });
    cachedBrands = brands.map(b => ({ id: b.id, name: b.name, logo: b.logo }));
    lastBrandsFetch = Date.now();
    res.setHeader('X-Cache', 'MISS');
    res.json(cachedBrands);
  } catch (err) {
    console.error('GET /api/brands error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch brands' });
  }
});

export default router;
