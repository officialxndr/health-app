import { create } from 'zustand';
import { workoutRepo } from '../lib/repositories/WorkoutRepo';
import { api } from '../lib/api';
import { useServerStore } from './serverStore';
import type { Exercise, LocalExercise, LocalSet, WorkoutSession, WorkoutTemplate } from '../types';

const DEFAULT_REST_SECONDS = 120;
let _counter = 0;
const nextId = () => String(++_counter);

interface WorkoutState {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  // Active session
  activeSessionLocalId: string | null;
  activeSessionName: string | null;
  sessionStartedAt: Date | null;
  localExercises: LocalExercise[];

  // Templates
  loadTemplates: () => void;
  saveTemplate: (template: { name: string; description?: string; exercises: Array<{ exerciseId: string; defaultSets: number; defaultReps?: number; defaultWeightKg?: number; restSeconds?: number; order: number }> }) => void;
  deleteTemplate: (localId: string) => void;

  // Sessions
  loadSessions: (limit?: number) => void;
  startSession: (name: string, templateLocalId?: string) => void;
  discardSession: () => void;
  finishSession: () => WorkoutSession | null;

  // In-session exercise management
  addExerciseToSession: (exercise: Exercise) => void;
  removeExerciseFromSession: (localId: string) => void;
  addSet: (exerciseLocalId: string) => void;
  removeSet: (exerciseLocalId: string, setLocalId: string) => void;
  updateSet: (exerciseLocalId: string, setLocalId: string, changes: Partial<Omit<LocalSet, 'localId'>>) => void;
  updateExerciseNotes: (exerciseLocalId: string, notes: string) => void;

  // Exercise search
  searchExercises: (q: string, muscle?: string, equipment?: string) => Exercise[];
  getMuscleGroups: () => string[];

  // Volume data for charts
  getVolume: (from: string, to: string) => { date: string; volume: number }[];
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  templates: [],
  sessions: [],
  activeSessionLocalId: null,
  activeSessionName: null,
  sessionStartedAt: null,
  localExercises: [],

  loadTemplates: () => {
    try {
      const templates = workoutRepo.getTemplates();
      set({ templates });
    } catch { /* ignore */ }
    // Sync from server in background
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/workouts/templates').then(({ data }) => {
        if (Array.isArray(data)) {
          for (const t of data) workoutRepo.upsertTemplateFromServer(t);
          set({ templates: workoutRepo.getTemplates() });
        }
      }).catch(() => {});
    }
  },

  saveTemplate: (template) => {
    workoutRepo.saveTemplate(template);
    get().loadTemplates();
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.post('/workouts/templates', template).catch(() => {});
    }
  },

  deleteTemplate: (localId) => {
    workoutRepo.deleteTemplate(localId);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== localId) }));
  },

  loadSessions: (limit = 30) => {
    try {
      const sessions = workoutRepo.getSessions(limit);
      set({ sessions });
    } catch { /* ignore */ }
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/workouts/sessions', { params: { limit } }).then(({ data }) => {
        // Sessions from server are read-only references — don't overwrite local finished sessions
        // For now just use what we have locally
      }).catch(() => {});
    }
  },

  startSession: (name, templateLocalId) => {
    const localId = workoutRepo.startSession(name, templateLocalId);
    const localExercises = templateLocalId
      ? workoutRepo.buildLocalExercisesFromTemplate(templateLocalId)
      : [];
    set({
      activeSessionLocalId: localId,
      activeSessionName: name,
      sessionStartedAt: new Date(),
      localExercises,
    });
  },

  discardSession: () => {
    const { activeSessionLocalId } = get();
    if (activeSessionLocalId) workoutRepo.discardSession(activeSessionLocalId);
    set({ activeSessionLocalId: null, activeSessionName: null, sessionStartedAt: null, localExercises: [] });
  },

  finishSession: () => {
    const { activeSessionLocalId, localExercises } = get();
    if (!activeSessionLocalId) return null;

    const exercises = localExercises.map((le, i) => ({
      exerciseLocalId: le.exerciseId,
      notes: le.notes || undefined,
      order: i,
      sets: le.sets
        .filter((s) => s.done || s.weightKg > 0 || s.reps > 0)
        .map((s) => ({ setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps, rpe: s.rpe })),
    }));

    const finishedAt = new Date().toISOString();
    workoutRepo.finishSession(activeSessionLocalId, exercises, finishedAt);

    const sessions = workoutRepo.getSessions();
    set({
      activeSessionLocalId: null,
      activeSessionName: null,
      sessionStartedAt: null,
      localExercises: [],
      sessions,
    });

    // Sync to server in background
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.post('/workouts/sessions', { name: get().activeSessionName, exercises, finishedAt }).catch(() => {});
    }

    return sessions[0] ?? null;
  },

  addExerciseToSession: (exercise) => {
    const counter = { n: _counter };
    const newEx = workoutRepo.buildEmptyLocalExercise(exercise, counter);
    _counter = counter.n;
    newEx.order = get().localExercises.length;
    set((s) => ({ localExercises: [...s.localExercises, newEx] }));
  },

  removeExerciseFromSession: (localId) => {
    set((s) => ({
      localExercises: s.localExercises
        .filter((le) => le.localId !== localId)
        .map((le, i) => ({ ...le, order: i })),
    }));
  },

  addSet: (exerciseLocalId) => {
    set((s) => ({
      localExercises: s.localExercises.map((le) => {
        if (le.localId !== exerciseLocalId) return le;
        const last = le.sets[le.sets.length - 1];
        return {
          ...le,
          sets: [
            ...le.sets,
            {
              localId: nextId(),
              setNumber: le.sets.length + 1,
              weightKg: last?.weightKg ?? 0,
              reps: last?.reps ?? 8,
              done: false,
              isPersonalBest: false,
            },
          ],
        };
      }),
    }));
  },

  removeSet: (exerciseLocalId, setLocalId) => {
    set((s) => ({
      localExercises: s.localExercises.map((le) => {
        if (le.localId !== exerciseLocalId) return le;
        return {
          ...le,
          sets: le.sets
            .filter((s) => s.localId !== setLocalId)
            .map((s, i) => ({ ...s, setNumber: i + 1 })),
        };
      }),
    }));
  },

  updateSet: (exerciseLocalId, setLocalId, changes) => {
    set((s) => ({
      localExercises: s.localExercises.map((le) => {
        if (le.localId !== exerciseLocalId) return le;
        return {
          ...le,
          sets: le.sets.map((s) => (s.localId === setLocalId ? { ...s, ...changes } : s)),
        };
      }),
    }));
  },

  updateExerciseNotes: (exerciseLocalId, notes) => {
    set((s) => ({
      localExercises: s.localExercises.map((le) =>
        le.localId === exerciseLocalId ? { ...le, notes } : le
      ),
    }));
  },

  searchExercises: (q, muscle, equipment) => workoutRepo.searchExercises(q, muscle, equipment),
  getMuscleGroups: () => workoutRepo.getDistinctMuscleGroups(),
  getVolume: (from, to) => workoutRepo.getVolumeBySession(from, to),
}));
