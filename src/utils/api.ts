// ─────────────────────────────────────────────────────────────
// API Client — communicates with the Express backend
// Supports HttpOnly cookie authentication and server quotes
// ─────────────────────────────────────────────────────────────

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local development: always use the relative /api path so requests go through
    // the Vite proxy (vite.config.ts → server.proxy → http://localhost:4000).
    // Using an absolute URL like http://localhost:4000/api bypasses the proxy and
    // triggers cross-origin CSP violations.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api';
    }
  }
  // Production (Render, etc.): Express serves BOTH the frontend AND /api/* from
  // the SAME origin. Always use a relative URL so the browser sends the request
  // to the correct Express server — never depend on VITE_API_URL in production.
  return '/api';
}

function csrfToken(path?: string, withAuth?: boolean): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const cookies = document.cookie.split('; ');
  const adminToken = cookies.find(cookie => cookie.startsWith('rex_admin_csrf='))?.split('=').slice(1).join('=');
  const customerToken = cookies.find(cookie => cookie.startsWith('rex_csrf='))?.split('=').slice(1).join('=');

  const isAdminPath = Boolean(
    withAuth ||
    (path && (
      path.startsWith('/admin') ||
      (hasAdminToken() && (
        path.startsWith('/models') ||
        path.startsWith('/bookings') ||
        path.startsWith('/analytics') ||
        path.startsWith('/support')
      ))
    ))
  );

  if (isAdminPath) {
    return adminToken || customerToken;
  }

  return customerToken || adminToken;
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

let inMemoryAdminActive = false;

export function hasAdminToken(): boolean {
  if (typeof document !== 'undefined') {
    return document.cookie.includes('rex_admin_csrf=') || inMemoryAdminActive;
  }
  return inMemoryAdminActive;
}

function getStoredAdminToken(): string | null {
  return null;
}

async function apiFetch<T>(path: string, options?: RequestInit, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const storedToken = getStoredAdminToken();
  if (storedToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  if (options?.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    const token = csrfToken(path, withAuth);
    if (token) headers['X-CSRF-Token'] = token;
  }

  // Authentication is carried by session cookie or Bearer token header

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Automatically send and receive HttpOnly cookies
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let message = res.statusText;
    let fields: string[] | undefined;
    if (isJson) {
      const body: ApiError = await res.json().catch(() => ({ error: `HTTP ${res.status}`, message: res.statusText }));
      message = body.message ?? body.error;
      fields = body.fields;
    } else {
      const text = await res.text();
      const cleanSnippet = text.slice(0, 120).replace(/<[^>]*>/g, '').trim();
      message = `Server error (${res.status}): ${cleanSnippet || res.statusText}`;
    }
    throw new ApiRequestError(res.status, message, fields);
  }

  if (!isJson) {
    const text = await res.text();
    const cleanSnippet = text.slice(0, 120).replace(/<[^>]*>/g, '').trim();
    throw new ApiRequestError(res.status, `Server returned non-JSON response (${res.status}): ${cleanSnippet || 'HTML page'}`);
  }

  return res.json() as Promise<T>;
}

// ── Admin Authentication & Granular Access Control ─────────────────────────

export interface AdminUserSession {
  id: string;
  username: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin';
  permissions?: string[];
}

export interface AdminStaffUser {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin';
  permissions: string[];
  active: boolean;
  failedLoginAttempts: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function adminLogin(credentials: {
  pin?: string;
  email?: string;
  username?: string;
  identifier?: string;
  password?: string;
}): Promise<{ success: boolean; expiresAt: number; user?: AdminUserSession }> {
  const data = await apiFetch<{ success: boolean; expiresAt: number; user?: AdminUserSession }>(
    '/admin/auth',
    { method: 'POST', body: JSON.stringify(credentials) }
  );
  inMemoryAdminActive = true;
  return { success: true, expiresAt: data.expiresAt, user: data.user };
}

export async function adminLogout(): Promise<void> {
  inMemoryAdminActive = false;
  try {
    await apiFetch<{ success: boolean }>('/admin/logout', { method: 'POST' });
  } catch { /* ignore network errors during logout */ }
}

export function changeAdminPassword(passwords: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(passwords),
  }, true);
}

