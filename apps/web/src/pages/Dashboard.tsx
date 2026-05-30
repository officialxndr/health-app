import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { api } from '@/lib/api'
import { formatWeight } from '@/lib/units'
import { CalorieRing } from '@/components/CalorieRing'
import { MacroBar } from '@/components/MacroBar'
import type { HealthStats } from '@/types'

interface DailySummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { unitSystem } = useSettingsStore()
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [calorieGoal, setCalorieGoal] = useState(2000)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      api.get('/food/stats', { params: { from: today, to: today } }),
      api.get('/health/stats'),
      api.get('/auth/me'),
    ])
      .then(([foodRes, healthRes, meRes]) => {
        setSummary(foodRes.data)
        setStats(healthRes.data)
        const profile = meRes.data?.profile
        if (profile?.calorieGoal) setCalorieGoal(profile.calorieGoal)
      })
      .catch(() => {})
  }, [])

  const profile = user?.profile
  const caloriesEaten = summary?.calories ?? 0
  const activeSession = useWorkoutStore(s => s.activeSession)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-nav space-y-4">
      {activeSession && (
        <Link
          to="/workout"
          className="block bg-primary/20 border border-primary/40 rounded-2xl p-4"
        >
          <p className="text-xs text-primary font-medium mb-0.5">Session in progress</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold">{activeSession.name}</p>
            <span className="text-primary text-sm font-medium">Continue →</span>
          </div>
        </Link>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Good {getGreeting()}</h1>
          <p className="text-muted text-sm">{user?.name ?? user?.email}</p>
        </div>
        <div className="text-right text-sm text-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Calorie ring + macros */}
      <Link to="/food" className="block bg-surface rounded-2xl p-4">
        <div className="flex items-center gap-6">
          <CalorieRing eaten={Math.round(caloriesEaten)} goal={calorieGoal} />
          <div className="flex-1 space-y-3">
            <MacroBar
              label="Protein"
              value={summary?.protein ?? 0}
              target={profile?.proteinTarget ?? 150}
              color="#6366f1"
            />
            <MacroBar
              label="Carbs"
              value={summary?.carbs ?? 0}
              target={profile?.carbsTarget ?? 200}
              color="#f59e0b"
            />
            <MacroBar
              label="Fat"
              value={summary?.fat ?? 0}
              target={profile?.fatTarget ?? 65}
              color="#ec4899"
            />
          </div>
        </div>
        <p className="text-xs text-muted mt-3 text-center">Tap to log food →</p>
      </Link>

      {/* Weight card */}
      {stats?.current && (
        <Link to="/health" className="block bg-surface rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted mb-1">Current Weight</p>
              <p className="text-2xl font-bold">
                {formatWeight(stats.current.weightKg, unitSystem)}
              </p>
              {stats.weeklyChange !== null && (
                <p className={`text-sm ${stats.weeklyChange < 0 ? 'text-success' : stats.weeklyChange > 0 ? 'text-danger' : 'text-muted'}`}>
                  {stats.weeklyChange > 0 ? '+' : ''}{formatWeight(Math.abs(stats.weeklyChange), unitSystem)} this week
                </p>
              )}
            </div>
            <div className="text-right">
              {stats.goalEta && (
                <>
                  <p className="text-xs text-muted">Goal ETA</p>
                  <p className="text-sm font-medium">{stats.goalEta}</p>
                </>
              )}
              {stats.onTrack && (
                <span className="text-xs text-success">On track ✓</span>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Pace adjustment */}
      {stats?.dailyCalorieDelta !== null && stats?.dailyCalorieDelta !== undefined && !stats.onTrack && (
        <div className="bg-surface rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">Pace Adjustment</p>
          <p className="text-sm">
            {stats.dailyCalorieDelta > 0
              ? `Eat ~${Math.round(Math.abs(stats.dailyCalorieDelta))} more cal/day to stay on pace`
              : `Reduce ~${Math.round(Math.abs(stats.dailyCalorieDelta))} cal/day to stay on pace`}
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/workout" className="bg-surface rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-2xl">💪</span>
          <span className="font-medium text-sm">Log Workout</span>
        </Link>
        <Link to="/health/measurements" className="bg-surface rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-2xl">📏</span>
          <span className="font-medium text-sm">Measurements</span>
        </Link>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
