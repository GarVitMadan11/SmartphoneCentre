// ─────────────────────────────────────────────────────────────
// API Client — communicates with the Express backend
// Includes automatic Bearer token injection for admin routes.
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api';

// ── Admin Token Management ────────────────────────────────────────────────
// Token is stored in sessionStorage so it's cleared when the tab closes.
// Key names are intentionally non-descriptive to reduce info leakage.

const TOKEN_KEY = '_rex_at';
const EXPIRY_KEY = '_rex_ate';

export const adminToken = {
  get(): string | null {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const expiry = parseInt(sessionStorage.getItem(EXPIRY_KEY) ?? '0', 10);
      if (!token || !expiry) return null;
      if (Date.now() >= expiry) {
        adminToken.clear();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },
  set(token: string, expiresAt: number): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(EXPIRY_KEY, String(expiresAt));
    } catch { /* ignore */ }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
    } catch { /* ignore */ }
  },
  isValid(): boolean {
    return adminToken.get() !== null;
  },
};

// ── Core fetch wrapper ───────────────────────────────────────────────────

interface ApiError {
  error: string;
  message: string;
  fields?: string[];
}

class ApiRequestError extends Error {
  status: number;
  fields?: string[];
  constructor(status: number, message: string, fields?: string[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fields = fields;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };

  if (withAuth) {
    const token = adminToken.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: `HTTP ${res.status}`, message: res.statusText }));
    throw new ApiRequestError(res.status, body.message ?? body.error, body.fields);
  }

  return res.json() as Promise<T>;
}

// ── Admin Authentication ──────────────────────────────────────────────────

/**
 * Sends the PIN to the server, stores the returned JWT if valid.
 * Returns { success: true } or throws ApiRequestError.
 */
export async function adminLogin(pin: string): Promise<{ success: boolean }> {
  const data = await apiFetch<{ token: string; expiresAt: number }>(
    '/admin/auth',
    { method: 'POST', body: JSON.stringify({ pin }) }
  );
  adminToken.set(data.token, data.expiresAt);
  return { success: true };
}

export function adminLogout(): void {
  adminToken.clear();
}

// ── Brands ────────────────────────────────────────────────────────────────

export interface ApiBrand {
  id: string;
  name: string;
  logo: string;
}

export function fetchBrands(): Promise<ApiBrand[]> {
  return apiFetch<ApiBrand[]>('/brands');
}

// ── Models ───────────────────────────────────────────────────────────────

export interface ApiModel {
  id: string;
  brandId: string;
  name: string;
  modelNumber: string;
  category: string;
  releaseYear: number;
  basePrice128GB: number;
  series: string;
  imageUrl?: string;
}

export function fetchModels(brandId?: string): Promise<ApiModel[]> {
  const qs = brandId ? `?brandId=${encodeURIComponent(brandId)}` : '';
  return apiFetch<ApiModel[]>(`/models${qs}`);
}

export function createModel(data: {
  legacyId: string;
  brandId: string;
  name: string;
  modelNumber: string;
  category: string;
  releaseYear: number;
  basePrice128GB: number;
  series?: string;
  imageUrl?: string;
}): Promise<ApiModel> {
  return apiFetch<ApiModel>('/models', { method: 'POST', body: JSON.stringify(data) }, true);
}

export function updateModel(legacyId: string, data: Partial<Omit<ApiModel, 'id' | 'brandId'>>): Promise<ApiModel> {
  return apiFetch<ApiModel>(`/models/${encodeURIComponent(legacyId)}`, { method: 'PATCH', body: JSON.stringify(data) }, true);
}

export function deleteModel(legacyId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/models/${encodeURIComponent(legacyId)}`, { method: 'DELETE' }, true);
}

// ── Bookings ──────────────────────────────────────────────────────────────

export interface ApiBooking {
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
  payoutDetails?: Record<string, string>;
  inspectionStatus: 'pending' | 'approved' | 'rejected';
  payoutStatus: 'pending' | 'completed';
  dateCreated: string;
}

// Admin-only: requires Bearer token
export function fetchBookings(): Promise<ApiBooking[]> {
  return apiFetch<ApiBooking[]>('/bookings', undefined, true);
}

// Public: no auth required (but rate-limited on the server)
export function createBooking(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>('/bookings', { method: 'POST', body: JSON.stringify(data) });
}

// Admin-only: requires Bearer token
export function updateBooking(
  id: string,
  updates: Partial<Pick<ApiBooking, 'inspectionStatus' | 'payoutStatus' | 'verificationStatus'>>
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }, true);
}
