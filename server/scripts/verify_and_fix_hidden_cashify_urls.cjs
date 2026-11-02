const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function sanitizeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getCandidateSlugs(brandName, modelName, ram, storage) {
  const brandLower = brandName.toLowerCase().trim();
  let modelLower = modelName.toLowerCase().trim();

  // Strip brand prefix if present
  if (modelLower.startsWith(brandLower)) {
    modelLower = modelLower.slice(brandLower.length).trim();
  }

  const sLabel = storage >= 1024 ? `${storage / 1024}-tb` : `${storage}-gb`;
  const varSuffix = `${ram}-gb-${sLabel}`;

  const candidates = [];

  // 1. Motorola
  if (brandLower === 'motorola') {
    let clean = modelLower;
    if (clean.startsWith('moto')) {
      clean = clean.slice(4).trim();
    }
    const cleanSlug = sanitizeSlug(clean);

    candidates.push(`used-motorola-moto-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-motorola-moto-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-motorola-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-motorola-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-motorola-moto-${cleanSlug}`);
    candidates.push(`used-motorola-moto-${cleanSlug}-5g`);
    return [...new Set(candidates)];
  }

  // 2. Xiaomi / POCO / Redmi
  if (brandLower === 'xiaomi') {
    let clean = modelLower;
    if (clean.startsWith('poco')) {
      const cleanSlug = sanitizeSlug(clean);
      candidates.push(`used-${cleanSlug}-5g-${varSuffix}`);
      candidates.push(`used-${cleanSlug}-${varSuffix}`);
      candidates.push(`used-xiaomi-${cleanSlug}-5g-${varSuffix}`);
      candidates.push(`used-xiaomi-${cleanSlug}-${varSuffix}`);
      candidates.push(`used-${cleanSlug}`);
      candidates.push(`used-${cleanSlug}-5g`);
      return [...new Set(candidates)];
    }
    if (clean.startsWith('redmi')) {
      const cleanSlug = sanitizeSlug(clean);
      candidates.push(`used-${cleanSlug}-${varSuffix}`);
      candidates.push(`used-${cleanSlug}-5g-${varSuffix}`);
      candidates.push(`used-xiaomi-${cleanSlug}-${varSuffix}`);
      candidates.push(`used-xiaomi-${cleanSlug}-5g-${varSuffix}`);
      candidates.push(`used-${cleanSlug}`);
      candidates.push(`used-${cleanSlug}-5g`);
      return [...new Set(candidates)];
    }
    const cleanSlug = sanitizeSlug(clean);
    candidates.push(`used-xiaomi-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-xiaomi-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-mi-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-xiaomi-${cleanSlug}`);
    return [...new Set(candidates)];
  }

  // 3. OnePlus
  if (brandLower === 'oneplus') {
    const cleanSlug = sanitizeSlug(modelLower);
    candidates.push(`used-oneplus-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-oneplus-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-oneplus-${cleanSlug}`);
    candidates.push(`used-oneplus-${cleanSlug}-5g`);
    return [...new Set(candidates)];
  }

  // 4. Samsung
  if (brandLower === 'samsung') {
    let clean = modelLower;
    if (clean.startsWith('samsung')) {
      clean = clean.slice(7).trim();
    }
    const cleanSlug = sanitizeSlug(clean);
    candidates.push(`used-samsung-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-samsung-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-samsung-${cleanSlug}`);
    candidates.push(`used-samsung-${cleanSlug}-5g`);
    return [...new Set(candidates)];
  }

  // 5. OPPO
  if (brandLower === 'oppo') {
    let clean = modelLower;
    // Normalize Reno naming (e.g. reno 10 -> reno10)
    clean = clean.replace(/reno\s*(\d+)/i, 'reno$1');
    const cleanSlug = sanitizeSlug(clean);
    candidates.push(`used-oppo-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-oppo-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-oppo-${cleanSlug}`);
    candidates.push(`used-oppo-${cleanSlug}-5g`);
    return [...new Set(candidates)];
  }

  // 6. vivo
  if (brandLower === 'vivo') {
    const cleanSlug = sanitizeSlug(modelLower);
    candidates.push(`used-vivo-${cleanSlug}-${varSuffix}`);
    candidates.push(`used-vivo-${cleanSlug}-5g-${varSuffix}`);
    candidates.push(`used-vivo-${cleanSlug}`);
    candidates.push(`used-vivo-${cleanSlug}-5g`);
    return [...new Set(candidates)];
  }

  // Default fallback
  const cleanSlug = sanitizeSlug(modelLower);
  candidates.push(`used-${brandLower}-${cleanSlug}-${varSuffix}`);
  candidates.push(`used-${brandLower}-${cleanSlug}`);
  return [...new Set(candidates)];
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (res.status === 404) return { ok: false, status: 404, reason: '404 HTTP' };
    const html = await res.text();
    if (html.includes('Page Not Found') || html.includes('404 Error')) {
      return { ok: false, status: 404, reason: '404 Page Content' };
    }
    if (html.includes('not buying at this location') || html.includes('we are not buying')) {
      return { ok: false, status: 200, reason: 'Not Buying' };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, reason: err.message };
  }
}

