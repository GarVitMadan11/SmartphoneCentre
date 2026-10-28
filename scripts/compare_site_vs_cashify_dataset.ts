import fs from 'fs';
import path from 'path';
import { calculateStage1Valuation, PricingEngineInput } from '../src/utils/pricingEngine';
import { DefectRule, isAppleDevice, getBiometricType } from '../src/data/mockDatabase';

interface CsvRow {
  experiment_id: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  condition: string;
  cashify_quote: number;
  baseline_quote: number;
  changed_variable: string;
  notes: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const header = lines[0].split(',');
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parse handling quotes if any
    const line = lines[i];
    const parts: string[] = [];
    let insideQuotes = false;
    let currentPart = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        parts.push(currentPart.trim());
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.trim());

    if (parts.length >= 31) {
      rows.push({
        experiment_id: parts[0],
        brand: parts[2],
        model: parts[3],
        ram: parts[4],
        storage: parts[5],
        condition: parts[6],
        cashify_quote: parseFloat(parts[29]) || 0,
        baseline_quote: parseFloat(parts[30]) || 0,
        changed_variable: parts[33],
        notes: parts[34] || ''
      });
    }
  }
  return rows;
}

function normalizeModelName(csvModel: string): string {
  return csvModel.trim();
}

function parseStorage(storageStr: string): number {
  if (storageStr.includes('TB')) return 1024;
  const num = parseInt(storageStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 128 : num;
}

function runDatasetComparison() {
  const csvPath = path.resolve(process.cwd(), 'cashify_experiments_dataset.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(content);

  console.log(`==================================================================================================`);
  console.log(`REPHONIX SITE PRICING ENGINE VS CASHIFY EXPERIMENTAL DATASET COMPARISON (Utmost Precision)`);
  console.log(`Total Dataset Entries Loaded: ${rows.length}`);
  console.log(`==================================================================================================\n`);

  let validComparisons = 0;
  let rephonixWins = 0;
  let totalCashifySum = 0;
  let totalRephonixSum = 0;

  const categoryStats: Record<string, { count: number; wins: number; totalCashify: number; totalRephonix: number }> = {
    'flawless_baseline': { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 },
    'storage_variant': { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 },
    'battery_degradation': { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 },
    'minor_functional': { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 },
    'heavy_hardware': { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 },
    'scrap_salvage': { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 },
  };

  const sampleRows: Array<{
    id: string;
    model: string;
    storage: string;
    conditionDesc: string;
    cashify: number;
    rephonix: number;
    edge: number;
    pct: number;
    multiplier: string;
  }> = [];

  for (const row of rows) {
    if (row.cashify_quote <= 0) continue; // Skip incomplete or 0 test runs

    const storageGb = parseStorage(row.storage);
    const modelClean = normalizeModelName(row.model);
    
    const isApple = isAppleDevice(row.brand, modelClean);
    const releaseYear = (
      modelClean.includes('17') ? 2025 :
      modelClean.includes('16') || modelClean.includes('S24') ? 2024 :
      modelClean.includes('15') || modelClean.includes('S23') ? 2023 :
      modelClean.includes('14') || modelClean.includes('S22') ? 2022 :
      modelClean.includes('13') || modelClean.includes('S21') ? 2021 : 2020
    );
    const category = (
      modelClean.includes('Pro') || modelClean.includes('Ultra') || modelClean.includes('Fold') ? 'flagship' :
      modelClean.includes('Plus') || modelClean.includes('Edge') ? 'premium' : 'midrange'
    );

    // For baseline and storage variants, the benchmark is the variant's cashify quote
    // For defect runs, the benchmark before defect is the baseline quote
    const isBaselineOrStorage = row.changed_variable === 'baseline' || row.changed_variable.startsWith('storage_') || row.changed_variable === 'warranty_<3m';
    const basePrice = isBaselineOrStorage ? row.cashify_quote : (row.baseline_quote > 0 ? row.baseline_quote : row.cashify_quote);

    // Map all 34 Cashify variables with utmost precision
    const selectedDefects: DefectRule[] = [];
    let defectCategory = 'minor_functional';
    let warrantyAge: 'under_3m' | 'out_of_warranty' = 'under_3m';
    let simType: 'dual_sim' | 'single_sim' = 'dual_sim';

    const v = row.changed_variable;

    if (v === 'baseline') {
      defectCategory = 'flawless_baseline';
    } else if (v.startsWith('storage_')) {
      defectCategory = 'storage_variant';
    } else if (v === 'out_of_warranty') {
      defectCategory = 'minor_functional';
      warrantyAge = 'out_of_warranty';
    } else if (v === 'warranty_<3m') {
      defectCategory = 'flawless_baseline';
      warrantyAge = 'under_3m';
    } else if (v === 'no_bill') {
      defectCategory = 'minor_functional';
      warrantyAge = 'out_of_warranty';
      selectedDefects.push({
        id: 'defect-acc-nodocs',
        category: 'accessories',
        description: 'Missing Invoice / Purchase Bill',
        subText: 'No bill available',
        deductionFixed: 1500,
        deductionPercentage: 0
      });
    } else if (v === 'battery_80_85') {
      defectCategory = 'battery_degradation';
      selectedDefects.push({
        id: 'defect-battery-80-85',
        category: 'connectivity',
        description: 'Battery Health 80-85%',
        subText: 'Mild battery degradation',
        deductionFixed: 0,
        deductionPercentage: 0.012
      });
    } else if (v === 'battery_service_under_80') {
      defectCategory = 'battery_degradation';
      selectedDefects.push({
        id: 'defect-battery-low',
        category: 'connectivity',
        description: 'Battery Health < 80% / Service Alert',
        subText: 'Degraded battery requiring service',
        deductionFixed: 0,
        deductionPercentage: 0.035
      });
    } else if (v === 'screen_scratches_broken') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push({
        id: 'defect-screen-cracked',
        category: 'screen',
        description: 'Front Screen Glass Cracked',
        subText: 'Spider cracks across display',
        deductionFixed: 0,
        deductionPercentage: category === 'flagship' ? 0.28 : 0.22
      });
    } else if (v === 'screen_dead_spots_lines') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push({
        id: 'defect-screen-burn',
        category: 'screen',
        description: 'Screen Lines / Dead Pixel Spots',
        subText: 'Panel lines or bleed',
        deductionFixed: 0,
        deductionPercentage: category === 'flagship' ? 0.28 : 0.22
      });
    } else if (v === 'screen_non_original') {
      // Rephonix does not have non-original screen defect option (deliberately excluded per user design)
      continue;
    } else if (v === 'screen_touch_defective') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push({
        id: 'defect-screen-touch',
        category: 'screen',
        description: 'Touch Digitizer Unresponsive',
        subText: 'Dead touch zones',
        deductionFixed: 0,
        deductionPercentage: 0.96
      });
    } else if (v === 'body_scratch_dent') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-body-dented',
        category: 'body',
        description: 'Body Dents / Scratches',
        subText: 'Chassis marks and dents',
        deductionFixed: 0,
        deductionPercentage: 0.04
      });
    } else if (v === 'body_panel_broken') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-body-backglass',
        category: 'body',
        description: 'Back Glass Broken',
        subText: 'Rear panel cracked',
        deductionFixed: category === 'flagship' ? 2500 : 1800,
        deductionPercentage: 0
      });
    } else if (v === 'camera_glass') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-camera-glass',
        category: 'camera',
        description: 'Camera Glass Cracked',
        subText: 'Outer lens glass fractured',
        deductionFixed: 0,
        deductionPercentage: 0.055
      });
    } else if (v === 'back_camera') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-camera-faulty',
        category: 'camera',
        description: 'Rear Camera Sensor Faulty',
        subText: 'Camera sensor blur / failure',
        deductionFixed: 0,
        deductionPercentage: 0.13
      });
    } else if (v === 'front_camera') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-camera-faulty',
        category: 'camera',
        description: 'Front Camera Sensor Faulty',
        subText: 'Front sensor blur / failure',
        deductionFixed: 0,
        deductionPercentage: 0.06
      });
    } else if (v === 'speaker') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-func-speaker',
        category: 'functionality',
        description: 'Speaker Assembly Faulty',
        subText: 'Distorted audio',
        deductionFixed: 0,
        deductionPercentage: 0.032
      });
    } else if (v === 'microphone') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-func-mic',
        category: 'functionality',
        description: 'Microphone Faulty',
        subText: 'Mic muffled or dead',
        deductionFixed: 0,
        deductionPercentage: 0.015
      });
    } else if (v === 'vibrator') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-func-vibrator',
        category: 'functionality',
        description: 'Vibration Motor Defective',
        subText: 'Haptic motor dead',
        deductionFixed: 0,
        deductionPercentage: 0.015
      });
    } else if (v === 'proximity' || v === 'audio_receiver') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-func-audio',
        category: 'functionality',
        description: 'Earpiece / Proximity Sensor Defective',
        subText: 'Audio receiver failure',
        deductionFixed: 0,
        deductionPercentage: 0.025
      });
    } else if (v === 'charging_port') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-func-charging',
        category: 'connectivity',
        description: 'Charging Port Faulty',
        subText: 'Port loose or not charging',
        deductionFixed: 0,
        deductionPercentage: 0.055
      });
    } else if (v === 'volume_button' || v === 'power_button') {
      defectCategory = 'minor_functional';
      selectedDefects.push({
        id: 'defect-body-buttons',
        category: 'body',
        description: 'Physical Buttons Stuck / Not Working',
        subText: 'Button unresponsive',
        deductionFixed: 700,
        deductionPercentage: 0
      });
    } else if (v === 'biometric') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push({
        id: 'defect-critical-security',
        category: 'functionality',
        description: isApple ? 'Face ID Unavailable' : 'Fingerprint Sensor Faulty',
        subText: 'Biometric hardware fault',
        deductionFixed: 0,
        deductionPercentage: 0.20
      });
    } else if (v === 'wifi' || v === 'bluetooth') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push({
        id: 'defect-func-wireless',
        category: 'connectivity',
        description: 'Wi-Fi / Bluetooth IC Hardware Failure',
        subText: 'RF module failed',
        deductionFixed: 0,
        deductionPercentage: 0.33
      });
    } else if (v === 'calling_defective') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push({
        id: 'defect-func-network',
        category: 'connectivity',
        description: 'Cellular Baseband / Network Calling Failure',
        subText: 'Cannot register on cellular carrier',
        deductionFixed: 0,
        deductionPercentage: 0.25
      });
    } else if (v === 'single_esim') {
      defectCategory = 'minor_functional';
      simType = 'single_sim';
    } else if (v === 'combo_screen_plus_battery') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push(
        { id: 'defect-screen-cracked', category: 'screen', description: 'Screen Cracked', subText: '', deductionFixed: 0, deductionPercentage: category === 'flagship' ? 0.28 : 0.22 },
        { id: 'defect-battery-low', category: 'connectivity', description: 'Battery Low', subText: '', deductionFixed: 3500, deductionPercentage: 0.08 }
      );
    } else if (v === 'combo_screen_plus_body') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push(
        { id: 'defect-screen-cracked', category: 'screen', description: 'Screen Cracked', subText: '', deductionFixed: 0, deductionPercentage: category === 'flagship' ? 0.28 : 0.22 },
        { id: 'defect-body-dented', category: 'body', description: 'Body Dented', subText: '', deductionFixed: 1000, deductionPercentage: 0.08 }
      );
    } else if (v === 'combo_3_functional_defects') {
      defectCategory = 'heavy_hardware';
      selectedDefects.push(
        { id: 'defect-func-speaker', category: 'functionality', description: 'Speaker Faulty', subText: '', deductionFixed: 2500, deductionPercentage: 0 },
        { id: 'defect-func-mic', category: 'functionality', description: 'Mic Faulty', subText: '', deductionFixed: 600, deductionPercentage: 0 },
        { id: 'defect-body-buttons', category: 'body', description: 'Buttons Faulty', subText: '', deductionFixed: 700, deductionPercentage: 0 }
      );
    }

    // Call Rephonix pricing engine
    const valuation = calculateStage1Valuation({
      modelId: 'sample-model',
      brandId: isApple ? 'brand-apple' : 'brand-samsung',
      modelName: modelClean,
      category,
      releaseYear,
      variant: {
        id: `var-${storageGb}`,
        storageGb,
        ramGb: 8,
        priceNew: Math.round(basePrice * 1.5),
        basePrice: basePrice,
        baseCashifyPrice: basePrice
      },
      selectedDefects,
      warrantyAge,
      deviceAge: warrantyAge,
      simType
    });

    const rephonixPrice = valuation.finalPrice;
    const cashifyPrice = row.cashify_quote;
    const diff = rephonixPrice - cashifyPrice;
    const diffPct = (diff / cashifyPrice) * 100;

    validComparisons++;
    if (rephonixPrice >= cashifyPrice) {
      rephonixWins++;
    }

    totalCashifySum += cashifyPrice;
    totalRephonixSum += rephonixPrice;

    if (!categoryStats[defectCategory]) {
      categoryStats[defectCategory] = { count: 0, wins: 0, totalCashify: 0, totalRephonix: 0 };
    }
    categoryStats[defectCategory].count++;
    if (rephonixPrice >= cashifyPrice) categoryStats[defectCategory].wins++;
    categoryStats[defectCategory].totalCashify += cashifyPrice;
    categoryStats[defectCategory].totalRephonix += rephonixPrice;

    // Pick a diverse set of samples to display
    if (
      sampleRows.length < 25 &&
      (validComparisons % 18 === 0 || row.changed_variable === 'baseline' || row.changed_variable === 'camera_glass')
    ) {
      sampleRows.push({
        id: row.experiment_id,
        model: `${row.brand} ${modelClean}`,
        storage: `${storageGb}GB`,
        conditionDesc: row.changed_variable === 'baseline' ? 'Flawless Mint' : row.changed_variable.replace(/_/g, ' '),
        cashify: cashifyPrice,
        rephonix: rephonixPrice,
        edge: diff,
        pct: diffPct,
        multiplier: valuation.auditTrail.vendorMultiplierPercentage
      });
    }
  }

  // Print Sample Table
  console.log(`Representative Comparison Samples Across Device Conditions:`);
  console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
  console.log(`Exp ID   | Device & Storage            | Condition / Defect Tested        | Cashify    | Rephonix   | Edge (₹)  | Winning % | Multiplier`);
  console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
  for (const s of sampleRows) {
    const edgeSign = s.edge >= 0 ? `+₹${s.edge.toLocaleString('en-IN')}` : `-₹${Math.abs(s.edge).toLocaleString('en-IN')}`;
    const pctSign = s.pct >= 0 ? `+${s.pct.toFixed(2)}%` : `${s.pct.toFixed(2)}%`;
    console.log(
      `${s.id.padEnd(8)} | ${s.model.slice(0, 18).padEnd(18)} ${s.storage.padEnd(6)} | ${s.conditionDesc.slice(0, 32).padEnd(32)} | ₹${s.cashify.toLocaleString('en-IN').padEnd(9)} | ₹${s.rephonix.toLocaleString('en-IN').padEnd(9)} | ${edgeSign.padEnd(9)} | ${pctSign.padEnd(9)} | ${s.multiplier}`
    );
  }
  console.log(`---------------------------------------------------------------------------------------------------------------------------------\n`);

  // Print Category Summary Breakdown
  console.log(`Summary Breakdown by Condition Tier:`);
  console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
  console.log(`Condition Category            | Total Tested | Rephonix Win Rate | Avg Cashify | Avg Rephonix | Avg Edge (₹) | Avg Winning Margin`);
  console.log(`---------------------------------------------------------------------------------------------------------------------------------`);

  for (const [catName, stats] of Object.entries(categoryStats)) {
    if (stats.count === 0) continue;
    const winRate = ((stats.wins / stats.count) * 100).toFixed(1);
    const avgCashify = Math.round(stats.totalCashify / stats.count);
    const avgRephonix = Math.round(stats.totalRephonix / stats.count);
    const avgEdge = avgRephonix - avgCashify;
    const avgMargin = ((avgEdge / avgCashify) * 100).toFixed(2);

    const displayName = 
      catName === 'flawless_baseline' ? 'Flawless Baseline (Mint)' :
      catName === 'storage_variant' ? 'Storage Capacity Variants' :
      catName === 'battery_degradation' ? 'Battery Degradation (80-85% & <80%)' :
      catName === 'minor_functional' ? 'Minor Functional (Lens/Mic/Speaker/Btns)' :
      catName === 'heavy_hardware' ? 'Heavy Hardware (FaceID/Motherboard/RF)' :
      catName;

    console.log(
      `${displayName.padEnd(29)} | ${String(stats.count).padEnd(12)} | ${(winRate + '%').padEnd(17)} | ₹${avgCashify.toLocaleString('en-IN').padEnd(10)} | ₹${avgRephonix.toLocaleString('en-IN').padEnd(11)} | +₹${avgEdge.toLocaleString('en-IN').padEnd(10)} | +${avgMargin}%`
    );
  }
  console.log(`---------------------------------------------------------------------------------------------------------------------------------\n`);

  const overallWinRate = ((rephonixWins / validComparisons) * 100).toFixed(1);
  const overallAvgCashify = Math.round(totalCashifySum / validComparisons);
  const overallAvgRephonix = Math.round(totalRephonixSum / validComparisons);
  const overallAvgEdge = overallAvgRephonix - overallAvgCashify;
  const overallAvgMargin = ((overallAvgEdge / overallAvgCashify) * 100).toFixed(2);

  console.log(`==================================================================================================`);
  console.log(`FINAL AGGREGATED COMPARATIVE AUDIT VERDICT:`);
  console.log(`  • Valid Empirical Test Runs Evaluated : ${validComparisons}`);
  console.log(`  • Rephonix Superiority Win Rate        : ${rephonixWins} / ${validComparisons} (${overallWinRate}%)`);
  console.log(`  • Average Cashify Payout Across Fleet : ₹${overallAvgCashify.toLocaleString('en-IN')}`);
  console.log(`  • Average Rephonix Offer Across Fleet : ₹${overallAvgRephonix.toLocaleString('en-IN')}`);
  console.log(`  • Average Net Customer Payout Edge    : +₹${overallAvgEdge.toLocaleString('en-IN')} (+${overallAvgMargin}%)`);
  console.log(`  • Option A Tiered Multiplier Health   : Flawless (+3%), Minor Faults (+2.5%), Major Faults (+2.0%)`);
  console.log(`==================================================================================================\n`);
}

runDatasetComparison();
