# FitSelf — Health & Fitness App
> Comprehensive project plan and implementation blueprint

---

## 1. Project Overview

A self-hosted, full-stack Progressive Web App (PWA) for personal health and fitness tracking. Multi-user capable (household/invite-only). Supports metric and imperial units with a per-user toggle. Features include calorie/food logging with barcode scanning, workout logging with exercise library + video guides, body measurements tracking, Apple Health data sync, and a full health analytics dashboard.

Can be deployed as:
- A self-hosted Docker app on any machine or Home Assistant instance
- A native-feeling iOS app via Capacitor + sideloading (no App Store, no $99/year fee)

---

## 2. Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **PWA**: `vite-plugin-pwa` (Workbox) — offline support, installable on iOS/Android home screen
- **Native iOS Wrapper**: Capacitor 6 (wraps React app in WKWebView, unlocks HealthKit + push notifications)
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight, no boilerplate)
- **Charts**: Recharts (React-native, responsive)
- **UI/Styling**: Tailwind CSS + shadcn/ui components
- **Barcode Scanning**: `@zxing/library` (browser camera) / `@capacitor-mlkit/barcode-scanning` (native, faster)
- **Exercise Video/Image**: ExerciseDB V2 CDN URLs (self-hosted in DB after seeding, no runtime dependency)
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify (faster than Express, great TypeScript support)
- **Language**: TypeScript throughout
- **ORM**: Prisma
- **Authentication**: JWT (`@fastify/jwt`) + `bcryptjs` for password hashing (pure-JS, no native build)
- **File Uploads**: `@fastify/multipart` (for Apple Health XML import)
- **Validation**: Zod
- **Push Notifications**: web-push (VAPID for PWA) / Capacitor handles APNS when native

### Database
- **Primary**: PostgreSQL 16 (via Docker)
- **Migrations**: Prisma Migrate
- **Backups**: Automated daily pg_dump to a `/backups` volume

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Caddy (auto-HTTPS on local network, simpler than nginx for home use)
- **Home Assistant**: Docker alongside HA, or packaged as an HA Add-on (see Section 10)

---

## 3. Monorepo Structure

```
fitself/
├── apps/
│   ├── web/                         # React PWA frontend (also Capacitor source)
│   │   ├── public/
│   │   │   ├── manifest.json
│   │   │   └── icons/               # PWA icons (192x192, 512x512, maskable)
│   │   ├── src/
│   │   │   ├── components/          # Shared UI components
│   │   │   │   ├── ui/              # shadcn/ui base components
│   │   │   │   ├── charts/          # Recharts wrappers
│   │   │   │   ├── BarcodeScanner.tsx
│   │   │   │   └── ExerciseCard.tsx
│   │   │   ├── pages/               # Route-level pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Food.tsx
│   │   │   │   ├── Workout.tsx
│   │   │   │   ├── Health.tsx
│   │   │   │   ├── Measurements.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── stores/              # Zustand stores
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── foodStore.ts
│   │   │   │   ├── workoutStore.ts
│   │   │   │   └── settingsStore.ts # unit preference, active calorie toggle, etc.
│   │   │   ├── lib/
│   │   │   │   ├── api.ts           # Axios instance + typed request helpers
│   │   │   │   ├── units.ts         # metric ↔ imperial conversion helpers
│   │   │   │   ├── tdee.ts          # Mifflin-St Jeor TDEE + baseline calculator
│   │   │   │   ├── activities.ts    # MET table + calorie→activity suggestions
│   │   │   │   └── epley.ts         # 1RM estimation formula
│   │   │   ├── types/               # Shared TypeScript types
│   │   │   └── main.tsx
│   │   ├── ios/                     # Capacitor iOS project (auto-generated)
│   │   │   └── App/
│   │   ├── capacitor.config.ts
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                         # Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── food.ts
│       │   │   ├── recipes.ts
│       │   │   ├── goal-phases.ts
│       │   │   ├── workouts.ts
│       │   │   ├── exercises.ts     # Exercise library (local DB, seeded from ExerciseDB V2)
│       │   │   ├── health.ts
│       │   │   ├── measurements.ts
│       │   │   └── apple-health.ts
│       │   ├── plugins/             # Fastify plugins (auth, cors, etc.)
│       │   ├── services/            # Business logic layer
│       │   ├── lib/
│       │   │   ├── prisma.ts
│       │   │   ├── exercisedb.ts    # ExerciseDB V2 client (seed script only)
│       │   │   └── webpush.ts       # VAPID push notification sender
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts              # One-time bulk import from ExerciseDB V2 via RapidAPI
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.ha.yml            # Home Assistant Add-on variant
├── Caddyfile
├── .env.example
└── CLAUDE.md                        # This file
```

---

## 4. Docker Compose Setup

```yaml
# docker-compose.yml

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: fitself
      POSTGRES_USER: fitself
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fitself"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./apps/api
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://fitself:${DB_PASSWORD}@db:5432/fitself
      JWT_SECRET: ${JWT_SECRET}
      OPENFOODFACTS_BASE_URL: https://world.openfoodfacts.org
      USDA_API_KEY: ${USDA_API_KEY}
      EXERCISEDB_API_KEY: ${EXERCISEDB_API_KEY}
      VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY}
      VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY}
      ALLOW_REGISTRATION: ${ALLOW_REGISTRATION:-true}
      INVITE_TOKEN: ${INVITE_TOKEN:-}
      PORT: 3001
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3001:3001"

  web:
    build: ./apps/web
    restart: unless-stopped
    ports:
      - "3000:80"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  postgres_data:
  caddy_data:
  caddy_config:
```

```
# Caddyfile
fitself.local {
  handle /api/* {
    reverse_proxy api:3001
  }
  handle {
    reverse_proxy web:3000
  }
}
```

---

## 5. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String   @id @default(cuid())
  email            String   @unique
  passwordHash     String
  name             String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  profile          UserProfile?
  foodLogs         FoodLog[]
  recipes          Recipe[]
  goalPhases       GoalPhase[]
  workoutSessions  WorkoutSession[]
  workoutTemplates WorkoutTemplate[]
  weightEntries    WeightEntry[]
  measurements     BodyMeasurement[]
  healthImports    HealthImport[]
  pushSubscriptions PushSubscription[]
  refreshTokens    RefreshToken[]
}

model UserProfile {
  id                    String        @id @default(cuid())
  userId                String        @unique
  user                  User          @relation(fields: [userId], references: [id])
  birthDate             DateTime?
  heightCm              Float?
  goalWeightKg          Float?
  goalBodyFat           Float?        // target body-fat % (0–100); can derive goalWeightKg
  goalDate              DateTime?
  activityLevel         ActivityLevel @default(MODERATE)
  sex                   Sex?
  goalType              GoalType      @default(MAINTAIN)  // default goal when no GoalPhase is active
  unitSystem            UnitSystem    @default(METRIC)
  calorieGoal           Int?          // manual override; null = auto-calculate from TDEE
  // Default macro targets (grams/day). Used when no active phase overrides them.
  proteinTarget         Int?
  carbsTarget           Int?
  fatTarget             Int?
  macroTargetMode       MacroTargetMode @default(GRAMS) // how the user prefers to set macros
  countActiveCalories   Boolean       @default(false) // toggle: add Apple Watch active cals to budget
  updatedAt             DateTime      @updatedAt
}

