import phoneImages from './phoneImages.json';
import actualPrices from './actualPrices.json';
import activeModelIds from './activeModelIds.json';
import fallbackModelsData from './fallbackModels.json';

const ACTIVE_MODEL_ID_SET = new Set(activeModelIds as string[]);

export function isModelActiveInCatalog(m: { id?: string; legacyId?: string; name?: string }): boolean {
  if (m.id && ACTIVE_MODEL_ID_SET.has(m.id)) return true;
  if (m.legacyId && ACTIVE_MODEL_ID_SET.has(m.legacyId)) return true;
  const clean = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ACTIVE_MODEL_ID_SET.has(clean)) return true;
  return false;
}


export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export type DeviceCategory = 'flagship' | 'premium' | 'midrange' | 'budget';

export interface Model {
  id: string;
  legacyId?: string;
  dbId?: string;
  brandId: string;
  name: string;
  category: DeviceCategory;
  deviceType?: 'smartphones' | 'tablets' | 'smartwatches';
  releaseYear: number;
  basePrice128GB: number; // Anchor price in INR (lowest variant or explicit)
  series?: string;        // Sub-category or series designation
  imageUrl?: string;      // Custom image URL or Data URL
  supportedStorageGb?: number[]; // Storage tiers e.g. [128, 256, 512, 1024]
  supportedRamGb?: number[];     // RAM tiers e.g. [6, 8, 12]; [0] = no RAM variants (Apple)
  variantPrices?: Record<string, number>; // key: "ramGb_storageGb" e.g. "8_256" → 84900
  hidden?: boolean;                       // If true, hidden from frontend (disable selling)
  supportsWarrantyQuestion?: boolean;     // If true, diagnostic wizard asks warranty & SIM questions
}

export interface Variant {
  id: string;
  modelId: string;
  storageGb: number;
  ramGb?: number;     // RAM capacity in GB (e.g. 4, 6, 8, 12, 16); 0 or undefined for Apple
  color: string;
  basePrice: number; // Calculated base price in INR
  connectivity?: 'wifi' | 'cellular'; // Tablet & Smartwatch connectivity type
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
  const b = (brandId || '').toLowerCase();
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();
  return m.includes('watch') || id.includes('watch') || b.includes('watch');
}

export function isTabletDevice(_brandId?: string, modelName?: string, modelId?: string): boolean {
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();
  return m.includes('ipad') || m.includes('galaxy tab') || id.includes('ipad') || id.includes('tab-s') || id.includes('tab-a');
}

// Helper to identify Samsung models that come bundled with an S-Pen (e.g. Galaxy S Series Ultra, Galaxy Note Series)
export function hasSpenSupport(brandId?: string, modelName?: string, modelId?: string): boolean {
  if (!brandId && !modelName && !modelId) return false;
  const b = (brandId || '').toLowerCase();
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();

  const isSamsung = b === 'brand-samsung' || b.includes('samsung') || id.startsWith('sam-') || m.includes('samsung') || m.includes('galaxy');
  if (!isSamsung) return false;

  // Samsung Galaxy S Series Ultra: S21 Ultra, S22 Ultra, S23 Ultra, S24 Ultra, S25 Ultra, S26 Ultra
  const isSSeriesUltra = (
    m.includes('ultra') && (
      m.includes('s21') || m.includes('s22') || m.includes('s23') || m.includes('s24') || m.includes('s25') || m.includes('s26') ||
      m.includes('s-series') || m.includes('s series') ||
      id.includes('s21u') || id.includes('s22u') || id.includes('s23u') || id.includes('s24u') || id.includes('s25u') || id.includes('s26u') ||
      id.includes('s21-ultra') || id.includes('s22-ultra') || id.includes('s23-ultra') || id.includes('s24-ultra') || id.includes('s25-ultra') || id.includes('s26-ultra')
    )
  );

  // Samsung Galaxy Note series (all Note models come with built-in S-Pen)
  const isNote = m.includes('note') || id.includes('note');

  return isSSeriesUltra || isNote;
}

// Helper to identify Foldable and Flip smartphones (e.g. Galaxy Z Fold, Z Flip, Motorola Razr, OnePlus Open, Google Pixel Fold)
export function isFoldableDevice(_brandId?: string, modelName?: string, modelId?: string): boolean {
  if (!modelName && !modelId) return false;
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();
  return (
    m.includes('fold') ||
    m.includes('flip') ||
    m.includes('razr') ||
    m.includes('open') ||
    m.includes('find n') ||
    id.includes('fold') ||
    id.includes('flip') ||
    id.includes('razr') ||
    id.includes('open')
  );
}

export type BiometricType = 'face_id' | 'touch_id' | 'fingerprint' | 'none';

