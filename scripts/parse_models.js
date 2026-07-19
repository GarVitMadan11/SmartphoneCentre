import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync(path.resolve('src/data/mockDatabase.ts'), 'utf-8');

// Match lines like: { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max',   modelNumber: 'A3296', category: 'flagship', releaseYear: 2024, basePrice128GB: 67000, series: 'iPhone 16 Series' }
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

console.log(`Parsed ${models.length} models.`);
console.log("First 10 parsed models:", models.slice(0, 10));