enum MacroTargetMode {
  GRAMS    // user sets grams directly
  PERCENT  // user sets % of calories; UI converts to grams (P/C 4 kcal/g, F 9 kcal/g)
}

enum GoalType {
  LOSE      // target weight below current → calorie deficit
  GAIN      // target weight above current → calorie surplus
  MAINTAIN  // hold current weight → eat at TDEE
}

enum UnitSystem {
  METRIC    // kg, cm
  IMPERIAL  // lbs, ft/in
}

enum ActivityLevel {
  SEDENTARY     // x1.2
  LIGHT         // x1.375
  MODERATE      // x1.55
  ACTIVE        // x1.725
  VERY_ACTIVE   // x1.9
}

enum Sex {
  MALE
  FEMALE
  OTHER
}

// ─── FOOD TRACKING ───────────────────────────────────────────

model FoodLog {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  date        DateTime  @db.Date
  meal        MealType
  // A log entry references EITHER a food item OR a recipe (exactly one).
  foodItem    FoodItem? @relation(fields: [foodItemId], references: [id])
  foodItemId  String?
  recipe      Recipe?   @relation(fields: [recipeId], references: [id])
  recipeId    String?
  servingQty  Float     // servings of the food item or recipe
  createdAt   DateTime  @default(now())

  @@index([userId, date])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

model FoodItem {
  id          String     @id @default(cuid())
  barcode     String?    @unique
  name        String
  brand       String?
  servingSize Float      // grams per serving
  servingUnit String     @default("g")
  calories    Float
  protein     Float
  carbs       Float
  fat         Float
  fiber       Float?
  sugar       Float?
  sodium      Float?     // milligrams
  source      FoodSource @default(MANUAL)
  // Custom foods are scoped to a creator; library/API foods have null creator.
  createdById String?
  isCustom    Boolean    @default(false)
  logs        FoodLog[]
  recipeUses  RecipeIngredient[]
  createdAt   DateTime   @default(now())

  @@index([barcode])
  @@index([name])
}

enum FoodSource {
  MANUAL          // user-entered custom food
  OPEN_FOOD_FACTS
  USDA
}

// ─── RECIPES ─────────────────────────────────────────────────

model Recipe {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  description String?
  servings    Float    @default(1) // how many servings the full recipe yields
  ingredients RecipeIngredient[]
  logs        FoodLog[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, name])
}

model RecipeIngredient {
  id         String   @id @default(cuid())
  recipeId   String
  recipe     Recipe   @relation(fields: [recipeId], references: [id])
  foodItem   FoodItem @relation(fields: [foodItemId], references: [id])
  foodItemId String
  quantity   Float    // number of servings of the food item used in the recipe
}
// Recipe nutrition (per serving) is computed:
//   total = Σ ingredient(calories/protein/carbs/fat) × quantity
//   perServing = total / recipe.servings
// Compute on read, or cache on the Recipe and recalc when ingredients change.

// ─── EXERCISE LIBRARY ────────────────────────────────────────

model Exercise {
  id              String    @id @default(cuid())
  exerciseDbId    String?   @unique  // ExerciseDB V2 exerciseId for dedup
  name            String
  nameAlternative String?
  description     String?   // Overview text from ExerciseDB
  muscleGroup     String?   // e.g. "Chest", "Back", "Legs"
  musclesPrimary  String[]  // e.g. ["Pectoralis major"]
  musclesSecondary String[]
  equipment       String?   // "Barbell", "Dumbbell", "Bodyweight", etc.
  category        String?   // "Strength", "Cardio", "Stretching"
  imageUrl        String?   // CDN image URL from ExerciseDB
  videoUrl        String?   // CDN video URL from ExerciseDB (.mp4)
  gifUrl          String?   // CDN GIF animation URL from ExerciseDB
  isCustom        Boolean   @default(false) // user-created exercises
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  templateExercises TemplateExercise[]
  sessionExercises  SessionExercise[]
}

// ─── WORKOUT LOGGING ─────────────────────────────────────────

model WorkoutTemplate {
  id          String             @id @default(cuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id])
  name        String
  description String?
  exercises   TemplateExercise[]
  sessions    WorkoutSession[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model TemplateExercise {
  id              String          @id @default(cuid())
  templateId      String
  template        WorkoutTemplate @relation(fields: [templateId], references: [id])
  exerciseId      String
  exercise        Exercise        @relation(fields: [exerciseId], references: [id])
  defaultSets     Int             @default(3)
  defaultReps     Int?
  defaultWeightKg Float?
  restSeconds     Int?
  order           Int
}

model WorkoutSession {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id])
  templateId  String?
  template    WorkoutTemplate? @relation(fields: [templateId], references: [id])
  name        String
  startedAt   DateTime
  finishedAt  DateTime?
  notes       String?
  totalVolume Float?           // sum(weightKg × reps) across all sets
  exercises   SessionExercise[]
  createdAt   DateTime         @default(now())

  @@index([userId, startedAt])
}

model SessionExercise {
  id           String         @id @default(cuid())
  sessionId    String
  session      WorkoutSession @relation(fields: [sessionId], references: [id])
  exerciseId   String
  exercise     Exercise       @relation(fields: [exerciseId], references: [id])
  notes        String?        // per-exercise notes
  order        Int
  sets         ExerciseSet[]
}

model ExerciseSet {
  id                String          @id @default(cuid())
  sessionExerciseId String
  sessionExercise   SessionExercise @relation(fields: [sessionExerciseId], references: [id])
  setNumber         Int
  weightKg          Float
  reps              Int
  rpe               Float?          // Rate of Perceived Exertion 1–10
  isPersonalBest    Boolean         @default(false)
}

// ─── HEALTH / WEIGHT DATA ────────────────────────────────────

model WeightEntry {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  date      DateTime   @db.Date
  weightKg  Float
  bodyFat   Float?
  source    DataSource @default(MANUAL)
  createdAt DateTime   @default(now())

  @@unique([userId, date])
  @@index([userId, date])
}

// ─── GOAL PHASES (cut/bulk/maintain over date ranges) ────────

model GoalPhase {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  name           String   // "Summer Cut", "Winter Bulk", "Maintenance Block"
  goalType       GoalType
  startDate      DateTime @db.Date
  endDate        DateTime @db.Date
  targetWeightKg Float?   // optional target for the phase
  targetBodyFat  Float?   // optional target body-fat % for the phase
  weeklyRateKg   Float?   // optional explicit pace target (signed); else derived from target+dates
  // Optional per-phase overrides; fall back to profile defaults if null
  calorieTarget  Int?
  proteinTarget  Int?
  carbsTarget    Int?
  fatTarget      Int?
  cycleId        String?  // groups phases generated from one repeating cycle
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId, startDate, endDate])
}
// The "active" phase = the one whose [startDate, endDate] contains today.
// The calorie + pace engine (8.1 / 8.5) uses the active phase's goalType,
// target, and any overrides. If no phase covers today, it falls back to the
// profile's goalType / goalWeightKg / goalDate. Phases should not overlap;
// the API rejects overlapping ranges for the same user.

// ─── BODY MEASUREMENTS ───────────────────────────────────────

model BodyMeasurement {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      DateTime @db.Date
  // All stored in cm; convert to inches on display if imperial
  neck      Float?
  shoulders Float?
  chest     Float?
  leftArm   Float?
  rightArm  Float?
  waist     Float?
  hips      Float?
  leftThigh Float?
  rightThigh Float?
  leftCalf  Float?
  rightCalf Float?
  notes     String?
  createdAt DateTime @default(now())

  @@index([userId, date])
}

