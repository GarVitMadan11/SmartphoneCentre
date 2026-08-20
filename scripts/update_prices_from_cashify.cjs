const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to slugify
const createSlug = (str) => {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const getBrandName = (brandId) => {
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

// Fetch page helper with native fetch (or https if needed)
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

// Parse Cashify's getUpTo values from the stream page content
function parseCashifyPrices(html, isApple) {
  const result = {};
  // Extract all self.__next_f.push lines
  const regex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
  let match;
  let fullText = '';
  while ((match = regex.exec(html)) !== null) {
    let str = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    fullText += str + '\n';
  }

  // Look for product details and productList variants in the decoded RSC stream
  const productListRegex = /"productList"\s*:\s*(\[[^\]]*\])/;
  const productListMatch = fullText.match(productListRegex);
  
  if (productListMatch) {
    try {
      // Find matching bracket boundaries to extract the full JSON array
      const startIndex = productListMatch.index + '"productList":'.length;
      let openBrackets = 0;
      let jsonStr = '';
      for (let i = startIndex; i < fullText.length; i++) {
        const char = fullText[i];
        if (char === '[') openBrackets++;
        if (char === ']') {
          openBrackets--;
          if (openBrackets === 0) {
            jsonStr = fullText.substring(startIndex, i + 1);
            break;
          }
        }
      }
      if (jsonStr) {
        const list = JSON.parse(jsonStr);
        list.forEach(item => {
          if (item.specifications) {
            const ramVal = item.specifications.ram ? (item.specifications.ram[0]?.val || '') : '';
            const storageVal = item.specifications.storage ? (item.specifications.storage[0]?.val || '') : '';
            const ram = isApple ? 0 : (parseFloat(ramVal) || 0);
            const storage = parseFloat(storageVal) || 0;
            const getUpTo = parseFloat(item.getUpTo) || 0;
            if (storage > 0 && getUpTo > 0) {
              const key = `${ram}_${storage}`;
              result[key] = getUpTo;
            }
          }
        });
      }
    } catch (e) {
      // Fallback: parse via regex if JSON parsing fails
    }
  }


  // Fallback regex matching if productList was not structured as JSON array
  if (Object.keys(result).length === 0) {
    const fallbackRegex = /"productName"\s*:\s*"[^"]*?(\d+\s*GB)?\s*\(?(\d+\s*GB)?\)"\s*,\s*[^}]*?"getUpTo"\s*:\s*(\d+)/gi;
    let fallbackMatch;
    while ((fallbackMatch = fallbackRegex.exec(fullText)) !== null) {
      const getUpTo = parseInt(fallbackMatch[3]);
      // Attempt to guess storage from specs
      const storageMatch = fallbackMatch[0].match(/(\d+)\s*GB/);
      const storage = storageMatch ? parseInt(storageMatch[1]) : 128;
      result[`0_${storage}`] = getUpTo;
    }
  }

  return result;
}

