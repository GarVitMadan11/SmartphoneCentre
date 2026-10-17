import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/brands
router.get('/', async (_req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { active: true },
    });
    res.json(brands.map(b => ({ id: b.id, name: b.name, logo: b.logo })));
  } catch (err) {
    console.error('GET /api/brands error:', err);
    res.status(500).json({ error: 'ServerError', message: 'Failed to fetch brands' });
  }
});

export default router;