enum DataSource {
  MANUAL
  APPLE_HEALTH
  SHORTCUT
}

model HealthImport {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String
  importedAt  DateTime @default(now())
  recordCount Int
}

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String   @unique
  p256dh    String
  auth      String
  platform  String   @default("web") // "web" | "ios"
  createdAt DateTime @default(now())
}

// ─── AUTH (REFRESH TOKEN ROTATION) ───────────────────────────

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  tokenHash String   @unique   // store a hash, never the raw token
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
}
```

---

## 6. Units & Conversion

All values are **stored in metric** (kg, cm) in the database. Conversion happens in the API response layer and on the frontend.

```typescript
// apps/web/src/lib/units.ts

export const UNIT_LABELS = {
  METRIC:   { weight: 'kg', height: 'cm', distance: 'km', smallLength: 'cm' },
  IMPERIAL: { weight: 'lbs', height: 'ft/in', distance: 'mi', smallLength: 'in' },
}

export const toDisplay = (kg: number, system: UnitSystem) =>
  system === 'IMPERIAL' ? +(kg * 2.20462).toFixed(1) : kg

export const toKg = (value: number, system: UnitSystem) =>
  system === 'IMPERIAL' ? value / 2.20462 : value

export const cmToDisplay = (cm: number, system: UnitSystem) =>
  system === 'IMPERIAL' ? `${Math.floor(cm / 30.48)}'${Math.round((cm % 30.48) / 2.54)}"` : `${cm} cm`

