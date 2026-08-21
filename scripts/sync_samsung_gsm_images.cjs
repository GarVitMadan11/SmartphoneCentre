const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extracted = JSON.parse(fs.readFileSync(path.join(__dirname, 'gsm_extracted_images.json'), 'utf8'));
const phoneImagesPath = path.join(__dirname, '../src/data/phoneImages.json');
const mockDbPath = path.join(__dirname, '../src/data/mockDatabase.ts');

let phoneImages = {};
if (fs.existsSync(phoneImagesPath)) {
  phoneImages = JSON.parse(fs.readFileSync(phoneImagesPath, 'utf8'));
}

// Map of URL / model name to key patterns
// extracted entries have pageUrl and imgUrl

const keyMappings = [
  // S26
  { match: 'samsung_galaxy_s26_5g-14456', keys: ['sam-s26', 'samsung-galaxy-s26', 'samsung-galaxy-s26-5g', 'catalog-samsung-galaxy-s26-5g', 'catalog-samsung-galaxy-s26'] },
  { match: 'samsung_galaxy_s26+_5g-14457', keys: ['sam-s26plus', 'sam-s26-plus', 'samsung-galaxy-s26-plus', 'samsung-galaxy-s26-plus-5g', 'catalog-samsung-galaxy-s26-plus', 'catalog-samsung-galaxy-s26-plus-5g'] },
  { match: 'samsung_galaxy_s26_ultra_5g-14320', keys: ['sam-s26u', 'sam-s26-ultra', 'samsung-galaxy-s26-ultra', 'samsung-galaxy-s26-ultra-5g', 'catalog-samsung-galaxy-s26-ultra', 'catalog-samsung-galaxy-s26-ultra-5g'] },

  // S25
  { match: 'samsung_galaxy_s25-13610', keys: ['sam-s25', 'samsung-galaxy-s25', 'catalog-samsung-galaxy-s25'] },
  { match: 'samsung_galaxy_s25+-13609', keys: ['sam-s25plus', 'sam-s25-plus', 'samsung-galaxy-s25-plus', 'catalog-samsung-galaxy-s25-plus', 'catalog-samsung-galaxy-s25+'] },
  { match: 'samsung_galaxy_s25_ultra-13322', keys: ['sam-s25u', 'sam-s25-ultra', 'samsung-galaxy-s25-ultra', 'catalog-samsung-galaxy-s25-ultra'] },

  // S24
  { match: 'samsung_galaxy_s24-12773', keys: ['sam-s24', 'samsung-galaxy-s24', 'catalog-samsung-galaxy-s24'] },
  { match: 'samsung_galaxy_s24+-12772', keys: ['sam-s24plus', 'sam-s24-plus', 'samsung-galaxy-s24-plus', 'catalog-samsung-galaxy-s24-plus', 'catalog-samsung-galaxy-s24+'] },
  { match: 'samsung_galaxy_s24_ultra-12771', keys: ['sam-s24u', 'sam-s24-ultra', 'samsung-galaxy-s24-ultra', 'catalog-samsung-galaxy-s24-ultra'] },

  // S23
  { match: 'samsung_galaxy_s23-12082', keys: ['sam-s23', 'samsung-galaxy-s23', 'catalog-samsung-galaxy-s23'] },
  { match: 'samsung_galaxy_s23+-12083', keys: ['sam-s23plus', 'sam-s23-plus', 'samsung-galaxy-s23-plus', 'catalog-samsung-galaxy-s23-plus', 'catalog-samsung-galaxy-s23+'] },
  { match: 'samsung_galaxy_s23_ultra-12024', keys: ['sam-s23u', 'sam-s23-ultra', 'samsung-galaxy-s23-ultra', 'catalog-samsung-galaxy-s23-ultra'] },

  // S22
  { match: 'samsung_galaxy_s22_5g-11253', keys: ['sam-s22', 'samsung-galaxy-s22', 'samsung-galaxy-s22-5g', 'catalog-samsung-galaxy-s22', 'catalog-samsung-galaxy-s22-5g'] },
  { match: 'samsung_galaxy_s22+_5g-11252', keys: ['sam-s22plus', 'sam-s22-plus', 'samsung-galaxy-s22-plus', 'samsung-galaxy-s22-plus-5g', 'catalog-samsung-galaxy-s22-plus', 'catalog-samsung-galaxy-s22-plus-5g'] },
  { match: 'samsung_galaxy_s22_ultra_5g-11251', keys: ['sam-s22u', 'sam-s22-ultra', 'samsung-galaxy-s22-ultra', 'samsung-galaxy-s22-ultra-5g', 'catalog-samsung-galaxy-s22-ultra', 'catalog-samsung-galaxy-s22-ultra-5g'] },

  // S21
  { match: 'samsung_galaxy_s21_5g-10626', keys: ['sam-s21', 'samsung-galaxy-s21', 'samsung-galaxy-s21-5g', 'catalog-samsung-galaxy-s21', 'catalog-samsung-galaxy-s21-5g'] },
  { match: 'samsung_galaxy_s21+_5g-10623', keys: ['sam-s21plus', 'sam-s21-plus', 'samsung-galaxy-s21-plus', 'samsung-galaxy-s21-plus-5g', 'catalog-samsung-galaxy-s21-plus', 'catalog-samsung-galaxy-s21-plus-5g'] },
  { match: 'samsung_galaxy_s21_ultra_5g-10596', keys: ['sam-s21u', 'sam-s21-ultra', 'samsung-galaxy-s21-ultra', 'samsung-galaxy-s21-ultra-5g', 'catalog-samsung-galaxy-s21-ultra', 'catalog-samsung-galaxy-s21-ultra-5g'] },

  // S20
  { match: 'samsung_galaxy_s20-10081', keys: ['sam-s20', 'samsung-galaxy-s20', 'catalog-samsung-galaxy-s20'] },
  { match: 'samsung_galaxy_s20+_5g-10080', keys: ['sam-s20plus', 'sam-s20-plus', 'samsung-galaxy-s20-plus', 'samsung-galaxy-s20-plus-5g', 'catalog-samsung-galaxy-s20-plus', 'catalog-samsung-galaxy-s20-plus-5g'] },
  { match: 'samsung_galaxy_s20_ultra_5g-10040', keys: ['sam-s20u', 'sam-s20-ultra', 'samsung-galaxy-s20-ultra', 'samsung-galaxy-s20-ultra-5g', 'catalog-samsung-galaxy-s20-ultra', 'catalog-samsung-galaxy-s20-ultra-5g'] },

  // S10
  { match: 'samsung_galaxy_s10e-9537', keys: ['sam-s10e', 'samsung-galaxy-s10e', 'catalog-samsung-galaxy-s10e'] },
  { match: 'samsung_galaxy_s10-9536', keys: ['sam-s10', 'samsung-galaxy-s10', 'catalog-samsung-galaxy-s10'] },
  { match: 'samsung_galaxy_s10+-9535', keys: ['sam-s10plus', 'sam-s10-plus', 'samsung-galaxy-s10-plus', 'catalog-samsung-galaxy-s10-plus', 'catalog-samsung-galaxy-s10+'] },
  { match: 'samsung_galaxy_s10_5g-9588', keys: ['sam-s10-5g', 'samsung-galaxy-s10-5g', 'catalog-samsung-galaxy-s10-5g'] },

  // S9
  { match: 'samsung_galaxy_s9-8966', keys: ['sam-s9', 'samsung-galaxy-s9', 'catalog-samsung-galaxy-s9'] },
  { match: 'samsung_galaxy_s9+-8967', keys: ['sam-s9plus', 'sam-s9-plus', 'samsung-galaxy-s9-plus', 'catalog-samsung-galaxy-s9-plus', 'catalog-samsung-galaxy-s9+'] },

  // S8
  { match: 'samsung_galaxy_s8-8161', keys: ['sam-s8', 'samsung-galaxy-s8', 'catalog-samsung-galaxy-s8'] },
  { match: 'samsung_galaxy_s8+-8523', keys: ['sam-s8plus', 'sam-s8-plus', 'samsung-galaxy-s8-plus', 'catalog-samsung-galaxy-s8-plus', 'catalog-samsung-galaxy-s8+'] },

  // S7
  { match: 'samsung_galaxy_s7-7821', keys: ['sam-s7', 'samsung-galaxy-s7', 'catalog-samsung-galaxy-s7'] },
  { match: 'samsung_galaxy_s7_edge-7945', keys: ['sam-s7edge', 'sam-s7-edge', 'samsung-galaxy-s7-edge', 'catalog-samsung-galaxy-s7-edge'] },

  // S6
  { match: 'samsung_galaxy_s6-6849', keys: ['sam-s6', 'samsung-galaxy-s6', 'catalog-samsung-galaxy-s6'] },
  { match: 'samsung_galaxy_s6_edge-7077', keys: ['sam-s6edge', 'sam-s6-edge', 'samsung-galaxy-s6-edge', 'catalog-samsung-galaxy-s6-edge'] },
  { match: 'samsung_galaxy_s6_edge+-7467', keys: ['sam-s6edgeplus', 'sam-s6-edge-plus', 'samsung-galaxy-s6-edge-plus', 'catalog-samsung-galaxy-s6-edge-plus', 'catalog-samsung-galaxy-s6-edge+'] },

  // Z Fold
  { match: 'samsung_galaxy_z_fold8-XXXXXXXX', keys: ['sam-fold8', 'samsung-galaxy-z-fold8', 'catalog-samsung-galaxy-z-fold8'] },
  { match: 'samsung_galaxy_z_fold8_ultra-XXXXXXXX', keys: ['sam-fold8u', 'sam-fold8-ultra', 'samsung-galaxy-z-fold8-ultra', 'catalog-samsung-galaxy-z-fold8-ultra'] },
  { match: 'samsung_galaxy_z_fold7-13826', keys: ['sam-fold7', 'samsung-galaxy-z-fold7', 'catalog-samsung-galaxy-z-fold7'] },
  { match: 'samsung_galaxy_z_fold6-13147', keys: ['sam-fold6', 'samsung-galaxy-z-fold6', 'catalog-samsung-galaxy-z-fold6'] },
  { match: 'samsung_galaxy_z_fold5-12418', keys: ['sam-fold5', 'samsung-galaxy-z-fold5', 'catalog-samsung-galaxy-z-fold5'] },
  { match: 'samsung_galaxy_z_fold4-11737', keys: ['sam-fold4', 'samsung-galaxy-z-fold4', 'catalog-samsung-galaxy-z-fold4'] },
  { match: 'samsung_galaxy_z_fold3_5g-10906', keys: ['sam-fold3', 'sam-fold3-5g', 'samsung-galaxy-z-fold3-5g', 'catalog-samsung-galaxy-z-fold3-5g'] },
  { match: 'samsung_galaxy_z_fold2_5g-10342', keys: ['sam-fold2', 'sam-fold2-5g', 'samsung-galaxy-z-fold2-5g', 'catalog-samsung-galaxy-z-fold2-5g'] },
  { match: 'samsung_galaxy_fold-9523', keys: ['sam-fold1', 'sam-fold', 'samsung-galaxy-fold', 'catalog-samsung-galaxy-fold'] },
];

let updatedCount = 0;
for (const item of extracted) {
  const mapItem = keyMappings.find(m => item.pageUrl.includes(m.match));
  if (mapItem) {
    for (const key of mapItem.keys) {
      phoneImages[key] = item.imgUrl;
      updatedCount++;
    }
  }
}

fs.writeFileSync(phoneImagesPath, JSON.stringify(phoneImages, null, 2), 'utf8');
console.log(`Updated ${updatedCount} key entries in phoneImages.json`);
