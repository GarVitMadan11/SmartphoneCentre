/**
 * Firebase Authentication Client Service (Web SDK)
 * Handles Email/Password, Google Sign-in, and Phone OTP with RecaptchaVerifier
 */
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
export function initRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (!auth) return null;
  try {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('[Firebase Auth] reCAPTCHA expired. Please retry.');
      },
    });
    return verifier;
  } catch (err) {
    console.error('[Firebase Auth] Failed to initialize RecaptchaVerifier:', err);
    return null;
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
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; token: string }> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      throw new Error('Redirecting to Google Sign-In...');
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
