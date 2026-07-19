async function run() {
  try {
    const queryStr = "iPhone 16 Pro Max Desert Titanium front transparent background product image";
    const query = encodeURIComponent(queryStr);
    console.log(`Step 1: Fetching main DDG page for: "${queryStr}" to extract VQD...`);
    
    // Fetch main search page
    const mainResponse = await fetch(`https://duckduckgo.com/?q=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const mainHtml = await mainResponse.text();
    
    // Extract VQD using Regex
    const vqdRegex = /vqd\s*=\s*['"]([^'"]+)['"]/;
    const vqdMatch = mainHtml.match(vqdRegex);
    
    if (!vqdMatch) {
      console.error("VQD token not found in page HTML!");
      // Let's print some script tags or meta tags to help debug
      const scripts = [];
      const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
      let sm;
      while ((sm = scriptRegex.exec(mainHtml)) !== null) {
        if (sm[1].includes('vqd')) {
          scripts.push(sm[1].substring(0, 300));
        }
      }
      console.log("Matched script snippets containing 'vqd':", scripts);
      return;
    }
    
    const vqd = vqdMatch[1];
    console.log(`Found VQD token: ${vqd}`);
    
    console.log(`Step 2: Fetching images from DDG i.js API...`);
    const imagesResponse = await fetch(`https://duckduckgo.com/i.js?q=${query}&o=json&p=1&vqd=${vqd}&f=,,,`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    
    if (!imagesResponse.ok) {
      console.error(`i.js API returned status ${imagesResponse.status}`);
      const text = await imagesResponse.text();
      console.log(`Response snippet: ${text.substring(0, 500)}`);
      return;
    }
    
    const json = await imagesResponse.json();
    console.log("Image search completed!");
    console.log(`Total images found: ${json.results ? json.results.length : 0}`);
    
    if (json.results && json.results.length > 0) {
      const topResults = json.results.slice(0, 5).map(r => ({
        title: r.title,
        image: r.image,
        thumbnail: r.thumbnail,
        source: r.source,
        width: r.width,
        height: r.height
      }));
      console.log("Top 5 Image Results:", JSON.stringify(topResults, null, 2));
    }
  } catch (err) {
    console.error("Error executing script:", err);
  }
}

run();
