# Numpad set-completion + Contextual navigation redesign

## Context

Two requests, both about making the mobile UX feel polished and intentional:

1. **Numpad flow** — During an active workout, tapping **Next** on the reps field currently *creates a new set* (and on the last set of the last exercise auto-appends one). The user wants the numpad to follow a natural per-set rhythm instead: **weight → reps → mark the set complete + start the rest timer**, with no automatic set creation.

2. **Navigation redesign** — The current chrome is a title + a redundant Food/Workout/Health pill in the header, plus a flat 5-item bottom nav. The user wants a **clean top header with a dropdown section switcher**, and a **contextual bottom nav** where each section (Food / Workout / Health) shows its *own* sub-pages, with a **round center "+" FAB** exposing that section's quick actions. Decisions confirmed: contextual bottom nav (switch sections from the header dropdown) + full sub-page breakdown + multi-action FAB sheet.

---

## Part 1 — Numpad: weight → reps → complete set

Small, self-contained change. No set is ever auto-created by **Next**; the existing "Add Set" button and `addSet` store action remain the only way to add sets.

### `apps/web/src/components/workout/ActiveSession.tsx`
- Extract a `markSetDone(le, set)` helper from the toggle logic in `handleCheck` (lines 389-397): force `done: true` via `updateSet`, and start the rest timer (`setActiveRest({ setLocalId, total: le.restSeconds, remaining: le.restSeconds })` when `restSeconds > 0`). Keep `handleCheck` as the toggle used by the ✓ button.
- Rewrite `handleNext` (lines 364-387):
  - `field === 'weight'` → focus `'reps'` (unchanged).
  - `field === 'reps'` → look up the current `le`/`set`, call `markSetDone(le, set)`, then `setFocused(null)` to dismiss the numpad. **Remove** the `addSet(...)` branch and the "advance to next set / next exercise" branches entirely.
- The rest bar already renders under the completed set and the user taps the next set's weight cell to continue — matching the requested rhythm.

### `apps/web/src/components/workout/Numpad.tsx`
- Add a `nextLabel: string` prop and render it on the primary button (lines 80-85) instead of the hard-coded "Next".
- In `ActiveSession`, pass `nextLabel={focused.field === 'weight' ? 'Next' : 'Complete'}` (a `Check` icon may be shown alongside the reps-step label for clarity).

---

## Part 2 — Contextual navigation redesign

### Model
- **Top header**: current section name + chevron → dropdown to jump between **Dashboard / Food / Workout / Health / Settings**. Right side: avatar → Settings.
- **Bottom nav**: derives the active section from the first path segment and renders **that section's sub-pages** as `NavLink`s, split left/right around a raised round **"+" FAB**. The FAB opens a bottom-sheet of the section's quick actions.
- **Dashboard** is the home hub: its bottom bar acts as a section launcher (Food / Workout / Health / Settings); FAB offers global quick actions (Log food / Log weight / Start workout). **Settings** has no sub-pages/FAB.

### Sub-pages & FAB actions (the full breakdown)
```
FOOD     sub-pages: Today · Recipes · Trends
         FAB: Search food · Scan barcode · Quick add · New recipe
WORKOUT  sub-pages: Templates · History · Exercises
         FAB: Empty workout · From template
HEALTH   sub-pages: Weight · Goals · Composition · Measurements
         FAB: Log weight · Log measurement
```

### Routing — `apps/web/src/App.tsx`
Replace the flat section routes with sub-page routes under the existing `Layout` (one shared `<Outlet/>`, no nested layout components needed — header + bottom nav read the path):
```
/                     Dashboard
/food                 → redirect /food/today
/food/today           FoodToday        (current Food.tsx daily-log content)
/food/recipes         FoodRecipes      (NEW)
/food/trends          FoodTrends       (NEW)
/workout              → redirect /workout/templates
/workout/templates    WorkoutTemplates (extracted from Workout.tsx)
/workout/history      WorkoutHistory   (extracted from Workout.tsx)
/workout/exercises    ExercisePicker   (existing)
/health               → redirect /health/weight
/health/weight        WeightTab        (existing component)
/health/goals         GoalsTab         (existing component)
/health/composition   CompositionTab   (existing component)
/health/measurements  Measurements     (existing page, re-homed)
/settings             Settings
```
Keep detail routes untouched: `/tdee`, `/exercises/:id`, `/apple-health`. The active-workout overlay still takes over full-screen from within the Workout section.

### New: `apps/web/src/lib/navConfig.tsx`
Single source of truth consumed by header + bottom nav + FAB:
- `SECTIONS`: `{ key, label, Icon, basePath }[]` for the header dropdown.
- `SECTION_TABS`: section key → `{ to, label, Icon }[]` (the bottom-nav sub-pages above).
- `SECTION_ACTIONS`: section key → `{ id, label, Icon }[]` (the FAB quick actions above).
Icons all already exist in `apps/web/src/components/icons.ts` (`ChevronDown`, `Search`, `ScanLine`, `Plus`, `Utensils`, `Activity`/`Flame`, `Dumbbell`, `Ruler`, `Repeat`, etc.).

