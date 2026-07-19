async function run() {
  try {
    const query = encodeURIComponent("iPhone 16 Pro Max Desert Titanium official site apple.com");
    console.log(`Searching DuckDuckGo HTML for: ${query}`);
    
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    console.log(`HTML response length: ${html.length}`);
    
    // Let's extract links matching class="result__snippet" and class="result__url"
    // DDG HTML results usually contain links like: <a class="result__url" href="https://...">
    const linkRegex = /class="result__url"[^>]*href="([^"]+)"/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
    
    console.log("Found links:", links.slice(0, 5));
    if (links.length === 0) {
      console.log("Snippet of HTML starting with body:");
      const bodyIndex = html.indexOf('<body');
      if (bodyIndex !== -1) {
        console.log(html.substring(bodyIndex, bodyIndex + 2000));
      } else {
        console.log(html.substring(0, 1000));
      }
    }
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

run();
