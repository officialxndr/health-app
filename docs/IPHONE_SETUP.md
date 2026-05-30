# Installing FitSelf on iPhone (Mac → Xcode → Direct Install)

This guide covers building the native iOS app from your Mac and installing it on your iPhone without the App Store. A free Apple ID is all you need.

---

## Prerequisites

### One-time installs (on Mac)

**1. Xcode** — Install from the App Store (free, ~7 GB). Open it once after install to accept the license agreement.

```bash
sudo xcodebuild -license accept
xcode-select --install
```

**2. Homebrew** (if you don't have it)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**3. Node.js 20**

```bash
brew install node@20
# Add to PATH if prompted
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**4. CocoaPods** — Required for Capacitor's iOS dependencies

```bash
sudo gem install cocoapods
```

---

## Getting the code on your Mac

```bash
git clone https://github.com/officialxndr/health-app.git
cd health-app
```

Or transfer the folder via AirDrop / USB if you don't want to push to GitHub first.

---

## Backend URL

The iOS app loads its web assets from the bundled build (offline), but all API calls go directly to your backend server. Before building, find your Windows PC's local IP address:

- On Windows: run `ipconfig` in PowerShell → look for **IPv4 Address** (e.g. `192.168.1.167`)
- Your iPhone and PC must be on the **same Wi-Fi network**

Set `VITE_API_URL` to that IP + the API port when building (see below).

---

## Build the app

Run all of this from the `apps/web` directory:

```bash
cd apps/web

# Install dependencies
npm install

# Build the web app (replace the IP with your Windows PC's actual LAN IP)
VITE_API_URL=http://192.168.1.167:3001 npm run build

# Add the iOS Capacitor project — only needed the FIRST time
npx cap add ios

# Copy the web build into the iOS project
npx cap sync ios
```

> **Every time you update the app**, just re-run `npm run build` and `npx cap sync ios`, then press Run in Xcode again. You don't need to `cap add ios` again.

---

## Deploy to iPhone via Xcode

```bash
npx cap open ios
```

This opens Xcode with the iOS project.

### In Xcode:

1. **Sign in with your Apple ID**  
   Xcode → Settings (⌘,) → Accounts → click **+** → Apple ID → sign in

2. **Configure signing**  
   In the left sidebar, click **App** (the top-level blue icon)  
   → **Signing & Capabilities** tab  
   → Set **Team** to your personal Apple ID  
   → Set **Bundle Identifier** to something unique: `com.yourname.fitself`

3. **Select your iPhone**  
   Plug your iPhone into the Mac via USB  
   → In the Xcode toolbar (top centre), click the device dropdown → select your iPhone

4. **Build and install**  
   Press **▶ (Run)** — Xcode builds and installs directly to your iPhone

5. **Trust the app on iPhone**  
   First time only: go to **Settings → General → VPN & Device Management**  
   → tap your Apple ID email → tap **Trust**

The app opens on your iPhone.

---

## Updating the app

```bash
cd apps/web

# Rebuild with your backend IP
VITE_API_URL=http://192.168.1.167:3001 npm run build

# Sync into the iOS project
npx cap sync ios
```

Then press **▶ Run** in Xcode again. Xcode reinstalls the updated app in seconds.

---

## Certificate expiry (free Apple ID)

Free Apple ID developer certificates expire every **7 days**. After 7 days the app will stop launching. Fix: plug in your iPhone, open Xcode, and press Run — Xcode re-signs and reinstalls automatically.

If you want automatic re-signing without a computer: set up **AltStore** (see below).

---

## Optional: AltStore for automatic re-signing

AltStore keeps your sideloaded app alive by re-signing it in the background every 7 days while your iPhone is on the same Wi-Fi as your Mac.

1. Download **AltServer** from [altstore.io](https://altstore.io) (free, Mac app)
2. Run AltServer → click the menu bar icon → **Install AltStore** → select your iPhone
3. Open **AltStore** on your iPhone → tap **+** → choose the `.ipa` file

### Exporting an IPA from Xcode (for AltStore)

Instead of pressing Run, go to:  
**Product → Archive** → wait for the archive to complete  
→ **Distribute App** → **Custom** → **Release Testing** → **Next** → **Export**

This saves a `.ipa` file you can hand to AltStore.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pod install` errors | Run `sudo gem update cocoapods && pod repo update` |
| "Untrusted Developer" on iPhone | Settings → General → VPN & Device Management → trust your Apple ID |
| API calls fail in the app | Make sure your Windows PC is running the API (`npm run dev` in `apps/api`) and the IP in `VITE_API_URL` matches your PC's current LAN IP |
| App installs but shows blank screen | The `VITE_API_URL` is wrong or the backend isn't reachable — check both devices are on the same Wi-Fi |
| `npx cap add ios` says iOS already exists | Skip it — just run `npx cap sync ios` |
| Xcode signing error "No account found" | Xcode → Settings → Accounts → add your Apple ID |
