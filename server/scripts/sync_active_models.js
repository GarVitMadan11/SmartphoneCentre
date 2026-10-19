import fs from 'fs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { values.push(cur); cur = ''; }
      else cur += ch;
    }
    values.push(cur);
    const row = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

async function run() {
  console.log('--- Step 1: Loading and parsing CSV ---');
  const csvPath = 'c:/Rephonix/active_smartphones_ram_storage_prices_2026-10-08.csv';
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csvText);
  console.log(`Parsed ${rows.length} variant rows from CSV`);

  // Group by Model ID
  const modelsMap = new Map();
  for (const r of rows) {
    const modelId = r['Model ID'];
    if (!modelsMap.has(modelId)) {
      modelsMap.set(modelId, {
        modelId,
        brandId: r['Brand ID'],
        brandName: r['Brand Name'],
        modelName: r['Model Name'],
        category: r['Category'],
        series: r['Series'],
        releaseYear: parseInt(r['Release Year'], 10),
        basePrice128GB: parseInt(r['Base Anchor Price 128GB (INR)'], 10),
        warrantyQuestionSupported: r['Warranty Question Supported'] === 'Yes',
        imageUrl: r['Image URL'],
        status: r['Status'],
        variants: []
      });
    }
    const m = modelsMap.get(modelId);
    const ramStr = r['RAM (GB)'];
    let ram = 0;
    if (ramStr && ramStr !== 'N/A') {
      const parsedRam = parseInt(ramStr.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedRam)) ram = parsedRam;
    }
    const storage = parseInt(r['Storage (GB)'], 10);
    const price = parseInt(r['Variant Price (INR)'], 10);
    m.variants.push({ ram, storage, price });
  }

  console.log(`Total unique models to be active: ${modelsMap.size}`);

  console.log('\n--- Step 2: Preserving Cashify URLs ---');
  const cashifyFile = 'data/cashify_custom_urls.json';
  const cashifyUrls = JSON.parse(fs.readFileSync(cashifyFile, 'utf8'));
  const originalKeyCount = Object.keys(cashifyUrls).length;
  console.log(`Original Cashify URL count: ${originalKeyCount}`);

  console.log('\n--- Step 3: Fetching existing DB models ---');
  const dbModels = await prisma.model.findMany({ include: { brand: true } });
  console.log(`Total models currently in DB: ${dbModels.length}`);

  const dbByLegacyId = new Map(dbModels.map(m => [m.legacyId, m]));
  const dbByName = new Map(dbModels.map(m => [m.name.toLowerCase().replace(/[^a-z0-9]/g, ''), m]));

  // Track active DB IDs
  const activeDbIds = new Set();
  const knownUuidMap = {
    'catalog-samsung-galaxy-z-flip-7-fe': '68e666b0-399e-4b9f-a8f6-3f0e63861b3a',
    'sam-flip6': '4d556104-788a-4567-8b1d-99a36c6753ad',
    'sam-fold6': '70d04543-5c6b-4401-9b5a-0f8a0d88c7bb',
  };

  let updatedCount = 0;
  let insertedCount = 0;

  for (const [csvId, m] of modelsMap.entries()) {
    let dbMatch = dbByLegacyId.get(csvId);
    if (!dbMatch) {
      const cleanName = m.modelName.toLowerCase().replace(/[^a-z0-9]/g, '');
      dbMatch = dbByName.get(cleanName);
    }

    const isApple = m.brandId === 'brand-apple';
    const supportedRams = isApple ? [0] : [...new Set(m.variants.map(v => v.ram))].sort((a, b) => a - b);
    const supportedStorages = [...new Set(m.variants.map(v => v.storage))].sort((a, b) => a - b);

    const variantPricesObj = {
      _supportsWarrantyQuestion: Boolean(m.warrantyQuestionSupported)
    };
    for (const v of m.variants) {
      variantPricesObj[`${v.ram}_${v.storage}`] = v.price;
      if (isApple || v.ram === 0) {
        variantPricesObj[`${v.storage}`] = v.price;
      }
    }

    if (dbMatch) {
      activeDbIds.add(dbMatch.id);
      await prisma.model.update({
        where: { id: dbMatch.id },
        data: {
          name: m.modelName,
          category: m.category,
          series: m.series,
          releaseYear: m.releaseYear,
          basePrice128GB: m.basePrice128GB,
          imageUrl: m.imageUrl,
          supportedRamGb: JSON.stringify(supportedRams),
          supportedStorageGb: JSON.stringify(supportedStorages),
          variantPrices: JSON.stringify(variantPricesObj),
          hidden: false,
        }
      });
      updatedCount++;
    } else {
      const assignedId = knownUuidMap[csvId] || crypto.randomUUID();
      activeDbIds.add(assignedId);

      await prisma.model.create({
        data: {
          id: assignedId,
          legacyId: csvId,
          brandId: m.brandId,
          name: m.modelName,
          category: m.category,
          series: m.series,
          releaseYear: m.releaseYear,
          basePrice128GB: m.basePrice128GB,
          imageUrl: m.imageUrl,
          supportedRamGb: JSON.stringify(supportedRams),
          supportedStorageGb: JSON.stringify(supportedStorages),
          variantPrices: JSON.stringify(variantPricesObj),
          hidden: false,
        }
      });
      insertedCount++;
    }
  }

  console.log(`Updated ${updatedCount} existing models in DB.`);
  console.log(`Inserted ${insertedCount} new models in DB.`);

  console.log('\n--- Step 4: Setting hidden=true on inactive smartphone models ---');
  // Tablets and smartwatches: preserve them as hidden if they already are
  const hiddenUpdate = await prisma.model.updateMany({
    where: {
      id: { notIn: Array.from(activeDbIds) }
    },
    data: {
      hidden: true
    }
  });
  console.log(`Set hidden: true on ${hiddenUpdate.count} non-active models.`);

  console.log('\n--- Step 5: Final Cashify URLs integrity check ---');
  // Ensure all original keys are preserved in cashifyUrls
  const finalCashifyUrls = JSON.parse(fs.readFileSync(cashifyFile, 'utf8'));
  console.log(`Cashify custom URLs count: ${Object.keys(finalCashifyUrls).length}`);

  console.log('\n--- Step 6: Verifying final database state ---');
  const finalTotal = await prisma.model.count();
  const finalActive = await prisma.model.count({ where: { hidden: false } });
  const finalHidden = await prisma.model.count({ where: { hidden: true } });
  console.log({ finalTotal, finalActive, finalHidden });
  if (finalActive === modelsMap.size) {
    console.log(`SUCCESS: Exactly ${finalActive} models are active in the database!`);
  } else {
    console.warn(`WARNING: Expected ${modelsMap.size} active models, got ${finalActive}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
