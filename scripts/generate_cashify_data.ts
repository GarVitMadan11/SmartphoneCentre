import fs from 'fs';
import { MODELS, getModelSupportedRam, getModelSupportedStorage, predictCashifyPrice, isAppleDevice, BRANDS } from '../src/data/mockDatabase.ts';

interface FullVariantRecord {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  modelId: string;
  series: string;
  ramGb: number;
  ramDisplay: string;
  storageGb: number;
  storageDisplay: string;
  cashifyPrice: number;
  cashifyPlus3Pct: number;
  cashifyLink: string;
}

const getBrandName = (brandId: string): string => {
  const b = BRANDS.find(br => br.id === brandId);
  if (b) return b.name;
  if (brandId.includes('apple')) return 'Apple';
  if (brandId.includes('samsung')) return 'Samsung';
  if (brandId.includes('xiaomi')) return 'Xiaomi';
  if (brandId.includes('vivo')) return 'vivo';
  if (brandId.includes('oneplus')) return 'OnePlus';
  if (brandId.includes('google')) return 'Google';
  if (brandId.includes('oppo')) return 'OPPO';
  if (brandId.includes('nothing')) return 'Nothing';
  if (brandId.includes('motorola')) return 'Motorola';
  return 'Smartphone';
};

const createSlug = (str: string): string => {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const generateCashifyLink = (brandName: string, modelName: string, ramGb: number, storageGb: number): string => {
  const brandSlug = createSlug(brandName);
  let modelSlug = createSlug(modelName);
  
  // Clean up prefix if modelName already includes brand name
  if (modelSlug.startsWith(brandSlug + '-')) {
    modelSlug = modelSlug.substring(brandSlug.length + 1);
  }

  let urlSlug = '';
  if (brandName.toLowerCase() === 'apple' || ramGb === 0) {
    urlSlug = `used-${brandSlug}-${modelSlug}-${storageGb}-gb`;
  } else {
    urlSlug = `used-${brandSlug}-${modelSlug}-${ramGb}-gb-${storageGb}-gb`;
  }

  return `https://www.cashify.in/sell-old-mobile-phone/${urlSlug}`;
};

const records: FullVariantRecord[] = [];
let counter = 1;

MODELS.forEach(m => {
  const brandName = getBrandName(m.brandId);
  const isApple = isAppleDevice(m.brandId, m.name);
  const rams = getModelSupportedRam(m);
  const storages = getModelSupportedStorage(m);
  
  const minRam = Math.min(...rams.filter(r => r > 0));

  for (const r of rams) {
    for (const s of storages) {
      let baseCashify = predictCashifyPrice(m.brandId, m.name, m.category, m.releaseYear, s);
      
      // Add RAM adjustment for Android if multiple RAM options exist
      if (!isApple && r > 0 && rams.length > 1 && !isNaN(minRam) && isFinite(minRam)) {
        const stepCount = (r - minRam) / 2;
        if (stepCount > 0) {
          baseCashify += Math.round(stepCount * 1200);
        }
      }

      const cashifyPrice = Math.round(baseCashify);
      const cashifyPlus3Pct = Math.round(cashifyPrice * 1.03);
      const cashifyLink = generateCashifyLink(brandName, m.name, r, s);

      records.push({
        id: `var-rec-${counter++}`,
        brand: brandName,
        brandId: m.brandId,
        model: m.name,
        modelId: m.id,
        series: m.series || 'Standard',
        ramGb: r,
        ramDisplay: isApple || r === 0 ? 'N/A' : `${r} GB`,
        storageGb: s,
        storageDisplay: `${s} GB`,
        cashifyPrice,
        cashifyPlus3Pct,
        cashifyLink
      });
    }
  }
});

console.log(`Generated ${records.length} records across ${MODELS.length} models.`);

// Save JSON
fs.writeFileSync('./scripts/cashify_variants_full.json', JSON.stringify(records, null, 2));

// Save CSV
const csvHeader = 'Brand,Model,Series,RAM,Storage,Cashify Price (INR),Cashify + 3% Price (INR),Cashify Link\n';
const csvRows = records.map(r => 
  `"${r.brand}","${r.model}","${r.series}","${r.ramDisplay}","${r.storageDisplay}",${r.cashifyPrice},${r.cashifyPlus3Pct},"${r.cashifyLink}"`
).join('\n');

fs.writeFileSync('./public/cashify_variant_prices.csv', csvHeader + csvRows);
console.log('Saved CSV to ./public/cashify_variant_prices.csv');
