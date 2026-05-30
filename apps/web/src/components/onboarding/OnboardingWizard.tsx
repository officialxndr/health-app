import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from '@/lib/api'
import { calcTDEE, ACTIVITY_DESCRIPTIONS } from '@/lib/tdee'
import { toKg, UNIT_LABELS } from '@/lib/units'
import type { ActivityLevel, GoalType, Sex } from '@/types'
import { ChevronRight, ChevronLeft, HeartPulse } from '@/components/icons'

const TOTAL_STEPS = 5

const ACTIVITY_LEVELS: ActivityLevel[] = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: 'Sedentary',
  LIGHT: 'Lightly Active',
  MODERATE: 'Moderately Active',
  ACTIVE: 'Very Active',
  VERY_ACTIVE: 'Extra Active',
}

interface WizardData {
  name: string
  birthDate: string
  sex: Sex | ''
  height: string
  weight: string
  goalType: GoalType
  goalWeight: string
  goalDate: string
  activityLevel: ActivityLevel
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? 'w-6 bg-primary' : i === current ? 'w-8 bg-primary' : 'w-4 bg-surfaceHigh'
          }`}
        />
      ))}
    </div>
  )
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center">
        <HeartPulse className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to FitSelf</h1>
        <p className="text-muted text-base leading-relaxed">
          Your personal health & fitness tracker. Let's set up your profile so we can calculate
          your calorie targets and track your progress.
        </p>
      </div>
      <p className="text-sm text-muted">Takes about 2 minutes · You can change everything later</p>
      <button
        onClick={onNext}
        className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-base flex items-center justify-center gap-2 mt-4"
      >
        Get Started <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// Step 2: Profile basics
function ProfileStep({
  data,
  onChange,
  onNext,
  onBack,
  unitSystem,
}: {
  data: WizardData
  onChange: (k: keyof WizardData, v: string) => void
  onNext: () => void
  onBack: () => void
  unitSystem: 'METRIC' | 'IMPERIAL'
}) {
  const weightUnit = UNIT_LABELS[unitSystem].weight
  const valid = data.name.trim() && data.birthDate && data.sex && data.height && data.weight

  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-2xl font-bold mb-1">About You</h2>
      <p className="text-muted text-sm mb-6">Used to calculate your calorie needs accurately.</p>

      <div className="space-y-3 flex-1">
        <div>
          <label className="text-xs text-muted font-medium">Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Your name"
            className="w-full mt-1 bg-surfaceHigh rounded-xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted font-medium">Date of Birth</label>
          <input
            type="date"
            value={data.birthDate}
            onChange={(e) => onChange('birthDate', e.target.value)}
            className="w-full mt-1 bg-surfaceHigh rounded-xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted font-medium">Biological Sex</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {(['MALE', 'FEMALE', 'OTHER'] as Sex[]).map((s) => (
              <button
                key={s}
                onClick={() => onChange('sex', s)}
                className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                  data.sex === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted'
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted font-medium">
              Height {unitSystem === 'IMPERIAL' ? '(inches)' : '(cm)'}
            </label>
            <input
              type="number" step="0.5"
              value={data.height}
              onChange={(e) => onChange('height', e.target.value)}
              placeholder={unitSystem === 'IMPERIAL' ? '70' : '175'}
              className="w-full mt-1 bg-surfaceHigh rounded-xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted font-medium">Weight ({weightUnit})</label>
            <input
              type="number" step="0.5"
              value={data.weight}
              onChange={(e) => onChange('weight', e.target.value)}
              placeholder={unitSystem === 'IMPERIAL' ? '160' : '73'}
              className="w-full mt-1 bg-surfaceHigh rounded-xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="w-12 h-12 rounded-xl bg-surfaceHigh text-muted flex items-center justify-center shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// Step 3: Goal
function GoalStep({
  data,
  onChange,
  onNext,
  onBack,
  unitSystem,
}: {
  data: WizardData
  onChange: (k: keyof WizardData, v: string) => void
  onNext: () => void
  onBack: () => void
  unitSystem: 'METRIC' | 'IMPERIAL'
}) {
  const weightUnit = UNIT_LABELS[unitSystem].weight
  const GOALS: { type: GoalType; label: string; desc: string }[] = [
    { type: 'LOSE', label: 'Lose Weight', desc: 'Calorie deficit to shed fat' },
    { type: 'MAINTAIN', label: 'Maintain', desc: 'Eat at maintenance, recomp' },
    { type: 'GAIN', label: 'Gain Weight', desc: 'Calorie surplus to build muscle' },
  ]

  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-2xl font-bold mb-1">Your Goal</h2>
      <p className="text-muted text-sm mb-6">We'll calculate your daily calorie target.</p>

      <div className="space-y-2 flex-1">
        {GOALS.map(({ type, label, desc }) => (
          <button
            key={type}
            onClick={() => onChange('goalType', type)}
            className={`w-full text-left p-4 rounded-2xl border transition-colors ${
              data.goalType === type
                ? 'border-primary bg-primary/10'
                : 'border-border'
            }`}
          >
            <p className={`font-semibold ${data.goalType === type ? 'text-primary' : ''}`}>{label}</p>
            <p className="text-xs text-muted mt-0.5">{desc}</p>
          </button>
        ))}

        {data.goalType !== 'MAINTAIN' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs text-muted font-medium">Goal Weight ({weightUnit})</label>
              <input
                type="number" step="0.5"
                value={data.goalWeight}
                onChange={(e) => onChange('goalWeight', e.target.value)}
                placeholder="—"
                className="w-full mt-1 bg-surfaceHigh rounded-xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted font-medium">Target Date</label>
              <input
                type="date"
                value={data.goalDate}
                onChange={(e) => onChange('goalDate', e.target.value)}
                className="w-full mt-1 bg-surfaceHigh rounded-xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="w-12 h-12 rounded-xl bg-surfaceHigh text-muted flex items-center justify-center shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// Step 4: Activity level + TDEE preview
function ActivityStep({
  data,
  onChange,
  onNext,
  onBack,
  unitSystem,
}: {
  data: WizardData
  onChange: (k: keyof WizardData, v: string) => void
  onNext: () => void
  onBack: () => void
  unitSystem: 'METRIC' | 'IMPERIAL'
}) {
  // Compute live TDEE if we have profile data
  const tdee = (() => {
    if (!data.height || !data.weight || !data.birthDate || !data.sex) return null
    try {
      const heightCm = unitSystem === 'IMPERIAL' ? parseFloat(data.height) * 2.54 : parseFloat(data.height)
      const weightKg = toKg(parseFloat(data.weight), unitSystem)
      const ageYears = Math.floor((Date.now() - new Date(data.birthDate).getTime()) / (365.25 * 86400 * 1000))
      if (!heightCm || !weightKg || !ageYears || !data.sex) return null
      return calcTDEE({ weightKg, heightCm, ageYears, sex: data.sex as Sex, activityLevel: data.activityLevel }).tdee
    } catch { return null }
  })()

  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-2xl font-bold mb-1">Activity Level</h2>
      <p className="text-muted text-sm mb-4">How active are you day-to-day?</p>

      <div className="space-y-2 flex-1">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onChange('activityLevel', level)}
            className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
              data.activityLevel === level
                ? 'border-primary bg-primary/10'
                : 'border-border'
            }`}
          >
            <p className={`font-medium text-sm ${data.activityLevel === level ? 'text-primary' : ''}`}>
              {ACTIVITY_LABELS[level]}
            </p>
            <p className="text-xs text-muted">{ACTIVITY_DESCRIPTIONS[level]}</p>
          </button>
        ))}

        {tdee && (
          <div className="bg-surfaceHigh rounded-2xl p-4 text-center mt-2">
            <p className="text-xs text-muted mb-1">Estimated daily maintenance</p>
            <p className="text-2xl font-bold text-primary">{tdee} kcal</p>
            <p className="text-xs text-muted mt-1">We'll fine-tune this based on your actual results over time.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="w-12 h-12 rounded-xl bg-surfaceHigh text-muted flex items-center justify-center shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={onNext} className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl">
          Continue
        </button>
      </div>
    </div>
  )
}

