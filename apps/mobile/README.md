# FitSelf — React Native / Expo Mobile App

The native iOS (and Android) app for FitSelf, built with Expo SDK 52 and expo-router.

## Tech stack

- **Expo SDK 52** + **expo-router v4** (file-based routing)
- **React Native 0.76** (new architecture enabled)
- **react-native-svg** — calorie ring + weight trend charts
- **lucide-react-native** — icon system (matches the web app exactly)
- **react-native-safe-area-context** — iOS safe area handling
- **zustand** — state management
- **axios** — API client (connects to the Fastify backend)

## Setup

```bash
cd apps/mobile
npm install
```

### Add app icons (required before building)

Place these files in `assets/images/`:
- `icon.png` — 1024×1024 px, no transparency (iOS App Store icon)
- `splash-icon.png` — any size, centred on `#0a0a0a` background
- `adaptive-icon.png` — 1024×1024 px foreground for Android adaptive icon
- `favicon.png` — 48×48 px for web

### Run in dev mode

```bash
npm start          # Expo Go or development build
npm run ios        # iOS Simulator (requires macOS + Xcode)
```

## iOS App Store build

### Prerequisites

1. **Apple Developer Account** ($99/year) — required for App Store distribution
2. **EAS CLI** — `npm install -g eas-cli`
3. Log in: `eas login`
4. Configure `eas.json` with your Apple ID, App Store Connect app ID, and team ID

### Build

```bash
# Production build (creates .ipa, submits to TestFlight)
npm run build:ios
```

EAS Build handles signing, provisioning profiles, and notarisation automatically.

### Submit to App Store

```bash
npm run submit:ios
```

Fill in `eas.json` → `submit.production.ios`:
- `appleId` — your Apple ID email
- `ascAppId` — the numeric app ID from App Store Connect
- `appleTeamId` — your Apple Developer team ID

### Free sideloading (no $99/year)

Use **AltStore** (altstore.io) to sideload the `.ipa` to your own iPhone without the App Store.  
The `development` build profile in `eas.json` is preconfigured for this.

## Architecture

```
app/
├── _layout.tsx          Root stack (auth guard, session modal)
├── login.tsx            Login screen
├── session.tsx          Active workout session (full-screen modal)
└── (tabs)/
    ├── _layout.tsx      Custom tab bar + quick-action sheet
    ├── index.tsx        Dashboard (Overview / Goals)
    ├── food.tsx         Food (Today / Recipes / Trends / Goals)
    ├── workout.tsx      Workout (Library / History / Exercises / Stats)
    ├── health.tsx       Health (Weight / Goals / Body / Measure)
    └── settings.tsx     Settings

components/
├── ui/                  Shared primitives (CalorieRing, MacroBar, Card, etc.)
├── dashboard/           Dashboard sub-views
├── food/                Food sub-views
├── workout/             Workout sub-views
└── health/              Health sub-views

constants/theme.ts       Design tokens (mirrors the FitSelf design system)
stores/                  Zustand stores (auth, navigation, session)
```

## Connecting to the backend

The app currently uses mock data. To connect to the real Fastify API:

1. Set the API base URL in `lib/api.ts` (create this file):

```typescript
import axios from 'axios';
export const api = axios.create({
  baseURL: 'https://fitself.yourdomain.com/api',
  withCredentials: true,
});
```

2. Replace mock data in each screen's store/hooks with real API calls.
3. The auth store's `login()` function already has a placeholder for `POST /api/auth/login`.
