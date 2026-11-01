/**
 * Firebase Authentication Client Service (Web SDK)
 * Handles Email/Password, Google Sign-in, and Phone OTP with RecaptchaVerifier
 */
export type { ConfirmationResult, FirebaseUser };

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { auth } from '../config/firebase';

if (auth) {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Non-blocking persistence fallback
  });
}

export interface FirebaseAuthState {
  user: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
}

// ── 1. Recaptcha Verifier Initializer for Phone OTP ───────────────────────
let activeVerifier: RecaptchaVerifier | null = null;

export function clearRecaptchaVerifier(containerId: string = 'recaptcha-login-container'): void {
  if (activeVerifier) {
    try {
      activeVerifier.clear();
    } catch {
      // non-blocking
    }
    activeVerifier = null;
  }
  const el = document.getElementById(containerId);
  if (el && el.parentNode) {
    const freshEl = document.createElement('div');
    freshEl.id = containerId;
    el.parentNode.replaceChild(freshEl, el);
  }
}

export function initRecaptchaVerifier(containerId: string = 'recaptcha-login-container'): RecaptchaVerifier | null {
  if (!auth) return null;

  // If an active verifier instance already exists, reuse it to avoid re-rendering error
  if (activeVerifier) {
    return activeVerifier;
  }

  const el = document.getElementById(containerId);
  if (!el) {
    console.warn(`[Firebase Auth] reCAPTCHA container #${containerId} not found in DOM.`);
    return null;
  }

  // Ensure DOM container is clean and unmounted from any prior grecaptcha instance
  const freshEl = document.createElement('div');
  freshEl.id = containerId;
  el.parentNode?.replaceChild(freshEl, el);

  try {
    activeVerifier = new RecaptchaVerifier(auth, freshEl, {
      size: 'invisible',
      badge: 'inline',
      callback: () => {
        // reCAPTCHA solved automatically
      },
      'expired-callback': () => {
        console.warn('[Firebase Auth] reCAPTCHA expired. Resetting verifier.');
        clearRecaptchaVerifier(containerId);
      },
    });
    return activeVerifier;
  } catch (err: any) {
    console.warn('[Firebase Auth] RecaptchaVerifier creation notice:', err);
    clearRecaptchaVerifier(containerId);
    const retryEl = document.getElementById(containerId);
    if (!retryEl) return null;
    try {
      activeVerifier = new RecaptchaVerifier(auth, retryEl, {
        size: 'invisible',
      badge: 'inline',
      });
      return activeVerifier;
    } catch (retryErr) {
      console.error('[Firebase Auth] Recaptcha retry failed:', retryErr);
      return null;
    }
  }
}

// ── 2. Phone OTP Request & Verification ──────────────────────────────────
export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  let formatted = phoneNumber.trim().replace(/[\s\-]/g, '');
  if (/^[6-9]\d{9}$/.test(formatted)) {
    formatted = `+91${formatted}`;
  } else if (/^0[6-9]\d{9}$/.test(formatted)) {
    formatted = `+91${formatted.substring(1)}`;
  } else if (!formatted.startsWith('+')) {
    formatted = `+91${formatted}`;
  }
  return signInWithPhoneNumber(auth, formatted, verifier);
}

export async function verifyPhoneOtpCode(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ user: FirebaseUser; token: string }> {
  const result = await confirmationResult.confirm(otpCode);
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

// ── 3. Email & Password Signup / Login ────────────────────────────────────
export async function signupWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ user: FirebaseUser; token: string }> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; token: string }> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

// ── 4. Google Sign-in Popup & Redirect Fallback ───────────────────────────
export async function triggerGoogleRedirectLogin(): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
}

export async function loginWithGoogle(): Promise<{ user: FirebaseUser; token: string }> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (err: any) {
    // If user voluntarily closed or cancelled the popup, do not redirect
    if (
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request'
    ) {
      throw err;
    }

    // If popup was blocked by browser or on mobile browsers where popups fail, fall back to redirect
    if (err.code === 'auth/popup-blocked') {
      console.warn('[Firebase Auth] Popup blocked by browser, triggering redirect sign-in:', err);
      await signInWithRedirect(auth, provider);
      return new Promise(() => {}); // Wait for redirect navigation
    }

    throw err;
  }
}

// ── 5. Check Redirect Result on Startup ───────────────────────────────────
export async function checkRedirectAuthResult(): Promise<{ user: FirebaseUser; token: string } | null> {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const token = await result.user.getIdToken();
      return { user: result.user, token };
    }
  } catch (err) {
    console.warn('[Firebase Auth] Redirect auth result check error:', err);
  }
  return null;
}

// ── 6. Logout ────────────────────────────────────────────────────────────
export async function logoutFirebaseAuth(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

// ── 7. Auth State Listener ───────────────────────────────────────────────
export function subscribeToFirebaseAuth(callback: (user: FirebaseUser | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── 8. Get Current ID Token ───────────────────────────────────────────────
export async function getFirebaseIdToken(): Promise<string | null> {
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(false);
  } catch {
    return null;
  }
}