export const inchesToCm = (inches: number) => inches * 2.54
```

The user's `unitSystem` preference is read from their profile on login and stored in `settingsStore`. Every component that displays a measurement uses the conversion helpers.

---

## 7. API Routes

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account (checks INVITE_TOKEN if registration locked) |
| POST | `/api/auth/login` | Login, sets httpOnly JWT cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Get current user + profile |
| PUT | `/api/auth/profile` | Update profile (units, goals, toggles, etc.) |

### Food
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/food/barcode/:barcode` | Lookup by barcode (local cache → Open Food Facts → USDA) |
| GET | `/api/food/search?q=` | Search food items by name (includes user's custom foods) |
| POST | `/api/food/items` | Create custom food item (optionally with a barcode to assign) |
| PUT | `/api/food/items/:id` | Edit a custom food item |
| GET | `/api/food/log?date=` | Get food log for date |
| POST | `/api/food/log` | Add entry (food item OR recipe) |
| PUT | `/api/food/log/:id` | Edit entry |
| DELETE | `/api/food/log/:id` | Delete entry |
| GET | `/api/food/stats?from=&to=` | Calorie + macro averages over range |

### Recipes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recipes` | List user's recipes (with computed per-serving nutrition) |
| GET | `/api/recipes/:id` | Get recipe with ingredients + nutrition breakdown |
| POST | `/api/recipes` | Create recipe (name, servings, ingredient list) |
| PUT | `/api/recipes/:id` | Update recipe / ingredients |
| DELETE | `/api/recipes/:id` | Delete recipe |

### Goal Phases
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goal-phases` | List all phases (past, active, upcoming) |
| GET | `/api/goal-phases/active` | The phase covering today (or profile default if none) |
| POST | `/api/goal-phases` | Create a phase (rejects overlaps) |
| POST | `/api/goal-phases/cycle` | Generate a repeating cycle → creates a series of phases |
| PUT | `/api/goal-phases/:id` | Update a phase |
| DELETE | `/api/goal-phases/:id` | Delete a phase (or whole cycle via `?cycle=true`) |

### Exercises
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/exercises?q=&muscle=&equipment=` | Search local exercise library |
| GET | `/api/exercises/:id` | Get single exercise (description, instructions, tips, imageUrl, videoUrl, gifUrl) |
| POST | `/api/exercises` | Create custom exercise |

### Workouts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workouts/templates` | List templates |
| POST | `/api/workouts/templates` | Create template |
| PUT | `/api/workouts/templates/:id` | Update template |
| DELETE | `/api/workouts/templates/:id` | Delete template |
| GET | `/api/workouts/sessions` | List sessions (paginated, filterable) |
| GET | `/api/workouts/sessions/:id` | Session with all sets |
| POST | `/api/workouts/sessions` | Start session |
| PUT | `/api/workouts/sessions/:id` | Update / finish session |
| GET | `/api/workouts/last/:exerciseId` | Last weights/reps for an exercise |
| GET | `/api/workouts/personal-bests` | All-time PRs per exercise |
| GET | `/api/workouts/volume?from=&to=` | Volume over time |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health/weight?from=&to=` | Weight entries |
| POST | `/api/health/weight` | Log weight |
| DELETE | `/api/health/weight/:id` | Delete entry |
| GET | `/api/health/stats` | Aggregated stats (7d/30d/90d loss, goal ETA, calorie avg) |
| POST | `/api/health/apple/import` | Upload + parse Apple Health XML export |
| POST | `/api/health/apple/shortcut` | iOS Shortcut webhook |

### Measurements
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/measurements?from=&to=` | Body measurements over range |
| POST | `/api/measurements` | Log a new measurement entry |
| PUT | `/api/measurements/:id` | Edit entry |
| DELETE | `/api/measurements/:id` | Delete entry |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/notifications/subscribe` | Register push subscription (PWA or Capacitor) |
| DELETE | `/api/notifications/subscribe` | Unsubscribe |
| PUT | `/api/notifications/preferences` | Set which notifications are enabled |

---

## 8. Feature Specifications

### 8.1 Food & Calorie Tracking

**Barcode Scanning**
- Browser: `@zxing/library` — accesses rear camera via `getUserMedia`
- Native (Capacitor iOS): `@capacitor-mlkit/barcode-scanning` — faster, no UI lag
- The component auto-detects platform and uses the appropriate scanner
- Flow: Scan → `GET /api/food/barcode/:barcode` → show result → confirm serving size → log
- If barcode not found: fallback to manual search or manual entry form

**Calorie Goal Calculation (Mifflin-St Jeor TDEE, goal-aware)**
```
BMR (male)   = (10 × weightKg) + (6.25 × heightCm) - (5 × age) + 5
BMR (female) = (10 × weightKg) + (6.25 × heightCm) - (5 × age) - 161

TDEE = BMR × activityMultiplier

// Energy density: 1 kg of body mass ≈ 7700 kcal  (1 lb ≈ 3500 kcal)
requiredWeeklyRateKg = (currentWeightKg - goalWeightKg) / weeksUntilGoal
  // positive = need to lose, negative = need to gain

dailyAdjustment = (requiredWeeklyRateKg × 7700) / 7

Goal target by type:
  LOSE      → Daily target = TDEE - dailyAdjustment
  GAIN      → Daily target = TDEE + |dailyAdjustment|
  MAINTAIN  → Daily target = TDEE

Safety floor: never set target below BMR. If the required rate would push the
target below BMR (LOSE) or imply an unrealistic surplus (GAIN), the app shows a
warning and suggests extending the goal date instead of capping silently.

If countActiveCalories = true:
  Daily budget = Daily target + todayActiveCaloriesFromAppleHealth
```
> The `goalWeightKg`, `goalDate`, and `goalType` used above come from the **active GoalPhase** (8.6) if one covers today, otherwise from the profile defaults. The same calc drives whichever phase is current — so a "Summer Cut" phase automatically produces a deficit target, and a "Winter Bulk" phase a surplus, with no manual switching.

**Custom Foods & Barcode Assignment**
- Create a food manually with name, brand, serving size/unit, and full macros (`POST /api/food/items`)
- During creation the user can **scan a barcode to attach to it** — so the next time anyone scans that product, the local custom food is returned instantly (no API lookup)
- Useful for local/regional products missing from Open Food Facts, or home staples
- Custom foods are flagged `isCustom` and scoped to their creator; they appear in search alongside library results
- Editable later via `PUT /api/food/items/:id`

**Custom Recipes**
- Build a reusable recipe from multiple food items, each with a quantity (e.g. "Chicken Stir Fry" = 200g chicken + 150g rice + 1 tbsp oil + veg)
- Set how many **servings** the recipe yields; the app computes per-serving calories and macros automatically
- Log a recipe like any food: pick it, choose how many servings you ate, done — it logs as a single tidy entry ("Chicken Stir Fry — 1 serving, 520 cal") rather than cluttering the log with each ingredient
- Editing a recipe's ingredients recalculates its nutrition; past logs keep the values they were logged with
- Recipe nutrition breakdown screen shows total + per-serving macros and a per-ingredient contribution list

**Macro Targets**
- User sets daily protein / carbs / fat targets, either as **grams** or as **% of calories** (`macroTargetMode`); the UI converts using 4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat
- Targets can be set globally (profile) or overridden per GoalPhase (a cut phase often wants higher protein)
- The food log shows three macro rings/bars (protein, carbs, fat) filling toward their targets alongside the calorie ring
- Over/under per macro is surfaced, not just calories, so users training for body composition can hit protein reliably

**Daily Food Log UI**
- Date picker at top (swipe left/right to change day)
- Four collapsible meal sections: Breakfast / Lunch / Dinner / Snacks
- Calorie ring showing eaten vs. goal with colour coding (green → yellow → red)
- Three macro rings/bars (protein / carbs / fat) filling toward their daily targets
- Add options per meal: search foods, scan barcode, pick a recipe, or quick-add a custom food
- Quick-add section: last 10 distinct logged items (foods + recipes)
- Each row: name, serving size (editable inline), calories; recipes show as one entry

---

### 8.2 Exercise Library

**Data Source: ExerciseDB V2 (AscendAPI) via RapidAPI**
- 11,000+ exercises with expert-validated data
- Accessed via RapidAPI — requires a free RapidAPI account + API key
- **Seed-only strategy**: `prisma/seed.ts` bulk-imports all exercises once at setup time, stored locally in the DB
- After seeding, the app never calls ExerciseDB again at runtime — zero runtime API dependency
- Rate limit strategy: seed script throttles requests to stay within the free tier (10 req/day) across multiple days, or use a one-month Basic plan (~$10) for a fast one-time import, then downgrade

**What ExerciseDB V2 provides per exercise:**
```json
{
  "exerciseId": "exr_...",
  "name": "Lever Pec Deck Fly",
  "imageUrl": "https://cdn.exercisedb.dev/...",   // HD image
  "videoUrl": "https://cdn.exercisedb.dev/...",   // MP4 video
  "equipments": ["LEVERAGE MACHINE"],
  "bodyParts": ["CHEST"],
  "targetMuscles": ["Pectoralis Major Clavicular Head"],
  "secondaryMuscles": ["Deltoid Anterior"],
  "exerciseType": "STRENGTH",
  "overview": "...",
  "instructions": ["Step 1...", "Step 2..."],
  "exerciseTips": ["Tip 1...", "Tip 2..."],
  "variations": ["Cable Crossover", "Incline Dumbbell Fly"],
  "relatedExerciseIds": ["exr_...", "exr_..."]
}
```
- **No YouTube API needed** — ExerciseDB hosts its own MP4 videos on a CDN

**Exercise Card (UI)**
- Name, body part + muscle group badges, equipment tag, exercise type
- Overview description
- HD image + inline MP4 video player (from ExerciseDB CDN)
- Step-by-step instructions (numbered list)
- Coaching tips (collapsible)
- Exercise variations (tappable — navigates to that exercise)
- Related exercises row (horizontal scroll)

**Custom Exercises**
- User can create their own exercises with name, muscle group, notes
- Custom exercises appear alongside library exercises in search
- `isCustom: true` flag keeps them clearly scoped to the user

---

### 8.3 Workout Logging

**Template Builder**
- Name the workout + optional description
- Add exercises by searching the library (filter by muscle group, equipment)
- Set defaults: sets, reps, weight, rest timer
- Drag-and-drop to reorder exercises
- Template shows "last performed X days ago" on the start screen

**Active Workout Session**
- Elapsed timer (from `startedAt`)
- Exercises listed in template order
- Each set row: `[Weight] × [Reps] [RPE?] [✓]`
- Grey "ghost" row below each input shows the previous session's value
- If it's the user's first time doing an exercise, show template defaults
- Rest timer: after ticking a set complete, optional countdown (user-configured per template exercise)
- "Add Set" button per exercise
- Per-exercise notes via a collapsible text area (tap note icon)
- Swipe left on an exercise to reveal "View Guide" → opens Exercise Card with description + video
- "Finish Workout" saves everything, calculates total volume, checks PRs

**Personal Best Detection**
```
Epley 1RM = weightKg × (1 + reps / 30)

After each session finishes:
  For each exercise, compare max Epley 1RM to all historical sets
  If new max → mark isPersonalBest = true, show trophy in summary + history
```

**Workout History**
- Chronological list of past sessions
- Each card: name, date, duration, total volume, # PRs
- Tap to expand: full exercise/set breakdown with notes
- Filter: by template, date range, muscle group

**Volume & Progress Charts**
- Total session volume over time (line chart, filter by template)
- Per-exercise max weight over time (select exercise → see trend)
- Time periods: 4 weeks / 3 months / 6 months / 1 year

---

### 8.4 TDEE Calculator / Baseline Helper

A standalone interactive tool (accessible from onboarding and from Settings/Health anytime) that gives the user a calorie *baseline* to start from. Pure client-side math in `lib/tdee.ts` — no backend call needed.

**Inputs**
- Age, sex, height, current weight (pre-filled from profile if available)
- Activity level selector with plain-language descriptions, not just labels:
  - Sedentary (desk job, little exercise) — ×1.2
  - Light (light exercise 1–3 days/week) — ×1.375
  - Moderate (exercise 3–5 days/week) — ×1.55
  - Active (hard exercise 6–7 days/week) — ×1.725
  - Very Active (physical job + training) — ×1.9

**Outputs (shown as ranges, not false-precision single numbers)**
```
BMR              = Mifflin-St Jeor (calories burned at complete rest)
Maintenance TDEE = BMR × activityMultiplier  (± ~100 cal range shown)
Mild loss        = TDEE − 250   (~0.5 lb/week)
Moderate loss    = TDEE − 500   (~1 lb/week)
Mild gain        = TDEE + 250   (~0.5 lb/week)
Moderate gain    = TDEE + 500   (~1 lb/week)
```
- Displays a small table: each row a pace, each with its calorie target and expected weekly result
- Shows estimated daily calories burned at each activity level so the user sees how movement shifts the baseline
- Copy explaining these are **estimates** — the real number is dialed in over 2–3 weeks by comparing predicted vs. actual weight change (this is exactly what the Pace Adjustment Stat does)

**How it ties together**
The calculator sets the initial baseline → the user eats at that target for a couple weeks → the Pace Adjustment Stat (8.5) measures their *actual* rate and corrects the target based on real data. The calculator is the starting estimate; the pace stat is the ongoing fine-tuning. One CTA on the calculator: "Use this as my goal" → writes the target into the profile.

---

### 8.5 Health Data Section

**Stats Calculated Server-Side**
```
7-day loss    = avg_weight(last 7 entries) vs avg_weight(prior 7 entries)
30-day loss   = linear regression start vs end over 30-day window
90-day loss   = same
Weekly avg    = rolling 7-day moving average of weight entries
Goal ETA      = (currentWeight - goalWeight) / weeklyAvgLoss  → projected date
Calorie avg   = avg daily calories from food logs (last 7 / 30 days)

Pace adjustment (returned by /api/health/stats):
  currentWeeklyRate  = signed weekly change from rolling average
  requiredWeeklyRate = (currentWeight - goalWeight) / weeksUntilGoal
  rateGap            = requiredWeeklyRate - currentWeeklyRate
  dailyCalorieDelta  = (rateGap × kcalPerUnit) / 7   // 3500 lb / 7700 kg
  onTrack            = |rateGap| within a small tolerance band
  safeRate           = boolean — is requiredWeeklyRate within healthy limits
```

**Weight Trend Chart**
- Scatter: raw daily weigh-ins (small dots, muted colour)
- Line: 7-day rolling average (bold)
- Dashed horizontal: goal weight
- Dotted projection: extrapolated trend from today → goal weight date

**Body Composition Charts** (when body-fat data exists)
- Body-fat % trend over time with goal body-fat % as a dashed line
- Lean-mass trend (weight × (1 − bodyFat%)) — confirms muscle is being preserved during a cut
- Fat-mass trend — the number that should actually be dropping on a cut

**Dashboard Stat Cards**
- Lost in 7 days / 30 days / 90 days
- Current weekly average loss
- Goal weight + estimated achievement date
- Average calorie intake (last 7 days) vs goal

**Goal Selector & Guidance**
The user picks one of three goals (stored as `UserProfile.goalType`). Each shows tailored guidance:

- **Lose Weight** — sets a calorie deficit. Guidance: recommended safe rate (~0.5–1% bodyweight/week), protein target to preserve muscle, reminder that the trend line matters more than daily fluctuations.
- **Gain Weight** — sets a calorie surplus. Guidance: lean-gain rate (~0.25–0.5 lb/week), emphasis on progressive overload in the workout section, protein target.
- **Maintain Weight** — eats at TDEE. Guidance: focus on body recomposition via training, weight stability band (±X) rather than a single number.

**Body Fat Goal → Target Weight Calculator**
Instead of guessing a goal weight, the user can enter their current/estimated body-fat % and a target body-fat %, and the app calculates the goal weight needed — assuming lean mass is preserved (the point of a well-run cut).

```
Lean Body Mass (LBM) = currentWeight × (1 − currentBodyFat%)
Goal Weight          = LBM / (1 − goalBodyFat%)
Fat to lose          = currentFatMass − goalFatMass
  where currentFatMass = currentWeight × currentBodyFat%
        goalFatMass     = goalWeight   × goalBodyFat%
```

**Worked example (imperial):**
```
Current: 200 lb at 25% body fat, goal 15%
LBM        = 200 × (1 − 0.25) = 150 lb
Goal weight = 150 / (1 − 0.15) = 176.5 lb
Fat to lose = (200 × 0.25) − (176.5 × 0.15) = 50 − 26.5 = 23.5 lb
→ "To reach 15% body fat while keeping your lean mass, aim for ~176.5 lb — about 23.5 lb of fat to lose."
```

- **Current body fat** is pulled from the latest `WeightEntry.bodyFat` if available, or entered manually in the calculator
- Output: target weight, lean mass, fat mass now vs. at goal, and total fat to lose
- A "Use as my goal weight" button writes the result into `goalWeightKg` (or the active phase's `targetWeightKg`), so the whole pace/calorie engine then works toward it
- Stored separately: `goalBodyFat` on the profile (and optionally per GoalPhase), so the goal can be expressed in body-fat terms and the target weight recomputed if current composition changes
- **Caveat shown to user**: this assumes 100% lean-mass retention, which is the ideal case. Real cuts lose a little lean mass and bulks add some, so treat the number as a well-grounded target that the body-fat trend will refine over time
- Since `WeightEntry.bodyFat` is already tracked, the Health section also shows a **body-fat % trend** and a **lean-mass trend** alongside the weight chart, so progress toward the body-fat goal is visible, not just scale weight

**Pace Adjustment Stat (the key feature)**
Compares the user's *actual* weekly rate to the rate *required* to hit their goal by the target date, then converts the gap into a daily calorie adjustment:

```
currentWeeklyRate  = signed weekly change from the 7-day rolling average (lbs or kg)
requiredWeeklyRate = (currentWeight - goalWeight) / weeksUntilGoal   // signed

rateGap            = requiredWeeklyRate - currentWeeklyRate          // how far off pace

// Convert the gap to calories (1 lb ≈ 3500 kcal, 1 kg ≈ 7700 kcal)
weeklyCalorieDelta = rateGap × (unitSystem === IMPERIAL ? 3500 : 7700)
dailyCalorieDelta  = weeklyCalorieDelta / 7
```

**Worked example (LOSE goal, imperial):**
```
Losing 1.3 lb/week now, need 1.7 lb/week to hit goal on time.
rateGap            = 1.7 - 1.3 = 0.4 lb/week
weeklyCalorieDelta = 0.4 × 3500 = 1,400 kcal/week
dailyCalorieDelta  = 1,400 / 7  = 200 kcal/day
→ "You're 0.4 lb/week behind pace. Cut ~200 cal/day (or burn the equivalent) to stay on track for [date]."
```

**Messaging by goal type:**
- **LOSE, behind pace** → "Cut ~N cal/day or add activity to reach your goal by [date]."
- **LOSE, ahead of pace** → "You're ahead of schedule — you could eat ~N more cal/day and still hit [date]." (discourages over-restriction)
- **GAIN, behind pace** → "Add ~N cal/day to reach your goal by [date]."
- **MAINTAIN** → "You're trending ±N lb/week. Adjust by ~M cal/day to hold steady."

**Guardrails (wellbeing):**
- If the required rate exceeds a safe threshold (>1% bodyweight/week for loss), show: "This timeline needs an aggressive rate. Consider extending your goal date." rather than recommending an extreme deficit.
- Never recommend a daily target below BMR.
- Frame everything around the rolling average, not single weigh-ins, so normal daily water-weight swings don't trigger alarming swings in the number.

**Actionable "How to hit it" Suggestions**
The daily calorie delta is abstract on its own, so the app translates it into concrete options the user can pick from. It offers a mix of *move more* and *eat less* so it never pushes restriction alone.

Activity suggestions use **METs** (Metabolic Equivalent of Task), personalized to the user's body weight, so the time estimates are realistic:
```
caloriesPerMinute = MET × 3.5 × weightKg / 200
minutesNeeded     = targetBurn / caloriesPerMinute
```

A small MET reference table lives in `lib/activities.ts`:
```
Walking (brisk, 3.5 mph)   ~4.3 MET
Walking (casual, 2.5 mph)  ~3.0 MET
Jogging (5 mph)            ~8.0 MET
Cycling (moderate)         ~8.0 MET
Swimming (moderate)        ~6.0 MET
Elliptical (moderate)      ~5.0 MET
Bodyweight circuit         ~5.0 MET
Yoga                       ~3.0 MET
```

**Example output for a 180 lb (82 kg) user needing to burn/cut ~100 cal/day:**
```
To close today's ~100 cal gap, you could:
  🚶 Walk briskly for ~20 min
  🚴 Cycle for ~10 min
  🍽️ Or trim ~100 cal from intake (e.g. skip the sugary drink, smaller portion)
  🔀 Or split it — a 10-min walk + a small food swap
```

- The split option is shown first when the delta is large, so it never frames the whole gap as something to remove from food.
- If `countActiveCalories` is on and Apple Health shows the user already hit the activity, the suggestion auto-updates ("You've already walked enough today — you're on pace").
- Suggestions are presented as *options*, never prescriptions, and always include the "you're already on track, no action needed" state when within the tolerance band.

**Calorie Deficit/Surplus Widget**
- Shows TDEE, current calorie target, and avg actual intake (7-day)
- "At your current pace you're {losing|gaining} ~X {lb|kg}/week"
- "You'll hit your goal in approximately X weeks (by [date])"
- The pace adjustment stat above, front and center, with the "how to hit it" suggestions

---

### 8.6 Goal Phases & Cycles

Lets the user plan goals across time instead of one open-ended goal. Each phase is a dated block with its own goal type and (optional) targets. The calorie + pace engine automatically follows whichever phase is active today.

**Defining a phase**
- Name (e.g. "Summer Cut"), goal type (Lose / Gain / Maintain), start date, end date
- Optional: target weight for the phase, explicit weekly rate, calorie override, macro overrides
- Phases can't overlap (the API rejects overlapping ranges); gaps are fine and fall back to the profile default goal

**Example: seasonal plan**
```
Apr 1 – Jun 1   "Spring Cut"      LOSE,  target 175 lb
Jun 1 – Sep 1   "Summer Maintain" MAINTAIN
Sep 1 – Dec 1   "Winter Bulk"     GAIN,  +0.4 lb/week
```
On any given day the dashboard shows the active phase, its target, days remaining, and progress toward the phase target.

**Cycles (repeating phases)**
For users who alternate (e.g. a month cutting, a month bulking), the cycle generator creates a series of phases from a pattern instead of entering each by hand:
```
POST /api/goal-phases/cycle
{
  "startDate": "2026-06-01",
  "blocks": [
    { "name": "Cut",  "goalType": "LOSE", "weeks": 4, "weeklyRateKg": -0.45 },
    { "name": "Bulk", "goalType": "GAIN", "weeks": 4, "weeklyRateKg":  0.23 }
  ],
  "repeat": 4          // → 8 phases total (4 cut + 4 bulk blocks alternating)
}
```
- All generated phases share a `cycleId` so they can be edited or deleted as a group
- The user sees the whole cycle on a timeline and can tweak any individual block

**UI**
- Timeline/calendar view of all phases (past = muted, active = highlighted, upcoming = outlined)
- "Active phase" card on the Dashboard and Health page: name, goal type, target, days left, on-pace status
- Create phase form + a separate "Create cycle" wizard
- When a phase transitions (today crosses into a new phase), the calorie target and macro targets update automatically; an optional notification announces the switch ("Winter Bulk starts today — new target 2,800 cal")

**How it drives the rest of the app**
- `GET /api/goal-phases/active` resolves the current phase (or profile fallback)
- The TDEE/calorie calc (8.1) and pace adjustment stat (8.5) read the active phase's goalType + target instead of the static profile goal
- Macro targets follow the active phase's overrides if set

---

### 8.7 Body Measurements Section

**Log Entry UI**
- Tap "Add Measurement" → form with all body sites
- Only fill in what you have — no fields are required beyond the date
- Shows silhouette diagram with labels for each measurement point (visual guide)

**History & Charts**
- Per-measurement trend charts (waist, chest, arms, etc. over time)
- Summary table: latest values, change vs. 30 days ago, change vs. all time
- Units toggle: cm ↔ inches respects the user's global unit preference

---

### 8.8 Dashboard (Home Screen)

Glanceable daily summary:

- **Calorie Ring**: eaten / goal, tappable → Food page
- **Macro Bar**: protein / carbs / fat progress
- **Weight Card**: last entry + 7-day change (↓ green / ↑ red)
- **Active Session Banner**: if a workout is in progress → "Continue Workout"
- **Workout Suggestion**: "It's been 4 days since Push Day" → "Start" button
- **Weekly Calories Sparkline**: 7-day bar chart, goal line overlay
- **Streak Counter**: consecutive days with a food log entry
- **Steps Card** (if Apple Health connected): today's steps

---

## 9. Apple Health Integration

> ⚠️ **HealthKit is native-only.** A web browser/PWA cannot access it directly.
> When the app is wrapped with Capacitor and sideloaded as an iOS app,
> `@capacitor-community/health-kit` gives **full direct HealthKit access**.
> For the PWA-only path, use Strategy A or B below.

### PWA Strategy A — iOS Shortcut Automation (Recommended for PWA)
User sets up a free iOS Shortcut that runs automatically each morning:
1. Reads today's weight, steps, active calories, sleep from Health app
2. POSTs to `https://fitself.local/api/health/apple/shortcut`

The app ships a downloadable `.shortcut` file with setup instructions.

```json
// Shortcut POST body
{
  "token": "user-api-token",
  "weight_kg": 82.5,
  "steps": 9200,
  "active_calories": 450,
  "resting_calories": 1800,
  "sleep_hours": 7.5,
  "date": "2026-05-29"
}
```

### PWA Strategy B — Apple Health XML Export
- User exports from Health app → shares ZIP to the FitSelf import page
- Backend parses with `xml2js`; deduplicates by date before inserting

**Fields parsed:**
- `HKQuantityTypeIdentifierBodyMass` → WeightEntry
- `HKQuantityTypeIdentifierStepCount` → daily steps
- `HKQuantityTypeIdentifierActiveEnergyBurned` → active calories
- `HKQuantityTypeIdentifierBasalEnergyBurned` → resting calories
- `HKQuantityTypeIdentifierSleepAnalysis` → sleep

### Native (Capacitor) Strategy — Direct HealthKit
When running as the sideloaded iOS app:
- `@capacitor-community/health-kit` reads data live from HealthKit
- No shortcuts or exports needed
- App requests HealthKit permissions on first launch
- Syncs in the background on app open

---

## 10. iOS App — Capacitor + Free Sideloading

### How It Works
**Capacitor** wraps the React app in a WKWebView shell, producing a real Xcode project. You build it like any iOS app — it just happens to render your web code. The result is a `.ipa` file that can be installed on your iPhone without the App Store.

**AltStore** is a free app that sideloads `.ipa` files onto your iPhone. You run **AltServer** (free, Mac or Windows) on your computer, and when your phone and computer are on the same Wi-Fi, AltStore re-signs the app automatically every 7 days.

### Step-by-Step: From Code to iPhone

```bash
# 1. Install Capacitor into the web app
cd apps/web
npm install @capacitor/core @capacitor/ios
npm install @capacitor-community/health-kit  # direct HealthKit access
npm install @capacitor-mlkit/barcode-scanning # fast native barcode scan

# 2. Build the React app
npm run build

# 3. Add the iOS Capacitor project (one-time)
npx cap add ios

# 4. Copy web build into the iOS project
npx cap copy ios

# 5. Open in Xcode (requires macOS + Xcode installed, both free)
npx cap open ios
```

In Xcode:
- Sign in with your **free Apple ID** (Xcode → Settings → Accounts)
- Select your iPhone as the target device
- Set the bundle ID to something unique: `com.yourname.fitself`
- Hit the ▶ Play button — Xcode builds and installs directly to your phone

**Trust the app**: Settings → General → VPN & Device Management → tap your Apple ID → Trust

### Free Apple ID Limitations (vs $99 Developer Account)
| Feature | Free Apple ID | Paid ($99/yr) |
|---------|-------------|---------------|
| Install on your own devices | ✅ Yes | ✅ Yes |
| Re-sign needed | Every 7 days | Every 1 year |
| Number of apps at once | 3 | Unlimited |
| Distribute to others | ❌ No | ✅ TestFlight/App Store |
| Push notifications (APNS) | ❌ No | ✅ Yes |
| Direct HealthKit | ✅ Yes | ✅ Yes |

> **Re-signing every 7 days** sounds annoying but AltStore automates it silently when your phone is on the same Wi-Fi as your computer running AltServer. You never notice it.

> **Push notifications** don't work with a free account. For the self-hosted use case this is fine — the web PWA supports push (VAPID) on Android/desktop, and for iOS reminders the iOS Shortcuts automation can trigger local notifications natively.

### AltStore Setup (One-Time)
1. Download **AltServer** at altstore.io (free, Mac or Windows)
2. Connect iPhone via USB, install AltStore onto it from AltServer menu
3. In AltStore on your iPhone: tap + → select your built `.ipa` file
4. AltServer re-signs automatically while on same Wi-Fi

### capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.fitself',
  appName: 'FitSelf',
  webDir: 'dist',
  server: {
    // Point to your self-hosted server so the native app talks to your backend
    url: 'https://fitself.local',
    cleartext: false,
  },
  plugins: {
    HealthKit: {
      // HealthKit permissions requested on first launch
      readPermissions: [
        'HKQuantityTypeIdentifierBodyMass',
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKQuantityTypeIdentifierBasalEnergyBurned',
        'HKCategoryTypeIdentifierSleepAnalysis',
      ],
      writePermissions: ['HKQuantityTypeIdentifierBodyMass'],
    },
  },
};

