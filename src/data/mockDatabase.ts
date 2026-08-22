import phoneImages from './phoneImages.json';
import actualPrices from './actualPrices.json';


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
  basePrice128GB: number; // Anchor price in INR (lowest variant or explicit)
  series?: string;        // Sub-category or series designation
  imageUrl?: string;      // Custom image URL or Data URL
  supportedStorageGb?: number[]; // Storage tiers e.g. [128, 256, 512, 1024]
  supportedRamGb?: number[];     // RAM tiers e.g. [6, 8, 12]; [0] = no RAM variants (Apple)
  variantPrices?: Record<string, number>; // key: "ramGb_storageGb" e.g. "8_256" → 84900
  hidden?: boolean;                       // If true, hidden from frontend (disable selling)
}

export interface Variant {
  id: string;
  modelId: string;
  storageGb: number;
  ramGb?: number;     // RAM capacity in GB (e.g. 4, 6, 8, 12, 16); 0 or undefined for Apple
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

// Helper to identify Apple devices vs Android / non-Apple
export function isAppleDevice(brandId?: string, modelName?: string): boolean {
  if (!brandId && !modelName) return false;
  const b = (brandId || '').toLowerCase();
  const m = (modelName || '').toLowerCase();
  return b === 'brand-apple' || b === 'apple' || m.includes('iphone') || m.includes('ipad') || m.includes('apple') || m.includes('watch');
}

export function isSmartwatchDevice(brandId?: string, modelName?: string, modelId?: string): boolean {
  if (modelId && SMARTWATCH_MODELS.some(m => m.id === modelId)) return true;
  const b = (brandId || '').toLowerCase();
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();
  return m.includes('watch') || id.includes('watch') || b.includes('watch');
}

export function isTabletDevice(_brandId?: string, modelName?: string, modelId?: string): boolean {
  if (modelId && TABLET_MODELS.some(m => m.id === modelId)) return true;
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();
  return m.includes('ipad') || m.includes('tab') || id.includes('ipad') || id.includes('tab');
}

export function getSmartwatchDefectRules(
  category: DeviceCategory,
  brandId?: string,
  modelName?: string
): DefectRule[] {
  const isApple = isAppleDevice(brandId, modelName);
  const screenPct   = category === 'flagship' ? 0.30 : category === 'premium' ? 0.24 : 0.18;
  const bodyDentPct = category === 'flagship' ? 0.08 : category === 'premium' ? 0.06 : 0.04;
  const fixedBody   = category === 'flagship' ? 2500 : category === 'premium' ? 1500 : 1000;

  return [
    // ── BOOT & PAIR LOCK ─────────────────────────────────────────────────
    {
      id: 'defect-critical-power',
      category: 'accessories',
      description: 'Smartwatch Does Not Turn On',
      subText: 'Watch screen stays dark, no haptic boot feedback, or battery fails to accept charge.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    },
    {
      id: 'defect-critical-icloud',
      category: 'accessories',
      description: isApple ? 'iCloud / Apple Watch Activation Locked' : 'Samsung Account / Google Knox Lock Active',
      subText: isApple 
        ? 'Apple Watch is still paired to an Apple ID or Activation Lock is enabled on iCloud.'
        : 'Galaxy Watch is still paired to a Samsung/Google account or Knox security lock is active.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    },

    // ── DISPLAY & WATCH DIAL ─────────────────────────────────────────────
    {
      id: 'defect-watch-screen-cracked',
      category: 'screen',
      description: isApple ? 'Cracked Watch Glass / Sapphire Dial' : 'Cracked Super AMOLED / Gorilla Glass',
      subText: 'Visible cracks, chipped edges, or shattered top crystal lens.',
      deductionFixed: 0,
      deductionPercentage: screenPct
    },
    {
      id: 'defect-watch-screen-scratches',
      category: 'screen',
      description: 'Glass Lens & Bezel Micro-Scratches',
      subText: 'Scratches on the watch crystal face or visible bezel abrasions under direct light.',
      deductionFixed: category === 'flagship' ? 1500 : 800,
      deductionPercentage: 0.03
    },
    {
      id: 'defect-watch-screen-burn',
      category: 'screen',
      description: 'Always-On Display Burn-in / Lines',
      subText: 'Ghosting, OLED image retention, or vertical glowing lines on watch face.',
      deductionFixed: 0,
      deductionPercentage: 0.22
    },
    {
      id: 'defect-watch-screen-touch',
      category: 'screen',
      description: 'Touchscreen / Touch Bezel Unresponsive',
      subText: 'Unresponsive taps, ghost swipes, or digital touch layer failure.',
      deductionFixed: 0,
      deductionPercentage: 0.15
    },

    // ── CASING, CROWN & WATER SEAL ────────────────────────────────────────
    {
      id: 'defect-watch-body-dented',
      category: 'body',
      description: isApple ? 'Titanium / Aluminum Casing Dented' : 'Armor Aluminum / Stainless Casing Dented',
      subText: 'Deep frame dents, heavy metal gouges, or damaged watch lug mounts.',
      deductionFixed: fixedBody,
      deductionPercentage: bodyDentPct
    },
    {
      id: 'defect-watch-crown-faulty',
      category: 'body',
      description: isApple ? 'Digital Crown / Action Button Faulty' : 'Rotating Bezel / Home Button Faulty',
      subText: isApple 
        ? 'Digital Crown rotary scroll, press click, or side Action button is stuck/unresponsive.'
        : 'Rotating physical/touch bezel or side power buttons are sticky/loose/faulty.',
      deductionFixed: isApple ? 2200 : 1600,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-water-seal',
      category: 'body',
      description: 'Water Resistance Seal Fail (50m/100m)',
      subText: 'Seal compromised from high-velocity water, drops, or prior repair opening.',
      deductionFixed: category === 'flagship' ? 2000 : 1200,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-strap-damaged',
      category: 'body',
      description: 'Original Watch Band / Strap Missing or Heavy Damage',
      subText: 'Original OEM sport band, loop, or leather strap is missing or torn.',
      deductionFixed: isApple ? 2000 : 1400,
      deductionPercentage: 0
    },

    // ── HEALTH & BIOMETRIC SENSORS ────────────────────────────────────────
    {
      id: 'defect-watch-sensor-heart',
      category: 'functionality',
      description: 'PPG Heart Rate & SpO2 Sensor Faulty',
      subText: 'Optical heart rate monitor or Blood Oxygen sensor fails to read pulse/oxygen levels.',
      deductionFixed: 2500,
      deductionPercentage: 0.08
    },
    {
      id: 'defect-watch-sensor-ecg',
      category: 'functionality',
      description: isApple ? 'ECG App / Electrical Heart Sensor Fail' : 'ECG / BIA Body Composition Sensor Fail',
      subText: 'Electrical heart sensor electrodes in Digital Crown/back crystal fail ECG recording.',
      deductionFixed: 2000,
      deductionPercentage: 0.05
    },
    {
      id: 'defect-watch-sensor-motion',
      category: 'functionality',
      description: 'Fall & Crash Detection Sensors Faulty',
      subText: 'High-g accelerometer or gyroscope calibration error affecting workout/fall detection.',
      deductionFixed: 1800,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-speaker-mic',
      category: 'functionality',
      description: isApple ? 'Speaker, Mic or Emergency Siren Faulty' : 'Speaker / Microphone Call Audio Faulty',
      subText: 'Siri/voice assistant mic unresponsive, call audio crackles, or speaker low volume.',
      deductionFixed: 2200,
      deductionPercentage: 0
    },

    // ── BATTERY & CONNECTIVITY ────────────────────────────────────────────
    {
      id: 'defect-watch-battery-health',
      category: 'connectivity',
      description: 'Battery Maximum Capacity < 80%',
      subText: 'Watch battery drains in < 12 hours or shows "Service Recommended" alert in Settings.',
      deductionFixed: isApple ? 2200 : 1600,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-charging-puck',
      category: 'connectivity',
      description: 'Wireless Magnetic Receiver Charge Faulty',
      subText: 'Fails to charge when placed on magnetic inductive charging puck.',
      deductionFixed: 2000,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-cellular-esim',
      category: 'connectivity',
      description: 'Cellular / LTE eSIM Functionality Faulty',
      subText: 'eSIM fails to activate, cellular antenna drops signal, or standalone LTE calling fails.',
      deductionFixed: 2500,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-wireless-gps',
      category: 'connectivity',
      description: 'Wi-Fi, Bluetooth & Dual-Frequency GPS Fail',
      subText: 'Fails to pair with phone over Bluetooth, Wi-Fi sync drops, or outdoor GPS tracking fails.',
      deductionFixed: 1800,
      deductionPercentage: 0
    },

    // ── ACCESSORIES & PACKAGING ───────────────────────────────────────────
    {
      id: 'defect-watch-charger-missing',
      category: 'accessories',
      description: 'Missing Original Magnetic Fast Charging Puck',
      subText: 'Original OEM magnetic charging cable/puck is not included.',
      deductionFixed: isApple ? 1500 : 1200,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-box-missing',
      category: 'accessories',
      description: 'Missing Original Retail Watch Box',
      subText: 'Original packaging box with matching watch serial number is missing.',
      deductionFixed: category === 'flagship' ? 1000 : 600,
      deductionPercentage: 0
    },
    {
      id: 'defect-watch-bill-missing',
      category: 'accessories',
      description: 'Missing Bill / Customer Photo ID',
      subText: 'Original tax invoice or valid government photo ID not available.',
      deductionFixed: 1200,
      deductionPercentage: 0
    }
  ];
}

// 3. Dynamic Defect Rules tailored by model category and brand
export function getDefectRulesForCategory(
  category: DeviceCategory, 
  brandId?: string, 
  modelName?: string,
  modelId?: string
): DefectRule[] {
  if (isSmartwatchDevice(brandId, modelName, modelId)) {
    return getSmartwatchDefectRules(category, brandId, modelName);
  }

  const isApple = isAppleDevice(brandId, modelName);
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
      deductionPercentage: screenPct
    },
    {
      id: 'defect-screen-touch',
      category: 'screen',
      description: 'Touch / Swipe Unresponsive',
      subText: 'Dead zones, ghost touches, or unresponsive areas when swiping across the screen.',
      deductionFixed: 0,
      deductionPercentage: 0.15
    },
    {
      id: 'defect-screen-truetone',
      category: 'screen',
      description: isApple ? 'True Tone Not Working' : 'Display Calibration / Tint Issue',
      subText: isApple 
        ? 'True Tone toggle missing in Display settings — indicates non-original screen replacement.'
        : 'Screen color profile sync or auto-brightness calibration failing — indicates non-OEM display.',
      deductionFixed: category === 'flagship' ? 2500 : 1500,
      deductionPercentage: 0
    },

    // ── BODY ─────────────────────────────────────────────────────────────
    {
      id: 'defect-body-dented',
      category: 'body',
      description: 'Dented or Bent Frame',
      subText: 'Deep frame dents, heavy paint chipping, or structural bending.',
      deductionFixed: 1000,
      deductionPercentage: bodyDentPct
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
      description: isApple ? 'Screws Stripped / Missing' : 'Bottom Screws Stripped / Missing',
      subText: isApple 
        ? 'Bottom pentalobe screws are stripped, damaged, or replaced with non-OEM screws.'
        : 'Bottom housing screws are stripped, damaged, or replaced with non-OEM hardware.',
      deductionFixed: 700,
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
      description: isApple ? 'Biometrics Faulty (Face ID)' : 'Biometrics Faulty (Fingerprint / Face Unlock)',
      subText: isApple 
        ? 'Face ID does not recognise face, fails to set up, or sensor has hardware failure.'
        : 'Fingerprint scanner or Face Unlock fails to recognize, setup error, or hardware fault.',
      deductionFixed: 0,
      deductionPercentage: 0.20
    },
    {
      id: 'defect-func-audio',
      category: 'functionality',
      description: 'Speakers / Microphone Faulty',
      subText: 'Stereo speakers sound distorted/low, or Voice Memos mic test reveals microphone failure.',
      deductionFixed: 2800,
      deductionPercentage: 0
    },
    {
      id: 'defect-func-restart',
      category: 'functionality',
      description: 'Auto-Restart / Unstable Device',
      subText: 'Device randomly reboots within 3 minutes of idle use — indicates PMIC/board-level issue.',
      deductionFixed: 0,
      deductionPercentage: 0.15
    },

    // ── CONNECTIVITY & VERIFICATION (Step 4) ─────────────────────────────
    {
      id: 'defect-battery-low',
      category: 'connectivity',
      description: 'Battery Health < 80%',
      subText: 'Device drains quickly, shows service warning, or battery health is below 80%.',
      deductionFixed: 2500,
      deductionPercentage: 0.05
    },
    {
      id: 'defect-battery-warning',
      category: 'connectivity',
      description: isApple ? 'Non-Genuine Battery Warning' : 'Non-OEM / Battery Warning Alert',
      subText: isApple 
        ? '"Important Battery Message" alert visible in Settings → Battery — battery is non-OEM.'
        : 'Non-OEM battery alert or degraded battery controller alert in System Settings.',
      deductionFixed: 2000,
      deductionPercentage: 0.015
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
      description: isApple ? '3uTools Serial Mismatch' : 'PC Diagnostic Serial Mismatch',
      subText: isApple 
        ? 'PC diagnostic shows motherboard serial does not match screen/battery/camera — parts replaced.'
        : 'Hardware diagnostic tool shows serial numbers do not match original motherboard registry.',
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
      deductionFixed: 1500,
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
      description: isApple ? 'iCloud / Apple ID Locked' : 'Google Account / Factory Reset Protection Locked',
      subText: isApple 
        ? 'Find My iPhone is ON and Apple ID cannot be signed out — device is activation locked.'
        : 'Google Factory Reset Protection or Brand Account lock is active — device is activation locked.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    }
  ];
}

// 1. Brands List
export const BRANDS: Brand[] = [
  { id: 'brand-apple', name: 'Apple', logo: 'apple' },
  { id: 'brand-samsung', name: 'Samsung', logo: 'samsung' },
  { id: 'brand-google', name: 'Google', logo: 'google' },
  { id: 'brand-oneplus', name: 'OnePlus', logo: 'oneplus' },
  { id: 'brand-xiaomi', name: 'Xiaomi', logo: 'xiaomi' },
  { id: 'brand-vivo', name: 'vivo', logo: 'vivo' },
  { id: 'brand-oppo', name: 'OPPO', logo: 'oppo' },
  { id: 'brand-nothing', name: 'Nothing', logo: 'nothing' },
  { id: 'brand-motorola', name: 'Motorola', logo: 'motorola' },
];

const catalogId = (brandId: string, name: string) =>
  `catalog-${brandId.replace('brand-', '')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const catalogCategory = (name: string): DeviceCategory => {
  if (/ultra|pro max|fold|flip|x300|x200 pro|x100 pro|find x|s26 ultra|s25 ultra/i.test(name)) return 'flagship';
  if (/\bpro\b/i.test(name)) {
    if (/oppo (a|f|k)|vivo (y|t)|galaxy (a|f|m)|redmi|poco|realme/i.test(name)) return 'midrange';
    return 'flagship';
  }
  if (/\bplus\b|edge|air|reno|razr|v\d+ elite|\biphone 17\b|\biphone 16\b|\bgalaxy s2\d\b/i.test(name)) return 'premium';
  if (/\b(a|y|m|f|g)\d|lite|ce|cmf|\b\d+e\b|\b\d+c\b/i.test(name)) return 'budget';
  return 'midrange';
};

// Cashify Predictive Pricing Engine (Diminishing Storage Step Model)
const getCashifyBasePrice256GB = (brandId: string, name: string, category: DeviceCategory, releaseYear: number): number => {
  if (name === 'iPhone 17 Pro Max') return 109000;
  if (name === 'iPhone 17 Pro') return 101000;
  if (name === 'iPhone 17 Air') return 85000;
  if (name === 'iPhone 17') return 59000;
  if (name === 'iPhone 17e') return 43000;
  if (name === 'iPhone 16 Pro Max') return 96000;
  if (name === 'iPhone 16 Pro') return 86800;

  // General Cashify prediction formula for non-benchmark models
  let base256 = 15000;
  if (category === 'flagship') base256 = 58000;
  else if (category === 'premium') base256 = 36000;
  else if (category === 'midrange') base256 = 18000;
  else if (category === 'budget') base256 = 10000;

  let brandMult = 1.0;
  if (brandId === 'brand-apple') brandMult = 1.35;
  else if (brandId === 'brand-samsung') brandMult = /fold|flip|ultra|s2/i.test(name) ? 1.15 : 0.9;
  else if (brandId === 'brand-google') brandMult = 1.05;
  else if (brandId === 'brand-oneplus') brandMult = 1.0;
  else if (brandId === 'brand-vivo' || brandId === 'brand-oppo') brandMult = /ultra|pro|find x|x\d+/i.test(name) ? 1.05 : 0.85;

  let yearFactor = 1.0;
  if (releaseYear >= 2026) yearFactor = 1.30;
  else if (releaseYear === 2025) yearFactor = 1.15;
  else if (releaseYear === 2024) yearFactor = 1.0;
  else if (releaseYear === 2023) yearFactor = 0.85;
  else if (releaseYear === 2022) yearFactor = 0.72;
  else if (releaseYear === 2021) yearFactor = 0.56;
  else if (releaseYear === 2020) yearFactor = 0.42;
  else if (releaseYear === 2019) yearFactor = 0.32;
  else yearFactor = 0.25;

  let bonus = 0;
  if (/ultra|pro max|fold/i.test(name)) bonus += 8000;
  else if (/mini\b|pro mini/i.test(name)) bonus += 1500;
  else if (/pro\b|plus|flip|air/i.test(name)) bonus += 4000;

  return Math.round((base256 * brandMult * yearFactor + bonus) / 500) * 500;
};

// Predict Cashify price for ANY storage variant
export const predictCashifyPrice = (brandId: string, name: string, category: DeviceCategory, releaseYear: number, storageGb: number): number => {
  const base256 = getCashifyBasePrice256GB(brandId, name, category, releaseYear);

  if (storageGb === 256) return base256;
  if (storageGb === 128) return Math.max(3500, base256 - 6000);

  if (storageGb === 512) {
    if (/17e/i.test(name)) return base256 + 9200;
    if (/pro max/i.test(name)) return base256 + 6500;
    if (/pro\b|air/i.test(name)) return base256 + 5000;
    return base256 + 5500;
  }

  if (storageGb === 1024) {
    const p512 = predictCashifyPrice(brandId, name, category, releaseYear, 512);
    if (/pro max/i.test(name)) return p512 + 4000;
    return p512 + 5000;
  }

  if (storageGb === 2048) {
    const p1024 = predictCashifyPrice(brandId, name, category, releaseYear, 1024);
    return p1024 + 5500;
  }

  return base256;
};

// Our Competitive Quote (+3% higher than Cashify prediction)
const catalogPrice = (brandId: string, name: string, category: DeviceCategory, releaseYear: number): number => {
  const cashify256 = getCashifyBasePrice256GB(brandId, name, category, releaseYear);
  const base128 = Math.max(3500, cashify256 - 6000);
  return Math.round((base128 * 1.03) / 500) * 500;
};

const CASHIFY_BENCHMARKS: Record<string, { supportedStorageGb: number[]; variantPrices: Record<string, number> }> = {
  'iPhone 17 Pro Max': {
    supportedStorageGb: [256, 512, 1024, 2048],
    variantPrices: {
      '0_256': Math.round(109000 * 1.03),
      '0_512': Math.round(115500 * 1.03),
      '0_1024': Math.round(119500 * 1.03),
      '0_2048': Math.round(125000 * 1.03),
    }
  },
  'iPhone 17 Pro': {
    supportedStorageGb: [256, 512, 1024],
    variantPrices: {
      '0_256': Math.round(101000 * 1.03),
      '0_512': Math.round(106000 * 1.03),
      '0_1024': Math.round(111000 * 1.03),
    }
  },
  'iPhone 17e': {
    supportedStorageGb: [256, 512],
    variantPrices: {
      '0_256': Math.round(43000 * 1.03),
      '0_512': Math.round(52200 * 1.03),
    }
  },
  'iPhone 17': {
    supportedStorageGb: [256, 512],
    variantPrices: {
      '0_256': Math.round(59000 * 1.03),
      '0_512': Math.round(64500 * 1.03),
    }
  }
};

const makeCatalogModels = (brandId: string, series: string, releaseYear: number, names: string[]): Model[] =>
  names.map((name) => {
    const category = catalogCategory(name);
    const benchmarkKey = Object.keys(CASHIFY_BENCHMARKS).find(key => name === key);
    const benchmark = benchmarkKey ? CASHIFY_BENCHMARKS[benchmarkKey] : undefined;

    let resolvedSeries = series;
    if (brandId === 'brand-xiaomi') {
      const lower = name.toLowerCase();
      if (lower.includes('poco f')) resolvedSeries = 'POCO F Series';
      else if (lower.includes('poco x')) resolvedSeries = 'POCO X Series';
      else if (lower.includes('poco m')) resolvedSeries = 'POCO M Series';
      else if (lower.includes('poco c')) resolvedSeries = 'POCO C Series';
      else if (lower.includes('redmi note')) resolvedSeries = 'Redmi Note Series';
      else if (lower.includes('redmi')) resolvedSeries = 'Redmi Series';
      else if (lower.includes('xiaomi') || lower.includes('mi')) resolvedSeries = 'Xiaomi Series';
    }

    return {
      id: catalogId(brandId, name),
      brandId,
      name,
      category,
      releaseYear,
      basePrice128GB: catalogPrice(brandId, name, category, releaseYear),
      series: resolvedSeries,
      supportedStorageGb: benchmark ? benchmark.supportedStorageGb : undefined,
      variantPrices: benchmark ? benchmark.variantPrices : undefined,
    };
  });

// Models requested for the current catalog that were not part of the original data set.
const CATALOG_ADDITIONS: Model[] = [
  ...makeCatalogModels('brand-apple', 'iPhone 17 Series', 2025, ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17 Air', 'iPhone 17', 'iPhone 17e']),
  ...makeCatalogModels('brand-samsung', 'S Series', 2026, ['Galaxy S26 Ultra', 'Galaxy S26 Plus', 'Galaxy S26']),
  ...makeCatalogModels('brand-samsung', 'S Series', 2025, ['Galaxy S25 FE', 'Galaxy S25 Edge']),
  ...makeCatalogModels('brand-samsung', 'Z Fold & Z Flip', 2025, ['Galaxy Z Fold 7', 'Galaxy Z Flip 7', 'Galaxy Z Flip 7 FE']),
  ...makeCatalogModels('brand-samsung', 'A Series', 2025, ['Galaxy A17', 'Galaxy A27', 'Galaxy A37', 'Galaxy A57']),
  ...makeCatalogModels('brand-samsung', 'F Series', 2025, ['Galaxy F07', 'Galaxy F70']),
  ...makeCatalogModels('brand-samsung', 'M Series', 2025, ['Galaxy M07']),
  ...makeCatalogModels('brand-samsung', 'Z Fold & Z Flip', 2026, ['Galaxy Z Fold 8', 'Galaxy Z Fold 8 Ultra', 'Galaxy Z Flip 8']),
  ...makeCatalogModels('brand-samsung', 'M Series', 2026, ['Galaxy M47']),
  ...makeCatalogModels('brand-samsung', 'F Series', 2026, ['Galaxy F47']),
  ...makeCatalogModels('brand-vivo', 'X Series & Folds', 2025, ['vivo X300 Ultra', 'vivo X300 Pro', 'vivo X300', 'vivo X300 FE', 'vivo X5 Fold']),
  ...makeCatalogModels('brand-vivo', 'V Series', 2025, ['vivo V70', 'vivo V70 Elite', 'vivo V70 FE', 'vivo V60', 'vivo V60e']),
  ...makeCatalogModels('brand-vivo', 'T Series', 2025, ['vivo T4', 'vivo T4x', 'vivo T4 Lite', 'vivo T4 Ultra', 'vivo T5x', 'vivo T5 Pro']),
  ...makeCatalogModels('brand-vivo', 'Y Series', 2025, ['vivo Y400', 'vivo Y400 Pro']),
  ...makeCatalogModels('brand-vivo', 'S Series', 2026, ['vivo S2']),
  ...makeCatalogModels('brand-oppo', 'A Series', 2025, ['OPPO A3', 'OPPO A3x', 'OPPO A3 Pro', 'OPPO A5', 'OPPO A5x', 'OPPO A5 Pro', 'OPPO A6', 'OPPO A6 Pro', 'OPPO A6x']),
  ...makeCatalogModels('brand-oppo', 'F Series', 2025, ['OPPO F21', 'OPPO F21 Pro 5G', 'OPPO F23', 'OPPO F23 Pro', 'OPPO F25', 'OPPO F25 Pro', 'OPPO F27', 'OPPO F27 Pro+', 'OPPO F29', 'OPPO F29 Pro', 'OPPO F31', 'OPPO F31 Pro', 'OPPO F31 Pro+', 'OPPO F33', 'OPPO F33 Pro']),
  ...makeCatalogModels('brand-oppo', 'Reno Series', 2025, ['OPPO Reno 8', 'OPPO Reno 8 Pro', 'OPPO Reno 10', 'OPPO Reno 10 Pro', 'OPPO Reno 10 Pro+', 'OPPO Reno 11', 'OPPO Reno 11 Pro', 'OPPO Reno 12', 'OPPO Reno 12 Pro', 'OPPO Reno 13', 'OPPO Reno 13 Pro', 'OPPO Reno 14', 'OPPO Reno 14 Pro', 'OPPO Reno 15c', 'OPPO Reno 15', 'OPPO Reno 15 Pro', 'OPPO Reno 15 Pro Mini', 'OPPO Reno 16c', 'OPPO Reno 16']),
  ...makeCatalogModels('brand-oppo', 'Find X Series', 2025, ['OPPO Find X8', 'OPPO Find X8 Pro', 'OPPO Find X9', 'OPPO Find X9s', 'OPPO Find X9 Pro', 'OPPO Find X9 Ultra']),
  ...makeCatalogModels('brand-nothing', 'Phone Series', 2025, ['Nothing Phone 1', 'Nothing Phone 2', 'Nothing Phone 2a', 'Nothing Phone 2a Pro', 'Nothing Phone 3', 'Nothing Phone 3a', 'Nothing Phone 3a Pro', 'Nothing Phone 3a Pro+', 'Nothing Phone 4a', 'Nothing Phone 4a Pro', 'CMF Phone 1', 'CMF Phone 2']),
  ...makeCatalogModels('brand-oneplus', 'Numbered Series', 2025, ['OnePlus 8', 'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 9', 'OnePlus 9 Pro', 'OnePlus 9T', 'OnePlus 10', 'OnePlus 10 Pro', 'OnePlus Open Fold', 'OnePlus 11 Pro', 'OnePlus 11 Pro Marvel Edition', 'OnePlus 11R Red Edition', 'OnePlus 12 Pro', 'OnePlus 13', 'OnePlus 13R', 'OnePlus 13s', 'OnePlus 15', 'OnePlus 15R']),
  ...makeCatalogModels('brand-oneplus', 'Nord Series', 2025, ['OnePlus Nord 2 CE', 'OnePlus Nord 2 CE Lite', 'OnePlus Nord 2', 'OnePlus Nord 2T', 'OnePlus Nord CE 3', 'OnePlus Nord CE 3 Lite', 'OnePlus Nord CE 4 Lite', 'OnePlus Nord 5', 'OnePlus Nord 5 CE Lite', 'OnePlus Nord 5 CE', 'OnePlus Nord 6', 'OnePlus Nord CE 6', 'OnePlus Nord CE 6 Lite']),
  ...makeCatalogModels('brand-xiaomi', 'Redmi Series', 2025, ['Redmi 10', 'Redmi 10A', 'Redmi 11', 'Redmi 12', 'Redmi 13', 'Redmi 13c', 'Redmi 14', 'Redmi 14c', 'Redmi 15', 'Redmi 15c']),
  ...makeCatalogModels('brand-xiaomi', 'Redmi Note Series', 2025, ['Redmi Note 10', 'Redmi Note 10 Pro', 'Redmi Note 10 Pro+', 'Redmi Note 11', 'Redmi Note 11s', 'Redmi Note 11 Pro', 'Redmi Note 11 Pro+', 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro+', 'Redmi Note 13', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 14', 'Redmi Note 14 Pro', 'Redmi Note 14 Pro+', 'Redmi Note 15', 'Redmi Note 15 Pro', 'Redmi Note 15 Pro+']),
  ...makeCatalogModels('brand-xiaomi', 'Xiaomi Series', 2026, ['Xiaomi 11 Ultra', 'Xiaomi 14 Civi', 'Xiaomi 15', 'Xiaomi 15 Ultra', 'Xiaomi 16', 'Xiaomi 16 Ultra', 'Xiaomi 17', 'Xiaomi 17T', 'Xiaomi 17 Ultra']),
  ...makeCatalogModels('brand-xiaomi', 'POCO M Series', 2025, ['POCO M6', 'POCO M6 Pro', 'POCO M7', 'POCO M7 Pro', 'POCO M7 Pro+', 'POCO M8', 'POCO M8 Pro', 'POCO M8 Pro+']),
  ...makeCatalogModels('brand-xiaomi', 'POCO X Series', 2025, ['POCO X4', 'POCO X4 Pro', 'POCO X5', 'POCO X5 Pro', 'POCO X6', 'POCO X6 Pro', 'POCO X7', 'POCO X7 Pro', 'POCO X8 Pro', 'POCO X8 Pro Ultra']),
  ...makeCatalogModels('brand-xiaomi', 'POCO F Series', 2025, ['POCO F5', 'POCO F5 Pro', 'POCO F6', 'POCO F6 Pro', 'POCO F7']),
  ...makeCatalogModels('brand-motorola', 'G Series', 2025, ['Motorola G04', 'Motorola G05', 'Motorola G06', 'Motorola G36', 'Motorola G56', 'Motorola G57', 'Motorola G60', 'Motorola G67']),
  ...makeCatalogModels('brand-motorola', 'Edge Series', 2025, ['Motorola Edge 40', 'Motorola Edge 40 Fusion', 'Motorola Edge 50', 'Motorola Edge 50 Fusion', 'Motorola Edge 50 Ultra', 'Motorola Edge 60', 'Motorola Edge 60 Fusion', 'Motorola Edge 60 Pro', 'Motorola Edge 70', 'Motorola Edge 70 Fusion', 'Motorola Edge 70 Pro']),
  ...makeCatalogModels('brand-motorola', 'Razr Series', 2025, ['Motorola Razr 50', 'Motorola Razr 50 Ultra', 'Motorola Razr 60', 'Motorola Razr 60 Ultra']),
];

// 2. Models List (Comprehensive)
const BASE_MODELS: Model[] = [
  // --- APPLE ---
  { id: 'apple-17pm',   brandId: 'brand-apple', name: 'iPhone 17 Pro Max', category: 'flagship', releaseYear: 2025, basePrice128GB: 101000, series: 'iPhone 17 Series' },
  { id: 'apple-17p',    brandId: 'brand-apple', name: 'iPhone 17 Pro', category: 'flagship', releaseYear: 2025, basePrice128GB: 91000, series: 'iPhone 17 Series' },
  { id: 'apple-17air',  brandId: 'brand-apple', name: 'iPhone 17 Air', category: 'premium',  releaseYear: 2025, basePrice128GB: 77000, series: 'iPhone 17 Series' },
  { id: 'apple-17',     brandId: 'brand-apple', name: 'iPhone 17', category: 'premium',  releaseYear: 2025, basePrice128GB: 68500, series: 'iPhone 17 Series' },
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max', category: 'flagship', releaseYear: 2024, basePrice128GB: 86500, series: 'iPhone 16 Series' },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 78000, series: 'iPhone 16 Series' },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus', category: 'premium',  releaseYear: 2024, basePrice128GB: 59500, series: 'iPhone 16 Series' },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16', category: 'premium',  releaseYear: 2024, basePrice128GB: 52500, series: 'iPhone 16 Series' },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max', category: 'flagship', releaseYear: 2023, basePrice128GB: 71000, series: 'iPhone 15 Series' },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 61500, series: 'iPhone 15 Series' },
  { id: 'apple-15plus', brandId: 'brand-apple', name: 'iPhone 15 Plus', category: 'premium',  releaseYear: 2023, basePrice128GB: 37000, series: 'iPhone 15 Series' },
  { id: 'apple-15',     brandId: 'brand-apple', name: 'iPhone 15', category: 'premium',  releaseYear: 2023, basePrice128GB: 33000, series: 'iPhone 15 Series' },
  { id: 'apple-14pm',   brandId: 'brand-apple', name: 'iPhone 14 Pro Max', category: 'flagship', releaseYear: 2022, basePrice128GB: 37000, series: 'iPhone 14 Series' },
  { id: 'apple-14p',    brandId: 'brand-apple', name: 'iPhone 14 Pro', category: 'flagship', releaseYear: 2022, basePrice128GB: 35000, series: 'iPhone 14 Series' },
  { id: 'apple-14plus', brandId: 'brand-apple', name: 'iPhone 14 Plus', category: 'premium',  releaseYear: 2022, basePrice128GB: 26000, series: 'iPhone 14 Series' },
  { id: 'apple-14',     brandId: 'brand-apple', name: 'iPhone 14', category: 'premium',  releaseYear: 2022, basePrice128GB: 23000, series: 'iPhone 14 Series' },
  { id: 'apple-13pm',   brandId: 'brand-apple', name: 'iPhone 13 Pro Max', category: 'flagship', releaseYear: 2021, basePrice128GB: 29000, series: 'iPhone 13 Series' },
  { id: 'apple-13p',    brandId: 'brand-apple', name: 'iPhone 13 Pro', category: 'flagship', releaseYear: 2021, basePrice128GB: 27000, series: 'iPhone 13 Series' },
  { id: 'apple-13',     brandId: 'brand-apple', name: 'iPhone 13', category: 'premium',  releaseYear: 2021, basePrice128GB: 21000, series: 'iPhone 13 Series' },
  { id: 'apple-13m',    brandId: 'brand-apple', name: 'iPhone 13 mini', category: 'midrange', releaseYear: 2021, basePrice128GB: 16000, series: 'iPhone 13 Series' },
  { id: 'apple-12pm',   brandId: 'brand-apple', name: 'iPhone 12 Pro Max', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12p',    brandId: 'brand-apple', name: 'iPhone 12 Pro', category: 'premium',  releaseYear: 2020, basePrice128GB: 16000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12',     brandId: 'brand-apple', name: 'iPhone 12', category: 'midrange', releaseYear: 2020, basePrice128GB: 13000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12m',    brandId: 'brand-apple', name: 'iPhone 12 mini', category: 'midrange', releaseYear: 2020, basePrice128GB: 10500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11pm',   brandId: 'brand-apple', name: 'iPhone 11 Pro Max', category: 'premium',  releaseYear: 2019, basePrice128GB: 11000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11p',    brandId: 'brand-apple', name: 'iPhone 11 Pro', category: 'premium',  releaseYear: 2019, basePrice128GB:  9500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11',     brandId: 'brand-apple', name: 'iPhone 11', category: 'midrange', releaseYear: 2019, basePrice128GB:  7500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-se3',    brandId: 'brand-apple', name: 'iPhone SE3', category: 'budget',   releaseYear: 2022, basePrice128GB:  8500, series: 'iPhone SE & Legacy' },
  { id: 'apple-se2',    brandId: 'brand-apple', name: 'iPhone SE2', category: 'budget',   releaseYear: 2020, basePrice128GB:  6000, series: 'iPhone SE & Legacy' },
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e', category: 'midrange', releaseYear: 2024, basePrice128GB: 32000, series: 'iPhone 16 Series' },
  { id: 'apple-xr',     brandId: 'brand-apple', name: 'iPhone XR', category: 'budget',   releaseYear: 2018, basePrice128GB:  5500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xs',     brandId: 'brand-apple', name: 'iPhone XS', category: 'budget',   releaseYear: 2018, basePrice128GB:  6500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xsmax',  brandId: 'brand-apple', name: 'iPhone XS Max', category: 'budget',   releaseYear: 2018, basePrice128GB:  8000, series: 'iPhone SE & Legacy' },
  { id: 'apple-x',      brandId: 'brand-apple', name: 'iPhone X', category: 'budget',   releaseYear: 2017, basePrice128GB:  5000, series: 'iPhone SE & Legacy' },

  // --- SAMSUNG ---
  { id: 'sam-s26u',     brandId: 'brand-samsung', name: 'Galaxy S26 Ultra', category: 'flagship', releaseYear: 2026, basePrice128GB: 52000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26-ultra-new.jpg' },
  { id: 'sam-s26plus',  brandId: 'brand-samsung', name: 'Galaxy S26 Plus', category: 'flagship', releaseYear: 2026, basePrice128GB: 41000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26-plus.jpg' },
  { id: 'sam-s26',      brandId: 'brand-samsung', name: 'Galaxy S26', category: 'premium',  releaseYear: 2026, basePrice128GB: 35000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26.jpg' },
  { id: 'sam-s25u',     brandId: 'brand-samsung', name: 'Galaxy S25 Ultra', category: 'flagship', releaseYear: 2025, basePrice128GB: 46000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra-sm-s938.jpg' },
  { id: 'sam-s25plus',  brandId: 'brand-samsung', name: 'Galaxy S25 Plus', category: 'flagship', releaseYear: 2025, basePrice128GB: 35000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-plus-sm-s936.jpg' },
  { id: 'sam-s25',      brandId: 'brand-samsung', name: 'Galaxy S25', category: 'premium',  releaseYear: 2025, basePrice128GB: 30000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-sm-s931.jpg' },
  { id: 'sam-s24u',     brandId: 'brand-samsung', name: 'Galaxy S24 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg' },
  { id: 'sam-s24plus',  brandId: 'brand-samsung', name: 'Galaxy S24 Plus', category: 'premium',  releaseYear: 2024, basePrice128GB: 32000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-plus-5g-sm-s926.jpg' },
  { id: 'sam-s24',      brandId: 'brand-samsung', name: 'Galaxy S24', category: 'premium',  releaseYear: 2024, basePrice128GB: 25000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g-sm-s921.jpg' },
  { id: 'sam-s23u',     brandId: 'brand-samsung', name: 'Galaxy S23 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 30000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg' },
  { id: 'sam-s23plus',  brandId: 'brand-samsung', name: 'Galaxy S23 Plus', category: 'premium',  releaseYear: 2023, basePrice128GB: 20000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-plus-5g.jpg' },
  { id: 'sam-s23',      brandId: 'brand-samsung', name: 'Galaxy S23', category: 'premium',  releaseYear: 2023, basePrice128GB: 17000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-5g.jpg' },
  { id: 'sam-s22u',     brandId: 'brand-samsung', name: 'Galaxy S22 Ultra', category: 'premium',  releaseYear: 2022, basePrice128GB: 21000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-ultra-5g.jpg' },
  { id: 'sam-s22plus',  brandId: 'brand-samsung', name: 'Galaxy S22 Plus', category: 'premium',  releaseYear: 2022, basePrice128GB: 15000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-plus-5g.jpg' },
  { id: 'sam-s22',      brandId: 'brand-samsung', name: 'Galaxy S22', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-5g.jpg' },
  { id: 'sam-s21u',     brandId: 'brand-samsung', name: 'Galaxy S21 Ultra', category: 'premium',  releaseYear: 2021, basePrice128GB: 16000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-ultra-5g.jpg' },
  { id: 'sam-s21plus',  brandId: 'brand-samsung', name: 'Galaxy S21 Plus', category: 'midrange', releaseYear: 2021, basePrice128GB: 11000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21+-5g.jpg' },
  { id: 'sam-s21',      brandId: 'brand-samsung', name: 'Galaxy S21', category: 'midrange', releaseYear: 2021, basePrice128GB:  9500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-5g.jpg' },
  { id: 'sam-s20u',     brandId: 'brand-samsung', name: 'Galaxy S20 Ultra', category: 'premium',  releaseYear: 2020, basePrice128GB: 12000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s20-ultra-5g.jpg' },
  { id: 'sam-s20plus',  brandId: 'brand-samsung', name: 'Galaxy S20 Plus', category: 'premium',  releaseYear: 2020, basePrice128GB: 11000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s20+-5g.jpg' },
  { id: 'sam-s20',      brandId: 'brand-samsung', name: 'Galaxy S20', category: 'midrange', releaseYear: 2020, basePrice128GB:  9000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s20.jpg' },
  { id: 'sam-s10e',     brandId: 'brand-samsung', name: 'Galaxy S10e', category: 'midrange', releaseYear: 2019, basePrice128GB:  6000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s10e.jpg' },
  { id: 'sam-s10',      brandId: 'brand-samsung', name: 'Galaxy S10', category: 'midrange', releaseYear: 2019, basePrice128GB:  7000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s10.jpg' },
  { id: 'sam-s10plus',  brandId: 'brand-samsung', name: 'Galaxy S10 Plus', category: 'premium',  releaseYear: 2019, basePrice128GB:  8500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s10+.jpg' },
  { id: 'sam-s10-5g',   brandId: 'brand-samsung', name: 'Galaxy S10 5G', category: 'premium',  releaseYear: 2019, basePrice128GB:  9000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s10-5g.jpg' },
  { id: 'sam-s9',       brandId: 'brand-samsung', name: 'Galaxy S9', category: 'budget',   releaseYear: 2018, basePrice128GB:  4500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s9.jpg' },
  { id: 'sam-s9plus',   brandId: 'brand-samsung', name: 'Galaxy S9 Plus', category: 'budget',   releaseYear: 2018, basePrice128GB:  5500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s9+.jpg' },
  { id: 'sam-s8',       brandId: 'brand-samsung', name: 'Galaxy S8', category: 'budget',   releaseYear: 2017, basePrice128GB:  3500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s8.jpg' },
  { id: 'sam-s8plus',   brandId: 'brand-samsung', name: 'Galaxy S8 Plus', category: 'budget',   releaseYear: 2017, basePrice128GB:  4200, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s8+.jpg' },
  { id: 'sam-s7',       brandId: 'brand-samsung', name: 'Galaxy S7', category: 'budget',   releaseYear: 2016, basePrice128GB:  2500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s7.jpg' },
  { id: 'sam-s7edge',   brandId: 'brand-samsung', name: 'Galaxy S7 Edge', category: 'budget',   releaseYear: 2016, basePrice128GB:  3000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s7-edge.jpg' },
  { id: 'sam-s6',       brandId: 'brand-samsung', name: 'Galaxy S6', category: 'budget',   releaseYear: 2015, basePrice128GB:  2000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s6.jpg' },
  { id: 'sam-s6edge',   brandId: 'brand-samsung', name: 'Galaxy S6 Edge', category: 'budget',   releaseYear: 2015, basePrice128GB:  2300, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s6-edge.jpg' },
  { id: 'sam-s6edgeplus', brandId: 'brand-samsung', name: 'Galaxy S6 Edge Plus', category: 'budget', releaseYear: 2015, basePrice128GB: 2600, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s6-edge+.jpg' },
  { id: 'sam-s21fe',    brandId: 'brand-samsung', name: 'Galaxy S21 FE', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-fe-5g.jpg' },
  { id: 'sam-s23fe',    brandId: 'brand-samsung', name: 'Galaxy S23 FE', category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg' },
  { id: 'sam-s24fe',    brandId: 'brand-samsung', name: 'Galaxy S24 FE', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg' },
  { id: 'sam-flip3',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 3', category: 'premium',  releaseYear: 2021, basePrice128GB: 11000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip3-5g.jpg' },
  { id: 'sam-flip4',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 4', category: 'premium',  releaseYear: 2022, basePrice128GB: 16000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip4.jpg' },
  { id: 'sam-flip5',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 5', category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5.jpg' },
  { id: 'sam-flip6',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 6', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg' },
  { id: 'sam-fold8u',   brandId: 'brand-samsung', name: 'Galaxy Z Fold 8 Ultra', category: 'flagship', releaseYear: 2026, basePrice128GB: 68000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold8-ultra.jpg' },
  { id: 'sam-fold8',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 8', category: 'flagship', releaseYear: 2026, basePrice128GB: 62000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold8.jpg' },
  { id: 'sam-fold7',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 7', category: 'flagship', releaseYear: 2025, basePrice128GB: 58000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold7.jpg' },
  { id: 'sam-fold6',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 6', category: 'flagship', releaseYear: 2024, basePrice128GB: 55000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg' },
  { id: 'sam-fold5',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 5', category: 'flagship', releaseYear: 2023, basePrice128GB: 45000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg' },
  { id: 'sam-fold4',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 4', category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold4.jpg' },
  { id: 'sam-fold3',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 3', category: 'premium',  releaseYear: 2021, basePrice128GB: 26000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold3-5g.jpg' },
  { id: 'sam-fold2',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 2', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold2-5g.jpg' },
  { id: 'sam-fold',     brandId: 'brand-samsung', name: 'Galaxy Fold', category: 'premium',  releaseYear: 2019, basePrice128GB: 12000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-fold.jpg' },
  { id: 'sam-a13',      brandId: 'brand-samsung', name: 'Galaxy A13', category: 'budget',   releaseYear: 2022, basePrice128GB:  4500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a13.jpg' },
  { id: 'sam-a23-4g',   brandId: 'brand-samsung', name: 'Galaxy A23 4G', category: 'budget',   releaseYear: 2022, basePrice128GB:  6000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a23-4g.jpg' },
  { id: 'sam-a23-5g',   brandId: 'brand-samsung', name: 'Galaxy A23 5G', category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a23-5g.jpg' },
  { id: 'sam-a33',      brandId: 'brand-samsung', name: 'Galaxy A33', category: 'midrange', releaseYear: 2022, basePrice128GB:  6500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a33-5g.jpg' },
  { id: 'sam-a53',      brandId: 'brand-samsung', name: 'Galaxy A53', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a53-5g.jpg' },
  { id: 'sam-a73',      brandId: 'brand-samsung', name: 'Galaxy A73', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a73-5g.jpg' },
  { id: 'sam-a14-4g',   brandId: 'brand-samsung', name: 'Galaxy A14 4G', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a14.jpg' },
  { id: 'sam-a14-5g',   brandId: 'brand-samsung', name: 'Galaxy A14 5G', category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a14-5g.jpg' },
  { id: 'sam-a24',      brandId: 'brand-samsung', name: 'Galaxy A24', category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a24-4g.jpg' },
  { id: 'sam-a34',      brandId: 'brand-samsung', name: 'Galaxy A34', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a34-5g.jpg' },
  { id: 'sam-a54',      brandId: 'brand-samsung', name: 'Galaxy A54', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a54-5g.jpg' },
  { id: 'sam-a15-4g',   brandId: 'brand-samsung', name: 'Galaxy A15 4G', category: 'budget',   releaseYear: 2024, basePrice128GB:  6500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15.jpg' },
  { id: 'sam-a15-5g',   brandId: 'brand-samsung', name: 'Galaxy A15 5G', category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15-5g.jpg' },
  { id: 'sam-a25',      brandId: 'brand-samsung', name: 'Galaxy A25', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a25.jpg' },
  { id: 'sam-a35',      brandId: 'brand-samsung', name: 'Galaxy A35', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg' },
  { id: 'sam-a55',      brandId: 'brand-samsung', name: 'Galaxy A55', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg' },
  { id: 'sam-a16',      brandId: 'brand-samsung', name: 'Galaxy A16', category: 'budget',   releaseYear: 2025, basePrice128GB:  8500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15-5g.jpg' },
  { id: 'sam-a26',      brandId: 'brand-samsung', name: 'Galaxy A26', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a25.jpg' },
  { id: 'sam-a36',      brandId: 'brand-samsung', name: 'Galaxy A36', category: 'midrange', releaseYear: 2025, basePrice128GB: 13500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg' },
  { id: 'sam-a56',      brandId: 'brand-samsung', name: 'Galaxy A56', category: 'midrange', releaseYear: 2025, basePrice128GB: 18000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg' },
  { id: 'sam-f06',      brandId: 'brand-samsung', name: 'Galaxy F06', category: 'budget',   releaseYear: 2024, basePrice128GB:  4500, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a25.jpg' },
  { id: 'sam-f16',      brandId: 'brand-samsung', name: 'Galaxy F16', category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a25.jpg' },
  { id: 'sam-f36',      brandId: 'brand-samsung', name: 'Galaxy F36', category: 'budget',   releaseYear: 2024, basePrice128GB:  8000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg' },
  { id: 'sam-f56',      brandId: 'brand-samsung', name: 'Galaxy F56', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg' },
  { id: 'sam-m06',      brandId: 'brand-samsung', name: 'Galaxy M06', category: 'budget',   releaseYear: 2024, basePrice128GB:  4500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15-5g.jpg' },
  { id: 'sam-m16',      brandId: 'brand-samsung', name: 'Galaxy M16', category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15-5g.jpg' },
  { id: 'sam-m36',      brandId: 'brand-samsung', name: 'Galaxy M36', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg' },
  { id: 'sam-m56',      brandId: 'brand-samsung', name: 'Galaxy M56', category: 'midrange', releaseYear: 2024, basePrice128GB: 11500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg' },
  { id: 'sam-m55',      brandId: 'brand-samsung', name: 'Galaxy M55', category: 'midrange', releaseYear: 2024, basePrice128GB: 10500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg' },
  { id: 'sam-m35',      brandId: 'brand-samsung', name: 'Galaxy M35', category: 'budget',   releaseYear: 2024, basePrice128GB:  8000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg' },
  { id: 'sam-m33',      brandId: 'brand-samsung', name: 'Galaxy M33', category: 'budget',   releaseYear: 2022, basePrice128GB:  5500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a33-5g.jpg' },

  // --- XIAOMI ---
  { id: 'xi-14u',     brandId: 'brand-xiaomi', name: 'Xiaomi 14 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg' },
  { id: 'xi-14',      brandId: 'brand-xiaomi', name: 'Xiaomi 14', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg' },
  { id: 'xi-13p',     brandId: 'brand-xiaomi', name: 'Xiaomi 13 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 18000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13-pro.jpg' },
  { id: 'xi-13',      brandId: 'brand-xiaomi', name: 'Xiaomi 13', category: 'premium',  releaseYear: 2023, basePrice128GB: 13000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13.jpg' },
  { id: 'xi-12p',     brandId: 'brand-xiaomi', name: 'Xiaomi 12 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB: 11000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-12-pro.jpg' },
  { id: 'xi-12',      brandId: 'brand-xiaomi', name: 'Xiaomi 12', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-12.jpg' },
  { id: 'xi-n14p',    brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro+', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg' },
  { id: 'xi-n14',     brandId: 'brand-xiaomi', name: 'Redmi Note 14', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-4g.jpg' },
  { id: 'xi-n13p',    brandId: 'brand-xiaomi', name: 'Redmi Note 13 Pro+', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg' },
  { id: 'xi-n13',     brandId: 'brand-xiaomi', name: 'Redmi Note 13', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-4g.jpg' },
  { id: 'xi-poc6p',   brandId: 'brand-xiaomi', name: 'POCO F6 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'POCO F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg' },
  { id: 'xi-poc6',    brandId: 'brand-xiaomi', name: 'POCO F6', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'POCO F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6.jpg' },
  { id: 'xi-poc5p',   brandId: 'brand-xiaomi', name: 'POCO F5 Pro', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'POCO F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x5-pro.jpg' },

  // --- VIVO ---
  { id: 'vi-x200p',    brandId: 'brand-vivo', name: 'vivo X200 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 38000, series: 'X Series & Folds', supportedStorageGb: [256, 512, 1024], supportedRamGb: [12, 16] },
  { id: 'vi-x200',     brandId: 'brand-vivo', name: 'vivo X200', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'X Series & Folds', supportedStorageGb: [128, 256, 512], supportedRamGb: [8, 12, 16] },
  { id: 'vi-x200t',    brandId: 'brand-vivo', name: 'vivo X200 Pro Mini', category: 'flagship', releaseYear: 2024, basePrice128GB: 30000, series: 'X Series & Folds', supportedStorageGb: [128, 256, 512], supportedRamGb: [8, 12] },
  { id: 'vi-x200fe',   brandId: 'brand-vivo', name: 'vivo X200 FE', category: 'premium',  releaseYear: 2024, basePrice128GB: 22000, series: 'X Series & Folds' },
  { id: 'vi-x100',     brandId: 'brand-vivo', name: 'vivo X100', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'X Series & Folds' },
  { id: 'vi-x100p',    brandId: 'brand-vivo', name: 'vivo X100 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 27000, series: 'X Series & Folds' },
  { id: 'vi-x90',      brandId: 'brand-vivo', name: 'vivo X90', category: 'premium',  releaseYear: 2023, basePrice128GB: 12000, series: 'X Series & Folds' },
  { id: 'vi-x90p',     brandId: 'brand-vivo', name: 'vivo X90 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 16000, series: 'X Series & Folds' },
  { id: 'vi-x80',      brandId: 'brand-vivo', name: 'vivo X80', category: 'premium',  releaseYear: 2022, basePrice128GB: 10000, series: 'X Series & Folds' },
  { id: 'vi-x80p',     brandId: 'brand-vivo', name: 'vivo X80 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB: 14000, series: 'X Series & Folds' },
  { id: 'vi-v50',      brandId: 'brand-vivo', name: 'vivo V50', category: 'premium',  releaseYear: 2024, basePrice128GB: 17000, series: 'V Series' },
  { id: 'vi-v50e',     brandId: 'brand-vivo', name: 'vivo V50e', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v50elite', brandId: 'brand-vivo', name: 'vivo V50 Elite', category: 'premium',  releaseYear: 2024, basePrice128GB: 19000, series: 'V Series' },
  { id: 'vi-v40',      brandId: 'brand-vivo', name: 'vivo V40', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'V Series' },
  { id: 'vi-v40e',     brandId: 'brand-vivo', name: 'vivo V40e', category: 'midrange', releaseYear: 2024, basePrice128GB: 10500, series: 'V Series' },
  { id: 'vi-v40p',     brandId: 'brand-vivo', name: 'vivo V40 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 18000, series: 'V Series' },
  { id: 'vi-v30',      brandId: 'brand-vivo', name: 'vivo V30', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v30e',     brandId: 'brand-vivo', name: 'vivo V30e', category: 'midrange', releaseYear: 2024, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v30p',     brandId: 'brand-vivo', name: 'vivo V30 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 15000, series: 'V Series' },
  { id: 'vi-v29',      brandId: 'brand-vivo', name: 'vivo V29', category: 'midrange', releaseYear: 2023, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v29p',     brandId: 'brand-vivo', name: 'vivo V29 Pro', category: 'premium',  releaseYear: 2023, basePrice128GB: 12500, series: 'V Series' },
  { id: 'vi-v27',      brandId: 'brand-vivo', name: 'vivo V27', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'V Series' },
  { id: 'vi-v27p',     brandId: 'brand-vivo', name: 'vivo V27 Pro', category: 'premium',  releaseYear: 2023, basePrice128GB: 11500, series: 'V Series' },
  { id: 'vi-v25',      brandId: 'brand-vivo', name: 'vivo V25', category: 'midrange', releaseYear: 2022, basePrice128GB:  7500, series: 'V Series' },
  { id: 'vi-v25p',     brandId: 'brand-vivo', name: 'vivo V25 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v23',      brandId: 'brand-vivo', name: 'vivo V23', category: 'midrange', releaseYear: 2021, basePrice128GB:  6500, series: 'V Series' },
  { id: 'vi-v23p',     brandId: 'brand-vivo', name: 'vivo V23 Pro', category: 'premium',  releaseYear: 2021, basePrice128GB:  8500, series: 'V Series' },
  { id: 'vi-v21',      brandId: 'brand-vivo', name: 'vivo V21', category: 'midrange', releaseYear: 2020, basePrice128GB:  5500, series: 'V Series' },
  { id: 'vi-v21p',     brandId: 'brand-vivo', name: 'vivo V21 Pro', category: 'premium',  releaseYear: 2020, basePrice128GB:  7500, series: 'V Series' },
  { id: 'vi-t1-5g',    brandId: 'brand-vivo', name: 'vivo T1 5G', category: 'budget',   releaseYear: 2022, basePrice128GB:  5000, series: 'T Series' },
  { id: 'vi-t2p',      brandId: 'brand-vivo', name: 'vivo T2 Pro', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'T Series' },
  { id: 'vi-t2',       brandId: 'brand-vivo', name: 'vivo T2', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'T Series' },
  { id: 'vi-t2x',      brandId: 'brand-vivo', name: 'vivo T2x', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'T Series' },
  { id: 'vi-t3',       brandId: 'brand-vivo', name: 'vivo T3', category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'T Series' },
  { id: 'vi-t3x',      brandId: 'brand-vivo', name: 'vivo T3x', category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'T Series' },
  { id: 'vi-t3lite',   brandId: 'brand-vivo', name: 'vivo T3 Lite', category: 'budget',   releaseYear: 2024, basePrice128GB:  5000, series: 'T Series' },
  { id: 'vi-x3fold',   brandId: 'brand-vivo', name: 'vivo X Fold 3', category: 'flagship', releaseYear: 2024, basePrice128GB: 45000, series: 'X Series & Folds' },
  { id: 'vi-y100',     brandId: 'brand-vivo', name: 'vivo Y100', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Y Series' },
  { id: 'vi-y100p',    brandId: 'brand-vivo', name: 'vivo Y100 Pro', category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'Y Series' },
  { id: 'vi-y200',     brandId: 'brand-vivo', name: 'vivo Y200', category: 'budget',   releaseYear: 2023, basePrice128GB:  7000, series: 'Y Series' },
  { id: 'vi-y200p',    brandId: 'brand-vivo', name: 'vivo Y200 Pro', category: 'budget',   releaseYear: 2023, basePrice128GB:  8000, series: 'Y Series' },
  { id: 'vi-y300',     brandId: 'brand-vivo', name: 'vivo Y300', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'Y Series' },
  { id: 'vi-y300p',    brandId: 'brand-vivo', name: 'vivo Y300 Pro', category: 'budget',   releaseYear: 2024, basePrice128GB:  9500, series: 'Y Series' },
  { id: 'vi-y16',      brandId: 'brand-vivo', name: 'vivo Y16', category: 'budget',   releaseYear: 2022, basePrice128GB:  4000, series: 'Y Series' },
  { id: 'vi-y36',      brandId: 'brand-vivo', name: 'vivo Y36', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'Y Series' },
  { id: 'vi-y56',      brandId: 'brand-vivo', name: 'vivo Y56', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Y Series' },
  { id: 'vi-y73',      brandId: 'brand-vivo', name: 'vivo Y73', category: 'budget',   releaseYear: 2021, basePrice128GB:  5000, series: 'Y Series' },
  { id: 'vi-y11-5g',   brandId: 'brand-vivo', name: 'vivo Y11 5G', category: 'budget',   releaseYear: 2023, basePrice128GB:  5000, series: 'Y Series' },
  { id: 'vi-y21-5g',   brandId: 'brand-vivo', name: 'vivo Y21 5G', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'Y Series' },
  { id: 'vi-y31-5g',   brandId: 'brand-vivo', name: 'vivo Y31 5G', category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'Y Series' },
  { id: 'vi-y31p',     brandId: 'brand-vivo', name: 'vivo Y31 Pro', category: 'budget',   releaseYear: 2023, basePrice128GB:  7000, series: 'Y Series' },
  { id: 'vi-y51p',     brandId: 'brand-vivo', name: 'vivo Y51 Pro', category: 'budget',   releaseYear: 2023, basePrice128GB:  8000, series: 'Y Series' },

  // --- ONEPLUS ---
  { id: 'op-12',      brandId: 'brand-oneplus', name: 'OnePlus 12', category: 'flagship', releaseYear: 2024, basePrice128GB: 24000, series: 'Numbered Series' },
  { id: 'op-12r',     brandId: 'brand-oneplus', name: 'OnePlus 12R', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11',      brandId: 'brand-oneplus', name: 'OnePlus 11', category: 'premium',  releaseYear: 2023, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11r',     brandId: 'brand-oneplus', name: 'OnePlus 11R', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Numbered Series' },
  { id: 'op-10p',     brandId: 'brand-oneplus', name: 'OnePlus 10 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB: 12000, series: 'Numbered Series' },
  { id: 'op-10t',     brandId: 'brand-oneplus', name: 'OnePlus 10T', category: 'midrange', releaseYear: 2022, basePrice128GB:  9000, series: 'Numbered Series' },
  { id: 'op-10r',     brandId: 'brand-oneplus', name: 'OnePlus 10R', category: 'midrange', releaseYear: 2022, basePrice128GB:  7000, series: 'Numbered Series' },
  { id: 'op-nord4',   brandId: 'brand-oneplus', name: 'OnePlus Nord 4', category: 'midrange', releaseYear: 2024, basePrice128GB: 13000, series: 'Nord Series' },
  { id: 'op-nord3',   brandId: 'brand-oneplus', name: 'OnePlus Nord 3', category: 'budget',   releaseYear: 2023, basePrice128GB:  9000, series: 'Nord Series' },
  { id: 'op-nordce4', brandId: 'brand-oneplus', name: 'OnePlus Nord CE 4', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'Nord Series' },

  // --- GOOGLE ---
  { id: 'goog-8p',  brandId: 'brand-google', name: 'Pixel 8 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 27000, series: 'Pixel 8 Series' },
  { id: 'goog-8',   brandId: 'brand-google', name: 'Pixel 8', category: 'premium',  releaseYear: 2023, basePrice128GB: 19000, series: 'Pixel 8 Series' },
  { id: 'goog-8a',  brandId: 'brand-google', name: 'Pixel 8a', category: 'midrange', releaseYear: 2024, basePrice128GB: 14500, series: 'Pixel 8 Series' },
  { id: 'goog-7p',  brandId: 'brand-google', name: 'Pixel 7 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB: 20000, series: 'Pixel 7 Series' },
  { id: 'goog-7',   brandId: 'brand-google', name: 'Pixel 7', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Pixel 7 Series' },
  { id: 'goog-7a',  brandId: 'brand-google', name: 'Pixel 7a', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Pixel 7 Series' },
  { id: 'goog-6p',  brandId: 'brand-google', name: 'Pixel 6 Pro', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'Pixel 6 Series' },
  { id: 'goog-6',   brandId: 'brand-google', name: 'Pixel 6', category: 'budget',   releaseYear: 2021, basePrice128GB:  6000, series: 'Pixel 6 Series' },
  { id: 'goog-6a',  brandId: 'brand-google', name: 'Pixel 6a', category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'Pixel 6 Series' },
  { id: 'goog-fold',     brandId: 'brand-google', name: 'Pixel Fold',       category: 'premium',  releaseYear: 2023, basePrice128GB: 52000, series: 'Pixel Fold Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-fold.jpg' },
  { id: 'goog-9',        brandId: 'brand-google', name: 'Pixel 9',          category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'Pixel 9 Series',    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9.jpg' },
  { id: 'goog-9p',       brandId: 'brand-google', name: 'Pixel 9 Pro',      category: 'premium',  releaseYear: 2024, basePrice128GB: 42000, series: 'Pixel 9 Series',    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg' },
  { id: 'goog-9p-xl',    brandId: 'brand-google', name: 'Pixel 9 Pro XL',   category: 'premium',  releaseYear: 2024, basePrice128GB: 48000, series: 'Pixel 9 Series',    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl.jpg' },
  { id: 'goog-9p-fold',  brandId: 'brand-google', name: 'Pixel 9 Pro Fold', category: 'premium',  releaseYear: 2024, basePrice128GB: 68000, series: 'Pixel 9 Series',    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-fold.jpg' },
  { id: 'goog-9a',       brandId: 'brand-google', name: 'Pixel 9a',         category: 'midrange', releaseYear: 2025, basePrice128GB: 20000, series: 'Pixel 9 Series',    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9a.jpg' },
  { id: 'goog-10',       brandId: 'brand-google', name: 'Pixel 10',         category: 'flagship', releaseYear: 2025, basePrice128GB: 38000, series: 'Pixel 10 Series',   imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10.jpg' },
  { id: 'goog-10p',      brandId: 'brand-google', name: 'Pixel 10 Pro',     category: 'premium',  releaseYear: 2025, basePrice128GB: 52000, series: 'Pixel 10 Series',   imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10-pro.jpg' },
  { id: 'goog-10p-xl',   brandId: 'brand-google', name: 'Pixel 10 Pro XL',  category: 'premium',  releaseYear: 2025, basePrice128GB: 58000, series: 'Pixel 10 Series',   imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10-pro-xl.jpg' },
  { id: 'goog-10p-fold', brandId: 'brand-google', name: 'Pixel 10 Pro Fold',category: 'premium',  releaseYear: 2025, basePrice128GB: 72000, series: 'Pixel 10 Series',   imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10-pro-fold.jpg' },
  { id: 'goog-10a',      brandId: 'brand-google', name: 'Pixel 10a',        category: 'midrange', releaseYear: 2026, basePrice128GB: 22000, series: 'Pixel 10 Series',   imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10a.jpg' },

  // --- OPPO ---
  // (OPPO models dynamically populated via CATALOG_ADDITIONS)

  // --- NOTHING ---
  { id: 'catalog-nothing-phone-1', brandId: 'brand-nothing', name: 'Nothing Phone 1', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-1.jpg' },
  { id: 'catalog-nothing-phone-2', brandId: 'brand-nothing', name: 'Nothing Phone 2', category: 'premium',  releaseYear: 2023, basePrice128GB: 18000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2.jpg' },
  { id: 'catalog-nothing-phone-2a', brandId: 'brand-nothing', name: 'Nothing Phone 2a', category: 'budget', releaseYear: 2024, basePrice128GB: 11000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg' },
  { id: 'catalog-nothing-cmf-phone-1', brandId: 'brand-nothing', name: 'CMF Phone 1', category: 'budget',  releaseYear: 2024, basePrice128GB: 8500,  series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/cmf-phone-1.jpg' },
  { id: 'catalog-nothing-cmf-phone-2-pro', brandId: 'brand-nothing', name: 'CMF Phone 2 Pro', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/cmf-phone-2-pro.jpg' },
  { id: 'catalog-nothing-phone-3', brandId: 'brand-nothing', name: 'Nothing Phone (3)', category: 'flagship', releaseYear: 2025, basePrice128GB: 32000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-3.jpg' },
  { id: 'catalog-nothing-phone-3a', brandId: 'brand-nothing', name: 'Nothing Phone (3a)', category: 'midrange', releaseYear: 2025, basePrice128GB: 13000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-3a.jpg' },
  { id: 'catalog-nothing-phone-3a-pro', brandId: 'brand-nothing', name: 'Nothing Phone (3a) Pro', category: 'premium', releaseYear: 2025, basePrice128GB: 17000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-3a-pro.jpg' },
  { id: 'catalog-nothing-phone-4a', brandId: 'brand-nothing', name: 'Nothing Phone (4a)', category: 'midrange', releaseYear: 2026, basePrice128GB: 14000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-4a.jpg' },
  { id: 'catalog-nothing-phone-4a-pro', brandId: 'brand-nothing', name: 'Nothing Phone (4a) Pro', category: 'premium', releaseYear: 2026, basePrice128GB: 18000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-4a-pro.jpg' },

  // --- MOTOROLA ---
  { id: 'catalog-motorola-g04', brandId: 'brand-motorola', name: 'Motorola G04', category: 'budget', releaseYear: 2024, basePrice128GB: 5000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-g04.jpg' },
  { id: 'catalog-motorola-g05', brandId: 'brand-motorola', name: 'Motorola G05', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-g24.jpg' },
  { id: 'catalog-motorola-edge-50-fusion', brandId: 'brand-motorola', name: 'Motorola Edge 50 Fusion', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-fusion.jpg' },
  { id: 'catalog-motorola-edge-50-pro', brandId: 'brand-motorola', name: 'Motorola Edge 50 Pro', category: 'premium', releaseYear: 2024, basePrice128GB: 18000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-pro.jpg' },
  { id: 'catalog-motorola-edge-50-ultra', brandId: 'brand-motorola', name: 'Motorola Edge 50 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-ultra.jpg' },
  { id: 'catalog-motorola-razr-50-ultra', brandId: 'brand-motorola', name: 'Motorola Razr 50 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 45000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-50-ultra.jpg' },
  // --- VIVO ADDITIONS ---
  { id: 'catalog-vivo-vivo-v21e', brandId: 'brand-vivo', name: 'vivo V21e', category: 'budget', releaseYear: 2021, basePrice128GB: 7000, series: 'V Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v21e.jpg' },
  { id: 'catalog-vivo-vivo-x60', brandId: 'brand-vivo', name: 'vivo X60', category: 'premium', releaseYear: 2021, basePrice128GB: 14000, series: 'X Series & Folds', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x60.jpg' },
  { id: 'catalog-vivo-vivo-x60-pro', brandId: 'brand-vivo', name: 'vivo X60 Pro', category: 'flagship', releaseYear: 2021, basePrice128GB: 22000, series: 'X Series & Folds', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x60-pro.jpg' },
  { id: 'catalog-vivo-vivo-x60-pro', brandId: 'brand-vivo', name: 'vivo X60 Pro+', category: 'flagship', releaseYear: 2021, basePrice128GB: 28000, series: 'X Series & Folds', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x60-pro-plus.jpg' },
  { id: 'catalog-vivo-vivo-y12s', brandId: 'brand-vivo', name: 'vivo Y12s', category: 'budget', releaseYear: 2021, basePrice128GB: 4000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y12s.jpg' },
  { id: 'catalog-vivo-vivo-y20', brandId: 'brand-vivo', name: 'vivo Y20', category: 'budget', releaseYear: 2021, basePrice128GB: 5000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y20.jpg' },
  { id: 'catalog-vivo-vivo-y20g', brandId: 'brand-vivo', name: 'vivo Y20G', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y20g.jpg' },
  { id: 'catalog-vivo-vivo-y31', brandId: 'brand-vivo', name: 'vivo Y31', category: 'budget', releaseYear: 2021, basePrice128GB: 6000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y31.jpg' },
  { id: 'catalog-vivo-vivo-y51', brandId: 'brand-vivo', name: 'vivo Y51', category: 'midrange', releaseYear: 2021, basePrice128GB: 7000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y51-2020.jpg' },
  { id: 'catalog-vivo-vivo-y72-5g', brandId: 'brand-vivo', name: 'vivo Y72 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 8000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y72-5g.jpg' },
  { id: 'catalog-vivo-vivo-t1-44w', brandId: 'brand-vivo', name: 'vivo T1 44W', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t1-44w.jpg' },
  { id: 'catalog-vivo-vivo-v23-5g', brandId: 'brand-vivo', name: 'vivo V23 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 9000, series: 'V Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v23-5g.jpg' },
  { id: 'catalog-vivo-vivo-v23-pro-5g', brandId: 'brand-vivo', name: 'vivo V23 Pro 5G', category: 'premium', releaseYear: 2022, basePrice128GB: 12000, series: 'V Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v23-pro-5g.jpg' },
  { id: 'catalog-vivo-vivo-v23e', brandId: 'brand-vivo', name: 'vivo V23e', category: 'midrange', releaseYear: 2022, basePrice128GB: 8000, series: 'V Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v23e.jpg' },
  { id: 'catalog-vivo-vivo-y21g', brandId: 'brand-vivo', name: 'vivo Y21G', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y21g.jpg' },
  { id: 'catalog-vivo-vivo-y22', brandId: 'brand-vivo', name: 'vivo Y22', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y22.jpg' },
  { id: 'catalog-vivo-vivo-y35', brandId: 'brand-vivo', name: 'vivo Y35', category: 'midrange', releaseYear: 2022, basePrice128GB: 7500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y35.jpg' },
  { id: 'catalog-vivo-vivo-t2-5g', brandId: 'brand-vivo', name: 'vivo T2 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 7000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t2-5g.jpg' },
  { id: 'catalog-vivo-vivo-t2x-5g', brandId: 'brand-vivo', name: 'vivo T2x 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 6000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t2x-5g.jpg' },
  { id: 'catalog-vivo-vivo-v27e', brandId: 'brand-vivo', name: 'vivo V27e', category: 'midrange', releaseYear: 2023, basePrice128GB: 9000, series: 'V Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v27e.jpg' },
  { id: 'catalog-vivo-vivo-y17s', brandId: 'brand-vivo', name: 'vivo Y17s', category: 'budget', releaseYear: 2023, basePrice128GB: 5000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y17s.jpg' },
  { id: 'catalog-vivo-vivo-y27-5g', brandId: 'brand-vivo', name: 'vivo Y27 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 6000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y27-5g.jpg' },
  { id: 'catalog-vivo-vivo-t3-5g', brandId: 'brand-vivo', name: 'vivo T3 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 9000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t3-5g.jpg' },
  { id: 'catalog-vivo-vivo-t3-pro-5g', brandId: 'brand-vivo', name: 'vivo T3 Pro 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t3-pro.jpg' },
  { id: 'catalog-vivo-vivo-t3x-5g', brandId: 'brand-vivo', name: 'vivo T3x 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 7000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t3x-5g.jpg' },
  { id: 'catalog-vivo-vivo-x-fold3-pro', brandId: 'brand-vivo', name: 'vivo X Fold3 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 58000, series: 'X Series & Folds', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x-fold3-pro.jpg' },
  { id: 'catalog-vivo-vivo-y18', brandId: 'brand-vivo', name: 'vivo Y18', category: 'budget', releaseYear: 2024, basePrice128GB: 5000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y18.jpg' },
  { id: 'catalog-vivo-vivo-y18e', brandId: 'brand-vivo', name: 'vivo Y18e', category: 'budget', releaseYear: 2024, basePrice128GB: 4500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y18e.jpg' },
  { id: 'catalog-vivo-vivo-y200-5g', brandId: 'brand-vivo', name: 'vivo Y200 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 9000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y200-5g.jpg' },
  { id: 'catalog-vivo-vivo-y200e-5g', brandId: 'brand-vivo', name: 'vivo Y200e 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 7500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y200e.jpg' },
  { id: 'catalog-vivo-vivo-y28-4g', brandId: 'brand-vivo', name: 'vivo Y28 4G', category: 'budget', releaseYear: 2024, basePrice128GB: 6000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y28.jpg' },
  { id: 'catalog-vivo-vivo-y28-5g', brandId: 'brand-vivo', name: 'vivo Y28 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 7000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y28-5g.jpg' },
  { id: 'catalog-vivo-vivo-t4-5g', brandId: 'brand-vivo', name: 'vivo T4 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t4-5g.jpg' },
  { id: 'catalog-vivo-vivo-t4x-5g', brandId: 'brand-vivo', name: 'vivo T4x 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 8000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t4x-5g.jpg' },
  { id: 'catalog-vivo-vivo-y19-5g', brandId: 'brand-vivo', name: 'vivo Y19 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y19-5g.jpg' },
  { id: 'catalog-vivo-vivo-y19s-5g', brandId: 'brand-vivo', name: 'vivo Y19s 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 6000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y19s-5g.jpg' },
  { id: 'catalog-vivo-vivo-y29-5g', brandId: 'brand-vivo', name: 'vivo Y29 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 7000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y29-5g.jpg' },
  { id: 'catalog-vivo-vivo-y300-5g', brandId: 'brand-vivo', name: 'vivo Y300 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 9500, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y300-5g.jpg' },
  { id: 'catalog-vivo-vivo-y300-plus-5g', brandId: 'brand-vivo', name: 'vivo Y300 Plus 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y300-plus-5g.jpg' },
  { id: 'catalog-vivo-vivo-y39-5g', brandId: 'brand-vivo', name: 'vivo Y39 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 8000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y39.jpg' },
  { id: 'catalog-vivo-vivo-y400-5g', brandId: 'brand-vivo', name: 'vivo Y400 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 12000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y400-5g.jpg' },
  { id: 'catalog-vivo-vivo-t5-lite-5g', brandId: 'brand-vivo', name: 'vivo T5 Lite 5G', category: 'budget', releaseYear: 2026, basePrice128GB: 6500, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t5-lite.jpg' },
  { id: 'catalog-vivo-vivo-t5-pro-5g', brandId: 'brand-vivo', name: 'vivo T5 Pro 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 14000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t5-pro.jpg' },
  { id: 'catalog-vivo-vivo-t5x-5g', brandId: 'brand-vivo', name: 'vivo T5x 5G', category: 'budget', releaseYear: 2026, basePrice128GB: 8000, series: 'T Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t5x.jpg' },
  { id: 'catalog-vivo-vivo-x-fold5', brandId: 'brand-vivo', name: 'vivo X Fold5', category: 'flagship', releaseYear: 2026, basePrice128GB: 70000, series: 'X Series & Folds', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x-fold5.jpg' },
  { id: 'catalog-vivo-vivo-y05', brandId: 'brand-vivo', name: 'vivo Y05', category: 'budget', releaseYear: 2026, basePrice128GB: 4000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y05.jpg' },
  { id: 'catalog-vivo-vivo-y51-pro-5g', brandId: 'brand-vivo', name: 'vivo Y51 Pro 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 11000, series: 'Y Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y51-pro.jpg' },

  // --- XIAOMI/REDMI ADDITIONS ---
  { id: 'catalog-xiaomi-redmi-10-prime', brandId: 'brand-xiaomi', name: 'Redmi 10 Prime', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-10-prime.jpg' },
  { id: 'catalog-xiaomi-redmi-9-activ', brandId: 'brand-xiaomi', name: 'Redmi 9 Activ', category: 'budget', releaseYear: 2021, basePrice128GB: 4500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-9-activ.jpg' },
  { id: 'catalog-xiaomi-redmi-9-power', brandId: 'brand-xiaomi', name: 'Redmi 9 Power', category: 'budget', releaseYear: 2021, basePrice128GB: 5000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-9-power.jpg' },
  { id: 'catalog-xiaomi-redmi-note-10-pro-max', brandId: 'brand-xiaomi', name: 'Redmi Note 10 Pro Max', category: 'midrange', releaseYear: 2021, basePrice128GB: 10000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-10-pro-max.jpg' },
  { id: 'catalog-xiaomi-redmi-note-10s', brandId: 'brand-xiaomi', name: 'Redmi Note 10S', category: 'midrange', releaseYear: 2021, basePrice128GB: 7000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-10s.jpg' },
  { id: 'catalog-xiaomi-redmi-note-10t-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 10T 5G', category: 'budget', releaseYear: 2021, basePrice128GB: 6500, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-10-5g.jpg' },
  { id: 'catalog-xiaomi-xiaomi-mi-11-lite', brandId: 'brand-xiaomi', name: 'Xiaomi Mi 11 Lite', category: 'midrange', releaseYear: 2021, basePrice128GB: 9000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-11-lite.jpg' },
  { id: 'catalog-xiaomi-xiaomi-mi-11-ultra', brandId: 'brand-xiaomi', name: 'Xiaomi Mi 11 Ultra', category: 'flagship', releaseYear: 2021, basePrice128GB: 28000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-11-ultra.jpg' },
  { id: 'catalog-xiaomi-xiaomi-mi-11x', brandId: 'brand-xiaomi', name: 'Xiaomi Mi 11X', category: 'premium', releaseYear: 2021, basePrice128GB: 12000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-11x.jpg' },
  { id: 'catalog-xiaomi-xiaomi-mi-11x-pro', brandId: 'brand-xiaomi', name: 'Xiaomi Mi 11X Pro', category: 'flagship', releaseYear: 2021, basePrice128GB: 18000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-11x-pro.jpg' },
  { id: 'catalog-xiaomi-redmi-10-power', brandId: 'brand-xiaomi', name: 'Redmi 10 Power', category: 'budget', releaseYear: 2022, basePrice128GB: 6500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-10-power.jpg' },
  { id: 'catalog-xiaomi-redmi-10-prime-2022', brandId: 'brand-xiaomi', name: 'Redmi 10 Prime 2022', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-10-prime-2022.jpg' },
  { id: 'catalog-xiaomi-redmi-k50i-5g', brandId: 'brand-xiaomi', name: 'Redmi K50i 5G', category: 'premium', releaseYear: 2022, basePrice128GB: 16000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-k50i.jpg' },
  { id: 'catalog-xiaomi-redmi-note-11-pro-4g', brandId: 'brand-xiaomi', name: 'Redmi Note 11 Pro 4G', category: 'midrange', releaseYear: 2022, basePrice128GB: 9000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-11-pro.jpg' },
  { id: 'catalog-xiaomi-redmi-note-11-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 11 Pro+ 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-11-pro-plus-5g.jpg' },
  { id: 'catalog-xiaomi-xiaomi-11i', brandId: 'brand-xiaomi', name: 'Xiaomi 11i', category: 'midrange', releaseYear: 2022, basePrice128GB: 10000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-11i.jpg' },
  { id: 'catalog-xiaomi-xiaomi-11i-hypercharge-5g', brandId: 'brand-xiaomi', name: 'Xiaomi 11i HyperCharge 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-11i-hypercharge-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-11-prime-5g', brandId: 'brand-xiaomi', name: 'Redmi 11 Prime 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-11-prime-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-12-5g', brandId: 'brand-xiaomi', name: 'Redmi 12 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 6500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-12-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-12c', brandId: 'brand-xiaomi', name: 'Redmi 12C', category: 'budget', releaseYear: 2023, basePrice128GB: 5000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-12c.jpg' },
  { id: 'catalog-xiaomi-redmi-a2', brandId: 'brand-xiaomi', name: 'Redmi A2', category: 'budget', releaseYear: 2023, basePrice128GB: 3500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-a2.jpg' },
  { id: 'catalog-xiaomi-redmi-a2', brandId: 'brand-xiaomi', name: 'Redmi A2+', category: 'budget', releaseYear: 2023, basePrice128GB: 4000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-a2-plus.jpg' },
  { id: 'catalog-xiaomi-redmi-note-12-4g', brandId: 'brand-xiaomi', name: 'Redmi Note 12 4G', category: 'budget', releaseYear: 2023, basePrice128GB: 7000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-12.jpg' },
  { id: 'catalog-xiaomi-redmi-note-12-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 12 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 8000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-12-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-12-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 12 Pro 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-12-pro-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-12-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 12 Pro+ 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 14000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-12-pro-plus-5g.jpg' },
  { id: 'catalog-xiaomi-xiaomi-13-lite', brandId: 'brand-xiaomi', name: 'Xiaomi 13 Lite', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13-lite.jpg' },
  { id: 'catalog-xiaomi-xiaomi-13t-pro', brandId: 'brand-xiaomi', name: 'Xiaomi 13T Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaiaomi-13t-pro.jpg' },
  { id: 'catalog-xiaomi-redmi-13-5g', brandId: 'brand-xiaomi', name: 'Redmi 13 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 6500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-13-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-13c-5g', brandId: 'brand-xiaomi', name: 'Redmi 13C 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 6000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-13c-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-a3', brandId: 'brand-xiaomi', name: 'Redmi A3', category: 'budget', releaseYear: 2024, basePrice128GB: 4000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-a3.jpg' },
  { id: 'catalog-xiaomi-redmi-a3x', brandId: 'brand-xiaomi', name: 'Redmi A3X', category: 'budget', releaseYear: 2024, basePrice128GB: 3500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-a3x.jpg' },
  { id: 'catalog-xiaomi-redmi-note-13-4g', brandId: 'brand-xiaomi', name: 'Redmi Note 13 4G', category: 'midrange', releaseYear: 2024, basePrice128GB: 8000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-4g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-13-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 13 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 9000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-13-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 13 Pro 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-14-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-14c-5g', brandId: 'brand-xiaomi', name: 'Redmi 14C 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-14c-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-15-5g', brandId: 'brand-xiaomi', name: 'Redmi 15 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 7000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-15-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-15c-5g', brandId: 'brand-xiaomi', name: 'Redmi 15C 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 6000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-15c-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-14-pro-4g', brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro 4G', category: 'midrange', releaseYear: 2025, basePrice128GB: 12000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro-4g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-14-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro+ 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 16000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro-plus-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-14-se-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 14 SE 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 8000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-se.jpg' },
  { id: 'catalog-xiaomi-xiaomi-15-civi', brandId: 'brand-xiaomi', name: 'Xiaomi 15 Civi', category: 'premium', releaseYear: 2025, basePrice128GB: 24000, series: 'Xiaomi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15-civi.jpg' },
  { id: 'catalog-xiaomi-redmi-note-15-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 15 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 10000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-15-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-15-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 15 Pro 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 14000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-15-pro-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-15-pro-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 15 Pro+ 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 18000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-15-pro-plus-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-note-15-se-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 15 SE 5G', category: 'budget', releaseYear: 2026, basePrice128GB: 9000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-15-se.jpg' },
  { id: 'catalog-xiaomi-redmi-note-17-5g', brandId: 'brand-xiaomi', name: 'Redmi Note 17 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 12000, series: 'Redmi Note Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-17-5g.jpg' },
  { id: 'catalog-xiaomi-redmi-turbo-5', brandId: 'brand-xiaomi', name: 'Redmi Turbo 5', category: 'premium', releaseYear: 2026, basePrice128GB: 22000, series: 'Redmi Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-turbo-5.jpg' },

  // --- SAMSUNG ADDITIONS ---
  { id: 'catalog-samsung-galaxy-a02', brandId: 'brand-samsung', name: 'Galaxy A02', category: 'budget', releaseYear: 2021, basePrice128GB: 3500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a02.jpg' },
  { id: 'catalog-samsung-galaxy-a03s', brandId: 'brand-samsung', name: 'Galaxy A03s', category: 'budget', releaseYear: 2021, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a03s.jpg' },
  { id: 'catalog-samsung-galaxy-a12', brandId: 'brand-samsung', name: 'Galaxy A12', category: 'budget', releaseYear: 2021, basePrice128GB: 5000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a12.jpg' },
  { id: 'catalog-samsung-galaxy-a22', brandId: 'brand-samsung', name: 'Galaxy A22', category: 'budget', releaseYear: 2021, basePrice128GB: 6500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a22.jpg' },
  { id: 'catalog-samsung-galaxy-a22-5g', brandId: 'brand-samsung', name: 'Galaxy A22 5G', category: 'budget', releaseYear: 2021, basePrice128GB: 6500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a22-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a32', brandId: 'brand-samsung', name: 'Galaxy A32', category: 'midrange', releaseYear: 2021, basePrice128GB: 7000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a32.jpg' },
  { id: 'catalog-samsung-galaxy-a52', brandId: 'brand-samsung', name: 'Galaxy A52', category: 'midrange', releaseYear: 2021, basePrice128GB: 8000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a52.jpg' },
  { id: 'catalog-samsung-galaxy-a52s-5g', brandId: 'brand-samsung', name: 'Galaxy A52s 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 9000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a52s-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a72', brandId: 'brand-samsung', name: 'Galaxy A72', category: 'midrange', releaseYear: 2021, basePrice128GB: 10000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a72.jpg' },
  { id: 'catalog-samsung-galaxy-f02s', brandId: 'brand-samsung', name: 'Galaxy F02s', category: 'budget', releaseYear: 2021, basePrice128GB: 3500, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f02s.jpg' },
  { id: 'catalog-samsung-galaxy-f12', brandId: 'brand-samsung', name: 'Galaxy F12', category: 'budget', releaseYear: 2021, basePrice128GB: 5000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f12.jpg' },
  { id: 'catalog-samsung-galaxy-f22', brandId: 'brand-samsung', name: 'Galaxy F22', category: 'budget', releaseYear: 2021, basePrice128GB: 6000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f22.jpg' },
  { id: 'catalog-samsung-galaxy-f42-5g', brandId: 'brand-samsung', name: 'Galaxy F42 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 9000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f42-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f62', brandId: 'brand-samsung', name: 'Galaxy F62', category: 'midrange', releaseYear: 2021, basePrice128GB: 10000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f62.jpg' },
  { id: 'catalog-samsung-galaxy-m02', brandId: 'brand-samsung', name: 'Galaxy M02', category: 'budget', releaseYear: 2021, basePrice128GB: 3000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m02.jpg' },
  { id: 'catalog-samsung-galaxy-m02s', brandId: 'brand-samsung', name: 'Galaxy M02s', category: 'budget', releaseYear: 2021, basePrice128GB: 3500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m02s.jpg' },
  { id: 'catalog-samsung-galaxy-m12', brandId: 'brand-samsung', name: 'Galaxy M12', category: 'budget', releaseYear: 2021, basePrice128GB: 5000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m12.jpg' },
  { id: 'catalog-samsung-galaxy-m21-2021-edition', brandId: 'brand-samsung', name: 'Galaxy M21 2021 Edition', category: 'budget', releaseYear: 2021, basePrice128GB: 6000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m21-2021.jpg' },
  { id: 'catalog-samsung-galaxy-m32', brandId: 'brand-samsung', name: 'Galaxy M32', category: 'midrange', releaseYear: 2021, basePrice128GB: 7000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m32.jpg' },
  { id: 'catalog-samsung-galaxy-m42-5g', brandId: 'brand-samsung', name: 'Galaxy M42 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 8000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m42-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m52-5g', brandId: 'brand-samsung', name: 'Galaxy M52 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 9000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m52-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m62', brandId: 'brand-samsung', name: 'Galaxy M62', category: 'midrange', releaseYear: 2021, basePrice128GB: 10000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m62.jpg' },
  { id: 'catalog-samsung-galaxy-s21-5g', brandId: 'brand-samsung', name: 'Galaxy S21 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 13000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-5g.jpg' },
  { id: 'catalog-samsung-galaxy-s21-ultra-5g', brandId: 'brand-samsung', name: 'Galaxy S21 Ultra 5G', category: 'flagship', releaseYear: 2021, basePrice128GB: 18000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-ultra-5g.jpg' },
  { id: 'catalog-samsung-galaxy-s21-5g', brandId: 'brand-samsung', name: 'Galaxy S21+ 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 15000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-plus-5g.jpg' },
  { id: 'catalog-samsung-galaxy-z-flip3-5g', brandId: 'brand-samsung', name: 'Galaxy Z Flip3 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 20000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip3-5g.jpg' },
  { id: 'catalog-samsung-galaxy-z-fold3-5g', brandId: 'brand-samsung', name: 'Galaxy Z Fold3 5G', category: 'flagship', releaseYear: 2021, basePrice128GB: 42000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold3-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a03', brandId: 'brand-samsung', name: 'Galaxy A03', category: 'budget', releaseYear: 2022, basePrice128GB: 3500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a03.jpg' },
  { id: 'catalog-samsung-galaxy-a04', brandId: 'brand-samsung', name: 'Galaxy A04', category: 'budget', releaseYear: 2022, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a04.jpg' },
  { id: 'catalog-samsung-galaxy-a04e', brandId: 'brand-samsung', name: 'Galaxy A04e', category: 'budget', releaseYear: 2022, basePrice128GB: 3500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a04e.jpg' },
  { id: 'catalog-samsung-galaxy-a04s', brandId: 'brand-samsung', name: 'Galaxy A04s', category: 'budget', releaseYear: 2022, basePrice128GB: 4500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a04s.jpg' },
  { id: 'catalog-samsung-galaxy-a13-5g', brandId: 'brand-samsung', name: 'Galaxy A13 5G', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a13.jpg' },
  { id: 'catalog-samsung-galaxy-a23', brandId: 'brand-samsung', name: 'Galaxy A23', category: 'budget', releaseYear: 2022, basePrice128GB: 6000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a23.jpg' },
  { id: 'catalog-samsung-galaxy-f13', brandId: 'brand-samsung', name: 'Galaxy F13', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f13.jpg' },
  { id: 'catalog-samsung-galaxy-f23-5g', brandId: 'brand-samsung', name: 'Galaxy F23 5G', category: 'budget', releaseYear: 2022, basePrice128GB: 6500, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f23-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m04', brandId: 'brand-samsung', name: 'Galaxy M04', category: 'budget', releaseYear: 2022, basePrice128GB: 4000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m04.jpg' },
  { id: 'catalog-samsung-galaxy-m13', brandId: 'brand-samsung', name: 'Galaxy M13', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m13.jpg' },
  { id: 'catalog-samsung-galaxy-m13-5g', brandId: 'brand-samsung', name: 'Galaxy M13 5G', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m13-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m32-5g', brandId: 'brand-samsung', name: 'Galaxy M32 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 7500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m32-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m33-5g', brandId: 'brand-samsung', name: 'Galaxy M33 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 8000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m33-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m53-5g', brandId: 'brand-samsung', name: 'Galaxy M53 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m53-5g.jpg' },
  { id: 'catalog-samsung-galaxy-s20-fe-2022', brandId: 'brand-samsung', name: 'Galaxy S20 FE 2022', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s20-fe-2022.jpg' },
  { id: 'catalog-samsung-galaxy-s21-fe-5g', brandId: 'brand-samsung', name: 'Galaxy S21 FE 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 9500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-fe-5g.jpg' },
  { id: 'catalog-samsung-galaxy-s22-5g', brandId: 'brand-samsung', name: 'Galaxy S22 5G', category: 'premium', releaseYear: 2022, basePrice128GB: 14000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-5g.jpg' },
  { id: 'catalog-samsung-galaxy-s22-ultra-5g', brandId: 'brand-samsung', name: 'Galaxy S22 Ultra 5G', category: 'flagship', releaseYear: 2022, basePrice128GB: 24000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-ultra-5g.jpg' },
  { id: 'catalog-samsung-galaxy-s22-5g', brandId: 'brand-samsung', name: 'Galaxy S22+ 5G', category: 'premium', releaseYear: 2022, basePrice128GB: 18000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-plus-5g.jpg' },
  { id: 'catalog-samsung-galaxy-z-flip4', brandId: 'brand-samsung', name: 'Galaxy Z Flip4', category: 'flagship', releaseYear: 2022, basePrice128GB: 28000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip4.jpg' },
  { id: 'catalog-samsung-galaxy-z-fold4', brandId: 'brand-samsung', name: 'Galaxy Z Fold4', category: 'flagship', releaseYear: 2022, basePrice128GB: 52000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold4.jpg' },
  { id: 'catalog-samsung-galaxy-a05', brandId: 'brand-samsung', name: 'Galaxy A05', category: 'budget', releaseYear: 2023, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a05.jpg' },
  { id: 'catalog-samsung-galaxy-a05s', brandId: 'brand-samsung', name: 'Galaxy A05s', category: 'budget', releaseYear: 2023, basePrice128GB: 5000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a05s.jpg' },
  { id: 'catalog-samsung-galaxy-a25-5g', brandId: 'brand-samsung', name: 'Galaxy A25 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 8500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a25-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f04', brandId: 'brand-samsung', name: 'Galaxy F04', category: 'budget', releaseYear: 2023, basePrice128GB: 4000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f04.jpg' },
  { id: 'catalog-samsung-galaxy-f14-5g', brandId: 'brand-samsung', name: 'Galaxy F14 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f14-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f34-5g', brandId: 'brand-samsung', name: 'Galaxy F34 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 9000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f34-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f54-5g', brandId: 'brand-samsung', name: 'Galaxy F54 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 12000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f54-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m14-5g', brandId: 'brand-samsung', name: 'Galaxy M14 5G', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m14-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m34-5g', brandId: 'brand-samsung', name: 'Galaxy M34 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 9000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m34-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m54-5g', brandId: 'brand-samsung', name: 'Galaxy M54 5G', category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m54.jpg' },
  { id: 'catalog-samsung-galaxy-s23', brandId: 'brand-samsung', name: 'Galaxy S23+', category: 'premium', releaseYear: 2023, basePrice128GB: 24000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-plus.jpg' },
  { id: 'catalog-samsung-galaxy-z-flip5', brandId: 'brand-samsung', name: 'Galaxy Z Flip5', category: 'flagship', releaseYear: 2023, basePrice128GB: 35000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5.jpg' },
  { id: 'catalog-samsung-galaxy-z-fold5', brandId: 'brand-samsung', name: 'Galaxy Z Fold5', category: 'flagship', releaseYear: 2023, basePrice128GB: 58000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg' },
  { id: 'catalog-samsung-galaxy-a06', brandId: 'brand-samsung', name: 'Galaxy A06', category: 'budget', releaseYear: 2024, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a06.jpg' },
  { id: 'catalog-samsung-galaxy-a16-5g', brandId: 'brand-samsung', name: 'Galaxy A16 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 6500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a16-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a35-5g', brandId: 'brand-samsung', name: 'Galaxy A35 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 10000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a55-5g', brandId: 'brand-samsung', name: 'Galaxy A55 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f05', brandId: 'brand-samsung', name: 'Galaxy F05', category: 'budget', releaseYear: 2024, basePrice128GB: 4000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f05.jpg' },
  { id: 'catalog-samsung-galaxy-f14-4g', brandId: 'brand-samsung', name: 'Galaxy F14 4G', category: 'budget', releaseYear: 2024, basePrice128GB: 5000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f14-4g.jpg' },
  { id: 'catalog-samsung-galaxy-f15-5g', brandId: 'brand-samsung', name: 'Galaxy F15 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 6000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f15-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f55-5g', brandId: 'brand-samsung', name: 'Galaxy F55 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f55-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m05', brandId: 'brand-samsung', name: 'Galaxy M05', category: 'budget', releaseYear: 2024, basePrice128GB: 4000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m05.jpg' },
  { id: 'catalog-samsung-galaxy-m14-4g', brandId: 'brand-samsung', name: 'Galaxy M14 4G', category: 'budget', releaseYear: 2024, basePrice128GB: 5000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m14-4g.jpg' },
  { id: 'catalog-samsung-galaxy-m15-5g', brandId: 'brand-samsung', name: 'Galaxy M15 5G', category: 'budget', releaseYear: 2024, basePrice128GB: 6000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m15-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m35-5g', brandId: 'brand-samsung', name: 'Galaxy M35 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 9000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m35-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m55-5g', brandId: 'brand-samsung', name: 'Galaxy M55 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 13000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m55-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m55s-5g', brandId: 'brand-samsung', name: 'Galaxy M55s 5G', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m55s-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a06-5g', brandId: 'brand-samsung', name: 'Galaxy A06 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a06-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a16-4g', brandId: 'brand-samsung', name: 'Galaxy A16 4G', category: 'budget', releaseYear: 2025, basePrice128GB: 6000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a16-4g.jpg' },
  { id: 'catalog-samsung-galaxy-a17-5g', brandId: 'brand-samsung', name: 'Galaxy A17 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 7000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a17-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a26-5g', brandId: 'brand-samsung', name: 'Galaxy A26 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 10000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a26-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a36-5g', brandId: 'brand-samsung', name: 'Galaxy A36 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 12000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a36-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a56-5g', brandId: 'brand-samsung', name: 'Galaxy A56 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 16000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a56-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f06-5g', brandId: 'brand-samsung', name: 'Galaxy F06 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f06-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f16-5g', brandId: 'brand-samsung', name: 'Galaxy F16 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 6500, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f16-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f17-5g', brandId: 'brand-samsung', name: 'Galaxy F17 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 7000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f17-5g.jpg' },
  { id: 'catalog-samsung-galaxy-f36-5g', brandId: 'brand-samsung', name: 'Galaxy F36 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f36-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m06-5g', brandId: 'brand-samsung', name: 'Galaxy M06 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m06-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m16-5g', brandId: 'brand-samsung', name: 'Galaxy M16 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 6500, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m16-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m17-5g', brandId: 'brand-samsung', name: 'Galaxy M17 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 7000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m17-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m36-5g', brandId: 'brand-samsung', name: 'Galaxy M36 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m36-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m56-5g', brandId: 'brand-samsung', name: 'Galaxy M56 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m56-5g.jpg' },
  { id: 'catalog-samsung-galaxy-z-flip7', brandId: 'brand-samsung', name: 'Galaxy Z Flip7', category: 'flagship', releaseYear: 2025, basePrice128GB: 42000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip7.jpg' },
  { id: 'catalog-samsung-galaxy-z-flip7-fe', brandId: 'brand-samsung', name: 'Galaxy Z Flip7 FE', category: 'premium', releaseYear: 2025, basePrice128GB: 32000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip7-fe.jpg' },
  { id: 'catalog-samsung-galaxy-z-fold7', brandId: 'brand-samsung', name: 'Galaxy Z Fold7', category: 'flagship', releaseYear: 2025, basePrice128GB: 68000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold7.jpg' },
  { id: 'catalog-samsung-galaxy-a27-5g', brandId: 'brand-samsung', name: 'Galaxy A27 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 11000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a27-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a37-5g', brandId: 'brand-samsung', name: 'Galaxy A37 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a37-5g.jpg' },
  { id: 'catalog-samsung-galaxy-a57-5g', brandId: 'brand-samsung', name: 'Galaxy A57 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 18000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a57-5g.jpg' },
  { id: 'catalog-samsung-galaxy-m17e-5g', brandId: 'brand-samsung', name: 'Galaxy M17e 5G', category: 'budget', releaseYear: 2026, basePrice128GB: 7000, series: 'M Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m17e-5g.jpg' },
  { id: 'catalog-samsung-galaxy-z-flip8', brandId: 'brand-samsung', name: 'Galaxy Z Flip8', category: 'flagship', releaseYear: 2026, basePrice128GB: 48000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip8.jpg' },
  { id: 'catalog-samsung-galaxy-z-fold8', brandId: 'brand-samsung', name: 'Galaxy Z Fold8', category: 'flagship', releaseYear: 2026, basePrice128GB: 72000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold8.jpg' },
  { id: 'catalog-samsung-galaxy-z-fold8-ultra', brandId: 'brand-samsung', name: 'Galaxy Z Fold8 Ultra', category: 'flagship', releaseYear: 2026, basePrice128GB: 85000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold8-ultra.jpg' },

  // --- MOTOROLA ADDITIONS ---
  { id: 'catalog-motorola-motorola-edge-s', brandId: 'brand-motorola', name: 'Motorola Edge S', category: 'midrange', releaseYear: 2021, basePrice128GB: 16000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-edge-s.jpg' },
  { id: 'catalog-motorola-motorola-moto-e7-power', brandId: 'brand-motorola', name: 'Motorola Moto E7 Power', category: 'budget', releaseYear: 2021, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e7-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g30', brandId: 'brand-motorola', name: 'Motorola Moto G30', category: 'budget', releaseYear: 2021, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g30.jpg' },
  { id: 'catalog-motorola-motorola-moto-g10', brandId: 'brand-motorola', name: 'Motorola Moto G10', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g10.jpg' },
  { id: 'catalog-motorola-motorola-moto-g10-power', brandId: 'brand-motorola', name: 'Motorola Moto G10 Power', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g10-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g100', brandId: 'brand-motorola', name: 'Motorola Moto G100', category: 'premium', releaseYear: 2021, basePrice128GB: 22000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g100-1.jpg' },
  { id: 'catalog-motorola-motorola-moto-g40-fusion', brandId: 'brand-motorola', name: 'Motorola Moto G40 Fusion', category: 'midrange', releaseYear: 2021, basePrice128GB: 8000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g60.jpg' },
  { id: 'catalog-motorola-motorola-moto-g20', brandId: 'brand-motorola', name: 'Motorola Moto G20', category: 'budget', releaseYear: 2021, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g20-.jpg' },
  { id: 'catalog-motorola-motorola-edge-20', brandId: 'brand-motorola', name: 'Motorola Edge 20', category: 'midrange', releaseYear: 2021, basePrice128GB: 14000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-20.jpg' },
  { id: 'catalog-motorola-motorola-edge-20-pro', brandId: 'brand-motorola', name: 'Motorola Edge 20 Pro', category: 'premium', releaseYear: 2021, basePrice128GB: 24000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge20-pro-.jpg' },
  { id: 'catalog-motorola-motorola-edge-20-fusion', brandId: 'brand-motorola', name: 'Motorola Edge 20 Fusion', category: 'midrange', releaseYear: 2021, basePrice128GB: 12000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-20-fusion.jpg' },
  { id: 'catalog-motorola-motorola-moto-g50-5g', brandId: 'brand-motorola', name: 'Motorola Moto G50 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 8000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g50-5g.jpg' },
  { id: 'catalog-motorola-motorola-moto-g31', brandId: 'brand-motorola', name: 'Motorola Moto G31', category: 'budget', releaseYear: 2021, basePrice128GB: 6500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g31-baby-blue.jpg' },
  { id: 'catalog-motorola-motorola-moto-g41', brandId: 'brand-motorola', name: 'Motorola Moto G41', category: 'budget', releaseYear: 2021, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g41-pearl-gold.jpg' },
  { id: 'catalog-motorola-motorola-moto-g51-5g', brandId: 'brand-motorola', name: 'Motorola Moto G51 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 8000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g51-5g-bright-silver.jpg' },
  { id: 'catalog-motorola-motorola-moto-g71-5g', brandId: 'brand-motorola', name: 'Motorola Moto G71 5G', category: 'midrange', releaseYear: 2021, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g71-5g-neptune-green.jpg' },
  { id: 'catalog-motorola-motorola-moto-g200-5g', brandId: 'brand-motorola', name: 'Motorola Moto G200 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 18000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g200-5g-glacier-green.jpg' },
  { id: 'catalog-motorola-motorola-moto-g22', brandId: 'brand-motorola', name: 'Motorola Moto G22', category: 'budget', releaseYear: 2022, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g22.jpg' },
  { id: 'catalog-motorola-motorola-edge-30-pro', brandId: 'brand-motorola', name: 'Motorola Edge 30 Pro', category: 'premium', releaseYear: 2022, basePrice128GB: 28000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-30-pro.jpg' },
  { id: 'catalog-motorola-motorola-moto-g52', brandId: 'brand-motorola', name: 'Motorola Moto G52', category: 'midrange', releaseYear: 2022, basePrice128GB: 8000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g52.jpg' },
  { id: 'catalog-motorola-motorola-edge-30', brandId: 'brand-motorola', name: 'Motorola Edge 30', category: 'midrange', releaseYear: 2022, basePrice128GB: 14000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-30-.jpg' },
  { id: 'catalog-motorola-motorola-moto-e32', brandId: 'brand-motorola', name: 'Motorola Moto E32', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e32.jpg' },
  { id: 'catalog-motorola-motorola-moto-g82', brandId: 'brand-motorola', name: 'Motorola Moto G82', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g82.jpg' },
  { id: 'catalog-motorola-motorola-moto-e32s', brandId: 'brand-motorola', name: 'Motorola Moto E32s', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e32.jpg' },
  { id: 'catalog-motorola-motorola-moto-g42', brandId: 'brand-motorola', name: 'Motorola Moto G42', category: 'budget', releaseYear: 2022, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g42-r.jpg' },
  { id: 'catalog-motorola-motorola-moto-g62-5g', brandId: 'brand-motorola', name: 'Motorola Moto G62 5G', category: 'midrange', releaseYear: 2022, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g62.jpg' },
  { id: 'catalog-motorola-motorola-moto-g32', brandId: 'brand-motorola', name: 'Motorola Moto G32', category: 'midrange', releaseYear: 2022, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g32.jpg' },
  { id: 'catalog-motorola-motorola-moto-g62-india', brandId: 'brand-motorola', name: 'Motorola Moto G62 (India)', category: 'midrange', releaseYear: 2022, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g62.jpg' },
  { id: 'catalog-motorola-motorola-razr-2022', brandId: 'brand-motorola', name: 'Motorola Razr 2022', category: 'flagship', releaseYear: 2022, basePrice128GB: 45000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-razr-2022-1.jpg' },
  { id: 'catalog-motorola-motorola-moto-e22s', brandId: 'brand-motorola', name: 'Motorola Moto E22s', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e22s.jpg' },
  { id: 'catalog-motorola-motorola-edge-30-neo', brandId: 'brand-motorola', name: 'Motorola Edge 30 Neo', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge30-neo-.jpg' },
  { id: 'catalog-motorola-motorola-edge-30-fusion', brandId: 'brand-motorola', name: 'Motorola Edge 30 Fusion', category: 'premium', releaseYear: 2022, basePrice128GB: 18000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge30-fusion.jpg' },
  { id: 'catalog-motorola-motorola-edge-30-ultra', brandId: 'brand-motorola', name: 'Motorola Edge 30 Ultra', category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge30-ultra.jpg' },
  { id: 'catalog-motorola-motorola-moto-e22', brandId: 'brand-motorola', name: 'Motorola Moto E22', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e22.jpg' },
  { id: 'catalog-motorola-motorola-moto-e22i', brandId: 'brand-motorola', name: 'Motorola Moto E22i', category: 'budget', releaseYear: 2022, basePrice128GB: 4500, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e22i.jpg' },
  { id: 'catalog-motorola-motorola-moto-g72', brandId: 'brand-motorola', name: 'Motorola Moto G72', category: 'midrange', releaseYear: 2022, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g72-5g-.jpg' },
  { id: 'catalog-motorola-motorola-moto-e32-india', brandId: 'brand-motorola', name: 'Motorola Moto E32 (India)', category: 'budget', releaseYear: 2022, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e32-india.jpg' },
  { id: 'catalog-motorola-motorola-moto-e13', brandId: 'brand-motorola', name: 'Motorola Moto E13', category: 'budget', releaseYear: 2023, basePrice128GB: 5000, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e13-new.jpg' },
  { id: 'catalog-motorola-motorola-moto-g13', brandId: 'brand-motorola', name: 'Motorola Moto G13', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g13.jpg' },
  { id: 'catalog-motorola-motorola-moto-g23', brandId: 'brand-motorola', name: 'Motorola Moto G23', category: 'budget', releaseYear: 2023, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g23-r.jpg' },
  { id: 'catalog-motorola-motorola-moto-g53', brandId: 'brand-motorola', name: 'Motorola Moto G53', category: 'midrange', releaseYear: 2023, basePrice128GB: 8000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g53.jpg' },
  { id: 'catalog-motorola-motorola-moto-g73', brandId: 'brand-motorola', name: 'Motorola Moto G73', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g73.jpg' },
  { id: 'catalog-motorola-motorola-edge-40-pro', brandId: 'brand-motorola', name: 'Motorola Edge 40 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 32000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-40-pro.jpg' },
  { id: 'catalog-motorola-motorola-razr-40', brandId: 'brand-motorola', name: 'Motorola Razr 40', category: 'premium', releaseYear: 2023, basePrice128GB: 38000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-40.jpg' },
  { id: 'catalog-motorola-motorola-razr-40-ultra', brandId: 'brand-motorola', name: 'Motorola Razr 40 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 48000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-40-ultra.jpg' },
  { id: 'catalog-motorola-motorola-moto-g14', brandId: 'brand-motorola', name: 'Motorola Moto G14', category: 'budget', releaseYear: 2023, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/mototola-g14.jpg' },
  { id: 'catalog-motorola-motorola-moto-g84', brandId: 'brand-motorola', name: 'Motorola Moto G84', category: 'midrange', releaseYear: 2023, basePrice128GB: 12000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g84.jpg' },
  { id: 'catalog-motorola-motorola-moto-g54-power', brandId: 'brand-motorola', name: 'Motorola Moto G54 Power', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g54-10.jpg' },
  { id: 'catalog-motorola-motorola-moto-g54', brandId: 'brand-motorola', name: 'Motorola Moto G54', category: 'midrange', releaseYear: 2023, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g54.jpg' },
  { id: 'catalog-motorola-motorola-edge-40-neo', brandId: 'brand-motorola', name: 'Motorola Edge 40 Neo', category: 'midrange', releaseYear: 2023, basePrice128GB: 14000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-40-neo.jpg' },
  { id: 'catalog-motorola-motorola-moto-g34', brandId: 'brand-motorola', name: 'Motorola Moto G34', category: 'budget', releaseYear: 2023, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g34-china.jpg' },
  { id: 'catalog-motorola-motorola-moto-g24', brandId: 'brand-motorola', name: 'Motorola Moto G24', category: 'budget', releaseYear: 2024, basePrice128GB: 6500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g24.jpg' },
  { id: 'catalog-motorola-motorola-moto-g24-power', brandId: 'brand-motorola', name: 'Motorola Moto G24 Power', category: 'budget', releaseYear: 2024, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g24-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g04s', brandId: 'brand-motorola', name: 'Motorola Moto G04s', category: 'budget', releaseYear: 2024, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g04-4g.jpg' },
  { id: 'catalog-motorola-motorola-moto-g64', brandId: 'brand-motorola', name: 'Motorola Moto G64', category: 'midrange', releaseYear: 2024, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g64.jpg' },
  { id: 'catalog-motorola-motorola-moto-e14', brandId: 'brand-motorola', name: 'Motorola Moto E14', category: 'budget', releaseYear: 2024, basePrice128GB: 4500, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-e14.jpg' },
  { id: 'catalog-motorola-motorola-moto-g85', brandId: 'brand-motorola', name: 'Motorola Moto G85', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g85.jpg' },
  { id: 'catalog-motorola-motorola-moto-g45', brandId: 'brand-motorola', name: 'Motorola Moto G45', category: 'budget', releaseYear: 2024, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g45-5g.jpg' },
  { id: 'catalog-motorola-motorola-moto-g35', brandId: 'brand-motorola', name: 'Motorola Moto G35', category: 'budget', releaseYear: 2024, basePrice128GB: 6500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g35-5g.jpg' },
  { id: 'catalog-motorola-motorola-moto-g55', brandId: 'brand-motorola', name: 'Motorola Moto G55', category: 'midrange', releaseYear: 2024, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g55-5g.jpg' },
  { id: 'catalog-motorola-motorola-edge-50-neo', brandId: 'brand-motorola', name: 'Motorola Edge 50 Neo', category: 'midrange', releaseYear: 2024, basePrice128GB: 16000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-neo.jpg' },
  { id: 'catalog-motorola-motorola-moto-g75', brandId: 'brand-motorola', name: 'Motorola Moto G75', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g75.jpg' },
  { id: 'catalog-motorola-motorola-moto-e15', brandId: 'brand-motorola', name: 'Motorola Moto E15', category: 'budget', releaseYear: 2024, basePrice128GB: 4500, series: 'Moto E Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/mototola-moto-e15.jpg' },
  { id: 'catalog-motorola-motorola-moto-g05', brandId: 'brand-motorola', name: 'Motorola Moto G05', category: 'budget', releaseYear: 2024, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/mototola-moto-g05.jpg' },
  { id: 'catalog-motorola-motorola-moto-g15-power', brandId: 'brand-motorola', name: 'Motorola Moto G15 Power', category: 'budget', releaseYear: 2024, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/mototola-g15-r.jpg' },
  { id: 'catalog-motorola-motorola-moto-g15', brandId: 'brand-motorola', name: 'Motorola Moto G15', category: 'budget', releaseYear: 2024, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/mototola-moto-g15.jpg' },
  { id: 'catalog-motorola-motorola-moto-g96-5g', brandId: 'brand-motorola', name: 'Motorola Moto G96 5G', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-g96.jpg' },
  { id: 'catalog-motorola-motorola-moto-g86-power', brandId: 'brand-motorola', name: 'Motorola Moto G86 Power', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g86-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g86', brandId: 'brand-motorola', name: 'Motorola Moto G86', category: 'midrange', releaseYear: 2025, basePrice128GB: 12000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g86.jpg' },
  { id: 'catalog-motorola-motorola-moto-g56', brandId: 'brand-motorola', name: 'Motorola Moto G56', category: 'midrange', releaseYear: 2025, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g56.jpg' },
  { id: 'catalog-motorola-motorola-edge-60-neo', brandId: 'brand-motorola', name: 'Motorola Edge 60 Neo', category: 'midrange', releaseYear: 2025, basePrice128GB: 16000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-60-neo.jpg' },
  { id: 'catalog-motorola-motorola-moto-g06-power', brandId: 'brand-motorola', name: 'Motorola Moto G06 Power', category: 'budget', releaseYear: 2025, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g06-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g06', brandId: 'brand-motorola', name: 'Motorola Moto G06', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g06.jpg' },
  { id: 'catalog-motorola-motorola-moto-g67-power', brandId: 'brand-motorola', name: 'Motorola Moto G67 Power', category: 'midrange', releaseYear: 2025, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g100-cn.jpg' },
  { id: 'catalog-motorola-motorola-moto-g57-power', brandId: 'brand-motorola', name: 'Motorola Moto G57 Power', category: 'midrange', releaseYear: 2025, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g57-power-.jpg' },
  { id: 'catalog-motorola-motorola-moto-g57', brandId: 'brand-motorola', name: 'Motorola Moto G57', category: 'midrange', releaseYear: 2025, basePrice128GB: 8500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g57.jpg' },
  { id: 'catalog-motorola-motorola-signature', brandId: 'brand-motorola', name: 'Motorola Signature', category: 'flagship', releaseYear: 2026, basePrice128GB: 60000, series: 'Other', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-signature.jpg' },
  { id: 'catalog-motorola-motorola-razr-fold', brandId: 'brand-motorola', name: 'Motorola Razr Fold', category: 'flagship', releaseYear: 2026, basePrice128GB: 65000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-fold-.jpg' },
  { id: 'catalog-motorola-motorola-moto-g17', brandId: 'brand-motorola', name: 'Motorola Moto G17', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g17.jpg' },
  { id: 'catalog-motorola-motorola-moto-g17-power', brandId: 'brand-motorola', name: 'Motorola Moto G17 Power', category: 'budget', releaseYear: 2026, basePrice128GB: 6500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g17-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g67-5g', brandId: 'brand-motorola', name: 'Motorola Moto G67 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 9000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g67.jpg' },
  { id: 'catalog-motorola-motorola-moto-g77-5g', brandId: 'brand-motorola', name: 'Motorola Moto G77 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 11000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g77.jpg' },
  { id: 'catalog-motorola-motorola-edge-70-fusion', brandId: 'brand-motorola', name: 'Motorola Edge 70 Fusion+', category: 'midrange', releaseYear: 2026, basePrice128GB: 22000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-70-fusion-plus.jpg' },
  { id: 'catalog-motorola-motorola-razr-70-ultra', brandId: 'brand-motorola', name: 'Motorola Razr 70 Ultra', category: 'flagship', releaseYear: 2026, basePrice128GB: 55000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-ultra-2026.jpg' },
  { id: 'catalog-motorola-motorola-razr-70', brandId: 'brand-motorola', name: 'Motorola Razr 70+', category: 'flagship', releaseYear: 2026, basePrice128GB: 48000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-plus-2026.jpg' },
  { id: 'catalog-motorola-motorola-razr-70', brandId: 'brand-motorola', name: 'Motorola Razr 70', category: 'premium', releaseYear: 2026, basePrice128GB: 38000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-2026.jpg' },
  { id: 'catalog-motorola-motorola-moto-g47', brandId: 'brand-motorola', name: 'Motorola Moto G47', category: 'budget', releaseYear: 2026, basePrice128GB: 7000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-g47.jpg' },
  { id: 'catalog-motorola-motorola-moto-g87', brandId: 'brand-motorola', name: 'Motorola Moto G87', category: 'midrange', releaseYear: 2026, basePrice128GB: 12000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-g87.jpg' },
  { id: 'catalog-motorola-motorola-moto-g37', brandId: 'brand-motorola', name: 'Motorola Moto G37', category: 'budget', releaseYear: 2026, basePrice128GB: 6000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g37.jpg' },
  { id: 'catalog-motorola-motorola-moto-g37-power', brandId: 'brand-motorola', name: 'Motorola Moto G37 Power', category: 'budget', releaseYear: 2026, basePrice128GB: 6500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g37-power.jpg' },
  { id: 'catalog-motorola-motorola-edge-70-pro', brandId: 'brand-motorola', name: 'Motorola Edge 70 Pro+', category: 'premium', releaseYear: 2026, basePrice128GB: 32000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-70-pro-plus.jpg' },
  { id: 'catalog-motorola-motorola-edge-70-max', brandId: 'brand-motorola', name: 'Motorola Edge 70 Max', category: 'midrange', releaseYear: 2026, basePrice128GB: 16000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-70-max.jpg' },
  { id: 'catalog-motorola-motorola-moto-g77-power', brandId: 'brand-motorola', name: 'Motorola Moto G77 Power', category: 'midrange', releaseYear: 2026, basePrice128GB: 10000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g77-power.jpg' },
  { id: 'catalog-motorola-motorola-moto-g-max-5g', brandId: 'brand-motorola', name: 'Motorola Moto G Max 5G', category: 'midrange', releaseYear: 2026, basePrice128GB: 12000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorolamoto-g-max.jpg' },

  // --- OPPO ADDITIONS ---
  { id: 'catalog-oppo-find-x3-pro', brandId: 'brand-oppo', name: 'OPPO Find X3 Pro', category: 'flagship', releaseYear: 2021, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x3-pro.jpg' },
  { id: 'catalog-oppo-f19', brandId: 'brand-oppo', name: 'OPPO F19', category: 'midrange', releaseYear: 2021, basePrice128GB: 12000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f19.jpg' },
  { id: 'catalog-oppo-f19-pro', brandId: 'brand-oppo', name: 'OPPO F19 Pro', category: 'midrange', releaseYear: 2021, basePrice128GB: 14000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f19-pro.jpg' },
  { id: 'catalog-oppo-f19-pro-5g', brandId: 'brand-oppo', name: 'OPPO F19 Pro+ 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 24000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f19-pro-plus-5g.jpg' },
  { id: 'catalog-oppo-f19s', brandId: 'brand-oppo', name: 'OPPO F19s', category: 'midrange', releaseYear: 2021, basePrice128GB: 12000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f19s.jpg' },
  { id: 'catalog-oppo-a54', brandId: 'brand-oppo', name: 'OPPO A54', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a54.jpg' },
  { id: 'catalog-oppo-a15s', brandId: 'brand-oppo', name: 'OPPO A15s', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a15s.jpg' },
  { id: 'catalog-oppo-a74', brandId: 'brand-oppo', name: 'OPPO A74', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a74.jpg' },
  { id: 'catalog-oppo-a94', brandId: 'brand-oppo', name: 'OPPO A94', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a94.jpg' },
  { id: 'catalog-oppo-a53s', brandId: 'brand-oppo', name: 'OPPO A53s', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a53s.jpg' },
  { id: 'catalog-oppo-a16', brandId: 'brand-oppo', name: 'OPPO A16', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a16.jpg' },
  { id: 'catalog-oppo-a16s', brandId: 'brand-oppo', name: 'OPPO A16s', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a16s.jpg' },
  { id: 'catalog-oppo-a16k', brandId: 'brand-oppo', name: 'OPPO A16K', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a16k.jpg' },
  { id: 'catalog-oppo-a16e', brandId: 'brand-oppo', name: 'OPPO A16e', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a16e.jpg' },
  { id: 'catalog-oppo-a55', brandId: 'brand-oppo', name: 'OPPO A55', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a55.jpg' },
  { id: 'catalog-oppo-a54s', brandId: 'brand-oppo', name: 'OPPO A54s', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a54s.jpg' },
  { id: 'catalog-oppo-a95', brandId: 'brand-oppo', name: 'OPPO A95', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a95.jpg' },
  { id: 'catalog-oppo-a93', brandId: 'brand-oppo', name: 'OPPO A93', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a93.jpg' },
  { id: 'catalog-oppo-a15', brandId: 'brand-oppo', name: 'OPPO A15', category: 'budget', releaseYear: 2021, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a15.jpg' },
  { id: 'catalog-oppo-reno5', brandId: 'brand-oppo', name: 'OPPO Reno5', category: 'midrange', releaseYear: 2021, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno5.jpg' },
  { id: 'catalog-oppo-reno5-pro', brandId: 'brand-oppo', name: 'OPPO Reno5 Pro', category: 'premium', releaseYear: 2021, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno5-pro.jpg' },
  { id: 'catalog-oppo-reno6', brandId: 'brand-oppo', name: 'OPPO Reno6', category: 'midrange', releaseYear: 2021, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno6.jpg' },
  { id: 'catalog-oppo-reno6-pro-5g', brandId: 'brand-oppo', name: 'OPPO Reno6 Pro 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno6-pro-5g.jpg' },
  { id: 'catalog-oppo-reno6-pro-plus-5g', brandId: 'brand-oppo', name: 'OPPO Reno6 Pro+ 5G', category: 'premium', releaseYear: 2021, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno6-pro-plus-5g.jpg' },
  { id: 'catalog-oppo-find-x5-pro', brandId: 'brand-oppo', name: 'OPPO Find X5 Pro', category: 'flagship', releaseYear: 2022, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x5-pro.jpg' },
  { id: 'catalog-oppo-find-x5', brandId: 'brand-oppo', name: 'OPPO Find X5', category: 'flagship', releaseYear: 2022, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x5.jpg' },
  { id: 'catalog-oppo-f21-pro', brandId: 'brand-oppo', name: 'OPPO F21 Pro', category: 'midrange', releaseYear: 2022, basePrice128GB: 14000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f21-pro.jpg' },
  { id: 'catalog-oppo-a96', brandId: 'brand-oppo', name: 'OPPO A96', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a96.jpg' },
  { id: 'catalog-oppo-a76', brandId: 'brand-oppo', name: 'OPPO A76', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a76.jpg' },
  { id: 'catalog-oppo-a36', brandId: 'brand-oppo', name: 'OPPO A36', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a36.jpg' },
  { id: 'catalog-oppo-a57', brandId: 'brand-oppo', name: 'OPPO A57', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a57.jpg' },
  { id: 'catalog-oppo-a57-4g', brandId: 'brand-oppo', name: 'OPPO A57 4G', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a57-4g.jpg' },
  { id: 'catalog-oppo-a77', brandId: 'brand-oppo', name: 'OPPO A77', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a77.jpg' },
  { id: 'catalog-oppo-a77s', brandId: 'brand-oppo', name: 'OPPO A77s', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a77s.jpg' },
  { id: 'catalog-oppo-a17', brandId: 'brand-oppo', name: 'OPPO A17', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a17.jpg' },
  { id: 'catalog-oppo-a17k', brandId: 'brand-oppo', name: 'OPPO A17k', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a17k.jpg' },
  { id: 'catalog-oppo-a55s', brandId: 'brand-oppo', name: 'OPPO A55s', category: 'budget', releaseYear: 2022, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a55s.jpg' },
  { id: 'catalog-oppo-reno7', brandId: 'brand-oppo', name: 'OPPO Reno7', category: 'midrange', releaseYear: 2022, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno7.jpg' },
  { id: 'catalog-oppo-reno7-pro-5g', brandId: 'brand-oppo', name: 'OPPO Reno7 Pro 5G', category: 'premium', releaseYear: 2022, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno7-pro-5g.jpg' },
  { id: 'catalog-oppo-reno8', brandId: 'brand-oppo', name: 'OPPO Reno8', category: 'midrange', releaseYear: 2022, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-8.jpg' },
  { id: 'catalog-oppo-reno8-4g', brandId: 'brand-oppo', name: 'OPPO Reno8 4G', category: 'midrange', releaseYear: 2022, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno8-4g.jpg' },
  { id: 'catalog-oppo-reno8-pro-5g', brandId: 'brand-oppo', name: 'OPPO Reno8 Pro 5G', category: 'premium', releaseYear: 2022, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno8-pro-5g.jpg' },
  { id: 'catalog-oppo-a98', brandId: 'brand-oppo', name: 'OPPO A98', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a98.jpg' },
  { id: 'catalog-oppo-a78', brandId: 'brand-oppo', name: 'OPPO A78', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a78.jpg' },
  { id: 'catalog-oppo-a78-4g', brandId: 'brand-oppo', name: 'OPPO A78 4G', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a78-4g.jpg' },
  { id: 'catalog-oppo-a58-4g', brandId: 'brand-oppo', name: 'OPPO A58 4G', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a58-4g.jpg' },
  { id: 'catalog-oppo-a38', brandId: 'brand-oppo', name: 'OPPO A38', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a38.jpg' },
  { id: 'catalog-oppo-a18', brandId: 'brand-oppo', name: 'OPPO A18', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a18.jpg' },
  { id: 'catalog-oppo-a79', brandId: 'brand-oppo', name: 'OPPO A79', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a79.jpg' },
  { id: 'catalog-oppo-a59', brandId: 'brand-oppo', name: 'OPPO A59', category: 'budget', releaseYear: 2023, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a59.jpg' },
  { id: 'catalog-oppo-find-x6-pro', brandId: 'brand-oppo', name: 'OPPO Find X6 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7-ultra.jpg' },
  { id: 'catalog-oppo-find-x7-ultra', brandId: 'brand-oppo', name: 'OPPO Find X7 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7-ultra.jpg' },
  { id: 'catalog-oppo-reno10', brandId: 'brand-oppo', name: 'OPPO Reno10', category: 'midrange', releaseYear: 2023, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-10.jpg' },
  { id: 'catalog-oppo-reno10-pro', brandId: 'brand-oppo', name: 'OPPO Reno10 Pro', category: 'premium', releaseYear: 2023, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno10-pro-international.jpg' },
  { id: 'catalog-oppo-reno10-pro-plus', brandId: 'brand-oppo', name: 'OPPO Reno10 Pro+', category: 'premium', releaseYear: 2023, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-10-pro-plus.jpg' },
  { id: 'catalog-oppo-reno11-pro', brandId: 'brand-oppo', name: 'OPPO Reno11 Pro', category: 'premium', releaseYear: 2023, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-11-pro.jpg' },
  { id: 'catalog-oppo-reno11', brandId: 'brand-oppo', name: 'OPPO Reno11', category: 'midrange', releaseYear: 2023, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-11.jpg' },
  { id: 'catalog-oppo-reno11-f', brandId: 'brand-oppo', name: 'OPPO Reno11 F', category: 'midrange', releaseYear: 2023, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno11-f.jpg' },
  { id: 'catalog-oppo-a60', brandId: 'brand-oppo', name: 'OPPO A60', category: 'budget', releaseYear: 2024, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a60.jpg' },
  { id: 'catalog-oppo-a80', brandId: 'brand-oppo', name: 'OPPO A80', category: 'budget', releaseYear: 2024, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a80.jpg' },
  { id: 'catalog-oppo-a2', brandId: 'brand-oppo', name: 'OPPO A2', category: 'budget', releaseYear: 2024, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a2.jpg' },
  { id: 'catalog-oppo-find-x7', brandId: 'brand-oppo', name: 'OPPO Find X7', category: 'flagship', releaseYear: 2024, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7.jpg' },
  { id: 'catalog-oppo-reno12', brandId: 'brand-oppo', name: 'OPPO Reno12', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-12.jpg' },
  { id: 'catalog-oppo-reno12-pro', brandId: 'brand-oppo', name: 'OPPO Reno12 Pro', category: 'premium', releaseYear: 2024, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-12-pro.jpg' },
  { id: 'catalog-oppo-reno12-f', brandId: 'brand-oppo', name: 'OPPO Reno12 F', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno12-f.jpg' },
  { id: 'catalog-oppo-reno12-f-4g', brandId: 'brand-oppo', name: 'OPPO Reno12 F 4G', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno12-f-4g.jpg' },
  { id: 'catalog-oppo-reno13-pro', brandId: 'brand-oppo', name: 'OPPO Reno13 Pro', category: 'premium', releaseYear: 2024, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-13-pro.jpg' },
  { id: 'catalog-oppo-reno13', brandId: 'brand-oppo', name: 'OPPO Reno13', category: 'premium', releaseYear: 2024, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-13.jpg' },
  { id: 'catalog-oppo-a6-4g', brandId: 'brand-oppo', name: 'OPPO A6 4G', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6-4g.jpg' },
  { id: 'catalog-oppo-a6-pro-india', brandId: 'brand-oppo', name: 'OPPO A6 Pro (India)', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6-pro.jpg' },
  { id: 'catalog-oppo-a6-pro-4g', brandId: 'brand-oppo', name: 'OPPO A6 Pro 4G', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6-pro-4g.jpg' },
  { id: 'catalog-oppo-a6x-india', brandId: 'brand-oppo', name: 'OPPO A6x (India)', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6x.jpg' },
  { id: 'catalog-oppo-a6s', brandId: 'brand-oppo', name: 'OPPO A6s', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6s.jpg' },
  { id: 'catalog-oppo-a6s-5g', brandId: 'brand-oppo', name: 'OPPO A6s 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6s-5g.jpg' },
  { id: 'catalog-oppo-a6t', brandId: 'brand-oppo', name: 'OPPO A6t', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6t.jpg' },
  { id: 'catalog-oppo-a6t-5g', brandId: 'brand-oppo', name: 'OPPO A6t 5G', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6t-5g.jpg' },
  { id: 'catalog-oppo-a6t-pro-4g', brandId: 'brand-oppo', name: 'OPPO A6t Pro 4G', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6t-pro-4g.jpg' },
  { id: 'catalog-oppo-reno13-f', brandId: 'brand-oppo', name: 'OPPO Reno13 F', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno13-f.jpg' },
  { id: 'catalog-oppo-reno13-f-4g', brandId: 'brand-oppo', name: 'OPPO Reno13 F 4G', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno13-f-4g.jpg' },
  { id: 'catalog-oppo-reno14', brandId: 'brand-oppo', name: 'OPPO Reno14', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-14.jpg' },
  { id: 'catalog-oppo-reno14-pro', brandId: 'brand-oppo', name: 'OPPO Reno14 Pro', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-14-pro.jpg' },
  { id: 'catalog-oppo-reno14-f', brandId: 'brand-oppo', name: 'OPPO Reno14 F', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno14-f.jpg' },
  { id: 'catalog-oppo-reno15c-india', brandId: 'brand-oppo', name: 'OPPO Reno15c (India)', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno15c.jpg' },
  { id: 'catalog-oppo-reno15-fs', brandId: 'brand-oppo', name: 'OPPO Reno15 FS', category: 'premium', releaseYear: 2025, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno15-fs.jpg' },
  { id: 'catalog-oppo-find-x8s', brandId: 'brand-oppo', name: 'OPPO Find X8s', category: 'flagship', releaseYear: 2025, basePrice128GB: 48000, series: 'Find X Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8s.jpg' },
  { id: 'catalog-oppo-a6-gt', brandId: 'brand-oppo', name: 'OPPO A6 GT', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6-gt.jpg' },
  { id: 'catalog-oppo-a6-max', brandId: 'brand-oppo', name: 'OPPO A6 Max', category: 'premium', releaseYear: 2026, basePrice128GB: 24000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6-max.jpg' },
  { id: 'catalog-oppo-a6c', brandId: 'brand-oppo', name: 'OPPO A6c', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6c.jpg' },
  { id: 'catalog-oppo-a6k', brandId: 'brand-oppo', name: 'OPPO A6k', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6k.jpg' },
  { id: 'catalog-oppo-a6s-india', brandId: 'brand-oppo', name: 'OPPO A6s (India)', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6s.jpg' },
  { id: 'catalog-oppo-a6s-pro', brandId: 'brand-oppo', name: 'OPPO A6s Pro', category: 'midrange', releaseYear: 2026, basePrice128GB: 14000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a6s-pro.jpg' },
  { id: 'catalog-oppo-reno15-pro-india', brandId: 'brand-oppo', name: 'OPPO Reno15 Pro (India)', category: 'premium', releaseYear: 2026, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno15-pro.jpg' },
  { id: 'catalog-oppo-reno15-f', brandId: 'brand-oppo', name: 'OPPO Reno15 F', category: 'premium', releaseYear: 2026, basePrice128GB: 28000, series: 'Reno Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno15-f.jpg' },
  { id: 'catalog-oppo-k14', brandId: 'brand-oppo', name: 'OPPO K14', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'K Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-k14.jpg' },
  { id: 'catalog-oppo-k14x', brandId: 'brand-oppo', name: 'OPPO K14x', category: 'budget', releaseYear: 2026, basePrice128GB: 5500, series: 'K Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-k14x.jpg' },
  { id: 'catalog-oppo-a7-pro-max', brandId: 'brand-oppo', name: 'OPPO A7 Pro Max', category: 'premium', releaseYear: 2026, basePrice128GB: 24000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a7-pro-max.jpg' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEDICATED TABLET MODELS (Apple iPads & Samsung Galaxy Tabs ONLY)
// ─────────────────────────────────────────────────────────────────────────────
export const TABLET_MODELS: Model[] = [
  // Apple iPads
  { id: 'apple-ipad-pro-m4-13', brandId: 'brand-apple', name: 'iPad Pro 13" (M4)', category: 'flagship', releaseYear: 2024, basePrice128GB: 78000, series: 'iPad Pro', supportedStorageGb: [256, 512, 1024, 2048], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-13-select-wifi-spaceblack-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-pro-m4-11', brandId: 'brand-apple', name: 'iPad Pro 11" (M4)', category: 'flagship', releaseYear: 2024, basePrice128GB: 64000, series: 'iPad Pro', supportedStorageGb: [256, 512, 1024, 2048], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-11-select-wifi-spaceblack-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-air-m2-13', brandId: 'brand-apple', name: 'iPad Air 13" (M2)', category: 'premium', releaseYear: 2024, basePrice128GB: 48000, series: 'iPad Air', supportedStorageGb: [128, 256, 512, 1024], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-13-select-wifi-blue-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-air-m2-11', brandId: 'brand-apple', name: 'iPad Air 11" (M2)', category: 'premium', releaseYear: 2024, basePrice128GB: 39000, series: 'iPad Air', supportedStorageGb: [128, 256, 512, 1024], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-11-select-wifi-starlight-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-10gen', brandId: 'brand-apple', name: 'iPad (10th Generation)', category: 'midrange', releaseYear: 2022, basePrice128GB: 22000, series: 'iPad', supportedStorageGb: [64, 256], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-10th-gen-finish-select-202212-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-mini-7', brandId: 'brand-apple', name: 'iPad mini 7 (A17 Pro)', category: 'premium', releaseYear: 2024, basePrice128GB: 34000, series: 'iPad mini', supportedStorageGb: [128, 256, 512], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-mini-select-wifi-purple-202410?wid=940&hei=1112&fmt=p-jpg&qlt=95' },

  // Samsung Galaxy Tabs
  { id: 'samsung-tab-s10-ultra', brandId: 'brand-samsung', name: 'Galaxy Tab S10 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 72000, series: 'Galaxy Tab S', supportedStorageGb: [256, 512, 1024], supportedRamGb: [12, 16], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x920nzaainu/gallery/in-galaxy-tab-s10-ultra-sm-x920-sm-x920nzaainu-543598501?$650_519_PNG$' },
  { id: 'samsung-tab-s10-plus', brandId: 'brand-samsung', name: 'Galaxy Tab S10+', category: 'flagship', releaseYear: 2024, basePrice128GB: 58000, series: 'Galaxy Tab S', supportedStorageGb: [256, 512], supportedRamGb: [12], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x820nzaainu/gallery/in-galaxy-tab-s10-plus-sm-x820-sm-x820nzaainu-543598462?$650_519_PNG$' },
  { id: 'samsung-tab-s9-ultra', brandId: 'brand-samsung', name: 'Galaxy Tab S9 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 52000, series: 'Galaxy Tab S', supportedStorageGb: [256, 512, 1024], supportedRamGb: [12, 16], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x910nzaainu/gallery/in-galaxy-tab-s9-ultra-sm-x910-sm-x910nzaainu-537466829?$650_519_PNG$' },
  { id: 'samsung-tab-s9-fe', brandId: 'brand-samsung', name: 'Galaxy Tab S9 FE+', category: 'midrange', releaseYear: 2023, basePrice128GB: 26000, series: 'Galaxy Tab FE', supportedStorageGb: [128, 256], supportedRamGb: [8, 12], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x610nzaainu/gallery/in-galaxy-tab-s9-fe-plus-sm-x610-sm-x610nzaainu-538466184?$650_519_PNG$' },
  { id: 'samsung-tab-a9-plus', brandId: 'brand-samsung', name: 'Galaxy Tab A9+', category: 'budget', releaseYear: 2023, basePrice128GB: 12500, series: 'Galaxy Tab A', supportedStorageGb: [64, 128], supportedRamGb: [4, 8], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x210nzaainu/gallery/in-galaxy-tab-a9-plus-sm-x210-sm-x210nzaainu-538622176?$650_519_PNG$' }
];

// ─────────────────────────────────────────────────────────────────────────────
// DEDICATED SMARTWATCH MODELS (Apple Watches & Samsung Galaxy Watches ONLY)
// ─────────────────────────────────────────────────────────────────────────────
export const SMARTWATCH_MODELS: Model[] = [
  // Apple Watches
  { id: 'apple-watch-ultra-2', brandId: 'brand-apple', name: 'Apple Watch Ultra 2', category: 'flagship', releaseYear: 2024, basePrice128GB: 46000, series: 'Apple Watch Ultra', supportedStorageGb: [64], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ultra-black-titanium-select-202409?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-watch-series-10', brandId: 'brand-apple', name: 'Apple Watch Series 10', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Apple Watch Series 10', supportedStorageGb: [64], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/s10-case-unselect-gallery-1-202409?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-watch-series-9', brandId: 'brand-apple', name: 'Apple Watch Series 9', category: 'premium', releaseYear: 2023, basePrice128GB: 21000, series: 'Apple Watch Series 9', supportedStorageGb: [64], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/s9-case-unselect-gallery-1-202309?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-watch-se-2', brandId: 'brand-apple', name: 'Apple Watch SE (2nd Gen)', category: 'midrange', releaseYear: 2023, basePrice128GB: 13500, series: 'Apple Watch SE', supportedStorageGb: [32], supportedRamGb: [0], imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/se-case-unselect-gallery-1-202309?wid=940&hei=1112&fmt=p-jpg&qlt=95' },

  // Samsung Galaxy Watches
  { id: 'samsung-watch-ultra', brandId: 'brand-samsung', name: 'Galaxy Watch Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'Galaxy Watch Ultra', supportedStorageGb: [32], supportedRamGb: [2], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-l705fdaainu/gallery/in-galaxy-watch-ultra-sm-l705-sm-l705fdaainu-542385317?$650_519_PNG$' },
  { id: 'samsung-watch-7', brandId: 'brand-samsung', name: 'Galaxy Watch 7', category: 'premium', releaseYear: 2024, basePrice128GB: 18500, series: 'Galaxy Watch 7', supportedStorageGb: [32], supportedRamGb: [2], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-l310nzaainu/gallery/in-galaxy-watch7-l310-sm-l310nzaainu-542385150?$650_519_PNG$' },
  { id: 'samsung-watch-6-classic', brandId: 'brand-samsung', name: 'Galaxy Watch 6 Classic', category: 'premium', releaseYear: 2023, basePrice128GB: 14500, series: 'Galaxy Watch 6', supportedStorageGb: [16], supportedRamGb: [2], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r950nzkainu/gallery/in-galaxy-watch6-classic-r950-sm-r950nzkainu-537424915?$650_519_PNG$' },
  { id: 'samsung-watch-6', brandId: 'brand-samsung', name: 'Galaxy Watch 6', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Galaxy Watch 6', supportedStorageGb: [16], supportedRamGb: [2], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r930nzeainu/gallery/in-galaxy-watch6-r930-sm-r930nzeainu-537424785?$650_519_PNG$' }
];

export function getModelTierWeight(model: Model): number {
  const name = model.name.toLowerCase();
  if (name.includes('pro max') || name.includes('ultra') || name.includes('fold')) return 100;
  if (name.includes('pro') || name.includes('flip')) return 90;
  if (name.includes('plus') || name.includes('air') || name.includes('edge')) return 80;
  if (name.includes('mini')) return 65;
  if (name.includes('fe') || name.includes('lite') || name.includes('se') || /\b\d+e\b/.test(name) || /\b\d+c\b/.test(name) || name.includes('a3x')) return 50;
  return 70; // standard base model
}

export function sortModelsByLaunchDesc(modelsList: Model[]): Model[] {
  return [...modelsList].sort((a, b) => {
    if (b.releaseYear !== a.releaseYear) {
      return b.releaseYear - a.releaseYear;
    }
    const weightA = getModelTierWeight(a);
    const weightB = getModelTierWeight(b);
    if (weightB !== weightA) {
      return weightB - weightA;
    }
    if (b.basePrice128GB !== a.basePrice128GB) {
      return b.basePrice128GB - a.basePrice128GB;
    }
    return a.name.localeCompare(b.name);
  });
}

const RAW_SMARTPHONE_MODELS: Model[] = sortModelsByLaunchDesc([
  ...BASE_MODELS,
  ...CATALOG_ADDITIONS.filter((addition) => !BASE_MODELS.some((model) =>
    model.brandId === addition.brandId && model.name.toLowerCase() === addition.name.toLowerCase(),
  )),
].filter(m => !isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id)));

export const SMARTPHONE_MODELS: Model[] = sortModelsByLaunchDesc(RAW_SMARTPHONE_MODELS.map(m => {
  const vp = buildVariantPricesForModel(m);
  const maxPrice = Object.values(vp).length > 0 ? Math.max(...Object.values(vp)) : m.basePrice128GB;
  return {
    ...m,
    basePrice128GB: maxPrice,
    variantPrices: vp
  };
}));

export const TABLET_MODELS_WITH_PRICES: Model[] = sortModelsByLaunchDesc(TABLET_MODELS.map(m => {
  const vp = buildVariantPricesForModel(m);
  const maxPrice = Object.values(vp).length > 0 ? Math.max(...Object.values(vp)) : m.basePrice128GB;
  return {
    ...m,
    basePrice128GB: maxPrice,
    variantPrices: vp
  };
}));

export const SMARTWATCH_MODELS_WITH_PRICES: Model[] = sortModelsByLaunchDesc(SMARTWATCH_MODELS.map(m => {
  const vp = buildVariantPricesForModel(m);
  const maxPrice = Object.values(vp).length > 0 ? Math.max(...Object.values(vp)) : m.basePrice128GB;
  return {
    ...m,
    basePrice128GB: maxPrice,
    variantPrices: vp
  };
}));

export const MODELS: Model[] = sortModelsByLaunchDesc([
  ...SMARTPHONE_MODELS,
  ...TABLET_MODELS_WITH_PRICES,
  ...SMARTWATCH_MODELS_WITH_PRICES,
]).map(m => {
  const supportedStorageGb = getModelSupportedStorage(m);
  const supportedRamGb = getModelSupportedRam(m);
  const variantPrices = buildVariantPricesForModel(m);
  return {
    ...m,
    supportedStorageGb,
    supportedRamGb,
    variantPrices,
  };
});

// Helper to get historically accurate colors for a model
function getColorsForModel(model: Model): string[] {
  if (model.brandId === 'brand-apple') {
    const name = model.name;
    const year = model.releaseYear;
    // iPhone 15 Pro / 17 Pro series → Titanium palette
    if ((name.includes('Pro') || name.includes('Air')) && year >= 2023) {
      return ['Natural Titanium', 'Black Titanium', 'White Titanium', 'Desert Titanium'];
    }
    // iPhone 15 / 16 / 17 non-Pro → pastel palette
    if (year >= 2023 && !name.includes('Pro')) {
      return ['Black', 'Blue', 'Green', 'Yellow', 'Pink'];
    }
    // iPhone 12–14 series
    if (year >= 2020 && year <= 2022) {
      return ['Midnight', 'Starlight', 'Blue', 'Purple', 'Product RED'];
    }
    // iPhone 11 and older
    if (year <= 2019) {
      return ['Space Gray', 'Silver', 'Gold', 'Midnight Green'];
    }
    // iPhone SE models
    if (name.includes('SE')) {
      return ['Midnight', 'Starlight', 'Product RED'];
    }
    return ['Space Gray', 'Silver', 'Gold', 'Blue'];
  }

  if (model.brandId === 'brand-samsung') {
    // Z Fold & Flip series
    if (model.series === 'Z Fold & Z Flip') {
      return ['Phantom Black', 'Phantom Silver', 'Bespoke Edition'];
    }
    // S series flagships
    if (model.series === 'S Series' && model.releaseYear >= 2023) {
      return ['Phantom Black', 'Cream', 'Lavender', 'Green'];
    }
    if (model.series === 'S Series') {
      return ['Phantom Black', 'Phantom Silver', 'Phantom Gray', 'Phantom Violet'];
    }
    // A series
    return ['Awesome Black', 'Awesome White', 'Awesome Blue', 'Awesome Violet'];
  }

  if (model.brandId === 'brand-google') {
    return ['Obsidian', 'Porcelain', 'Hazel', 'Coral'];
  }

  // Default for Xiaomi, vivo, OnePlus
  return ['Obsidian Black', 'Marble Gray', 'Cobalt Violet', 'Titanium Yellow'];
}

// Helper to programmatically generate variants for a model
export function generateVariantsForModel(model: Model): Variant[] {
  // High-end flagships that start at 256GB in real life (Apple discontinued 128GB on Pro/Flagship models)
  const startsAt256GB = [
    'apple-17pm', 'apple-17p', 'apple-17air', 'apple-17',
    'apple-16pm', 'apple-16p',
    'apple-15pm',
    'sam-s23u', 'sam-s24u', 'sam-s25u',
    'sam-fold3', 'sam-fold4', 'sam-fold5', 'sam-fold6'
  ];

  const has1TB = ['apple-17pm', 'apple-17p', 'apple-16pm', 'apple-16p', 'apple-15pm', 'apple-15p', 'sam-s23u', 'sam-s24u', 'sam-s25u', 'sam-fold5', 'sam-fold6'];

  let modelStorages: { gb: number; multiplier: number }[] = [];

  if (model.variantPrices && Object.keys(model.variantPrices).length > 0) {
    // Use explicit variant prices — derive storage list from variantPrices keys
    const storageSet = new Set<number>();
    Object.keys(model.variantPrices).forEach(key => {
      const parts = key.split('_');
      const storageGb = Number(parts[parts.length - 1]);
      if (!isNaN(storageGb)) storageSet.add(storageGb);
    });
    const sortedStorages = Array.from(storageSet).sort((a, b) => a - b);
    const colors = getColorsForModel(model);
    const variants: Variant[] = [];
    sortedStorages.forEach(storageGb => {
      // Find the best price for this storage across all RAM variants
      let bestPrice = model.basePrice128GB;
      Object.entries(model.variantPrices!).forEach(([key, price]) => {
        const parts = key.split('_');
        const s = Number(parts[parts.length - 1]);
        if (s === storageGb) bestPrice = Math.min(bestPrice === model.basePrice128GB ? Infinity : bestPrice, price);
      });
      if (bestPrice === Infinity) bestPrice = model.basePrice128GB;
      colors.slice(0, storageGb >= 1024 ? 2 : 4).forEach(color => {
        variants.push({
          id: `var-${model.id}-${storageGb}-${color.toLowerCase().replace(/\s+/g, '-')}`,
          modelId: model.id,
          storageGb,
          color,
          basePrice: bestPrice,
        });
      });
    });
    return variants;
  }

  if (model.supportedStorageGb && Array.isArray(model.supportedStorageGb) && model.supportedStorageGb.length > 0) {
    const storageMultiplierMap: Record<number, number> = {
      64: 0.88,
      128: 1.00,
      256: 1.15,
      512: 1.32,
      1024: 1.55,
    };
    const sortedGbs = [...model.supportedStorageGb].sort((a, b) => a - b);
    const minGb = sortedGbs[0];
    modelStorages = sortedGbs.map(gb => {
      const rawMult = storageMultiplierMap[gb] || (gb >= 512 ? 1.35 : 1.0);
      const minMult = storageMultiplierMap[minGb] || 1.0;
      return {
        gb,
        multiplier: Number((rawMult / minMult).toFixed(2))
      };
    });
  } else if (startsAt256GB.includes(model.id)) {
    modelStorages = [
      { gb: 256, multiplier: 1.00 },
      { gb: 512, multiplier: 1.15 }
    ];
    if (has1TB.includes(model.id)) {
      modelStorages.push({ gb: 1024, multiplier: 1.35 });
    }
  } else if (model.category === 'budget') {
    modelStorages = [
      { gb: 64, multiplier: 0.90 },
      { gb: 128, multiplier: 1.00 }
    ];
    if (model.releaseYear >= 2022) {
      modelStorages.push({ gb: 256, multiplier: 1.12 });
    }
  } else if (model.category === 'midrange') {
    modelStorages = [
      { gb: 128, multiplier: 1.00 },
      { gb: 256, multiplier: 1.12 }
    ];
    if (model.releaseYear >= 2023) {
      modelStorages.push({ gb: 512, multiplier: 1.28 });
    }
  } else {
    modelStorages = [
      { gb: 128, multiplier: 1.00 },
      { gb: 256, multiplier: 1.12 },
      { gb: 512, multiplier: 1.28 }
    ];
    if (has1TB.includes(model.id)) {
      modelStorages.push({ gb: 1024, multiplier: 1.48 });
    }
  }

  const colors = getColorsForModel(model);

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

/** Returns supported RAM options (GB) for a model. Returns [0] for Apple devices */
export function getModelSupportedRam(model: Model): number[] {
  if (isAppleDevice(model.brandId, model.name)) {
    return [0];
  }
  if (isSmartwatchDevice(model.brandId, model.name, model.id)) {
    return [2];
  }
  if (model.supportedRamGb && Array.isArray(model.supportedRamGb) && model.supportedRamGb.length > 0) {
    return model.supportedRamGb;
  }
  const modelPrices = (actualPrices as Record<string, any>)[model.id];
  if (modelPrices && modelPrices.ourPrices && Object.keys(modelPrices.ourPrices).length > 0) {
    const rams = Array.from(new Set(
      Object.keys(modelPrices.ourPrices).map(k => Number(k.split('_')[0])).filter(r => !isNaN(r))
    )).sort((a, b) => a - b);
    if (rams.length > 0) return rams;
  }
  // Android Smartphones & Android Tablets defaults based on category
  if (model.category === 'flagship') return [8, 12, 16];
  if (model.category === 'premium') return [8, 12];
  if (model.category === 'midrange') return [6, 8, 12];
  return [2, 4, 6, 8];
}

/** Returns accurate supported storage options (GB) for a model (eliminates 128GB for Pro Max, Ultra, Fold models) */
export function getModelSupportedStorage(model: Model): number[] {
  const modelPrices = (actualPrices as Record<string, any>)[model.id];
  if (modelPrices && modelPrices.ourPrices && Object.keys(modelPrices.ourPrices).length > 0) {
    const storages = Array.from(new Set(
      Object.keys(modelPrices.ourPrices).map(k => Number(k.split('_')[1])).filter(s => !isNaN(s) && s > 0)
    )).sort((a, b) => a - b);
    if (storages.length > 0) return storages;
  }

  if (model.supportedStorageGb && Array.isArray(model.supportedStorageGb) && model.supportedStorageGb.length > 0) {
    return [...model.supportedStorageGb].sort((a, b) => a - b);
  }

  const nameLower = model.name.toLowerCase();
  const isProMaxOrUltra = nameLower.includes('pro max') || nameLower.includes('17 pro') || nameLower.includes('17 air') || nameLower.includes('ultra') || nameLower.includes('fold');

  if (isProMaxOrUltra) {
    return nameLower.includes('17') || nameLower.includes('m4') ? [256, 512, 1024, 2048] : [256, 512, 1024];
  }
  if (model.category === 'budget') {
    return [32, 64, 128, 256];
  }
  return [128, 256, 512];
}

/** Generates the full record of +3% Cashify prices for all supported RAM and storage variants of a model */
export function buildVariantPricesForModel(model: Model): Record<string, number> {
  if (model.variantPrices && Object.keys(model.variantPrices).length > 0) {
    return model.variantPrices;
  }
  const modelPrices = (actualPrices as Record<string, any>)[model.id];
  if (modelPrices && modelPrices.ourPrices && Object.keys(modelPrices.ourPrices).length > 0) {
    return { ...modelPrices.ourPrices };
  }

  const rams = getModelSupportedRam(model);
  const storages = getModelSupportedStorage(model);
  const isApple = isAppleDevice(model.brandId, model.name);
  const minRam = Math.min(...rams.filter(r => r > 0));

  const map: Record<string, number> = {};
  for (const r of rams) {
    for (const s of storages) {
      let baseCashify = predictCashifyPrice(model.brandId, model.name, model.category, model.releaseYear, s);
      if (!isApple && r > 0 && rams.length > 1 && !isNaN(minRam) && isFinite(minRam)) {
        const stepCount = (r - minRam) / 2;
        if (stepCount > 0) {
          baseCashify += Math.round(stepCount * 1200);
        }
      }
      map[`${r}_${s}`] = Math.round(baseCashify * 1.03);
    }
  }
  return map;
}

/** Returns the maximum variant price (Max RAM + Max Storage at +3%) for a model */
export function getMaxVariantPrice(model: Model): number {
  const vp = model.variantPrices || buildVariantPricesForModel(model);
  const prices = Object.values(vp);
  if (prices.length > 0) {
    return Math.max(...prices);
  }
  return model.basePrice128GB;
}

/** Check if a specific RAM+Storage combo is enabled in DB (not turned OFF by admin) */
export function isVariantAvailable(model: Model, ramGb: number, storageGb: number): boolean {
  if (!model || !model.variantPrices) return true;
  let prices: Record<string, number> | null = null;
  if (typeof model.variantPrices === 'string') {
    try {
      prices = JSON.parse(model.variantPrices);
    } catch {
      prices = null;
    }
  } else if (typeof model.variantPrices === 'object' && model.variantPrices !== null) {
    prices = model.variantPrices as Record<string, number>;
  }

  if (!prices || Object.keys(prices).length === 0) return true;
  const key = `${ramGb}_${storageGb}`;
  return prices[key] !== undefined && Number(prices[key]) > 0;
}

/** Get the admin-defined price for a specific RAM+Storage combo, or best-guess fallback */
export function getVariantPrice(model: Model, ramGb: number, storageGb: number): number {
  if (model && model.variantPrices) {
    let prices: Record<string, number> | null = null;
    if (typeof model.variantPrices === 'string') {
      try { prices = JSON.parse(model.variantPrices); } catch { prices = null; }
    } else if (typeof model.variantPrices === 'object' && model.variantPrices !== null) {
      prices = model.variantPrices as Record<string, number>;
    }
    if (prices) {
      const key = `${ramGb}_${storageGb}`;
      if (prices[key] !== undefined && Number(prices[key]) > 0) {
        return Number(prices[key]);
      }
    }
  }
  // Base storage calculation
  const variants = generateVariantsForModel(model);
  const baseVar = variants.find(v => v.storageGb === storageGb) || variants[0];
  const baseStoragePrice = baseVar ? baseVar.basePrice : model.basePrice128GB;

  const ramOptions = getModelSupportedRam(model).filter(r => r > 0);
  if (ramOptions.length <= 1 || ramGb === 0 || !ramGb) {
    return baseStoragePrice;
  }
  const minRam = Math.min(...ramOptions);
  const stepCount = (ramGb - minRam) / 2;
  const ramBonus = Math.max(0, stepCount * 1250);
  return Math.round(baseStoragePrice + ramBonus);
}

export function getPhoneImageForBrand(brandId: string): string {
  switch (brandId) {
    case 'brand-apple':
      return 'https://m.media-amazon.com/images/I/71MXmswILHL.jpg';
    case 'brand-samsung':
      return 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s928bzkginu/gallery/in-galaxy-s24-s928-sm-s928bzkginu-539573030?$650_519_PNG$';
    case 'brand-oneplus':
      return 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg';
    case 'brand-google':
      return 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg';
    case 'brand-xiaomi':
      return 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-civi.jpg';
    case 'brand-vivo':
      return 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg';
    case 'brand-oppo':
      return 'https://fdn.gsmarena.com/imgroot/news/24/10/oppo-find-x8-official/-1200/gsmarena_001.jpg';
    case 'brand-nothing':
      return 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg';
    case 'brand-motorola':
      return 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-pro.jpg';
    default:
      return 'https://fdn.gsmarena.com/imgroot/news/24/10/oppo-find-x8-official/-1200/gsmarena_001.jpg';
  }
}

export function getRedirectedModelId(modelId: string): string {
  return modelId;
}

export function getDeviceImage(
  modelOrId: string | Model,
  brandId?: string,
  color?: string,
  customImageUrl?: string
): string {
  const modelId = typeof modelOrId === 'string' ? modelOrId : modelOrId?.id || '';
  const bId = brandId || (typeof modelOrId === 'object' ? modelOrId?.brandId : '') || '';
  const cUrl = customImageUrl || (typeof modelOrId === 'object' ? modelOrId?.imageUrl : undefined);
  const mName = typeof modelOrId === 'object' ? modelOrId?.name : '';

  if (cUrl && cUrl.trim().length > 0 && !cUrl.trim().toLowerCase().startsWith('file:') && !cUrl.trim().startsWith('/opt/render')) {
    const trimmed = cUrl.trim();
    if (trimmed.includes('gsmarena.com') && !trimmed.startsWith('https://wsrv.nl')) {
      return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}`;
    }
    return trimmed;
  }

  const redirectedModelId = getRedirectedModelId(modelId);

  if (color) {
    const colorKey = `${redirectedModelId}-${color.toLowerCase().trim().replace(/\s+/g, '-')}`;
    const colorImg = (phoneImages as Record<string, string>)[colorKey];
    if (colorImg) {
      if (colorImg.startsWith('http')) {
        if (colorImg.includes('gsmarena.com') && !colorImg.startsWith('https://wsrv.nl')) {
          return `https://wsrv.nl/?url=${encodeURIComponent(colorImg)}`;
        }
        return colorImg;
      }
    }
  }
  const cleanId = redirectedModelId.replace(/^catalog-/, '');
  const brandSlug = bId.replace(/^brand-/, '').toLowerCase();
  const deDuplicatedId = cleanId.replace(new RegExp(`^${brandSlug}-${brandSlug}-`), `${brandSlug}-`);
  const appleShortId = cleanId.replace(/^apple-iphone-/, 'apple-');
  const appleAbbrId = appleShortId
    .replace(/-pro-max$/, 'pm')
    .replace(/-pro$/, 'p')
    .replace(/-plus$/, 'plus')
    .replace(/-mini$/, 'm');

  const possibleKeys = [
    redirectedModelId,
    cleanId,
    deDuplicatedId,
    `catalog-${deDuplicatedId}`,
    appleShortId,
    appleAbbrId,
    cleanId.replace(/^apple-iphone-17-/, 'apple-17'),
    cleanId.replace(/^apple-iphone-16-/, 'apple-16'),
    cleanId.replace(/^apple-iphone-15-/, 'apple-15'),
    cleanId.replace(/^apple-iphone-/, 'apple-'),
    cleanId.replace(/^samsung-galaxy-/, 'sam-'),
    deDuplicatedId.replace(/^oneplus-/, 'op-'),
  ];

  for (const key of possibleKeys) {
    const modelImg = (phoneImages as Record<string, string>)[key];
    if (modelImg && modelImg.startsWith('http')) {
      if (modelImg.includes('gsmarena.com') && !modelImg.startsWith('https://wsrv.nl')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(modelImg)}`;
      }
      return modelImg;
    }
  }

  // Smart fallback to dynamic GSMArena CDN URL
  const namePart = (mName || cleanId)
    .toLowerCase()
    .replace(/^apple\s+|^samsung\s+|^google\s+|^oneplus\s+/, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  const gsmSlug = brandSlug ? `${brandSlug}-${namePart}` : namePart;
  const rawGsmUrl = `https://fdn2.gsmarena.com/vv/bigpic/${gsmSlug}.jpg`;
  return `https://wsrv.nl/?url=${encodeURIComponent(rawGsmUrl)}`;
}

export interface Booking {
  id: string;
  modelId: string;
  modelName: string;
  storageGb: number;
  ramGb?: number;
  color: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  pickupDate: string;
  pickupTimeSlot: string;
  finalPrice: number;
  defectIds?: string[];
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedName?: string;
  maskedAadhaar?: string;
  verificationDate?: string;
  payoutMethod: string;
  payoutMethodName: string;
  bonusPercentage: number;
  bonusAmount: number;
  finalPayoutAmount: number;
  payoutDetails?: {
    upiId?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  inspectionStatus: 'pending' | 'approved' | 'rejected';
  payoutStatus: 'pending' | 'completed';
  dateCreated: string;
}

export const INITIAL_BOOKINGS: Booking[] = [];

export function getSavedBookings(): Booking[] {
  try {
    const raw = localStorage.getItem('stc_bookings');
    if (!raw) {
      localStorage.setItem('stc_bookings', JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw) as Booking[];
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBookings(bookings: Booking[]) {
  try {
    localStorage.setItem('stc_bookings', JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save bookings to localStorage:', e);
  }
}



