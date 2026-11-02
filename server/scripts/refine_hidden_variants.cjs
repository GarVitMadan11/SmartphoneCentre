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
  // Base anchor is at 8GB RAM / 128GB Storage (or closest base)
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

  // Base normalization
  const price = Math.round((basePrice128 * storageMult * (ramMult / 1.04)) / 10) * 10;
  return Math.max(price, 1500);
}

async function dryRun() {
  const activeCount = await prisma.model.count({ where: { hidden: false } });
  console.log(`Active models count before: ${activeCount}`);
  if (activeCount !== 193) {
    throw new Error(`Expected 193 active models, got ${activeCount}`);
  }

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

  console.log(`Found ${hiddenSmartphones.length} hidden smartphones.`);

  let matched = 0;
  let unreleasedKeysPruned = 0;

  for (const m of hiddenSmartphones) {
    const norm = m.name.toLowerCase().trim();
    const specs = modelSpecs[norm];
    if (!specs) {
      console.warn(`No specs for ${m.name}`);
      continue;
    }
    matched++;

    const existingPrices = JSON.parse(m.variantPrices || '{}');
    const existingKeys = Object.keys(existingPrices).filter(k => k.includes('_'));

    const authenticKeys = specs.map(s => `${s.ram}_${s.storage}`);
    const pruned = existingKeys.filter(k => !authenticKeys.includes(k));
    if (pruned.length > 0) {
      unreleasedKeysPruned += pruned.length;
    }
  }

  console.log(`Matched ${matched} models. Total unreleased cross-combination keys that will be eliminated: ${unreleasedKeysPruned}`);

  // Test sample models
  const samples = ['Motorola Edge 40 Neo', 'Motorola Moto G54', 'vivo V23 5G', 'POCO F5', 'OnePlus 10R', 'Galaxy A55 5G'];
  console.log('\n--- Sample Transformation Preview ---');
  for (const sName of samples) {
    const m = hiddenSmartphones.find(x => x.name.toLowerCase() === sName.toLowerCase());
    if (m) {
      const specs = modelSpecs[m.name.toLowerCase().trim()];
      const authenticKeys = specs.map(s => `${s.ram}_${s.storage}`);
      const newPrices = { _supportsWarrantyQuestion: m.releaseYear >= 2024 };
      for (const s of specs) {
        newPrices[`${s.ram}_${s.storage}`] = calculateVariantPrice(m.basePrice128GB, s.ram, s.storage);
      }
      const distinctRams = [...new Set(specs.map(s => s.ram))].sort((a, b) => a - b);
      const distinctStorages = [...new Set(specs.map(s => s.storage))].sort((a, b) => a - b);
      console.log(`\nModel: ${m.name}`);
      console.log(`  Old Keys: ${Object.keys(JSON.parse(m.variantPrices || '{}')).filter(k => k.includes('_')).join(', ')}`);
      console.log(`  New Keys: ${authenticKeys.join(', ')}`);
      console.log(`  RAM: ${JSON.stringify(distinctRams)} | Storage: ${JSON.stringify(distinctStorages)}`);
      console.log(`  New Prices: ${JSON.stringify(newPrices)}`);
    }
  }
}

dryRun()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

