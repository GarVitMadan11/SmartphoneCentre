const fs = require('fs');

const urls = [
  // S26
  'https://www.gsmarena.com/samsung_galaxy_s26_5g-14456.php',
  'https://www.gsmarena.com/samsung_galaxy_s26+_5g-14457.php',
  'https://www.gsmarena.com/samsung_galaxy_s26_ultra_5g-14320.php',
  // S25
  'https://www.gsmarena.com/samsung_galaxy_s25-13610.php',
  'https://www.gsmarena.com/samsung_galaxy_s25+-13609.php',
  'https://www.gsmarena.com/samsung_galaxy_s25_ultra-13322.php',
  // S24
  'https://www.gsmarena.com/samsung_galaxy_s24-12773.php',
  'https://www.gsmarena.com/samsung_galaxy_s24+-12772.php',
  'https://www.gsmarena.com/samsung_galaxy_s24_ultra-12771.php',
  // S23
  'https://www.gsmarena.com/samsung_galaxy_s23-12082.php',
  'https://www.gsmarena.com/samsung_galaxy_s23+-12083.php',
  'https://www.gsmarena.com/samsung_galaxy_s23_ultra-12024.php',
  // S22
  'https://www.gsmarena.com/samsung_galaxy_s22_5g-11253.php',
  'https://www.gsmarena.com/samsung_galaxy_s22+_5g-11252.php',
  'https://www.gsmarena.com/samsung_galaxy_s22_ultra_5g-11251.php',
  // S21
  'https://www.gsmarena.com/samsung_galaxy_s21_5g-10626.php',
  'https://www.gsmarena.com/samsung_galaxy_s21+_5g-10623.php',
  'https://www.gsmarena.com/samsung_galaxy_s21_ultra_5g-10596.php',
  // S20
  'https://www.gsmarena.com/samsung_galaxy_s20-10081.php',
  'https://www.gsmarena.com/samsung_galaxy_s20+_5g-10080.php',
  'https://www.gsmarena.com/samsung_galaxy_s20_ultra_5g-10040.php',
  // S10
  'https://www.gsmarena.com/samsung_galaxy_s10e-9537.php',
  'https://www.gsmarena.com/samsung_galaxy_s10-9536.php',
  'https://www.gsmarena.com/samsung_galaxy_s10+-9535.php',
  'https://www.gsmarena.com/samsung_galaxy_s10_5g-9588.php',
  // S9
  'https://www.gsmarena.com/samsung_galaxy_s9-8966.php',
  'https://www.gsmarena.com/samsung_galaxy_s9+-8967.php',
  // S8
  'https://www.gsmarena.com/samsung_galaxy_s8-8161.php',
  'https://www.gsmarena.com/samsung_galaxy_s8+-8523.php',
  // S7
  'https://www.gsmarena.com/samsung_galaxy_s7-7821.php',
  'https://www.gsmarena.com/samsung_galaxy_s7_edge-7945.php',
  // S6
  'https://www.gsmarena.com/samsung_galaxy_s6-6849.php',
  'https://www.gsmarena.com/samsung_galaxy_s6_edge-7077.php',
  'https://www.gsmarena.com/samsung_galaxy_s6_edge+-7467.php',
  // Z Fold
  'https://www.gsmarena.com/samsung_galaxy_z_fold8-XXXXXXXX.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold8_ultra-XXXXXXXX.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold7-13826.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold6-13147.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold5-12418.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold4-11737.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold3_5g-10906.php',
  'https://www.gsmarena.com/samsung_galaxy_z_fold2_5g-10342.php',
  'https://www.gsmarena.com/samsung_galaxy_fold-9523.php'
];

async function fetchImageForUrl(pageUrl) {
  if (pageUrl.includes('XXXXXXXX')) {
    const slug = pageUrl.split('/').pop().replace('-XXXXXXXX.php', '').replace(/_/g, '-');
    return { pageUrl, imgUrl: `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg` };
  }
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });
    if (!res.ok) {
      console.warn(`HTTP ${res.status} for ${pageUrl}`);
      const slug = pageUrl.split('/').pop().replace(/\.php$/, '').replace(/-\d+$/, '').replace(/_/g, '-');
      return { pageUrl, imgUrl: `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg` };
    }
    const html = await res.text();
    // Look for og:image meta tag first or specs-photo-main
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i)
      || html.match(/class=["']specs-photo-main["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    
    if (ogMatch && ogMatch[1] && ogMatch[1].includes('bigpic')) {
      return { pageUrl, imgUrl: ogMatch[1] };
    }
    
    // Look for bigpic in HTML
    const bigpicMatch = html.match(/(https:\/\/[^"']*gsmarena\.com\/vv\/bigpic\/[a-zA-Z0-9_-]+\.jpg)/i);
    if (bigpicMatch) {
      return { pageUrl, imgUrl: bigpicMatch[1] };
    }

    const slug = pageUrl.split('/').pop().replace(/\.php$/, '').replace(/-\d+$/, '').replace(/_/g, '-');
    return { pageUrl, imgUrl: `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg` };
  } catch (err) {
    console.error(`Error fetching ${pageUrl}:`, err.message);
    const slug = pageUrl.split('/').pop().replace(/\.php$/, '').replace(/-\d+$/, '').replace(/_/g, '-');
    return { pageUrl, imgUrl: `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg` };
  }
}

async function main() {
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const res = await fetchImageForUrl(urls[i]);
    results.push(res);
    console.log(`[${i+1}/${urls.length}] ${res.pageUrl} -> ${res.imgUrl}`);
    await new Promise(r => setTimeout(r, 100));
  }
  fs.writeFileSync('scripts/gsm_extracted_images.json', JSON.stringify(results, null, 2));
  console.log('DONE_EXTRACTING');
}

main();
