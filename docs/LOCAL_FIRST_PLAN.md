# Future Plan: Local-First iPhone App (No Server Required)

## Goal

Make FitSelf fully self-contained on the iPhone. No backend server, no PC running in the background. Data lives on the device in a local SQLite database.

---

## Current vs Target Architecture

| Layer | Current | Target |
|-------|---------|--------|
| Database | PostgreSQL on a PC/server | SQLite on-device (`@capacitor-community/sqlite`) |
| API | Fastify backend (`apps/api`) | Local `db.ts` service called directly from the frontend |
| Auth | JWT login / register screen | Single local profile, no login needed |
| Food search | Frontend → backend → Open Food Facts / USDA | Frontend → Open Food Facts / USDA directly |
| Barcode lookup | Frontend → backend → OFF/USDA | Frontend → OFF/USDA directly |
| Apple Health | iOS Shortcut webhook to backend | Direct HealthKit via `@capacitor-community/health-kit` |
| Multi-user | Supported | Single user only |

**Gained:** Works offline always, no server dependency, simpler deployment (just build and install).  
**Lost:** Multi-device sync (data stays on the phone unless iCloud backup is added later).

---

## Implementation Plan

### 1. Install dependencies

```bash
cd apps/web
npm install @capacitor-community/sqlite
npx cap sync ios
```

Also install the CocoaPods pod on Mac:
```bash
cd ios/App
pod install
```

### 2. Create `apps/web/src/lib/db.ts`

A single service module that owns the SQLite connection and exposes typed query helpers. Mirrors the current Prisma schema but in SQLite DDL.

**Tables to create (matching current Prisma schema):**
- `user_profile` — name, birth_date, height_cm, goal_weight_kg, goal_type, activity_level, unit_system, calorie_goal, protein_target, carbs_target, fat_target, avatar_url, etc.
- `food_item` — id, barcode, name, brand, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium, source, is_custom
- `food_log` — id, date, meal, food_item_id, recipe_id, serving_qty
- `favorite_food_item` — id, food_item_id
- `recipe` — id, name, description, servings
- `recipe_ingredient` — id, recipe_id, food_item_id, quantity
- `exercise` — id, exercise_db_id, name, muscle_group, equipment, category, image_url, video_url, gif_url, is_custom
- `workout_template` — id, name, description, label
- `template_exercise` — id, template_id, exercise_id, default_sets, default_reps, default_weight_kg, rest_seconds, order
- `workout_session` — id, template_id, name, started_at, finished_at, notes, total_volume
- `session_exercise` — id, session_id, exercise_id, notes, order
- `exercise_set` — id, session_exercise_id, set_number, weight_kg, reps, rpe, is_personal_best
- `weight_entry` — id, date, weight_kg, body_fat, source
- `body_measurement` — id, date, neck, shoulders, chest, left_arm, right_arm, waist, hips, left_thigh, right_thigh, left_calf, right_calf, notes
- `goal_phase` — id, name, goal_type, start_date, end_date, target_weight_kg, weekly_rate_kg, calorie_target, protein_target, carbs_target, fat_target, cycle_id

### 3. Replace all `api.*` calls

Every store (`foodStore`, `workoutStore`, `settingsStore`) currently calls `api.get/post/put/delete`. Replace each with a call to `db.ts`.

**Files to update:**
- `src/stores/foodStore.ts`
- `src/stores/workoutStore.ts`
- `src/stores/settingsStore.ts`
- `src/stores/authStore.ts` → becomes a local profile store
- `src/lib/api.ts` → kept only for external food search APIs (OFF, USDA)

### 4. Simplify auth

Remove the login/register flow entirely. On first launch (no profile in DB), show the existing onboarding wizard. Profile is stored locally in `user_profile` table. No passwords, no JWT.

**Files to remove/simplify:**
- `src/pages/Login.tsx` → redirect to onboarding if no profile
- `src/pages/Register.tsx` → remove
- `App.tsx` → remove `RequireAuth`, just check if local profile exists

### 5. Food search — call external APIs directly

The backend currently proxies food search to avoid CORS. Direct calls from a Capacitor native app do NOT have CORS restrictions (there's no browser same-origin policy for native apps), so this works without a server.

Update `foodStore.searchFoods()` and `foodStore.scanBarcode()` to call OFF and USDA directly using their public endpoints.

Add the Open Food Facts User-Agent header directly in the Axios call:
```ts
headers: { 'User-Agent': 'FitSelf/1.0 (your-email@example.com)' }
```

### 6. Apple Health — direct HealthKit

Replace the iOS Shortcut webhook (`POST /api/health/apple/shortcut`) with the `@capacitor-community/health-kit` plugin reading data directly. No server needed.

### 7. Delete `apps/api`

Once all functionality is moved to the local DB service:
- Delete `apps/api/`
- Remove API-related entries from `docker-compose.yml`
- Remove the backend proxy from `vite.config.ts`

---

## Optional Future Addition: iCloud Backup / Sync

SQLite databases in a Capacitor app are stored in the app's documents directory, which iOS backs up to iCloud automatically if the user has iCloud Backup enabled. This means:
- Data is backed up without any extra work
- Restoring a phone restores the app data

For multi-device sync (e.g., iPhone + iPad), a future option is to use **CloudKit** via a Capacitor plugin, or export/import the SQLite file to iCloud Drive.

---

## Notes

- The PWA (web browser) version would still need a backend for storage — this local-first approach is Capacitor/native only
- The exercise library (11k+ exercises from ExerciseDB) would need to be bundled with the app as a pre-seeded SQLite file, or downloaded on first launch
- Total effort estimate: ~1–2 full implementation sessions
