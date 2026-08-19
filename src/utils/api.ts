// ─────────────────────────────────────────────────────────────
// API Client — communicates with the Express backend
// Supports HttpOnly cookie authentication and server quotes
// ─────────────────────────────────────────────────────────────

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local development only: frontend runs on 3000/5173, backend runs on 4000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Allow explicit override via env var for local dev only
      const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '');
      if (envUrl && !envUrl.includes(hostname === 'localhost' ? 'onrender.com' : '')) return envUrl;
      const port = window.location.port;
      if (port && port !== '4000') {
        return `${window.location.protocol}//${hostname}:4000/api`;
      }
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
    hasAdminToken() ||
    (path && (
      path.startsWith('/admin') ||
      path.startsWith('/models') ||
      path.startsWith('/bookings') ||
      path.startsWith('/analytics') ||
      path.startsWith('/support')
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

export function hasAdminToken(): boolean {
  try {
    return Boolean(sessionStorage.getItem('rex_admin_token'));
  } catch {
    return false;
  }
}

function getStoredAdminToken(): string | null {
  try {
    return sessionStorage.getItem('rex_admin_token');
  } catch {
    return null;
  }
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
  void withAuth;

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

// ── Admin Authentication ──────────────────────────────────────────────────

export interface AdminUserSession {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR' | 'admin';
}

export async function adminLogin(credentials: { pin?: string; username?: string; password?: string }): Promise<{ success: boolean; expiresAt: number; user?: AdminUserSession }> {
  const data = await apiFetch<{ token?: string; expiresAt: number; user?: AdminUserSession }>(
    '/admin/auth',
    { method: 'POST', body: JSON.stringify(credentials) }
  );
  if (data.token) {
    try {
      sessionStorage.setItem('rex_admin_token', data.token);
    } catch { /* ignore storage error */ }
  }
  return { success: true, expiresAt: data.expiresAt, user: data.user };
}

export async function adminLogout(): Promise<void> {
  try {
    sessionStorage.removeItem('rex_admin_token');
  } catch { /* ignore */ }
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
  return apiFetch<ApiBrand[]>(`/brands?_t=${Date.now()}`);
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
}

export function fetchModels(brandId?: string): Promise<ApiModel[]> {
  const qs = brandId ? `brandId=${encodeURIComponent(brandId)}&` : '';
  return apiFetch<ApiModel[]>(`/models?${qs}_t=${Date.now()}`);
}

export function createModel(data: {
  legacyId: string;
  brandId: string;
  name: string;
  category: string;
  releaseYear: number;
  basePrice128GB: number;
  series?: string;
  imageUrl?: string;
  supportedStorageGb?: number[];
  supportedRamGb?: number[];
  variantPrices?: Record<string, number>;
}): Promise<ApiModel> {
  return apiFetch<ApiModel>('/models', { method: 'POST', body: JSON.stringify(data) }, true);
}

export function updateModel(legacyId: string, data: Partial<Omit<ApiModel, 'id' | 'brandId'>>): Promise<ApiModel> {
  return apiFetch<ApiModel>(`/models/${encodeURIComponent(legacyId)}`, { method: 'PATCH', body: JSON.stringify(data) }, true);
}

export function bulkUpdateModels(updates: Array<{ id: string; changes: Partial<Omit<ApiModel, 'id' | 'brandId'>> }>): Promise<{ updatedCount: number }> {
  return apiFetch<{ updatedCount: number }>('/models/bulk-update', { method: 'POST', body: JSON.stringify({ updates }) }, true);
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
  createdAt: string;
  updatedAt: string;
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

export function fetchCurrentUser(): Promise<{ user: ApiUser | null }> {
  return apiFetch<{ user: ApiUser | null }>('/auth/me');
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

/** Sign in or sign up with a Google ID token */
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
