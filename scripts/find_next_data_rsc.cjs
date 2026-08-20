const fs = require('fs');
const content = fs.readFileSync('/Users/dhruvmehta/.gemini/antigravity-ide/brain/09f77e64-1de2-4307-9597-757af9066934/.system_generated/steps/148/content.md', 'utf8');

// Find all next_f script contents
const regex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
let match;
let fullText = '';
while ((match = regex.exec(content)) !== null) {
  // Unescape the string content
  let str = match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
  fullText += str + '\n';
}

fs.writeFileSync('./scripts/rsc_decoded.txt', fullText);
console.log('Decoded RSC stream saved to scripts/rsc_decoded.txt');

// Let's search for keywords like "price", "variant", "base", "max", or numbers around 10000-25000 (standard iPhone 12 price range)
const lines = fullText.split('\n');
const matches = [];
lines.forEach((line, idx) => {
  if (line.includes('price') || line.includes('Price') || line.includes('12') || line.includes('64') || line.includes('128')) {
    matches.push(`${idx}: ${line.substring(0, 200)}`);
  }
});
console.log('Found matches:', matches.length);
console.log(matches.slice(0, 50));
