import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toKg, toDisplayWeight, UNIT_LABELS } from '@/lib/units'
import type { GoalPhase, GoalType, UnitSystem } from '@/types'

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'LOSE', label: 'Lose Weight' },
  { value: 'GAIN', label: 'Gain Weight' },
  { value: 'MAINTAIN', label: 'Maintain' },
]

interface Props {
  phase: GoalPhase | null
  unitSystem: UnitSystem
  onClose: () => void
  onSaved: () => void
}

export function GoalPhaseForm({ phase, unitSystem, onClose, onSaved }: Props) {
  const isEdit = !!phase
  const weightUnit = UNIT_LABELS[unitSystem].weight

  const [name, setName] = useState(phase?.name ?? '')
  const [goalType, setGoalType] = useState<GoalType>(phase?.goalType ?? 'LOSE')
  const [startDate, setStartDate] = useState(phase?.startDate?.split('T')[0] ?? '')
  const [endDate, setEndDate] = useState(phase?.endDate?.split('T')[0] ?? '')
  const [targetWeight, setTargetWeight] = useState('')
  const [weeklyRate, setWeeklyRate] = useState(phase?.weeklyRateKg != null ? String(Math.abs(phase.weeklyRateKg)) : '')
  const [calorieTarget, setCalorieTarget] = useState(phase?.calorieTarget ? String(phase.calorieTarget) : '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (phase?.targetWeightKg) {
      setTargetWeight(String(toDisplayWeight(phase.targetWeightKg, unitSystem)))
    }
  }, [phase, unitSystem])

  const handleSave = async () => {
    if (!name.trim() || !startDate || !endDate) {
      setError('Name, start date, and end date are required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        goalType,
        startDate,
        endDate,
      }
      if (targetWeight) payload.targetWeightKg = toKg(parseFloat(targetWeight), unitSystem)
      if (weeklyRate) {
        const rate = parseFloat(weeklyRate)
        payload.weeklyRateKg = goalType === 'LOSE' ? -Math.abs(rate) : Math.abs(rate)
      }
      if (calorieTarget) payload.calorieTarget = parseInt(calorieTarget, 10)

      if (isEdit) {
        await api.put(`/goal-phases/${phase.id}`, payload)
      } else {
        await api.post('/goal-phases', payload)
      }
      onSaved()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to save phase.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border safe-top">
        <button onClick={onClose} className="text-muted text-sm">Cancel</button>
        <h2 className="font-semibold">{isEdit ? 'Edit Phase' : 'New Phase'}</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-primary text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">Phase Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Cut"
            className="w-full bg-surfaceHigh rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        {/* Goal type */}
        <div>
          <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">Goal Type</label>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_TYPES.map((gt) => (
              <button
                key={gt.value}
                onClick={() => setGoalType(gt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  goalType === gt.value
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted'
                }`}
              >
                {gt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surfaceHigh rounded-xl px-3 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surfaceHigh rounded-xl px-3 py-3 text-sm outline-none"
            />
          </div>
        </div>

        {/* Target weight */}
        <div>
          <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">
            Target Weight ({weightUnit}) <span className="text-muted font-normal normal-case">optional</span>
          </label>
          <input
            type="number" step="0.1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="—"
            className="w-full bg-surfaceHigh rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-2 text-sm text-muted"
        >
          <span>{showAdvanced ? '▾' : '▸'}</span>
          Advanced (pace, calories)
        </button>

        {showAdvanced && (
          <div className="space-y-3 bg-surfaceHigh rounded-2xl p-4">
            <div>
              <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">
                Weekly Rate ({weightUnit}/week) <span className="text-muted font-normal normal-case">optional</span>
              </label>
              <input
                type="number" step="0.05" min="0"
                value={weeklyRate}
                onChange={(e) => setWeeklyRate(e.target.value)}
                placeholder="e.g. 0.45"
                className="w-full bg-surface rounded-xl px-4 py-3 text-sm outline-none"
              />
              <p className="text-xs text-muted mt-1">Positive number — direction is set by goal type.</p>
            </div>
            <div>
              <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5 block">
                Calorie Target (kcal/day) <span className="text-muted font-normal normal-case">optional</span>
              </label>
              <input
                type="number" step="50" min="0"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
                placeholder="e.g. 1800"
                className="w-full bg-surface rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
