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
  category: 'screen' | 'body' | 'camera' | 'functionality' | 'connectivity' | 'accessories';
  description: string;
  subText: string;
  deductionFixed: number;       // Fixed INR penalty
  deductionPercentage: number;  // Percentage deduction (0 to 1)
  isCriticalFailure?: boolean;  // If true, device has zero value
}

// 3. Dynamic Defect Rules tailored by model category
export function getDefectRulesForCategory(category: DeviceCategory): DefectRule[] {
  const screenPct   = category === 'flagship' ? 0.28 : category === 'premium' ? 0.22 : 0.18;
  const bodyDentPct = category === 'flagship' ? 0.08 : category === 'premium' ? 0.07 : 0.06;
  const cameraPct   = category === 'flagship' ? 0.15 : category === 'premium' ? 0.12 : 0.08;

  return [
    // ── SCREEN ───────────────────────────────────────────────────────────
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
      description: 'Front Glass Scratches / Bubbles',
      subText: 'Scratches or air bubbles visible under the screen protector / direct light.',
      deductionFixed: 1000,
      deductionPercentage: 0.03
    },
    {
      id: 'defect-screen-burn',
      category: 'screen',
      description: 'Screen Burn-in / Lines',
      subText: 'Discoloration, pixel bleeding, or permanent glowing lines on display.',
      deductionFixed: 0,
      deductionPercentage: screenPct  // same cost as crack replacement — was incorrectly +5%
    },
    {
      id: 'defect-screen-touch',
      category: 'screen',
      description: 'Touch / Swipe Unresponsive',
      subText: 'Dead zones, ghost touches, or unresponsive areas when swiping across the screen.',
      deductionFixed: 0,
      deductionPercentage: 0.15  // raised from 10% — touch failure = device barely usable
    },
    {
      id: 'defect-screen-truetone',
      category: 'screen',
      description: 'True Tone Not Working',
      subText: 'True Tone toggle missing in Display settings — indicates non-original screen replacement.',
      deductionFixed: category === 'flagship' ? 2500 : 1500,
      deductionPercentage: 0
    },

    // ── BODY ─────────────────────────────────────────────────────────────
    {
      id: 'defect-body-dented',
      category: 'body',
      description: 'Dented or Bent Frame',
      subText: 'Deep frame dents, heavy paint chipping, or structural bending.',
      deductionFixed: 1000,           // reduced from ₹1,500
      deductionPercentage: bodyDentPct // now 8% flagship vs old 12%
    },
    {
      id: 'defect-body-scuffs',
      category: 'body',
      description: 'Scuffed Frame / Normal Wear',
      subText: 'Minor surface scuffs and normal paint wear from case usage.',
      deductionFixed: 800,
      deductionPercentage: 0.02
    },
    {
      id: 'defect-body-airpass',
      category: 'body',
      description: 'Air Pass / Waterproof Seal Fail',
      subText: 'Barometer/air pressure test fails — seal compromised from drops or prior repair.',
      deductionFixed: category === 'flagship' ? 1500 : 800,
      deductionPercentage: 0
    },
    {
      id: 'defect-body-buttons',
      category: 'body',
      description: 'Side Buttons Faulty',
      subText: 'Volume up/down, Power, or Mute/Action button is stuck, loose, or unresponsive.',
      deductionFixed: 1200,
      deductionPercentage: 0
    },
    {
      id: 'defect-body-screws',
      category: 'body',
      description: 'Screws Stripped / Missing',
      subText: 'Bottom pentalobe screws are stripped, damaged, or replaced with non-OEM screws.',
      deductionFixed: 700,  // raised from ₹400 — stripped screws = tamper flag
      deductionPercentage: 0
    },

    // ── CAMERA ───────────────────────────────────────────────────────────
    {
      id: 'defect-camera-faulty',
      category: 'camera',
      description: 'Camera Faulty / Lens Blur',
      subText: 'Front/rear camera scratched, autofocus failing, portrait or cinematic modes not working.',
      deductionFixed: 1000,
      deductionPercentage: cameraPct
    },

    // ── HARDWARE FUNCTIONALITY (Step 3) ──────────────────────────────────
    {
      id: 'defect-critical-security',
      category: 'functionality',
      description: 'Biometrics Faulty (Face ID)',
      subText: 'Face ID does not recognise face, fails to set up, or sensor has hardware failure.',
      deductionFixed: 0,
      deductionPercentage: 0.20  // reduced from 25% — device still usable with passcode
    },
    {
      id: 'defect-func-audio',
      category: 'functionality',
      description: 'Speakers / Microphone Faulty',
      subText: 'Stereo speakers sound distorted/low, or Voice Memos mic test reveals microphone failure.',
      deductionFixed: 2800,  // raised from ₹1,800 — speaker+mic repair cost in India
      deductionPercentage: 0
    },
    {
      id: 'defect-func-restart',
      category: 'functionality',
      description: 'Auto-Restart / Unstable Device',
      subText: 'Device randomly reboots within 3 minutes of idle use — indicates PMIC/board-level issue.',
      deductionFixed: 0,
      deductionPercentage: 0.15  // reduced from 18%
    },

    // ── CONNECTIVITY & VERIFICATION (Step 4) ─────────────────────────────
    {
      id: 'defect-battery-low',
      category: 'connectivity',
      description: 'Battery Health < 80%',
      subText: 'Device drains quickly, shows service warning, or battery health is below 80%.',
      deductionFixed: 2500,         // raised from ₹2,000
      deductionPercentage: 0.05     // raised from 4%
    },
    {
      id: 'defect-battery-warning',
      category: 'connectivity',
      description: 'Non-Genuine Battery Warning',
      subText: '"Important Battery Message" alert visible in Settings → Battery — battery is non-OEM.',
      deductionFixed: 2000,
      deductionPercentage: 0.015   // added % component — ongoing risk
    },
    {
      id: 'defect-func-network',
      category: 'connectivity',
      description: 'Network, Calling & SIM Issues',
      subText: 'No cellular signal, call audio breaks, or SIM restriction shows carrier lock (not "No SIM Restrictions").',
      deductionFixed: 0,
      deductionPercentage: 0.10
    },
    {
      id: 'defect-func-wireless',
      category: 'connectivity',
      description: 'Wi-Fi & Bluetooth Issues',
      subText: 'Wi-Fi drops connection, fails to detect networks, or Bluetooth cannot pair/connect.',
      deductionFixed: 0,
      deductionPercentage: 0.07
    },
    {
      id: 'defect-func-partmatch',
      category: 'connectivity',
      description: '3uTools Serial Mismatch',
      subText: 'PC diagnostic shows motherboard serial does not match screen/battery/camera — parts replaced.',
      deductionFixed: 0,
      deductionPercentage: 0.12
    },

    // ── ACCESSORIES & DOCUMENTATION (Step 5) ─────────────────────────────
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
    {
      id: 'defect-acc-nodocs',
      category: 'accessories',
      description: 'Missing Bill / Customer Photo ID',
      subText: 'Purchase bill/invoice or seller photo ID not available — affects legal resale compliance.',
      deductionFixed: 1500,  // raised from ₹800
      deductionPercentage: 0
    },

    // ── CRITICAL FAILURES (Zero Value) ───────────────────────────────────
    {
      id: 'defect-critical-power',
      category: 'accessories',
      description: 'Device Does Not Turn On',
      subText: 'Completely dead, liquid damaged, boot-looped, or fails to charge.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    },
    {
      id: 'defect-critical-icloud',
      category: 'accessories',
      description: 'iCloud / Apple ID Locked',
      subText: 'Find My iPhone is ON and Apple ID cannot be signed out — device is activation locked.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    }
  ];
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
