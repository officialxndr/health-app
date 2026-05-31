# FitSelf Mobile — Development Guide

How to run the app, make changes, and get them onto your iPhone.

---

## Prerequisites

You need these installed on your Mac (this workflow requires macOS for Xcode):

| Tool | Install |
|------|---------|
| **Node.js 20+** | `brew install node` |
| **Xcode 16** | App Store (free) |
| **Xcode Command Line Tools** | `xcode-select --install` |
| **CocoaPods** | `sudo gem install cocoapods` |
| **Expo CLI** | `npm install -g expo-cli` |

---

## Path 1 — Expo Go (fastest, for UI iteration)

The simplest way to see changes. No build required, no Xcode needed.

### First time

```bash
cd apps/mobile
npm install
```

### Run

```bash
npx expo start
```

This prints a QR code. On your iPhone:
1. Download **Expo Go** from the App Store
2. Open the Camera app and scan the QR code — or open Expo Go and scan from there

The app opens instantly on your phone. Every time you save a file, Expo hot-reloads the change in under a second.

### Limitation

Expo Go cannot run native modules. The following features will not work in Expo Go:
- **Barcode scanning** (uses the camera native module)
- **SQLite** (expo-sqlite is native)
- **expo-crypto** (native)

For anything involving these, use the Development Build or Xcode paths below.

---

## Path 2 — Development Build on your iPhone (recommended)

A Development Build is a real app installed on your iPhone that includes all native modules. It behaves like the production app but connects to your dev server for fast JS reloads.

### One-time setup

**Install EAS CLI:**
```bash
npm install -g eas-cli
eas login    # log in with your Expo account (free at expo.dev)
```

**Build the development app** (runs on Expo's cloud build servers — takes ~10 min):
```bash
cd apps/mobile
eas build --platform ios --profile development
```

When it finishes, EAS gives you a link to download a `.ipa` file. Install it on your iPhone:
- If you have a paid Apple Developer account: the build is already signed for your device
- If not: sideload with AltStore (see [IPHONE_SETUP.md](IPHONE_SETUP.md))

You only need to do this build once, or whenever you change a **native dependency** (add/remove a package that has native code).

### Run after the app is installed

```bash
cd apps/mobile
npx expo start --dev-client
```

Open the FitSelf app on your iPhone. It will automatically connect to your dev server and load the latest JS. From here, saving any file hot-reloads instantly — same as Expo Go but with all native features working.

---

## Path 3 — Xcode (most control, required for free sideloading)

Use this when you want to build and install directly from Xcode, or when debugging native crashes.

### One-time setup

**Install the iOS native project:**
```bash
cd apps/mobile
npm install
npx expo prebuild --platform ios
```

This generates the `ios/` folder (Xcode project) from your Expo config. Only needed once, or after changing native plugins in `app.json`.

**Install CocoaPods dependencies:**
```bash
cd ios
pod install
cd ..
```

### Open in Xcode

```bash
npx expo run:ios --device
```

This builds and installs to your connected iPhone automatically.

**Or open Xcode manually:**
```bash
open ios/FitSelf.xcworkspace    # always open .xcworkspace, not .xcodeproj
```

In Xcode:
1. Select your iPhone as the target device (top toolbar)
2. Go to **Signing & Capabilities** → select your Apple ID (free is fine for personal use)
3. Press ▶ (Run) — Xcode builds and installs to your phone

**Trust the app on your iPhone:**
Settings → General → VPN & Device Management → tap your Apple ID → Trust

### Free Apple ID limitation

With a free Apple ID, apps expire after 7 days. You have to re-run from Xcode to refresh them. A paid Apple Developer account ($99/year) extends this to 1 year.

---

## Making Changes and Seeing Them

### JS-only changes (most changes)

JS-only means: anything in `app/`, `components/`, `stores/`, `lib/`, `constants/` that doesn't add or remove a native package.

**In Expo Go or Development Build with `npx expo start` running:**
- Save the file → the app reloads automatically (Fast Refresh)
- No build needed

**In Xcode (not connected to dev server):**
```bash
# Rebuild the JS bundle and re-run from Xcode
npx expo run:ios --device
```

### Native changes (adding/removing packages)

Native changes = installing a package that has native iOS code (e.g. a new Expo module, camera library, etc.).

```bash
cd apps/mobile
npm install <new-package>

# Rebuild the native project
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..

# Re-run in Xcode or via CLI
npx expo run:ios --device
```

If using EAS Development Build, you need to rebuild the development client:
```bash
eas build --platform ios --profile development
```

### Changing app.json (icons, permissions, splash screen)

`app.json` changes require a native rebuild:
```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
npx expo run:ios --device
```

---

## Connecting to the Backend

The app reads its backend URL from the `EXPO_PUBLIC_API_URL` environment variable.

Create `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
```

Replace `192.168.1.10` with your Mac's local IP address (System Settings → Network).
The backend server must be running (`npm run dev -w apps/api`) on the same network.

**Find your Mac's IP:**
```bash
ipconfig getifaddr en0    # Wi-Fi
```

Restart the Expo dev server after changing `.env`:
```bash
npx expo start --clear
```

---

## Quick Reference

| What you want | Command |
|---------------|---------|
| Fast UI iteration (no native features) | `npx expo start` → Expo Go |
| Full app with native features on iPhone | `npx expo start --dev-client` (after EAS dev build) |
| Build and run via Xcode | `npx expo run:ios --device` |
| Open Xcode project | `open ios/FitSelf.xcworkspace` |
| Rebuild native project (after plugin/permission change) | `npx expo prebuild --platform ios --clean` |
| Install CocoaPods after native rebuild | `cd ios && pod install` |
| Build for sideloading via AltStore | `eas build --platform ios --profile development` |
| Production build for App Store | `eas build --platform ios --profile production` |

---

## Troubleshooting

**"Unable to find a suitable build" / app won't connect to dev server**
Make sure your iPhone and Mac are on the same Wi-Fi network.

**Metro bundler port conflict**
```bash
npx expo start --port 8082
```

**Xcode says "No account for team" or signing error**
Xcode → Settings → Accounts → add your Apple ID → download manual profiles.

**`pod install` fails**
```bash
sudo gem update cocoapods
cd ios && pod repo update && pod install
```

**SQLite errors on first launch**
The database is initialised the first time the app opens. If you see errors, delete the app from your phone and reinstall — this gives the DB a clean start.

**Changes not appearing after save**
Press `r` in the Expo terminal to force a full reload. If that doesn't work:
```bash
npx expo start --clear
```
