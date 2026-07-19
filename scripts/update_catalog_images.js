import fs from 'fs';
import path from 'path';

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Decode HTML entities
function decodeHtml(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// Map brands
const BRANDS = {
  'brand-apple': 'Apple',
  'brand-samsung': 'Samsung',
  'brand-google': 'Google',
  'brand-oneplus': 'OnePlus',
  'brand-xiaomi': 'Xiaomi',
  'brand-vivo': 'vivo'
};

// Replicate getColorsForModel logic
function getColorsForModel(model) {
  const name = model.name;
  const brandId = model.brandId;
  const year = model.releaseYear;
  
  if (brandId === 'brand-apple') {
    if ((name.includes('Pro') || name.includes('Air')) && year >= 2023) {
      return ['Natural Titanium', 'Black Titanium', 'White Titanium', 'Desert Titanium'];
    }
    if (year >= 2023 && !name.includes('Pro')) {
      return ['Black', 'Blue', 'Green', 'Yellow', 'Pink'];
    }
    if (year >= 2020 && year <= 2022) {
      return ['Midnight', 'Starlight', 'Blue', 'Purple', 'Product RED'];
    }
    if (year <= 2019) {
      return ['Space Gray', 'Silver', 'Gold', 'Midnight Green'];
    }
    if (name.includes('SE')) {
      return ['Midnight', 'Starlight', 'Product RED'];
    }
    return ['Space Gray', 'Silver', 'Gold', 'Blue'];
  }

  if (brandId === 'brand-samsung') {
    if (model.series === 'Z Fold & Z Flip') {
      return ['Phantom Black', 'Phantom Silver', 'Bespoke Edition'];
    }
    if (model.series === 'S Series' && model.releaseYear >= 2023) {
      return ['Phantom Black', 'Cream', 'Lavender', 'Green'];
    }
    if (model.series === 'S Series') {
      return ['Phantom Black', 'Phantom Silver', 'Phantom Gray', 'Phantom Violet'];
    }
    return ['Awesome Black', 'Awesome White', 'Awesome Blue', 'Awesome Violet'];
  }

  if (model.brandId === 'brand-google') {
    return ['Obsidian', 'Porcelain', 'Hazel', 'Coral'];
  }

  return ['Obsidian Black', 'Marble Gray', 'Cobalt Violet', 'Titanium Yellow'];
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

// Scoring heuristic for images
function scoreImage(img, brandName, modelName, colorName) {
  const title = img.title.toLowerCase();
  const url = img.image.toLowerCase();
  const brand = brandName.toLowerCase();
  const model = modelName.toLowerCase();
  const color = colorName.toLowerCase();

  let score = 50; // base score

  // Size checks
  if (img.width && img.height) {
    if (img.width < 400 || img.height < 400) score -= 30; // too small
    else if (img.width >= 800 && img.height >= 800) score += 20; // high quality
  }

  // PNG preference (transparency)
  if (url.endsWith('.png')) {
    score += 15;
  }

  // Keyword checks
  if (title.includes(brand) || url.includes(brand)) score += 20;
  if (title.includes(model) || url.includes(model)) score += 30;
  if (title.includes(color) || url.includes(color)) score += 40;

  // Official resources boost
  const officialDomains = [
    'apple.com', 'samsung.com', 'google.com', 'oneplus.com', 'mi.com', 'vivo.com', 
    'istore', 'gsmarena', 'bestbuy', 'target', 'amazon', 'wikimedia'
  ];
  if (officialDomains.some(domain => url.includes(domain))) {
    score += 45;
  }

  // Keywords that hint clean renders/specs
  const goodKeywords = ['pdp', 'official', 'render', 'transparent', 'white', 'front', 'back', 'specs', 'transparent-background', 'white-background'];
  goodKeywords.forEach(kw => {
    if (title.includes(kw) || url.includes(kw)) score += 10;
  });

  // Negative checks (lifestyle, hands-on, review, watermarked)
  const badKeywords = ['review', 'hands-on', 'unboxing', 'lifestyle', 'handson', 'photo', 'camera-test', 'watermark', 'leak', 'concept'];
  badKeywords.forEach(kw => {
    if (title.includes(kw) || url.includes(kw)) score -= 60;
  });

  return score;
}

// Main runner
async function main() {
  console.log("Starting smartphone catalog image updater...");
  
  // 1. Read mockDatabase.ts to parse models
  const dbPath = path.resolve('src/data/mockDatabase.ts');
  const fileContent = fs.readFileSync(dbPath, 'utf-8');
  
  const modelRegex = /\{\s*id:\s*'([^']+)',\s*brandId:\s*'([^']+)',\s*name:\s*'([^']+)',\s*(?:modelNumber:\s*'[^']+',\s*)?category:\s*'[^']+',\s*releaseYear:\s*(\d+)(?:,\s*basePrice128GB:\s*\d+)?(?:,\s*series:\s*'([^']*)')?/g;
  
  const models = [];
  let match;
  while ((match = modelRegex.exec(fileContent)) !== null) {
    models.push({
      id: match[1],
      brandId: match[2],
      name: match[3],
      releaseYear: parseInt(match[4], 10),
      series: match[5] || null
    });
  }
  
  console.log(`Successfully parsed ${models.length} smartphone models.`);

  // 2. Read current phoneImages.json
  const imagesJsonPath = path.resolve('src/data/phoneImages.json');
  let phoneImages = {};
  if (fs.existsSync(imagesJsonPath)) {
    phoneImages = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf-8'));
  }

  const matches = [];
  const skipped = [];

  // Iterate over each model and its colors
  // To avoid hitting search limits and running forever, we will target the key active models
  // and process them sequentially with rate limit protection
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const brandName = BRANDS[model.brandId] || 'Smartphone';
    const colors = getColorsForModel(model);
    
    console.log(`\n[${i+1}/${models.length}] Processing ${brandName} ${model.name} (${colors.length} colors)...`);
    
    for (const color of colors) {
      const colorKey = `${model.id}-${color.toLowerCase().trim().replace(/\s+/g, '-')}`;
      
      // Formulate query
      const queryStr = `${brandName} ${model.name} ${color} front white background official product image`;
      
      let attempts = 0;
      let success = false;
      let imgUrl = null;
      let errorMsg = "";
      
      while (attempts < 3 && !success) {
        attempts++;
        try {
          await delay(250); // rate limiting sleep
          
          const vqd = await getVqdToken(queryStr);
          await delay(100);
          
          const results = await searchImages(queryStr, vqd);
          
          if (results && results.length > 0) {
            // Score each image
            const scored = results.map(r => ({
              ...r,
              score: scoreImage(r, brandName, model.name, color)
            }));
            
            // Sort by score descending
            scored.sort((a, b) => b.score - a.score);
            
            const best = scored[0];
            if (best.score >= 50) {
              imgUrl = best.image;
              success = true;
            } else {
              errorMsg = `Low confidence match (highest score: ${best.score})`;
            }
          } else {
            errorMsg = "No search results returned";
          }
        } catch (err) {
          errorMsg = err.message;
          await delay(1000); // Backoff on error
        }
      }
      
      if (success && imgUrl) {
        console.log(`  ✓ Matched ${color} -> ${imgUrl.substring(0, 70)}...`);
        phoneImages[colorKey] = imgUrl; // Update registry with direct URL reference
        matches.push({
          model: model.name,
          brand: brandName,
          color,
          url: imgUrl
        });
      } else {
        console.log(`  ✗ Skipped ${color} - Reason: ${errorMsg}`);
        skipped.push({
          model: model.name,
          brand: brandName,
          color,
          reason: errorMsg
        });
      }
    }
  }

  // 3. Write updated phoneImages.json
  fs.writeFileSync(imagesJsonPath, JSON.stringify(phoneImages, null, 2), 'utf-8');
  console.log(`\nUpdated phoneImages.json with new color mappings.`);

  // 4. Generate Skipped Devices Report (markdown)
  const reportPath = path.resolve('skipped_devices_report.md');
  let reportContent = `# Smartphone Catalog Image Updates - Skipped Devices Report\n\n`;
  reportContent += `**Date**: ${new Date().toISOString()}\n`;
  reportContent += `**Total Models Scanned**: ${models.length}\n`;
  reportContent += `**Successfully Matched Mappings**: ${matches.length}\n`;
  reportContent += `**Skipped Mappings**: ${skipped.length}\n\n`;
  
  reportContent += `## Successfully Sourced Images Examples\n\n`;
  reportContent += `| Brand | Model | Color | Official Product Image URL |\n`;
  reportContent += `|---|---|---|---|\n`;
  matches.slice(0, 15).forEach(m => {
    reportContent += `| ${m.brand} | ${m.model} | ${m.color} | [Link](${m.url}) |\n`;
  });
  if (matches.length > 15) {
    reportContent += `| ... | ... | ... | +${matches.length - 15} more successfully cataloged |\n`;
  }
  
  reportContent += `\n## Skipped Mappings Report\n\n`;
  reportContent += `The following configurations could not be matched with high confidence or encountered search failures, and were skipped (falling back to standard model previews):\n\n`;
  reportContent += `| Brand | Model | Color | Reason for Skipping |\n`;
  reportContent += `|---|---|---|---|\n`;
  skipped.forEach(s => {
    reportContent += `| ${s.brand} | ${s.model} | ${s.color} | ${s.reason} |\n`;
  });
  
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`Generated skipped devices report at: ${reportPath}`);
}

main().catch(err => {
  console.error("Critical error in main updater script:", err);
});
