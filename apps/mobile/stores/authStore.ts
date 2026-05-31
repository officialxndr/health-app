import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { useServerStore } from './serverStore';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  // Server-backed login
  loginWithServer: (email: string, password: string) => Promise<void>;
  // Local-only login — just a display name, no server needed
  loginLocal: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),

      loginWithServer: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user, accessToken: data.accessToken });
        // Persist the server token in serverStore so the sync engine can use it
        useServerStore.getState().setServerToken(data.accessToken);
      },

      loginLocal: (name) => {
        const localUser: User = {
          id: 'local',
          email: '',
          name,
          createdAt: new Date().toISOString(),
          profile: {
            id: 'local-profile',
            userId: 'local',
            activityLevel: 'MODERATE',
            goalType: 'MAINTAIN',
            unitSystem: 'IMPERIAL',
            macroTargetMode: 'GRAMS',
            countActiveCalories: false,
            updatedAt: new Date().toISOString(),
          },
        };
        set({ user: localUser, accessToken: null });
      },

      logout: () => {
        // Best-effort server logout
        const { serverUrl } = useServerStore.getState();
        if (serverUrl) api.post('/auth/logout').catch(() => {});
        useServerStore.getState().clearServer();
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'fitself-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user (not accessToken — refresh on next open)
      partialize: (s) => ({ user: s.user }),
    }
  )
);