export async function getCurrentAdminUser(): Promise<AdminUserSession | null> {
  try {
    const data = await apiFetch<any>('/admin/me', undefined, true);
    if (!data) return null;
    if (data.authenticated === false) return null;
    if (data.user && data.user.id) return data.user as AdminUserSession;
    if (data.id && data.role) return data as AdminUserSession;
    return null;
  } catch {
    return null;
  }
}

export async function fetchAdminStaff(): Promise<AdminStaffUser[]> {
  return apiFetch<AdminStaffUser[]>('/admin/staff', undefined, true);
}

export async function createAdminStaff(data: {
  username: string;
  email: string;
  password: string;
  role?: string;
  permissions: string[];
}): Promise<AdminStaffUser> {
  return apiFetch<AdminStaffUser>('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateAdminStaff(id: string, updates: {
  role?: string;
  permissions?: string[];
  active?: boolean;
  password?: string;
}): Promise<AdminStaffUser> {
  return apiFetch<AdminStaffUser>(`/admin/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }, true);
}

export async function deleteAdminStaff(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/admin/staff/${id}`, {
    method: 'DELETE',
  }, true);
}

export interface AdminSecurityStatus {
  isLockedDown: boolean;
  reason?: string;
  lockedAt?: string | null;
}

export async function fetchAdminSecurityStatus(): Promise<AdminSecurityStatus> {
  try {
    return await apiFetch<AdminSecurityStatus>('/admin/security-status');
  } catch {
    return { isLockedDown: false };
  }
}

export async function triggerAdminLockdown(reason?: string): Promise<{ success: boolean; masterUnlockKey: string }> {
  return apiFetch<{ success: boolean; masterUnlockKey: string }>('/admin/lockdown', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }, true);
}

export async function unlockAdminPanel(masterKey: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/admin/unlock', {
    method: 'POST',
    body: JSON.stringify({ masterKey }),
  });
}

// ── Brands & Models ───────────────────────────────────────────────────────

export interface ApiBrand {
  id: string;
  name: string;
  logo: string;
}

export async function fetchBrands(): Promise<ApiBrand[]> {
  try {
    return await apiFetch<ApiBrand[]>(`/brands?_t=${Date.now()}`);
  } catch (err) {
    console.info('[API] fetchBrands unavailable, fallback to static brands');
    return [];
  }
}

export interface ApiModel {
  id: string;
  brandId: string;
  name: string;
  category: string;
  releaseYear: number;
  basePrice128GB: number;
  series: string;
  imageUrl?: string;
  supportedStorageGb?: number[];
  supportedRamGb?: number[];              // [0] = Apple-style (no RAM variants)
  variantPrices?: Record<string, number>; // { "ramGb_storageGb": priceINR }
  hidden?: boolean;
}

const MODEL_CACHE_KEY = 'stc_cached_models_v2';

