// Decode HTML entities
function decodeHtml(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
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

async function main() {
  const query = "iPhone 15 Pro Max amazon product photo";
  console.log(`Searching DDG for: "${query}"`);
  try {
    const vqd = await getVqdToken(query);
    console.log(`Got VQD token: ${vqd}`);
    const results = await searchImages(query, vqd);
    console.log(`Found ${results.length} results.`);
    if (results.length > 0) {
      console.log("First result:", results[0]);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
