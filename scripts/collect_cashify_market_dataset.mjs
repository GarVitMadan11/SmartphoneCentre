import fs from 'fs';

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

async function getModelVariantsAndPrices(slug) {
  const url = `https://www.cashify.in${slug}`;
  const html = await fetchHtml(url);
  if (!html) return [];

  // Find all variant links on this page
  const variantLinks = [...new Set([...html.matchAll(/href="(\/sell-old-mobile-phone\/used-[^"]+-[0-9]+-gb-[0-9]+-[gt]b|\/sell-old-mobile-phone\/used-[^"]+-[0-9]+-gb|\/sell-old-mobile-phone\/used-[^"]+-[0-9]+-tb)"/g)].map(m => m[1]))];

  const results = [];
  // If no variant links found, check if this page itself has a price
  if (variantLinks.length === 0) {
    const prices = [...html.matchAll(/₹\s*([0-9,]+)/g)].map(m => parseInt(m[1].replace(/,/g, ''), 10));
    const valid = prices.filter(p => p > 500 && p < 250000);
    if (valid.length > 0) {
      results.push({
        url,
        slug,
        basePrice: Math.max(...valid)
      });
    }
  } else {
    // Check up to 3 variants per model to keep speed high and cover storage tiers
    for (const vLink of variantLinks.slice(0, 4)) {
      const vHtml = await fetchHtml(`https://www.cashify.in${vLink}`);
      if (!vHtml) continue;
      const prices = [...vHtml.matchAll(/₹\s*([0-9,]+)/g)].map(m => parseInt(m[1].replace(/,/g, ''), 10));
      const valid = prices.filter(p => p > 500 && p < 250000);
      if (valid.length > 0) {
        results.push({
          url: `https://www.cashify.in${vLink}`,
          slug: vLink,
          basePrice: Math.max(...valid)
        });
      }
    }
  }
  return results;
}

async function main() {
  console.log('Starting Cashify Market Data Collection (Target: 100-200 instances)...');

  // Discover slugs from key brands
  const brandUrls = [
    'https://www.cashify.in/sell-old-mobile-phone/sell-apple',
    'https://www.cashify.in/sell-old-mobile-phone/sell-samsung',
    'https://www.cashify.in/sell-old-mobile-phone/sell-oneplus',
    'https://www.cashify.in/sell-old-mobile-phone/sell-google',
    'https://www.cashify.in/sell-old-mobile-phone/sell-xiaomi'
  ];

  let rawModelSlugs = [];
  for (const b of brandUrls) {
    const html = await fetchHtml(b);
    if (html) {
      const matches = [...html.matchAll(/href="(\/sell-old-mobile-phone\/used-[^"]+)"/g)].map(m => m[1]);
      rawModelSlugs.push(...matches);
    }
  }
  rawModelSlugs = [...new Set(rawModelSlugs)];
  console.log(`Found ${rawModelSlugs.length} unique model paths.`);

  // Prioritize modern and high-volume models (iPhone 11-16, Galaxy S20-S24, OnePlus 9-12, Pixel 6-9)
  const prioritized = rawModelSlugs.filter(s => 
    s.includes('iphone-1') || 
    s.includes('s2') || 
    s.includes('note') || 
    s.includes('fold') || 
    s.includes('flip') || 
    s.includes('oneplus') || 
    s.includes('pixel') || 
    s.includes('pro')
  ).slice(0, 60);

  // Add more from the rest to ensure broad coverage
  const remaining = rawModelSlugs.filter(s => !prioritized.includes(s)).slice(0, 40);
  const targets = [...prioritized, ...remaining];

  console.log(`Scanning ${targets.length} target models for variant instances...`);
  const dataset = [];

  for (let i = 0; i < targets.length; i++) {
    const slug = targets[i];
    const items = await getModelVariantsAndPrices(slug);
    for (const item of items) {
      // Parse brand, model name, RAM, Storage
      const cleanSlug = item.slug.replace('/sell-old-mobile-phone/used-', '');
      let brand = 'other';
      if (cleanSlug.includes('apple') || cleanSlug.includes('iphone')) brand = 'apple';
      else if (cleanSlug.includes('samsung') || cleanSlug.includes('galaxy')) brand = 'samsung';
      else if (cleanSlug.includes('oneplus')) brand = 'oneplus';
      else if (cleanSlug.includes('google') || cleanSlug.includes('pixel')) brand = 'google';
      else if (cleanSlug.includes('xiaomi') || cleanSlug.includes('redmi') || cleanSlug.includes('poco')) brand = 'xiaomi';

      // Parse storage if in slug
      const storageMatch = cleanSlug.match(/([0-9]+)-(gb|tb)/i);
      const storage = storageMatch ? `${storageMatch[1]}${storageMatch[2].toUpperCase()}` : 'Unknown';

      dataset.push({
        slug: item.slug,
        modelSlug: cleanSlug,
        brand,
        storage,
        cashifyBasePrice: item.basePrice,
        rephonixOffer3Pct: Math.round(item.basePrice * 1.03 / 50) * 50
      });
      console.log(`[${dataset.length}] ${cleanSlug} => Cashify: ₹${item.basePrice} | Rephonix (+3%): ₹${Math.round(item.basePrice * 1.03 / 50) * 50}`);
    }
    if (dataset.length >= 150) {
      console.log(`Reached target count (${dataset.length} instances)!`);
      break;
    }
  }

  fs.writeFileSync('scripts/cashify_market_dataset.json', JSON.stringify(dataset, null, 2));
  console.log(`Dataset successfully saved to scripts/cashify_market_dataset.json with ${dataset.length} items!`);
}

main();