async function verifyAndFixHiddenCashifyUrls() {
  console.log('--- Step 1: Pre-flight Active Model Guard Check ---');
  const activeCount = await prisma.model.count({ where: { hidden: false } });
  console.log(`Active models count: ${activeCount}`);
  if (activeCount !== 193) {
    throw new Error(`CRITICAL GUARD: Expected 193 active models, found ${activeCount}! Aborting.`);
  }

  const hidden5GSmartphones = await prisma.model.findMany({
    where: {
      hidden: true,
      deviceType: 'smartphones',
      brand: { name: { not: 'Apple' } },
      NOT: [
        { name: { contains: 'Tab', mode: 'insensitive' } },
        { name: { contains: 'Watch', mode: 'insensitive' } }
      ]
    },
    include: { brand: true },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }]
  });

  console.log(`Hidden 5G smartphones to audit: ${hidden5GSmartphones.length}`);

  const serverCashifyFile = path.join(__dirname, '../data/cashify_custom_urls.json');
  const srcCashifyFile = path.join(__dirname, '../../src/data/cashifyCustomUrls.json');
  const customUrls = JSON.parse(fs.readFileSync(serverCashifyFile, 'utf8'));

  // Collect all unique variant tasks
  const tasks = [];
  for (const m of hidden5GSmartphones) {
    let prices = {};
    try { prices = JSON.parse(m.variantPrices || '{}'); } catch {}
    const keys = Object.keys(prices).filter(k => k.includes('_'));

    for (const key of keys) {
      const [ram, storage] = key.split('_').map(Number);
      const currentUrl = customUrls[`${m.id}_${ram}_${storage}`] || customUrls[m.id] || '';
      tasks.push({
        modelId: m.id,
        legacyId: m.legacyId,
        modelName: m.name,
        brandName: m.brand.name,
        ram,
        storage,
        currentUrl
      });
    }
  }

  console.log(`Total variant URLs to verify: ${tasks.length}`);

  let verifiedValid = 0;
  let fixedWithCandidate = 0;
  let fallbackCount = 0;

  // Process concurrently with a pool of 10 workers
  const CONCURRENCY = 10;
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const taskIndex = cursor++;
      const task = tasks[taskIndex];
      const { modelId, legacyId, modelName, brandName, ram, storage, currentUrl } = task;

      // Check current URL first
      let valid = false;
      let matchedUrl = currentUrl;

      if (currentUrl) {
        const check = await checkUrl(currentUrl);
        if (check.ok) {
          valid = true;
          verifiedValid++;
        }
      }

      if (!valid) {
        // Find best candidate
        const candidates = getCandidateSlugs(brandName, modelName, ram, storage);
        let foundCandidate = null;

        for (const slug of candidates) {
          const testUrl = `https://www.cashify.in/sell-old-mobile-phone/${slug}`;
          const check = await checkUrl(testUrl);
          if (check.ok) {
            foundCandidate = testUrl;
            break;
          }
        }

        if (foundCandidate) {
          matchedUrl = foundCandidate;
          fixedWithCandidate++;
        } else {
          // If no specific variant exists on Cashify (e.g. unreleased/future concepts like vivo T5 Pro),
          // fallback to brand or model search page
          matchedUrl = `https://www.cashify.in/sell-old-mobile-phone/used-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${sanitizeSlug(modelName)}`;
          fallbackCount++;
        }
      }

      // Update in customUrls dictionary
      customUrls[`${modelId}_${ram}_${storage}`] = matchedUrl;
      customUrls[`${legacyId}_${ram}_${storage}`] = matchedUrl;
      customUrls[`${modelName}_${ram}_${storage}`] = matchedUrl;
      if (!customUrls[modelId]) customUrls[modelId] = matchedUrl;
      if (!customUrls[legacyId]) customUrls[legacyId] = matchedUrl;
      if (!customUrls[modelName]) customUrls[modelName] = matchedUrl;

      if (taskIndex % 50 === 0 || taskIndex === tasks.length - 1) {
        console.log(`Progress: ${taskIndex + 1}/${tasks.length} | Valid: ${verifiedValid} | Fixed: ${fixedWithCandidate} | Fallback: ${fallbackCount}`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log('\n--- Step 2: Saving Verified Custom URLs ---');
  fs.writeFileSync(serverCashifyFile, JSON.stringify(customUrls, null, 2));
  fs.writeFileSync(srcCashifyFile, JSON.stringify(customUrls, null, 2));
  console.log(`Saved ${Object.keys(customUrls).length} URLs in custom URL stores.`);

  console.log('\n--- Step 3: Updating CSV with Verified URLs ---');
  const exportScript = path.join(__dirname, 'export_hidden_variants_csv.cjs');
  require(exportScript);

  console.log('\n--- Step 4: Post-Verification Guard Check ---');
  const activePost = await prisma.model.count({ where: { hidden: false } });
  console.log(`Active models count after: ${activePost}`);
  if (activePost !== 193) {
    throw new Error(`CRITICAL GUARD: Active models changed from 193 to ${activePost}!`);
  }
  console.log('SUCCESS: Active models strictly intact (193 models).');
}

verifyAndFixHiddenCashifyUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
