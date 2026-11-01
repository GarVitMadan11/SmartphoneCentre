import { create } from 'zustand';
import type { ApiUser } from '../utils/api';
import { customerLogout } from '../utils/api';
import { logoutFirebaseAuth } from '../services/firebaseAuth';

interface AuthState {
  currentUser: ApiUser | null;
  setCurrentUser: (user: ApiUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  logout: async () => {
    // 1. Terminate backend session & clear HttpOnly cookies
    try {
      await customerLogout();
    } catch (err) {
      console.warn('[useAuthStore] Backend logout notice:', err);
    }

    // 2. Sign out of Firebase Auth to purge persistent client token in IndexedDB
    try {
      await logoutFirebaseAuth();
    } catch (fbErr) {
      console.warn('[useAuthStore] Firebase signout notice:', fbErr);
    }

    // 3. Clear store user state
    set({ currentUser: null });
  },
}));
