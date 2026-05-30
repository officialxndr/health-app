import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from '@/lib/api'
import type { UnitSystem, ActivityLevel, GoalType } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'PushManager' in navigator
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-border ${disabled ? 'opacity-40' : ''}`}>
      <div>
        <p className="text-sm">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-3 ${value ? 'bg-primary' : 'bg-surfaceHigh'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <span className="text-sm">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-surfaceHigh text-sm rounded-lg px-3 py-1.5 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Push Notifications section ───────────────────────────────────────────────

interface NotifPrefs {
  weightReminder?: { enabled: boolean; time?: string }
  foodReminder?: { enabled: boolean; time?: string }
  workoutReminder?: { enabled: boolean }
  calorieWarning?: { enabled: boolean }
}

function PushSection() {
  const [supported] = useState(isPushSupported)
  const [subscribed, setSubscribed] = useState(false)
  const [working, setWorking] = useState(false)
  const [prefs, setPrefs] = useState<NotifPrefs>({})
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)

  // Check current push subscription on mount
  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscribed(true)
          setCurrentEndpoint(sub.endpoint)
        }
      })
    })
    // Load saved prefs
    api.get<NotifPrefs>('/notifications/preferences').then(({ data }) => setPrefs(data)).catch(() => {})
  }, [supported])

  const handleTogglePush = async (enable: boolean) => {
    setWorking(true)
    setTestMsg(null)
    try {
      const reg = await navigator.serviceWorker.ready

      if (enable) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setTestMsg('Notification permission denied — check browser settings.')
          setWorking(false)
          return
        }

        // Fetch VAPID public key
        const { data: vapidData } = await api.get<{ publicKey: string | null }>('/notifications/vapid-key')
        if (!vapidData.publicKey) {
          setTestMsg('Push not configured on the server — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.')
          setWorking(false)
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
        })

        const p256dh = sub.getKey('p256dh')
        const auth = sub.getKey('auth')
        if (!p256dh || !auth) throw new Error('Missing subscription keys')

        await api.post('/notifications/subscribe', {
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth),
          },
          platform: 'web',
        })

        setSubscribed(true)
        setCurrentEndpoint(sub.endpoint)
      } else {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await api.delete('/notifications/subscribe', { data: { endpoint: sub.endpoint } })
          await sub.unsubscribe()
        }
        setSubscribed(false)
        setCurrentEndpoint(null)
      }
    } catch (err) {
      console.error('Push toggle error:', err)
      setTestMsg('Something went wrong — check the console for details.')
    } finally {
      setWorking(false)
    }
  }

  const handleSendTest = async () => {
    setTestMsg(null)
    try {
      await api.post('/notifications/test')
      setTestMsg('Test notification sent! You should see it shortly.')
    } catch {
      setTestMsg('Failed to send test — make sure notifications are enabled.')
    }
  }

  const savePref = async (next: NotifPrefs) => {
    setPrefs(next)
    try {
      await api.put('/notifications/preferences', next)
    } catch { /* silent */ }
  }

  if (!supported) {
    return (
      <div className="bg-surface rounded-2xl px-4 py-3">
        <p className="text-sm text-muted">
          Push notifications require a secure context (HTTPS) and a modern browser. Not available here.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl px-4">
      <ToggleRow
        label="Enable Notifications"
        description={subscribed ? 'Active on this browser' : 'Off — tap to enable'}
        value={subscribed}
        onChange={handleTogglePush}
        disabled={working}
      />

      <ToggleRow
        label="Weight Reminder"
        description="Daily reminder to log your weight"
        value={prefs.weightReminder?.enabled ?? false}
        onChange={(v) => savePref({ ...prefs, weightReminder: { ...prefs.weightReminder, enabled: v } })}
        disabled={!subscribed}
      />

      <ToggleRow
        label="Food Log Reminder"
        description="Evening nudge if you haven't logged meals"
        value={prefs.foodReminder?.enabled ?? false}
        onChange={(v) => savePref({ ...prefs, foodReminder: { ...prefs.foodReminder, enabled: v } })}
        disabled={!subscribed}
      />

      <ToggleRow
        label="Workout Reminder"
        description="Nudge when it's been a while since your last session"
        value={prefs.workoutReminder?.enabled ?? false}
        onChange={(v) => savePref({ ...prefs, workoutReminder: { enabled: v } })}
        disabled={!subscribed}
      />

      <ToggleRow
        label="Calorie Warning"
        description="Alert if you're under-eating by evening"
        value={prefs.calorieWarning?.enabled ?? false}
        onChange={(v) => savePref({ ...prefs, calorieWarning: { enabled: v } })}
        disabled={!subscribed}
      />

      {subscribed && (
        <div className="py-3">
          <button
            onClick={handleSendTest}
            className="text-sm text-primary font-medium"
          >
            Send test notification
          </button>
          {testMsg && <p className="text-xs text-muted mt-1">{testMsg}</p>}
        </div>
      )}

      {!subscribed && testMsg && (
        <div className="py-3">
          <p className="text-xs text-danger">{testMsg}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Settings page ───────────────────────────────────────────────────────

export function Settings() {
  const navigate = useNavigate()
  const { user, logout: storeLogout } = useAuthStore()
  const { unitSystem, countActiveCalories, setUnitSystem, setCountActiveCalories } = useSettingsStore()

  const profile = user?.profile

  const handleUnitChange = async (system: UnitSystem) => {
    setUnitSystem(system)
    try {
      await api.put('/auth/profile', { unitSystem: system })
    } catch { /* silent */ }
  }

  const handleActiveCalToggle = async (val: boolean) => {
    setCountActiveCalories(val)
    try {
      await api.put('/auth/profile', { countActiveCalories: val })
    } catch { /* silent */ }
  }

  const handleGoalChange = async (goalType: GoalType) => {
    try {
      await api.put('/auth/profile', { goalType })
      const { data } = await api.get('/auth/me')
      useAuthStore.getState().setUser(data)
    } catch { /* silent */ }
  }

  const handleActivityChange = async (activityLevel: ActivityLevel) => {
    try {
      await api.put('/auth/profile', { activityLevel })
      const { data } = await api.get('/auth/me')
      useAuthStore.getState().setUser(data)
    } catch { /* silent */ }
  }

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* silent */ }
    storeLogout()
    navigate('/login')
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="bg-surface border-b border-border px-4 py-3 safe-top">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-nav space-y-4">

        {/* Account */}
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Account</p>
          <div className="bg-surface rounded-2xl px-4">
            <div className="py-3 border-b border-border">
              <p className="text-xs text-muted">Name</p>
              <p className="text-sm font-medium mt-0.5">{user?.name ?? '—'}</p>
            </div>
            <div className="py-3">
              <p className="text-xs text-muted">Email</p>
              <p className="text-sm font-medium mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Units */}
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Units & Display</p>
          <div className="bg-surface rounded-2xl px-4">
            <SelectRow<UnitSystem>
              label="Unit System"
              value={unitSystem}
              options={[
                { value: 'METRIC', label: 'Metric (kg, cm)' },
                { value: 'IMPERIAL', label: 'Imperial (lbs, ft/in)' },
              ]}
              onChange={handleUnitChange}
            />
            <ToggleRow
              label="Count Active Calories"
              description="Add Apple Watch burn to daily calorie budget"
              value={countActiveCalories}
              onChange={handleActiveCalToggle}
            />
          </div>
        </div>

        {/* Goal */}
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Goal</p>
          <div className="bg-surface rounded-2xl px-4">
            <SelectRow<GoalType>
              label="Goal Type"
              value={profile?.goalType ?? 'MAINTAIN'}
              options={[
                { value: 'LOSE', label: 'Lose Weight' },
                { value: 'MAINTAIN', label: 'Maintain Weight' },
                { value: 'GAIN', label: 'Gain Weight' },
              ]}
              onChange={handleGoalChange}
            />
            <SelectRow<ActivityLevel>
              label="Activity Level"
              value={profile?.activityLevel ?? 'MODERATE'}
              options={[
                { value: 'SEDENTARY', label: 'Sedentary' },
                { value: 'LIGHT', label: 'Light' },
                { value: 'MODERATE', label: 'Moderate' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'VERY_ACTIVE', label: 'Very Active' },
              ]}
              onChange={handleActivityChange}
            />
          </div>
        </div>

        {/* Integrations */}
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Integrations</p>
          <div className="bg-surface rounded-2xl px-4">
            <Link
              to="/apple-health"
              className="flex items-center justify-between py-3.5 border-b border-border"
            >
              <div>
                <p className="text-sm font-medium">Apple Health</p>
                <p className="text-xs text-muted">Import data or set up daily Shortcut sync</p>
              </div>
              <span className="text-muted">›</span>
            </Link>
          </div>
        </div>

        {/* Push Notifications */}
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Notifications</p>
          <PushSection />
        </div>

        {/* Tools */}
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Tools</p>
          <div className="bg-surface rounded-2xl px-4">
            <Link
              to="/tdee"
              className="flex items-center justify-between py-3.5 border-b border-border"
            >
              <div>
                <p className="text-sm font-medium">TDEE Calculator</p>
                <p className="text-xs text-muted">Estimate your daily calorie burn</p>
              </div>
              <span className="text-muted">›</span>
            </Link>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full bg-surface rounded-2xl py-3.5 text-danger font-medium text-sm"
        >
          Sign Out
        </button>

      </div>
    </div>
  )
}
