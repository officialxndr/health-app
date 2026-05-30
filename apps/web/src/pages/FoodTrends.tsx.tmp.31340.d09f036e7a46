import { useEffect, useState } from 'react'
import { subDays, format } from 'date-fns'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

type Range = 7 | 30 | 90

interface FoodStats {
  calories: number
  protein: number
  carbs: number
  fat: number
  days: number
}

const RANGES: { value: Range; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

function MacroRow({ label, value, target, color }: { label: string; value: number; target?: number; color: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0
  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium" style={{ color }}>{label}</span>
        <span className="text-sm">
          <span className="font-bold">{Math.round(value)}g</span>
          {target ? <span className="text-muted"> / {target}g avg target</span> : null}
        </span>
      </div>
      {target ? (
        <div className="h-1.5 rounded-full bg-surfaceHigh overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      ) : null}
    </div>
  )
}

export function FoodTrends() {
  const user = useAuthStore((s) => s.user)
  const [range, setRange] = useState<Range>(7)
  const [stats, setStats] = useState<FoodStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const to = new Date()
    const from = subDays(to, range - 1)
    api.get('/food/stats', {
      params: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
    })
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [range])

  const profile = user?.profile
  const calorieGoal = profile?.calorieGoal ?? null
  const proteinTarget = profile?.proteinTarget ?? undefined
  const carbsTarget = profile?.carbsTarget ?? undefined
  const fatTarget = profile?.fatTarget ?? undefined

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 pb-nav space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Trends</h2>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  range === r.value ? 'bg-primary text-white' : 'text-muted bg-surfaceHigh'
                }`}
              >
                {r.value}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted text-sm py-12">Loading…</p>
        ) : !stats || stats.days === 0 ? (
          <p className="text-center text-muted text-sm py-12">
            No food logged in the last {range} days.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Daily averages over {stats.days} logged day{stats.days !== 1 ? 's' : ''} in the last {range} days.
            </p>

            {/* Average calories */}
            <div className="bg-surface rounded-2xl p-5 text-center">
              <p className="text-xs text-muted mb-1">Average daily calories</p>
              <p className="text-4xl font-bold">{Math.round(stats.calories)}</p>
              {calorieGoal != null && (
                <p className={`text-sm mt-1 ${stats.calories > calorieGoal ? 'text-danger' : 'text-success'}`}>
                  {stats.calories > calorieGoal
                    ? `${Math.round(stats.calories - calorieGoal)} over`
                    : `${Math.round(calorieGoal - stats.calories)} under`} your {calorieGoal} kcal goal
                </p>
              )}
            </div>

            {/* Macro averages */}
            <MacroRow label="Protein" value={stats.protein} target={proteinTarget} color="#6366f1" />
            <MacroRow label="Carbs" value={stats.carbs} target={carbsTarget} color="#f59e0b" />
            <MacroRow label="Fat" value={stats.fat} target={fatTarget} color="#ec4899" />
          </>
        )}
      </div>
    </div>
  )
}
