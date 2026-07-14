import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(WORKSPACE_DIR, 'src', 'data', 'mockDatabase.ts');
const ASSETS_DIR = path.join(WORKSPACE_DIR, 'src', 'assets', 'phones');
const MAPPING_PATH = path.join(WORKSPACE_DIR, 'src', 'data', 'phoneImages.json');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// 1. Read mockDatabase.ts and extract models
const dbContent = fs.readFileSync(DB_PATH, 'utf-8');
const modelRegex = /\{\s*id:\s*'([^']*)',\s*brandId:\s*'([^']*)',\s*name:\s*'([^']*)'/g;

const models = [];
let match;
while ((match = modelRegex.exec(dbContent)) !== null) {
  models.push({
    id: match[1],
    brandId: match[2],
    name: match[3],
  });
}

console.log(`Found ${models.length} models in database.`);

// Load existing mapping if any
let mapping = {};
if (fs.existsSync(MAPPING_PATH)) {
  try {
    mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
  } catch (err) {
    console.error('Failed to parse existing mapping:', err);
  }
}

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getBingImages(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) return [];
    const html = await response.text();
    const regex = /murl&quot;:&quot;([^&]+)/g;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  } catch (err) {
    console.error(`Error querying Bing for ${query}:`, err.message);
    return [];
  }
}

async function downloadFirstValidImage(urls, destBaseName) {
  for (const url of urls) {
    // Skip weird URLs or data URIs
    if (!url.startsWith('http')) continue;
    
    try {
      // Determine file extension
      let ext = '.jpg';
      const cleanUrl = url.split('?')[0].toLowerCase();
      if (cleanUrl.endsWith('.png')) ext = '.png';
      else if (cleanUrl.endsWith('.webp')) ext = '.webp';
      else if (cleanUrl.endsWith('.jpeg')) ext = '.jpeg';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) continue;
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('image')) {
        continue; // Not an image
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Save it
      const fileName = `${destBaseName}${ext}`;
      const destPath = path.join(ASSETS_DIR, fileName);
      fs.writeFileSync(destPath, buffer);
      
      return fileName;
    } catch (e) {
      // Try next URL
    }
  }
  throw new Error('No valid image could be downloaded');
}

async function main() {
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    
    // Check if we already have this model downloaded and mapped
    if (mapping[model.id] && fs.existsSync(path.join(ASSETS_DIR, mapping[model.id]))) {
      console.log(`[${i + 1}/${models.length}] Skipped ${model.name} (already downloaded)`);
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${models.length}] Searching and downloading image for: ${model.name}...`);
    
    // Construct query for clean product shot
    const query = `${model.name} phone official white background`;
    const urls = await getBingImages(query);
    
    if (urls.length > 0) {
      try {
        const savedFileName = await downloadFirstValidImage(urls.slice(0, 8), model.id);
        mapping[model.id] = savedFileName;
        fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2));
        console.log(`  Downloaded: ${savedFileName}`);
        successCount++;
      } catch (err) {
        console.error(`  Failed to download image for ${model.name}: ${err.message}`);
      }
    } else {
      console.warn(`  No Bing image results found for ${model.name}`);
    }
    
    // Delay to prevent rate limiting
    await delay(1200);
  }

  console.log(`Done! Downloaded: ${successCount}, Skipped: ${skippedCount}, Total Models: ${models.length}`);
}

main().catch(console.error);
