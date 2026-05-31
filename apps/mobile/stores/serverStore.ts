import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ServerState {
  serverUrl: string | null;   // e.g. 'http://192.168.1.10:3001'
  accessToken: string | null; // JWT from server login
  setServer: (url: string, token: string) => void;
  setServerToken: (token: string) => void;
  clearServer: () => void;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set) => ({
      serverUrl: null,
      accessToken: null,
      setServer: (serverUrl, accessToken) => set({ serverUrl, accessToken }),
      setServerToken: (accessToken) => set({ accessToken }),
      clearServer: () => set({ serverUrl: null, accessToken: null }),
    }),
    {
      name: 'fitself-server',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
