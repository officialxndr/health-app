import { create } from 'zustand';
import { healthRepo } from '../lib/repositories/HealthRepo';
import { api } from '../lib/api';
import { useServerStore } from './serverStore';
import { useAuthStore } from './authStore';
import type { BodyMeasurement, GoalPhase, HealthStats, WeightEntry } from '../types';

interface HealthState {
  stats: HealthStats | null;
  weightEntries: WeightEntry[];
  measurements: BodyMeasurement[];
  goalPhases: GoalPhase[];

  fetchStats: () => void;
  fetchWeightEntries: (from: string, to: string) => void;
  addWeightEntry: (weightKg: number, bodyFat?: number) => void;
  deleteWeightEntry: (localId: string) => void;

  fetchMeasurements: () => void;
  addMeasurement: (data: Partial<Omit<BodyMeasurement, 'id' | 'createdAt'>> & { date: string }) => void;
  deleteMeasurement: (localId: string) => void;

  fetchGoalPhases: () => void;
  saveGoalPhase: (phase: Omit<GoalPhase, 'id'>) => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  stats: null,
  weightEntries: [],
  measurements: [],
  goalPhases: [],

  fetchStats: () => {
    const user = useAuthStore.getState().user;
    const profile = user?.profile;
    try {
      const stats = healthRepo.computeStats(profile?.goalWeightKg, profile?.goalDate);
      set({ stats });
    } catch { /* ignore */ }
    // Sync from server in background
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/health/stats').then(({ data }) => {
        set({ stats: data });
      }).catch(() => {});
    }
  },

  fetchWeightEntries: (from, to) => {
    try {
      const weightEntries = healthRepo.getWeightEntries(from, to);
      set({ weightEntries });
    } catch { /* ignore */ }
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/health/weight', { params: { from, to } }).then(({ data }) => {
        if (Array.isArray(data)) {
          for (const entry of data) healthRepo.upsertWeightEntryFromServer(entry);
          set({ weightEntries: healthRepo.getWeightEntries(from, to) });
        }
      }).catch(() => {});
    }
  },

  addWeightEntry: (weightKg, bodyFat) => {
    const today = new Date().toISOString().slice(0, 10);
    healthRepo.upsertWeightEntry(today, weightKg, bodyFat);
    get().fetchStats();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    get().fetchWeightEntries(ninetyDaysAgo, today);
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.post('/health/weight', { weightKg, bodyFat, date: today }).catch(() => {});
    }
  },

  deleteWeightEntry: (localId) => {
    healthRepo.deleteWeightEntry(localId);
    const today = new Date().toISOString().slice(0, 10);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    get().fetchWeightEntries(ninetyDaysAgo, today);
    get().fetchStats();
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.delete(`/health/weight/${localId}`).catch(() => {});
    }
  },

  fetchMeasurements: () => {
    try {
      const measurements = healthRepo.getMeasurements();
      set({ measurements });
    } catch { /* ignore */ }
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/measurements').then(({ data }) => {
        if (Array.isArray(data)) {
          for (const m of data) healthRepo.upsertMeasurementFromServer(m);
          set({ measurements: healthRepo.getMeasurements() });
        }
      }).catch(() => {});
    }
  },

  addMeasurement: (data) => {
    healthRepo.addMeasurement(data);
    set({ measurements: healthRepo.getMeasurements() });
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.post('/measurements', data).catch(() => {});
    }
  },

  deleteMeasurement: (localId) => {
    healthRepo.deleteMeasurement(localId);
    set((s) => ({ measurements: s.measurements.filter((m) => m.id !== localId) }));
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.delete(`/measurements/${localId}`).catch(() => {});
    }
  },

  fetchGoalPhases: () => {
    try {
      const goalPhases = healthRepo.getGoalPhases();
      set({ goalPhases });
    } catch { /* ignore */ }
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/goal-phases').then(({ data }) => {
        if (Array.isArray(data)) {
          for (const p of data) healthRepo.upsertGoalPhaseFromServer(p);
          set({ goalPhases: healthRepo.getGoalPhases() });
        }
      }).catch(() => {});
    }
  },

  saveGoalPhase: (phase) => {
    healthRepo.saveGoalPhase(phase);
    set({ goalPhases: healthRepo.getGoalPhases() });
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.post('/goal-phases', phase).catch(() => {});
    }
  },
}));