export default config;
```

---

## 11. Third-Party APIs & Keys Required

| Service | Purpose | Cost | Key |
|---------|---------|------|-----|
| **Open Food Facts** | Barcode → nutrition | Free, no key | None |
| **USDA FoodData Central** | Generic food search fallback | Free | Free at api.nal.usda.gov |
| **ExerciseDB V2 (AscendAPI)** | Exercise library — 11k+ exercises with videos, images, instructions, tips | Free tier (seed-only use) via RapidAPI | Free at rapidapi.com |
| **web-push (VAPID)** | PWA push notifications | Free (self-generated keys) | Generate with `npx web-push generate-vapid-keys` |

```env
# .env
DB_PASSWORD=changeme_strong_password
JWT_SECRET=generate_with_openssl_rand_base64_64
USDA_API_KEY=your_key_here
EXERCISEDB_API_KEY=your_rapidapi_key_here  # Only used by seed script
VAPID_PUBLIC_KEY=generated_key
VAPID_PRIVATE_KEY=generated_key
APP_URL=https://fitself.local
ALLOW_REGISTRATION=true
INVITE_TOKEN=                   # set a value to lock registration to invite-only
```

---

## 12. Home Assistant Integration

### Option A — Docker on the Same Machine (Simplest)
Run `docker-compose up -d` on the same host as Home Assistant. Access via the machine's local IP or hostname. No HA config needed.

### Option B — HA Add-on
Package as a proper Add-on for install via the HA Add-on Store UI:
```
ha-addon-fitself/
├── config.yaml    # Add-on manifest (ports, ingress config)
├── Dockerfile
├── run.sh
└── apparmor.txt
```
`config.yaml` enables HA Ingress so FitSelf appears in the HA sidebar with single sign-on. Best experience for heavy HA users.

### Option C — HA Dashboard Iframe Card
Minimal integration: add a webpage card in your HA dashboard pointing to the FitSelf URL. Also optionally expose REST sensors in HA that poll FitSelf's `/api/health/stats` endpoint — lets you build HA automations like "if today's calories < 500 by 7pm, send a notification."

---

## 13. PWA Configuration

```json
// public/manifest.json
{
  "name": "FitSelf",
  "short_name": "FitSelf",
  "description": "Personal health & fitness tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Offline Strategy (Workbox)**
- Cache-first: static assets (JS, CSS, icons)
- Network-first: API calls, with stale-while-revalidate fallback for GET requests
- Background sync queue: write operations (log food / log workout set) when offline → syncs on reconnect
- Offline banner shown in UI when no network detected

**Push Notifications (PWA)**
- VAPID self-hosted — no third-party push service needed
- Notification types (user toggles each in Settings):
  - Daily weight reminder (configurable time)
  - Log food reminder (if no entry by a set time)
  - Workout due reminder (based on template frequency)
  - Calorie goal warning (if under-eating by evening)
- On iOS via Capacitor: uses APNS instead (requires paid Apple Developer account) — for free/sideloaded builds, iOS Shortcuts can fire local notifications as a workaround

---

## 14. Authentication & Multi-User

- JWT in `httpOnly` cookie (not localStorage)
- Refresh token rotation, 7-day sliding expiry
- Multiple users fully supported — all data is user-scoped at DB level
- Registration modes (controlled by env vars):
  - `ALLOW_REGISTRATION=true` → open registration
  - `ALLOW_REGISTRATION=false` + `INVITE_TOKEN=xyz` → invite-only (share the token with household members)
- Admin role reserved for future use (first registered user gets it)

---

## 15. Implementation Phases

### Phase 1 — Foundation (Week 1–2)
- [ ] Monorepo scaffold (Vite + React + Fastify + TypeScript)
- [ ] Docker Compose + Postgres + Caddy
- [ ] Prisma schema + migrations + seed script scaffold (ExerciseDB V2)
- [ ] Auth (register, login, JWT, profile)
- [ ] Bottom nav shell: Dashboard / Food / Workout / Health / Settings
- [ ] Unit system toggle in Settings (metric/imperial), units helper lib
- [ ] PWA manifest + service worker

### Phase 2 — Food Tracking (Week 2–3)
- [ ] Open Food Facts + USDA integration
- [ ] Local food item cache
- [ ] Barcode scanner component (ZXing, with Capacitor native path)
- [ ] Custom food creation + barcode assignment
- [ ] Custom recipes (ingredients → computed per-serving nutrition, log as one entry)
- [ ] Macro targets (grams or % mode) + per-macro rings on the food log
- [ ] Daily food log CRUD (food items + recipes)
- [ ] TDEE + calorie goal calculation (with active calories toggle)
- [ ] TDEE Calculator / Baseline Helper tool (standalone, with pace ranges)
- [ ] Food log UI: meals, calorie ring, macro rings, quick-add

### Phase 3 — Exercise Library (Week 3)
- [ ] ExerciseDB V2 seed script (run at `prisma db seed`, throttled to respect rate limits)
- [ ] Exercise search API + UI (filter by muscle/equipment)
- [ ] Exercise detail page (description, image, inline MP4 video, instructions, tips, variations)
- [ ] Custom exercise creation

### Phase 4 — Workout Logging (Week 3–4)
- [ ] Template builder (drag-and-drop exercise order)
- [ ] Active session screen (timer, sets, last-session ghost values, rest timer)
- [ ] Per-exercise notes
- [ ] Finish workout → volume calc → PR detection
- [ ] Workout history list + session detail
- [ ] Volume & max weight charts

### Phase 5 — Health & Measurements (Week 4–5)
- [ ] Weight entry CRUD
- [ ] Rolling average + 7d/30d/90d stats
- [ ] Weight trend chart (scatter + moving avg + projection)
- [ ] Body measurements CRUD
- [ ] Per-measurement trend charts
- [ ] Body fat goal → target weight calculator (LBM-preservation) + BF/lean-mass trends
- [ ] Goal ETA calculation + calorie deficit/surplus widget
- [ ] Goal selector (Lose / Gain / Maintain) with per-goal guidance
- [ ] Pace adjustment stat (rate gap → daily calorie delta) + safe-rate guardrails
- [ ] "How to hit it" suggestion engine (MET-based activity options + food swaps)
- [ ] Goal phases (dated cut/bulk/maintain blocks) + active-phase resolution
- [ ] Goal cycle generator (repeating cut/bulk blocks sharing a cycleId)
- [ ] Phase timeline UI + active-phase card; engine reads active phase

### Phase 6 — Apple Health & iOS App (Week 5–6)
- [ ] Apple Health XML parser + import page
- [ ] iOS Shortcut template + downloadable `.shortcut` file + docs
- [ ] Capacitor iOS project setup
- [ ] HealthKit plugin integration (native path)
- [ ] AltStore build + sideloading documentation in README
- [ ] Push notification service (VAPID) + notification preferences UI

### Phase 7 — Polish & HA (Week 6–7)
- [ ] Dashboard widgets (all sections)
- [ ] Offline background sync
- [ ] Dark/light mode (default dark)
- [ ] Home Assistant Add-on packaging
- [ ] Mobile gesture polish (swipe navigation, haptic feedback via Capacitor)
- [ ] Performance audit (Lighthouse PWA score target: 95+)

---

## 16. Pre-Build Gotchas & Decisions

> Read this before you start. These are the things most likely to cost you hours.

### 1. HTTPS + `.local` domain → service workers won't run without a trusted cert ⚠️ (most important)
PWAs **require a secure context**. Service workers, the install prompt, and push notifications all silently fail over plain HTTP or an untrusted cert. Caddy **cannot** get a Let's Encrypt cert for a `.local` hostname — it falls back to its own internal self-signed CA, which browsers and iOS distrust by default. Pick one:
- **Easiest**: Use a real domain you own (even for LAN-only use) and Caddy's DNS-01 challenge (e.g. via Cloudflare DNS) to get a valid public cert. Point the domain at your server's local IP. This is the cleanest path and makes the iOS/Capacitor story painless.
- **Free but manual**: Keep `.local`, but install Caddy's root CA certificate on every device (Mac/iPhone) that will use the app. On iOS this means installing **and** trusting the profile under Settings → General → About → Certificate Trust Settings.
- **Tailscale option**: Put the server on a Tailscale network and use Tailscale's HTTPS certs — trusted, no manual CA install, works remotely.

### 2. Frontend API base URL
The `web` service no longer sets `VITE_API_URL`. Because Caddy proxies `/api/*` to the backend on the same origin, the frontend should call **relative** paths (`/api/...`) via the Axios `baseURL: '/api'`. This avoids CORS entirely and means no build-time env var is needed. (If you ever serve the API on a different origin, you'll need to reintroduce a build-time var and CORS config.)

### 3. Capacitor `server.url` — don't point it at the remote server
The sample `capacitor.config.ts` sets `server.url` to your backend. **Loading the entire web app from a remote URL breaks offline support and is fragile over mDNS (`.local` rarely resolves on iOS).** Recommended instead:
- **Bundle the web assets** into the app (omit `server.url` so it loads the local `dist/` build)
- Point only your **API calls** at the backend by setting the Axios `baseURL` to the backend's full HTTPS URL (e.g. `https://fitself.yourdomain.com/api`) at build time
- This keeps HealthKit + offline working and is the standard Capacitor pattern

### 4. HealthKit plugin config key
Verify the exact config key and method names against the installed version of `@capacitor-community/health-kit` — the plugin key in `capacitor.config.ts` and the permission identifiers can differ slightly between versions. Treat the sample as a starting point and check the plugin's README after install.

### 5. Open Food Facts requires a User-Agent
Open Food Facts asks every client to send a descriptive `User-Agent` header (e.g. `FitSelf/1.0 (your-email)`). Requests without one may be rate-limited or rejected. Set it on the Axios instance in `lib` that calls OFF.

### 6. ExerciseDB seed is one-time and rate-limited
Don't put the ExerciseDB call in any runtime route. The seed script is the only place it's used. On the free tier, build the seed script to be **resumable** (track which page/offset succeeded, sleep between requests, and skip already-imported `exerciseDbId`s) so a rate-limit 429 doesn't force you to restart from scratch.

### 7. Postgres `@db.Date` + one-weigh-in-per-day
`WeightEntry` has `@@unique([userId, date])`, so a second weigh-in on the same day must **upsert** (overwrite), not insert, or you'll hit a unique-constraint error. Decide if that's the behavior you want (it's reasonable) and use `prisma.weightEntry.upsert` accordingly.

### 8. Minor cleanups
- Remove the obsolete `version: "3.9"` line from `docker-compose.yml` (Compose v2 ignores it and warns).
- Notification preferences (Section 13) have an endpoint but no storage — add a `notificationPrefs Json?` field to `UserProfile` if you build that feature.
- The "Week 1–7" phase labels are logical milestones, not a literal schedule — with an AI assistant you'll move much faster. Build in phase order so each layer has working foundations beneath it.

---

## 17. Key Dependencies

### Frontend (`apps/web`)
```json
{
  "dependencies": {
    "react": "^18",
    "react-router-dom": "^6",
    "zustand": "^4",
    "recharts": "^2",
    "axios": "^1",
    "@zxing/library": "^0.20",
    "tailwindcss": "^3",
    "date-fns": "^3",
    "clsx": "^2",
    "@capacitor/core": "^6",
    "@capacitor/ios": "^6",
    "@capacitor-community/health-kit": "^3",
    "@capacitor-mlkit/barcode-scanning": "^6",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8"
  },
  "devDependencies": {
    "vite": "^5",
    "vite-plugin-pwa": "^0.19",
    "workbox-window": "^7",
    "@capacitor/cli": "^6"
  }
}
```

### Backend (`apps/api`)
```json
{
  "dependencies": {
    "fastify": "^4",
    "@fastify/jwt": "^8",
    "@fastify/cookie": "^9",
    "@fastify/cors": "^9",
    "@fastify/multipart": "^8",
    "prisma": "^5",
    "@prisma/client": "^5",
    "bcryptjs": "^2",
    "zod": "^3",
    "xml2js": "^0.6",
    "axios": "^1",
    "web-push": "^3",
    "node-cron": "^3"
  }
}
```

---

*Last updated: 2026-05-29 | Status: Planning complete — ready to build*
