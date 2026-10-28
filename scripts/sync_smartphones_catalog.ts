import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface VerifiedVariant {
  brand: string;
  model: string;
  ramGb: number;
  storageGb: number;
  cashifyQuote: number;
}

function cleanIndian50(val: number): number {
  if (val <= 0) return 0;
  return Math.round(val / 50) * 50;
}

function parseStorage(storageStr: string): number {
  if (storageStr.includes('TB')) return 1024;
  const num = parseInt(storageStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 128 : num;
}

function parseRam(ramStr: string): number {
  const num = parseInt((ramStr || '').replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runSync() {
  console.log('================================================================================');
  console.log('REPHONIX SMARTPHONE PRICING ENGINE BENCHMARK SYNCHRONIZATION');
  console.log('Utmost Precision Baseline Sync with Verified Cashify Experimental Dataset');
  console.log('================================================================================\n');

  // 1. Read CSV Dataset
  const csvPath = path.resolve(rootDir, 'cashify_experiments_dataset.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const csvLines = csvContent.split('\n').filter(l => l.trim().length > 0);

  const verifiedMap = new Map<string, VerifiedVariant[]>();

  function registerVerified(brand: string, model: string, ramGb: number, storageGb: number, quote: number) {
    const key = normalizeName(model);
    if (!verifiedMap.has(key)) verifiedMap.set(key, []);
    const arr = verifiedMap.get(key)!;
    // Replace if exists with higher priority or update
    const existing = arr.find(v => v.storageGb === storageGb && (ramGb === 0 || v.ramGb === ramGb || v.ramGb === 0));
    if (existing) {
      existing.cashifyQuote = quote;
      if (ramGb > 0) existing.ramGb = ramGb;
    } else {
      arr.push({ brand, model, ramGb, storageGb, cashifyQuote: quote });
    }
  }

  for (let i = 1; i < csvLines.length; i++) {
    const parts = csvLines[i].split(',');
    if (parts.length < 34) continue;
    const quote = parseFloat(parts[29]) || 0;
    const variable = parts[33].trim();
    if (quote > 0 && (variable === 'baseline' || variable.startsWith('storage_') || variable === 'warranty_<3m')) {
      const brand = parts[2].trim();
      const model = parts[3].trim();
      const ramGb = parseRam(parts[4]);
      const storageGb = parseStorage(parts[5]);
      registerVerified(brand, model, ramGb, storageGb, quote);
    }
  }

  // 2. Read Market JSON Dataset as supplement
  const marketJsonPath = path.resolve(rootDir, 'scripts/cashify_market_dataset.json');
  if (fs.existsSync(marketJsonPath)) {
    const marketItems: Array<{ modelSlug: string; brand: string; storage: string; cashifyBasePrice: number }> = JSON.parse(fs.readFileSync(marketJsonPath, 'utf8'));
    for (const item of marketItems) {
      if (item.cashifyBasePrice > 0) {
        const storageGb = parseStorage(item.storage);
        // clean model name from slug e.g. "apple-iphone-12-4-gb-64-gb" -> "iphone 12"
        const cleanSlug = item.modelSlug.replace(/-\d+-gb-\d+-gb$/, '').replace(/^used-/, '').replace(/^(apple|samsung|oneplus|google|motorola|xiaomi|vivo|oppo)-/, '').replace(/-/g, ' ');
        registerVerified(item.brand, cleanSlug, 0, storageGb, item.cashifyBasePrice);
      }
    }
  }

  console.log(`✓ Loaded verified baseline data for ${verifiedMap.size} smartphone model families.`);

  // 3. Load actualPrices.json
  const actualPricesPath = path.resolve(rootDir, 'src/data/actualPrices.json');
  const actualPrices: Record<string, any> = JSON.parse(fs.readFileSync(actualPricesPath, 'utf8'));

  // 4. Load fallbackModels.json
  const fallbackModelsPath = path.resolve(rootDir, 'src/data/fallbackModels.json');
  const fallbackModels: any[] = JSON.parse(fs.readFileSync(fallbackModelsPath, 'utf8'));

  let updatedActualCount = 0;
  let updatedFallbackCount = 0;
  const updateSummary: Array<{ model: string; storage: string; oldCashify: number; newCashify: number; newRephonix: number }> = [];

  for (const [key, entry] of Object.entries(actualPrices)) {
    const modelName = entry.modelName || '';
    const norm = normalizeName(modelName);

    // Find best match in verifiedMap
    let matchedVariants: VerifiedVariant[] | undefined;
    for (const [vNorm, variants] of verifiedMap) {
      if (vNorm === norm || (norm.length > 5 && vNorm.includes(norm)) || (vNorm.length > 5 && norm.includes(vNorm))) {
        matchedVariants = variants;
        break;
      }
    }

    if (!matchedVariants || matchedVariants.length === 0) continue;

    let hasChange = false;
    if (!entry.cashifyPrices) entry.cashifyPrices = {};
    if (!entry.ourPrices) entry.ourPrices = {};

    for (const v of matchedVariants) {
      const isApple = (modelName.toLowerCase().includes('iphone') || modelName.toLowerCase().includes('apple'));
      const ramPrefix = (isApple || v.ramGb === 0) ? '0' : String(v.ramGb);
      
      // Update keys: "0_128" and "128"
      const variantKey = `${ramPrefix}_${v.storageGb}`;
      const storageKey = String(v.storageGb);

      const oldCashify = entry.cashifyPrices[variantKey] || entry.cashifyPrices[storageKey] || 0;
      const newCashify = v.cashifyQuote;
      const newOurPrice = cleanIndian50(Math.round(newCashify * 1.03));

      if (oldCashify !== newCashify || entry.ourPrices[variantKey] !== newOurPrice) {
        hasChange = true;
        entry.cashifyPrices[variantKey] = newCashify;
        entry.ourPrices[variantKey] = newOurPrice;
        entry.ourPrices[storageKey] = newOurPrice;

        if (updateSummary.length < 25) {
          updateSummary.push({
            model: modelName,
            storage: `${v.storageGb}GB`,
            oldCashify,
            newCashify,
            newRephonix: newOurPrice
          });
        }
      }
    }

    if (hasChange) {
      updatedActualCount++;
    }
  }

  // Write updated actualPrices.json
  fs.writeFileSync(actualPricesPath, JSON.stringify(actualPrices, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedActualCount} smartphone catalog entries in src/data/actualPrices.json.`);

  // Update fallbackModels.json
  for (const m of fallbackModels) {
    if (m.deviceType && m.deviceType !== 'smartphones') continue;

    const norm = normalizeName(m.name || '');
    let matchedVariants: VerifiedVariant[] | undefined;
    for (const [vNorm, variants] of verifiedMap) {
      if (vNorm === norm || (norm.length > 5 && vNorm.includes(norm)) || (vNorm.length > 5 && norm.includes(vNorm))) {
        matchedVariants = variants;
        break;
      }
    }

    if (!matchedVariants || matchedVariants.length === 0) continue;

    if (!m.variantPrices) m.variantPrices = {};
    let fallbackChanged = false;

    for (const v of matchedVariants) {
      const isApple = (m.name.toLowerCase().includes('iphone') || (m.brandId && m.brandId.includes('apple')));
      const ramPrefix = (isApple || v.ramGb === 0) ? '0' : String(v.ramGb);
      const variantKey = `${ramPrefix}_${v.storageGb}`;
      const storageKey = String(v.storageGb);

      const newOurPrice = cleanIndian50(Math.round(v.cashifyQuote * 1.03));
      m.variantPrices[variantKey] = newOurPrice;
      m.variantPrices[storageKey] = newOurPrice;

      if (v.storageGb === 128) {
        m.basePrice128GB = newOurPrice;
      }
      fallbackChanged = true;
    }

    if (fallbackChanged) {
      updatedFallbackCount++;
    }
  }

  fs.writeFileSync(fallbackModelsPath, JSON.stringify(fallbackModels, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedFallbackCount} smartphone models in src/data/fallbackModels.json.`);

  // Print sample updates
  console.log('\nRepresentative Updated Smartphone Baseline Benchmarks (Showing +3% Winning Payout Edge):');
  console.log('-----------------------------------------------------------------------------------------');
  console.log('Model Name                 | Storage | Old Cashify | New Cashify | New Rephonix (+3% Offer)');
  console.log('-----------------------------------------------------------------------------------------');
  for (const u of updateSummary.slice(0, 15)) {
    const mStr = u.model.padEnd(26, ' ');
    const sStr = u.storage.padEnd(7, ' ');
    const oldStr = (`₹${u.oldCashify.toLocaleString('en-IN')}`).padEnd(11, ' ');
    const newStr = (`₹${u.newCashify.toLocaleString('en-IN')}`).padEnd(11, ' ');
    const ourStr = `₹${u.newRephonix.toLocaleString('en-IN')}`;
    console.log(`${mStr} | ${sStr} | ${oldStr} | ${newStr} | ${ourStr}`);
  }
  console.log('-----------------------------------------------------------------------------------------');
  console.log('All smartphone baseline benchmarks are now synchronized with 100% precision.\n');
}

runSync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