async function start() {
  console.log('Fetching active models from seed file...');
  // Read BASE_MODELS from seed file by executing temp code
  let content = fs.readFileSync(path.join(__dirname, '../server/prisma/seed.ts'), 'utf8');
  content = content.replace(/import\s+'dotenv\/config';/g, '');
  content = content.replace(/import\s+\{\s*PrismaClient\s*\}\s+from\s+'@prisma\/client';/g, 'const PrismaClient = class {};');
  content = content.replace(/import\s+bcrypt\s+from\s+'bcryptjs';/g, 'const bcrypt = { hashSync: () => "" };');
  content = content.replace(/import\s+(\w+)PhoneImg\s+from\s+'\.\.\/assets\/[^']+\.png';/g, 'const $1PhoneImg = "";');
  content = content.replace(/import\s+phoneImages\s+from\s+'\.\/phoneImages\.json';/g, "const phoneImages = {};");
  content = content.replace(/let phoneImagesMap[\s\S]*?catch\s*\(err\)\s*\{[^}]*\}/g, 'let phoneImagesMap = {};');
  content = content.replace('const ALL_MODELS =', 'export const ALL_MODELS =');
  content = content.replace(/main\(\)\s*\.catch[\s\S]*?\$disconnect\(\)\);/g, '// main execution commented out');


  fs.writeFileSync(path.join(__dirname, 'temp_seed.ts'), content);

  const scriptContent = `
  import { ALL_MODELS } from './temp_seed.ts';
  console.log(JSON.stringify(ALL_MODELS));
  `;
  fs.writeFileSync(path.join(__dirname, 'temp_run_seed.ts'), scriptContent);

  let baseModels = [];
  try {
    const { execSync } = require('child_process');
    const out = execSync('node --experimental-strip-types scripts/temp_run_seed.ts', { cwd: path.join(__dirname, '..') });
    baseModels = JSON.parse(out.toString());
  }
 catch (err) {
    console.error('Failed to extract models from seed:', err);
    process.exit(1);
  } finally {
    if (fs.existsSync(path.join(__dirname, 'temp_seed.ts'))) fs.unlinkSync(path.join(__dirname, 'temp_seed.ts'));
    if (fs.existsSync(path.join(__dirname, 'temp_run_seed.ts'))) fs.unlinkSync(path.join(__dirname, 'temp_run_seed.ts'));
  }

  const filteredModels = baseModels.filter(m => 
    !m.name.toLowerCase().includes('watch') && 
    !m.name.toLowerCase().includes('ipad') && 
    !m.name.toLowerCase().includes('tab') && 
    !m.id.toLowerCase().includes('watch') && 
    !m.id.toLowerCase().includes('ipad')
  );

  console.log(`Extracted ${filteredModels.length} phones. Scanning Cashify...`);

  const results = {};
  const batchSize = 6;
  for (let i = 0; i < filteredModels.length; i += batchSize) {
    const batch = filteredModels.slice(i, i + batchSize);

    await Promise.all(batch.map(async (m) => {
      const brandName = getBrandName(m.brandId);
      const brandSlug = createSlug(brandName);
      let modelSlug = createSlug(m.name);
      if (modelSlug.startsWith(brandSlug + '-')) {
        modelSlug = modelSlug.substring(brandSlug.length + 1);
      }

      // Check if Apple or Android
      const isApple = m.brandId === 'brand-apple' || m.name.toLowerCase().includes('iphone');
      
      const url = `https://www.cashify.in/sell-old-mobile-phone/used-${brandSlug}-${modelSlug}`;
      console.log(`Scanning model: ${m.name} -> ${url}`);
      
      const html = await fetchPage(url);
      if (html) {
        const prices = parseCashifyPrices(html, isApple);

        if (Object.keys(prices).length > 0) {
          console.log(`  Found prices for ${m.name}:`, prices);
          results[m.id] = {
            modelName: m.name,
            cashifyPrices: prices,
            ourPrices: Object.fromEntries(
              Object.entries(prices).map(([key, val]) => [key, Math.round(val * 1.03)])
            )
          };
        } else {
          // If no prices extracted from the base page, try variant pages
          const defaultStorages = isApple ? [128, 256, 512, 1024, 2048] : [128, 256, 512, 1024];
          const defaultRams = isApple ? [0] : [8, 12, 16];
          
          const storages = m.supportedStorageGb ? (typeof m.supportedStorageGb === 'string' ? JSON.parse(m.supportedStorageGb) : m.supportedStorageGb) : defaultStorages;
          const rams = m.supportedRamGb ? (typeof m.supportedRamGb === 'string' ? JSON.parse(m.supportedRamGb) : m.supportedRamGb) : defaultRams;
          
          const variantPrices = {};

          for (const s of storages) {
            for (const r of rams) {
              const varSlug = isApple || r === 0 
                ? `used-${brandSlug}-${modelSlug}-${s}-gb` 
                : `used-${brandSlug}-${modelSlug}-${r}-gb-${s}-gb`;
              const varUrl = `https://www.cashify.in/sell-old-mobile-phone/${varSlug}`;
              
              const varHtml = await fetchPage(varUrl);
              if (varHtml) {
                const parsed = parseCashifyPrices(varHtml, isApple);
                if (parsed[`${r}_${s}`]) {
                  variantPrices[`${r}_${s}`] = parsed[`${r}_${s}`];
                } else {
                  const matchGetUpTo = varHtml.match(/getUpTo\\?"?\s*:\s*(\d+)/i);
                  if (matchGetUpTo) {
                    variantPrices[`${r}_${s}`] = parseFloat(matchGetUpTo[1]);
                  }
                }

              }
            }
          }
          
          if (Object.keys(variantPrices).length > 0) {
            console.log(`  Found variant-fallback prices for ${m.name}:`, variantPrices);
            results[m.id] = {
              modelName: m.name,
              cashifyPrices: variantPrices,
              ourPrices: Object.fromEntries(
                Object.entries(variantPrices).map(([key, val]) => [key, Math.round(val * 1.03)])
              )
            };
          } else {
            console.log(`  No price list extracted for ${m.name}.`);
          }
        }

      } else {
        console.log(`  Model page not found or failed: ${m.name}`);
      }
    }));
    // Cool-down period
    await new Promise(r => setTimeout(r, 1000));
  }

  const outPath = path.join(__dirname, '../src/data/actualPrices.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Successfully updated actualPrices.json at ${outPath} with ${Object.keys(results).length} models.`);
}

start();
