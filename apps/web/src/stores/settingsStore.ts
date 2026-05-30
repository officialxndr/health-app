import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UnitSystem } from '@/types'

interface SettingsState {
  unitSystem: UnitSystem
  countActiveCalories: boolean
  setUnitSystem: (system: UnitSystem) => void
  setCountActiveCalories: (val: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unitSystem: 'METRIC',
      countActiveCalories: false,
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setCountActiveCalories: (countActiveCalories) => set({ countActiveCalories }),
    }),
    { name: 'fitself-settings' }
  )
)
