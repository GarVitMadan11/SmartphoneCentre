const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let content = fs.readFileSync(path.join(__dirname, '../src/data/mockDatabase.ts'), 'utf8');

// Replace png imports with dummy string exports
content = content.replace(/import\s+(\w+)PhoneImg\s+from\s+'\.\/assets\/[^']+\.png';/g, 'const $1PhoneImg = "";');
content = content.replace(/import\s+(\w+)PhoneImg\s+from\s+'\.\.\/assets\/[^']+\.png';/g, 'const $1PhoneImg = "";');
content = content.replace(/import\s+phoneImages\s+from\s+'\.\/phoneImages\.json';/g, "import phoneImages from '../src/data/phoneImages.json' with { type: 'json' };");
content = content.replace(/import\s+actualPrices\s+from\s+'\.\/actualPrices\.json';/g, "import actualPrices from '../src/data/actualPrices.json' with { type: 'json' };");


fs.writeFileSync(path.join(__dirname, 'temp_mock.ts'), content);

// Read generate_cashify_data.ts and replace mockDatabase import with temp_mock
let scriptContent = fs.readFileSync(path.join(__dirname, 'generate_cashify_data.ts'), 'utf8');
scriptContent = scriptContent.replace(/from\s+'\.\.\/src\/data\/mockDatabase\.ts'/g, "from './temp_mock.ts'");

fs.writeFileSync(path.join(__dirname, 'temp_run_gen.ts'), scriptContent);

try {
  execSync('node --experimental-strip-types scripts/temp_run_gen.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} finally {
  if (fs.existsSync(path.join(__dirname, 'temp_mock.ts'))) fs.unlinkSync(path.join(__dirname, 'temp_mock.ts'));
  if (fs.existsSync(path.join(__dirname, 'temp_run_gen.ts'))) fs.unlinkSync(path.join(__dirname, 'temp_run_gen.ts'));
}
