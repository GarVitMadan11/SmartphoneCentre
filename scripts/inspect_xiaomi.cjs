const fs = require('fs');
const content = fs.readFileSync('/Users/dhruvmehta/.gemini/antigravity-ide/brain/09f77e64-1de2-4307-9597-757af9066934/.system_generated/steps/349/content.md', 'utf8');


// Find all next_f script contents
const regex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
let match;
let fullText = '';
while ((match = regex.exec(content)) !== null) {
  let str = match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
  fullText += str + '\n';
}

fs.writeFileSync('./scripts/rsc_xiaomi.txt', fullText);
console.log('Decoded RSC stream saved.');

// Look for productName or specifications
const lines = fullText.split('\n');
const matches = [];
lines.forEach((line, idx) => {
  if (line.includes('Xiaomi') || line.includes('14 Ultra') || line.includes('getUpTo') || line.includes('productId')) {
    matches.push(`${idx}: ${line.substring(0, 300)}`);
  }
});
console.log('Matches found:', matches.length);
console.log(matches.slice(0, 30));