### `apps/web/src/components/AppHeader.tsx` (rewrite)
- Derive the active section from `location.pathname`. Render `Section ▾` button that toggles a dropdown (`SECTIONS`); selecting navigates to that section's base path (redirect lands on its default sub-page). Avatar/profile button on the right → `/settings`.
- Keep hiding the header on self-contained detail pages (`/tdee`, `/exercises/:id`, `/apple-health`) as today.

### `apps/web/src/components/BottomNav.tsx` (rewrite)
- Derive active section from the path. Look up `SECTION_TABS[section]`; render the tabs as `NavLink`s in two groups with a centered, elevated round FAB (`Plus`) between them. Use `clsx` active styling as today (`text-primary` vs `text-muted`).
- FAB `onClick` opens the action sheet for the section. On Dashboard, render the launcher variant (sections as links) + global FAB; on Settings, render a minimal bar (no FAB).
- Account for the taller FAB bar in spacing (extend the `pb-nav` utility / FAB notch as needed in `apps/web/src/index.css`).

### New: `apps/web/src/components/QuickActionSheet.tsx` + `apps/web/src/stores/uiStore.ts`
- `uiStore`: `{ quickAction: string | null, setQuickAction, clearQuickAction }` — decouples the FAB from the target screen so an action works whether or not you're already on its sub-page.
- `QuickActionSheet`: bottom sheet listing `SECTION_ACTIONS[section]`. Selecting an action maps to `(targetPath, actionId)`:
  - `food.search|scan|quickAdd` → ensure `/food/today`, then open `AddFoodModal` in the right mode (default meal via a `mealForNow()` time-of-day helper). `food.recipe` → `/food/recipes` + open create form.
  - `workout.empty` → start a blank session immediately (existing quick-start path in `Workout.tsx`); `workout.template` → `/workout/templates`.
  - `health.weight` → `/health/weight` + focus the log input; `health.measurement` → `/health/measurements` + open the add form.
- Each target sub-page gains a small `useEffect` that consumes `quickAction` (opens its modal/form) then calls `clearQuickAction`.

### Page refactors
- **Food** (`Food.tsx`): rename current component to `FoodToday` (date picker + meal sections + rings stay intact); its meal "+" buttons keep opening `AddFoodModal`. Build **`FoodRecipes`** (list user recipes with computed per-serving nutrition + create/edit/delete via `/api/recipes`; reuse `FoodRow`/recipe pieces from `AddFoodModal.tsx`) and **`FoodTrends`** (calorie/macro averages over a range via `/api/food/stats`, Recharts like the existing charts). These two are net-new screens.
- **Workout** (`Workout.tsx`): remove the internal sub-tab bar (lines 312-336); split the `templates` and `history` blocks into `WorkoutTemplates` and `WorkoutHistory` route components (keeping `MuscleMap`, `VolumeChart`, `TemplateCard`, `SessionCard`, `TemplateBuilder`, `SessionDetail`, active-session overlay, quick-start/PR logic). `exercises` maps straight to `ExercisePicker`. "+ New template" stays in-page and is also a FAB action path.
- **Health** (`Health.tsx`): remove the internal tab bar (lines 825-841); mount `WeightTab` / `GoalsTab` / `CompositionTab` directly as routes (they already take props — pass `stats`/`unitSystem`/refresh callbacks fetched in each route wrapper or a tiny shared hook). `Measurements` stays at `/health/measurements`.

---

## Verification
- `cd apps/web; npm run build` (or `npx tsc --noEmit`) — type-check the route/prop refactors.
- `npm run dev` and exercise on a narrow viewport:
  - **Numpad**: start a workout → tap weight, enter value, **Next** → focus jumps to reps; **Complete** → set marks ✓, rest timer starts, numpad dismisses, **no new set is created**. "Add Set" still adds one manually.
  - **Header dropdown**: switch between Dashboard/Food/Workout/Health/Settings; lands on each section's default sub-page.
  - **Contextual bottom nav**: each section shows its own sub-pages; sub-page `NavLink`s navigate and highlight correctly; detail pages (`/tdee`, `/exercises/:id`, `/apple-health`) still hide the header.
  - **FAB**: in each section the "+" opens the action sheet; Food → Search/Scan/Quick add/New recipe open the right screen+modal; Workout → Empty workout starts a session, From template lands on templates; Health → Log weight/Log measurement open the right form.
  - New **FoodRecipes** and **FoodTrends** load and render real data.
