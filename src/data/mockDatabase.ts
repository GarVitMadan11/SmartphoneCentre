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
  basePrice128GB: number; // Anchor price in INR
  series?: string;        // Sub-category or series designation
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
  { id: 'apple-17pm',   brandId: 'brand-apple', name: 'iPhone 17 Pro Max',   category: 'flagship', releaseYear: 2025, basePrice128GB: 77000, series: 'iPhone 17 Series' },
  { id: 'apple-17p',    brandId: 'brand-apple', name: 'iPhone 17 Pro',       category: 'flagship', releaseYear: 2025, basePrice128GB: 67000, series: 'iPhone 17 Series' },
  { id: 'apple-17air',  brandId: 'brand-apple', name: 'iPhone Air',          category: 'premium',  releaseYear: 2025, basePrice128GB: 55000, series: 'iPhone 17 Series' },
  { id: 'apple-17',     brandId: 'brand-apple', name: 'iPhone 17',           category: 'premium',  releaseYear: 2025, basePrice128GB: 50000, series: 'iPhone 17 Series' },
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max',   category: 'flagship', releaseYear: 2024, basePrice128GB: 67000, series: 'iPhone 16 Series' },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro',       category: 'flagship', releaseYear: 2024, basePrice128GB: 57000, series: 'iPhone 16 Series' },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus',      category: 'premium',  releaseYear: 2024, basePrice128GB: 45000, series: 'iPhone 16 Series' },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16',           category: 'premium',  releaseYear: 2024, basePrice128GB: 40000, series: 'iPhone 16 Series' },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max',   category: 'flagship', releaseYear: 2023, basePrice128GB: 57000, series: 'iPhone 15 Series' },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro',       category: 'flagship', releaseYear: 2023, basePrice128GB: 47000, series: 'iPhone 15 Series' },
  { id: 'apple-15plus', brandId: 'brand-apple', name: 'iPhone 15 Plus',      category: 'premium',  releaseYear: 2023, basePrice128GB: 37000, series: 'iPhone 15 Series' },
  { id: 'apple-15',     brandId: 'brand-apple', name: 'iPhone 15',           category: 'premium',  releaseYear: 2023, basePrice128GB: 33000, series: 'iPhone 15 Series' },
  { id: 'apple-14pm',   brandId: 'brand-apple', name: 'iPhone 14 Pro Max',   category: 'flagship', releaseYear: 2022, basePrice128GB: 37000, series: 'iPhone 14 Series' },
  { id: 'apple-14p',    brandId: 'brand-apple', name: 'iPhone 14 Pro',       category: 'flagship', releaseYear: 2022, basePrice128GB: 35000, series: 'iPhone 14 Series' },
  { id: 'apple-14plus', brandId: 'brand-apple', name: 'iPhone 14 Plus',      category: 'premium',  releaseYear: 2022, basePrice128GB: 26000, series: 'iPhone 14 Series' },
  { id: 'apple-14',     brandId: 'brand-apple', name: 'iPhone 14',           category: 'premium',  releaseYear: 2022, basePrice128GB: 23000, series: 'iPhone 14 Series' },
  { id: 'apple-13pm',   brandId: 'brand-apple', name: 'iPhone 13 Pro Max',   category: 'flagship', releaseYear: 2021, basePrice128GB: 29000, series: 'iPhone 13 Series' },
  { id: 'apple-13p',    brandId: 'brand-apple', name: 'iPhone 13 Pro',       category: 'flagship', releaseYear: 2021, basePrice128GB: 27000, series: 'iPhone 13 Series' },
  { id: 'apple-13',     brandId: 'brand-apple', name: 'iPhone 13',           category: 'premium',  releaseYear: 2021, basePrice128GB: 21000, series: 'iPhone 13 Series' },
  { id: 'apple-13m',    brandId: 'brand-apple', name: 'iPhone 13 mini',      category: 'midrange', releaseYear: 2021, basePrice128GB: 16000, series: 'iPhone 13 Series' },
  { id: 'apple-12pm',   brandId: 'brand-apple', name: 'iPhone 12 Pro Max',   category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12p',    brandId: 'brand-apple', name: 'iPhone 12 Pro',       category: 'premium',  releaseYear: 2020, basePrice128GB: 16000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12',     brandId: 'brand-apple', name: 'iPhone 12',           category: 'midrange', releaseYear: 2020, basePrice128GB: 13000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12m',    brandId: 'brand-apple', name: 'iPhone 12 mini',      category: 'midrange', releaseYear: 2020, basePrice128GB: 10500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11pm',   brandId: 'brand-apple', name: 'iPhone 11 Pro Max',   category: 'premium',  releaseYear: 2019, basePrice128GB: 11000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11p',    brandId: 'brand-apple', name: 'iPhone 11 Pro',       category: 'premium',  releaseYear: 2019, basePrice128GB:  9500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11',     brandId: 'brand-apple', name: 'iPhone 11',           category: 'midrange', releaseYear: 2019, basePrice128GB:  7500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-se3',    brandId: 'brand-apple', name: 'iPhone SE3',          category: 'budget',   releaseYear: 2022, basePrice128GB:  8500, series: 'iPhone SE & Legacy' },
  { id: 'apple-se2',    brandId: 'brand-apple', name: 'iPhone SE2',          category: 'budget',   releaseYear: 2020, basePrice128GB:  6000, series: 'iPhone SE & Legacy' },
  { id: 'apple-17e',    brandId: 'brand-apple', name: 'iPhone 17e',          category: 'midrange', releaseYear: 2025, basePrice128GB: 38000, series: 'iPhone 17 Series' },
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e',          category: 'midrange', releaseYear: 2024, basePrice128GB: 32000, series: 'iPhone 16 Series' },
  { id: 'apple-xr',     brandId: 'brand-apple', name: 'iPhone XR',           category: 'budget',   releaseYear: 2018, basePrice128GB:  5500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xs',     brandId: 'brand-apple', name: 'iPhone XS',           category: 'budget',   releaseYear: 2018, basePrice128GB:  6500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xsmax',  brandId: 'brand-apple', name: 'iPhone XS Max',       category: 'budget',   releaseYear: 2018, basePrice128GB:  8000, series: 'iPhone SE & Legacy' },
  { id: 'apple-x',      brandId: 'brand-apple', name: 'iPhone X',            category: 'budget',   releaseYear: 2017, basePrice128GB:  5000, series: 'iPhone SE & Legacy' },

  // --- SAMSUNG ---
  { id: 'sam-s20u',     brandId: 'brand-samsung', name: 'Galaxy S20 Ultra', category: 'premium',  releaseYear: 2020, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s21u',     brandId: 'brand-samsung', name: 'Galaxy S21 Ultra',   category: 'premium',  releaseYear: 2021, basePrice128GB: 16000, series: 'S Series' },
  { id: 'sam-s22u',     brandId: 'brand-samsung', name: 'Galaxy S22 Ultra',   category: 'premium',  releaseYear: 2022, basePrice128GB: 21000, series: 'S Series' },
  { id: 'sam-s23u',     brandId: 'brand-samsung', name: 'Galaxy S23 Ultra',   category: 'flagship', releaseYear: 2023, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s24u',     brandId: 'brand-samsung', name: 'Galaxy S24 Ultra',   category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series' },
  { id: 'sam-s25u',     brandId: 'brand-samsung', name: 'Galaxy S25 Ultra',   category: 'flagship', releaseYear: 2025, basePrice128GB: 46000, series: 'S Series' },
  { id: 'sam-s26u',     brandId: 'brand-samsung', name: 'Galaxy S26 Ultra',   category: 'flagship', releaseYear: 2026, basePrice128GB: 50000, series: 'S Series' },
  { id: 'sam-s21',      brandId: 'brand-samsung', name: 'Galaxy S21',         category: 'midrange', releaseYear: 2021, basePrice128GB:  9500, series: 'S Series' },
  { id: 'sam-s22',      brandId: 'brand-samsung', name: 'Galaxy S22',         category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s23',      brandId: 'brand-samsung', name: 'Galaxy S23',         category: 'premium',  releaseYear: 2023, basePrice128GB: 17000, series: 'S Series' },
  { id: 'sam-s24',      brandId: 'brand-samsung', name: 'Galaxy S24',         category: 'premium',  releaseYear: 2024, basePrice128GB: 25000, series: 'S Series' },
  { id: 'sam-s25',      brandId: 'brand-samsung', name: 'Galaxy S25',         category: 'premium',  releaseYear: 2025, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s26',      brandId: 'brand-samsung', name: 'Galaxy S26',         category: 'flagship', releaseYear: 2026, basePrice128GB: 35000, series: 'S Series' },
  { id: 'sam-s21plus',  brandId: 'brand-samsung', name: 'Galaxy S21 Plus',    category: 'midrange', releaseYear: 2021, basePrice128GB: 11000, series: 'S Series' },
  { id: 'sam-s22plus',  brandId: 'brand-samsung', name: 'Galaxy S22 Plus',    category: 'premium',  releaseYear: 2022, basePrice128GB: 15000, series: 'S Series' },
  { id: 'sam-s23plus',  brandId: 'brand-samsung', name: 'Galaxy S23 Plus',    category: 'premium',  releaseYear: 2023, basePrice128GB: 20000, series: 'S Series' },
  { id: 'sam-s24plus',  brandId: 'brand-samsung', name: 'Galaxy S24 Plus',    category: 'premium',  releaseYear: 2024, basePrice128GB: 32000, series: 'S Series' },
  { id: 'sam-s25plus',  brandId: 'brand-samsung', name: 'Galaxy S25 Plus',    category: 'flagship', releaseYear: 2025, basePrice128GB: 35000, series: 'S Series' },
  { id: 'sam-s26plus',  brandId: 'brand-samsung', name: 'Galaxy S26 Plus',    category: 'flagship', releaseYear: 2026, basePrice128GB: 40000, series: 'S Series' },
  { id: 'sam-s21fe',    brandId: 'brand-samsung', name: 'Galaxy S21 FE',      category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'S Series' },
  { id: 'sam-s23fe',    brandId: 'brand-samsung', name: 'Galaxy S23 FE',      category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'S Series' },
  { id: 'sam-s24fe',    brandId: 'brand-samsung', name: 'Galaxy S24 FE',      category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'S Series' },
  { id: 'sam-s25fe',    brandId: 'brand-samsung', name: 'Galaxy S25 FE',      category: 'premium',  releaseYear: 2025, basePrice128GB: 24000, series: 'S Series' },
  { id: 'sam-s25edge',  brandId: 'brand-samsung', name: 'Galaxy S25 Edge',    category: 'premium',  releaseYear: 2025, basePrice128GB: 28000, series: 'S Series' },
  { id: 'sam-flip3',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 3',    category: 'premium',  releaseYear: 2021, basePrice128GB: 11000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip4',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 4',    category: 'premium',  releaseYear: 2022, basePrice128GB: 16000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip5',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 5',    category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip6',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 6',    category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip7',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 7',    category: 'flagship', releaseYear: 2025, basePrice128GB: 38000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip7fe',  brandId: 'brand-samsung', name: 'Galaxy Z Flip 7 FE', category: 'premium',  releaseYear: 2025, basePrice128GB: 28000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold2',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 2',    category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold3',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 3',    category: 'premium',  releaseYear: 2021, basePrice128GB: 26000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold4',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 4',    category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold5',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 5',    category: 'flagship', releaseYear: 2023, basePrice128GB: 45000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold6',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 6',    category: 'flagship', releaseYear: 2024, basePrice128GB: 55000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold7',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 7',    category: 'flagship', releaseYear: 2025, basePrice128GB: 65000, series: 'Z Fold & Z Flip' },
  { id: 'sam-a13',      brandId: 'brand-samsung', name: 'Galaxy A13',         category: 'budget',   releaseYear: 2022, basePrice128GB:  4500, series: 'A Series' },
  { id: 'sam-a23-4g',   brandId: 'brand-samsung', name: 'Galaxy A23 4G',      category: 'budget',   releaseYear: 2022, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a23-5g',   brandId: 'brand-samsung', name: 'Galaxy A23 5G',      category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a33',      brandId: 'brand-samsung', name: 'Galaxy A33',         category: 'midrange', releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a53',      brandId: 'brand-samsung', name: 'Galaxy A53',         category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'A Series' },
  { id: 'sam-a73',      brandId: 'brand-samsung', name: 'Galaxy A73',         category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a14-4g',   brandId: 'brand-samsung', name: 'Galaxy A14 4G',      category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'A Series' },
  { id: 'sam-a14-5g',   brandId: 'brand-samsung', name: 'Galaxy A14 5G',      category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a24',      brandId: 'brand-samsung', name: 'Galaxy A24',         category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'A Series' },
  { id: 'sam-a34',      brandId: 'brand-samsung', name: 'Galaxy A34',         category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a54',      brandId: 'brand-samsung', name: 'Galaxy A54',         category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'A Series' },
  { id: 'sam-a15-4g',   brandId: 'brand-samsung', name: 'Galaxy A15 4G',      category: 'budget',   releaseYear: 2024, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a15-5g',   brandId: 'brand-samsung', name: 'Galaxy A15 5G',      category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'A Series' },
  { id: 'sam-a25',      brandId: 'brand-samsung', name: 'Galaxy A25',         category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'A Series' },
  { id: 'sam-a35',      brandId: 'brand-samsung', name: 'Galaxy A35',         category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a55',      brandId: 'brand-samsung', name: 'Galaxy A55',         category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'A Series' },
  { id: 'sam-a16',      brandId: 'brand-samsung', name: 'Galaxy A16',         category: 'budget',   releaseYear: 2025, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a26',      brandId: 'brand-samsung', name: 'Galaxy A26',         category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a36',      brandId: 'brand-samsung', name: 'Galaxy A36',         category: 'midrange', releaseYear: 2025, basePrice128GB: 13500, series: 'A Series' },
  { id: 'sam-a56',      brandId: 'brand-samsung', name: 'Galaxy A56',         category: 'midrange', releaseYear: 2025, basePrice128GB: 18000, series: 'A Series' },
  { id: 'sam-a17',      brandId: 'brand-samsung', name: 'Galaxy A17',         category: 'budget',   releaseYear: 2026, basePrice128GB: 10000, series: 'A Series' },
  { id: 'sam-a27',      brandId: 'brand-samsung', name: 'Galaxy A27',         category: 'midrange', releaseYear: 2026, basePrice128GB: 13000, series: 'A Series' },
  { id: 'sam-a37',      brandId: 'brand-samsung', name: 'Galaxy A37',         category: 'midrange', releaseYear: 2026, basePrice128GB: 16000, series: 'A Series' },
  { id: 'sam-a57',      brandId: 'brand-samsung', name: 'Galaxy A57',         category: 'premium',  releaseYear: 2026, basePrice128GB: 22000, series: 'A Series' },
  { id: 'sam-f06',      brandId: 'brand-samsung', name: 'Galaxy F06',         category: 'budget',   releaseYear: 2024, basePrice128GB:  4500, series: 'F Series' },
  { id: 'sam-f16',      brandId: 'brand-samsung', name: 'Galaxy F16',         category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'F Series' },
  { id: 'sam-f36',      brandId: 'brand-samsung', name: 'Galaxy F36',         category: 'budget',   releaseYear: 2024, basePrice128GB:  8000, series: 'F Series' },
  { id: 'sam-f56',      brandId: 'brand-samsung', name: 'Galaxy F56',         category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'F Series' },
  { id: 'sam-f07',      brandId: 'brand-samsung', name: 'Galaxy F07',         category: 'budget',   releaseYear: 2025, basePrice128GB:  5000, series: 'F Series' },
  { id: 'sam-f70',      brandId: 'brand-samsung', name: 'Galaxy F70',         category: 'midrange', releaseYear: 2025, basePrice128GB: 13000, series: 'F Series' },
  { id: 'sam-m06',      brandId: 'brand-samsung', name: 'Galaxy M06',         category: 'budget',   releaseYear: 2024, basePrice128GB:  4500, series: 'M Series' },
  { id: 'sam-m07',      brandId: 'brand-samsung', name: 'Galaxy M07',         category: 'budget',   releaseYear: 2025, basePrice128GB:  5000, series: 'M Series' },
  { id: 'sam-m16',      brandId: 'brand-samsung', name: 'Galaxy M16',         category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'M Series' },
  { id: 'sam-m36',      brandId: 'brand-samsung', name: 'Galaxy M36',         category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'M Series' },
  { id: 'sam-m56',      brandId: 'brand-samsung', name: 'Galaxy M56',         category: 'midrange', releaseYear: 2024, basePrice128GB: 11500, series: 'M Series' },
  { id: 'sam-m55',      brandId: 'brand-samsung', name: 'Galaxy M55',         category: 'midrange', releaseYear: 2024, basePrice128GB: 10500, series: 'M Series' },
  { id: 'sam-m35',      brandId: 'brand-samsung', name: 'Galaxy M35',         category: 'budget',   releaseYear: 2024, basePrice128GB:  8000, series: 'M Series' },
  { id: 'sam-m33',      brandId: 'brand-samsung', name: 'Galaxy M33',         category: 'budget',   releaseYear: 2022, basePrice128GB:  5500, series: 'M Series' },

  // --- XIAOMI ---
  { id: 'xi-14u',     brandId: 'brand-xiaomi', name: 'Xiaomi 14 Ultra',    category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Xiaomi Series' },
  { id: 'xi-14',      brandId: 'brand-xiaomi', name: 'Xiaomi 14',          category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'Xiaomi Series' },
  { id: 'xi-13p',     brandId: 'brand-xiaomi', name: 'Xiaomi 13 Pro',      category: 'flagship', releaseYear: 2023, basePrice128GB: 18000, series: 'Xiaomi Series' },
  { id: 'xi-13',      brandId: 'brand-xiaomi', name: 'Xiaomi 13',          category: 'premium',  releaseYear: 2023, basePrice128GB: 13000, series: 'Xiaomi Series' },
  { id: 'xi-12p',     brandId: 'brand-xiaomi', name: 'Xiaomi 12 Pro',      category: 'premium',  releaseYear: 2022, basePrice128GB: 11000, series: 'Xiaomi Series' },
  { id: 'xi-12',      brandId: 'brand-xiaomi', name: 'Xiaomi 12',          category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'Xiaomi Series' },
  { id: 'xi-n14p',    brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro+', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Redmi Note Series' },
  { id: 'xi-n14',     brandId: 'brand-xiaomi', name: 'Redmi Note 14',      category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'Redmi Note Series' },
  { id: 'xi-n13p',    brandId: 'brand-xiaomi', name: 'Redmi Note 13 Pro+', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'Redmi Note Series' },
  { id: 'xi-n13',     brandId: 'brand-xiaomi', name: 'Redmi Note 13',      category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Redmi Note Series' },
  { id: 'xi-poc6p',   brandId: 'brand-xiaomi', name: 'POCO F6 Pro',        category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'POCO Series' },
  { id: 'xi-poc6',    brandId: 'brand-xiaomi', name: 'POCO F6',            category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'POCO Series' },
  { id: 'xi-poc5p',   brandId: 'brand-xiaomi', name: 'POCO F5 Pro',        category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'POCO Series' },

  // --- VIVO ---
  { id: 'vi-x300u',    brandId: 'brand-vivo', name: 'vivo X300 Ultra',     category: 'flagship', releaseYear: 2026, basePrice128GB: 45000, series: 'X Series & Folds' },
  { id: 'vi-x300p',    brandId: 'brand-vivo', name: 'vivo X300 Pro',       category: 'flagship', releaseYear: 2026, basePrice128GB: 40000, series: 'X Series & Folds' },
  { id: 'vi-x300',     brandId: 'brand-vivo', name: 'vivo X300',           category: 'flagship', releaseYear: 2026, basePrice128GB: 35000, series: 'X Series & Folds' },
  { id: 'vi-x300fe',   brandId: 'brand-vivo', name: 'vivo X300 FE',         category: 'premium',  releaseYear: 2026, basePrice128GB: 25000, series: 'X Series & Folds' },
  { id: 'vi-x200p',    brandId: 'brand-vivo', name: 'vivo X200 Pro',       category: 'flagship', releaseYear: 2025, basePrice128GB: 38000, series: 'X Series & Folds' },
  { id: 'vi-x200',     brandId: 'brand-vivo', name: 'vivo X200',           category: 'flagship', releaseYear: 2025, basePrice128GB: 32000, series: 'X Series & Folds' },
  { id: 'vi-x200t',    brandId: 'brand-vivo', name: 'vivo X200t',          category: 'flagship', releaseYear: 2025, basePrice128GB: 30000, series: 'X Series & Folds' },
  { id: 'vi-x200fe',   brandId: 'brand-vivo', name: 'vivo X200 FE',         category: 'premium',  releaseYear: 2025, basePrice128GB: 22000, series: 'X Series & Folds' },
  { id: 'vi-x100',     brandId: 'brand-vivo', name: 'vivo X100',           category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'X Series & Folds' },
  { id: 'vi-x100p',    brandId: 'brand-vivo', name: 'vivo X100 Pro',       category: 'flagship', releaseYear: 2024, basePrice128GB: 27000, series: 'X Series & Folds' },
  { id: 'vi-x90',      brandId: 'brand-vivo', name: 'vivo X90',            category: 'premium',  releaseYear: 2023, basePrice128GB: 12000, series: 'X Series & Folds' },
  { id: 'vi-x90p',     brandId: 'brand-vivo', name: 'vivo X90 Pro',        category: 'flagship', releaseYear: 2023, basePrice128GB: 16000, series: 'X Series & Folds' },
  { id: 'vi-x80',      brandId: 'brand-vivo', name: 'vivo X80',            category: 'premium',  releaseYear: 2022, basePrice128GB: 10000, series: 'X Series & Folds' },
  { id: 'vi-x80p',     brandId: 'brand-vivo', name: 'vivo X80 Pro',        category: 'premium',  releaseYear: 2022, basePrice128GB: 14000, series: 'X Series & Folds' },
  { id: 'vi-v70',      brandId: 'brand-vivo', name: 'vivo V70',            category: 'premium',  releaseYear: 2026, basePrice128GB: 24000, series: 'V Series' },
  { id: 'vi-v70e',     brandId: 'brand-vivo', name: 'vivo V70 Elite',      category: 'premium',  releaseYear: 2026, basePrice128GB: 28000, series: 'V Series' },
  { id: 'vi-v70fe',    brandId: 'brand-vivo', name: 'vivo V70 FE',         category: 'midrange', releaseYear: 2026, basePrice128GB: 18000, series: 'V Series' },
  { id: 'vi-v60',      brandId: 'brand-vivo', name: 'vivo V60',            category: 'premium',  releaseYear: 2025, basePrice128GB: 20000, series: 'V Series' },
  { id: 'vi-v60e',     brandId: 'brand-vivo', name: 'vivo V60e',           category: 'midrange', releaseYear: 2025, basePrice128GB: 14000, series: 'V Series' },
  { id: 'vi-v50',      brandId: 'brand-vivo', name: 'vivo V50',            category: 'premium',  releaseYear: 2024, basePrice128GB: 17000, series: 'V Series' },
  { id: 'vi-v50e',     brandId: 'brand-vivo', name: 'vivo V50e',           category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v50elite', brandId: 'brand-vivo', name: 'vivo V50 Elite',      category: 'premium',  releaseYear: 2024, basePrice128GB: 19000, series: 'V Series' },
  { id: 'vi-v40',      brandId: 'brand-vivo', name: 'vivo V40',            category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'V Series' },
  { id: 'vi-v40e',     brandId: 'brand-vivo', name: 'vivo V40e',           category: 'midrange', releaseYear: 2024, basePrice128GB: 10500, series: 'V Series' },
  { id: 'vi-v40p',     brandId: 'brand-vivo', name: 'vivo V40 Pro',        category: 'premium',  releaseYear: 2024, basePrice128GB: 18000, series: 'V Series' },
  { id: 'vi-v30',      brandId: 'brand-vivo', name: 'vivo V30',            category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v30e',     brandId: 'brand-vivo', name: 'vivo V30e',           category: 'midrange', releaseYear: 2024, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v30p',     brandId: 'brand-vivo', name: 'vivo V30 Pro',        category: 'premium',  releaseYear: 2024, basePrice128GB: 15000, series: 'V Series' },
  { id: 'vi-v29',      brandId: 'brand-vivo', name: 'vivo V29',            category: 'midrange', releaseYear: 2023, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v29p',     brandId: 'brand-vivo', name: 'vivo V29 Pro',        category: 'premium',  releaseYear: 2023, basePrice128GB: 12500, series: 'V Series' },
  { id: 'vi-v27',      brandId: 'brand-vivo', name: 'vivo V27',            category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'V Series' },
  { id: 'vi-v27p',     brandId: 'brand-vivo', name: 'vivo V27 Pro',        category: 'premium',  releaseYear: 2023, basePrice128GB: 11500, series: 'V Series' },
  { id: 'vi-v25',      brandId: 'brand-vivo', name: 'vivo V25',            category: 'midrange', releaseYear: 2022, basePrice128GB:  7500, series: 'V Series' },
  { id: 'vi-v25p',     brandId: 'brand-vivo', name: 'vivo V25 Pro',        category: 'premium',  releaseYear: 2022, basePrice128GB:  9500, series: 'V Series' },
  { id: 'vi-v23',      brandId: 'brand-vivo', name: 'vivo V23',            category: 'midrange', releaseYear: 2021, basePrice128GB:  6500, series: 'V Series' },
  { id: 'vi-v23p',     brandId: 'brand-vivo', name: 'vivo V23 Pro',        category: 'premium',  releaseYear: 2021, basePrice128GB:  8500, series: 'V Series' },
  { id: 'vi-v21',      brandId: 'brand-vivo', name: 'vivo V21',            category: 'midrange', releaseYear: 2020, basePrice128GB:  5500, series: 'V Series' },
  { id: 'vi-v21p',     brandId: 'brand-vivo', name: 'vivo V21 Pro',        category: 'premium',  releaseYear: 2020, basePrice128GB:  7500, series: 'V Series' },
  { id: 'vi-t1-5g',    brandId: 'brand-vivo', name: 'vivo T1 5G',          category: 'budget',   releaseYear: 2022, basePrice128GB:  5000, series: 'T Series' },
  { id: 'vi-t2p',      brandId: 'brand-vivo', name: 'vivo T2 Pro',         category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'T Series' },
  { id: 'vi-t2',       brandId: 'brand-vivo', name: 'vivo T2',             category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'T Series' },
  { id: 'vi-t2x',      brandId: 'brand-vivo', name: 'vivo T2x',            category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'T Series' },
  { id: 'vi-t3',       brandId: 'brand-vivo', name: 'vivo T3',             category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'T Series' },
  { id: 'vi-t3x',      brandId: 'brand-vivo', name: 'vivo T3x',            category: 'budget',   releaseYear: 2024, basePrice128GB:  6000, series: 'T Series' },
  { id: 'vi-t3lite',   brandId: 'brand-vivo', name: 'vivo T3 Lite',         category: 'budget',   releaseYear: 2024, basePrice128GB:  5000, series: 'T Series' },
  { id: 'vi-t4',       brandId: 'brand-vivo', name: 'vivo T4',             category: 'budget',   releaseYear: 2025, basePrice128GB:  8000, series: 'T Series' },
  { id: 'vi-t4x',      brandId: 'brand-vivo', name: 'vivo T4x',            category: 'budget',   releaseYear: 2025, basePrice128GB:  7000, series: 'T Series' },
  { id: 'vi-t4lite',   brandId: 'brand-vivo', name: 'vivo T4 Lite',         category: 'budget',   releaseYear: 2025, basePrice128GB:  5800, series: 'T Series' },
  { id: 'vi-t4u',      brandId: 'brand-vivo', name: 'vivo T4 Ultra',        category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'T Series' },
  { id: 'vi-t5x',      brandId: 'brand-vivo', name: 'vivo T5x',            category: 'budget',   releaseYear: 2026, basePrice128GB:  7500, series: 'T Series' },
  { id: 'vi-t5pro',    brandId: 'brand-vivo', name: 'vivo T5 Pro',         category: 'midrange', releaseYear: 2026, basePrice128GB: 11500, series: 'T Series' },
  { id: 'vi-x3fold',   brandId: 'brand-vivo', name: 'vivo X3 Fold',        category: 'flagship', releaseYear: 2024, basePrice128GB: 45000, series: 'X Series & Folds' },
  { id: 'vi-x5fold',   brandId: 'brand-vivo', name: 'vivo X5 Fold',        category: 'flagship', releaseYear: 2025, basePrice128GB: 55000, series: 'X Series & Folds' },
  { id: 'vi-y100',     brandId: 'brand-vivo', name: 'vivo Y100',           category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Y Series' },
  { id: 'vi-y100p',    brandId: 'brand-vivo', name: 'vivo Y100 Pro',       category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'Y Series' },
  { id: 'vi-y200',     brandId: 'brand-vivo', name: 'vivo Y200',           category: 'budget',   releaseYear: 2023, basePrice128GB:  7000, series: 'Y Series' },
  { id: 'vi-y200p',    brandId: 'brand-vivo', name: 'vivo Y200 Pro',       category: 'budget',   releaseYear: 2023, basePrice128GB:  8000, series: 'Y Series' },
  { id: 'vi-y300',     brandId: 'brand-vivo', name: 'vivo Y300',           category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'Y Series' },
  { id: 'vi-y300p',    brandId: 'brand-vivo', name: 'vivo Y300 Pro',       category: 'budget',   releaseYear: 2024, basePrice128GB:  9500, series: 'Y Series' },
  { id: 'vi-y400',     brandId: 'brand-vivo', name: 'vivo Y400',           category: 'budget',   releaseYear: 2025, basePrice128GB:  9500, series: 'Y Series' },
  { id: 'vi-y400p',    brandId: 'brand-vivo', name: 'vivo Y400 Pro',       category: 'midrange', releaseYear: 2025, basePrice128GB: 11500, series: 'Y Series' },
  { id: 'vi-y16',      brandId: 'brand-vivo', name: 'vivo Y16',            category: 'budget',   releaseYear: 2022, basePrice128GB:  4000, series: 'Y Series' },
  { id: 'vi-y36',      brandId: 'brand-vivo', name: 'vivo Y36',            category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'Y Series' },
  { id: 'vi-y56',      brandId: 'brand-vivo', name: 'vivo Y56',            category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Y Series' },
  { id: 'vi-y73',      brandId: 'brand-vivo', name: 'vivo Y73',            category: 'budget',   releaseYear: 2021, basePrice128GB:  5000, series: 'Y Series' },
  { id: 'vi-y11-5g',   brandId: 'brand-vivo', name: 'vivo Y11 5G',          category: 'budget',   releaseYear: 2023, basePrice128GB:  5000, series: 'Y Series' },
  { id: 'vi-y21-5g',   brandId: 'brand-vivo', name: 'vivo Y21 5G',          category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'Y Series' },
  { id: 'vi-y31-5g',   brandId: 'brand-vivo', name: 'vivo Y31 5G',          category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'Y Series' },
  { id: 'vi-y31p',     brandId: 'brand-vivo', name: 'vivo Y31 Pro',         category: 'budget',   releaseYear: 2023, basePrice128GB:  7000, series: 'Y Series' },
  { id: 'vi-y51p',     brandId: 'brand-vivo', name: 'vivo Y51 Pro',         category: 'budget',   releaseYear: 2023, basePrice128GB:  8000, series: 'Y Series' },

  // --- ONEPLUS ---
  { id: 'op-12',      brandId: 'brand-oneplus', name: 'OnePlus 12',        category: 'flagship', releaseYear: 2024, basePrice128GB: 24000, series: 'Numbered Series' },
  { id: 'op-12r',     brandId: 'brand-oneplus', name: 'OnePlus 12R',       category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11',      brandId: 'brand-oneplus', name: 'OnePlus 11',        category: 'premium',  releaseYear: 2023, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11r',     brandId: 'brand-oneplus', name: 'OnePlus 11R',       category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Numbered Series' },
  { id: 'op-10p',     brandId: 'brand-oneplus', name: 'OnePlus 10 Pro',    category: 'premium',  releaseYear: 2022, basePrice128GB: 12000, series: 'Numbered Series' },
  { id: 'op-10t',     brandId: 'brand-oneplus', name: 'OnePlus 10T',       category: 'midrange', releaseYear: 2022, basePrice128GB:  9000, series: 'Numbered Series' },
  { id: 'op-10r',     brandId: 'brand-oneplus', name: 'OnePlus 10R',       category: 'midrange', releaseYear: 2022, basePrice128GB:  7000, series: 'Numbered Series' },
  { id: 'op-nord4',   brandId: 'brand-oneplus', name: 'OnePlus Nord 4',    category: 'midrange', releaseYear: 2024, basePrice128GB: 13000, series: 'Nord Series' },
  { id: 'op-nord3',   brandId: 'brand-oneplus', name: 'OnePlus Nord 3',    category: 'budget',   releaseYear: 2023, basePrice128GB:  9000, series: 'Nord Series' },
  { id: 'op-nordce4', brandId: 'brand-oneplus', name: 'OnePlus Nord CE 4', category: 'budget',   releaseYear: 2024, basePrice128GB:  8500, series: 'Nord Series' },

  // --- GOOGLE ---
  { id: 'goog-8p',  brandId: 'brand-google', name: 'Pixel 8 Pro',  category: 'flagship', releaseYear: 2023, basePrice128GB: 27000, series: 'Pixel 8 Series' },
  { id: 'goog-8',   brandId: 'brand-google', name: 'Pixel 8',      category: 'premium',  releaseYear: 2023, basePrice128GB: 19000, series: 'Pixel 8 Series' },
  { id: 'goog-8a',  brandId: 'brand-google', name: 'Pixel 8a',     category: 'midrange', releaseYear: 2024, basePrice128GB: 14500, series: 'Pixel 8 Series' },
  { id: 'goog-7p',  brandId: 'brand-google', name: 'Pixel 7 Pro',  category: 'premium',  releaseYear: 2022, basePrice128GB: 20000, series: 'Pixel 7 Series' },
  { id: 'goog-7',   brandId: 'brand-google', name: 'Pixel 7',      category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Pixel 7 Series' },
  { id: 'goog-7a',  brandId: 'brand-google', name: 'Pixel 7a',     category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Pixel 7 Series' },
  { id: 'goog-6p',  brandId: 'brand-google', name: 'Pixel 6 Pro',  category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'Pixel 6 Series' },
  { id: 'goog-6',   brandId: 'brand-google', name: 'Pixel 6',      category: 'budget',   releaseYear: 2021, basePrice128GB:  6000, series: 'Pixel 6 Series' },
  { id: 'goog-6a',  brandId: 'brand-google', name: 'Pixel 6a',     category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'Pixel 6 Series' },
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

export function getDeviceImage(modelId: string, brandId: string): string {
  const imageName = (phoneImages as Record<string, string>)[modelId];
  if (imageName) {
    try {
      return new URL(`../assets/phones/${imageName}`, import.meta.url).href;
    } catch (e) {
      // Fallback
    }
  }
  return getPhoneImageForBrand(brandId);
}
