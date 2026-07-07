export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export type DeviceCategory = 'flagship' | 'premium' | 'midrange' | 'budget';

export interface Model {
  id: string;
  brandId: string;
  name: string;
  category: DeviceCategory;
  releaseYear: number;
  basePrice128GB: number; // Anchor price in INR
}

export interface Variant {
  id: string;
  modelId: string;
  storageGb: number;
  color: string;
  basePrice: number; // Calculated base price in INR
}

export interface DefectRule {
  id: string;
  category: 'screen' | 'body' | 'camera' | 'battery' | 'accessories';
  description: string;
  subText: string;
  deductionFixed: number;       // Fixed INR penalty
  deductionPercentage: number;  // Percentage deduction (0 to 1)
  isCriticalFailure?: boolean;  // If true, device has zero value
}

// 1. Brands List
export const BRANDS: Brand[] = [
  { id: 'brand-apple', name: 'Apple', logo: '' },
  { id: 'brand-samsung', name: 'Samsung', logo: 'S' },
  { id: 'brand-oneplus', name: 'OnePlus', logo: '1+' },
  { id: 'brand-google', name: 'Google', logo: 'G' },
];

// 2. Models List (Comprehensive)
export const MODELS: Model[] = [
  // --- APPLE --- C2B offer ~70% of refurb mid-price (Jun 2026). iPhones retain value best.
  { id: 'apple-17pm',   brandId: 'brand-apple', name: 'iPhone 17 Pro Max',   category: 'flagship', releaseYear: 2025, basePrice128GB: 77000 },
  { id: 'apple-17p',    brandId: 'brand-apple', name: 'iPhone 17 Pro',       category: 'flagship', releaseYear: 2025, basePrice128GB: 67000 },
  { id: 'apple-17air',  brandId: 'brand-apple', name: 'iPhone Air',          category: 'premium',  releaseYear: 2025, basePrice128GB: 55000 },
  { id: 'apple-17',     brandId: 'brand-apple', name: 'iPhone 17',           category: 'premium',  releaseYear: 2025, basePrice128GB: 50000 },
  { id: 'apple-17e',    brandId: 'brand-apple', name: 'iPhone 17e',          category: 'midrange', releaseYear: 2025, basePrice128GB: 38000 },
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max',   category: 'flagship', releaseYear: 2024, basePrice128GB: 67000 },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro',       category: 'flagship', releaseYear: 2024, basePrice128GB: 57000 },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus',      category: 'premium',  releaseYear: 2024, basePrice128GB: 45000 },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16',           category: 'premium',  releaseYear: 2024, basePrice128GB: 40000 },
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e',          category: 'midrange', releaseYear: 2024, basePrice128GB: 32000 },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max',   category: 'flagship', releaseYear: 2023, basePrice128GB: 57000 },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro',       category: 'flagship', releaseYear: 2023, basePrice128GB: 47000 },
  { id: 'apple-15plus', brandId: 'brand-apple', name: 'iPhone 15 Plus',      category: 'premium',  releaseYear: 2023, basePrice128GB: 37000 },
  { id: 'apple-15',     brandId: 'brand-apple', name: 'iPhone 15',           category: 'premium',  releaseYear: 2023, basePrice128GB: 33000 },
  { id: 'apple-14pm',   brandId: 'brand-apple', name: 'iPhone 14 Pro Max',   category: 'flagship', releaseYear: 2022, basePrice128GB: 37000 },
  { id: 'apple-14p',    brandId: 'brand-apple', name: 'iPhone 14 Pro',       category: 'flagship', releaseYear: 2022, basePrice128GB: 35000 },
  { id: 'apple-14plus', brandId: 'brand-apple', name: 'iPhone 14 Plus',      category: 'premium',  releaseYear: 2022, basePrice128GB: 26000 },
  { id: 'apple-14',     brandId: 'brand-apple', name: 'iPhone 14',           category: 'premium',  releaseYear: 2022, basePrice128GB: 23000 },
  { id: 'apple-13pm',   brandId: 'brand-apple', name: 'iPhone 13 Pro Max',   category: 'flagship', releaseYear: 2021, basePrice128GB: 29000 },
  { id: 'apple-13p',    brandId: 'brand-apple', name: 'iPhone 13 Pro',       category: 'flagship', releaseYear: 2021, basePrice128GB: 27000 },
  { id: 'apple-13',     brandId: 'brand-apple', name: 'iPhone 13',           category: 'premium',  releaseYear: 2021, basePrice128GB: 21000 },
  { id: 'apple-13m',    brandId: 'brand-apple', name: 'iPhone 13 mini',      category: 'midrange', releaseYear: 2021, basePrice128GB: 16000 },
  { id: 'apple-12pm',   brandId: 'brand-apple', name: 'iPhone 12 Pro Max',   category: 'premium',  releaseYear: 2020, basePrice128GB: 18000 },
  { id: 'apple-12p',    brandId: 'brand-apple', name: 'iPhone 12 Pro',       category: 'premium',  releaseYear: 2020, basePrice128GB: 16000 },
  { id: 'apple-12',     brandId: 'brand-apple', name: 'iPhone 12',           category: 'midrange', releaseYear: 2020, basePrice128GB: 13000 },
  { id: 'apple-12m',    brandId: 'brand-apple', name: 'iPhone 12 mini',      category: 'midrange', releaseYear: 2020, basePrice128GB: 10500 },
  { id: 'apple-11pm',   brandId: 'brand-apple', name: 'iPhone 11 Pro Max',   category: 'premium',  releaseYear: 2019, basePrice128GB: 11000 },
  { id: 'apple-11p',    brandId: 'brand-apple', name: 'iPhone 11 Pro',       category: 'premium',  releaseYear: 2019, basePrice128GB:  9500 },
  { id: 'apple-11',     brandId: 'brand-apple', name: 'iPhone 11',           category: 'midrange', releaseYear: 2019, basePrice128GB:  7500 },
  { id: 'apple-xsmax',  brandId: 'brand-apple', name: 'iPhone XS Max',       category: 'budget',   releaseYear: 2018, basePrice128GB:  8000 },
  { id: 'apple-xs',     brandId: 'brand-apple', name: 'iPhone XS',           category: 'budget',   releaseYear: 2018, basePrice128GB:  6500 },
  { id: 'apple-xr',     brandId: 'brand-apple', name: 'iPhone XR',           category: 'budget',   releaseYear: 2018, basePrice128GB:  5500 },
  { id: 'apple-x',      brandId: 'brand-apple', name: 'iPhone X',            category: 'budget',   releaseYear: 2017, basePrice128GB:  5000 },
  { id: 'apple-se3',    brandId: 'brand-apple', name: 'iPhone SE (3rd Gen)', category: 'budget',   releaseYear: 2022, basePrice128GB:  8500 },
  { id: 'apple-se2',    brandId: 'brand-apple', name: 'iPhone SE (2nd Gen)', category: 'budget',   releaseYear: 2020, basePrice128GB:  6000 },

  // --- SAMSUNG --- C2B offer ~65% of refurb mid-price. Samsung depreciates faster than Apple.
  { id: 'sam-s24u',    brandId: 'brand-samsung', name: 'Galaxy S24 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000 },
  { id: 'sam-s24plus', brandId: 'brand-samsung', name: 'Galaxy S24+',      category: 'flagship', releaseYear: 2024, basePrice128GB: 32000 },
  { id: 'sam-s24',     brandId: 'brand-samsung', name: 'Galaxy S24',       category: 'premium',  releaseYear: 2024, basePrice128GB: 25000 },
  { id: 'sam-s23u',    brandId: 'brand-samsung', name: 'Galaxy S23 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 30000 },
  { id: 'sam-s23plus', brandId: 'brand-samsung', name: 'Galaxy S23+',      category: 'premium',  releaseYear: 2023, basePrice128GB: 20000 },
  { id: 'sam-s23',     brandId: 'brand-samsung', name: 'Galaxy S23',       category: 'premium',  releaseYear: 2023, basePrice128GB: 17000 },
  { id: 'sam-s23fe',   brandId: 'brand-samsung', name: 'Galaxy S23 FE',    category: 'midrange', releaseYear: 2023, basePrice128GB: 13000 },
  { id: 'sam-s22u',    brandId: 'brand-samsung', name: 'Galaxy S22 Ultra', category: 'premium',  releaseYear: 2022, basePrice128GB: 21000 },
  { id: 'sam-s22plus', brandId: 'brand-samsung', name: 'Galaxy S22+',      category: 'premium',  releaseYear: 2022, basePrice128GB: 15000 },
  { id: 'sam-s22',     brandId: 'brand-samsung', name: 'Galaxy S22',       category: 'midrange', releaseYear: 2022, basePrice128GB: 12000 },
  { id: 'sam-zfold5',  brandId: 'brand-samsung', name: 'Galaxy Z Fold 5',  category: 'flagship', releaseYear: 2023, basePrice128GB: 55000 },
  { id: 'sam-zflip5',  brandId: 'brand-samsung', name: 'Galaxy Z Flip 5',  category: 'flagship', releaseYear: 2023, basePrice128GB: 28000 },
  { id: 'sam-zfold4',  brandId: 'brand-samsung', name: 'Galaxy Z Fold 4',  category: 'flagship', releaseYear: 2022, basePrice128GB: 38000 },
  { id: 'sam-zflip4',  brandId: 'brand-samsung', name: 'Galaxy Z Flip 4',  category: 'premium',  releaseYear: 2022, basePrice128GB: 18000 },
  { id: 'sam-a55',     brandId: 'brand-samsung', name: 'Galaxy A55',       category: 'midrange', releaseYear: 2024, basePrice128GB: 14000 },
  { id: 'sam-a54',     brandId: 'brand-samsung', name: 'Galaxy A54',       category: 'midrange', releaseYear: 2023, basePrice128GB: 10000 },

  // --- ONEPLUS --- C2B offer ~62% of refurb mid-price (aggressive depreciation curve)
  { id: 'op-12',      brandId: 'brand-oneplus', name: 'OnePlus 12',        category: 'flagship', releaseYear: 2024, basePrice128GB: 24000 },
  { id: 'op-12r',     brandId: 'brand-oneplus', name: 'OnePlus 12R',       category: 'premium',  releaseYear: 2024, basePrice128GB: 16000 },
  { id: 'op-11',      brandId: 'brand-oneplus', name: 'OnePlus 11',        category: 'premium',  releaseYear: 2023, basePrice128GB: 16000 },
  { id: 'op-11r',     brandId: 'brand-oneplus', name: 'OnePlus 11R',       category: 'midrange', releaseYear: 2023, basePrice128GB: 11000 },
  { id: 'op-10p',     brandId: 'brand-oneplus', name: 'OnePlus 10 Pro',    category: 'premium',  releaseYear: 2022, basePrice128GB: 12000 },
  { id: 'op-10t',     brandId: 'brand-oneplus', name: 'OnePlus 10T',       category: 'midrange', releaseYear: 2022, basePrice128GB:  9000 },
  { id: 'op-10r',     brandId: 'brand-oneplus', name: 'OnePlus 10R',       category: 'midrange', releaseYear: 2022, basePrice128GB:  7000 },
  { id: 'op-nord4',   brandId: 'brand-oneplus', name: 'OnePlus Nord 4',    category: 'midrange', releaseYear: 2024, basePrice128GB: 13000 },
  { id: 'op-nord3',   brandId: 'brand-oneplus', name: 'OnePlus Nord 3',    category: 'budget',   releaseYear: 2023, basePrice128GB:  9000 },
  { id: 'op-nordce4', brandId: 'brand-oneplus', name: 'OnePlus Nord CE 4', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500 },

  // --- GOOGLE --- C2B offer ~60% of refurb mid-price (lower INR market liquidity)
  { id: 'goog-8p',  brandId: 'brand-google', name: 'Pixel 8 Pro',  category: 'flagship', releaseYear: 2023, basePrice128GB: 27000 },
  { id: 'goog-8',   brandId: 'brand-google', name: 'Pixel 8',      category: 'premium',  releaseYear: 2023, basePrice128GB: 19000 },
  { id: 'goog-8a',  brandId: 'brand-google', name: 'Pixel 8a',     category: 'midrange', releaseYear: 2024, basePrice128GB: 14500 },
  { id: 'goog-7p',  brandId: 'brand-google', name: 'Pixel 7 Pro',  category: 'premium',  releaseYear: 2022, basePrice128GB: 20000 },
  { id: 'goog-7',   brandId: 'brand-google', name: 'Pixel 7',      category: 'midrange', releaseYear: 2022, basePrice128GB: 12000 },
  { id: 'goog-7a',  brandId: 'brand-google', name: 'Pixel 7a',     category: 'midrange', releaseYear: 2023, basePrice128GB: 11000 },
  { id: 'goog-6p',  brandId: 'brand-google', name: 'Pixel 6 Pro',  category: 'midrange', releaseYear: 2021, basePrice128GB:  8500 },
  { id: 'goog-6',   brandId: 'brand-google', name: 'Pixel 6',      category: 'budget',   releaseYear: 2021, basePrice128GB:  6000 },
  { id: 'goog-6a',  brandId: 'brand-google', name: 'Pixel 6a',     category: 'budget',   releaseYear: 2022, basePrice128GB:  6500 },
] as Model[];

// Helper to programmatically generate variants for a model
export function generateVariantsForModel(model: Model): Variant[] {
  const storages = [
    { gb: 64, multiplier: 0.90 },
    { gb: 128, multiplier: 1.00 },
    { gb: 256, multiplier: 1.12 },
    { gb: 512, multiplier: 1.28 },
    { gb: 1024, multiplier: 1.48 } // 1TB
  ];

  // Adjust storage options based on model tier to keep it realistic
  let modelStorages = storages;
  if (model.category === 'budget') {
    modelStorages = storages.filter(s => s.gb <= 256);
  } else if (model.category === 'midrange') {
    modelStorages = storages.filter(s => s.gb >= 128 && s.gb <= 512);
  } else {
    modelStorages = storages.filter(s => s.gb >= 128);
  }

  const colors = model.brandId === 'brand-apple' 
    ? ['Natural Titanium', 'Space Black', 'Silver', 'Blue Titanium']
    : ['Obsidian Black', 'Marble Gray', 'Cobalt Violet', 'Titanium Yellow'];

  const variants: Variant[] = [];
  modelStorages.forEach(s => {
    colors.slice(0, s.gb === 1024 ? 2 : 4).forEach(color => {
      variants.push({
        id: `var-${model.id}-${s.gb}-${color.toLowerCase().replace(/\s+/g, '-')}`,
        modelId: model.id,
        storageGb: s.gb,
        color,
        basePrice: Math.round(model.basePrice128GB * s.multiplier)
      });
    });
  });

  return variants;
}

// 3. Dynamic Defect Rules tailored by model category
export function getDefectRulesForCategory(category: DeviceCategory): DefectRule[] {
  // Flagships have higher cost percentages for screens, midrange/budget are more fixed-heavy.
  const screenPct = category === 'flagship' ? 0.28 : category === 'premium' ? 0.22 : 0.18;
  const bodyPct = category === 'flagship' ? 0.12 : category === 'premium' ? 0.10 : 0.08;
  const cameraPct = category === 'flagship' ? 0.15 : category === 'premium' ? 0.12 : 0.08;

  return [
    // SCREEN DEFECTS
    {
      id: 'defect-screen-cracked',
      category: 'screen',
      description: 'Cracked Screen / Back Glass',
      subText: 'Visible cracks, deep chips, or shattered glass panels.',
      deductionFixed: 0,
      deductionPercentage: screenPct
    },
    {
      id: 'defect-screen-scratches',
      category: 'screen',
      description: 'Light Screen Scratches',
      subText: 'Minor hair-line scratches visible under direct light, no cracks.',
      deductionFixed: 1000,
      deductionPercentage: 0.03
    },
    {
      id: 'defect-screen-burn',
      category: 'screen',
      description: 'Screen Burn-in / Lines',
      subText: 'Discoloration, pixel bleeding, or permanent glowing lines.',
      deductionFixed: 0,
      deductionPercentage: screenPct + 0.05
    },

    // BODY DEFECTS
    {
      id: 'defect-body-dented',
      category: 'body',
      description: 'Dented or Bent Frame',
      subText: 'Deep frame dents, heavy paint chipping, or structural bending.',
      deductionFixed: 1500,
      deductionPercentage: bodyPct
    },
    {
      id: 'defect-body-scuffs',
      category: 'body',
      description: 'Scuffed Frame / Normal Wear',
      subText: 'Minor surface scuffs and normal paint wear from case usage.',
      deductionFixed: 800,
      deductionPercentage: 0.02
    },

    // CAMERA DEFECTS
    {
      id: 'defect-camera-faulty',
      category: 'camera',
      description: 'Faulty Lens / Blur',
      subText: 'Camera lens scratched, cracked, autofocus failing, or image blur.',
      deductionFixed: 1000,
      deductionPercentage: cameraPct
    },

    // BATTERY DEFECTS
    {
      id: 'defect-battery-low',
      category: 'battery',
      description: 'Battery Health < 80%',
      subText: 'Device drains quickly, shows service warning, or battery health is low.',
      deductionFixed: 2000,
      deductionPercentage: 0.04
    },

    // ACCESSORIES & BOX (FIXED VALUE DEDUCTIONS)
    {
      id: 'defect-box-missing',
      category: 'accessories',
      description: 'Missing Original Box',
      subText: 'Original retail box with matching serial/IMEI is not available.',
      deductionFixed: category === 'flagship' ? 2500 : 1200,
      deductionPercentage: 0
    },
    {
      id: 'defect-charger-missing',
      category: 'accessories',
      description: 'Missing Original Charger / Cable',
      subText: 'OEM charging brick or cable is not included.',
      deductionFixed: 1500,
      deductionPercentage: 0
    },

    // CRITICAL SYSTEM FAILURES (COMPUTED TO 0 VALUE)
    {
      id: 'defect-critical-power',
      category: 'accessories', // general category
      description: 'Device Does Not Turn On',
      subText: 'Completely dead, liquid damaged, boot-looped, or fails to charge.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    },
    {
      id: 'defect-critical-security',
      category: 'accessories',
      description: 'Biometrics Faulty (FaceID/TouchID)',
      subText: 'Face ID or fingerprint scanner does not work or has hardware failure.',
      deductionFixed: 0,
      deductionPercentage: 0.25
    }
  ];
}
