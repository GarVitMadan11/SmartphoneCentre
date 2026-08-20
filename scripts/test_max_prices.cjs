const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let content = fs.readFileSync(path.join(__dirname, '../src/data/mockDatabase.ts'), 'utf8');

// Replace png imports with dummy string exports
content = content.replace(/import\s+(\w+)PhoneImg\s+from\s+'\.\.\/assets\/[^']+\.png';/g, 'const $1PhoneImg = "";');
content = content.replace(/import\s+phoneImages\s+from\s+'\.\/phoneImages\.json';/g, "import phoneImages from '../src/data/phoneImages.json' with { type: 'json' };");
content = content.replace(/import\s+actualPrices\s+from\s+'\.\/actualPrices\.json';/g, "import actualPrices from '../src/data/actualPrices.json' with { type: 'json' };");


fs.writeFileSync(path.join(__dirname, 'temp_mock.ts'), content);

const scriptContent = `
import { MODELS, getMaxVariantPrice } from './temp_mock.ts';

const updated = MODELS.map(m => {
  const maxP = getMaxVariantPrice(m);
  return {
    id: m.id,
    brand: m.brandId,
    name: m.name,
    oldBasePrice: m.basePrice128GB,
    maxVariantPrice: maxP,
    variantPrices: m.variantPrices
  };
});

console.log('Processed', updated.length, 'models.');
console.log('Sample updated model prices:');
updated.slice(0, 10).forEach(m => {
  console.log(\` - \${m.name}: Old Base = ₹\${m.oldBasePrice.toLocaleString('en-IN')}, NEW Max Variant = ₹\${m.maxVariantPrice.toLocaleString('en-IN')}\`);
});
`;

fs.writeFileSync(path.join(__dirname, 'temp_run.ts'), scriptContent);

try {
  execSync('node --experimental-strip-types scripts/temp_run.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} finally {
  if (fs.existsSync(path.join(__dirname, 'temp_mock.ts'))) fs.unlinkSync(path.join(__dirname, 'temp_mock.ts'));
  if (fs.existsSync(path.join(__dirname, 'temp_run.ts'))) fs.unlinkSync(path.join(__dirname, 'temp_run.ts'));
}
