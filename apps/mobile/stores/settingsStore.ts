import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UnitSystem } from '../types';

interface SettingsState {
  unitSystem: UnitSystem;
  countActiveCalories: boolean;
  setUnitSystem: (system: UnitSystem) => void;
  setCountActiveCalories: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unitSystem: 'IMPERIAL',
      countActiveCalories: false,
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setCountActiveCalories: (countActiveCalories) => set({ countActiveCalories }),
    }),
    {
      name: 'fitself-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
