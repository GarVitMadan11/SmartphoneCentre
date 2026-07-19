import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(WORKSPACE_DIR, 'src', 'assets', 'phones');
const MAPPING_PATH = path.join(WORKSPACE_DIR, 'src', 'data', 'phoneImages.json');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Fetch VQD Token for a query
async function getVqdToken(queryStr) {
  const query = encodeURIComponent(queryStr);
  const response = await fetch(`https://duckduckgo.com/?q=${query}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to load main search page. Status: ${response.status}`);
  }
  const html = await response.text();
  const vqdMatch = html.match(/vqd\s*=\s*['"]([^'"]+)['"]/);
  if (!vqdMatch) {
    throw new Error('VQD token regex mismatch');
  }
  return vqdMatch[1];
}

// Search images on DDG
async function searchImages(queryStr, vqd) {
  const query = encodeURIComponent(queryStr);
  const response = await fetch(`https://duckduckgo.com/i.js?q=${query}&o=json&p=1&vqd=${vqd}&f=,,,`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://duckduckgo.com/'
    }
  });
  if (!response.ok) {
    throw new Error(`i.js endpoint returned status ${response.status}`);
  }
  const data = await response.json();
  return data.results || [];
}

async function downloadImage(url, destPath) {
  console.log(`Downloading image from: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch image. Status: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  console.log(`Successfully saved image to: ${destPath}`);
}

async function main() {
  const query = "iPhone 15 Pro Max amazon product photo";
  console.log(`Searching DDG for: "${query}"`);
  
  const vqd = await getVqdToken(query);
  const results = await searchImages(query, vqd);
  console.log(`Found ${results.length} results.`);
  
  // Find first result from amazon domains
  let selectedUrl = null;
  let selectedTitle = "";
  
  for (const result of results) {
    const imageUrl = result.image.toLowerCase();
    const sourceUrl = (result.url || '').toLowerCase();
    
    if (imageUrl.includes('amazon') || imageUrl.includes('media-amazon') || sourceUrl.includes('amazon') || sourceUrl.includes('media-amazon')) {
      selectedUrl = result.image;
      selectedTitle = result.title;
      break;
    }
  }
  
  // Fallback to first URL if no amazon specific domain matches
  if (!selectedUrl && results.length > 0) {
    selectedUrl = results[0].image;
    selectedTitle = results[0].title;
  }
  
  if (!selectedUrl) {
    throw new Error("No image URLs found.");
  }
  
  console.log(`Selected image title: "${selectedTitle}"`);
  console.log(`Selected image URL: ${selectedUrl}`);
  
  const destPath = path.join(ASSETS_DIR, 'apple-15pm.jpg');
  await downloadImage(selectedUrl, destPath);
  
  // Update phoneImages.json
  if (fs.existsSync(MAPPING_PATH)) {
    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
    
    // Set all variant overrides to point to this new local image
    mapping["apple-15pm"] = "apple-15pm.jpg";
    mapping["apple-15pm-natural-titanium"] = "apple-15pm.jpg";
    mapping["apple-15pm-black-titanium"] = "apple-15pm.jpg";
    mapping["apple-15pm-white-titanium"] = "apple-15pm.jpg";
    mapping["apple-15pm-desert-titanium"] = "apple-15pm.jpg";
    
    fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2), 'utf-8');
    console.log("Updated mappings in phoneImages.json for iPhone 15 Pro Max.");
  }
}

main().catch(err => {
  console.error("Error executing script:", err);
});
