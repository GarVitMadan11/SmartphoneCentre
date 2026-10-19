import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import prisma from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '../../../');
const DATA_DIR = path.resolve(__dirname, '../../data');
const SESSION_FILE = path.join(DATA_DIR, 'cashify_session.json');
const CUSTOM_URLS_FILE = path.join(DATA_DIR, 'cashify_custom_urls.json');
const AUDIT_RESULTS_FILE = path.join(BASE_DIR, 'scripts/cashify_url_audit_results.json');
const MONITOR_SCRIPT = path.join(BASE_DIR, 'scripts/cashify_price_monitor.py');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface CashifyModelItem {
  id: string;
  name: string;
  brandName: string;
  brandId: string;
  releaseYear: number;
  basePrice128GB: number;
  supportedStorageGb: number[];
  supportedRamGb: number[];
  variantPrices: Record<string, number>;
  cashifyUrl: string;
  isCustomOverride: boolean;
  urlStatus: 'FOUND' | 'MISSING' | 'OVERRIDDEN';
  latestPrice?: {
    cashifyPrice: number;
    rephonixPrice: number;
    difference: number;
    status: 'INCREASED' | 'DECREASED' | 'STABLE';
    changeAmount: number;
    alertDate: string;
  };
}

export interface CashifyVariantItem {
  variantKey: string;
  modelId: string;
  legacyId?: string;
  modelName: string;
  brandName: string;
  brandId: string;
  releaseYear: number;
  ramGb: number;
  storageGb: number;
  ramLabel: string;
  storageLabel: string;
  specLabel: string;
  rephonixPrice: number;
  cashifyPrice: number | null;
  difference: number | null;
  status: 'INCREASED' | 'DECREASED' | 'STABLE' | 'PENDING_SCAN';
  changeAmount: number;
  cashifyUrl: string;
  isCustomOverride: boolean;
  urlStatus: 'FOUND' | 'MISSING' | 'OVERRIDDEN';
  lastAuditedDate?: string;
}