// Step 5: Apple Health intro
function AppleHealthStep({
  onFinish,
  onBack,
  saving,
}: {
  onFinish: () => void
  onBack: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <h2 className="text-2xl font-bold mb-1">Apple Health</h2>
      <p className="text-muted text-sm mb-6">
        Connect Apple Health to automatically sync weight, steps, and active calories.
      </p>

      <div className="space-y-3 flex-1">
        <div className="bg-surfaceHigh rounded-2xl p-4">
          <p className="font-medium text-sm mb-1">How it works (PWA)</p>
          <p className="text-xs text-muted leading-relaxed">
            Set up a free iOS Shortcut that runs automatically each morning and sends your health
            data to FitSelf. No App Store required.
          </p>
          <Link
            to="/apple-health"
            className="inline-flex items-center gap-1 text-primary text-xs font-medium mt-2"
            onClick={onFinish}
          >
            Set up Apple Health <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-surfaceHigh rounded-2xl p-4">
          <p className="font-medium text-sm mb-1">Or import manually</p>
          <p className="text-xs text-muted leading-relaxed">
            Export your data from the Health app and import the XML file here anytime.
          </p>
        </div>

        <p className="text-xs text-muted text-center py-2">
          You can set this up anytime from Settings → Integrations.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="w-12 h-12 rounded-xl bg-surfaceHigh text-muted flex items-center justify-center shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Start Using FitSelf'}
        </button>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { setUser } = useAuthStore()
  const { unitSystem } = useSettingsStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<WizardData>({
    name: '',
    birthDate: '',
    sex: '',
    height: '',
    weight: '',
    goalType: 'MAINTAIN',
    goalWeight: '',
    goalDate: '',
    activityLevel: 'MODERATE',
  })

  const update = (k: keyof WizardData, v: string) => setData((d) => ({ ...d, [k]: v }))

  const saveAndFinish = async () => {
    setSaving(true)
    try {
      const heightCm = data.height
        ? (unitSystem === 'IMPERIAL' ? parseFloat(data.height) * 2.54 : parseFloat(data.height))
        : undefined

      const weightKg = data.weight
        ? toKg(parseFloat(data.weight), unitSystem)
        : undefined

      await api.put('/auth/profile', {
        name: data.name || undefined,
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : undefined,
        sex: data.sex || undefined,
        heightCm,
        activityLevel: data.activityLevel,
        goalType: data.goalType,
        goalWeightKg: data.goalWeight
          ? toKg(parseFloat(data.goalWeight), unitSystem)
          : undefined,
        goalDate: data.goalDate ? new Date(data.goalDate).toISOString() : undefined,
      })

      // Log initial weight if provided
      if (weightKg) {
        await api.post('/health/weight', {
          date: new Date().toISOString().split('T')[0],
          weightKg,
        }).catch(() => {})
      }

      // Refresh user
      const { data: userData } = await api.get('/auth/me')
      setUser(userData)
    } catch {
      // Let the user through even if save fails
      try {
        const { data: userData } = await api.get('/auth/me')
        setUser(userData)
      } catch {}
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col safe-top safe-bottom">
      <div className="px-6 pt-4">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <ProfileStep
          data={data}
          onChange={update}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          unitSystem={unitSystem}
        />
      )}
      {step === 2 && (
        <GoalStep
          data={data}
          onChange={update}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          unitSystem={unitSystem}
        />
      )}
      {step === 3 && (
        <ActivityStep
          data={data}
          onChange={update}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          unitSystem={unitSystem}
        />
      )}
      {step === 4 && (
        <AppleHealthStep
          onFinish={saveAndFinish}
          onBack={() => setStep(3)}
          saving={saving}
        />
      )}
    </div>
  )
}
