const fs = require('fs');
const content = fs.readFileSync('/Users/dhruvmehta/.gemini/antigravity-ide/brain/09f77e64-1de2-4307-9597-757af9066934/.system_generated/steps/148/content.md', 'utf8');

// Find all script blocks
const scripts = [];
const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  if (match[1].trim()) {
    scripts.push(match[1].substring(0, 300) + '...');
  }
}
console.log('Found script blocks:', scripts.length);
console.log('First 5 script contents preview:');
console.log(scripts.slice(0, 5));

// Check for application/ld+json
const ldJsonRegex = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
const ldJsons = [];
while ((match = ldJsonRegex.exec(content)) !== null) {
  ldJsons.push(match[1]);
}
console.log('Found application/ld+json blocks:', ldJsons.length);
if (ldJsons.length > 0) {
  console.log(ldJsons.map(s => s.substring(0, 500)));
}
