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
  modelNumber: string;
  category: DeviceCategory;
  releaseYear: number;
  basePrice128GB: number; // Anchor price in INR
  series?: string;        // Sub-category or series designation
  imageUrl?: string;      // Custom image URL or Data URL
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

// Helper to identify Apple devices vs Android / non-Apple
export function isAppleDevice(brandId?: string, modelName?: string): boolean {
  if (!brandId && !modelName) return false;
  const b = (brandId || '').toLowerCase();
  const m = (modelName || '').toLowerCase();
  return b === 'brand-apple' || b === 'apple' || m.includes('iphone') || m.includes('ipad') || m.includes('apple');
}

// 3. Dynamic Defect Rules tailored by model category and brand
export function getDefectRulesForCategory(
  category: DeviceCategory, 
  brandId?: string, 
  modelName?: string
): DefectRule[] {
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
];

// 2. Models List (Comprehensive)
export const MODELS: Model[] = [
  // --- APPLE ---
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max',   modelNumber: 'A3296', category: 'flagship', releaseYear: 2024, basePrice128GB: 67000, series: 'iPhone 16 Series' },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro',       modelNumber: 'A3293', category: 'flagship', releaseYear: 2024, basePrice128GB: 57000, series: 'iPhone 16 Series' },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus',      modelNumber: 'A3290', category: 'premium',  releaseYear: 2024, basePrice128GB: 45000, series: 'iPhone 16 Series' },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16',           modelNumber: 'A3287', category: 'premium',  releaseYear: 2024, basePrice128GB: 40000, series: 'iPhone 16 Series' },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max',   modelNumber: 'A3106', category: 'flagship', releaseYear: 2023, basePrice128GB: 57000, series: 'iPhone 15 Series' },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro',       modelNumber: 'A3102', category: 'flagship', releaseYear: 2023, basePrice128GB: 47000, series: 'iPhone 15 Series' },
  { id: 'apple-15plus', brandId: 'brand-apple', name: 'iPhone 15 Plus',      modelNumber: 'A3094', category: 'premium',  releaseYear: 2023, basePrice128GB: 37000, series: 'iPhone 15 Series' },
  { id: 'apple-15',     brandId: 'brand-apple', name: 'iPhone 15',           modelNumber: 'A3090', category: 'premium',  releaseYear: 2023, basePrice128GB: 33000, series: 'iPhone 15 Series' },
  { id: 'apple-14pm',   brandId: 'brand-apple', name: 'iPhone 14 Pro Max',   modelNumber: 'A2894', category: 'flagship', releaseYear: 2022, basePrice128GB: 37000, series: 'iPhone 14 Series' },
  { id: 'apple-14p',    brandId: 'brand-apple', name: 'iPhone 14 Pro',       modelNumber: 'A2890', category: 'flagship', releaseYear: 2022, basePrice128GB: 35000, series: 'iPhone 14 Series' },
  { id: 'apple-14plus', brandId: 'brand-apple', name: 'iPhone 14 Plus',      modelNumber: 'A2886', category: 'premium',  releaseYear: 2022, basePrice128GB: 26000, series: 'iPhone 14 Series' },
  { id: 'apple-14',     brandId: 'brand-apple', name: 'iPhone 14',           modelNumber: 'A2882', category: 'premium',  releaseYear: 2022, basePrice128GB: 23000, series: 'iPhone 14 Series' },
  { id: 'apple-13pm',   brandId: 'brand-apple', name: 'iPhone 13 Pro Max',   modelNumber: 'A2643', category: 'flagship', releaseYear: 2021, basePrice128GB: 29000, series: 'iPhone 13 Series' },
  { id: 'apple-13p',    brandId: 'brand-apple', name: 'iPhone 13 Pro',       modelNumber: 'A2638', category: 'flagship', releaseYear: 2021, basePrice128GB: 27000, series: 'iPhone 13 Series' },
  { id: 'apple-13',     brandId: 'brand-apple', name: 'iPhone 13',           modelNumber: 'A2633', category: 'premium',  releaseYear: 2021, basePrice128GB: 21000, series: 'iPhone 13 Series' },
  { id: 'apple-13m',    brandId: 'brand-apple', name: 'iPhone 13 mini',      modelNumber: 'A2628', category: 'midrange', releaseYear: 2021, basePrice128GB: 16000, series: 'iPhone 13 Series' },
  { id: 'apple-12pm',   brandId: 'brand-apple', name: 'iPhone 12 Pro Max',   modelNumber: 'A2411', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12p',    brandId: 'brand-apple', name: 'iPhone 12 Pro',       modelNumber: 'A2407', category: 'premium',  releaseYear: 2020, basePrice128GB: 16000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12',     brandId: 'brand-apple', name: 'iPhone 12',           modelNumber: 'A2403', category: 'midrange', releaseYear: 2020, basePrice128GB: 13000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12m',    brandId: 'brand-apple', name: 'iPhone 12 mini',      modelNumber: 'A2399', category: 'midrange', releaseYear: 2020, basePrice128GB: 10500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11pm',   brandId: 'brand-apple', name: 'iPhone 11 Pro Max',   modelNumber: 'A2218', category: 'premium',  releaseYear: 2019, basePrice128GB: 11000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11p',    brandId: 'brand-apple', name: 'iPhone 11 Pro',       modelNumber: 'A2160', category: 'premium',  releaseYear: 2019, basePrice128GB:  9500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11',     brandId: 'brand-apple', name: 'iPhone 11',           modelNumber: 'A2111', category: 'midrange', releaseYear: 2019, basePrice128GB:  7500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-se3',    brandId: 'brand-apple', name: 'iPhone SE3',          modelNumber: 'A2783', category: 'budget',   releaseYear: 2022, basePrice128GB:  8500, series: 'iPhone SE & Legacy' },
  { id: 'apple-se2',    brandId: 'brand-apple', name: 'iPhone SE2',          modelNumber: 'A2275', category: 'budget',   releaseYear: 2020, basePrice128GB:  6000, series: 'iPhone SE & Legacy' },
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e',          modelNumber: 'A3294', category: 'midrange', releaseYear: 2024, basePrice128GB: 32000, series: 'iPhone 16 Series' },
  { id: 'apple-xr',     brandId: 'brand-apple', name: 'iPhone XR',           modelNumber: 'A2105', category: 'budget',   releaseYear: 2018, basePrice128GB:  5500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xs',     brandId: 'brand-apple', name: 'iPhone XS',           modelNumber: 'A2097', category: 'budget',   releaseYear: 2018, basePrice128GB:  6500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xsmax',  brandId: 'brand-apple', name: 'iPhone XS Max',       modelNumber: 'A2101', category: 'budget',   releaseYear: 2018, basePrice128GB:  8000, series: 'iPhone SE & Legacy' },
  { id: 'apple-x',      brandId: 'brand-apple', name: 'iPhone X',            modelNumber: 'A1901', category: 'budget',   releaseYear: 2017, basePrice128GB:  5000, series: 'iPhone SE & Legacy' },

  // --- SAMSUNG ---
  { id: 'sam-s20u',     brandId: 'brand-samsung', name: 'Galaxy S20 Ultra',  modelNumber: 'SM-G988B', category: 'premium',  releaseYear: 2020, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s21u',     brandId: 'brand-samsung', name: 'Galaxy S21 Ultra',  modelNumber: 'SM-G998B', category: 'premium',  releaseYear: 2021, basePrice128GB: 16000, series: 'S Series' },
  { id: 'sam-s22u',     brandId: 'brand-samsung', name: 'Galaxy S22 Ultra',  modelNumber: 'SM-S908B', category: 'premium',  releaseYear: 2022, basePrice128GB: 21000, series: 'S Series' },
  { id: 'sam-s23u',     brandId: 'brand-samsung', name: 'Galaxy S23 Ultra',  modelNumber: 'SM-S918B', category: 'flagship', releaseYear: 2023, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s24u',     brandId: 'brand-samsung', name: 'Galaxy S24 Ultra',  modelNumber: 'SM-S928B', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series' },
  { id: 'sam-s25u',     brandId: 'brand-samsung', name: 'Galaxy S25 Ultra',  modelNumber: 'SM-S938B', category: 'flagship', releaseYear: 2025, basePrice128GB: 46000, series: 'S Series' },
  { id: 'sam-s21',      brandId: 'brand-samsung', name: 'Galaxy S21',         modelNumber: 'SM-G991B', category: 'midrange', releaseYear: 2021, basePrice128GB:  9500, series: 'S Series' },
  { id: 'sam-s22',      brandId: 'brand-samsung', name: 'Galaxy S22',         modelNumber: 'SM-S901B', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s23',      brandId: 'brand-samsung', name: 'Galaxy S23',         modelNumber: 'SM-S911B', category: 'premium',  releaseYear: 2023, basePrice128GB: 17000, series: 'S Series' },
  { id: 'sam-s24',      brandId: 'brand-samsung', name: 'Galaxy S24',         modelNumber: 'SM-S921B', category: 'premium',  releaseYear: 2024, basePrice128GB: 25000, series: 'S Series' },
  { id: 'sam-s25',      brandId: 'brand-samsung', name: 'Galaxy S25',         modelNumber: 'SM-S931B', category: 'premium',  releaseYear: 2025, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s21plus',  brandId: 'brand-samsung', name: 'Galaxy S21 Plus',   modelNumber: 'SM-G996B', category: 'midrange', releaseYear: 2021, basePrice128GB: 11000, series: 'S Series' },
  { id: 'sam-s22plus',  brandId: 'brand-samsung', name: 'Galaxy S22 Plus',   modelNumber: 'SM-S906B', category: 'premium',  releaseYear: 2022, basePrice128GB: 15000, series: 'S Series' },
  { id: 'sam-s23plus',  brandId: 'brand-samsung', name: 'Galaxy S23 Plus',   modelNumber: 'SM-S916B', category: 'premium',  releaseYear: 2023, basePrice128GB: 20000, series: 'S Series' },
  { id: 'sam-s24plus',  brandId: 'brand-samsung', name: 'Galaxy S24 Plus',   modelNumber: 'SM-S926B', category: 'premium',  releaseYear: 2024, basePrice128GB: 32000, series: 'S Series' },
  { id: 'sam-s25plus',  brandId: 'brand-samsung', name: 'Galaxy S25 Plus',   modelNumber: 'SM-S936B', category: 'flagship', releaseYear: 2025, basePrice128GB: 35000, series: 'S Series' },
  { id: 'sam-s21fe',    brandId: 'brand-samsung', name: 'Galaxy S21 FE',     modelNumber: 'SM-G990B', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'S Series' },
  { id: 'sam-s23fe',    brandId: 'brand-samsung', name: 'Galaxy S23 FE',     modelNumber: 'SM-S711B', category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'S Series' },
  { id: 'sam-s24fe',    brandId: 'brand-samsung', name: 'Galaxy S24 FE',     modelNumber: 'SM-S721B', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'S Series' },
  { id: 'sam-flip3',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 3',   modelNumber: 'SM-F711B', category: 'premium',  releaseYear: 2021, basePrice128GB: 11000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip4',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 4',   modelNumber: 'SM-F721B', category: 'premium',  releaseYear: 2022, basePrice128GB: 16000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip5',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 5',   modelNumber: 'SM-F731B', category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip6',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 6',   modelNumber: 'SM-F741B', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold2',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 2',   modelNumber: 'SM-F916B', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold3',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 3',   modelNumber: 'SM-F926B', category: 'premium',  releaseYear: 2021, basePrice128GB: 26000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold4',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 4',   modelNumber: 'SM-F936B', category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold5',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 5',   modelNumber: 'SM-F946B', category: 'flagship', releaseYear: 2023, basePrice128GB: 45000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold6',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 6',   modelNumber: 'SM-F956B', category: 'flagship', releaseYear: 2024, basePrice128GB: 55000, series: 'Z Fold & Z Flip' },
  { id: 'sam-a13',      brandId: 'brand-samsung', name: 'Galaxy A13',        modelNumber: 'SM-A135F', category: 'budget',   releaseYear: 2022, basePrice128GB:  4500, series: 'A Series' },
  { id: 'sam-a23-4g',   brandId: 'brand-samsung', name: 'Galaxy A23 4G',     modelNumber: 'SM-A235F', category: 'budget',   releaseYear: 2022, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a23-5g',   brandId: 'brand-samsung', name: 'Galaxy A23 5G',     modelNumber: 'SM-A236B', category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a33',      brandId: 'brand-samsung', name: 'Galaxy A33',        modelNumber: 'SM-A336B', category: 'midrange', releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a53',      brandId: 'brand-samsung', name: 'Galaxy A53',        modelNumber: 'SM-A536B', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'A Series' },
  { id: 'sam-a73',      brandId: 'brand-samsung', name: 'Galaxy A73',        modelNumber: 'SM-A736B', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a14-4g',   brandId: 'brand-samsung', name: 'Galaxy A14 4G',     modelNumber: 'SM-A145F', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'A Series' },
  { id: 'sam-a14-5g',   brandId: 'brand-samsung', name: 'Galaxy A14 5G',     modelNumber: 'SM-A146B', category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a24',      brandId: 'brand-samsung', name: 'Galaxy A24',        modelNumber: 'SM-A245F', category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'A Series' },
  { id: 'sam-a34',      brandId: 'brand-samsung', name: 'Galaxy A34',        modelNumber: 'SM-A346B', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a54',      brandId: 'brand-samsung', name: 'Galaxy A54',        modelNumber: 'SM-A546B', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'A Series' },
  { id: 'sam-a15-4g',   brandId: 'brand-samsung', name: 'Galaxy A15 4G',     modelNumber: 'SM-A155F', category: 'budget',   releaseYear: 2024, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a15-5g',   brandId: 'brand-samsung', name: 'Galaxy A15 5G',     modelNumber: 'SM-A156B', category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'A Series' },
  { id: 'sam-a25',      brandId: 'brand-samsung', name: 'Galaxy A25',        modelNumber: 'SM-A256B', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'A Series' },
  { id: 'sam-a35',      brandId: 'brand-samsung', name: 'Galaxy A35',        modelNumber: 'SM-A356B', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a55',      brandId: 'brand-samsung', name: 'Galaxy A55',        modelNumber: 'SM-A556B', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'A Series' },
  { id: 'sam-a16',      brandId: 'brand-samsung', name: 'Galaxy A16',        modelNumber: 'SM-A166B', category: 'budget',   releaseYear: 2025, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a26',      brandId: 'brand-samsung', name: 'Galaxy A26',        modelNumber: 'SM-A266B', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a36',      brandId: 'brand-samsung', name: 'Galaxy A36',        modelNumber: 'SM-A366B', category: 'midrange', releaseYear: 2025, basePrice128GB: 13500, series: 'A Series' },
  { id: 'sam-a56',      brandId: 'brand-samsung', name: 'Galaxy A56',        modelNumber: 'SM-A566B', category: 'midrange', releaseYear: 2025, basePrice128GB: 18000, series: 'A Series' },
  { id: 'sam-f06',      brandId: 'brand-samsung', name: 'Galaxy F06',        modelNumber: 'SM-E065F', category: 'budget',   releaseYear: 2024, basePrice128GB:  4500, series: 'F Series' },
  { id: 'sam-f16',      brandId: 'brand-samsung', name: 'Galaxy F16',        modelNumber: 'SM-E165F', category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'F Series' },
  { id: 'sam-f36',      brandId: 'brand-samsung', name: 'Galaxy F36',        modelNumber: 'SM-E365F', category: 'budget',   releaseYear: 2024, basePrice128GB:  8000, series: 'F Series' },
  { id: 'sam-f56',      brandId: 'brand-samsung', name: 'Galaxy F56',        modelNumber: 'SM-E565F', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'F Series' },
  { id: 'sam-m06',      brandId: 'brand-samsung', name: 'Galaxy M06',        modelNumber: 'SM-M065F', category: 'budget',   releaseYear: 2024, basePrice128GB:  4500, series: 'M Series' },
  { id: 'sam-m16',      brandId: 'brand-samsung', name: 'Galaxy M16',        modelNumber: 'SM-M165F', category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'M Series' },
  { id: 'sam-m36',      brandId: 'brand-samsung', name: 'Galaxy M36',        modelNumber: 'SM-M365F', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'M Series' },
  { id: 'sam-m56',      brandId: 'brand-samsung', name: 'Galaxy M56',        modelNumber: 'SM-M565F', category: 'midrange', releaseYear: 2024, basePrice128GB: 11500, series: 'M Series' },
  { id: 'sam-m55',      brandId: 'brand-samsung', name: 'Galaxy M55',        modelNumber: 'SM-M556B', category: 'midrange', releaseYear: 2024, basePrice128GB: 10500, series: 'M Series' },
  { id: 'sam-m35',      brandId: 'brand-samsung', name: 'Galaxy M35',        modelNumber: 'SM-M356B', category: 'budget',   releaseYear: 2024, basePrice128GB:  8000, series: 'M Series' },
  { id: 'sam-m33',      brandId: 'brand-samsung', name: 'Galaxy M33',        modelNumber: 'SM-M336B', category: 'budget',   releaseYear: 2022, basePrice128GB:  5500, series: 'M Series' },

  // --- XIAOMI ---
  { id: 'xi-14u',     brandId: 'brand-xiaomi', name: 'Xiaomi 14 Ultra',    modelNumber: '24030PN60G', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Xiaomi Series' },
  { id: 'xi-14',      brandId: 'brand-xiaomi', name: 'Xiaomi 14',          modelNumber: '23127PN0CG', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'Xiaomi Series' },
  { id: 'xi-13p',     brandId: 'brand-xiaomi', name: 'Xiaomi 13 Pro',      modelNumber: '2210132G', category: 'flagship', releaseYear: 2023, basePrice128GB: 18000, series: 'Xiaomi Series' },
  { id: 'xi-13',      brandId: 'brand-xiaomi', name: 'Xiaomi 13',          modelNumber: '2211133G', category: 'premium',  releaseYear: 2023, basePrice128GB: 13000, series: 'Xiaomi Series' },
  { id: 'xi-12p',     brandId: 'brand-xiaomi', name: 'Xiaomi 12 Pro',      modelNumber: '2201122G', category: 'premium',  releaseYear: 2022, basePrice128GB: 11000, series: 'Xiaomi Series' },
  { id: 'xi-12',      brandId: 'brand-xiaomi', name: 'Xiaomi 12',          modelNumber: '2201123G', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'Xiaomi Series' },
  { id: 'xi-n14p',    brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro+', modelNumber: '24115RA8EG', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Redmi Note Series' },
  { id: 'xi-n14',     brandId: 'brand-xiaomi', name: 'Redmi Note 14',      modelNumber: '24090RA29G', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'Redmi Note Series' },
  { id: 'xi-n13p',    brandId: 'brand-xiaomi', name: 'Redmi Note 13 Pro+', modelNumber: '23090RA98G', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'Redmi Note Series' },
  { id: 'xi-n13',     brandId: 'brand-xiaomi', name: 'Redmi Note 13',      modelNumber: '23129RAA4G', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Redmi Note Series' },
  { id: 'xi-poc6p',   brandId: 'brand-xiaomi', name: 'POCO F6 Pro',        modelNumber: '23113RKC6G', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'POCO Series' },
  { id: 'xi-poc6',    brandId: 'brand-xiaomi', name: 'POCO F6',            modelNumber: '24069PC21G', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'POCO Series' },
  { id: 'xi-poc5p',   brandId: 'brand-xiaomi', name: 'POCO F5 Pro',        modelNumber: '23013PC75G', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'POCO Series' },

  // --- VIVO ---
  { id: 'vi-x200p',    brandId: 'brand-vivo', name: 'vivo X200 Pro',       modelNumber: 'V2405A', category: 'flagship', releaseYear: 2024, basePrice128GB: 38000, series: 'X Series & Folds' },
  { id: 'vi-x200',     brandId: 'brand-vivo', name: 'vivo X200',           modelNumber: 'V2415A', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'X Series & Folds' },
  { id: 'vi-x200t',    brandId: 'brand-vivo', name: 'vivo X200 Pro Mini',  modelNumber: 'V2410A', category: 'flagship', releaseYear: 2024, basePrice128GB: 30000, series: 'X Series & Folds' },
  { id: 'vi-x200fe',   brandId: 'brand-vivo', name: 'vivo X200 FE',         modelNumber: 'V2408A', category: 'premium',  releaseYear: 2024, basePrice128GB: 22000, series: 'X Series & Folds' },
  { id: 'vi-x100',     brandId: 'brand-vivo', name: 'vivo X100',           modelNumber: 'V2309', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'X Series & Folds' },
  { id: 'vi-x100p',    brandId: 'brand-vivo', name: 'vivo X100 Pro',       modelNumber: 'V2324', category: 'flagship', releaseYear: 2024, basePrice128GB: 27000, series: 'X Series & Folds' },
  { id: 'vi-x90',      brandId: 'brand-vivo', name: 'vivo X90',            modelNumber: 'V2241A', category: 'premium',  releaseYear: 2023, basePrice128GB: 12000, series: 'X Series & Folds' },
  { id: 'vi-x90p',     brandId: 'brand-vivo', name: 'vivo X90 Pro',        modelNumber: 'V2242A', category: 'flagship', releaseYear: 2023, basePrice128GB: 16000, series: 'X Series & Folds' },
  { id: 'vi-x80',      brandId: 'brand-vivo', name: 'vivo X80',            modelNumber: 'V2183A', category: 'premium',  releaseYear: 2022, basePrice128GB: 10000, series: 'X Series & Folds' },
  { id: 'vi-x80p',     brandId: 'brand-vivo', name: 'vivo X80 Pro',        modelNumber: 'V2185A', category: 'premium',  releaseYear: 2022, basePrice128GB: 14000, series: 'X Series & Folds' },
  { id: 'vi-v50',      brandId: 'brand-vivo', name: 'vivo V50',            modelNumber: 'V2401', category: 'premium',  releaseYear: 2024, basePrice128GB: 17000, series: 'V Series' },
  { id: 'vi-v50e',     brandId: 'brand-vivo', name: 'vivo V50e',           modelNumber: 'V2402', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v50elite', brandId: 'brand-vivo', name: 'vivo V50 Elite',      modelNumber: 'V2403', category: 'premium',  releaseYear: 2024, basePrice128GB: 19000, series: 'V Series' },
  { id: 'vi-v40',      brandId: 'brand-vivo', name: 'vivo V40',            modelNumber: 'V2348', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'V Series' },
  { id: 'vi-v40e',     brandId: 'brand-vivo', name: 'vivo V40e',           modelNumber: 'V2403', category: 'midrange', releaseYear: 2024, basePrice128GB: 10500, series: 'V Series' },
  { id: 'vi-v40p',     brandId: 'brand-vivo', name: 'vivo V40 Pro',        modelNumber: 'V2347', category: 'premium',  releaseYear: 2024, basePrice128GB: 18000, series: 'V Series' },
  { id: 'vi-v30',      brandId: 'brand-vivo', name: 'vivo V30',            modelNumber: 'V2318', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v30e',     brandId: 'brand-vivo', name: 'vivo V30e',           modelNumber: 'V2339', category: 'midrange', releaseYear: 2024, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v30p',     brandId: 'brand-vivo', name: 'vivo V30 Pro',        modelNumber: 'V2319', category: 'premium',  releaseYear: 2024, basePrice128GB: 15000, series: 'V Series' },
  { id: 'vi-v29',      brandId: 'brand-vivo', name: 'vivo V29',            modelNumber: 'V2250', category: 'midrange', releaseYear: 2023, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v29p',     brandId: 'brand-vivo', name: 'vivo V29 Pro',        modelNumber: 'V2251', category: 'premium',  releaseYear: 2023, basePrice128GB: 12500, series: 'V Series' },
  { id: 'vi-v27',      brandId: 'brand-vivo', name: 'vivo V27',            modelNumber: 'V2246', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'V Series' },
  { id: 'vi-v27p',     brandId: 'brand-vivo', name: 'vivo V27 Pro',        modelNumber: 'V2230', category: 'premium',  releaseYear: 2023, basePrice128GB: 11500, series: 'V Series' },
  { id: 'vi-v25',      brandId: 'brand-vivo', name: 'vivo V25',            modelNumber: 'V2202', category: 'midrange', releaseYear: 2022, basePrice128GB:  7500, series: 'V Series' },
  { id: 'vi-v25p',     brandId: 'brand-vivo', name: 'vivo V25 Pro',        modelNumber: 'V2204', category: 'premium',  releaseYear: 2022, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v23',      brandId: 'brand-vivo', name: 'vivo V23',            modelNumber: 'V2130', category: 'midrange', releaseYear: 2021, basePrice128GB:  6500, series: 'V Series' },
  { id: 'vi-v23p',     brandId: 'brand-vivo', name: 'vivo V23 Pro',        modelNumber: 'V2132', category: 'premium',  releaseYear: 2021, basePrice128GB:  8500, series: 'V Series' },
  { id: 'vi-v21',      brandId: 'brand-vivo', name: 'vivo V21',            modelNumber: 'V2050', category: 'midrange', releaseYear: 2020, basePrice128GB:  5500, series: 'V Series' },
  { id: 'vi-v21p',     brandId: 'brand-vivo', name: 'vivo V21 Pro',        modelNumber: 'V2051', category: 'premium',  releaseYear: 2020, basePrice128GB:  7500, series: 'V Series' },
  { id: 'vi-t1-5g',    brandId: 'brand-vivo', name: 'vivo T1 5G',          modelNumber: 'V2141', category: 'budget',   releaseYear: 2022, basePrice128GB:  5000, series: 'T Series' },
  { id: 'vi-t2p',      brandId: 'brand-vivo', name: 'vivo T2 Pro',         modelNumber: 'V2321', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'T Series' },
  { id: 'vi-t2',       brandId: 'brand-vivo', name: 'vivo T2',             modelNumber: 'V2222', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'T Series' },
  { id: 'vi-t2x',      brandId: 'brand-vivo', name: 'vivo T2x',            modelNumber: 'V2225', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'T Series' },
  { id: 'vi-t3',       brandId: 'brand-vivo', name: 'vivo T3',             modelNumber: 'V2334', category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'T Series' },
  { id: 'vi-t3x',      brandId: 'brand-vivo', name: 'vivo T3x',            modelNumber: 'V2338', category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'T Series' },
  { id: 'vi-t3lite',   brandId: 'brand-vivo', name: 'vivo T3 Lite',         modelNumber: 'V2335', category: 'budget',   releaseYear: 2024, basePrice128GB:  5000, series: 'T Series' },
  { id: 'vi-x3fold',   brandId: 'brand-vivo', name: 'vivo X Fold 3',       modelNumber: 'V2303A', category: 'flagship', releaseYear: 2024, basePrice128GB: 45000, series: 'X Series & Folds' },
  { id: 'vi-y100',     brandId: 'brand-vivo', name: 'vivo Y100',           modelNumber: 'V2239', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Y Series' },
  { id: 'vi-y100p',    brandId: 'brand-vivo', name: 'vivo Y100 Pro',       modelNumber: 'V2240', category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'Y Series' },
  { id: 'vi-y200',     brandId: 'brand-vivo', name: 'vivo Y200',           modelNumber: 'V2307', category: 'budget',   releaseYear: 2023, basePrice128GB:  7000, series: 'Y Series' },
  { id: 'vi-y200p',    brandId: 'brand-vivo', name: 'vivo Y200 Pro',       modelNumber: 'V2308', category: 'budget',   releaseYear: 2023, basePrice128GB:  8000, series: 'Y Series' },
  { id: 'vi-y300',     brandId: 'brand-vivo', name: 'vivo Y300',           modelNumber: 'V2416', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'Y Series' },
  { id: 'vi-y300p',    brandId: 'brand-vivo', name: 'vivo Y300 Pro',       modelNumber: 'V2417', category: 'budget',   releaseYear: 2024, basePrice128GB:  9500, series: 'Y Series' },
  { id: 'vi-y16',      brandId: 'brand-vivo', name: 'vivo Y16',            modelNumber: 'V2207', category: 'budget',   releaseYear: 2022, basePrice128GB:  4000, series: 'Y Series' },
  { id: 'vi-y36',      brandId: 'brand-vivo', name: 'vivo Y36',            modelNumber: 'V2247', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'Y Series' },
  { id: 'vi-y56',      brandId: 'brand-vivo', name: 'vivo Y56',            modelNumber: 'V2226', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Y Series' },
  { id: 'vi-y73',      brandId: 'brand-vivo', name: 'vivo Y73',            modelNumber: 'V2059', category: 'budget',   releaseYear: 2021, basePrice128GB:  5000, series: 'Y Series' },
  { id: 'vi-y11-5g',   brandId: 'brand-vivo', name: 'vivo Y11 5G',          modelNumber: 'V2254', category: 'budget',   releaseYear: 2023, basePrice128GB:  5000, series: 'Y Series' },
  { id: 'vi-y21-5g',   brandId: 'brand-vivo', name: 'vivo Y21 5G',          modelNumber: 'V2255', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'Y Series' },
  { id: 'vi-y31-5g',   brandId: 'brand-vivo', name: 'vivo Y31 5G',          modelNumber: 'V2256', category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'Y Series' },
  { id: 'vi-y31p',     brandId: 'brand-vivo', name: 'vivo Y31 Pro',         modelNumber: 'V2257', category: 'budget',   releaseYear: 2023, basePrice128GB:  7000, series: 'Y Series' },
  { id: 'vi-y51p',     brandId: 'brand-vivo', name: 'vivo Y51 Pro',         modelNumber: 'V2258', category: 'budget',   releaseYear: 2023, basePrice128GB:  8000, series: 'Y Series' },

  // --- ONEPLUS ---
  { id: 'op-12',      brandId: 'brand-oneplus', name: 'OnePlus 12',        modelNumber: 'CPH2581', category: 'flagship', releaseYear: 2024, basePrice128GB: 24000, series: 'Numbered Series' },
  { id: 'op-12r',     brandId: 'brand-oneplus', name: 'OnePlus 12R',       modelNumber: 'CPH2585', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11',      brandId: 'brand-oneplus', name: 'OnePlus 11',        modelNumber: 'CPH2447', category: 'premium',  releaseYear: 2023, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11r',     brandId: 'brand-oneplus', name: 'OnePlus 11R',       modelNumber: 'CPH2487', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Numbered Series' },
  { id: 'op-10p',     brandId: 'brand-oneplus', name: 'OnePlus 10 Pro',    modelNumber: 'NE2211', category: 'premium',  releaseYear: 2022, basePrice128GB: 12000, series: 'Numbered Series' },
  { id: 'op-10t',     brandId: 'brand-oneplus', name: 'OnePlus 10T',       modelNumber: 'CPH2413', category: 'midrange', releaseYear: 2022, basePrice128GB:  9000, series: 'Numbered Series' },
  { id: 'op-10r',     brandId: 'brand-oneplus', name: 'OnePlus 10R',       modelNumber: 'CPH2411', category: 'midrange', releaseYear: 2022, basePrice128GB:  7000, series: 'Numbered Series' },
  { id: 'op-nord4',   brandId: 'brand-oneplus', name: 'OnePlus Nord 4',    modelNumber: 'CPH2621', category: 'midrange', releaseYear: 2024, basePrice128GB: 13000, series: 'Nord Series' },
  { id: 'op-nord3',   brandId: 'brand-oneplus', name: 'OnePlus Nord 3',    modelNumber: 'CPH2493', category: 'budget',   releaseYear: 2023, basePrice128GB:  9000, series: 'Nord Series' },
  { id: 'op-nordce4', brandId: 'brand-oneplus', name: 'OnePlus Nord CE 4', modelNumber: 'CPH2613', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'Nord Series' },

  // --- GOOGLE ---
  { id: 'goog-8p',  brandId: 'brand-google', name: 'Pixel 8 Pro',  modelNumber: 'GC3VE', category: 'flagship', releaseYear: 2023, basePrice128GB: 27000, series: 'Pixel 8 Series' },
  { id: 'goog-8',   brandId: 'brand-google', name: 'Pixel 8',      modelNumber: 'GKWS6', category: 'premium',  releaseYear: 2023, basePrice128GB: 19000, series: 'Pixel 8 Series' },
  { id: 'goog-8a',  brandId: 'brand-google', name: 'Pixel 8a',     modelNumber: 'G8HHN', category: 'midrange', releaseYear: 2024, basePrice128GB: 14500, series: 'Pixel 8 Series' },
  { id: 'goog-7p',  brandId: 'brand-google', name: 'Pixel 7 Pro',  modelNumber: 'GE2AE', category: 'premium',  releaseYear: 2022, basePrice128GB: 20000, series: 'Pixel 7 Series' },
  { id: 'goog-7',   brandId: 'brand-google', name: 'Pixel 7',      modelNumber: 'GVU6C', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Pixel 7 Series' },
  { id: 'goog-7a',  brandId: 'brand-google', name: 'Pixel 7a',     modelNumber: 'GWKK3', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Pixel 7 Series' },
  { id: 'goog-6p',  brandId: 'brand-google', name: 'Pixel 6 Pro',  modelNumber: 'GLUOG', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'Pixel 6 Series' },
  { id: 'goog-6',   brandId: 'brand-google', name: 'Pixel 6',      modelNumber: 'GB7W6', category: 'budget',   releaseYear: 2021, basePrice128GB:  6000, series: 'Pixel 6 Series' },
  { id: 'goog-6a',  brandId: 'brand-google', name: 'Pixel 6a',     modelNumber: 'GX7AS', category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'Pixel 6 Series' },
];

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
  // High-end flagships that start at 256GB in real life
  const startsAt256GB = [
    'apple-15pm', 'apple-16pm', 
    'sam-s23u', 'sam-s24u', 'sam-s25u',
    'sam-fold3', 'sam-fold4', 'sam-fold5', 'sam-fold6'
  ];

  const has1TB = ['apple-15pm', 'apple-16pm', 'apple-15p', 'apple-16p', 'sam-s23u', 'sam-s24u', 'sam-s25u', 'sam-fold5', 'sam-fold6'];

  let modelStorages: { gb: number; multiplier: number }[] = [];

  if (startsAt256GB.includes(model.id)) {
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
    // Premium / regular flagship starting at 128GB
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
    default:
      return '';
  }
}

export function getDeviceImage(modelId: string, brandId: string, color?: string, customImageUrl?: string): string {
  if (customImageUrl && customImageUrl.trim().length > 0) {
    return customImageUrl.trim();
  }
  let imageName: string | undefined;
  
  if (color) {
    const colorKey = `${modelId}-${color.toLowerCase().trim().replace(/\s+/g, '-')}`;
    imageName = (phoneImages as Record<string, string>)[colorKey];
  }
  
  if (!imageName) {
    imageName = (phoneImages as Record<string, string>)[modelId];
  }
  
  if (imageName) {
    if (imageName.startsWith('http')) {
      return imageName;
    }
    try {
      return new URL(`../../assets/phones/${imageName}`, import.meta.url).href;
    } catch (e) {
      // Fallback
    }
  }
  return getPhoneImageForBrand(brandId);
}

export interface Booking {
  id: string;
  modelId: string;
  modelName: string;
  modelNumber?: string;
  storageGb: number;
  color: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  pickupDate: string;
  pickupTimeSlot: string;
  finalPrice: number;
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

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'STC-A8B9C0D1',
    modelId: 'apple-15pm',
    modelName: 'iPhone 15 Pro Max',
    modelNumber: 'A3106',
    storageGb: 256,
    color: 'Natural Titanium',
    customerName: 'Amit Sharma',
    customerPhone: '9876543210',
    customerEmail: 'amit.sharma@example.com',
    address: 'Flat 402, Block C, Green Park, New Delhi - 110016',
    pickupDate: '2026-07-12',
    pickupTimeSlot: '12:00 PM - 03:00 PM (Afternoon)',
    finalPrice: 53500,
    verificationStatus: 'verified',
    verifiedName: 'AMIT SHARMA',
    maskedAadhaar: 'XXXX-XXXX-4321',
    verificationDate: '2026-07-12T11:20:00.000Z',
    payoutMethod: 'upi',
    payoutMethodName: 'UPI Transfer',
    bonusPercentage: 0,
    bonusAmount: 0,
    finalPayoutAmount: 53500,
    payoutDetails: {
      upiId: 'amit.sharma@okaxis'
    },
    inspectionStatus: 'approved',
    payoutStatus: 'completed',
    dateCreated: '2026-07-12T11:05:00.000Z'
  },
  {
    id: 'STC-F5E4D3C2',
    modelId: 'sam-s24u',
    modelName: 'Galaxy S24 Ultra',
    modelNumber: 'SM-S928B',
    storageGb: 256,
    color: 'Phantom Black',
    customerName: 'Rohan Gupta',
    customerPhone: '8765432109',
    customerEmail: 'rohan.gupta@example.com',
    address: '15, Sector 4, HSR Layout, Bengaluru, Karnataka - 560102',
    pickupDate: '2026-07-13',
    pickupTimeSlot: '09:00 AM - 12:00 PM (Morning)',
    finalPrice: 38200,
    verificationStatus: 'verified',
    verifiedName: 'ROHAN GUPTA',
    maskedAadhaar: 'XXXX-XXXX-8765',
    verificationDate: '2026-07-13T08:45:00.000Z',
    payoutMethod: 'bank',
    payoutMethodName: 'Bank Transfer',
    bonusPercentage: 0,
    bonusAmount: 0,
    finalPayoutAmount: 38200,
    payoutDetails: {
      accountHolderName: 'Rohan Gupta',
      accountNumber: '918273645012',
      ifscCode: 'HDFC0000104'
    },
    inspectionStatus: 'approved',
    payoutStatus: 'pending',
    dateCreated: '2026-07-13T08:30:00.000Z'
  },
  {
    id: 'STC-X9Y8Z7W6',
    modelId: 'op-12',
    modelName: 'OnePlus 12',
    modelNumber: 'CPH2581',
    storageGb: 256,
    color: 'Obsidian Black',
    customerName: 'Sneha Reddy',
    customerPhone: '7654321098',
    customerEmail: 'sneha.reddy@example.com',
    address: 'Plot 89, Kavuri Hills, Madhapur, Hyderabad, Telangana - 500081',
    pickupDate: '2026-07-14',
    pickupTimeSlot: '03:00 PM - 06:00 PM (Evening)',
    finalPrice: 21800,
    verificationStatus: 'verified',
    verifiedName: 'SNEHA REDDY',
    maskedAadhaar: 'XXXX-XXXX-9012',
    verificationDate: '2026-07-14T14:15:00.000Z',
    payoutMethod: 'amazon',
    payoutMethodName: 'Amazon Gift Card',
    bonusPercentage: 0.03,
    bonusAmount: 654,
    finalPayoutAmount: 22454,
    payoutDetails: {},
    inspectionStatus: 'rejected',
    payoutStatus: 'pending',
    dateCreated: '2026-07-14T14:02:00.000Z'
  },
  {
    id: 'STC-P4Q3R2S1',
    modelId: 'goog-8',
    modelName: 'Pixel 8',
    modelNumber: 'GKWS6',
    storageGb: 128,
    color: 'Obsidian',
    customerName: 'Priya Patel',
    customerPhone: '9988776655',
    customerEmail: 'priya.patel@example.com',
    address: 'B-104, Shanti Tower, Andheri West, Mumbai, Maharashtra - 400053',
    pickupDate: '2026-07-14',
    pickupTimeSlot: '12:00 PM - 03:00 PM (Afternoon)',
    finalPrice: 16500,
    verificationStatus: 'failed',
    payoutMethod: 'bank',
    payoutMethodName: 'Bank Transfer',
    bonusPercentage: 0,
    bonusAmount: 0,
    finalPayoutAmount: 16500,
    payoutDetails: {
      accountHolderName: 'Priya Patel',
      accountNumber: '1092837465',
      ifscCode: 'SBIN0000291'
    },
    inspectionStatus: 'pending',
    payoutStatus: 'pending',
    dateCreated: '2026-07-14T11:45:00.000Z'
  }
];

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

