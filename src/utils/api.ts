// ─────────────────────────────────────────────────────────────
// API Client — communicates with the Express backend
// Supports HttpOnly cookie authentication and server quotes
// ─────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

function csrfToken(): string | undefined {
  return document.cookie.split('; ').find(cookie => cookie.startsWith('rex_admin_csrf='))?.split('=').slice(1).join('=');
}

interface ApiError {
  error: string;
  message: string;
  fields?: string[];
}

export class ApiRequestError extends Error {
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

  if (options?.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    const token = csrfToken();
    if (token) headers['X-CSRF-Token'] = token;
  }

  // Authentication is carried only by the HttpOnly session cookie.
  void withAuth;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Automatically send and receive HttpOnly cookies
  });

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: `HTTP ${res.status}`, message: res.statusText }));
    throw new ApiRequestError(res.status, body.message ?? body.error, body.fields);
  }

  return res.json() as Promise<T>;
}

// ── Admin Authentication ──────────────────────────────────────────────────

export interface AdminUserSession {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin';
}

export async function adminLogin(credentials: { pin?: string; username?: string; password?: string }): Promise<{ success: boolean; expiresAt: number; user?: AdminUserSession }> {
  const data = await apiFetch<{ expiresAt: number; user?: AdminUserSession }>(
    '/admin/auth',
    { method: 'POST', body: JSON.stringify(credentials) }
  );
  return { success: true, expiresAt: data.expiresAt, user: data.user };
}

export async function adminLogout(): Promise<void> {
  try {
    await apiFetch<{ success: boolean }>('/admin/logout', { method: 'POST' });
  } catch { /* ignore */ }
}

export function getCurrentAdminUser(): Promise<AdminUserSession> {
  return apiFetch<AdminUserSession>('/admin/me', undefined, true);
}

// ── Brands & Models ───────────────────────────────────────────────────────

export interface ApiBrand {
  id: string;
  name: string;
  logo: string;
}

export function fetchBrands(): Promise<ApiBrand[]> {
  return apiFetch<ApiBrand[]>('/brands');
}

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

// ── Quotes & Valuations ───────────────────────────────────────────────────

export interface ApiQuote {
  quoteId: string;
  modelId: string;
  modelName: string;
  storageGb: number;
  maxPrice: number;
  calculatedPrice: number;
  version: string;
  expiresAt: string;
  signature: string;
}

export function requestServerQuote(modelId: string, storageGb: number, defectIds: string[]): Promise<ApiQuote> {
  return apiFetch<ApiQuote>('/quotes', {
    method: 'POST',
    body: JSON.stringify({ modelId, storageGb, defectIds }),
  });
}

// ── Bookings & Order Tracking ──────────────────────────────────────────────

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
  isVerifiedProvider?: boolean;
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

export interface ApiTrackBooking {
  id: string;
  modelName: string;
  storageGb: number;
  color: string;
  customerName: string;
  pickupDate: string;
  pickupTimeSlot: string;
  finalPayoutAmount: number;
  inspectionStatus: 'pending' | 'approved' | 'rejected';
  payoutStatus: 'pending' | 'completed';
  verificationStatus: 'pending' | 'verified' | 'failed';
  dateCreated: string;
  events: Array<{ eventType: string; note: string; createdAt: string }>;
}

export function trackBookingOrder(bookingId: string, phone: string): Promise<ApiTrackBooking> {
  return apiFetch<ApiTrackBooking>('/bookings/track', {
    method: 'POST',
    body: JSON.stringify({ bookingId, phone }),
  });
}

export function fetchBookings(): Promise<ApiBooking[]> {
  return apiFetch<ApiBooking[]>('/bookings', undefined, true);
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
  }, true);
}