export function getCustomUrls(): Record<string, string> {
  if (fs.existsSync(CUSTOM_URLS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CUSTOM_URLS_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

export function saveCustomUrl(modelIdOrVariantKey: string, url: string): void {
  const current = getCustomUrls();
  current[modelIdOrVariantKey] = url.trim();
  fs.writeFileSync(CUSTOM_URLS_FILE, JSON.stringify(current, null, 2), 'utf-8');
}

export function getAuditResults(): { found: any[]; not_found: any[]; total_models: number; timestamp?: string } {
  if (fs.existsSync(AUDIT_RESULTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(AUDIT_RESULTS_FILE, 'utf-8'));
    } catch {
      return { found: [], not_found: [], total_models: 0 };
    }
  }
  return { found: [], not_found: [], total_models: 0 };
}

export function getSessionStatus(): { hasSession: boolean; cookiesCount: number; lastModified?: string } {
  if (!fs.existsSync(SESSION_FILE)) {
    return { hasSession: false, cookiesCount: 0 };
  }
  try {
    const stat = fs.statSync(SESSION_FILE);
    const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    const cookies = data.cookies || [];
    return {
      hasSession: true,
      cookiesCount: cookies.length,
      lastModified: stat.mtime.toISOString(),
    };
  } catch {
    return { hasSession: false, cookiesCount: 0 };
  }
}

export async function getCashifySummary() {
  const session = getSessionStatus();
  const audit = getAuditResults();
  const customUrls = getCustomUrls();

  const totalActive = await prisma.model.count({ where: { hidden: false } });
  const variants = await getCashifyVariantsList();

  // Count recent alerts
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentAlerts = await (prisma as any).cashifyPriceAlert.findMany({
    where: { alertDate: { gte: oneWeekAgo } },
    orderBy: { alertDate: 'desc' },
    take: 500,
  });

  const increased = recentAlerts.filter((a: any) => a.status === 'INCREASED').length;
  const decreased = recentAlerts.filter((a: any) => a.status === 'DECREASED').length;
  const stable = recentAlerts.filter((a: any) => a.status === 'STABLE').length;

  const verifiedVariants = variants.filter(v => v.urlStatus === 'FOUND' || v.urlStatus === 'OVERRIDDEN').length;
  const missingVariants = variants.filter(v => v.urlStatus === 'MISSING').length;
  const auditedVariants = variants.filter(v => v.cashifyPrice !== null).length;

  return {
    totalModels: totalActive,
    totalVariants: variants.length,
    verifiedUrls: audit.found.length,
    missingUrls: audit.not_found.length,
    verifiedVariants,
    missingVariants,
    auditedVariants,
    customOverrides: Object.keys(customUrls).length,
    lastAuditDate: audit.timestamp || null,
    session,
    priceAlertsStats: {
      increased,
      decreased,
      stable,
      totalAudited: recentAlerts.length,
    },
  };
}

export function getAppleRamGb(modelName: string): number {
  const name = modelName.toLowerCase();
  if (name.includes('17 pro') || name.includes('17 pro max')) return 12;
  if (name.includes('17') || name.includes('16')) return 8;
  if (name.includes('15 pro') || name.includes('15 pro max')) return 8;
  if (name.includes('15') || name.includes('14')) return 6;
  if (name.includes('13 pro') || name.includes('13 pro max')) return 6;
  if (name.includes('13') || name.includes('12') || name.includes('11')) return 4;
  if (name.includes('se')) return 4;
  return 6;
}

export async function getCashifyVariantsList(): Promise<CashifyVariantItem[]> {
  const models = await prisma.model.findMany({
    where: { hidden: false },
    include: { brand: true },
    orderBy: [{ brand: { name: 'asc' } }, { releaseYear: 'desc' }, { name: 'asc' }],
  });

  const customUrls = getCustomUrls();
  const audit = getAuditResults();
  const auditFoundMap = new Map<string, string>();
  for (const item of audit.found) {
    auditFoundMap.set(item.id, item.url);
  }

  // Map of latest alert per (modelId + ramGb + storageGb)
  const latestAlerts = await (prisma as any).cashifyPriceAlert.findMany({
    orderBy: { alertDate: 'desc' },
  });
  const alertMap = new Map<string, any>();
  for (const a of latestAlerts) {
    const key = `${a.modelId}_${a.ramGb}_${a.storageGb}`;
    if (!alertMap.has(key)) {
      alertMap.set(key, a);
    }
    const nameKey = `${a.modelName.toLowerCase().trim()}_${a.ramGb}_${a.storageGb}`;
    if (!alertMap.has(nameKey)) {
      alertMap.set(nameKey, a);
    }
  }

  const variantItems: CashifyVariantItem[] = [];

  for (const m of models) {
    let supportedStorage: number[] = [128, 256, 512];
    try {
      supportedStorage = JSON.parse(m.supportedStorageGb);
    } catch {}

    let supportedRam: number[] = [0];
    try {
      supportedRam = JSON.parse(m.supportedRamGb);
    } catch {}

    let variantPrices: Record<string, number> = {};
    try {
      variantPrices = JSON.parse(m.variantPrices);
    } catch {}

    const matrixPriceKeys = Object.entries(variantPrices).filter(
      ([k, v]) => !k.startsWith('_') && typeof v === 'number' && v > 0
    );
    const hasConfiguredMatrix = matrixPriceKeys.length > 0;

    const activeRams = supportedRam.filter(r => r > 0).length > 0 
      ? supportedRam.filter(r => r > 0) 
      : [0];

    for (const ram of activeRams) {
      for (const storage of supportedStorage) {
        const variantKey = `${m.id}_${ram}_${storage}`;
        const ramStorageKey = `${ram}_${storage}`;

        // If the model has an explicit variant price matrix configured, skip variants that were toggled OFF (N/A)
        if (hasConfiguredMatrix) {
          const isActive =
            (typeof variantPrices[ramStorageKey] === 'number' && variantPrices[ramStorageKey] > 0) ||
            (ram === 0 && typeof variantPrices[String(storage)] === 'number' && variantPrices[String(storage)] > 0) ||
            (ram === 0 && typeof variantPrices[`0_${storage}`] === 'number' && variantPrices[`0_${storage}`] > 0);
          if (!isActive) {
            continue;
          }
        }

        // Rephonix Buyback Price
        let rephonixPrice = m.basePrice128GB;
        if (typeof variantPrices[ramStorageKey] === 'number') {
          rephonixPrice = variantPrices[ramStorageKey];
        } else if (typeof variantPrices[String(storage)] === 'number') {
          rephonixPrice = variantPrices[String(storage)];
        } else if (storage === 128) {
          rephonixPrice = m.basePrice128GB;
        }

        const isApple = m.brand.name.toLowerCase() === 'apple';
        const isGoogle = m.brand.name.toLowerCase() === 'google';
        const effectiveRam = isApple ? getAppleRamGb(m.name) : ram;

        // Labels
        const ramLabel = isApple ? `${effectiveRam} GB` : (ram > 0 ? `${ram} GB` : '—');
        const storageLabel = storage >= 1024 ? `${storage / 1024} TB` : `${storage} GB`;
        const specLabel = `${ramLabel} • ${storageLabel}`;

        // Suffix for exact variant URL
        const storageSuffix = storage >= 1024 ? `${storage / 1024}-tb` : `${storage}-gb`;
        const varSuffix = effectiveRam > 0 ? `-${effectiveRam}-gb-${storageSuffix}` : `-${storageSuffix}`;

        // URL Resolution
        let cashifyUrl = '';
        let isCustomOverride = false;
        let urlStatus: 'FOUND' | 'MISSING' | 'OVERRIDDEN' = 'MISSING';

        const customKeyVariant = `${m.id}_${ram}_${storage}`;
        const customKeyLegacy = `${m.legacyId}_${ram}_${storage}`;
        const customKeyNamed = `${m.name}_${ram}_${storage}`;

        if (customUrls[customKeyVariant]) {
          cashifyUrl = customUrls[customKeyVariant];
          isCustomOverride = true;
          urlStatus = 'OVERRIDDEN';
        } else if (customUrls[customKeyLegacy]) {
          cashifyUrl = customUrls[customKeyLegacy];
          isCustomOverride = true;
          urlStatus = 'OVERRIDDEN';
        } else if (customUrls[customKeyNamed]) {
          cashifyUrl = customUrls[customKeyNamed];
          isCustomOverride = true;
          urlStatus = 'OVERRIDDEN';
        } else if (customUrls[m.id] || customUrls[m.legacyId] || customUrls[m.name]) {
          const baseCustom = customUrls[m.id] || customUrls[m.legacyId] || customUrls[m.name];
          cashifyUrl = baseCustom.includes(varSuffix) ? baseCustom : `${baseCustom}${varSuffix}`;
          isCustomOverride = true;
          urlStatus = 'OVERRIDDEN';
        } else if (auditFoundMap.has(m.id) || auditFoundMap.has(m.legacyId)) {
          let baseAuditUrl = auditFoundMap.get(m.id) || auditFoundMap.get(m.legacyId)!;
          if (isGoogle && baseAuditUrl.endsWith('-5g')) {
            baseAuditUrl = baseAuditUrl.slice(0, -3);
          }
          cashifyUrl = baseAuditUrl.includes(varSuffix) ? baseAuditUrl : `${baseAuditUrl}${varSuffix}`;
          urlStatus = 'FOUND';
        }

        // Cashify Alert Price
        const modelCleanName = m.name.toLowerCase().trim();
        const alertRecord =
          alertMap.get(`${m.id}_${ram}_${storage}`) ||
          alertMap.get(`${m.legacyId}_${ram}_${storage}`) ||
          alertMap.get(`${modelCleanName}_${ram}_${storage}`) ||
          (!isApple
            ? alertMap.get(`${m.id}_0_${storage}`) ||
              alertMap.get(`${m.legacyId}_0_${storage}`) ||
              alertMap.get(`${modelCleanName}_0_${storage}`)
            : undefined);
        let cashifyPrice: number | null = null;
        let diff: number | null = null;
        let status: 'INCREASED' | 'DECREASED' | 'STABLE' | 'PENDING_SCAN' = 'PENDING_SCAN';
        let changeAmount = 0;
        let lastAuditedDate: string | undefined = undefined;

        if (alertRecord) {
          cashifyPrice = alertRecord.cashifyPrice;
          diff = rephonixPrice - (cashifyPrice ?? 0);
          status = alertRecord.status as any;
          changeAmount = alertRecord.changeAmount;
          lastAuditedDate = alertRecord.alertDate.toISOString();
        }

        variantItems.push({
          variantKey,
          modelId: m.id,
          legacyId: m.legacyId,
          modelName: m.name,
          brandName: m.brand.name,
          brandId: m.brandId,
          releaseYear: m.releaseYear,
          ramGb: ram,
          storageGb: storage,
          ramLabel,
          storageLabel,
          specLabel,
          rephonixPrice,
          cashifyPrice,
          difference: diff,
          status,
          changeAmount,
          cashifyUrl,
          isCustomOverride,
          urlStatus,
          lastAuditedDate,
        });
      }
    }
  }

  return variantItems;
}

export async function getCashifyModelsList(): Promise<CashifyModelItem[]> {
  const models = await prisma.model.findMany({
    where: { hidden: false },
    include: { brand: true },
    orderBy: [{ brand: { name: 'asc' } }, { releaseYear: 'desc' }, { name: 'asc' }],
  });

  const customUrls = getCustomUrls();
  const audit = getAuditResults();
  const auditFoundMap = new Map<string, string>();
  for (const item of audit.found) {
    auditFoundMap.set(item.id, item.url);
  }

  const latestAlerts = await (prisma as any).cashifyPriceAlert.findMany({
    orderBy: { alertDate: 'desc' },
    distinct: ['modelId'],
  });
  const alertMap = new Map<string, any>();
  for (const a of latestAlerts) {
    alertMap.set(a.modelId, a);
  }

  return models.map(m => {
    let supportedStorage: number[] = [128, 256, 512];
    try {
      supportedStorage = JSON.parse(m.supportedStorageGb);
    } catch { }

    let supportedRam: number[] = [0];
    try {
      supportedRam = JSON.parse(m.supportedRamGb);
    } catch { }

    let variantPrices: Record<string, number> = {};
    try {
      variantPrices = JSON.parse(m.variantPrices);
    } catch { }

    let cashifyUrl = '';
    let isCustomOverride = false;
    let urlStatus: 'FOUND' | 'MISSING' | 'OVERRIDDEN' = 'MISSING';

    if (customUrls[m.id] || customUrls[m.name]) {
      cashifyUrl = customUrls[m.id] || customUrls[m.name];
      isCustomOverride = true;
      urlStatus = 'OVERRIDDEN';
    } else if (auditFoundMap.has(m.id)) {
      cashifyUrl = auditFoundMap.get(m.id)!;
      urlStatus = 'FOUND';
    }

    const latest = alertMap.get(m.id);

    return {
      id: m.id,
      name: m.name,
      brandName: m.brand.name,
      brandId: m.brandId,
      releaseYear: m.releaseYear,
      basePrice128GB: m.basePrice128GB,
      supportedStorageGb: supportedStorage,
      supportedRamGb: supportedRam,
      variantPrices,
      cashifyUrl,
      isCustomOverride,
      urlStatus,
      latestPrice: latest
        ? {
            cashifyPrice: latest.cashifyPrice,
            rephonixPrice: latest.rephonixPrice,
            difference: latest.difference,
            status: latest.status,
            changeAmount: latest.changeAmount,
            alertDate: latest.alertDate.toISOString(),
          }
        : undefined,
    };
  });
}

let activeScanProcess: any = null;

export function triggerPriceScan(limit: number = 0, headless: boolean = true) {
  if (activeScanProcess) {
    return { success: false, message: 'A price scan is already running in the background.' };
  }

  const args = [MONITOR_SCRIPT];
  if (limit > 0) args.push('--limit', String(limit));
  if (!headless) args.push('--visible');

  const py = spawn('python', args, {
    cwd: BASE_DIR,
    detached: true,
    stdio: 'ignore',
  });

  activeScanProcess = py;
  py.on('close', () => {
    activeScanProcess = null;
  });

  return { success: true, message: `Price scan initiated in background (limit: ${limit || 'all'}).` };
}

export function isScanRunning(): boolean {
  return activeScanProcess !== null;
}
