/**
 * Sync Engine — pushes pending local changes to the server and pulls
 * server data into the local SQLite database.
 *
 * Called on:
 *  - App foreground (AppState change)
 *  - After each write (fire-and-forget)
 *
 * No-ops silently when no server is configured or the device is offline.
 */

import { db } from './db';
import { api } from './api';
import { foodRepo } from './repositories/FoodRepo';
import { healthRepo } from './repositories/HealthRepo';
import { workoutRepo } from './repositories/WorkoutRepo';
import { useServerStore } from '../stores/serverStore';

let _syncing = false;

export async function sync(): Promise<void> {
  const { serverUrl } = useServerStore.getState();
  if (!serverUrl || _syncing) return;

  _syncing = true;
  try {
    await push();
    await pull();
  } catch {
    /* offline or auth error — will retry on next trigger */
  } finally {
    _syncing = false;
  }
}

// ── Push local pending records to server ──────────────────────────────────────

async function push() {
  await pushFoodItems();
  await pushFoodLogs();
  await pushWeightEntries();
  await pushMeasurements();
  await pushGoalPhases();
  await pushWorkoutSessions();
}

async function pushFoodItems() {
  const rows = db.getAllSync(`SELECT * FROM food_items WHERE syncStatus = 'pending'`) as any[];
  for (const row of rows) {
    try {
      if (row.serverId) {
        // Update existing server record (custom foods only)
        await api.put(`/food/items/${row.serverId}`, {
          name: row.name, brand: row.brand, barcode: row.barcode,
          servingSize: row.servingSize, servingUnit: row.servingUnit,
          calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat,
          fiber: row.fiber, sugar: row.sugar, sodium: row.sodium,
        });
      } else if (row.isCustom) {
        // Create new custom food on server
        const { data } = await api.post('/food/items', {
          name: row.name, brand: row.brand, barcode: row.barcode,
          servingSize: row.servingSize, servingUnit: row.servingUnit,
          calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat,
          fiber: row.fiber, sugar: row.sugar, sodium: row.sodium,
        });
        db.runSync(
          `UPDATE food_items SET serverId = ?, syncStatus = 'synced' WHERE localId = ?`,
          [data.id, row.localId]
        );
        continue;
      }
      db.runSync(`UPDATE food_items SET syncStatus = 'synced' WHERE localId = ?`, [row.localId]);
    } catch { /* leave pending */ }
  }
}

async function pushFoodLogs() {
  const rows = db.getAllSync(`SELECT * FROM food_logs WHERE syncStatus = 'pending'`) as any[];
  for (const row of rows) {
    try {
      if (row.deleted) {
        if (row.serverId) await api.delete(`/food/log/${row.serverId}`);
        db.runSync(`DELETE FROM food_logs WHERE localId = ?`, [row.localId]);
        continue;
      }
      // Resolve food item's serverId
      const fi = row.foodItemLocalId
        ? (db.getFirstSync(`SELECT serverId FROM food_items WHERE localId = ?`, [row.foodItemLocalId]) as any)
        : null;
      if (row.serverId) {
        await api.put(`/food/log/${row.serverId}`, { servingQty: row.servingQty });
      } else {
        const { data } = await api.post('/food/log', {
          date: row.date,
          meal: row.meal,
          foodItemId: fi?.serverId ?? undefined,
          servingQty: row.servingQty,
        });
        db.runSync(
          `UPDATE food_logs SET serverId = ?, syncStatus = 'synced' WHERE localId = ?`,
          [data.id, row.localId]
        );
        continue;
      }
      db.runSync(`UPDATE food_logs SET syncStatus = 'synced' WHERE localId = ?`, [row.localId]);
    } catch { /* leave pending */ }
  }
}

async function pushWeightEntries() {
  const rows = db.getAllSync(`SELECT * FROM weight_entries WHERE syncStatus = 'pending'`) as any[];
  for (const row of rows) {
    try {
      if (row.deleted) {
        if (row.serverId) await api.delete(`/health/weight/${row.serverId}`);
        db.runSync(`DELETE FROM weight_entries WHERE localId = ?`, [row.localId]);
        continue;
      }
      if (row.serverId) {
        // weight entries use upsert by date on server — just log again
        await api.post('/health/weight', { date: row.date, weightKg: row.weightKg, bodyFat: row.bodyFat });
      } else {
        const { data } = await api.post('/health/weight', {
          date: row.date, weightKg: row.weightKg, bodyFat: row.bodyFat,
        });
        db.runSync(
          `UPDATE weight_entries SET serverId = ?, syncStatus = 'synced' WHERE localId = ?`,
          [data.id, row.localId]
        );
        continue;
      }
      db.runSync(`UPDATE weight_entries SET syncStatus = 'synced' WHERE localId = ?`, [row.localId]);
    } catch { /* leave pending */ }
  }
}

