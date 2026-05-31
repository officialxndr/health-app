import { create } from 'zustand';

interface AuthState {
  authed: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authed: false,
  user: null,
  login: async (email: string, _password: string) => {
    // Replace with real API call: POST /api/auth/login
    await new Promise((r) => setTimeout(r, 400));
    set({ authed: true, user: { name: 'Alex', email } });
  },
  logout: () => set({ authed: false, user: null }),
}));
