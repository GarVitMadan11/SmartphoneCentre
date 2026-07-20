// ─────────────────────────────────────────────────────────────
// API Client — communicates with the Express backend
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).error || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Brands ──────────────────────────────────────────────────

export interface ApiBrand {
  id: string;
  name: string;
  logo: string;
}

export function fetchBrands(): Promise<ApiBrand[]> {
  return apiFetch<ApiBrand[]>('/brands');
}

// ── Models ──────────────────────────────────────────────────

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
  return apiFetch<ApiModel>('/models', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteModel(legacyId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/models/${encodeURIComponent(legacyId)}`, { method: 'DELETE' });
}

// ── Bookings ────────────────────────────────────────────────

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

export function fetchBookings(): Promise<ApiBooking[]> {
  return apiFetch<ApiBooking[]>('/bookings');
}

export function createBooking(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>('/bookings', { method: 'POST', body: JSON.stringify(data) });
}

export function updateBooking(
  id: string,
  updates: Partial<Pick<ApiBooking, 'inspectionStatus' | 'payoutStatus' | 'verificationStatus'>>
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
