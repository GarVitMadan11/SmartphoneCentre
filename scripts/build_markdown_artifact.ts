import fs from 'fs';
import path from 'path';

interface RecordItem {
  id: string;
  brand: string;
  model: string;
  series: string;
  ramDisplay: string;
  storageDisplay: string;
  cashifyPrice: number;
  cashifyPlus3Pct: number;
  cashifyLink: string;
}

const records: RecordItem[] = JSON.parse(fs.readFileSync('./scripts/cashify_variants_full.json', 'utf8'));

const artifactPath = `C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\ba31eda3-d90e-4330-8371-c5ffe4c6a1c5\\cashify_variant_prices_report.md`;

let mdContent = `# Cashify & Our (+3%) Price Comparison Master Table

> [!NOTE]
> This master dataset contains **Cashify Buyback Prices**, **Our Price (+3%)**, and **Direct Cashify Links** for **all 4,119 RAM & Storage variants** across **402 models** listed on the website.
> Full raw dataset is saved at [public/cashify_variant_prices.csv](file:///f:/SmartphoneCentre/public/cashify_variant_prices.csv).

---

## 📊 Summary Overview by Brand

| Brand | Total Models | Total RAM & Storage Variants | Price Range (Cashify ₹) | Price Range (+3% ₹) |
| :--- | :---: | :---: | :---: | :---: |
`;

const brands = Array.from(new Set(records.map(r => r.brand)));

brands.forEach(brand => {
  const brandRecs = records.filter(r => r.brand === brand);
  const modelsCount = new Set(brandRecs.map(r => r.model)).size;
  const minP = Math.min(...brandRecs.map(r => r.cashifyPrice));
  const maxP = Math.max(...brandRecs.map(r => r.cashifyPrice));
  const minP3 = Math.min(...brandRecs.map(r => r.cashifyPlus3Pct));
  const maxP3 = Math.max(...brandRecs.map(r => r.cashifyPlus3Pct));

  mdContent += `| **${brand}** | ${modelsCount} | ${brandRecs.length} | ₹${minP.toLocaleString('en-IN')} - ₹${maxP.toLocaleString('en-IN')} | ₹${minP3.toLocaleString('en-IN')} - ₹${maxP3.toLocaleString('en-IN')} |\n`;
});

mdContent += `\n---\n\n## 📱 Complete Variant Price Directory\n\n`;

brands.forEach(brand => {
  mdContent += `### ${brand}\n\n`;
  mdContent += `| Model | Series | RAM | Storage | Cashify Price | Price +3% | Cashify Link |\n`;
  mdContent += `| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n`;

  const brandRecs = records.filter(r => r.brand === brand);
  brandRecs.forEach(r => {
    const formattedCashify = `₹${r.cashifyPrice.toLocaleString('en-IN')}`;
    const formatted3Pct = `₹${r.cashifyPlus3Pct.toLocaleString('en-IN')}`;
    mdContent += `| ${r.model} | ${r.series} | ${r.ramDisplay} | ${r.storageDisplay} | ${formattedCashify} | **${formatted3Pct}** | [Sell on Cashify](${r.cashifyLink}) |\n`;
  });

  mdContent += `\n`;
});

fs.writeFileSync(artifactPath, mdContent);
console.log('Artifact report successfully created at', artifactPath);
