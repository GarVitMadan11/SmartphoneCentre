import applePhoneImg from '../assets/apple_phone.png';
import samsungPhoneImg from '../assets/samsung_phone.png';
import oneplusPhoneImg from '../assets/oneplus_phone.png';
import googlePhoneImg from '../assets/google_phone.png';
import xiaomiPhoneImg from '../assets/xiaomi_phone.png';
import vivoPhoneImg from '../assets/vivo_phone.png';
import phoneImages from './phoneImages.json';

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
  { id: 'brand-xiaomi', name: 'Xiaomi', logo: 'xiaomi' },
  { id: 'brand-samsung', name: 'Samsung', logo: 'samsung' },
  { id: 'brand-vivo', name: 'vivo', logo: 'vivo' },
  { id: 'brand-oneplus', name: 'OnePlus', logo: 'oneplus' },
  { id: 'brand-google', name: 'Google', logo: 'google' },
  { id: 'brand-oppo', name: 'OPPO', logo: 'oppo' },
  { id: 'brand-nothing', name: 'Nothing', logo: 'nothing' },
  { id: 'brand-motorola', name: 'Motorola', logo: 'motorola' },
];

const catalogId = (brandId: string, name: string) =>
  `catalog-${brandId.replace('brand-', '')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const catalogCategory = (name: string): DeviceCategory => {
  if (/ultra|pro max|fold|flip|\bpro\b|x300|x200 pro|x100 pro|find x9|find x8|s26 ultra|s25 ultra/i.test(name)) return 'flagship';
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
    return {
      id: catalogId(brandId, name),
      brandId,
      name,
      category,
      releaseYear,
      basePrice128GB: catalogPrice(brandId, name, category, releaseYear),
      series,
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
  ...makeCatalogModels('brand-xiaomi', 'Redmi Series', 2025, ['Redmi 10', 'Redmi 10A', 'Redmi Note 10', 'Redmi Note 10 Pro', 'Redmi Note 10 Pro+', 'Redmi 11', 'Redmi Note 11', 'Redmi Note 11s', 'Redmi Note 11 Pro', 'Redmi Note 11 Pro+', 'Redmi 12', 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro+', 'Redmi 13', 'Redmi 13c', 'Redmi 14', 'Redmi 14c', 'Redmi 15', 'Redmi 15c', 'Redmi Note 15', 'Redmi Note 15 Pro', 'Redmi Note 15 Pro+']),
  ...makeCatalogModels('brand-xiaomi', 'Xiaomi Series', 2026, ['Xiaomi 11 Ultra', 'Xiaomi 14 Civi', 'Xiaomi 15', 'Xiaomi 15 Ultra', 'Xiaomi 16', 'Xiaomi 16 Ultra', 'Xiaomi 17', 'Xiaomi 17T', 'Xiaomi 17 Ultra']),
  ...makeCatalogModels('brand-xiaomi', 'POCO Series', 2025, ['POCO M6', 'POCO M6 Pro', 'POCO M7', 'POCO M7 Pro', 'POCO M7 Pro+', 'POCO M8', 'POCO M8 Pro', 'POCO M8 Pro+', 'POCO X4', 'POCO X4 Pro', 'POCO X5', 'POCO X5 Pro', 'POCO X6', 'POCO X6 Pro', 'POCO X7', 'POCO X7 Pro', 'POCO X8 Pro', 'POCO X8 Pro Ultra', 'POCO F7']),
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
  { id: 'sam-s20u',     brandId: 'brand-samsung', name: 'Galaxy S20 Ultra', category: 'premium',  releaseYear: 2020, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s21u',     brandId: 'brand-samsung', name: 'Galaxy S21 Ultra', category: 'premium',  releaseYear: 2021, basePrice128GB: 16000, series: 'S Series' },
  { id: 'sam-s22u',     brandId: 'brand-samsung', name: 'Galaxy S22 Ultra', category: 'premium',  releaseYear: 2022, basePrice128GB: 21000, series: 'S Series' },
  { id: 'sam-s23u',     brandId: 'brand-samsung', name: 'Galaxy S23 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s24u',     brandId: 'brand-samsung', name: 'Galaxy S24 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series' },
  { id: 'sam-s25u',     brandId: 'brand-samsung', name: 'Galaxy S25 Ultra', category: 'flagship', releaseYear: 2025, basePrice128GB: 46000, series: 'S Series' },
  { id: 'sam-s21',      brandId: 'brand-samsung', name: 'Galaxy S21', category: 'midrange', releaseYear: 2021, basePrice128GB:  9500, series: 'S Series' },
  { id: 'sam-s22',      brandId: 'brand-samsung', name: 'Galaxy S22', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s23',      brandId: 'brand-samsung', name: 'Galaxy S23', category: 'premium',  releaseYear: 2023, basePrice128GB: 17000, series: 'S Series' },
  { id: 'sam-s24',      brandId: 'brand-samsung', name: 'Galaxy S24', category: 'premium',  releaseYear: 2024, basePrice128GB: 25000, series: 'S Series' },
  { id: 'sam-s25',      brandId: 'brand-samsung', name: 'Galaxy S25', category: 'premium',  releaseYear: 2025, basePrice128GB: 30000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-5g.jpg' },
  { id: 'sam-s21plus',  brandId: 'brand-samsung', name: 'Galaxy S21 Plus', category: 'midrange', releaseYear: 2021, basePrice128GB: 11000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-plus-5g.jpg' },
  { id: 'sam-s22plus',  brandId: 'brand-samsung', name: 'Galaxy S22 Plus', category: 'premium',  releaseYear: 2022, basePrice128GB: 15000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-plus-5g.jpg' },
  { id: 'sam-s23plus',  brandId: 'brand-samsung', name: 'Galaxy S23 Plus', category: 'premium',  releaseYear: 2023, basePrice128GB: 20000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-plus-5g.jpg' },
  { id: 'sam-s24plus',  brandId: 'brand-samsung', name: 'Galaxy S24 Plus', category: 'premium',  releaseYear: 2024, basePrice128GB: 32000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-plus-5g.jpg' },
  { id: 'sam-s25plus',  brandId: 'brand-samsung', name: 'Galaxy S25 Plus', category: 'flagship', releaseYear: 2025, basePrice128GB: 35000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-plus-5g.jpg' },
  { id: 'sam-s21fe',    brandId: 'brand-samsung', name: 'Galaxy S21 FE', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-fe-5g.jpg' },
  { id: 'sam-s23fe',    brandId: 'brand-samsung', name: 'Galaxy S23 FE', category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg' },
  { id: 'sam-s24fe',    brandId: 'brand-samsung', name: 'Galaxy S24 FE', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'S Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg' },
  { id: 'sam-flip3',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 3', category: 'premium',  releaseYear: 2021, basePrice128GB: 11000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip3-5g.jpg' },
  { id: 'sam-flip4',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 4', category: 'premium',  releaseYear: 2022, basePrice128GB: 16000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip4.jpg' },
  { id: 'sam-flip5',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 5', category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5.jpg' },
  { id: 'sam-flip6',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 6', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg' },
  { id: 'sam-fold2',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 2', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold2-5g.jpg' },
  { id: 'sam-fold3',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 3', category: 'premium',  releaseYear: 2021, basePrice128GB: 26000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold3-5g.jpg' },
  { id: 'sam-fold4',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 4', category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold4.jpg' },
  { id: 'sam-fold5',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 5', category: 'flagship', releaseYear: 2023, basePrice128GB: 45000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg' },
  { id: 'sam-fold6',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 6', category: 'flagship', releaseYear: 2024, basePrice128GB: 55000, series: 'Z Fold & Z Flip', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg' },
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
  { id: 'xi-poc6p',   brandId: 'brand-xiaomi', name: 'POCO F6 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'POCO Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg' },
  { id: 'xi-poc6',    brandId: 'brand-xiaomi', name: 'POCO F6', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'POCO Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6.jpg' },
  { id: 'xi-poc5p',   brandId: 'brand-xiaomi', name: 'POCO F5 Pro', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'POCO Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x5-pro.jpg' },

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

  // --- OPPO ---
  { id: 'catalog-oppo-a3', brandId: 'brand-oppo', name: 'OPPO A3', category: 'budget', releaseYear: 2025, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3.jpg' },
  { id: 'catalog-oppo-a3x', brandId: 'brand-oppo', name: 'OPPO A3x', category: 'budget', releaseYear: 2025, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3x.jpg' },
  { id: 'catalog-oppo-a3-pro', brandId: 'brand-oppo', name: 'OPPO A3 Pro', category: 'flagship', releaseYear: 2025, basePrice128GB: 69500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3-pro.jpg' },
  { id: 'catalog-oppo-a5', brandId: 'brand-oppo', name: 'OPPO A5', category: 'budget', releaseYear: 2025, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a5-2020.jpg' },
  { id: 'catalog-oppo-a5x', brandId: 'brand-oppo', name: 'OPPO A5x', category: 'budget', releaseYear: 2025, basePrice128GB: 4000, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3x.jpg' },
  { id: 'catalog-oppo-a5-pro', brandId: 'brand-oppo', name: 'OPPO A5 Pro', category: 'flagship', releaseYear: 2025, basePrice128GB: 69500, series: 'A Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3-pro.jpg' },
  { id: 'catalog-oppo-f25-pro', brandId: 'brand-oppo', name: 'OPPO F25 Pro', category: 'midrange', releaseYear: 2025, basePrice128GB: 12000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f25-pro.jpg' },
  { id: 'catalog-oppo-f27-pro', brandId: 'brand-oppo', name: 'OPPO F27 Pro+', category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'F Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oppo-f25-pro.jpg' },
  { id: 'catalog-oppo-reno-12', brandId: 'brand-oppo', name: 'OPPO Reno 12', category: 'premium', releaseYear: 2025, basePrice128GB: 18000, series: 'Reno Series', imageUrl: 'https://fdn.gsmarena.com/imgroot/news/24/05/oppo-reno12-series-announced/-1200/gsmarena_001.jpg' },
  { id: 'catalog-oppo-reno-12-pro', brandId: 'brand-oppo', name: 'OPPO Reno 12 Pro', category: 'premium', releaseYear: 2025, basePrice128GB: 22000, series: 'Reno Series', imageUrl: 'https://fdn.gsmarena.com/imgroot/news/24/05/oppo-reno12-series-announced/-1200/gsmarena_002.jpg' },
  { id: 'catalog-oppo-find-x8', brandId: 'brand-oppo', name: 'OPPO Find X8', category: 'flagship', releaseYear: 2025, basePrice128GB: 42000, series: 'Find X Series', imageUrl: 'https://fdn.gsmarena.com/imgroot/news/24/10/oppo-find-x8-official/-1200/gsmarena_001.jpg' },
  { id: 'catalog-oppo-find-x8-pro', brandId: 'brand-oppo', name: 'OPPO Find X8 Pro', category: 'flagship', releaseYear: 2025, basePrice128GB: 52000, series: 'Find X Series', imageUrl: 'https://fdn.gsmarena.com/imgroot/news/24/10/oppo-find-x8-official/-1200/gsmarena_002.jpg' },

  // --- NOTHING ---
  { id: 'catalog-nothing-phone-1', brandId: 'brand-nothing', name: 'Nothing Phone 1', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-1.jpg' },
  { id: 'catalog-nothing-phone-2', brandId: 'brand-nothing', name: 'Nothing Phone 2', category: 'premium', releaseYear: 2023, basePrice128GB: 18000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-1.jpg' },
  { id: 'catalog-nothing-phone-2a', brandId: 'brand-nothing', name: 'Nothing Phone 2a', category: 'budget', releaseYear: 2024, basePrice128GB: 11000, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg' },
  { id: 'catalog-nothing-cmf-phone-1', brandId: 'brand-nothing', name: 'CMF Phone 1', category: 'budget', releaseYear: 2024, basePrice128GB: 8500, series: 'Phone Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg' },

  // --- MOTOROLA ---
  { id: 'catalog-motorola-g04', brandId: 'brand-motorola', name: 'Motorola G04', category: 'budget', releaseYear: 2024, basePrice128GB: 5000, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-g04.jpg' },
  { id: 'catalog-motorola-g05', brandId: 'brand-motorola', name: 'Motorola G05', category: 'budget', releaseYear: 2025, basePrice128GB: 5500, series: 'G Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-g24.jpg' },
  { id: 'catalog-motorola-edge-50-fusion', brandId: 'brand-motorola', name: 'Motorola Edge 50 Fusion', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-fusion.jpg' },
  { id: 'catalog-motorola-edge-50-pro', brandId: 'brand-motorola', name: 'Motorola Edge 50 Pro', category: 'premium', releaseYear: 2024, basePrice128GB: 18000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-pro.jpg' },
  { id: 'catalog-motorola-edge-50-ultra', brandId: 'brand-motorola', name: 'Motorola Edge 50 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'Edge Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-ultra.jpg' },
  { id: 'catalog-motorola-razr-50-ultra', brandId: 'brand-motorola', name: 'Motorola Razr 50 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 45000, series: 'Razr Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-50-ultra.jpg' },
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

export function sortModelsByLaunchDesc(modelsList: Model[]): Model[] {
  return [...modelsList].sort((a, b) => {
    if (b.releaseYear !== a.releaseYear) {
      return b.releaseYear - a.releaseYear;
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
]);

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
  if (model.supportedRamGb && Array.isArray(model.supportedRamGb) && model.supportedRamGb.some(r => r > 0)) {
    return model.supportedRamGb.filter(r => r > 0);
  }
  // Android Smartphones & Android Tablets defaults based on category
  if (model.category === 'flagship') return [8, 12, 16];
  if (model.category === 'premium') return [8, 12];
  if (model.category === 'midrange') return [6, 8, 12];
  return [2, 4, 6, 8];
}

/** Returns accurate supported storage options (GB) for a model (eliminates 128GB for Pro Max, Ultra, Fold models) */
export function getModelSupportedStorage(model: Model): number[] {
  const nameLower = model.name.toLowerCase();
  const isProMaxOrUltra = nameLower.includes('pro max') || nameLower.includes('17 pro') || nameLower.includes('17 air') || nameLower.includes('ultra') || nameLower.includes('fold');

  if (model.supportedStorageGb && Array.isArray(model.supportedStorageGb) && model.supportedStorageGb.length > 0) {
    let list = model.supportedStorageGb;
    if (isProMaxOrUltra) {
      list = list.filter(gb => gb >= 256);
    }
    if (list.length > 0) return list;
  }

  if (isProMaxOrUltra) {
    return nameLower.includes('17') || nameLower.includes('m4') ? [256, 512, 1024, 2048] : [256, 512, 1024];
  }
  if (model.category === 'budget') {
    return [32, 64, 128, 256];
  }
  if (model.category === 'midrange') {
    return [128, 256, 512];
  }
  return [128, 256, 512, 1024];
}

/** Generates the full record of +3% Cashify prices for all supported RAM and storage variants of a model */
export function buildVariantPricesForModel(model: Model): Record<string, number> {
  if (model.variantPrices && Object.keys(model.variantPrices).length > 0) {
    return model.variantPrices;
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
      const pricePlus3Pct = Math.round(baseCashify * 1.03);
      map[`${r}_${s}`] = pricePlus3Pct;
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

/** Get the admin-defined price for a specific RAM+Storage combo, or best-guess fallback */
export function getVariantPrice(model: Model, ramGb: number, storageGb: number): number {
  if (model.variantPrices) {
    const key = `${ramGb}_${storageGb}`;
    if (model.variantPrices[key] !== undefined) {
      return model.variantPrices[key];
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
      return applePhoneImg;
    case 'brand-samsung':
      return samsungPhoneImg;
    case 'brand-oneplus':
      return oneplusPhoneImg;
    case 'brand-google':
      return googlePhoneImg;
    case 'brand-xiaomi':
      return xiaomiPhoneImg;
    case 'brand-vivo':
      return vivoPhoneImg;
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

function getRedirectedModelId(modelId: string): string {
  const cleanId = modelId.replace(/^catalog-/, '');
  
  if (!cleanId.startsWith('apple-')) {
    return modelId;
  }
  
  // Extract number or suffix
  const match = cleanId.match(/^apple-(\d+)(.*)$/);
  let isLowerThan15 = false;
  let isProMax = false;
  let isPro = false;
  
  if (match) {
    const num = parseInt(match[1], 10);
    const suffix = match[2];
    if (num < 15) {
      isLowerThan15 = true;
      if (suffix.includes('pm') || suffix.includes('pro-max') || suffix.includes('promax')) {
        isProMax = true;
      } else if (suffix.includes('p') || suffix.includes('pro')) {
        isPro = true;
      }
    }
  } else {
    // Check for legacy non-numeric models like xr, xs, xsmax, x, se2, se3
    const legacyModels = ['xr', 'xs', 'xsmax', 'x', 'se2', 'se3'];
    const part = cleanId.substring('apple-'.length);
    if (legacyModels.some(m => part.startsWith(m))) {
      isLowerThan15 = true;
      if (part.includes('max') || part.includes('xsmax')) {
        isProMax = true;
      } else if (part.startsWith('xs')) {
        isPro = true;
      }
    }
  }
  
  if (isLowerThan15) {
    let target = 'apple-15';
    if (isProMax) {
      target = 'apple-15pm';
    } else if (isPro) {
      target = 'apple-15p';
    }
    return modelId.startsWith('catalog-') ? `catalog-${target}` : target;
  }
  
  return modelId;
}

export function getDeviceImage(modelId: string, brandId: string, color?: string, customImageUrl?: string): string {
  const redirectedModelId = getRedirectedModelId(modelId);

  if (color) {
    const colorKey = `${redirectedModelId}-${color.toLowerCase().trim().replace(/\s+/g, '-')}`;
    const colorImg = (phoneImages as Record<string, string>)[colorKey];
    if (colorImg) {
      if (colorImg.startsWith('http')) return colorImg;
      try {
        return new URL(`../../assets/phones/${colorImg}`, import.meta.url).href;
      } catch { /* fallback */ }
    }
  }

  if (customImageUrl && customImageUrl.trim().length > 0) {
    return customImageUrl.trim();
  }
  const cleanId = redirectedModelId.replace(/^catalog-/, '');
  const brandSlug = brandId.replace(/^brand-/, '');
  const deDuplicatedId = cleanId.replace(new RegExp(`^${brandSlug}-${brandSlug}-`), `${brandSlug}-`);
  const possibleKeys = [
    redirectedModelId,
    cleanId,
    deDuplicatedId,
    `catalog-${deDuplicatedId}`,
    cleanId.replace(/^apple-iphone-/, 'apple-'),
    cleanId.replace(/^apple-iphone-17-/, 'apple-17'),
    cleanId.replace(/^apple-iphone-16-/, 'apple-16'),
    cleanId.replace(/^apple-iphone-15-/, 'apple-15'),
    cleanId.replace(/^samsung-galaxy-/, 'sam-'),
    deDuplicatedId.replace(/^oneplus-/, 'op-'),
    deDuplicatedId.replace(/^oneplus-nord-/, 'op-nord'),
    deDuplicatedId.replace(/^oneplus-nord-/, 'op-nord').replace(/-/g, ''),
    cleanId.replace(/^oneplus-oneplus-/, 'oneplus-'),
    cleanId.replace(/^oneplus-oneplus-/, 'op-'),
  ];

  for (const key of possibleKeys) {
    const modelImg = (phoneImages as Record<string, string>)[key];
    if (modelImg) {
      if (modelImg.startsWith('http')) return modelImg;
      try {
        return new URL(`../../assets/phones/${modelImg}`, import.meta.url).href;
      } catch { /* fallback */ }
    }
  }

  return getPhoneImageForBrand(brandId);
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



