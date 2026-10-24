import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../server/src/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabaseToFallback() {
  console.log('📦 Exporting live database state to fallback models...');

  const dbModels = await prisma.model.findMany({
    orderBy: [
      { releaseYear: 'desc' },
      { basePrice128GB: 'desc' },
      { name: 'asc' },
    ],
  });

  console.log(`Fetched ${dbModels.length} models from database.`);

  const models = dbModels.map((m) => {
    let storageArr: number[] = [128, 256, 512];
    let ramArr: number[] = [0];
    let variantPrices: Record<string, number> = {};

    try {
      storageArr = JSON.parse(m.supportedStorageGb);
    } catch {}
    try {
      ramArr = JSON.parse(m.supportedRamGb);
    } catch {}
    try {
      variantPrices = JSON.parse(m.variantPrices);
    } catch {}

    const supportsWarrantyQuestion =
      (variantPrices as any)?._supportsWarrantyQuestion !== undefined
        ? Boolean((variantPrices as any)._supportsWarrantyQuestion)
        : m.releaseYear >= 2023;

    return {
      id: m.legacyId,
      legacyId: m.legacyId,
      dbId: m.id,
      brandId: m.brandId,
      name: m.name,
      category: m.category,
      deviceType: (m.deviceType as any) || 'smartphones',
      releaseYear: m.releaseYear,
      basePrice128GB: m.basePrice128GB,
      series: m.series || '',
      imageUrl: m.imageUrl || undefined,
      supportedStorageGb: storageArr,
      supportedRamGb: ramArr,
      variantPrices,
      hidden: m.hidden,
      supportsWarrantyQuestion,
    };
  });

  const fallbackPath = path.resolve(__dirname, '../src/data/fallbackModels.json');
  fs.writeFileSync(fallbackPath, JSON.stringify(models, null, 2), 'utf8');
  console.log(`✓ Wrote ${models.length} models to ${fallbackPath}`);

  // Also update activeModelIds.json
  const activeIds = models.filter((m) => !m.hidden).map((m) => m.id);
  const activeIdsPath = path.resolve(__dirname, '../src/data/activeModelIds.json');
  fs.writeFileSync(activeIdsPath, JSON.stringify(activeIds, null, 2), 'utf8');
  console.log(`✓ Wrote ${activeIds.length} active model IDs to ${activeIdsPath}`);

  const smartphones = models.filter((m) => m.deviceType === 'smartphones');
  const tablets = models.filter((m) => m.deviceType === 'tablets');
  const watches = models.filter((m) => m.deviceType === 'smartwatches');

  console.log(`Summary:
  - Total Models: ${models.length}
  - Smartphones: ${smartphones.length}
  - Tablets: ${tablets.length}
  - Smartwatches: ${watches.length}
  - Active (visible): ${activeIds.length}
  - Hidden: ${models.length - activeIds.length}`);

  await prisma.$disconnect();
}

exportDatabaseToFallback().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
