import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Routine {
  id: string;
  name: string;
  templateIds: string[];  // local template IDs in rotation order
  lastDones: Record<string, number>; // templateId → timestamp
}

interface RoutinesState {
  routines: Routine[];
  addRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  stampRoutine: (routineId: string, templateId: string) => void;
}

export const useRoutinesStore = create<RoutinesState>()(
  persist(
    (set) => ({
      routines: [],
      addRoutine: (r) => set((s) => ({ routines: [...s.routines, r] })),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      stampRoutine: (routineId, templateId) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id !== routineId
              ? r
              : { ...r, lastDones: { ...r.lastDones, [templateId]: Date.now() } }
          ),
        })),
    }),
    {
      name: 'fitself-routines',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