// Helper to identify biometric hardware security architecture
export function getBiometricType(brandId?: string, modelName?: string, modelId?: string): BiometricType {
  if (isSmartwatchDevice(brandId, modelName, modelId)) {
    return 'none';
  }

  const isApple = isAppleDevice(brandId, modelName);
  const m = (modelName || '').toLowerCase();
  const id = (modelId || '').toLowerCase();

  if (isApple) {
    // Touch ID Apple devices:
    // iPhone SE series (SE 1st gen, SE 2020 2nd gen, SE 2022 3rd gen)
    // iPhone 8, 8 Plus, 7, 7 Plus, 6, 6s, 5s
    // Non-Pro iPads (iPad base 5th-10th gen, iPad Air, iPad mini)
    const isTouchIdIphone = (
      m.includes('se') || id.includes('se') ||
      m.includes('iphone 8') || id.includes('iphone-8') ||
      m.includes('iphone 7') || id.includes('iphone-7') ||
      m.includes('iphone 6') || id.includes('iphone-6') ||
      m.includes('iphone 5') || id.includes('iphone-5')
    );
    const isTouchIdIpad = (m.includes('ipad') || id.includes('ipad')) && !m.includes('pro') && !id.includes('pro');

    if (isTouchIdIphone || isTouchIdIpad) {
      return 'touch_id';
    }

    // Modern iPhones (X, XR, XS, 11, 12, 13, 14, 15, 16, 17, 18) and iPad Pro have Face ID TrueDepth
    return 'face_id';
  }

  // Android smartphones and tablets use Fingerprint Scanner (optical/ultrasonic in-display or physical capacitive)
  return 'fingerprint';
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
      subText: 'Original branded sport band, loop, or leather strap is missing or torn.',
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
      subText: 'Original branded magnetic charging cable/puck is not included.',
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

// 2.2 Dedicated Tablet Defect Rules (iPads & Galaxy Tabs)
export function getTabletDefectRules(
  category: DeviceCategory,
  brandId?: string,
  modelName?: string
): DefectRule[] {
  const isApple = isAppleDevice(brandId, modelName);
  const screenPct = category === 'flagship' ? 0.32 : category === 'premium' ? 0.26 : 0.20;
  const nonOriginalPct = category === 'flagship' ? 0.38 : category === 'premium' ? 0.30 : 0.24;

  return [
    // ── BOOT GATEKEEPER ───────────────────────────────────────────────────
    {
      id: 'defect-critical-power',
      category: 'accessories',
      description: 'Tablet Does Not Turn On',
      subText: 'We currently only accept devices that switch on without any issues.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    },
    {
      id: 'defect-critical-icloud',
      category: 'accessories',
      description: isApple ? 'iCloud / Apple ID Activation Locked' : 'Google Account / FRP Locked',
      subText: isApple
        ? 'iPad is locked to an Apple ID or Activation Lock is active on iCloud.'
        : 'Tablet has active Factory Reset Protection or Google account lock.',
      deductionFixed: 0,
      deductionPercentage: 1.0,
      isCriticalFailure: true
    },

    // ── NETWORK & SIM TRAY ────────────────────────────────────────────────
    {
      id: 'defect-tablet-network-fail',
      category: 'connectivity',
      description: 'Cellular Network Not Working',
      subText: 'SIM not detecting, no cellular network reception, or frequent mobile data disconnection.',
      deductionFixed: 0,
      deductionPercentage: 0.12
    },
    {
      id: 'defect-tablet-missing-sim-tray',
      category: 'accessories',
      description: 'SIM Tray Missing or Damaged',
      subText: 'SIM card ejector tray is missing, cracked, or jammed inside the frame.',
      deductionFixed: 500,
      deductionPercentage: 0
    },

    // ── SCREEN DEFECTS (Touch & Originality) ──────────────────────────────
    {
      id: 'defect-screen-touch',
      category: 'screen',
      description: 'Touch Screen Not Working Properly',
      subText: 'Dead touch zones, ghost touches, or unresponsive digitizer when swiping or using stylus.',
      deductionFixed: 0,
      deductionPercentage: 0.25
    },
    {
      id: 'defect-screen-non-original',
      category: 'screen',
      description: 'Screen Replaced at Local Shop (Non-Original)',
      subText: 'Display panel was replaced at a local workshop / non-authorized service center.',
      deductionFixed: 0,
      deductionPercentage: nonOriginalPct
    },

    // ── SCREEN PHYSICAL CONDITION ─────────────────────────────────────────
    {
      id: 'defect-screen-scratches-minor',
      category: 'screen',
      description: '1-2 Scratches on Screen',
      subText: 'Light hairline surface scratches visible only under direct reflected light.',
      deductionFixed: 800,
      deductionPercentage: 0.02
    },
    {
      id: 'defect-screen-scratches-major',
      category: 'screen',
      description: 'More Than 2 Scratches on Screen',
      subText: 'Multiple deep scratches felt with fingernail across the display glass.',
      deductionFixed: 1500,
      deductionPercentage: 0.04
    },
    {
      id: 'defect-screen-chipped',
      category: 'screen',
      description: 'Chipped Outside Display Area',
      subText: 'Minor glass chip or bevel nick outside the active pixel viewing area.',
      deductionFixed: 0,
      deductionPercentage: 0.12
    },
    {
      id: 'defect-screen-cracked',
      category: 'screen',
      description: 'Screen Cracked / Glass Broken',
      subText: 'Visible spider cracks, deep hairline fracture, or shattered front glass.',
      deductionFixed: 0,
      deductionPercentage: screenPct
    },

    // ── SCREEN DISCOLORATION ──────────────────────────────────────────────
    {
      id: 'defect-screen-discolor-minor',
      category: 'screen',
      description: 'Minor Discoloration on Screen',
      subText: 'Faint yellow/pink tint or slight uneven warm patches along the screen edges.',
      deductionFixed: 0,
      deductionPercentage: 0.08
    },
    {
      id: 'defect-screen-discolor-major',
      category: 'screen',
      description: 'Major Discoloration on Screen',
      subText: 'Severe color shift, dark burn-in patches, or permanent pixel degradation.',
      deductionFixed: 0,
      deductionPercentage: 0.18
    },
    {
      id: 'defect-screen-shading',
      category: 'screen',
      description: 'Screen Shading / Fading',
      subText: 'Ghost image retention, faded contrast, or backlight gradient drop.',
      deductionFixed: 0,
      deductionPercentage: 0.14
    },

    // ── SPOTS ON SCREEN ───────────────────────────────────────────────────
    {
      id: 'defect-screen-spots-white-minor',
      category: 'screen',
      description: '1-2 Very Small White Spots on Screen',
      subText: 'Pressure spots or minor diffuser bright spots visible on a clean white background.',
      deductionFixed: 0,
      deductionPercentage: 0.06
    },
    {
      id: 'defect-screen-spots-multi',
      category: 'screen',
      description: '3 or More White Spots / Coloured Spots',
      subText: 'Multiple pressure spots, stuck colored pixels, or noticeable liquid blemishes.',
      deductionFixed: 0,
      deductionPercentage: 0.16
    },
    {
      id: 'defect-screen-lines',
      category: 'screen',
      description: 'Lines Visible on Screen',
      subText: 'Permanent vertical or horizontal colored laser lines across display panel.',
      deductionFixed: 0,
      deductionPercentage: 0.28
    },
    {
      id: 'defect-screen-light-leaks',
      category: 'screen',
      description: 'Light Leaks Around Edges of Display',
      subText: 'Backlight bleed glowing noticeably along the perimeter bezel edges.',
      deductionFixed: 0,
      deductionPercentage: 0.10
    },

    // ── FUNCTIONAL OR PHYSICAL PROBLEMS ───────────────────────────────────
    {
      id: 'defect-func-front-camera',
      category: 'camera',
      description: 'Front Camera Not Working',
      subText: 'Front FaceTime / selfie camera is blank, black, blurred, or fails to open.',
      deductionFixed: 1200,
      deductionPercentage: 0.08
    },
    {
      id: 'defect-func-back-camera',
      category: 'camera',
      description: 'Back Camera Not Working',
      subText: 'Rear primary camera sensor blurred, autofocus clicking, or black viewfinder.',
      deductionFixed: 1800,
      deductionPercentage: 0.10
    },
    {
      id: 'defect-func-camera-glass',
      category: 'camera',
      description: 'Camera Glass Broken / Missing',
      subText: 'Outer lens protective glass is cracked, scratched, or missing.',
      deductionFixed: 1200,
      deductionPercentage: 0
    },
    {
      id: 'defect-func-touch-id',
      category: 'functionality',
      description: 'Finger / Touch ID Sensor Not Working',
      subText: 'Biometric Touch ID sensor fails to register fingerprints or is greyed out.',
      deductionFixed: 0,
      deductionPercentage: 0.10
    },
    {
      id: 'defect-func-face-id',
      category: 'functionality',
      description: 'Face Sensor (Face ID) Not Working',
      subText: 'TrueDepth camera Face ID sensor disabled or shows "Face ID is Not Available".',
      deductionFixed: 0,
      deductionPercentage: 0.16
    },
    {
      id: 'defect-func-wifi',
      category: 'connectivity',
      description: 'Wi-Fi Not Working',
      subText: 'Wi-Fi toggle greyed out, cannot discover networks, or drops signal continuously.',
      deductionFixed: 0,
      deductionPercentage: 0.16
    },
    {
      id: 'defect-func-gps',
      category: 'connectivity',
      description: 'GPS Not Working',
      subText: 'Location services inaccurate, compass drifting, or satellite GPS lock fails.',
      deductionFixed: 1000,
      deductionPercentage: 0.05
    },
    {
      id: 'defect-func-bluetooth',
      category: 'connectivity',
      description: 'Bluetooth Not Working',
      subText: 'Cannot discover or pair Bluetooth accessories, headphones, or stylus.',
      deductionFixed: 1000,
      deductionPercentage: 0.05
    },
    {
      id: 'defect-func-audio-jack',
      category: 'functionality',
      description: 'Audio Jack Not Working',
      subText: '3.5mm headphone jack loose, distorted audio, or static buzz.',
      deductionFixed: 800,
      deductionPercentage: 0
    },
    {
      id: 'defect-func-volume-buttons',
      category: 'functionality',
      description: 'Volume Button Missing / Not Working',
      subText: 'Volume Up or Down physical button stuck, loose, missing, or unresponsive.',
      deductionFixed: 1000,
      deductionPercentage: 0
    },
    {
      id: 'defect-func-power-button',
      category: 'functionality',
      description: 'Power Button Broken / Not Working / Missing',
      subText: 'Top / Sleep power button does not click or fails to wake tablet.',
      deductionFixed: 1500,
      deductionPercentage: 0
    },
    {
      id: 'defect-func-charging',
      category: 'connectivity',
      description: 'Charging Defect; Unable to Charge',
      subText: 'USB-C / Lightning port loose, requires cable wiggling, or fails to charge tablet.',
      deductionFixed: 0,
      deductionPercentage: 0.14
    },
    {
      id: 'defect-battery-low',
      category: 'connectivity',
      description: 'Battery Faulty or Not Working',
      subText: 'Battery drains rapidly, shuts down under 20%, or swollen battery detected.',
      deductionFixed: 2500,
      deductionPercentage: 0.08
    },
    {
      id: 'defect-func-mic',
      category: 'functionality',
      description: 'Microphone Not Working',
      subText: 'Voice recording or video call microphone audio is muffled, quiet, or silent.',
      deductionFixed: 1200,
      deductionPercentage: 0.05
    },
    {
      id: 'defect-func-speaker',
      category: 'functionality',
      description: 'Speaker Not Working; Faulty or Cracked Sound',
      subText: 'Quad or stereo speaker assembly rattles, buzzes, or has crackling audio.',
      deductionFixed: 1500,
      deductionPercentage: 0.06
    },

    // ── BODY DEFECTS ──────────────────────────────────────────────────────
    {
      id: 'defect-body-scratches-minor',
      category: 'body',
      description: '1-2 Scratches on Body',
      subText: 'Minor faint scuffs on the aluminum chassis from ordinary daily handling.',
      deductionFixed: 600,
      deductionPercentage: 0.015
    },
    {
      id: 'defect-body-scratches-major',
      category: 'body',
      description: 'More Than 2 Scratches on Body',
      subText: 'Noticeable abrasions or deep metal surface scratches on body housing.',
      deductionFixed: 1200,
      deductionPercentage: 0.03
    },
    {
      id: 'defect-body-dents-minor',
      category: 'body',
      description: '1-2 Minor Dents on Body',
      subText: 'Small cosmetic corner or rim dimples that do not affect internal assembly.',
      deductionFixed: 1200,
      deductionPercentage: 0.04
    },
    {
      id: 'defect-body-dents-major',
      category: 'body',
      description: 'Major Dent(s) or More Than 2 Dents',
      subText: 'Heavy frame dents, gouged corner metal, or structural impact marks.',
      deductionFixed: 2500,
      deductionPercentage: 0.08
    },
    {
      id: 'defect-body-bent',
      category: 'body',
      description: 'Body Bent',
      subText: 'Chassis visibly warped or curved when laid flat on a level tabletop.',
      deductionFixed: 0,
      deductionPercentage: 0.18
    },
    {
      id: 'defect-body-screen-loose',
      category: 'body',
      description: 'Loose Screen',
      subText: 'Screen lifting away from the metal frame adhesive along sides or corners.',
      deductionFixed: 0,
      deductionPercentage: 0.12
    },
    {
      id: 'defect-body-bent-and-loose',
      category: 'body',
      description: 'Both Bent and Loose Screen',
      subText: 'Severe structural bend causing the glass digitizer assembly to pop out.',
      deductionFixed: 0,
      deductionPercentage: 0.25
    },

    // ── DEVICE SIDE / BACK PANEL CONDITION ────────────────────────────────
    {
      id: 'defect-body-panel-gap',
      category: 'body',
      description: 'Visible Gap Between Body and Back Panel',
      subText: 'Enclosure seam separation or swelling gap between rear shell and frame.',
      deductionFixed: 0,
      deductionPercentage: 0.10
    },
    {
      id: 'defect-body-panel-chipped',
      category: 'body',
      description: 'Back Panel Chipped on Edges',
      subText: 'Corner metal or composite back panel chipped/damaged from hard fall.',
      deductionFixed: 1000,
      deductionPercentage: 0.06
    },
    {
      id: 'defect-body-panel-broken',
      category: 'body',
      description: 'Back Panel Broken / Shattered',
      subText: 'Rear enclosure cracked, shattered, or severely deformed.',
      deductionFixed: 0,
      deductionPercentage: 0.18
    },
    {
      id: 'defect-body-panel-missing',
      category: 'body',
      description: 'Back Panel Missing',
      subText: 'Rear panel piece detached or internal battery/logic board exposed.',
      deductionFixed: 0,
      deductionPercentage: 0.25
    },

    // ── ACCESSORIES & INVOICE ─────────────────────────────────────────────
    {
      id: 'defect-acc-missing-charger',
      category: 'accessories',
      description: 'Missing Original Tablet Charger',
      subText: 'Original high-wattage power adapter / USB-C fast charging brick not provided.',
      deductionFixed: 1500,
      deductionPercentage: 0
    },
    {
      id: 'defect-acc-missing-box',
      category: 'accessories',
      description: 'Missing Box With Same IMEI / Serial',
      subText: 'Original manufacturer retail box with matching serial barcode not available.',
      deductionFixed: 800,
      deductionPercentage: 0
    },
    {
      id: 'defect-acc-missing-bill',
      category: 'accessories',
      description: 'Missing GST Valid Bill With Same IMEI / Serial',
      subText: 'GST retail invoice with device serial/IMEI not provided (required for warranty claims).',
      deductionFixed: 1000,
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
  if (isTabletDevice(brandId, modelName, modelId)) {
    return getTabletDefectRules(category, brandId, modelName);
  }

  const isApple = isAppleDevice(brandId, modelName);
  const isFoldable = isFoldableDevice(brandId, modelName, modelId);
  const biometricType = getBiometricType(brandId, modelName, modelId);
  const screenPct   = category === 'flagship' ? 0.28 : category === 'premium' ? 0.22 : 0.18;
  const nonOriginalScreenPct = category === 'flagship' ? 0.40 : category === 'premium' ? 0.32 : 0.25;
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
        : 'Screen color profile sync or auto-brightness calibration failing — indicates non-original / duplicate display.',
      deductionFixed: category === 'flagship' ? 2500 : 1500,
      deductionPercentage: 0
    },
    {
      id: 'defect-screen-non-original',
      category: 'screen',
      description: 'Replaced / Non-Original Screen',
      subText: 'Display panel has been changed or replaced with a local/aftermarket screen.',
      deductionFixed: 0,
      deductionPercentage: nonOriginalScreenPct
    },
    ...(isFoldable ? [{
      id: 'defect-screen-crease',
      category: 'screen' as const,
      description: 'Inner Display Crease Damage / Bubbling',
      subText: 'Protective layer bubbling, discoloration, or dead line along the folding crease of the inner flexible display.',
      deductionFixed: 1500,
      deductionPercentage: 0.35
    }] : []),

    // ── BODY ─────────────────────────────────────────────────────────────
    ...(isFoldable ? [{
      id: 'defect-body-hinge',
      category: 'body' as const,
      description: 'Hinge Faulty / Does Not Fold Flat',
      subText: 'Hinge is loose, stiff, makes clicking/grinding sounds, or fails to open 180° / fold completely flat.',
      deductionFixed: category === 'flagship' ? 2000 : 1500,
      deductionPercentage: category === 'flagship' ? 0.20 : 0.18
    }] : []),
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
        ? 'Bottom pentalobe screws are stripped, damaged, or replaced with third-party screws.'
        : 'Bottom housing screws are stripped, damaged, or replaced with third-party hardware.',
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
      description: 
        biometricType === 'face_id' ? 'Biometrics Faulty (Face ID)' :
        biometricType === 'touch_id' ? 'Biometrics Faulty (Touch ID)' :
        'Biometrics Faulty (Fingerprint / Face Unlock)',
      subText: 
        biometricType === 'face_id'
          ? 'Face ID does not recognise face, fails to set up, or TrueDepth sensor has hardware failure.'
          : biometricType === 'touch_id'
          ? 'Touch ID sensor fails to register fingerprints, setup error, or Home button sensor is unresponsive.'
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
    ...(isApple ? [{
      id: 'defect-battery-80-85' as const,
      category: 'connectivity' as const,
      description: 'Battery Health 80% – 85%',
      subText: 'Maximum capacity is between 80% and 85% in Settings → Battery → Battery Health.',
      deductionFixed: 1000,
      deductionPercentage: 0.025
    }] : []),
    {
      id: 'defect-battery-low',
      category: 'connectivity',
      description: isApple ? 'Battery Health < 80% (Service Alert)' : 'Battery Faulty / Rapid Drain / Sudden Shutdown',
      subText: isApple
        ? 'Maximum capacity is below 80% or shows "Service" message in Settings → Battery.'
        : 'Phone drains very quickly, shuts down unexpectedly under 20%, or battery is swollen.',
      deductionFixed: 2500,
      deductionPercentage: 0.05
    },
    {
      id: 'defect-battery-warning',
      category: 'connectivity',
      description: isApple ? 'Non-Genuine Battery Warning' : 'Battery Replaced / Duplicate Battery',
      subText: isApple 
        ? '"Important Battery Message" alert visible in Settings → Battery (battery was replaced).'
        : 'Battery was replaced from a local repair shop or is not original company battery.',
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
      subText: 'Original charger or cable is not included.',
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
    ...(hasSpenSupport(brandId, modelName, modelId) ? [{
      id: 'defect-spen-missing' as const,
      category: 'accessories' as const,
      description: 'Missing Original S-Pen',
      subText: 'Original stylus S-Pen that came bundled with the device is missing, broken, or unresponsive.',
      deductionFixed: 2000,
      deductionPercentage: 0
    }] : []),

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

const catalogId = (brandId: string, name: string) => {
  const brandSlug = brandId.replace('brand-', '').toLowerCase();
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const deDuplicated = cleanName.startsWith(`${brandSlug}-`) ? cleanName.slice(brandSlug.length + 1) : cleanName;
  return `catalog-${brandSlug}-${deDuplicated}`;
};

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

export function resolveModelReleaseYear(brandId: string, name: string, fallbackYear: number): number {
  const n = name.trim();
  const b = brandId.toLowerCase();

  // ── APPLE ──
  if (b === 'brand-apple' || b === 'apple') {
    if (/iPhone 17/i.test(n)) return 2025;
    if (/iPhone 16/i.test(n)) return 2024;
    if (/iPhone 15/i.test(n)) return 2023;
    if (/iPhone 14/i.test(n)) return 2022;
    if (/iPhone 13/i.test(n)) return 2021;
    if (/iPhone 12/i.test(n)) return 2020;
    if (/iPhone 11/i.test(n)) return 2019;
    if (/iPhone XR|iPhone XS/i.test(n)) return 2018;
    if (/iPhone X\b/i.test(n)) return 2017;
    if (/iPhone SE3/i.test(n)) return 2022;
    if (/iPhone SE2/i.test(n)) return 2020;
    if (/iPad Pro 13" \(M4\)|iPad Pro 11" \(M4\)|iPad Air 13" \(M2\)|iPad Air 11" \(M2\)|iPad mini 7/i.test(n)) return 2024;
    if (/iPad \(10th Generation\)/i.test(n)) return 2022;
    if (/Apple Watch Series 10|Apple Watch Ultra 2/i.test(n)) return 2024;
    if (/Apple Watch Series 9|Apple Watch SE \(2nd Gen\)/i.test(n)) return 2023;
  }

  // ── SAMSUNG ──
  if (b === 'brand-samsung' || b === 'samsung') {
    if (/Galaxy S26/i.test(n)) return 2026;
    if (/Galaxy S25/i.test(n)) return 2025;
    if (/Galaxy S24/i.test(n)) return 2024;
    if (/Galaxy S23/i.test(n)) return 2023;
    if (/Galaxy S22|S20 FE 2022/i.test(n)) return 2022;
    if (/Galaxy S21 FE/i.test(n)) return 2022;
    if (/Galaxy S21/i.test(n)) return 2021;
    if (/Galaxy S20/i.test(n)) return 2020;
    if (/Galaxy S10/i.test(n)) return 2019;
    if (/Galaxy S9/i.test(n)) return 2018;
    if (/Galaxy S8/i.test(n)) return 2017;
    if (/Galaxy S7/i.test(n)) return 2016;
    if (/Galaxy S6/i.test(n)) return 2015;

    if (/Z Fold 8|Z Flip 8/i.test(n)) return 2026;
    if (/Z Fold 7|Z Flip 7/i.test(n)) return 2025;
    if (/Z Fold 6|Z Flip 6/i.test(n)) return 2024;
    if (/Z Fold 5|Z Flip 5/i.test(n)) return 2023;
    if (/Z Fold 4|Z Flip 4/i.test(n)) return 2022;
    if (/Z Fold 3|Z Flip 3|Z Fold3|Z Flip3/i.test(n)) return 2021;
    if (/Z Fold 2/i.test(n)) return 2020;

    // A Series
    if (/A17|A27|A37|A57/i.test(n)) return 2025;
    if (/A26|A36|A56/i.test(n)) return 2025;
    if (/A16/i.test(n)) return 2024;
    if (/A06|A15|A25|A35|A55/i.test(n)) return 2024;
    if (/A14|A24|A34|A54/i.test(n)) return 2023;
    if (/A04|A13|A23|A33|A53|A73/i.test(n)) return 2022;
    if (/A03s|A02|A12|A22|A32|A52|A72/i.test(n)) return 2021;
    if (/A03\b/i.test(n)) return 2022;

    // F Series
    if (/F07|F70|F47/i.test(n)) return 2025;
    if (/F06|F16|F36|F56/i.test(n)) return 2024;
    if (/F14|F34|F54/i.test(n)) return 2024;
    if (/F13|F23/i.test(n)) return 2022;
    if (/F02s|F12|F22|F42|F62/i.test(n)) return 2021;

    // M Series
    if (/M47|M07/i.test(n)) return 2025;
    if (/M06|M16|M36|M56|M55|M35/i.test(n)) return 2024;
    if (/M14|M34|M54/i.test(n)) return 2024;
    if (/M04|M13|M33/i.test(n)) return 2022;
    if (/M32 5G/i.test(n)) return 2021;
    if (/M02|M12|M21|M32|M42|M52|M62/i.test(n)) return 2021;
  }

  // ── GOOGLE ──
  if (b === 'brand-google' || b === 'google') {
    if (/Pixel 10/i.test(n)) return 2025;
    if (/Pixel 9a/i.test(n)) return 2025;
    if (/Pixel 9/i.test(n)) return 2024;
    if (/Pixel 8a/i.test(n)) return 2024;
    if (/Pixel 8|Pixel Fold/i.test(n)) return 2023;
    if (/Pixel 7a/i.test(n)) return 2023;
    if (/Pixel 7|Pixel 6a/i.test(n)) return 2022;
    if (/Pixel 6/i.test(n)) return 2021;
  }

  // ── ONEPLUS ──
  if (b === 'brand-oneplus' || b === 'oneplus') {
    if (/OnePlus 15/i.test(n)) return 2025;
    if (/OnePlus 13/i.test(n)) return 2025;
    if (/OnePlus 12/i.test(n)) return 2024;
    if (/OnePlus Nord 4|OnePlus Nord CE 4/i.test(n)) return 2024;
    if (/OnePlus 11|OnePlus Open/i.test(n)) return 2023;
    if (/OnePlus Nord 3|OnePlus Nord CE 3/i.test(n)) return 2023;
    if (/OnePlus 10/i.test(n)) return 2022;
    if (/OnePlus Nord 2T|OnePlus Nord 2 CE/i.test(n)) return 2022;
    if (/OnePlus 9|OnePlus Nord 2\b/i.test(n)) return 2021;
    if (/OnePlus 8/i.test(n)) return 2020;
    if (/Nord 5/i.test(n)) return 2025;
    if (/Nord 6/i.test(n)) return 2025;
  }

  // ── NOTHING ──
  if (b === 'brand-nothing' || b === 'nothing') {
    if (/Phone 4a/i.test(n)) return 2026;
    if (/Phone 3|Phone \(3\)|Phone 3a|Phone \(3a\)|CMF Phone 2/i.test(n)) return 2025;
    if (/Phone 2a|CMF Phone 1/i.test(n)) return 2024;
    if (/Phone 2|Phone \(2\)/i.test(n)) return 2023;
    if (/Phone 1|Phone \(1\)/i.test(n)) return 2022;
  }

  // ── XIAOMI / REDMI / POCO ──
  if (b === 'brand-xiaomi' || b === 'xiaomi') {
    if (/Xiaomi 17/i.test(n)) return 2026;
    if (/Xiaomi 16/i.test(n)) return 2026;
    if (/Xiaomi 15 Ultra/i.test(n)) return 2025;
    if (/Xiaomi 15/i.test(n)) return 2024;
    if (/Xiaomi 14/i.test(n)) return 2024;
    if (/Xiaomi 13T|Xiaomi 13\b|Xiaomi 13 Pro|Xiaomi 13 Lite/i.test(n)) return 2023;
    if (/Xiaomi 12|Xiaomi 11i/i.test(n)) return 2022;
    if (/Mi 11/i.test(n)) return 2021;

    if (/Redmi Note 17/i.test(n)) return 2026;
    if (/Redmi Note 15/i.test(n)) return 2026;
    if (/Redmi Note 14/i.test(n)) return 2024;
    if (/Redmi Note 13/i.test(n)) return 2024;
    if (/Redmi Note 12/i.test(n)) return 2023;
    if (/Redmi Note 11/i.test(n)) return 2022;
    if (/Redmi Note 10/i.test(n)) return 2021;

    if (/Redmi Turbo 5/i.test(n)) return 2026;
    if (/Redmi 15/i.test(n)) return 2025;
    if (/Redmi 14/i.test(n)) return 2024;
    if (/Redmi 13/i.test(n)) return 2024;
    if (/Redmi 12/i.test(n)) return 2023;
    if (/Redmi 11 Prime 5G/i.test(n)) return 2022;
    if (/Redmi 11/i.test(n)) return 2022;
    if (/Redmi 10 Power|Redmi 10 Prime 2022/i.test(n)) return 2022;
    if (/Redmi 10|Redmi 9/i.test(n)) return 2021;
    if (/Redmi A3/i.test(n)) return 2024;
    if (/Redmi A2/i.test(n)) return 2023;
    if (/Redmi K50i/i.test(n)) return 2022;

    if (/POCO F7|POCO X7|POCO M7/i.test(n)) return 2025;
    if (/POCO F6|POCO X6|POCO M6/i.test(n)) return 2024;
    if (/POCO F5|POCO X5/i.test(n)) return 2023;
    if (/POCO X4/i.test(n)) return 2022;
    if (/POCO X8|POCO M8/i.test(n)) return 2026;
  }

  // ── VIVO ──
  if (b === 'brand-vivo' || b === 'vivo') {
    if (/X300|X5 Fold/i.test(n)) return 2025;
    if (/X200/i.test(n)) return 2024;
    if (/X100|X Fold 3|X Fold3/i.test(n)) return 2024;
    if (/X90/i.test(n)) return 2023;
    if (/X80/i.test(n)) return 2022;
    if (/X60/i.test(n)) return 2021;

    if (/V70|V60/i.test(n)) return 2025;
    if (/V50|V40|V30/i.test(n)) return 2024;
    if (/V29|V27/i.test(n)) return 2023;
    if (/V25|V23/i.test(n)) return 2022;
    if (/V21/i.test(n)) return 2021;

    if (/T5/i.test(n)) return 2026;
    if (/T4/i.test(n)) return 2025;
    if (/T3/i.test(n)) return 2024;
    if (/T2/i.test(n)) return 2023;
    if (/T1/i.test(n)) return 2022;

    if (/Y400|Y300 5G|Y300 Plus|Y39|Y29|Y19/i.test(n)) return 2025;
    if (/Y300|Y200 5G|Y200e|Y18|Y28/i.test(n)) return 2024;
    if (/Y200|Y100|Y36|Y56|Y17s|Y27|Y11 5G|Y21 5G|Y31 5G/i.test(n)) return 2023;
    if (/Y16|Y22|Y35|Y21G/i.test(n)) return 2022;
    if (/Y51 Pro/i.test(n)) return 2021;
    if (/Y12s|Y20|Y20G|Y31\b|Y51\b|Y72|Y73/i.test(n)) return 2021;
  }

  // ── OPPO ──
  if (b === 'brand-oppo' || b === 'oppo') {
    if (/Reno 16/i.test(n)) return 2026;
    if (/Reno 15|Reno 14|Reno 13/i.test(n)) return 2025;
    if (/Reno 12|Reno 11/i.test(n)) return 2024;
    if (/Reno 10/i.test(n)) return 2023;
    if (/Reno 8/i.test(n)) return 2022;

    if (/Find X9/i.test(n)) return 2025;
    if (/Find X8/i.test(n)) return 2024;

    if (/F33|F31|F29/i.test(n)) return 2025;
    if (/F27|F25/i.test(n)) return 2024;
    if (/F23/i.test(n)) return 2023;
    if (/F21/i.test(n)) return 2022;

    if (/A6\b|A6x|A6s|A6t|A6k|A6 Pro/i.test(n)) return 2026;
    if (/A5\b|A5x|A5 Pro/i.test(n)) return 2025;
    if (/A3\b|A3x|A3 Pro|A60/i.test(n)) return 2024;
    if (/A38|A58 4G|A59/i.test(n)) return 2023;
    if (/A36|A57/i.test(n)) return 2022;
    if (/A55s|A53s|A54|A55/i.test(n)) return 2021;
  }

  // ── MOTOROLA ──
  if (b === 'brand-motorola' || b === 'motorola') {
    if (/Edge 70|Edge 60|Razr 60|G06|G36|G56|G57|G67/i.test(n)) return 2025;
    if (/Edge 50|Razr 50|G04|G05/i.test(n)) return 2024;
    if (/Edge 40/i.test(n)) return 2023;
  }

  return fallbackYear;
}

export const makeCatalogModels = (brandId: string, series: string, releaseYear: number, names: string[]): Model[] =>
  names.map((name) => {
    const resolvedYear = resolveModelReleaseYear(brandId, name, releaseYear);
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
      releaseYear: resolvedYear,
      basePrice128GB: catalogPrice(brandId, name, category, resolvedYear),
      series: resolvedSeries,
      supportedStorageGb: benchmark ? benchmark.supportedStorageGb : undefined,
      variantPrices: benchmark ? benchmark.variantPrices : undefined,
      hidden: !isModelActiveInCatalog({ id: catalogId(brandId, name), name }),
      supportsWarrantyQuestion: resolvedYear >= 2023,
    };
  });

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

// Fallback catalog models loaded directly from live database snapshot
const FALLBACK_MODELS: Model[] = sortModelsByLaunchDesc(
  (fallbackModelsData as any[]).map(m => ({
    ...m,
    hidden: m.hidden !== undefined ? m.hidden : !isModelActiveInCatalog(m),
  })) as Model[]
);

export const TABLET_MODELS: Model[] = FALLBACK_MODELS.filter(m => m.deviceType === 'tablets' || isTabletDevice(m.brandId, m.name, m.id));
export const SMARTWATCH_MODELS: Model[] = FALLBACK_MODELS.filter(m => m.deviceType === 'smartwatches' || isSmartwatchDevice(m.brandId, m.name, m.id));
export const SMARTPHONE_MODELS: Model[] = FALLBACK_MODELS.filter(m => m.deviceType === 'smartphones' || (!m.deviceType && !isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id)));

export const TABLET_MODELS_WITH_PRICES: Model[] = TABLET_MODELS;
export const SMARTWATCH_MODELS_WITH_PRICES: Model[] = SMARTWATCH_MODELS;
export const MODELS: Model[] = FALLBACK_MODELS;

export const BASE_MODELS: Model[] = SMARTPHONE_MODELS;
export const CATALOG_ADDITIONS: Model[] = [];

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
  // Specialized variant generator for tablets / iPads (Storage, RAM for Android, and Wi-Fi / Cellular)
  if (isTabletDevice(model.brandId, model.name, model.id)) {
    const storages = getModelSupportedStorage(model);
    const rams = getModelSupportedRam(model).filter(r => r > 0);
    const effectiveRams = rams.length > 0 ? rams : [0];
    const variants: Variant[] = [];

    effectiveRams.forEach(ram => {
      storages.forEach(storageGb => {
        const cellularPrice = getVariantPrice(model, ram, storageGb, 'cellular');
        const wifiPrice = getVariantPrice(model, ram, storageGb, 'wifi');
        // Wi-Fi + Cellular variant
        variants.push({
          id: `var-${model.id}-${ram ? ram + 'gb-' : ''}${storageGb}gb-cellular`,
          modelId: model.id,
          ramGb: ram > 0 ? ram : undefined,
          storageGb,
          color: 'Wi-Fi + Cellular (SIM)',
          connectivity: 'cellular',
          basePrice: cellularPrice
        });
        // Wi-Fi Only variant
        variants.push({
          id: `var-${model.id}-${ram ? ram + 'gb-' : ''}${storageGb}gb-wifi`,
          modelId: model.id,
          ramGb: ram > 0 ? ram : undefined,
          storageGb,
          color: 'Wi-Fi Only',
          connectivity: 'wifi',
          basePrice: wifiPrice
        });
      });
    });
    return variants;
  }

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
  if (!model) return [0];
  if (isAppleDevice(model.brandId, model.name)) {
    return [0];
  }
  if (isSmartwatchDevice(model.brandId, model.name, model.id)) {
    return [2];
  }

  let ramArr: number[] | null = null;
  if (Array.isArray(model.supportedRamGb) && model.supportedRamGb.length > 0) {
    ramArr = model.supportedRamGb;
  } else if (typeof model.supportedRamGb === 'string') {
    try {
      const parsed = JSON.parse(model.supportedRamGb);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ramArr = parsed;
      }
    } catch {}
  }

  if (ramArr && ramArr.length > 0) {
    return [...ramArr].map(Number).filter(r => !isNaN(r)).sort((a, b) => a - b);
  }

  let pricesObj: Record<string, number> | null = null;
  if (typeof model.variantPrices === 'string') {
    try { pricesObj = JSON.parse(model.variantPrices); } catch {}
  } else if (typeof model.variantPrices === 'object' && model.variantPrices !== null) {
    pricesObj = model.variantPrices as Record<string, number>;
  }

  if (pricesObj && Object.keys(pricesObj).length > 0) {
    const rams = Array.from(new Set(
      Object.keys(pricesObj).map(k => Number(k.split('_')[0])).filter(r => !isNaN(r))
    )).sort((a, b) => a - b);
    if (rams.length > 0) return rams;
  }

  const modelPrices = getActualPricesForModel(model);
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

function getActualPricesForModel(model: Model) {
  if (!model) return null;
  const ap = actualPrices as Record<string, any>;
  if (model.id && ap[model.id]) return ap[model.id];

  const brandSlug = (model.brandId || '').replace('brand-', '').toLowerCase();
  const cleanName = (model.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const altKey1 = `catalog-${brandSlug}-${cleanName}`;
  if (ap[altKey1]) return ap[altKey1];

  const altKey2 = `catalog-${brandSlug}-${brandSlug}-${cleanName}`;
  if (ap[altKey2]) return ap[altKey2];

  const altKey3 = cleanName.startsWith(`${brandSlug}-`) ? `catalog-${cleanName}` : `catalog-${brandSlug}-${cleanName}`;
  if (ap[altKey3]) return ap[altKey3];

  const targetName = (model.name || '').toLowerCase().trim();
  if (targetName) {
    for (const key in ap) {
      const entry = ap[key];
      if (entry && entry.modelName && entry.modelName.toLowerCase().trim() === targetName) {
        return entry;
      }
    }
  }

  return null;
}

/** Returns accurate supported storage options (GB) for a model */
export function getModelSupportedStorage(model: Model): number[] {
  if (!model) return [128, 256];

  let storageArr: number[] | null = null;
  if (Array.isArray(model.supportedStorageGb) && model.supportedStorageGb.length > 0) {
    storageArr = model.supportedStorageGb;
  } else if (typeof model.supportedStorageGb === 'string') {
    try {
      const parsed = JSON.parse(model.supportedStorageGb);
      if (Array.isArray(parsed) && parsed.length > 0) {
        storageArr = parsed;
      }
    } catch {}
  }

  if (storageArr && storageArr.length > 0) {
    return [...storageArr].map(Number).filter(s => !isNaN(s) && s > 0).sort((a, b) => a - b);
  }

  let pricesObj: Record<string, number> | null = null;
  if (typeof model.variantPrices === 'string') {
    try { pricesObj = JSON.parse(model.variantPrices); } catch {}
  } else if (typeof model.variantPrices === 'object' && model.variantPrices !== null) {
    pricesObj = model.variantPrices as Record<string, number>;
  }

  if (pricesObj && Object.keys(pricesObj).length > 0) {
    const storages = Array.from(new Set(
      Object.keys(pricesObj).map(k => Number(k.split('_')[1])).filter(s => !isNaN(s) && s > 0)
    )).sort((a, b) => a - b);
    if (storages.length > 0) return storages;
  }

  const modelPrices = getActualPricesForModel(model);
  if (modelPrices && modelPrices.ourPrices && Object.keys(modelPrices.ourPrices).length > 0) {
    const storages = Array.from(new Set(
      Object.keys(modelPrices.ourPrices).map(k => Number(k.split('_')[1])).filter(s => !isNaN(s) && s > 0)
    )).sort((a, b) => a - b);
    if (storages.length > 0) return storages;
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
  if (model.variantPrices) {
    if (typeof model.variantPrices === 'object' && model.variantPrices !== null && Object.keys(model.variantPrices).length > 0) {
      return model.variantPrices as Record<string, number>;
    }
    if (typeof model.variantPrices === 'string') {
      try {
        const parsed = JSON.parse(model.variantPrices);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed as Record<string, number>;
        }
      } catch {}
    }
  }
  const modelPrices = getActualPricesForModel(model);
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

/** Returns the maximum variant price across active, supported RAM & Storage combinations for a model */
export function getMaxVariantPrice(model: Model): number {
  if (!model) return 10000;

  const rams = getModelSupportedRam(model);
  const storages = getModelSupportedStorage(model);
  const activePrices: number[] = [];

  const activeRams = rams.length > 0 ? rams : [0];
  for (const r of activeRams) {
    for (const s of storages) {
      if (isVariantAvailable(model, r, s)) {
        const price = getVariantPrice(model, r, s);
        if (price > 0) {
          activePrices.push(price);
        }
      }
    }
  }

  if (activePrices.length > 0) {
    return Math.max(...activePrices);
  }

  // Fallback: If no combinations matched via getModelSupportedRam/Storage, check explicit active entries in variantPrices
  let pricesObj: Record<string, number> | null = null;
  if (typeof model.variantPrices === 'string') {
    try {
      pricesObj = JSON.parse(model.variantPrices);
    } catch {
      pricesObj = null;
    }
  } else if (typeof model.variantPrices === 'object' && model.variantPrices !== null) {
    pricesObj = model.variantPrices as Record<string, number>;
  }

  if (pricesObj && Object.keys(pricesObj).length > 0) {
    const rawPrices = Object.values(pricesObj)
      .map(v => Number(v))
      .filter(v => !isNaN(v) && v > 0);

    if (rawPrices.length > 0) {
      return Math.max(...rawPrices);
    }
  }

  return model.basePrice128GB || 10000;
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

/** Get the admin-defined price for a specific RAM+Storage combo and optional connectivity (wifi vs cellular), or best-guess fallback */
export function getVariantPrice(
  model: Model,
  ramGb: number,
  storageGb: number,
  connectivity?: 'wifi' | 'cellular'
): number {
  if (model && model.variantPrices) {
    let prices: Record<string, number> | null = null;
    if (typeof model.variantPrices === 'string') {
      try { prices = JSON.parse(model.variantPrices); } catch { prices = null; }
    } else if (typeof model.variantPrices === 'object' && model.variantPrices !== null) {
      prices = model.variantPrices as Record<string, number>;
    }
    if (prices) {
      // 1. If explicit connectivity requested, check `${ramGb}_${storageGb}_${connectivity}`
      if (connectivity) {
        const connKey = `${ramGb}_${storageGb}_${connectivity}`;
        if (prices[connKey] !== undefined && Number(prices[connKey]) > 0) {
          return Number(prices[connKey]);
        }
      }

      // 2. Check base key `${ramGb}_${storageGb}`
      const key = `${ramGb}_${storageGb}`;
      if (prices[key] !== undefined && Number(prices[key]) > 0) {
        return Number(prices[key]);
      }
    }
  }
  // Base storage calculation
  if (isTabletDevice(model.brandId, model.name, model.id)) {
    const storageMultiplierMap: Record<number, number> = {
      64: 0.88, 128: 1.00, 256: 1.15, 512: 1.32, 1024: 1.55, 2048: 1.80
    };
    const mult = storageMultiplierMap[storageGb] || 1.0;
    const base = Math.round(model.basePrice128GB * mult);
    const connBonus = connectivity === 'cellular' ? 3000 : 0;
    const ramOptions = getModelSupportedRam(model).filter(r => r > 0);
    if (ramOptions.length <= 1 || ramGb === 0 || !ramGb) {
      return base + connBonus;
    }
    const minRam = Math.min(...ramOptions);
    const stepCount = (ramGb - minRam) / 2;
    const ramBonus = Math.max(0, stepCount * 1250);
    return Math.round(base + connBonus + ramBonus);
  }

  const variants = generateVariantsForModel(model);
  const baseVar = variants.find(v => v.storageGb === storageGb && (!connectivity || v.connectivity === connectivity)) ||
    variants.find(v => v.storageGb === storageGb) ||
    variants[0];
  const baseStoragePrice = baseVar ? baseVar.basePrice : model.basePrice128GB;

  const ramOptions = getModelSupportedRam(model).filter(r => r > 0);
  if (ramOptions.length <= 1 || ramGb === 0 || !ramGb) {
    return baseStoragePrice;
  }
  const minRam = Math.min(...ramOptions);
  const stepCount = (ramGb - minRam) / 2;
  const ramBonus = Math.max(0, stepCount * 1250);
  const total = Math.round(baseStoragePrice + ramBonus);
  return total;
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
  imei: string;
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



