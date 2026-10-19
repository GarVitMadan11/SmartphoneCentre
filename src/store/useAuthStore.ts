import { create } from 'zustand';
import type { ApiUser } from '../utils/api';
import { customerLogout } from '../utils/api';

interface AuthState {
  currentUser: ApiUser | null;
  setCurrentUser: (user: ApiUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  logout: async () => {
    await customerLogout();
    set({ currentUser: null });
  },
}));
