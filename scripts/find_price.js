const fs = require('fs');
const content = fs.readFileSync('/Users/dhruvmehta/.gemini/antigravity-ide/brain/09f77e64-1de2-4307-9597-757af9066934/.system_generated/steps/148/content.md', 'utf8');

// Look for price patterns e.g. "₹ 17,420" or similar, or NEXT.js page props
const regexNextData = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;
const match = content.match(regexNextData);
if (match) {
  console.log('Found __NEXT_DATA__!');
  const data = JSON.parse(match[1]);
  // Write to a file to inspect it safely
  fs.writeFileSync('./scripts/next_data.json', JSON.stringify(data, null, 2));
  console.log('Saved to ./scripts/next_data.json');
} else {
  // Let's search for "price" or "₹" or numbers
  console.log('__NEXT_DATA__ not found. Searching for general patterns...');
  const pr = /₹\s*[0-9,]+/g;
  console.log(content.match(pr)?.slice(0, 30));
}