async function pushMeasurements() {
  const rows = db.getAllSync(`SELECT * FROM body_measurements WHERE syncStatus = 'pending'`) as any[];
  for (const row of rows) {
    try {
      if (row.deleted) {
        if (row.serverId) await api.delete(`/measurements/${row.serverId}`);
        db.runSync(`DELETE FROM body_measurements WHERE localId = ?`, [row.localId]);
        continue;
      }
      if (!row.serverId) {
        const { data } = await api.post('/measurements', {
          date: row.date, neck: row.neck, shoulders: row.shoulders, chest: row.chest,
          leftArm: row.leftArm, rightArm: row.rightArm, waist: row.waist, hips: row.hips,
          leftThigh: row.leftThigh, rightThigh: row.rightThigh,
          leftCalf: row.leftCalf, rightCalf: row.rightCalf, notes: row.notes,
        });
        db.runSync(
          `UPDATE body_measurements SET serverId = ?, syncStatus = 'synced' WHERE localId = ?`,
          [data.id, row.localId]
        );
        continue;
      }
      db.runSync(`UPDATE body_measurements SET syncStatus = 'synced' WHERE localId = ?`, [row.localId]);
    } catch { /* leave pending */ }
  }
}

async function pushGoalPhases() {
  const rows = db.getAllSync(`SELECT * FROM goal_phases WHERE syncStatus = 'pending'`) as any[];
  for (const row of rows) {
    try {
      if (row.deleted) {
        if (row.serverId) await api.delete(`/goal-phases/${row.serverId}`);
        db.runSync(`DELETE FROM goal_phases WHERE localId = ?`, [row.localId]);
        continue;
      }
      if (!row.serverId) {
        const { data } = await api.post('/goal-phases', {
          name: row.name, goalType: row.goalType,
          startDate: row.startDate, endDate: row.endDate,
          targetWeightKg: row.targetWeightKg, weeklyRateKg: row.weeklyRateKg,
          calorieTarget: row.calorieTarget, proteinTarget: row.proteinTarget,
          carbsTarget: row.carbsTarget, fatTarget: row.fatTarget,
        });
        db.runSync(
          `UPDATE goal_phases SET serverId = ?, syncStatus = 'synced' WHERE localId = ?`,
          [data.id, row.localId]
        );
        continue;
      }
      db.runSync(`UPDATE goal_phases SET syncStatus = 'synced' WHERE localId = ?`, [row.localId]);
    } catch { /* leave pending */ }
  }
}

async function pushWorkoutSessions() {
  const rows = db.getAllSync(
    `SELECT * FROM workout_sessions WHERE syncStatus = 'pending' AND finishedAt IS NOT NULL`
  ) as any[];
  for (const row of rows) {
    try {
      if (!row.serverId) {
        // Build exercises payload
        const seRows = db.getAllSync(
          `SELECT se.*, e.serverId AS e_serverId FROM session_exercises se
           JOIN exercises e ON se.exerciseLocalId = e.localId
           WHERE se.sessionLocalId = ? ORDER BY se.sortOrder`,
          [row.localId]
        ) as any[];
        const exercises = seRows.map((se) => {
          const sets = db.getAllSync(
            `SELECT * FROM exercise_sets WHERE sessionExerciseLocalId = ? ORDER BY setNumber`,
            [se.localId]
          ) as any[];
          return {
            exerciseId: se.e_serverId ?? se.exerciseLocalId,
            notes: se.notes,
            order: se.sortOrder,
            sets: sets.map((s) => ({ setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps, rpe: s.rpe })),
          };
        });
        const { data } = await api.post('/workouts/sessions', {
          name: row.name, exercises, finishedAt: row.finishedAt, startedAt: row.startedAt,
        });
        db.runSync(
          `UPDATE workout_sessions SET serverId = ?, syncStatus = 'synced' WHERE localId = ?`,
          [data.id, row.localId]
        );
      } else {
        db.runSync(`UPDATE workout_sessions SET syncStatus = 'synced' WHERE localId = ?`, [row.localId]);
      }
    } catch { /* leave pending */ }
  }
}

// ── Pull server data into local SQLite ────────────────────────────────────────

async function pull() {
  await pullWeightEntries();
  await pullGoalPhases();
  await pullMeasurements();
  await pullExercises();
  await pullTemplates();
}

async function pullWeightEntries() {
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data } = await api.get('/health/weight', { params: { from, to } });
  if (Array.isArray(data)) {
    for (const entry of data) healthRepo.upsertWeightEntryFromServer(entry);
  }
}

async function pullGoalPhases() {
  const { data } = await api.get('/goal-phases');
  if (Array.isArray(data)) {
    for (const phase of data) healthRepo.upsertGoalPhaseFromServer(phase);
  }
}

async function pullMeasurements() {
  const { data } = await api.get('/measurements');
  if (Array.isArray(data)) {
    for (const m of data) healthRepo.upsertMeasurementFromServer(m);
  }
}

async function pullExercises() {
  // Only pull exercises once if table is empty
  const count = (db.getFirstSync(`SELECT COUNT(*) AS n FROM exercises`) as any)?.n ?? 0;
  if (count > 0) return;
  const { data } = await api.get('/exercises', { params: { limit: 500 } });
  if (Array.isArray(data)) {
    for (const ex of data) workoutRepo.upsertExercise(ex);
  }
}

async function pullTemplates() {
  const { data } = await api.get('/workouts/templates');
  if (Array.isArray(data)) {
    for (const t of data) workoutRepo.upsertTemplateFromServer(t);
  }
}
