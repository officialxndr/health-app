import { create } from 'zustand';

interface Routine {
  id: string;
  name: string;
  templateIds: string[];
  lastDones: Record<string, number>;
}

interface SessionState {
  activeSession: string | null;
  routines: Routine[];
  startSession: (name: string) => void;
  finishSession: () => void;
  discardSession: () => void;
  addRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  stampRoutine: (routineId: string, templateId: string) => void;
}

const NOW = Date.now();
const DAY = 86_400_000;

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  routines: [
    {
      id: 'r1',
      name: 'PPL Rotation',
      templateIds: ['push', 'pull', 'legs'],
      lastDones: { push: NOW - 2 * DAY, pull: NOW - 4 * DAY, legs: NOW - 6 * DAY },
    },
  ],
  startSession:   (name) => set({ activeSession: name }),
  finishSession:  () => set({ activeSession: null }),
  discardSession: () => set({ activeSession: null }),
  addRoutine:     (r) => set((s) => ({ routines: [...s.routines, r] })),
  deleteRoutine:  (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
  stampRoutine:   (routineId, templateId) =>
    set((s) => ({
      routines: s.routines.map((r) =>
        r.id !== routineId ? r : { ...r, lastDones: { ...r.lastDones, [templateId]: Date.now() } }
      ),
    })),
}));

export type { Routine };