export function getCachedModels(): ApiModel[] {
  try {
    const raw = localStorage.getItem(MODEL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function saveCachedModels(models: ApiModel[]): void {
  try {
    if (Array.isArray(models) && models.length > 0) {
      localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(models));
    }
  } catch {}
}

export async function fetchModels(brandId?: string, deviceType?: string, includeHidden?: boolean): Promise<ApiModel[]> {
  const params = new URLSearchParams();
  if (brandId) params.set('brandId', brandId);
  if (deviceType) params.set('deviceType', deviceType);
  if (includeHidden) params.set('includeHidden', 'true');
  params.set('_t', String(Date.now()));
  const qs = params.toString();
  try {
    const data = await apiFetch<ApiModel[]>(`/models?${qs}`);
    if (!brandId && !deviceType && !includeHidden && Array.isArray(data) && data.length > 0) {
      saveCachedModels(data);
    }
    return data;
  } catch (err) {
    const cached = getCachedModels();
    if (cached.length > 0) {
      if (deviceType) return cached.filter(m => (m as any).deviceType === deviceType);
      return cached;
    }
    console.info('[API] fetchModels rate limited / unavailable, fallback to local models');
    return [];
  }
}

export async function createModel(data: {
  legacyId: string;
  brandId: string;
  name: string;
  category: string;
  deviceType?: string;
  releaseYear: number;
  basePrice128GB: number;
  series?: string;
  imageUrl?: string;
  supportedStorageGb?: number[];
  supportedRamGb?: number[];
  variantPrices?: Record<string, number>;
  hidden?: boolean;
  supportsWarrantyQuestion?: boolean;
}): Promise<ApiModel> {
  const res = await apiFetch<ApiModel>('/models', { method: 'POST', body: JSON.stringify(data) }, true);
  try {
    const cached = getCachedModels();
    const filtered = cached.filter(m => m.id !== res.id && (m as any).legacyId !== res.id);
    saveCachedModels([res, ...filtered]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    }
  } catch {}
  return res;
}

export async function updateModel(legacyId: string, data: Partial<Omit<ApiModel, 'id' | 'brandId'>>): Promise<ApiModel> {
  const res = await apiFetch<ApiModel>(`/models/${encodeURIComponent(legacyId)}`, { method: 'PATCH', body: JSON.stringify(data) }, true);
  try {
    const cached = getCachedModels();
    if (cached.length > 0) {
      const idx = cached.findIndex(m => m.id === legacyId || (m as any).legacyId === legacyId);
      if (idx !== -1) {
        cached[idx] = { ...cached[idx], ...data, ...res };
        saveCachedModels(cached);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    }
  } catch {}
  return res;
}

export async function bulkUpdateModels(updates: Array<{ id: string; changes: Partial<Omit<ApiModel, 'id' | 'brandId'>> }>): Promise<{ updatedCount: number }> {
  const res = await apiFetch<{ updatedCount: number }>('/models/bulk-update', { method: 'POST', body: JSON.stringify({ updates }) }, true);
  try {
    const cached = getCachedModels();
    if (cached.length > 0) {
      const updateMap = new Map(updates.map(u => [u.id, u.changes]));
      const updatedList = cached.map(m => {
        const ch = updateMap.get(m.id) || updateMap.get((m as any).legacyId);
        return ch ? { ...m, ...ch } : m;
      });
      saveCachedModels(updatedList);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    }
  } catch {}
  return res;
}

export async function deleteModel(legacyId: string): Promise<{ success: boolean }> {
  const res = await apiFetch<{ success: boolean }>(`/models/${encodeURIComponent(legacyId)}`, { method: 'DELETE' }, true);
  try {
    const cached = getCachedModels();
    saveCachedModels(cached.filter(m => m.id !== legacyId && (m as any).legacyId !== legacyId));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    }
  } catch {}
  return res;
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
  storageGb: number;
  color: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  imei: string;
  address: string;
  pickupDate: string;
  pickupTimeSlot: string;
  finalPrice: number;
  status?: string;
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
  imei?: string;
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

export function fetchMyBookings(): Promise<ApiBooking[]> {
  return apiFetch<ApiBooking[]>('/bookings/my').catch(() => []);
}

export function createBooking(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>('/bookings', { method: 'POST', body: JSON.stringify(data) });
}

export async function downloadBookingPdf(bookingId: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/pdf`;
  try {
    const adminToken = getStoredAdminToken();
    const headers: Record<string, string> = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
    const res = await fetch(url, {
      mode: 'cors',
      credentials: 'include',
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Quotation-${bookingId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.warn('Blob PDF download failed, falling back to new window:', err);
    window.open(url, '_blank');
  }
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

// ── Customer Authentication API Helpers ─────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  picture: string | null;
  emailVerified: boolean;
  hasGoogleLinked: boolean;
  hasPassword: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export function checkEmail(email: string): Promise<{ exists: boolean }> {
  return apiFetch<{ exists: boolean }>('/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function checkPhone(phone: string): Promise<{ exists: boolean }> {
  return apiFetch<{ exists: boolean }>('/auth/check-phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function customerLogin(emailOrPhone: string, password: string): Promise<{ user: ApiUser; csrfToken: string }> {
  return apiFetch<{ user: ApiUser; csrfToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, password }),
  });
}

export function customerSignup(name: string, email: string, phone: string, password: string): Promise<{ status: string; phone: string; otp?: string }> {
  return apiFetch<{ status: string; phone: string; otp?: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export function verifyOtp(data: Record<string, unknown>): Promise<{ user: ApiUser; csrfToken: string }> {
  return apiFetch<{ user: ApiUser; csrfToken: string }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function customerLogout(): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function fetchCurrentUser(): Promise<{ user: ApiUser | null }> {
  try {
    return await apiFetch<{ user: ApiUser | null }>('/auth/me');
  } catch {
    return { user: null };
  }
}

export function updateCustomerProfile(name: string, phone: string): Promise<{ user: ApiUser }> {
  return apiFetch<{ user: ApiUser }>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name, phone }),
  });
}

// ── New Authentication API Helpers ───────────────────────────────────────────

export function fetchAuthConfig(): Promise<{ googleClientId: string }> {
  return apiFetch<{ googleClientId: string }>('/auth/config').catch(() => ({ googleClientId: '' }));
}

/** Register with email + password (sends verification email, does not log in) */
export function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<{ status: string; message: string }> {
  return apiFetch<{ status: string; message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

/** Sync authenticated Firebase user with backend */
export async function syncFirebaseUser(idToken: string): Promise<{
  success: boolean;
  user: ApiUser;
  csrfToken: string;
} | null> {
  try {
    return await apiFetch<{
      success: boolean;
      user: ApiUser;
      csrfToken: string;
    }>('/auth/sync-firebase-user', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  } catch (err) {
    console.info('[Auth] syncFirebaseUser rate limited / unavailable');
    return null;
  }
}

/** Sign in or sign up with a Google ID token (Legacy Fallback) */
export function googleAuth(credential: string): Promise<{
  user: ApiUser;
  csrfToken: string;
  isNewUser?: boolean;
  requiresLinking?: boolean;
  email?: string;
}> {
  return apiFetch<{
    user: ApiUser;
    csrfToken: string;
    isNewUser?: boolean;
    requiresLinking?: boolean;
    email?: string;
  }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

/** Verify email address using the token from the verification email */
export function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

/** Resend verification email */
export function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Request a password reset email (always returns 200, no email enumeration) */
export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Reset password with the token from the reset email */
export function resetPassword(
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/** Link a Google account to the currently authenticated user's account */
export function linkGoogleAccount(credential: string): Promise<{ success: boolean; user: ApiUser }> {
  return apiFetch<{ success: boolean; user: ApiUser }>('/auth/link-google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

/** Unlink Google from the currently authenticated user's account */
export function unlinkGoogleAccount(): Promise<{ success: boolean; user: ApiUser }> {
  return apiFetch<{ success: boolean; user: ApiUser }>('/auth/unlink-google', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function sendEmailOtp(email: string): Promise<{ success: boolean; email: string; otp: string }> {
  return apiFetch<{ success: boolean; email: string; otp: string }>('/auth/send-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; user: ApiUser }> {
  return apiFetch<{ success: boolean; user: ApiUser }>('/auth/verify-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export function requestPasswordResetOtp(email: string): Promise<{ success: boolean; email: string; otp: string }> {
  return apiFetch<{ success: boolean; email: string; otp: string }>('/auth/forgot-password-request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/auth/forgot-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
}

export interface AuditLogItem {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export function fetchAuditLogs(search?: string, limit = 100): Promise<AuditLogItem[]> {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  query.append('limit', String(limit));

  return apiFetch<AuditLogItem[]>(`/admin/audit-logs?${query.toString()}`, undefined, true);
}

/** Submit Pilot Program Feedback (sends email directly to support@rephonix.in) */
export function submitPilotFeedback(payload: {
  name: string;
  email: string;
  category: string;
  feedback: string;
}): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/support/pilot-feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface QuoteAlertPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  modelName: string;
  storageGb: number;
  estimatedPayout: number;
  retentionPercentage: number;
  defects: string[];
  refCode?: string;
}

/** Send diagnostic quote alert email to admin when a logged-in user generates a quote */
export function sendQuoteAlertApi(payload: QuoteAlertPayload): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/quotes/alert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface PriceMatchAlertPayload {
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  modelName: string;
  storageGb: number;
  currentQuote: number;
  expectedPrice: number | string;
  comments?: string;
  refCode?: string;
}

/** Send Price Match / Custom Quote Request email to admin */
export function sendPriceMatchAlertApi(payload: PriceMatchAlertPayload): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/quotes/price-match', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface StepLeadAlertPayload {
  modelName: string;
  brandName?: string | null;
  storageGb: number;
  ramGb?: number | null;
  basePrice?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  deviceType?: string | null;
  sourceUrl?: string | null;
}

/** Send immediate Step 2 lead alert email to admin */
export function sendStepLeadAlertApi(payload: StepLeadAlertPayload): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/quotes/step-lead', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


// ── Cashify Price Monitor Admin APIs ──────────────────────────────────────────

export interface CashifySummaryData {
  totalModels: number;
  totalVariants?: number;
  verifiedUrls: number;
  missingUrls: number;
  verifiedVariants?: number;
  missingVariants?: number;
  auditedVariants?: number;
  customOverrides: number;
  lastAuditDate: string | null;
  isScanRunning?: boolean;
  session: {
    hasSession: boolean;
    cookiesCount: number;
    lastModified?: string;
  };
  priceAlertsStats: {
    increased: number;
    decreased: number;
    stable: number;
    totalAudited: number;
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

export interface CashifyPriceAlertItem {
  id: string;
  modelId: string;
  modelName: string;
  brandName: string;
  ramGb: number;
  storageGb: number;
  rephonixPrice: number;
  cashifyPrice: number;
  difference: number;
  status: 'INCREASED' | 'DECREASED' | 'STABLE';
  changeAmount: number;
  alertDate: string;
  reviewed: boolean;
}

export function fetchCashifySummary(): Promise<CashifySummaryData> {
  return apiFetch<CashifySummaryData>('/admin/cashify/summary', {}, true);
}

export function fetchCashifyVariants(): Promise<CashifyVariantItem[]> {
  return apiFetch<CashifyVariantItem[]>('/admin/cashify/variants', {}, true);
}

export function fetchCashifyModels(): Promise<CashifyModelItem[]> {
  return apiFetch<CashifyModelItem[]>('/admin/cashify/models', {}, true);
}

export function fetchCashifyPriceAlerts(): Promise<CashifyPriceAlertItem[]> {
  return apiFetch<CashifyPriceAlertItem[]>('/admin/price-alerts', {}, true);
}

export function saveCashifyCustomUrl(
  keyOrModelId: string,
  customUrl: string,
  extractedPrice?: number | null,
  rephonixPrice?: number | null
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/admin/cashify/custom-url', {
    method: 'POST',
    body: JSON.stringify({ key: keyOrModelId, modelId: keyOrModelId, customUrl, extractedPrice, rephonixPrice }),
  }, true);
}

export interface RegisterApprovedCashifyVariantsPayload {
  modelId?: string;
  legacyId?: string;
  modelName: string;
  brandName?: string;
  variants: Array<{
    ramGb: number;
    storageGb: number;
    url: string;
    extractedPrice?: number | null;
    rephonixPrice?: number | null;
  }>;
}

export function registerApprovedCashifyVariants(
  payload: RegisterApprovedCashifyVariantsPayload
): Promise<{ success: boolean; registeredCount: number; extractedCount: number; message: string }> {
  return apiFetch<{ success: boolean; registeredCount: number; extractedCount: number; message: string }>(
    '/admin/cashify/register-approved-variants',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
}

export function testCashifyUrlApi(url: string): Promise<{
  url: string;
  status: number;
  ok: boolean;
  extractedPrice?: number | null;
  error?: string;
  is404?: boolean;
  isUnserviceable?: boolean;
}> {
  return apiFetch<{
    url: string;
    status: number;
    ok: boolean;
    extractedPrice?: number | null;
    error?: string;
    is404?: boolean;
    isUnserviceable?: boolean;
  }>('/admin/cashify/test-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  }, true);
}

export function triggerCashifyScan(limit: number = 0): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/admin/cashify/trigger-scan', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  }, true);
}

export function fetchCashifyScanStatus(): Promise<{ isRunning: boolean }> {
  return apiFetch<{ isRunning: boolean }>('/admin/cashify/scan-status', {}, true);
}




