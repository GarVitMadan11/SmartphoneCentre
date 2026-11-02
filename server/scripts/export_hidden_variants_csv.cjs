const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

async function generateCSV() {
  const hiddenModels = await prisma.model.findMany({
    where: { hidden: true },
    include: { brand: true },
    orderBy: [
      { brand: { name: 'asc' } },
      { name: 'asc' }
    ]
  });

  console.log('Total hidden models fetched:', hiddenModels.length);

  const cashifyFile = path.join(__dirname, '../data/cashify_custom_urls.json');
  const cashifyUrls = fs.existsSync(cashifyFile) ? JSON.parse(fs.readFileSync(cashifyFile, 'utf8')) : {};

  const rows = [];
  rows.push([
    'Model ID',
    'Legacy ID',
    'Brand Name',
    'Model Name',
    'Device Type',
    'Category',
    'Series',
    'Release Year',
    'RAM (GB)',
    'Storage (GB)',
    'Formatted Variant',
    'Variant Price (INR)',
    'Base Anchor Price 128GB (INR)',
    'Cashify URL'
  ]);

  for (const m of hiddenModels) {
    let prices = {};
    try {
      prices = JSON.parse(m.variantPrices || '{}');
    } catch {}

    const variantKeys = Object.keys(prices).filter(k => !k.startsWith('_'));

    if (variantKeys.length === 0) {
      let rams = [0];
      let storages = [128];
      try { rams = JSON.parse(m.supportedRamGb || '[0]'); } catch {}
      try { storages = JSON.parse(m.supportedStorageGb || '[128]'); } catch {}

      for (const r of rams) {
        for (const s of storages) {
          const ramLabel = r === 0 ? 'N/A' : `${r} GB`;
          const storageLabel = s >= 1024 ? `${s / 1024} TB` : `${s} GB`;
          const formatted = r === 0 ? storageLabel : `${ramLabel} / ${storageLabel}`;
          const cUrl = cashifyUrls[`${m.id}_${r}_${s}`] || cashifyUrls[m.id] || '';
          rows.push([
            m.id,
            m.legacyId,
            m.brand.name,
            m.name,
            m.deviceType,
            m.category,
            m.series || '',
            m.releaseYear,
            ramLabel,
            s,
            formatted,
            m.basePrice128GB,
            m.basePrice128GB,
            cUrl
          ]);
        }
      }
      continue;
    }

    variantKeys.sort((a, b) => {
      const [rA, sA] = a.includes('_') ? a.split('_').map(Number) : [0, Number(a)];
      const [rB, sB] = b.includes('_') ? b.split('_').map(Number) : [0, Number(b)];
      if (rA !== rB) return rA - rB;
      return sA - sB;
    });

    for (const key of variantKeys) {
      let r = 0;
      let s = 128;
      if (key.includes('_')) {
        const parts = key.split('_').map(Number);
        r = parts[0];
        s = parts[1];
      } else {
        s = Number(key);
      }

      const price = prices[key] || m.basePrice128GB;
      const ramLabel = (r === 0 || m.brand.name === 'Apple') ? 'N/A' : `${r} GB`;
      const storageLabel = s >= 1024 ? `${s / 1024} TB` : `${s} GB`;
      const formatted = (r === 0 || m.brand.name === 'Apple') ? storageLabel : `${ramLabel} / ${storageLabel}`;
      const cUrl = cashifyUrls[`${m.id}_${r}_${s}`] || cashifyUrls[`${m.legacyId}_${r}_${s}`] || cashifyUrls[`${m.name}_${r}_${s}`] || cashifyUrls[m.id] || '';

      rows.push([
        m.id,
        m.legacyId,
        m.brand.name,
        m.name,
        m.deviceType,
        m.category,
        m.series || '',
        m.releaseYear,
        ramLabel,
        s,
        formatted,
        price,
        m.basePrice128GB,
        cUrl
      ]);
    }
  }

  function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\r\n');
  const outputPath = 'c:/Rephonix/hidden_smartphones_authentic_variants.csv';
  fs.writeFileSync(outputPath, csvContent, 'utf8');
  console.log(`Successfully generated CSV with ${rows.length - 1} variant rows at ${outputPath}`);
}

generateCSV()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
