const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { modelSpecs } = require('./build_authentic_variants.cjs');

function sanitizeSlug(name) {
  return name.toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-');
}

function calculateVariantPrice(basePrice128, ram, storage) {
  let storageMult = 1.0;
  if (storage === 32) storageMult = 0.82;
  else if (storage === 64) storageMult = 0.90;
  else if (storage === 128) storageMult = 1.00;
  else if (storage === 256) storageMult = 1.10;
  else if (storage === 512) storageMult = 1.25;
  else if (storage === 1024) storageMult = 1.45;

  let ramMult = 1.0;
  if (ram <= 3) ramMult = 0.94;
  else if (ram === 4) ramMult = 0.97;
  else if (ram === 6) ramMult = 1.00;
  else if (ram === 8) ramMult = 1.04;
  else if (ram === 12) ramMult = 1.09;
  else if (ram === 16) ramMult = 1.15;

  const price = Math.round((basePrice128 * storageMult * (ramMult / 1.04)) / 10) * 10;
  return Math.max(price, 1500);
}

async function run() {
  console.log('--- Step 1: Pre-flight Active Model Guard Check ---');
  const activeModels = await prisma.model.findMany({ where: { hidden: false } });
  console.log(`Active models count: ${activeModels.length}`);
  if (activeModels.length !== 193) {
    throw new Error(`CRITICAL: Expected 193 active models, but found ${activeModels.length}! Aborting.`);
  }
  const activeModelIds = new Set(activeModels.map(m => m.id));

  console.log('\n--- Step 2: Handle Duplicate Hidden Models ---');
  const duplicate = await prisma.model.findFirst({
    where: { name: 'Motorola Moto G62 (India)', hidden: true }
  });
  if (duplicate) {
    await prisma.model.delete({ where: { id: duplicate.id } });
    console.log(`Deleted duplicate hidden model: Motorola Moto G62 (India) [${duplicate.id}]`);
  }

  console.log('\n--- Step 3: Fetching Hidden Smartphone Models ---');
  const hiddenSmartphones = await prisma.model.findMany({
    where: {
      hidden: true,
      deviceType: 'smartphones',
      brand: { name: { not: 'Apple' } },
      NOT: [
        { name: { contains: 'Tab', mode: 'insensitive' } },
        { name: { contains: 'Watch', mode: 'insensitive' } }
      ]
    },
    include: { brand: true }
  });
  console.log(`Hidden smartphones to refine: ${hiddenSmartphones.length}`);

  // Load existing cashify custom urls
  const serverCashifyFile = 'server/data/cashify_custom_urls.json';
  const srcCashifyFile = 'src/data/cashifyCustomUrls.json';
  const cashifyCustom = JSON.parse(fs.readFileSync(serverCashifyFile, 'utf8'));

  let updatedCount = 0;
  let prunedVariantsTotal = 0;

  for (const m of hiddenSmartphones) {
    // Extra safety guard: never touch active model
    if (activeModelIds.has(m.id)) {
      throw new Error(`CRITICAL VIOLATION: Encountered active model ID ${m.id} in hidden loop!`);
    }

    const norm = m.name.toLowerCase().trim();
    const specs = modelSpecs[norm];
    if (!specs) {
      console.warn(`WARNING: Missing specs for ${m.name}`);
      continue;
    }

    const existingPrices = JSON.parse(m.variantPrices || '{}');
    const existingKeys = Object.keys(existingPrices).filter(k => k.includes('_'));
    const authenticKeys = specs.map(s => `${s.ram}_${s.storage}`);
    const pruned = existingKeys.filter(k => !authenticKeys.includes(k));
    prunedVariantsTotal += pruned.length;

    const newVariantPrices = {
      _supportsWarrantyQuestion: m.releaseYear >= 2024
    };

    const brandSlug = m.brand.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const modelSlug = sanitizeSlug(m.name);

    // Set base URL fallback
    const baseCashifyUrl = `https://www.cashify.in/sell-old-mobile-phone/used-${brandSlug}-${modelSlug}`;
    if (!cashifyCustom[m.id]) cashifyCustom[m.id] = baseCashifyUrl;
    if (!cashifyCustom[m.legacyId]) cashifyCustom[m.legacyId] = baseCashifyUrl;
    if (!cashifyCustom[m.name]) cashifyCustom[m.name] = baseCashifyUrl;

    for (const s of specs) {
      const vKey = `${s.ram}_${s.storage}`;
      const vPrice = calculateVariantPrice(m.basePrice128GB, s.ram, s.storage);
      newVariantPrices[vKey] = vPrice;

      // Construct authentic Cashify URL
      const storageStr = s.storage === 1024 ? '1-tb' : `${s.storage}-gb`;
      const variantUrl = `https://www.cashify.in/sell-old-mobile-phone/used-${brandSlug}-${modelSlug}-${s.ram}-gb-${storageStr}`;

      cashifyCustom[`${m.id}_${s.ram}_${s.storage}`] = variantUrl;
      cashifyCustom[`${m.legacyId}_${s.ram}_${s.storage}`] = variantUrl;
      cashifyCustom[`${m.name}_${s.ram}_${s.storage}`] = variantUrl;
    }

    const distinctRams = [...new Set(specs.map(s => s.ram))].sort((a, b) => a - b);
    const distinctStorages = [...new Set(specs.map(s => s.storage))].sort((a, b) => a - b);

    await prisma.model.update({
      where: { id: m.id },
      data: {
        supportedRamGb: JSON.stringify(distinctRams),
        supportedStorageGb: JSON.stringify(distinctStorages),
        variantPrices: JSON.stringify(newVariantPrices),
        hidden: true // STRICTLY REMAIN HIDDEN
      }
    });

    updatedCount++;
  }

  console.log(`\nRefined ${updatedCount} hidden smartphone models.`);
  console.log(`Eliminated ${prunedVariantsTotal} fictitious cross-variant combinations.`);

  console.log('\n--- Step 4: Saving Synchronized Cashify URLs ---');
  fs.writeFileSync(serverCashifyFile, JSON.stringify(cashifyCustom, null, 2));
  fs.writeFileSync(srcCashifyFile, JSON.stringify(cashifyCustom, null, 2));
  console.log(`Saved ${Object.keys(cashifyCustom).length} Cashify URL overrides.`);

  console.log('\n--- Step 5: Post-Execution Verification ---');
  const postActiveCount = await prisma.model.count({ where: { hidden: false } });
  const postHiddenCount = await prisma.model.count({ where: { hidden: true } });
  const totalCount = await prisma.model.count();
  console.log({ totalCount, postActiveCount, postHiddenCount });

  if (postActiveCount !== 193) {
    throw new Error(`CRITICAL: Active models changed from 193 to ${postActiveCount}!`);
  }
  console.log('SUCCESS: Active models count is strictly 193 (100% untouched).');

  // Verify key samples
  const testModels = ['Motorola Edge 40 Neo', 'Motorola Moto G54', 'vivo V23 5G', 'POCO F5', 'OnePlus 10R'];
  for (const name of testModels) {
    const verified = await prisma.model.findFirst({
      where: { name },
      select: { name: true, hidden: true, supportedRamGb: true, supportedStorageGb: true, variantPrices: true }
    });
    console.log(`\nVerification [${name}]:`);
    console.log(`  Hidden: ${verified.hidden}`);
    console.log(`  RAM: ${verified.supportedRamGb}`);
    console.log(`  Storage: ${verified.supportedStorageGb}`);
    console.log(`  Variants: ${Object.keys(JSON.parse(verified.variantPrices)).filter(k => k.includes('_')).join(', ')}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
