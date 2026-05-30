import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from '@/lib/api'
import { calcTDEE } from '@/lib/tdee'
import { UNIT_LABELS } from '@/lib/units'
import type { MacroTargetMode } from '@/types'
import { Target, Flame, ChevronRight } from '@/components/icons'

function MacroRow({
  label,
  color,
  value,
  onChange,
  unit,
  placeholder,
}: {
  label: string
  color: string
  value: string
  onChange: (v: string) => void
  unit: string
  placeholder: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number" min="0" step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-20 bg-surfaceHigh rounded-xl px-3 py-1.5 text-sm text-right outline-none"
        />
        <span className="text-xs text-muted w-6">{unit}</span>
      </div>
    </div>
  )
}

export function FoodGoals() {
  const { user, setUser } = useAuthStore()
  const { unitSystem } = useSettingsStore()
  const profile = user?.profile

  // Calorie goal
  const [calorieMode, setCalorieMode] = useState<'auto' | 'manual'>(
    profile?.calorieGoal ? 'manual' : 'auto'
  )
  const [calorieGoal, setCalorieGoal] = useState(
    profile?.calorieGoal ? String(profile.calorieGoal) : ''
  )

  // Macro targets
  const [macroMode, setMacroMode] = useState<MacroTargetMode>(
    profile?.macroTargetMode ?? 'GRAMS'
  )
  const [protein, setProtein] = useState(profile?.proteinTarget ? String(profile.proteinTarget) : '')
  const [carbs, setCarbs] = useState(profile?.carbsTarget ? String(profile.carbsTarget) : '')
  const [fat, setFat] = useState(profile?.fatTarget ? String(profile.fatTarget) : '')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Compute live TDEE from profile if possible
  const tdee = (() => {
    if (!profile?.heightCm || !profile?.activityLevel || !profile?.birthDate || !profile?.sex) return null
    const ageYears = Math.floor(
      (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 86400 * 1000)
    )
    const latestWeightKg = 70 // fallback; ideally from health stats
    try {
      return calcTDEE({
        weightKg: latestWeightKg,
        heightCm: profile.heightCm,
        ageYears,
        sex: profile.sex,
        activityLevel: profile.activityLevel,
      }).tdee
    } catch {
      return null
    }
  })()

  // Convert % targets to grams for display
  const effectiveCalorie = calorieMode === 'auto' ? tdee : (parseInt(calorieGoal) || null)

  const macroGrams = (() => {
    if (macroMode === 'GRAMS') {
      return {
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
      }
    }
    // % → grams
    const cal = effectiveCalorie ?? 2000
    const pPct = parseFloat(protein) || 0
    const cPct = parseFloat(carbs) || 0
    const fPct = parseFloat(fat) || 0
    return {
      protein: Math.round((cal * pPct) / 100 / 4),
      carbs: Math.round((cal * cPct) / 100 / 4),
      fat: Math.round((cal * fPct) / 100 / 9),
    }
  })()

  const macroCalories = macroGrams.protein * 4 + macroGrams.carbs * 4 + macroGrams.fat * 9
  const percentTotal = macroMode === 'PERCENT'
    ? (parseFloat(protein) || 0) + (parseFloat(carbs) || 0) + (parseFloat(fat) || 0)
    : null

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        macroTargetMode: macroMode,
        calorieGoal: calorieMode === 'manual' && calorieGoal ? parseInt(calorieGoal) : null,
      }

      if (macroMode === 'GRAMS') {
        payload.proteinTarget = parseInt(protein) || null
        payload.carbsTarget = parseInt(carbs) || null
        payload.fatTarget = parseInt(fat) || null
      } else {
        // Store as computed grams (API stores grams regardless of display mode)
        payload.proteinTarget = macroGrams.protein || null
        payload.carbsTarget = macroGrams.carbs || null
        payload.fatTarget = macroGrams.fat || null
      }

      await api.put('/auth/profile', payload)
      const { data } = await api.get('/auth/me')
      setUser(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const weightUnit = UNIT_LABELS[unitSystem].weight

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-nav space-y-4">
      {/* Calorie Goal */}
      <div className="bg-surface rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-semibold">Calorie Goal</p>
        </div>

        <div className="flex gap-2 mb-3">
          {(['auto', 'manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCalorieMode(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                calorieMode === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted'
              }`}
            >
              {m === 'auto' ? 'Auto (from TDEE)' : 'Set manually'}
            </button>
          ))}
        </div>

        {calorieMode === 'auto' ? (
          <div>
            {tdee ? (
              <div className="flex items-center justify-between bg-surfaceHigh rounded-xl px-4 py-3">
                <span className="text-sm text-muted">Estimated TDEE</span>
                <span className="text-base font-bold">{tdee} kcal</span>
              </div>
            ) : (
              <div className="bg-surfaceHigh rounded-xl px-4 py-3">
                <p className="text-sm text-muted">
                  Complete your profile (height, weight, birthdate, sex) to get your estimated TDEE.
                </p>
                <Link
                  to="/tdee"
                  className="flex items-center gap-1 text-primary text-sm mt-2"
                >
                  Open TDEE Calculator <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number" min="500" max="10000" step="50"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              placeholder="e.g. 2000"
              className="flex-1 bg-surfaceHigh rounded-xl px-4 py-3 text-sm outline-none"
            />
            <span className="text-sm text-muted">kcal/day</span>
          </div>
        )}
      </div>

      {/* Macro Targets */}
      <div className="bg-surface rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Macro Targets</p>
        </div>

        <div className="flex gap-2 mb-4">
          {(['GRAMS', 'PERCENT'] as MacroTargetMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMacroMode(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                macroMode === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted'
              }`}
            >
              {m === 'GRAMS' ? 'Grams' : '% of calories'}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          <MacroRow
            label="Protein"
            color="bg-indigo-400"
            value={protein}
            onChange={setProtein}
            unit={macroMode === 'GRAMS' ? 'g' : '%'}
            placeholder={macroMode === 'GRAMS' ? '150' : '30'}
          />
          <MacroRow
            label="Carbs"
            color="bg-amber-400"
            value={carbs}
            onChange={setCarbs}
            unit={macroMode === 'GRAMS' ? 'g' : '%'}
            placeholder={macroMode === 'GRAMS' ? '200' : '40'}
          />
          <MacroRow
            label="Fat"
            color="bg-pink-400"
            value={fat}
            onChange={setFat}
            unit={macroMode === 'GRAMS' ? 'g' : '%'}
            placeholder={macroMode === 'GRAMS' ? '65' : '30'}
          />
        </div>

        {/* Live summary */}
        {(macroGrams.protein || macroGrams.carbs || macroGrams.fat) ? (
          <div className="mt-4 p-3 bg-surfaceHigh rounded-xl">
            {macroMode === 'PERCENT' && (
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted">Total %</span>
                <span className={percentTotal && percentTotal > 100 ? 'text-danger font-semibold' : 'font-medium'}>
                  {percentTotal}%{percentTotal && percentTotal > 100 ? ' (over 100%)' : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted">Total from macros</span>
              <span className="font-medium">{macroCalories} kcal</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted">Breakdown</span>
              <span className="text-muted">
                {macroGrams.protein}g P · {macroGrams.carbs}g C · {macroGrams.fat}g F
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* TDEE Calculator link */}
      <Link
        to="/tdee"
        className="flex items-center justify-between bg-surface rounded-2xl p-4"
      >
        <div>
          <p className="text-sm font-medium">TDEE Calculator</p>
          <p className="text-xs text-muted mt-0.5">Get a detailed calorie baseline estimate</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted" />
      </Link>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Goals'}
      </button>
    </div>
  )
}
